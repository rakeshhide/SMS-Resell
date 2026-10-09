import { pool } from '../config/db';

async function updatePricing() {
  try {
    await pool.query(`
      UPDATE pricing_rules
      SET service_charge_percentage = 2.50
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
      VALUES ('default_service_fee_percentage', '2.50', 'Default platform service fee percentage for wallet top-ups', NOW())
      ON CONFLICT (key) DO UPDATE SET value = '2.50', updated_at = NOW();
    `);
    const res = await pool.query('SELECT * FROM pricing_rules WHERE is_active = TRUE');
    const settingsRes = await pool.query("SELECT * FROM system_settings WHERE key = 'default_service_fee_percentage'");
    console.log('[PRICING] Successfully updated tariff in Neon PostgreSQL:');
    console.log(res.rows[0]);
    console.log(settingsRes.rows[0]);
  } catch (err: any) {
    console.error('[PRICING] Failed to update pricing:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

updatePricing();
