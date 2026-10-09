import { Response } from 'express';
import { z } from 'zod';
import { randomUUID as uuidv4 } from 'crypto';
import { pool } from '../config/db';
import { DeveloperApiRequest } from '../middlewares/apiKeyAuthMiddleware';
import { AuthRequest } from '../middlewares/authMiddleware';
import { BillingService } from '../services/billingService';
import { WalletService } from '../services/walletService';
import { SMSProviderFactory } from '../providers/provider.factory';
import { maskPhoneNumber, hashPhoneNumber } from '../utils/crypto';

/**
 * Validates and strictly normalizes a phone number to exactly 10 digits.
 * Rejects numbers with invalid lengths (e.g., 11 digits like 98765432100).
 */
export function validateAndNormalizePhone(rawPhone: string): { isValid: boolean; normalizedPhone: string; error?: string } {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, normalizedPhone: '', error: 'Phone number is required.' };
  }

  const cleaned = rawPhone.trim().replace(/[\s\-\(\)]/g, '');

  if (!/^\+?\d+$/.test(cleaned)) {
    return {
      isValid: false,
      normalizedPhone: '',
      error: 'Phone number must contain only numeric digits.'
    };
  }

  const digitsOnly = cleaned.replace(/\D/g, '');
  let candidate = '';

  // Case 1: Exactly 10 digits
  if (digitsOnly.length === 10) {
    candidate = digitsOnly;
  }
  // Case 2: 12 digits with Indian country code (+91 or 91)
  else if ((cleaned.startsWith('+91') || cleaned.startsWith('91')) && digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    candidate = digitsOnly.slice(2);
  }
  // Case 3: 11 digits with leading 0 (trunk prefix)
  else if (cleaned.startsWith('0') && digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    candidate = digitsOnly.slice(1);
  }
  // Any other length (such as 11 digits starting with 9, e.g. 98765432100) is strictly invalid
  else {
    return {
      isValid: false,
      normalizedPhone: '',
      error: `Invalid phone number length (${digitsOnly.length} digits). Phone number must be exactly 10 digits.`
    };
  }

  // Must be valid Indian mobile range (starts with 6, 7, 8, or 9)
  if (!/^[6-9]\d{9}$/.test(candidate)) {
    return {
      isValid: false,
      normalizedPhone: '',
      error: 'Invalid mobile number. A valid 10-digit Indian mobile number must begin with 6, 7, 8, or 9.'
    };
  }

  return { isValid: true, normalizedPhone: candidate };
}

const sendOtpSchema = z.object({
  phone: z.string()
    .trim()
    .min(1, 'Phone number is required')
    .refine((val) => validateAndNormalizePhone(val).isValid, {
      message: 'Invalid phone number. Must be a valid 10-digit mobile number (e.g. 9876543210).'
    }),
  otp: z.string()
    .trim()
    .min(4, 'OTP code must be at least 4 digits')
    .max(8, 'OTP code cannot exceed 8 digits')
    .regex(/^\d+$/, 'OTP code must contain only numeric digits'),
});

export class OTPController {
  /**
   * Public Developer API: POST /api/v1/otp/send
   * Authenticated via API Key (Bearer sk_live_...)
   */
  public static async sendOTP(req: DeveloperApiRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      if (!req.apiUserId || !req.apiKeyId) {
        res.status(401).json({
          success: false,
          error_code: 'UNAUTHORIZED',
          message: 'Valid API Key required.'
        });
        return;
      }

      const parsed = sendOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error_code: 'VALIDATION_FAILED',
          message: parsed.error.issues[0]?.message || 'Invalid input data'
        });
        return;
      }

      const { phone, otp } = parsed.data;

      // Strict phone validation and normalization without blind slicing
      const phoneValidation = validateAndNormalizePhone(phone);
      if (!phoneValidation.isValid) {
        res.status(400).json({
          success: false,
          error_code: 'INVALID_PHONE_NUMBER',
          message: phoneValidation.error || 'Please provide a valid 10-digit mobile number.'
        });
        return;
      }

      const standardPhone = phoneValidation.normalizedPhone;

      const maskedPhone = maskPhoneNumber(standardPhone);
      const phoneHash = hashPhoneNumber(standardPhone);

      // 1. Calculate user-specific tiered volume rate
      const userPricing = await BillingService.getUserRate(req.apiUserId);
      const totalCost = userPricing.otpRate;
      const txnRefId = `TXN_${Date.now()}_${uuidv4().substring(0, 8)}`;

      // 2. Perform atomic wallet deduction with row-level locking
      const deduction = await WalletService.deductBalanceForOTP(
        req.apiUserId,
        totalCost,
        txnRefId,
        `OTP dispatch to ${maskedPhone} (${userPricing.tierName} @ ₹${totalCost.toFixed(2)})`
      );

      if (!deduction.success) {
        res.status(402).json({
          success: false,
          error_code: 'INSUFFICIENT_FUNDS',
          message: deduction.error || 'Insufficient wallet balance. Please add funds to your account.'
        });
        return;
      }

      // 3. Dispatch to SMS Gateway via abstraction layer
      const provider = SMSProviderFactory.getProvider();
      const providerResult = await provider.sendOTP({
        phone: standardPhone,
        otp: otp,
      });

      // 4. Handle provider delivery response
      if (!providerResult.success) {
        // Automatic refund reversal
        await WalletService.refundBalanceForOTP(
          req.apiUserId,
          totalCost,
          txnRefId,
          providerResult.message
        );

        // Record failed transaction in audit table
        await pool.query(`
          INSERT INTO otp_transactions (
            user_id, api_key_id, phone_masked, phone_hash, cost_incurred, gst_amount,
            service_fee, total_charged, provider_name, provider_ref_id, status,
            error_message, delivery_code
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'FAILED', $11, $12)
        `, [
          req.apiUserId,
          req.apiKeyId,
          maskedPhone,
          phoneHash,
          0.4500, // Provider base cost
          0.0000,
          Number((totalCost - 0.4500).toFixed(4)), // Gross margin
          totalCost,
          provider.name,
          providerResult.providerRefId,
          providerResult.message,
          providerResult.statusCode
        ]);

        const isMaintenance = providerResult.statusCode === 'PROVIDER_BALANCE_EXHAUSTED';

        res.status(502).json({
          success: false,
          error_code: isMaintenance ? 'ROUTE_MAINTENANCE' : 'DELIVERY_FAILED',
          message: isMaintenance ? providerResult.message : 'Carrier route failed to accept message. Transaction reversed and balance refunded.',
          transaction_id: txnRefId
        });
        return;
      }

      // 5. Successful dispatch: Record persistent transaction
      await pool.query(`
        INSERT INTO otp_transactions (
          user_id, api_key_id, phone_masked, phone_hash, cost_incurred, gst_amount,
          service_fee, total_charged, provider_name, provider_ref_id, status,
          delivery_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'DELIVERED', $11)
      `, [
        req.apiUserId,
        req.apiKeyId,
        maskedPhone,
        phoneHash,
        0.4500, // Provider base cost
        0.0000,
        Number((totalCost - 0.4500).toFixed(4)), // Gross margin
        totalCost,
        provider.name,
        providerResult.providerRefId,
        providerResult.statusCode
      ]);

      const executionDurationMs = Date.now() - startTime;

      res.status(200).json({
        success: true,
        message: 'OTP request accepted and dispatched to carrier network.',
        transaction_id: txnRefId,
        recipient: maskedPhone,
        latency_ms: executionDurationMs
      });
    } catch (err: any) {
      console.error('[OTP_CONTROLLER] Unexpected dispatch error:', err.message);
      res.status(500).json({
        success: false,
        error_code: 'INTERNAL_SERVER_ERROR',
        message: 'An internal error occurred while processing the request.'
      });
    }
  }

  /**
   * Dashboard API: GET /api/v1/otp/transactions
   * Authenticated via User Session JWT
   */
  public static async listTransactions(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;
      const statusFilter = req.query.status as string;
      const search = req.query.search as string;

      let queryText = `
        SELECT 
          t.id, t.phone_masked, t.total_charged, t.status, t.delivery_code,
          t.provider_ref_id, t.created_at,
          k.name as api_key_name, k.key_prefix
        FROM otp_transactions t
        LEFT JOIN api_keys k ON t.api_key_id = k.id
        WHERE t.user_id = $1
      `;
      const queryParams: any[] = [req.user.id];
      let paramIdx = 2;

      if (statusFilter && statusFilter !== 'ALL') {
        queryText += ` AND t.status = $${paramIdx}`;
        queryParams.push(statusFilter);
        paramIdx++;
      }

      if (search) {
        queryText += ` AND (t.phone_masked LIKE $${paramIdx} OR t.delivery_code LIKE $${paramIdx})`;
        queryParams.push(`%${search}%`);
        paramIdx++;
      }

      queryText += ` ORDER BY t.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
      queryParams.push(limit, offset);

      const rowsResult = await pool.query(queryText, queryParams);

      // Count query
      let countText = 'SELECT COUNT(*) FROM otp_transactions WHERE user_id = $1';
      const countParams: any[] = [req.user.id];
      let countIdx = 2;
      if (statusFilter && statusFilter !== 'ALL') {
        countText += ` AND status = $${countIdx}`;
        countParams.push(statusFilter);
        countIdx++;
      }
      if (search) {
        countText += ` AND (phone_masked LIKE $${countIdx} OR delivery_code LIKE $${countIdx})`;
        countParams.push(`%${search}%`);
        countIdx++;
      }

      const countResult = await pool.query(countText, countParams);
      const totalCount = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: rowsResult.rows,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        }
      });
    } catch (err: any) {
      console.error('[OTP_CONTROLLER] Transaction query error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to retrieve transactions.' });
    }
  }

  /**
   * Analytics summary for customer dashboard
   */
  public static async getAnalyticsSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const userId = req.user.id;

      // Aggregate counts
      const countsRes = await pool.query(`
        SELECT
          COUNT(*) as total_sent,
          COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered,
          COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
          COALESCE(SUM(total_charged), 0) as total_spent,
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_sent,
          COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as month_sent
        FROM otp_transactions
        WHERE user_id = $1
      `, [userId]);

      // Daily 7-day trend
      const trendRes = await pool.query(`
        SELECT 
          TO_CHAR(d.day, 'YYYY-MM-DD') as date_label,
          COUNT(t.id) as count,
          COUNT(CASE WHEN t.status = 'DELIVERED' THEN 1 END) as success_count
        FROM generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        ) d(day)
        LEFT JOIN otp_transactions t 
          ON DATE(t.created_at) = DATE(d.day) AND t.user_id = $1
        GROUP BY d.day
        ORDER BY d.day ASC
      `, [userId]);

      res.json({
        success: true,
        stats: countsRes.rows[0],
        trend: trendRes.rows,
      });
    } catch (err: any) {
      console.error('[OTP_CONTROLLER] Analytics error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to compute analytics.' });
    }
  }
}
