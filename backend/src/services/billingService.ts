import { pool } from '../config/db';

export interface DbPricingTier {
  id: string;
  minTopup: number;
  maxTopup: number | null;
  otpPrice: number;
  gstPercentage: number;
  isActive: boolean;
  name?: string;
  label?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingBreakdown {
  providerBaseCost: number;
  gstPercentage: number;
  gstAmount: number;
  serviceChargePercentage: number;
  serviceFee: number;
  totalCharged: number;
}

export class BillingService {
  private static cachedTiers: DbPricingTier[] | null = null;
  private static tiersCacheExpiry = 0;
  private static cachedSettings: Record<string, string> | null = null;
  private static settingsCacheExpiry = 0;

  /**
   * Invalidate memory caches
   */
  public static invalidateCache(): void {
    this.cachedTiers = null;
    this.tiersCacheExpiry = 0;
    this.cachedSettings = null;
    this.settingsCacheExpiry = 0;
  }

  /**
   * Get all active pricing tiers ordered by min_topup ASC
   */
  public static async getActiveTiers(): Promise<DbPricingTier[]> {
    const now = Date.now();
    if (this.cachedTiers && this.tiersCacheExpiry > now) {
      return this.cachedTiers;
    }

    try {
      const res = await pool.query(`
        SELECT id, min_topup, max_topup, otp_price, gst_percentage, is_active, created_at, updated_at
        FROM pricing_tiers
        WHERE is_active = TRUE
        ORDER BY min_topup ASC
      `);

      const tiers: DbPricingTier[] = res.rows.map((r, index) => {
        const minVal = parseFloat(r.min_topup);
        const maxVal = r.max_topup ? parseFloat(r.max_topup) : null;
        const price = parseFloat(r.otp_price);
        const gst = parseFloat(r.gst_percentage);

        let name = `Tier ${index + 1}`;
        if (minVal >= 10000) name = 'Enterprise Tier';
        else if (minVal >= 5000) name = 'Business Tier';
        else if (minVal >= 2000) name = 'Scale Tier';
        else if (minVal >= 500) name = 'Growth Tier';
        else name = 'Starter Tier';

        const label = maxVal
          ? `₹${minVal.toLocaleString('en-IN')} – ₹${maxVal.toLocaleString('en-IN')}`
          : `₹${minVal.toLocaleString('en-IN')}+`;

        return {
          id: r.id,
          minTopup: minVal,
          maxTopup: maxVal,
          otpPrice: price,
          gstPercentage: gst,
          isActive: r.is_active,
          name,
          label,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      });

      // Fallback if table was empty
      if (tiers.length === 0) {
        return [
          { id: 't1', minTopup: 100, maxTopup: 499, otpPrice: 0.75, gstPercentage: 18, isActive: true, name: 'Starter Tier', label: '₹100 – ₹499' },
          { id: 't2', minTopup: 500, maxTopup: 1999, otpPrice: 0.72, gstPercentage: 18, isActive: true, name: 'Growth Tier', label: '₹500 – ₹1,999' },
          { id: 't3', minTopup: 2000, maxTopup: 4999, otpPrice: 0.68, gstPercentage: 18, isActive: true, name: 'Scale Tier', label: '₹2,000 – ₹4,999' },
          { id: 't4', minTopup: 5000, maxTopup: 9999, otpPrice: 0.64, gstPercentage: 18, isActive: true, name: 'Business Tier', label: '₹5,000 – ₹9,999' },
          { id: 't5', minTopup: 10000, maxTopup: null, otpPrice: 0.60, gstPercentage: 18, isActive: true, name: 'Enterprise Tier', label: '₹10,000+' },
        ];
      }

      this.cachedTiers = tiers;
      this.tiersCacheExpiry = now + 60000; // 60s cache
      return tiers;
    } catch (err: any) {
      console.error('[BILLING_SERVICE] Failed to query pricing_tiers table:', err.message);
      return [
        { id: 't1', minTopup: 100, maxTopup: 499, otpPrice: 0.75, gstPercentage: 18, isActive: true, name: 'Starter Tier', label: '₹100 – ₹499' },
        { id: 't2', minTopup: 500, maxTopup: 1999, otpPrice: 0.72, gstPercentage: 18, isActive: true, name: 'Growth Tier', label: '₹500 – ₹1,999' },
        { id: 't3', minTopup: 2000, maxTopup: 4999, otpPrice: 0.68, gstPercentage: 18, isActive: true, name: 'Scale Tier', label: '₹2,000 – ₹4,999' },
        { id: 't4', minTopup: 5000, maxTopup: 9999, otpPrice: 0.64, gstPercentage: 18, isActive: true, name: 'Business Tier', label: '₹5,000 – ₹9,999' },
        { id: 't5', minTopup: 10000, maxTopup: null, otpPrice: 0.60, gstPercentage: 18, isActive: true, name: 'Enterprise Tier', label: '₹10,000+' },
      ];
    }
  }

  /**
   * Determine the unlocked tier for a specific top-up amount
   */
  public static async getTierForAmount(amount: number): Promise<DbPricingTier> {
    const tiers = await this.getActiveTiers();
    // Sort descending by minTopup to find the highest qualified tier
    const sortedDesc = [...tiers].sort((a, b) => b.minTopup - a.minTopup);
    for (const tier of sortedDesc) {
      if (amount >= tier.minTopup) {
        return tier;
      }
    }
    // Default to lowest tier
    return tiers[0];
  }

  /**
   * Retrieve platform system settings (minimum topup, gst %)
   */
  public static async getSystemSettings(): Promise<{ minTopup: number; defaultGst: number }> {
    const now = Date.now();
    if (this.cachedSettings && this.settingsCacheExpiry > now) {
      return {
        minTopup: parseFloat(this.cachedSettings['min_topup_amount'] || '100'),
        defaultGst: parseFloat(this.cachedSettings['default_gst_percentage'] || '18'),
      };
    }

    try {
      const res = await pool.query('SELECT key, value FROM system_settings');
      const map: Record<string, string> = {};
      for (const row of res.rows) {
        map[row.key] = row.value;
      }
      this.cachedSettings = map;
      this.settingsCacheExpiry = now + 60000;
      return {
        minTopup: parseFloat(map['min_topup_amount'] || '100'),
        defaultGst: parseFloat(map['default_gst_percentage'] || '18'),
      };
    } catch (e) {
      return { minTopup: 100, defaultGst: 18 };
    }
  }

  /**
   * Get user rate, active tier, and next tier progression details
   */
  public static async getUserRate(userId: string): Promise<{
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
    const tiers = await this.getActiveTiers();
    const res = await pool.query('SELECT otp_rate, active_tier, highest_topup, balance FROM wallets WHERE user_id = $1', [userId]);

    let otpRate = 0.75;
    let activeTier = 'TIER_1';
    let highestTopup = 0;

    if (res.rowCount && res.rows[0]) {
      otpRate = parseFloat(res.rows[0].otp_rate) || 0.75;
      activeTier = res.rows[0].active_tier || 'TIER_1';
      highestTopup = parseFloat(res.rows[0].highest_topup) || 0;
    }

    const currentTier = tiers.find(t => t.id === activeTier || t.otpPrice === otpRate) || tiers[0];
    const currentTierIndex = tiers.findIndex(t => t.id === currentTier.id);

    let nextTierInfo: {
      otpPrice: number;
      minTopup: number;
      amountRequired: number;
      progressPercentage: number;
      tierName: string;
    } | null = null;

    if (currentTierIndex >= 0 && currentTierIndex < tiers.length - 1) {
      const next = tiers[currentTierIndex + 1];
      const amountRequired = Math.max(0, next.minTopup - highestTopup);
      const span = next.minTopup - currentTier.minTopup;
      const progress = span > 0 ? Math.min(100, Math.max(0, ((highestTopup - currentTier.minTopup) / span) * 100)) : 0;

      nextTierInfo = {
        otpPrice: next.otpPrice,
        minTopup: next.minTopup,
        amountRequired: Number(amountRequired.toFixed(2)),
        progressPercentage: Math.round(progress),
        tierName: next.name || `Tier ${currentTierIndex + 2}`,
      };
    }

    return {
      otpRate,
      activeTier: currentTier.id,
      tierName: currentTier.name || 'Starter Tier',
      highestTopup,
      nextTier: nextTierInfo,
    };
  }

  /**
   * Admin: List all tiers (including inactive)
   */
  public static async getAllTiersAdmin(): Promise<DbPricingTier[]> {
    const res = await pool.query(`
      SELECT id, min_topup, max_topup, otp_price, gst_percentage, is_active, created_at, updated_at
      FROM pricing_tiers
      ORDER BY min_topup ASC
    `);

    return res.rows.map((r, index) => {
      const minVal = parseFloat(r.min_topup);
      const maxVal = r.max_topup ? parseFloat(r.max_topup) : null;
      return {
        id: r.id,
        minTopup: minVal,
        maxTopup: maxVal,
        otpPrice: parseFloat(r.otp_price),
        gstPercentage: parseFloat(r.gst_percentage),
        isActive: r.is_active,
        name: `Tier ${index + 1}`,
        label: maxVal ? `₹${minVal} – ₹${maxVal}` : `₹${minVal}+`,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });
  }

  /**
   * Admin: Create a new pricing tier
   */
  public static async createTier(data: {
    minTopup: number;
    maxTopup: number | null;
    otpPrice: number;
    gstPercentage: number;
    isActive: boolean;
  }): Promise<DbPricingTier> {
    const res = await pool.query(`
      INSERT INTO pricing_tiers (min_topup, max_topup, otp_price, gst_percentage, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, min_topup, max_topup, otp_price, gst_percentage, is_active, created_at, updated_at
    `, [data.minTopup, data.maxTopup, data.otpPrice, data.gstPercentage, data.isActive]);

    this.invalidateCache();
    const r = res.rows[0];
    return {
      id: r.id,
      minTopup: parseFloat(r.min_topup),
      maxTopup: r.max_topup ? parseFloat(r.max_topup) : null,
      otpPrice: parseFloat(r.otp_price),
      gstPercentage: parseFloat(r.gst_percentage),
      isActive: r.is_active,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  /**
   * Admin: Update an existing tier
   */
  public static async updateTier(
    id: string,
    data: {
      minTopup: number;
      maxTopup: number | null;
      otpPrice: number;
      gstPercentage: number;
      isActive: boolean;
    }
  ): Promise<DbPricingTier> {
    const res = await pool.query(`
      UPDATE pricing_tiers
      SET min_topup = $1, max_topup = $2, otp_price = $3, gst_percentage = $4, is_active = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING id, min_topup, max_topup, otp_price, gst_percentage, is_active, created_at, updated_at
    `, [data.minTopup, data.maxTopup, data.otpPrice, data.gstPercentage, data.isActive, id]);

    if (res.rowCount === 0) {
      throw new Error('Pricing tier not found');
    }

    this.invalidateCache();
    const r = res.rows[0];
    return {
      id: r.id,
      minTopup: parseFloat(r.min_topup),
      maxTopup: r.max_topup ? parseFloat(r.max_topup) : null,
      otpPrice: parseFloat(r.otp_price),
      gstPercentage: parseFloat(r.gst_percentage),
      isActive: r.is_active,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  /**
   * Admin: Toggle tier active state
   */
  public static async toggleTier(id: string, isActive: boolean): Promise<void> {
    await pool.query('UPDATE pricing_tiers SET is_active = $1, updated_at = NOW() WHERE id = $2', [isActive, id]);
    this.invalidateCache();
  }

  /**
   * Admin: Delete tier
   */
  public static async deleteTier(id: string): Promise<void> {
    await pool.query('DELETE FROM pricing_tiers WHERE id = $1', [id]);
    this.invalidateCache();
  }

  /**
   * Admin: Update system setting
   */
  public static async updateSetting(key: string, value: string): Promise<void> {
    await pool.query(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `, [key, value]);
    this.invalidateCache();
  }

  /**
   * Public base pricing breakdown
   */
  public static async getActivePricing(): Promise<PricingBreakdown> {
    const settings = await this.getSystemSettings();
    const tiers = await this.getActiveTiers();
    const starterTier = tiers[0] || { otpPrice: 0.75, gstPercentage: 18 };
    const gstPercentage = starterTier.gstPercentage || settings.defaultGst || 18.00;
    const totalCharged = Number(starterTier.otpPrice.toFixed(4));

    return {
      providerBaseCost: totalCharged,
      gstPercentage,
      gstAmount: 0,
      serviceChargePercentage: 0,
      serviceFee: 0,
      totalCharged,
    };
  }
}
