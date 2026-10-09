import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db';

export async function runMigration() {
  console.log('[MIGRATION] Starting database migration on Neon PostgreSQL...');
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query('BEGIN');
    await client.query(sql);

    // Seed default pricing rule if not present
    const pricingRes = await client.query('SELECT id FROM pricing_rules LIMIT 1');
    if (pricingRes.rowCount === 0) {
      await client.query(`
        INSERT INTO pricing_rules (provider_base_cost, gst_percentage, service_charge_percentage, is_active)
        VALUES (0.1500, 18.00, 2.50, TRUE)
      `);
      console.log('[MIGRATION] Default pricing rules initialized (Base: ₹0.15, GST: 18%, Service: 2.5%).');
    }

    await client.query('COMMIT');
    console.log('[MIGRATION] Database schema migration completed successfully.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[MIGRATION] Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
