import { Router } from 'express';
import { OTPController } from '../controllers/otpController';
import { authenticateApiKey } from '../middlewares/apiKeyAuthMiddleware';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// Developer API: Send OTP (Authenticated via API Key)
router.post('/send', authenticateApiKey, OTPController.sendOTP);

// Customer Dashboard: Transaction history and usage analytics
router.get('/transactions', authenticateJWT, OTPController.listTransactions);
router.get('/analytics', authenticateJWT, OTPController.getAnalyticsSummary);

export default router;
