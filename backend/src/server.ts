import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { pool } from './config/db';

import authRoutes from './routes/authRoutes';
import otpRoutes from './routes/otpRoutes';
import walletRoutes from './routes/walletRoutes';
import apiKeyRoutes from './routes/apiKeyRoutes';
import adminRoutes from './routes/adminRoutes';
import notificationRoutes from './routes/notificationRoutes';
import supportRoutes from './routes/supportRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, Razorpay server-to-server webhooks, curl)
    if (!origin) return callback(null, true);
    // Allow localhost or any vercel.app preview/production deployment or specified FRONTEND_URL
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.vercel.app') ||
      (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Razorpay-Signature', 'x-razorpay-signature']
}));

// Body Parser (retains raw bytes buffer for Razorpay HMAC webhook verification)
app.use(express.json({
  limit: '1mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error_code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please slow down.' }
});
app.use('/api/', globalLimiter);

// Specific Auth Brute Force Protection
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000, // 3000 login/register attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error_code: 'AUTH_THROTTLED', message: 'Too many authentication attempts. Please try again later.' }
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    const dbTest = await pool.query('SELECT 1 as healthy');
    res.json({
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbTest.rowCount === 1 ? 'CONNECTED' : 'DEGRADED',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'DOWN',
      database: 'UNREACHABLE',
      error: err.message
    });
  }
});

import { BillingService } from './services/billingService';

// Public dynamic pricing route (including volume tiers & settings)
app.get('/api/v1/pricing', async (req: Request, res: Response) => {
  try {
    const pricing = await BillingService.getActivePricing();
    const tiers = await BillingService.getActiveTiers();
    const settings = await BillingService.getSystemSettings();
    res.json({ success: true, pricing, tiers, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve pricing' });
  }
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/otp', otpRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/api-keys', apiKeyRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/support', supportRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error_code: 'NOT_FOUND',
    message: `Endpoint ${req.method} ${req.path} not found.`
  });
});

// Centralized Production Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[UNHANDLED_EXCEPTION]', {
    method: req.method,
    path: req.path,
    message: err.message,
    timestamp: new Date().toISOString()
  });

  // Never expose raw stack traces in responses
  res.status(err.status || 500).json({
    success: false,
    error_code: err.code || 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected service error occurred. Please try again later.' 
      : err.message
  });
});

if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`[SERVER] Enterprise OTP API Server running on port ${PORT}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[SERVER] Database: Connected to Neon PostgreSQL pool`);
  });

  process.on('SIGTERM', () => {
    console.log('[SERVER] SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      pool.end();
      console.log('[SERVER] HTTP server closed and database pool drained.');
      process.exit(0);
    });
  });
}

export default app;
