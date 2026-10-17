import { Response } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { pool } from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';
import { WalletService } from '../services/walletService';
import { BillingService } from '../services/billingService';
import { EmailService } from '../services/emailService';
import { Fast2smsBalanceChecker } from '../services/fast2smsBalanceChecker';

const updatePricingSchema = z.object({
  providerBaseCost: z.number().min(0.01),
  gstPercentage: z.number().min(0).max(50),
  serviceChargePercentage: z.number().min(0).max(50),
});

const manualAdjustmentSchema = z.object({
  targetUserId: z.string().uuid(),
  amount: z.number(), // positive to credit, negative to debit
  reason: z.string().min(5, 'Mandatory audit reason must be at least 5 characters'),
});

export class AdminController {
  /**
   * Platform Overview Metrics
   */
  public static async getOverview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usersCountRes = await pool.query('SELECT COUNT(*) FROM users');
      const walletsTotalRes = await pool.query('SELECT COALESCE(SUM(balance), 0) as total_balance FROM wallets');
      
      const otpMetricsRes = await pool.query(`
        SELECT 
          COUNT(*) as total_otps,
          COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered,
          COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
          COALESCE(SUM(total_charged), 0) as gross_revenue,
          COALESCE(SUM(cost_incurred), 0) as provider_expense,
          COALESCE(SUM(gst_amount), 0) as gst_collected,
          COALESCE(SUM(service_fee), 0) as net_service_margin
        FROM otp_transactions
      `);

      // Calculate total outstanding OTP capacity across ALL accounts according to their balance (0.45 * all account otp)
      const accountOtpsRes = await pool.query(`
        SELECT 
          COALESCE(SUM(w.balance / COALESCE(NULLIF(w.otp_rate, 0), 0.75)), 0) as total_otp_capacity,
          COALESCE(SUM(FLOOR(w.balance / COALESCE(NULLIF(w.otp_rate, 0), 0.75))), 0)::BIGINT as floor_account_otps,
          COALESCE(SUM(w.balance), 0) as total_account_balance
        FROM wallets w
        JOIN users u ON u.id = w.user_id
      `);
      
      const totalCapacity = parseFloat(accountOtpsRes.rows[0].total_otp_capacity || '0');
      const totalAccountOtps = Math.round(totalCapacity);
      const totalAccountBalance = parseFloat(accountOtpsRes.rows[0].total_account_balance || '0');
      const requiredFast2smsBalance = parseFloat((totalAccountOtps * 0.45).toFixed(2));

      // Attempt to fetch live Fast2SMS balance
      let fast2smsLiveBalance: number | null = null;
      let fast2smsSmsCount: number | null = null;
      try {
        const apiKey = process.env.FAST2SMS_API_KEY;
        if (apiKey) {
          const f2sRes = await axios.get('https://www.fast2sms.com/dev/wallet', {
            headers: { authorization: apiKey },
            timeout: 4000
          });
          if (f2sRes.data?.return && f2sRes.data?.wallet !== undefined) {
            fast2smsLiveBalance = parseFloat(f2sRes.data.wallet);
            fast2smsSmsCount = f2sRes.data.sms_count ? parseInt(f2sRes.data.sms_count) : null;
          }
        }
      } catch (err: any) {
        console.warn('[ADMIN] Fast2SMS live balance query warning:', err.message);
      }

      const pricing = await BillingService.getActivePricing();

      const isFloatSufficient = fast2smsLiveBalance !== null ? fast2smsLiveBalance >= requiredFast2smsBalance : true;
      const floatDeficit = fast2smsLiveBalance !== null ? Math.max(0, parseFloat((requiredFast2smsBalance - fast2smsLiveBalance).toFixed(2))) : 0;

      // If Fast2SMS balance is insufficient to cover all user account balances, trigger alert email to kumarsinghrakesh333@gmail.com
      if (!isFloatSufficient && fast2smsLiveBalance !== null) {
        try {
          // On Vercel serverless, asynchronous operations must be awaited before res.json()
          await EmailService.sendFast2smsBalanceAlert({
            requiredBalance: requiredFast2smsBalance,
            liveBalance: fast2smsLiveBalance,
            deficit: floatDeficit,
            totalAccountOtps,
            reason: 'FLOAT_DEFICIT'
          });
        } catch (err: any) {
          console.error('[ADMIN] Failed to dispatch Fast2SMS alert email:', err.message);
        }
      }

      res.json({
        success: true,
        stats: {
          totalUsers: parseInt(usersCountRes.rows[0].count),
          circulatingWalletBalance: parseFloat(walletsTotalRes.rows[0].total_balance),
          totalOtpsSent: parseInt(otpMetricsRes.rows[0].total_otps),
          deliveredOtps: parseInt(otpMetricsRes.rows[0].delivered),
          failedOtps: parseInt(otpMetricsRes.rows[0].failed),
          grossRevenue: parseFloat(otpMetricsRes.rows[0].gross_revenue),
          providerExpense: parseFloat(otpMetricsRes.rows[0].provider_expense),
          gstCollected: parseFloat(otpMetricsRes.rows[0].gst_collected),
          netServiceMargin: parseFloat(otpMetricsRes.rows[0].net_service_margin),
          activePricing: pricing,
          fast2sms: {
            perOtpCost: 0.45,
            totalAccountOtps,
            requiredWalletBalance: requiredFast2smsBalance,
            liveWalletBalance: fast2smsLiveBalance,
            liveSmsCount: fast2smsSmsCount,
            isFloatSufficient,
            floatDeficit
          }
        }
      });
    } catch (err: any) {
      console.error('[ADMIN] Overview metrics error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to retrieve admin stats.' });
    }
  }

  /**
   * List Users with wallets and status
   */
  public static async listUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;
      const search = req.query.search as string;

      let queryText = `
        SELECT u.id, u.email, u.full_name, u.company_name, u.role, u.status, u.created_at,
               COALESCE(w.balance, 0) as balance, w.currency,
               COALESCE(w.otp_rate, (SELECT otp_price FROM pricing_tiers WHERE is_active = true ORDER BY min_topup ASC LIMIT 1), 0.8000) as otp_rate,
               COALESCE(w.active_tier, 'Starter Tier') as active_tier,
               COALESCE(pt.min_topup, 1.00) as tier_min_topup,
               COALESCE(pt.max_topup, NULL) as tier_max_topup
        FROM users u
        LEFT JOIN wallets w ON u.id = w.user_id
        LEFT JOIN pricing_tiers pt ON pt.id::text = w.active_tier::text
        WHERE 1=1
      `;
      const params: any[] = [];
      let idx = 1;

      if (search) {
        queryText += ` AND (u.email ILIKE $${idx} OR u.full_name ILIKE $${idx})`;
        params.push(`%${search}%`);
        idx++;
      }

      queryText += ` ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
      params.push(limit, offset);

      const rowsRes = await pool.query(queryText, params);
      const countRes = await pool.query('SELECT COUNT(*) FROM users');

      // Map tier name nicely
      const usersWithTiers = rowsRes.rows.map(u => {
        const rate = parseFloat(u.otp_rate) || 0.80;
        let tierName = 'Starter Tier';
        const minTop = parseFloat(u.tier_min_topup) || 0;
        if (minTop >= 10000) tierName = 'Enterprise Tier';
        else if (minTop >= 5000) tierName = 'Business Tier';
        else if (minTop >= 2000) tierName = 'Scale Tier';
        else if (minTop >= 500) tierName = 'Growth Tier';
        else tierName = 'Starter Tier';

        return {
          ...u,
          tier_name: tierName,
          otp_rate: rate,
        };
      });

      res.json({
        success: true,
        users: usersWithTiers,
        total: parseInt(countRes.rows[0].count),
      });
    } catch (err: any) {
      console.error('[ADMIN] List users error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
    }
  }

  /**
   * Suspend or Activate user
   */
  public static async toggleUserStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId, status } = req.body;
      if (!userId || !['active', 'suspended'].includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid user status parameter' });
        return;
      }

      const resUpdate = await pool.query(`
        UPDATE users
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, email, status
      `, [status, userId]);

      if (resUpdate.rowCount === 0) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Log in audit log
      await pool.query(`
        INSERT INTO audit_logs (actor_id, action, target_type, target_id, reason)
        VALUES ($1, 'USER_STATUS_UPDATE', 'user', $2, $3)
      `, [req.user?.id, userId, `Status changed to ${status}`]);

      res.json({
        success: true,
        message: `User status changed to ${status}`,
        user: resUpdate.rows[0]
      });
    } catch (err: any) {
      console.error('[ADMIN] Toggle status error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to update user status.' });
    }
  }

  /**
   * Get active pricing rules
   */
  public static async getPricing(req: AuthRequest, res: Response): Promise<void> {
    try {
      const pricing = await BillingService.getActivePricing();
      res.json({ success: true, pricing });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to load pricing.' });
    }
  }

  /**
   * Update pricing rules
   */
  public static async updatePricing(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parsed = updatePricingSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Invalid input' });
        return;
      }

      const { providerBaseCost, gstPercentage, serviceChargePercentage } = parsed.data;

      await pool.query(`
        INSERT INTO pricing_rules (
          provider_base_cost, gst_percentage, service_charge_percentage, is_active, updated_by
        ) VALUES ($1, $2, $3, TRUE, $4)
      `, [providerBaseCost, gstPercentage, serviceChargePercentage, req.user?.id]);

      BillingService.invalidateCache();

      // Audit log
      await pool.query(`
        INSERT INTO audit_logs (actor_id, action, target_type, target_id, reason, metadata)
        VALUES ($1, 'UPDATE_PRICING_RULES', 'pricing', 'active', 'Admin changed billing formula', $2)
      `, [
        req.user?.id,
        JSON.stringify({ providerBaseCost, gstPercentage, serviceChargePercentage })
      ]);

      const updated = await BillingService.getActivePricing();
      res.json({
        success: true,
        message: 'Pricing rules updated successfully.',
        pricing: updated
      });
    } catch (err: any) {
      console.error('[ADMIN] Update pricing error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to update pricing.' });
    }
  }

  /**
   * Manual wallet adjustment with mandatory audit log
   */
  public static async manualAdjustment(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const parsed = manualAdjustmentSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Invalid data' });
        return;
      }

      const { targetUserId, amount, reason } = parsed.data;

      const result = await WalletService.adminAdjustBalance(
        req.user.id,
        targetUserId,
        amount,
        reason
      );

      res.json({
        success: true,
        message: `Successfully adjusted balance by ${amount > 0 ? '+' : ''}₹${amount.toFixed(2)}.`,
        newBalance: result.newBalance
      });
    } catch (err: any) {
      console.error('[ADMIN] Manual adjustment error:', err.message);
      res.status(400).json({ success: false, message: err.message || 'Adjustment failed.' });
    }
  }

  /**
   * List all pricing tiers (Admin)
   */
  public static async listPricingTiers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tiers = await BillingService.getAllTiersAdmin();
      const settings = await BillingService.getSystemSettings();
      res.json({ success: true, tiers, settings });
    } catch (err: any) {
      console.error('[ADMIN] List pricing tiers error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to load pricing tiers.' });
    }
  }

  /**
   * Create a new pricing tier (Admin)
   */
  public static async createPricingTier(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { minTopup, maxTopup, otpPrice, gstPercentage, isActive } = req.body;
      if (minTopup === undefined || otpPrice === undefined) {
        res.status(400).json({ success: false, message: 'minTopup and otpPrice are required.' });
        return;
      }

      const tier = await BillingService.createTier({
        minTopup: Number(minTopup),
        maxTopup: maxTopup !== undefined && maxTopup !== null ? Number(maxTopup) : null,
        otpPrice: Number(otpPrice),
        gstPercentage: gstPercentage !== undefined ? Number(gstPercentage) : 18.00,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      });

      await pool.query(`
        INSERT INTO audit_logs (actor_id, action, target_type, target_id, reason, metadata)
        VALUES ($1, 'CREATE_PRICING_TIER', 'pricing_tier', $2, 'Admin added pricing tier', $3)
      `, [req.user?.id, tier.id, JSON.stringify(tier)]);

      res.status(201).json({ success: true, message: 'Pricing tier created successfully.', tier });
    } catch (err: any) {
      console.error('[ADMIN] Create tier error:', err.message);
      res.status(500).json({ success: false, message: err.message || 'Failed to create pricing tier.' });
    }
  }

  /**
   * Update an existing pricing tier (Admin)
   */
  public static async updatePricingTier(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { minTopup, maxTopup, otpPrice, gstPercentage, isActive } = req.body;

      const updated = await BillingService.updateTier(id, {
        minTopup: Number(minTopup),
        maxTopup: maxTopup !== undefined && maxTopup !== null ? Number(maxTopup) : null,
        otpPrice: Number(otpPrice),
        gstPercentage: Number(gstPercentage ?? 18),
        isActive: Boolean(isActive),
      });

      await pool.query(`
        INSERT INTO audit_logs (actor_id, action, target_type, target_id, reason, metadata)
        VALUES ($1, 'UPDATE_PRICING_TIER', 'pricing_tier', $2, 'Admin updated pricing tier', $3)
      `, [req.user?.id, id, JSON.stringify(updated)]);

      res.json({ success: true, message: 'Pricing tier updated successfully.', tier: updated });
    } catch (err: any) {
      console.error('[ADMIN] Update tier error:', err.message);
      res.status(500).json({ success: false, message: err.message || 'Failed to update pricing tier.' });
    }
  }

  /**
   * Delete a pricing tier (Admin)
   */
  public static async deletePricingTier(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await BillingService.deleteTier(id);

      await pool.query(`
        INSERT INTO audit_logs (actor_id, action, target_type, target_id, reason)
        VALUES ($1, 'DELETE_PRICING_TIER', 'pricing_tier', $2, 'Admin deleted pricing tier')
      `, [req.user?.id, id]);

      res.json({ success: true, message: 'Pricing tier removed.' });
    } catch (err: any) {
      console.error('[ADMIN] Delete tier error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to delete pricing tier.' });
    }
  }

  /**
   * Toggle tier active/inactive status (Admin)
   */
  public static async togglePricingTier(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { isActive } = req.body;

      await BillingService.toggleTier(id, Boolean(isActive));

      await pool.query(`
        INSERT INTO audit_logs (actor_id, action, target_type, target_id, reason)
        VALUES ($1, 'TOGGLE_PRICING_TIER', 'pricing_tier', $2, $3)
      `, [req.user?.id, id, `Status set to ${isActive ? 'active' : 'inactive'}`]);

      res.json({ success: true, message: `Tier set to ${isActive ? 'active' : 'inactive'}.` });
    } catch (err: any) {
      console.error('[ADMIN] Toggle tier error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to toggle tier.' });
    }
  }

  /**
   * Get system settings (Admin)
   */
  public static async getSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const settings = await BillingService.getSystemSettings();
      res.json({ success: true, settings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to retrieve settings.' });
    }
  }

  /**
   * Update system settings (Admin)
   */
  public static async updateSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { minTopup, defaultGst, defaultServiceFee } = req.body;
      if (minTopup !== undefined) {
        await BillingService.updateSetting('min_topup_amount', Number(minTopup).toFixed(2));
      }
      if (defaultGst !== undefined) {
        await BillingService.updateSetting('default_gst_percentage', Number(defaultGst).toFixed(2));
      }
      if (defaultServiceFee !== undefined) {
        await BillingService.updateSetting('default_service_fee_percentage', Number(defaultServiceFee).toFixed(2));
      }

      await pool.query(`
        INSERT INTO audit_logs (actor_id, action, target_type, target_id, reason, metadata)
        VALUES ($1, 'UPDATE_SYSTEM_SETTINGS', 'system', 'settings', 'Admin updated platform settings', $2)
      `, [req.user?.id, JSON.stringify({ minTopup, defaultGst, defaultServiceFee })]);

      const updated = await BillingService.getSystemSettings();
      res.json({ success: true, message: 'Platform settings updated successfully.', settings: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update settings.' });
    }
  }

  /**
   * Get platform audit logs
   */
  public static async getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await pool.query(`
        SELECT a.id, a.action, a.target_type, a.target_id, a.reason, a.metadata, a.created_at,
               u.email as actor_email, u.full_name as actor_name
        FROM audit_logs a
        LEFT JOIN users u ON a.actor_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 50
      `);

      res.json({
        success: true,
        logs: result.rows
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
    }
  }

  /**
   * Set user pricing tier status and custom OTP rate (Admin)
   */
  public static async setUserTier(req: AuthRequest, res: Response): Promise<void> {
    const client = await pool.connect();
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { userId, tierId, otpRate, reason } = req.body;
      if (!userId) {
        res.status(400).json({ success: false, message: 'User ID is required.' });
        return;
      }

      if (otpRate === undefined || isNaN(parseFloat(otpRate)) || parseFloat(otpRate) <= 0) {
        res.status(400).json({ success: false, message: 'Valid OTP rate is required.' });
        return;
      }

      await client.query('BEGIN');

      const walletRes = await client.query(
        'SELECT id, balance, otp_rate, active_tier FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );

      let walletId: string;
      const parsedRate = parseFloat(otpRate);
      const assignedTier = tierId || 'CUSTOM';

      if (walletRes.rowCount === 0) {
        const ins = await client.query(
          'INSERT INTO wallets (user_id, balance, currency, otp_rate, active_tier) VALUES ($1, 0.0000, $2, $3, $4) RETURNING id',
          [userId, 'INR', parsedRate, assignedTier]
        );
        walletId = ins.rows[0].id;
      } else {
        walletId = walletRes.rows[0].id;
        await client.query(
          'UPDATE wallets SET otp_rate = $1, active_tier = $2, updated_at = NOW() WHERE id = $3',
          [parsedRate, assignedTier, walletId]
        );
      }

      // Record in audit log
      await client.query(`
        INSERT INTO audit_logs (actor_id, action, target_type, target_id, reason, metadata)
        VALUES ($1, 'SET_USER_TIER_STATUS', 'user_wallet', $2, $3, $4)
      `, [
        req.user.id,
        userId,
        reason || 'Admin updated user pricing tier status and OTP rate',
        JSON.stringify({ tierId: assignedTier, otpRate: parsedRate })
      ]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Pricing tier updated to ${parsedRate.toFixed(2)}/OTP successfully.`,
        data: { userId, tierId: assignedTier, otpRate: parsedRate }
      });
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[ADMIN] Set user tier error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to update user pricing tier.' });
    } finally {
      client.release();
    }
  }

  /**
   * Platform-wide Financial Ledger (Admin)
   * Shows all financial events: Razorpay Top-ups, Manual Admin Adjustments, OTP Deductions, Refunds
   */
  public static async getGlobalLedger(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
      const offset = (page - 1) * limit;
      const filter = (req.query.filter as string) || 'ALL'; // ALL | RAZORPAY | ADMIN | OTP | REFUND
      const search = req.query.search as string;

      let queryText = `
        SELECT wt.id, wt.wallet_id, wt.user_id, wt.type, wt.amount, wt.balance_before, wt.balance_after,
               wt.applicable_rate, wt.payment_id, wt.razorpay_order_id, wt.reference_type, wt.reference_id,
               wt.status, wt.description, wt.created_at,
               u.full_name as user_name, u.email as user_email
        FROM wallet_transactions wt
        LEFT JOIN users u ON wt.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let idx = 1;

      if (filter === 'RAZORPAY') {
        queryText += ` AND (wt.type = 'TOPUP' OR wt.payment_id IS NOT NULL)`;
      } else if (filter === 'ADMIN') {
        queryText += ` AND (wt.type IN ('ADMIN_CREDIT', 'ADMIN_DEBIT') OR wt.reference_type = 'ADMIN_ADJUSTMENT')`;
      } else if (filter === 'OTP') {
        queryText += ` AND (wt.type = 'OTP_DEBIT' OR wt.reference_type = 'OTP_DEDUCTION')`;
      } else if (filter === 'REFUND') {
        queryText += ` AND (wt.type = 'REFUND' OR wt.reference_type = 'OTP_REFUND')`;
      }

      if (search) {
        queryText += ` AND (
          u.email ILIKE $${idx} OR 
          u.full_name ILIKE $${idx} OR 
          wt.payment_id ILIKE $${idx} OR 
          wt.reference_id ILIKE $${idx} OR
          wt.description ILIKE $${idx}
        )`;
        params.push(`%${search}%`);
        idx++;
      }

      let countQueryText = `
        SELECT COUNT(*)
        FROM wallet_transactions wt
        LEFT JOIN users u ON wt.user_id = u.id
        WHERE 1=1
      `;
      const countParams: any[] = [];
      let countIdx = 1;

      if (filter === 'RAZORPAY') {
        countQueryText += ` AND (wt.type = 'TOPUP' OR wt.payment_id IS NOT NULL)`;
      } else if (filter === 'ADMIN') {
        countQueryText += ` AND (wt.type IN ('ADMIN_CREDIT', 'ADMIN_DEBIT') OR wt.reference_type = 'ADMIN_ADJUSTMENT')`;
      } else if (filter === 'OTP') {
        countQueryText += ` AND (wt.type = 'OTP_DEBIT' OR wt.reference_type = 'OTP_DEDUCTION')`;
      } else if (filter === 'REFUND') {
        countQueryText += ` AND (wt.type = 'REFUND' OR wt.reference_type = 'OTP_REFUND')`;
      }

      if (search) {
        countQueryText += ` AND (
          u.email ILIKE $${countIdx} OR 
          u.full_name ILIKE $${countIdx} OR 
          wt.payment_id ILIKE $${countIdx} OR 
          wt.reference_id ILIKE $${countIdx} OR
          wt.description ILIKE $${countIdx}
        )`;
        countParams.push(`%${search}%`);
        countIdx++;
      }

      queryText += ` ORDER BY wt.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
      params.push(limit, offset);

      const rowsResult = await pool.query(queryText, params);
      const countResult = await pool.query(countQueryText, countParams);

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
      console.error('[ADMIN] Global ledger error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to retrieve global financial ledger.' });
    }
  }

  /**
   * On-demand check of Fast2SMS float and immediate alert email dispatch to admin
   */
  public static async triggerFast2smsFloatCheck(req: AuthRequest, res: Response): Promise<void> {
    try {
      const forceEmail = req.body?.force !== false; // Default true for direct test/check trigger
      const result = await Fast2smsBalanceChecker.checkFloatAndAlert(pool, forceEmail);

      res.json({
        success: true,
        message: result.isSufficient
          ? 'Fast2SMS balance is sufficient to cover all active user balances.'
          : `Deficit detected: ₹${result.deficit}. Alert email has been dispatched to kumarsinghrakesh333@gmail.com.`,
        data: result
      });
    } catch (err: any) {
      console.error('[ADMIN] Trigger Fast2SMS check error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to verify Fast2SMS float.' });
    }
  }
}

