import { pool } from '../config/db';
import { NotificationService } from './notificationService';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  subject: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
  latestMessage?: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName?: string;
  senderEmail?: string;
  senderRole: 'user' | 'admin';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface CreateTicketDTO {
  userId: string;
  subject: string;
  category?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  initialMessage: string;
}

export class SupportService {
  /**
   * Create a new support ticket and post initial question
   */
  public static async createTicket(dto: CreateTicketDTO): Promise<{ ticket: SupportTicket; message: SupportMessage }> {
    const {
      userId,
      subject,
      category = 'general',
      priority = 'MEDIUM',
      initialMessage
    } = dto;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate unique ticket number
      const ticketNumber = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;

      const ticketRes = await client.query(
        `INSERT INTO support_tickets (ticket_number, user_id, subject, category, priority, status)
         VALUES ($1, $2, $3, $4, $5, 'OPEN')
         RETURNING id, ticket_number as "ticketNumber", user_id as "userId", subject,
                   category, status, priority, last_message_at as "lastMessageAt",
                   created_at as "createdAt", updated_at as "updatedAt"`,
        [ticketNumber, userId, subject.trim(), category, priority]
      );
      const ticket = ticketRes.rows[0];

      const msgRes = await client.query(
        `INSERT INTO support_messages (ticket_id, sender_id, sender_role, message)
         VALUES ($1, $2, 'user', $3)
         RETURNING id, ticket_id as "ticketId", sender_id as "senderId", sender_role as "senderRole",
                   message, is_read as "isRead", created_at as "createdAt"`,
        [ticket.id, userId, initialMessage.trim()]
      );
      const message = msgRes.rows[0];

      await client.query('COMMIT');
      return { ticket, message };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * List tickets with pagination and filtering
   */
  public static async listTickets(params: {
    userId?: string;
    isAdmin: boolean;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tickets: SupportTicket[]; total: number; page: number; limit: number }> {
    const { userId, isAdmin, status, search, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (!isAdmin && userId) {
      conditions.push(`st.user_id = $${idx++}`);
      values.push(userId);
    }

    if (status && status !== 'ALL') {
      conditions.push(`st.status = $${idx++}`);
      values.push(status.toUpperCase());
    }

    if (search && search.trim() !== '') {
      conditions.push(`(
        st.ticket_number ILIKE $${idx} OR
        st.subject ILIKE $${idx} OR
        u.email ILIKE $${idx} OR
        u.full_name ILIKE $${idx}
      )`);
      values.push(`%${search.trim()}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count query
    const countSql = `
      SELECT COUNT(*) as total
      FROM support_tickets st
      JOIN users u ON u.id = st.user_id
      ${whereClause}
    `;
    const countRes = await pool.query(countSql, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    // List query with latest message & unread counts
    const listSql = `
      SELECT 
        st.id,
        st.ticket_number as "ticketNumber",
        st.user_id as "userId",
        u.email as "userEmail",
        u.full_name as "userName",
        st.subject,
        st.category,
        st.status,
        st.priority,
        st.last_message_at as "lastMessageAt",
        st.created_at as "createdAt",
        st.updated_at as "updatedAt",
        (
          SELECT sm.message 
          FROM support_messages sm 
          WHERE sm.ticket_id = st.id 
          ORDER BY sm.created_at DESC 
          LIMIT 1
        ) as "latestMessage",
        (
          SELECT COUNT(*)::int
          FROM support_messages sm
          WHERE sm.ticket_id = st.id 
            AND sm.is_read = FALSE
            AND sm.sender_role != ${isAdmin ? "'admin'" : "'user'"}
        ) as "unreadCount"
      FROM support_tickets st
      JOIN users u ON u.id = st.user_id
      ${whereClause}
      ORDER BY st.last_message_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    values.push(limit, offset);

    const listRes = await pool.query(listSql, values);
    return {
      tickets: listRes.rows,
      total,
      page,
      limit
    };
  }

  /**
   * Get single ticket with full message history and mark messages as read
   */
  public static async getTicketDetails(ticketId: string, currentUserId: string, isAdmin: boolean): Promise<{
    ticket: SupportTicket;
    messages: SupportMessage[];
  }> {
    const ticketRes = await pool.query(
      `SELECT 
        st.id,
        st.ticket_number as "ticketNumber",
        st.user_id as "userId",
        u.email as "userEmail",
        u.full_name as "userName",
        st.subject,
        st.category,
        st.status,
        st.priority,
        st.last_message_at as "lastMessageAt",
        st.created_at as "createdAt",
        st.updated_at as "updatedAt"
       FROM support_tickets st
       JOIN users u ON u.id = st.user_id
       WHERE st.id = $1 ${!isAdmin ? 'AND st.user_id = $2' : ''}`,
      !isAdmin ? [ticketId, currentUserId] : [ticketId]
    );

    if (ticketRes.rowCount === 0) {
      throw new Error('Support ticket not found or access denied');
    }
    const ticket = ticketRes.rows[0];

    // Mark other party's unread messages as read
    await pool.query(
      `UPDATE support_messages
       SET is_read = TRUE
       WHERE ticket_id = $1 AND sender_role != $2 AND is_read = FALSE`,
      [ticketId, isAdmin ? 'admin' : 'user']
    );

    // Retrieve all messages in thread
    const msgRes = await pool.query(
      `SELECT 
        sm.id,
        sm.ticket_id as "ticketId",
        sm.sender_id as "senderId",
        u.full_name as "senderName",
        u.email as "senderEmail",
        sm.sender_role as "senderRole",
        sm.message,
        sm.is_read as "isRead",
        sm.created_at as "createdAt"
       FROM support_messages sm
       JOIN users u ON u.id = sm.sender_id
       WHERE sm.ticket_id = $1
       ORDER BY sm.created_at ASC`,
      [ticketId]
    );

    return {
      ticket,
      messages: msgRes.rows
    };
  }

  /**
   * Post a reply to an existing ticket
   */
  public static async addMessage(params: {
    ticketId: string;
    senderId: string;
    senderRole: 'user' | 'admin';
    message: string;
  }): Promise<SupportMessage> {
    const { ticketId, senderId, senderRole, message } = params;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify ticket exists
      const ticketRes = await client.query(
        `SELECT id, ticket_number as "ticketNumber", user_id as "userId", status, subject
         FROM support_tickets
         WHERE id = $1`,
        [ticketId]
      );
      if (ticketRes.rowCount === 0) {
        throw new Error('Ticket not found');
      }
      const ticket = ticketRes.rows[0];

      // If user is sending and not an admin, verify ownership
      if (senderRole === 'user' && ticket.userId !== senderId) {
        throw new Error('Access denied to reply to this ticket');
      }

      // Insert message
      const msgRes = await client.query(
        `INSERT INTO support_messages (ticket_id, sender_id, sender_role, message)
         VALUES ($1, $2, $3, $4)
         RETURNING id, ticket_id as "ticketId", sender_id as "senderId", sender_role as "senderRole",
                   message, is_read as "isRead", created_at as "createdAt"`,
        [ticketId, senderId, senderRole, message.trim()]
      );
      const insertedMsg = msgRes.rows[0];

      // Update ticket status & timestamps
      let nextStatus = ticket.status;
      if (senderRole === 'admin') {
        if (ticket.status === 'OPEN') nextStatus = 'IN_PROGRESS';
      } else {
        if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') nextStatus = 'OPEN';
      }

      await client.query(
        `UPDATE support_tickets
         SET status = $1, last_message_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [nextStatus, ticketId]
      );

      await client.query('COMMIT');

      // If admin replied, send notification to user
      if (senderRole === 'admin') {
        NotificationService.createNotification({
          userId: ticket.userId,
          title: `Support Ticket #${ticket.ticketNumber} Update`,
          message: `Admin reply: ${message.slice(0, 100)}${message.length > 100 ? '...' : ''}`,
          type: 'system',
          actionUrl: '/support',
          actionLabel: 'View Ticket'
        }).catch((err) => console.error('[NOTIFICATION] Failed to send support reply notification:', err));
      }

      return insertedMsg;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Update status of ticket (e.g. OPEN, IN_PROGRESS, RESOLVED, CLOSED)
   */
  public static async updateTicketStatus(
    ticketId: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
    actorId: string,
    isAdmin: boolean
  ): Promise<SupportTicket> {
    const ticketRes = await pool.query(
      `SELECT id, ticket_number as "ticketNumber", user_id as "userId", subject 
       FROM support_tickets 
       WHERE id = $1 ${!isAdmin ? 'AND user_id = $2' : ''}`,
      !isAdmin ? [ticketId, actorId] : [ticketId]
    );

    if (ticketRes.rowCount === 0) {
      throw new Error('Ticket not found or unauthorized');
    }
    const ticket = ticketRes.rows[0];

    const updateRes = await pool.query(
      `UPDATE support_tickets
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, ticket_number as "ticketNumber", user_id as "userId", subject,
                 category, status, priority, last_message_at as "lastMessageAt",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [status, ticketId]
    );

    if (isAdmin && (status === 'RESOLVED' || status === 'CLOSED')) {
      NotificationService.createNotification({
        userId: ticket.userId,
        title: `Ticket #${ticket.ticketNumber} ${status === 'RESOLVED' ? 'Resolved' : 'Closed'}`,
        message: `Your support ticket has been marked as ${status.toLowerCase()} by an administrator.`,
        type: 'system',
        actionUrl: '/support'
      }).catch((err) => console.error('[NOTIFICATION] Failed to send ticket status notification:', err));
    }

    return updateRes.rows[0];
  }
}
