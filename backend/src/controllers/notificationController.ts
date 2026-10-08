import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { NotificationService } from '../services/notificationService';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   * List active notifications for the authenticated user
   */
  public static async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '30', 10), 1), 100);
      const offset = Math.max(parseInt(req.query.offset as string || '0', 10), 0);

      const result = await NotificationService.getUserNotifications(req.user.id, limit, offset);

      res.json({
        success: true,
        data: result.notifications,
        unreadCount: result.unreadCount,
        total: result.total,
      });
    } catch (err: any) {
      console.error('[NOTIFICATIONS] Get error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a specific notification as read
   */
  public static async markRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        res.status(400).json({ success: false, message: 'Notification ID required.' });
        return;
      }

      const updated = await NotificationService.markAsRead(req.user.id, id);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Notification not found or already dismissed.' });
        return;
      }

      res.json({ success: true, message: 'Notification marked as read.' });
    } catch (err: any) {
      console.error('[NOTIFICATIONS] Mark read error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to update notification status.' });
    }
  }

  /**
   * POST /api/v1/notifications/read-all
   * Mark all notifications as read
   */
  public static async markAllRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const count = await NotificationService.markAllAsRead(req.user.id);
      res.json({ success: true, message: 'All notifications marked as read.', markedCount: count });
    } catch (err: any) {
      console.error('[NOTIFICATIONS] Mark all read error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to mark notifications as read.' });
    }
  }

  /**
   * DELETE /api/v1/notifications/:id
   * Dismiss/delete an individual notification (permanently removed from user's view)
   */
  public static async dismiss(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        res.status(400).json({ success: false, message: 'Notification ID required.' });
        return;
      }

      const dismissed = await NotificationService.dismissNotification(req.user.id, id);
      if (!dismissed) {
        res.status(404).json({ success: false, message: 'Notification not found.' });
        return;
      }

      res.json({ success: true, message: 'Notification permanently dismissed.' });
    } catch (err: any) {
      console.error('[NOTIFICATIONS] Dismiss error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to dismiss notification.' });
    }
  }

  /**
   * DELETE /api/v1/notifications
   * Dismiss/clear all notifications (permanently removed from user's view)
   */
  public static async dismissAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const count = await NotificationService.dismissAll(req.user.id);
      res.json({ success: true, message: 'All notifications permanently dismissed.', clearedCount: count });
    } catch (err: any) {
      console.error('[NOTIFICATIONS] Clear all error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to clear notifications.' });
    }
  }
}
