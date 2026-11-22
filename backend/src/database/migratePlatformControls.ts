import { pool } from '../config/db';

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add suspend_reason column to users table
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS suspend_reason TEXT DEFAULT NULL
    `);

    // Add platform control settings
    const settings = [
      { key: 'maintenance_mode',    value: 'false' },
      { key: 'maintenance_message', value: 'We are currently performing scheduled maintenance. The platform will be back shortly.' },
      { key: 'registration_mode',   value: 'open' },
      { key: 'invite_message',      value: 'Registration is currently invite-only. Submit your request and we will reach out.' },
    ];

    for (const s of settings) {
      await client.query(`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (key) DO NOTHING
      `, [s.key, s.value]);
    }

    // Create invite_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invite_requests (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name   TEXT NOT NULL,
        email       TEXT NOT NULL,
        company     TEXT,
        reason      TEXT,
        status      TEXT NOT NULL DEFAULT 'pending',
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invite_requests_email  ON invite_requests(email);
      CREATE INDEX IF NOT EXISTS idx_invite_requests_status ON invite_requests(status);
    `);

    await client.query(`
      ALTER TABLE invite_requests 
      ADD COLUMN IF NOT EXISTS invite_token TEXT,
      ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_invite_requests_token 
      ON invite_requests(invite_token) WHERE invite_token IS NOT NULL;
    `);

    await client.query('COMMIT');
    console.log('[MIGRATION] Platform controls migration completed successfully.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[MIGRATION] Failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

run()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
