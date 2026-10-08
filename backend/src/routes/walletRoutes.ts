import { Router } from 'express';
import { WalletController } from '../controllers/walletController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// Customer Wallet routes
router.get('/balance', authenticateJWT, WalletController.getBalance);
router.get('/ledger', authenticateJWT, WalletController.getLedger);
router.post('/create-order', authenticateJWT, WalletController.createOrder);
router.post('/verify-payment', authenticateJWT, WalletController.verifyPayment);

// Razorpay Webhook (Publicly accessible with HMAC signature verification)
router.post('/webhook', WalletController.razorpayWebhook);

export default router;
