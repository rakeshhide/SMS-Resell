import { pool } from '../config/db';

export async function migrateNotificationsTable() {
  console.log('[MIGRATION] Checking & applying notifications table on Neon PostgreSQL...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(150) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) NOT NULL DEFAULT 'system',
          action_url VARCHAR(255),
          action_label VARCHAR(100),
          is_read BOOLEAN NOT NULL DEFAULT FALSE,
          is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_active_created 
      ON notifications(user_id, is_dismissed, created_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
      ON notifications(user_id, is_read) 
      WHERE is_dismissed = FALSE;
    `);

    await client.query('COMMIT');
    console.log('[MIGRATION] Notifications table & high-throughput indexes verified successfully.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[MIGRATION] Error migrating notifications table:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateNotificationsTable()
    .then(() => {
      console.log('[MIGRATION] Finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[MIGRATION] Failed:', err);
      process.exit(1);
    });
}
