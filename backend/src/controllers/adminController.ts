import { Response } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { pool } from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';
import { WalletService } from '../services/walletService';
import { BillingService } from '../services/billingService';

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
            isFloatSufficient: fast2smsLiveBalance !== null ? fast2smsLiveBalance >= requiredFast2smsBalance : true,
            floatDeficit: fast2smsLiveBalance !== null ? Math.max(0, parseFloat((requiredFast2smsBalance - fast2smsLiveBalance).toFixed(2))) : 0
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
               COALESCE(w.balance, 0) as balance, w.currency
        FROM users u
        LEFT JOIN wallets w ON u.id = w.user_id
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

      res.json({
        success: true,
        users: rowsRes.rows,
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
}
