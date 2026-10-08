import { Router } from 'express';
import { ApiKeyController } from '../controllers/apiKeyController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateJWT);

router.post('/', ApiKeyController.createKey);
router.get('/', ApiKeyController.listKeys);
router.delete('/:id', ApiKeyController.revokeKey);

export default router;
