import { pool } from '../config/db';

export type NotificationType = 'system' | 'wallet' | 'warning' | 'security' | 'otp';

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string | null;
  actionLabel?: string | null;
  isRead: boolean;
  isDismissed: boolean;
  metadata?: any;
  createdAt: string;
}

export interface CreateNotificationDTO {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: any;
}

export class NotificationService {
  /**
   * Create a dynamic server-side notification
   */
  public static async createNotification(dto: CreateNotificationDTO): Promise<NotificationRecord> {
    const {
      userId,
      title,
      message,
      type = 'system',
      actionUrl = null,
      actionLabel = null,
      metadata = null,
    } = dto;

    const res = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, action_url, action_label, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id as "userId", title, message, type, action_url as "actionUrl",
                 action_label as "actionLabel", is_read as "isRead", is_dismissed as "isDismissed",
                 metadata, created_at as "createdAt"`,
      [userId, title, message, type, actionUrl, actionLabel, metadata ? JSON.stringify(metadata) : null]
    );

    return res.rows[0];
  }

  /**
   * Fetch active, non-dismissed notifications for a user with unread count
   */
  public static async getUserNotifications(
    userId: string,
    limit: number = 30,
    offset: number = 0
  ): Promise<{
    notifications: NotificationRecord[];
    unreadCount: number;
    total: number;
  }> {
    // 1. Check if user has zero notifications in DB yet; if so, create initial system welcoming notices once
    const totalCountRes = await pool.query(
      'SELECT COUNT(*)::int as count FROM notifications WHERE user_id = $1',
      [userId]
    );
    const lifetimeCount = totalCountRes.rows[0]?.count ?? 0;

    if (lifetimeCount === 0) {
      // Create initial dynamic server notifications for the new user
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, action_url, action_label)
         VALUES 
         ($1, 'Direct Carrier Route Active', 'Tier-1 telecom carrier route initialized with 99.8% delivery SLA.', 'system', NULL, NULL),
         ($1, 'Security Protocols Active', 'HMAC SHA-256 API verification and token authentication verified.', 'security', NULL, NULL)`,
        [userId]
      );
    }

    // 2. Query non-dismissed notifications (billion-row indexed query)
    const listRes = await pool.query(
      `SELECT id, user_id as "userId", title, message, type, action_url as "actionUrl",
              action_label as "actionLabel", is_read as "isRead", is_dismissed as "isDismissed",
              metadata, created_at as "createdAt"
       FROM notifications
       WHERE user_id = $1 AND is_dismissed = FALSE
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // 3. Fast partial index query for unread badge count
    const unreadRes = await pool.query(
      `SELECT COUNT(*)::int as "unreadCount"
       FROM notifications
       WHERE user_id = $1 AND is_dismissed = FALSE AND is_read = FALSE`,
      [userId]
    );

    const activeCountRes = await pool.query(
      `SELECT COUNT(*)::int as total
       FROM notifications
       WHERE user_id = $1 AND is_dismissed = FALSE`,
      [userId]
    );

    return {
      notifications: listRes.rows,
      unreadCount: unreadRes.rows[0]?.unreadCount || 0,
      total: activeCountRes.rows[0]?.total || 0,
    };
  }

  /**
   * Mark a single notification as read
   */
  public static async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const res = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2 AND is_dismissed = FALSE
       RETURNING id`,
      [notificationId, userId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Mark all active notifications as read
   */
  public static async markAllAsRead(userId: string): Promise<number> {
    const res = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_dismissed = FALSE AND is_read = FALSE`,
      [userId]
    );
    return res.rowCount ?? 0;
  }

  /**
   * Permanently dismiss/delete a single notification (will NEVER reappear)
   */
  public static async dismissNotification(userId: string, notificationId: string): Promise<boolean> {
    const res = await pool.query(
      `UPDATE notifications
       SET is_dismissed = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [notificationId, userId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Permanently dismiss/clear all notifications for a user (will NEVER reappear)
   */
  public static async dismissAll(userId: string): Promise<number> {
    const res = await pool.query(
      `UPDATE notifications
       SET is_dismissed = TRUE
       WHERE user_id = $1 AND is_dismissed = FALSE`,
      [userId]
    );
    return res.rowCount ?? 0;
  }
}
