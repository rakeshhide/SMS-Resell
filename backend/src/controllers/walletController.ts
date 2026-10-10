import { Request, Response } from 'express';
import { z } from 'zod';
import Razorpay from 'razorpay';
import { randomUUID as uuidv4 } from 'crypto';
import { pool } from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';
import { WalletService } from '../services/walletService';
import { BillingService } from '../services/billingService';
import { verifyRazorpaySignature, verifyWebhookSignature } from '../utils/crypto';

const topupSchema = z.object({
  amount: z.number().min(0.01, 'Top-up amount must be greater than zero').max(1000000, 'Maximum recharge is ₹10,00,000'),
});

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(5),
  razorpayPaymentId: z.string().min(5),
  razorpaySignature: z.string().min(5),
});

export class WalletController {
  private static getRazorpayInstance(): Razorpay {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret || keyId === 'rzp_test_placeholder_key') {
      throw new Error('Payment gateway credentials not configured.');
    }
    return new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  /**
   * GET /api/v1/wallet/balance
   */
  public static async getBalance(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const wallet = await WalletService.getBalance(req.user.id);
      res.json({
        success: true,
        balance: wallet.balance,
        currency: wallet.currency,
        otpRate: wallet.otpRate,
        activeTier: wallet.activeTier,
        tierName: wallet.tierName,
        highestTopup: wallet.highestTopup,
        nextTier: wallet.nextTier,
      });
    } catch (err: any) {
      console.error('[WALLET] Balance query error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to retrieve wallet balance.' });
    }
  }

  /**
   * GET /api/v1/wallet/ledger
   * Immutable ledger entries
   */
  public static async getLedger(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;

      const rowsResult = await pool.query(`
        SELECT id, type, amount, balance_before, balance_after, applicable_rate,
               payment_id, razorpay_order_id, reference_type, reference_id,
               status, description, created_at
        FROM wallet_transactions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `, [req.user.id, limit, offset]);

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM wallet_transactions WHERE user_id = $1',
        [req.user.id]
      );

      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: rowsResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err: any) {
      console.error('[WALLET] Ledger query error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to retrieve wallet transactions.' });
    }
  }

  /**
   * POST /api/v1/wallet/create-order
   * Create Razorpay order server-side with minimum ₹1 validation and 18% GST calculation
   */
  public static async createOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const parsed = topupSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Invalid amount' });
        return;
      }

      const { amount } = parsed.data;
      const settings = await BillingService.getSystemSettings();
      if (amount < settings.minTopup) {
        res.status(400).json({ success: false, message: `Minimum top-up amount is ₹${settings.minTopup}` });
        return;
      }

      const creditAmount = Number(amount.toFixed(2));
      const gstPercentage = settings.defaultGst || 18;
      const gstAmount = Number((creditAmount * (gstPercentage / 100)).toFixed(2));
      const serviceFeePercentage = settings.defaultServiceFee || 3.0; // 3% Service Fee
      const serviceFeeAmount = Number((creditAmount * (serviceFeePercentage / 100)).toFixed(2));
      const totalPayable = Number((creditAmount + gstAmount + serviceFeeAmount).toFixed(2));
      const amountInPaise = Math.round(totalPayable * 100);
      const idempotencyKey = `idemp_${uuidv4()}`;

      // Dynamic tier preview for target amount
      const targetTier = await BillingService.getTierForAmount(creditAmount);

      const razorpay = WalletController.getRazorpayInstance();
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${req.user.id.substring(0, 8)}_${Date.now()}`,
        notes: {
          userId: req.user.id,
          email: req.user.email,
          creditAmount: creditAmount.toString(),
          gstAmount: gstAmount.toString(),
          serviceFeeAmount: serviceFeeAmount.toString(),
          totalPayable: totalPayable.toString(),
          unlockedOtpRate: targetTier.otpPrice.toString(),
        }
      });
      const orderId = order.id;

      // Record pending payment in payments table with separate tax & service fee records
      await pool.query(`
        INSERT INTO payments (
          user_id, razorpay_order_id, amount, credit_amount, gst_amount, service_fee_amount,
          currency, status, idempotency_key, raw_webhook_data
        ) VALUES ($1, $2, $3, $4, $5, $6, 'INR', 'PENDING', $7, $8)
      `, [
        req.user.id,
        orderId,
        totalPayable,
        creditAmount,
        gstAmount,
        serviceFeeAmount,
        idempotencyKey,
        JSON.stringify({ creditAmount, gstAmount, serviceFeeAmount, totalPayable, unlockedRate: targetTier.otpPrice })
      ]);

      res.json({
        success: true,
        orderId,
        creditAmount,
        gstAmount,
        serviceFeeAmount,
        totalPayable,
        amount: totalPayable,
        amountInPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID || '',
        targetTier: {
          id: targetTier.id,
          name: targetTier.name,
          otpPrice: targetTier.otpPrice,
          label: targetTier.label,
        },
      });
    } catch (err: any) {
      console.error('[WALLET] Order creation error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to initialize payment order.' });
    }
  }

  /**
   * POST /api/v1/wallet/verify-payment
   * Server-side cryptographic payment verification with complete idempotency
   */
  public static async verifyPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const parsed = verifyPaymentSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: 'Invalid payment verification payload.' });
        return;
      }

      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

      // Check database payment record
      const payRecord = await pool.query(
        'SELECT * FROM payments WHERE razorpay_order_id = $1 AND user_id = $2',
        [razorpayOrderId, req.user.id]
      );

      if (payRecord.rowCount === 0) {
        res.status(404).json({ success: false, message: 'Associated payment order not found.' });
        return;
      }

      const payment = payRecord.rows[0];

      if (payment.status === 'SUCCESS') {
        const currentWallet = await WalletService.getBalance(req.user.id);
        res.json({
          success: true,
          message: 'Payment has already been processed and credited.',
          balance: currentWallet.balance,
          otpRate: currentWallet.otpRate,
        });
        return;
      }

      const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!razorpaySecret) {
        res.status(500).json({ success: false, message: 'Payment gateway configuration is missing.' });
        return;
      }

      const isValidSignature = verifyRazorpaySignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        razorpaySecret
      );

      if (!isValidSignature) {
        await pool.query(
          "UPDATE payments SET status = 'FAILED', updated_at = NOW() WHERE id = $1",
          [payment.id]
        );
        res.status(400).json({
          success: false,
          message: 'Invalid payment signature verification. Fraudulent request rejected.'
        });
        return;
      }

      // Mark payment SUCCESS in database
      await pool.query(`
        UPDATE payments
        SET razorpay_payment_id = $1, razorpay_signature = $2, status = 'SUCCESS', updated_at = NOW()
        WHERE id = $3
      `, [razorpayPaymentId, razorpaySignature, payment.id]);

      // Credit wallet atomically with immutable ledger
      const creditAmount = payment.credit_amount ? parseFloat(payment.credit_amount) : parseFloat(payment.amount);
      const totalPaid = parseFloat(payment.amount);
      const gstAmount = payment.gst_amount ? parseFloat(payment.gst_amount) : Number((creditAmount * 0.18).toFixed(2));
      const serviceFee = payment.service_fee_amount ? parseFloat(payment.service_fee_amount) : Number((creditAmount * 0.03).toFixed(2));

      const creditResult = await WalletService.creditWalletFromPayment(
        req.user.id,
        creditAmount,
        razorpayPaymentId,
        razorpayOrderId,
        `Wallet top-up: ₹${creditAmount.toFixed(2)} (Total paid: ₹${totalPaid.toFixed(2)} including 18% GST ₹${gstAmount.toFixed(2)} & 3% service fee ₹${serviceFee.toFixed(2)})`
      );

      res.json({
        success: true,
        message: `Payment verified successfully. ₹${creditAmount.toFixed(2)} credited to your wallet.`,
        creditedAmount: creditAmount,
        totalPaid,
        newBalance: creditResult.balanceAfter,
        applicableRate: creditResult.applicableRate,
      });
    } catch (err: any) {
      console.error('[WALLET] Verify payment error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to verify payment.' });
    }
  }

  /**
   * POST /api/v1/wallet/webhook
   * Razorpay server-to-server webhook (Idempotent)
   */
  public static async razorpayWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_test_webhook_secret';

      if (!signature) {
        res.status(400).json({ error: 'Missing webhook signature header' });
        return;
      }

      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const isValid = verifyWebhookSignature(rawBody, signature, secret);

      if (!isValid) {
        console.warn('[WEBHOOK] Rejected unauthenticated webhook dispatch');
        res.status(400).json({ error: 'Invalid webhook signature' });
        return;
      }

      const event = req.body.event;
      if (event === 'payment.captured' || event === 'order.paid') {
        const paymentEntity = req.body.payload?.payment?.entity;
        if (paymentEntity) {
          const orderId = paymentEntity.order_id;
          const paymentId = paymentEntity.id;

          const payRow = await pool.query(
            'SELECT id, user_id, status, amount, credit_amount, gst_amount, service_fee_amount FROM payments WHERE razorpay_order_id = $1',
            [orderId]
          );

          if (payRow.rowCount && payRow.rowCount > 0 && payRow.rows[0].status !== 'SUCCESS') {
            const payment = payRow.rows[0];
            const userId = payment.user_id;
            const creditAmount = payment.credit_amount ? parseFloat(payment.credit_amount) : parseFloat(payment.amount);
            const totalPaid = parseFloat(payment.amount);
            const gstAmount = payment.gst_amount ? parseFloat(payment.gst_amount) : Number((creditAmount * 0.18).toFixed(2));
            const serviceFee = payment.service_fee_amount ? parseFloat(payment.service_fee_amount) : Number((creditAmount * 0.03).toFixed(2));

            await pool.query(`
              UPDATE payments 
              SET razorpay_payment_id = $1, status = 'SUCCESS', updated_at = NOW()
              WHERE id = $2
            `, [paymentId, payment.id]);

            await WalletService.creditWalletFromPayment(
              userId,
              creditAmount,
              paymentId,
              orderId,
              `Wallet top-up: ₹${creditAmount.toFixed(2)} (Total paid: ₹${totalPaid.toFixed(2)} including 18% GST ₹${gstAmount.toFixed(2)} & 3% service fee ₹${serviceFee.toFixed(2)})`
            );
          }
        }
      }

      res.status(200).json({ status: 'ok' });
    } catch (err: any) {
      console.error('[WEBHOOK] Error processing webhook:', err.message);
      res.status(500).json({ error: 'Webhook processing failure' });
    }
  }
}
