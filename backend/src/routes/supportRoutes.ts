import { Router } from 'express';
import { SupportController } from '../controllers/supportController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// Require authenticated user/admin for all support endpoints
router.use(authenticateJWT);

router.post('/tickets', SupportController.createTicket);
router.get('/tickets', SupportController.listTickets);
router.get('/tickets/:id', SupportController.getTicket);
router.post('/tickets/:id/messages', SupportController.addMessage);
router.patch('/tickets/:id/status', SupportController.updateStatus);

export default router;
