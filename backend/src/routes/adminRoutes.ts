import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';

const router = Router();

router.use(authenticateJWT);
router.use(requireAdmin);

router.get('/overview', AdminController.getOverview);
router.get('/users', AdminController.listUsers);
router.post('/users/status', AdminController.toggleUserStatus);
router.get('/pricing', AdminController.getPricing);
router.post('/pricing', AdminController.updatePricing);

// Pricing Tiers & Global Settings
router.get('/pricing-tiers', AdminController.listPricingTiers);
router.post('/pricing-tiers', AdminController.createPricingTier);
router.put('/pricing-tiers/:id', AdminController.updatePricingTier);
router.delete('/pricing-tiers/:id', AdminController.deletePricingTier);
router.patch('/pricing-tiers/:id/toggle', AdminController.togglePricingTier);
router.get('/settings', AdminController.getSettings);
router.put('/settings', AdminController.updateSettings);

router.post('/wallet/adjust', AdminController.manualAdjustment);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
