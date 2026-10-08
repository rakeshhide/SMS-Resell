import { pool } from '../config/db';

async function updatePricing() {
  try {
    await pool.query(`
      UPDATE pricing_rules
      SET provider_base_cost = 0.7500,
          gst_percentage = 18.00,
          service_charge_percentage = 0.00
      WHERE is_active = TRUE
    `);
    const res = await pool.query('SELECT * FROM pricing_rules WHERE is_active = TRUE');
    console.log('[PRICING] Successfully updated tariff in Neon PostgreSQL:');
    console.log(res.rows[0]);
  } catch (err: any) {
    console.error('[PRICING] Failed to update pricing:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

updatePricing();
