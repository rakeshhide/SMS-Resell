import { pool } from '../config/db';
import { PoolClient } from 'pg';
import { BillingService } from './billingService';
import { NotificationService } from './notificationService';

export interface DeductResult {
  success: boolean;
  walletId: string;
  balanceBefore: number;
  balanceAfter: number;
  error?: string;
}

export class WalletService {
  /**
   * Get current wallet balance, active rate, and tier progression for a user
   */
  public static async getBalance(userId: string): Promise<{
    balance: number;
    currency: string;
    otpRate: number;
    activeTier: string;
    tierName: string;
    highestTopup: number;
    nextTier: {
      otpPrice: number;
      minTopup: number;
      amountRequired: number;
      progressPercentage: number;
      tierName: string;
    } | null;
  }> {
    let res = await pool.query(
      'SELECT id, balance, currency, otp_rate, active_tier, highest_topup FROM wallets WHERE user_id = $1',
      [userId]
    );

    if (res.rowCount === 0) {
      // Auto-initialize wallet if missing
      res = await pool.query(
        'INSERT INTO wallets (user_id, balance, currency, otp_rate, active_tier) VALUES ($1, 0.0000, $2, 0.7500, \'TIER_1\') RETURNING id, balance, currency, otp_rate, active_tier, highest_topup',
        [userId, 'INR']
      );
    }

    const row = res.rows[0];
    const userRateInfo = await BillingService.getUserRate(userId);

    return {
      balance: parseFloat(row.balance),
      currency: row.currency,
      otpRate: userRateInfo.otpRate,
      activeTier: userRateInfo.activeTier,
      tierName: userRateInfo.tierName,
      highestTopup: userRateInfo.highestTopup,
      nextTier: userRateInfo.nextTier,
    };
  }

  /**
   * Deduct amount atomically with row-level lock (FOR UPDATE)
   * Prevents race conditions and double-spending across concurrent API dispatches
   */
  public static async deductBalanceForOTP(
    userId: string,
    amount: number,
    referenceId: string,
    description: string
  ): Promise<DeductResult> {
    const client: PoolClient = await pool.connect();
    try {
      await client.query('BEGIN');

      // Row-level lock ensures strict atomicity
      const walletRes = await client.query(
        'SELECT id, balance, otp_rate FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );

      if (walletRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return { success: false, walletId: '', balanceBefore: 0, balanceAfter: 0, error: 'Wallet not found' };
      }

      const wallet = walletRes.rows[0];
      const balanceBefore = parseFloat(wallet.balance);
      const currentRate = parseFloat(wallet.otp_rate) || amount;

      if (balanceBefore < amount) {
        await client.query('ROLLBACK');
        return {
          success: false,
          walletId: wallet.id,
          balanceBefore,
          balanceAfter: balanceBefore,
          error: 'Insufficient wallet balance. Please add funds to your account.'
        };
      }

      const balanceAfter = Number((balanceBefore - amount).toFixed(4));

      // Update wallet balance
      await client.query(
        'UPDATE wallets SET balance = $1, version = version + 1, updated_at = NOW() WHERE id = $2',
        [balanceAfter, wallet.id]
      );

      // Record immutable ledger entry
      await client.query(`
        INSERT INTO wallet_transactions (
          wallet_id, user_id, type, amount, balance_before, balance_after,
          applicable_rate, reference_type, reference_id, status, description
        ) VALUES ($1, $2, 'OTP_DEBIT', $3, $4, $5, $6, 'OTP_DEDUCTION', $7, 'COMPLETED', $8)
      `, [wallet.id, userId, amount, balanceBefore, balanceAfter, currentRate, referenceId, description]);

      await client.query('COMMIT');

      // Low balance warning notification trigger
      if (balanceAfter < 50 && balanceBefore >= 50) {
        NotificationService.createNotification({
          userId,
          title: 'Low Balance Warning',
          message: `Your balance is now ₹${balanceAfter.toFixed(2)}. Top up to maintain continuous OTP dispatch.`,
          type: 'warning',
          actionLabel: 'Add Funds',
          actionUrl: '/wallet'
        }).catch((err) => console.error('[NOTIFICATION] Failed to create low balance notice:', err.message));
      }

      return {
        success: true,
        walletId: wallet.id,
        balanceBefore,
        balanceAfter,
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[WALLET_SERVICE] Atomic deduction failed:', err.message);
      return { success: false, walletId: '', balanceBefore: 0, balanceAfter: 0, error: err.message };
    } finally {
      client.release();
    }
  }

  /**
   * Reversal / Refund amount in case upstream provider failed to dispatch
   */
  public static async refundBalanceForOTP(
    userId: string,
    amount: number,
    referenceId: string,
    reason: string
  ): Promise<void> {
    const client: PoolClient = await pool.connect();
    try {
      await client.query('BEGIN');

      const walletRes = await client.query(
        'SELECT id, balance, otp_rate FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );

      if (walletRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return;
      }

      const wallet = walletRes.rows[0];
      const balanceBefore = parseFloat(wallet.balance);
      const currentRate = parseFloat(wallet.otp_rate) || 0.75;
      const balanceAfter = Number((balanceBefore + amount).toFixed(4));

      await client.query(
        'UPDATE wallets SET balance = $1, version = version + 1, updated_at = NOW() WHERE id = $2',
        [balanceAfter, wallet.id]
      );

      // Record immutable ledger reversal
      await client.query(`
        INSERT INTO wallet_transactions (
          wallet_id, user_id, type, amount, balance_before, balance_after,
          applicable_rate, reference_type, reference_id, status, description
        ) VALUES ($1, $2, 'REFUND', $3, $4, $5, $6, 'OTP_REFUND', $7, 'COMPLETED', $8)
      `, [wallet.id, userId, amount, balanceBefore, balanceAfter, currentRate, referenceId, `Carrier route reversal: ${reason}`]);

      await client.query('COMMIT');
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[WALLET_SERVICE] Reversal failed:', err.message);
    } finally {
      client.release();
    }
  }

  /**
   * Credit balance from verified payment (Strictly Idempotent)
   */
  public static async creditWalletFromPayment(
    userId: string,
    creditAmount: number,
    paymentId: string,
    orderId: string,
    description: string
  ): Promise<{ success: boolean; balanceAfter: number; applicableRate: number }> {
    const client: PoolClient = await pool.connect();
    try {
      await client.query('BEGIN');

      // Idempotency check: has this payment ID or order already been credited?
      const existingTx = await client.query(`
        SELECT id FROM wallet_transactions 
        WHERE payment_id = $1 OR (reference_id = $1 AND reference_type = 'PAYMENT')
      `, [paymentId]);

      if (existingTx.rowCount && existingTx.rowCount > 0) {
        await client.query('ROLLBACK');
        console.warn(`[WALLET_SERVICE] Idempotency prevented duplicate credit for payment: ${paymentId}`);
        const currentBal = await this.getBalance(userId);
        return { success: true, balanceAfter: currentBal.balance, applicableRate: currentBal.otpRate };
      }

      const walletRes = await client.query(
        'SELECT id, balance, otp_rate, active_tier, highest_topup FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );

      let walletId: string;
      let balanceBefore = 0;
      let currentRate = 0.75;
      let activeTier = 'TIER_1';

      if (walletRes.rowCount === 0) {
        const newWallet = await client.query(
          'INSERT INTO wallets (user_id, balance, currency, otp_rate, active_tier, highest_topup) VALUES ($1, 0.0000, $2, 0.7500, \'TIER_1\', $3) RETURNING id',
          [userId, 'INR', creditAmount]
        );
        walletId = newWallet.rows[0].id;
      } else {
        walletId = walletRes.rows[0].id;
        balanceBefore = parseFloat(walletRes.rows[0].balance);
        currentRate = parseFloat(walletRes.rows[0].otp_rate) || 0.75;
        activeTier = walletRes.rows[0].active_tier || 'TIER_1';
      }

      const balanceAfter = Number((balanceBefore + creditAmount).toFixed(4));
      
      // Look up unlocked tier based on purchased credit amount
      const unlockedTier = await BillingService.getTierForAmount(creditAmount);
      // Best rate retention: user retains whatever lower rate they unlocked
      const newOtpRate = Math.min(currentRate, unlockedTier.otpPrice);
      const newActiveTier = newOtpRate === unlockedTier.otpPrice ? unlockedTier.id : activeTier;

      // Update wallet balance, unlocked rate, and highest top-up
      await client.query(`
        UPDATE wallets 
        SET balance = $1, otp_rate = $2, active_tier = $3, highest_topup = GREATEST(highest_topup, $4), version = version + 1, updated_at = NOW()
        WHERE id = $5
      `, [balanceAfter, newOtpRate, newActiveTier, creditAmount, walletId]);

      // Record immutable ledger entry with TOPUP type and full audit metadata
      await client.query(`
        INSERT INTO wallet_transactions (
          wallet_id, user_id, type, amount, balance_before, balance_after,
          applicable_rate, payment_id, razorpay_order_id, reference_type, reference_id, status, description
        ) VALUES ($1, $2, 'TOPUP', $3, $4, $5, $6, $7, $8, 'PAYMENT', $7, 'COMPLETED', $9)
      `, [walletId, userId, creditAmount, balanceBefore, balanceAfter, newOtpRate, paymentId, orderId, description]);

      await client.query('COMMIT');

      // Server-side dynamic notification for wallet top-up
      NotificationService.createNotification({
        userId,
        title: 'Wallet Recharged Successfully',
        message: `₹${creditAmount.toFixed(2)} credited to your wallet. Unlocked route rate: ₹${newOtpRate.toFixed(2)}/OTP.`,
        type: 'wallet',
        actionLabel: 'View Ledger',
        actionUrl: '/wallet',
        metadata: { paymentId, orderId, creditAmount, balanceAfter }
      }).catch((err) => console.error('[NOTIFICATION] Failed to create wallet credit notice:', err.message));

      return { success: true, balanceAfter, applicableRate: newOtpRate };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[WALLET_SERVICE] Payment credit failed:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Manual admin adjustment (Requires mandatory audit reason)
   */
  public static async adminAdjustBalance(
    adminUserId: string,
    targetUserId: string,
    adjustmentAmount: number,
    reason: string
  ): Promise<{ success: boolean; newBalance: number }> {
    if (!reason || reason.trim().length < 5) {
      throw new Error('Mandatory adjustment audit reason required (minimum 5 characters)');
    }

    const client: PoolClient = await pool.connect();
    try {
      await client.query('BEGIN');

      const walletRes = await client.query(
        'SELECT id, balance, otp_rate FROM wallets WHERE user_id = $1 FOR UPDATE',
        [targetUserId]
      );

      if (walletRes.rowCount === 0) {
        throw new Error('Target user wallet not found');
      }

      const wallet = walletRes.rows[0];
      const balanceBefore = parseFloat(wallet.balance);
      const balanceAfter = Number((balanceBefore + adjustmentAmount).toFixed(4));
      const currentRate = parseFloat(wallet.otp_rate) || 0.75;

      if (balanceAfter < 0) {
        throw new Error('Adjustment would result in negative wallet balance');
      }

      await client.query(
        'UPDATE wallets SET balance = $1, version = version + 1, updated_at = NOW() WHERE id = $2',
        [balanceAfter, wallet.id]
      );

      const refId = `ADJ_${Date.now()}`;
      const txType = adjustmentAmount >= 0 ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT';

      await client.query(`
        INSERT INTO wallet_transactions (
          wallet_id, user_id, type, amount, balance_before, balance_after,
          applicable_rate, reference_type, reference_id, status, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ADMIN_ADJUSTMENT', $8, 'COMPLETED', $9)
      `, [wallet.id, targetUserId, txType, Math.abs(adjustmentAmount), balanceBefore, balanceAfter, currentRate, refId, `Admin Adjustment: ${reason}`]);

      // Record in audit log
      await client.query(`
        INSERT INTO audit_logs (actor_id, action, target_type, target_id, reason, metadata)
        VALUES ($1, 'MANUAL_WALLET_ADJUSTMENT', 'wallet', $2, $3, $4)
      `, [
        adminUserId,
        wallet.id,
        reason,
        JSON.stringify({ adjustmentAmount, balanceBefore, balanceAfter, referenceId: refId })
      ]);

      await client.query('COMMIT');

      // Server-side dynamic notification for admin adjustment
      NotificationService.createNotification({
        userId: targetUserId,
        title: adjustmentAmount >= 0 ? 'Wallet Credited by Admin' : 'Wallet Adjusted by Admin',
        message: `Your wallet was adjusted by ₹${Math.abs(adjustmentAmount).toFixed(2)}. Reason: ${reason}`,
        type: 'wallet',
        actionLabel: 'View Ledger',
        actionUrl: '/wallet'
      }).catch((err) => console.error('[NOTIFICATION] Failed to create admin adjustment notice:', err.message));

      return { success: true, newBalance: balanceAfter };
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
