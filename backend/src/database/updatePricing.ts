import { pool } from '../config/db';

async function updatePricing() {
  try {
    await pool.query(`
      UPDATE pricing_rules
      SET service_charge_percentage = 3.00
      WHERE is_active = TRUE
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value VARCHAR(255) NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`
      INSERT INTO system_settings (key, value, description, updated_at)
      VALUES 
        ('default_service_fee_percentage', '3.00', 'Default platform service fee percentage for wallet top-ups', NOW()),
        ('min_topup_amount', '1.00', 'Minimum wallet top-up allowed in INR', NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
    `);
    await pool.query(`
      UPDATE pricing_tiers
      SET min_topup = 1.00
      WHERE min_topup = 100.00;
    `);
    const res = await pool.query('SELECT * FROM pricing_rules WHERE is_active = TRUE');
    const settingsRes = await pool.query("SELECT * FROM system_settings WHERE key IN ('default_service_fee_percentage', 'min_topup_amount')");
    console.log('[PRICING] Successfully updated tariff in Neon PostgreSQL:');
    console.log(res.rows[0]);
    console.log(settingsRes.rows);
  } catch (err: any) {
    console.error('[PRICING] Failed to update pricing:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

updatePricing();
