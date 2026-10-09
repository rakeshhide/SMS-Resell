import { pool } from '../config/db';

export async function migrateSupportTables() {
  console.log('[MIGRATION] Checking and applying support ticketing & chat tables on Neon PostgreSQL...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Support Tickets Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number VARCHAR(20) NOT NULL UNIQUE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'general',
        status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
        priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
        last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Indexes for billion-scale queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_support_tickets_user_updated
      ON support_tickets(user_id, updated_at DESC);

      CREATE INDEX IF NOT EXISTS idx_support_tickets_status_updated
      ON support_tickets(status, updated_at DESC);

      CREATE INDEX IF NOT EXISTS idx_support_tickets_last_msg
      ON support_tickets(last_message_at DESC);
    `);

    // 2. Support Messages Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_role VARCHAR(20) NOT NULL DEFAULT 'user',
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Indexes for fast message stream retrieval
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_created
      ON support_messages(ticket_id, created_at ASC);

      CREATE INDEX IF NOT EXISTS idx_support_messages_unread
      ON support_messages(ticket_id, is_read)
      WHERE is_read = FALSE;
    `);

    await client.query('COMMIT');
    console.log('[MIGRATION] Support tables & high-performance indexes applied successfully!');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[MIGRATION] Error migrating support tables:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateSupportTables()
    .then(() => {
      console.log('[MIGRATION] Support migration finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[MIGRATION] Support migration failed:', err);
      process.exit(1);
    });
}
