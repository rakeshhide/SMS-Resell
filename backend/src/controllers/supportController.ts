import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { SupportService } from '../services/supportService';

export class SupportController {
  /**
   * POST /api/v1/support/tickets
   * Create a new support ticket / question
   */
  public static async createTicket(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { subject, category, priority, message } = req.body;

      if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
        res.status(400).json({ success: false, message: 'Subject is required.' });
        return;
      }

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({ success: false, message: 'Message content is required.' });
        return;
      }

      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      const ticketPriority = validPriorities.includes(priority) ? priority : 'MEDIUM';

      const result = await SupportService.createTicket({
        userId: req.user.id,
        subject: subject.trim(),
        category: category || 'general',
        priority: ticketPriority,
        initialMessage: message.trim()
      });

      res.status(201).json({
        success: true,
        message: 'Support ticket opened successfully.',
        data: result
      });
    } catch (err: any) {
      console.error('[SUPPORT] Create ticket error:', err.message);
      res.status(500).json({ success: false, message: err.message || 'Failed to create support ticket.' });
    }
  }

  /**
   * GET /api/v1/support/tickets
   * List tickets for user or admin
   */
  public static async listTickets(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const isAdmin = req.user.role === 'admin';
      const status = req.query.status as string;
      const search = req.query.search as string;
      const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '20', 10), 1), 100);

      const result = await SupportService.listTickets({
        userId: req.user.id,
        isAdmin,
        status,
        search,
        page,
        limit
      });

      res.json({
        success: true,
        data: result.tickets,
        total: result.total,
        page: result.page,
        limit: result.limit
      });
    } catch (err: any) {
      console.error('[SUPPORT] List tickets error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to retrieve support tickets.' });
    }
  }

  /**
   * GET /api/v1/support/tickets/:id
   * Get ticket details with messages thread
   */
  public static async getTicket(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const ticketId = req.params.id as string;
      if (!ticketId) {
        res.status(400).json({ success: false, message: 'Ticket ID is required.' });
        return;
      }

      const isAdmin = req.user.role === 'admin';
      const result = await SupportService.getTicketDetails(ticketId, req.user.id, isAdmin);

      res.json({
        success: true,
        data: result
      });
    } catch (err: any) {
      console.error('[SUPPORT] Get ticket error:', err.message);
      res.status(err.message.includes('not found') ? 404 : 500).json({
        success: false,
        message: err.message || 'Failed to retrieve support ticket.'
      });
    }
  }

  /**
   * POST /api/v1/support/tickets/:id/messages
   * Reply to ticket
   */
  public static async addMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const ticketId = req.params.id as string;
      const { message } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({ success: false, message: 'Message content is required.' });
        return;
      }

      const senderRole = req.user.role === 'admin' ? 'admin' : 'user';

      const result = await SupportService.addMessage({
        ticketId,
        senderId: req.user.id,
        senderRole,
        message: message.trim()
      });

      res.status(201).json({
        success: true,
        message: 'Message dispatched successfully.',
        data: result
      });
    } catch (err: any) {
      console.error('[SUPPORT] Add message error:', err.message);
      res.status(500).json({ success: false, message: err.message || 'Failed to post message.' });
    }
  }

  /**
   * PATCH /api/v1/support/tickets/:id/status
   * Update ticket status
   */
  public static async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const ticketId = req.params.id as string;
      const { status } = req.body;

      const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid ticket status.' });
        return;
      }

      const isAdmin = req.user.role === 'admin';
      const result = await SupportService.updateTicketStatus(ticketId, status, req.user.id, isAdmin);

      res.json({
        success: true,
        message: `Ticket status updated to ${status}.`,
        data: result
      });
    } catch (err: any) {
      console.error('[SUPPORT] Update status error:', err.message);
      res.status(500).json({ success: false, message: err.message || 'Failed to update ticket status.' });
    }
  }
}
