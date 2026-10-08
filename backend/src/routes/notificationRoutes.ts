import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// Protect all notification routes with JWT authentication
router.use(authenticateJWT);

router.get('/', NotificationController.getNotifications);
router.patch('/:id/read', NotificationController.markRead);
router.post('/read-all', NotificationController.markAllRead);
router.delete('/:id', NotificationController.dismiss);
router.delete('/', NotificationController.dismissAll);

export default router;
