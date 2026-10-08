import bcrypt from 'bcryptjs';
import { pool } from '../config/db';

export async function resetAndCreateAdmin() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('[RESET] Starting database cleanup for public release...');

    // 1. Delete all audit and transaction tables
    await client.query('DELETE FROM otp_transactions');
    await client.query('DELETE FROM wallet_transactions');
    await client.query('DELETE FROM payments');
    await client.query('DELETE FROM api_keys');
    await client.query('DELETE FROM audit_logs');
    await client.query('UPDATE pricing_rules SET updated_by = NULL');

    // 2. Delete all existing wallets and users
    await client.query('DELETE FROM wallets');
    await client.query('DELETE FROM users');

    console.log('[RESET] Removed all test accounts, wallets, API keys, and transaction logs.');

    // 3. Create fresh production administrator
    const adminEmail = 'admin@nexusotp.com';
    const adminPasswordPlain = 'NexusAdmin@2026#Secure!';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminPasswordPlain, saltRounds);

    const userRes = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, status, email_verified)
      VALUES ($1, $2, 'System Administrator', 'admin', 'active', TRUE)
      RETURNING id, email, full_name, role
    `, [adminEmail, passwordHash]);

    const adminUser = userRes.rows[0];

    // 4. Initialize clean wallet for admin with ₹0.00 float
    await client.query(`
      INSERT INTO wallets (user_id, balance, currency, otp_rate, active_tier, highest_topup)
      VALUES ($1, 0.0000, 'INR', 0.7500, 'TIER_1', 0.0000)
    `, [adminUser.id]);

    // 5. Ensure system_settings has public production defaults
    await client.query(`
      INSERT INTO system_settings (key, value, description)
      VALUES 
        ('min_topup_amount', '100.00', 'Minimum wallet top-up allowed in INR'),
        ('default_gst_percentage', '18.00', 'Default GST percentage for wallet top-ups')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `);

    // 6. Log admin initialization in audit logs
    await client.query(`
      INSERT INTO audit_logs (actor_id, action, target_type, target_id, reason)
      VALUES ($1, 'INITIALIZE_PRODUCTION_ADMIN', 'user', $2, 'System cleared and production admin provisioned')
    `, [adminUser.id, adminUser.id]);

    await client.query('COMMIT');

    console.log('[RESET] Database reset complete! Production admin created successfully:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPasswordPlain}`);

    return {
      email: adminEmail,
      password: adminPasswordPlain,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[RESET] Failed to reset database:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  resetAndCreateAdmin()
    .then(() => {
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
