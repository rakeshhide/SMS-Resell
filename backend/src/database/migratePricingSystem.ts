import { pool } from '../config/db';

export async function runPricingMigration() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('[MIGRATION] Starting pricing system schema update...');

    // 1. Create pricing_tiers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pricing_tiers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        min_topup NUMERIC(14, 4) NOT NULL,
        max_topup NUMERIC(14, 4),
        otp_price NUMERIC(8, 4) NOT NULL,
        gst_percentage NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Create system_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value VARCHAR(255) NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Insert default settings
    await client.query(`
      INSERT INTO system_settings (key, value, description)
      VALUES 
        ('min_topup_amount', '100.00', 'Minimum wallet top-up allowed in INR'),
        ('default_gst_percentage', '18.00', 'Default GST percentage for wallet top-ups')
      ON CONFLICT (key) DO NOTHING;
    `);

    // 4. Populate default tiers if table is empty
    const tiersCount = await client.query('SELECT COUNT(*) FROM pricing_tiers');
    if (parseInt(tiersCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO pricing_tiers (min_topup, max_topup, otp_price, gst_percentage, is_active)
        VALUES 
          (100.00, 499.00, 0.7500, 18.00, TRUE),
          (500.00, 1999.00, 0.7200, 18.00, TRUE),
          (2000.00, 4999.00, 0.6800, 18.00, TRUE),
          (5000.00, 9999.00, 0.6400, 18.00, TRUE),
          (10000.00, NULL, 0.6000, 18.00, TRUE);
      `);
      console.log('[MIGRATION] Seeded 5 default pricing tiers.');
    }

    // 5. Update wallet_transactions table with required ledger fields
    await client.query(`
      ALTER TABLE wallet_transactions 
      ADD COLUMN IF NOT EXISTS applicable_rate NUMERIC(8, 4) DEFAULT 0.7500,
      ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'COMPLETED';
    `);

    // 6. Update wallets table to ensure otp_rate, active_tier, highest_topup exist
    await client.query(`
      ALTER TABLE wallets
      ADD COLUMN IF NOT EXISTS otp_rate NUMERIC(8, 4) NOT NULL DEFAULT 0.7500,
      ADD COLUMN IF NOT EXISTS active_tier VARCHAR(50) NOT NULL DEFAULT 'TIER_1',
      ADD COLUMN IF NOT EXISTS highest_topup NUMERIC(14, 4) NOT NULL DEFAULT 0.0000;
    `);

    // 7. Update payments table to ensure separate tax columns
    await client.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS credit_amount NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
      ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
      ADD COLUMN IF NOT EXISTS service_fee_amount NUMERIC(14, 4) NOT NULL DEFAULT 0.0000;
    `);

    await client.query('COMMIT');
    console.log('[MIGRATION] Pricing system migration applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[MIGRATION] Migration error:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runPricingMigration()
    .then(() => {
      console.log('Migration execution finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
