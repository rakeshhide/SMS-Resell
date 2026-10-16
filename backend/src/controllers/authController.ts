import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { pool } from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';
import { EmailService } from '../services/emailService';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Valid email address required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  companyName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email address required'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Valid reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: parsed.error.issues[0]?.message || 'Validation error'
        });
        return;
      }

      const { fullName, email, password, companyName } = parsed.data;

      // Check existing email
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing.rowCount && existing.rowCount > 0) {
        res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const userRes = await client.query(`
          INSERT INTO users (full_name, email, password_hash, company_name, role, status)
          VALUES ($1, $2, $3, $4, 'user', 'active')
          RETURNING id, full_name, email, role, status, created_at
        `, [fullName, email.toLowerCase(), passwordHash, companyName || null]);

        const newUser = userRes.rows[0];

        // Fetch dynamic Starter Tier from pricing_tiers
        const starterTierRes = await client.query(
          'SELECT id, otp_price FROM pricing_tiers WHERE is_active = true ORDER BY min_topup ASC LIMIT 1'
        );
        const starterTier = starterTierRes.rows[0];
        const initialOtpRate = starterTier ? parseFloat(starterTier.otp_price) : 0.80;
        const initialTierId = starterTier ? starterTier.id : 'TIER_1';

        // Create initial wallet with dynamic active starter tier
        await client.query(`
          INSERT INTO wallets (user_id, balance, currency, otp_rate, active_tier, highest_topup)
          VALUES ($1, 0.0000, 'INR', $2, $3, 0.0000)
        `, [newUser.id, initialOtpRate, initialTierId]);

        await client.query('COMMIT');

        const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_enterprise_otp_platform_2026_x98f4a';
        const token = jwt.sign(
          { userId: newUser.id, role: newUser.role },
          jwtSecret,
          { expiresIn: '7d' }
        );

        res.status(201).json({
          success: true,
          message: 'Account registered successfully.',
          token,
          user: {
            id: newUser.id,
            fullName: newUser.full_name,
            email: newUser.email,
            role: newUser.role,
            status: newUser.status,
          }
        });
      } catch (err: any) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error('[AUTH] Register error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to create account.' });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: parsed.error.issues[0]?.message || 'Validation error'
        });
        return;
      }

      const { email, password } = parsed.data;

      const userRes = await pool.query(`
        SELECT id, full_name, email, password_hash, role, status
        FROM users
        WHERE email = $1
      `, [email.toLowerCase()]);

      if (userRes.rowCount === 0) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password credentials.'
        });
        return;
      }

      const user = userRes.rows[0];

      if (user.status !== 'active') {
        res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Please contact platform administrators.'
        });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password credentials.'
        });
        return;
      }

      const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_enterprise_otp_platform_2026_x98f4a';
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        jwtSecret,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Authentication successful.',
        token,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          status: user.status,
        }
      });
    } catch (err: any) {
      console.error('[AUTH] Login error:', err.message);
      res.status(500).json({ success: false, message: 'Authentication failed.' });
    }
  }

  public static async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const userRes = await pool.query(`
        SELECT u.id, u.full_name, u.email, u.company_name, u.role, u.status, u.created_at,
               w.balance, w.currency
        FROM users u
        LEFT JOIN wallets w ON u.id = w.user_id
        WHERE u.id = $1
      `, [req.user.id]);

      if (userRes.rowCount === 0) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const u = userRes.rows[0];

      res.json({
        success: true,
        user: {
          id: u.id,
          fullName: u.full_name,
          email: u.email,
          companyName: u.company_name,
          role: u.role,
          status: u.status,
          createdAt: u.created_at,
          balance: parseFloat(u.balance || '0'),
          currency: u.currency || 'INR',
        }
      });
    } catch (err: any) {
      console.error('[AUTH] GetMe error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
    }
  }

  /**
   * POST /api/v1/auth/forgot-password
   * Dispatches secure password reset link to user's registered email
   */
  public static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: parsed.error.issues[0]?.message || 'Valid email required'
        });
        return;
      }

      const { email } = parsed.data;
      const normalizedEmail = email.toLowerCase().trim();

      const userRes = await pool.query(
        'SELECT id, full_name, email, status FROM users WHERE email = $1',
        [normalizedEmail]
      );

      // Return consistent success message to prevent user enumeration
      if (userRes.rowCount === 0) {
        res.json({
          success: true,
          message: 'If an account exists with this email address, a password reset link has been dispatched.'
        });
        return;
      }

      const user = userRes.rows[0];

      if (user.status !== 'active') {
        res.status(403).json({
          success: false,
          message: 'Account is suspended. Please contact support.'
        });
        return;
      }

      // Generate cryptographically secure random token (32 bytes hex = 64 characters)
      const rawToken = crypto.randomBytes(32).toString('hex');
      // Store token hash using SHA-256 in DB to prevent DB leakage attacks
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

      // Invalidate existing unused reset tokens for this user
      await pool.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
        [user.id]
      );

      // Insert new token
      await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [user.id, tokenHash, expiresAt]
      );

      // Send email asynchronously via Resend
      EmailService.sendPasswordResetEmail({
        userEmail: user.email,
        userName: user.full_name || 'Valued Developer',
        resetToken: rawToken,
      }).catch((err) => console.error('[EMAIL] Failed to send password reset email:', err.message));

      res.json({
        success: true,
        message: 'If an account exists with this email address, a password reset link has been dispatched.'
      });
    } catch (err: any) {
      console.error('[AUTH] Forgot password error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to process password reset request.' });
    }
  }

  /**
   * POST /api/v1/auth/reset-password
   * Validates reset token and sets new password with bcrypt
   */
  public static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: parsed.error.issues[0]?.message || 'Invalid parameters'
        });
        return;
      }

      const { token, password } = parsed.data;
      const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

      const tokenRes = await pool.query(
        'SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1',
        [tokenHash]
      );

      if (tokenRes.rowCount === 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired password reset link. Please request a new link.'
        });
        return;
      }

      const tokenRecord = tokenRes.rows[0];

      if (tokenRecord.used_at !== null) {
        res.status(400).json({
          success: false,
          message: 'This password reset link has already been used. Please request a new one.'
        });
        return;
      }

      if (new Date(tokenRecord.expires_at) < new Date()) {
        res.status(400).json({
          success: false,
          message: 'This password reset link has expired (1 hour limit). Please request a new one.'
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        await client.query(
          'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
          [passwordHash, tokenRecord.user_id]
        );

        await client.query(
          'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
          [tokenRecord.id]
        );

        await client.query('COMMIT');

        res.json({
          success: true,
          message: 'Your password has been successfully reset. You may now sign in with your new credentials.'
        });
      } catch (err: any) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error('[AUTH] Reset password error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to reset password.' });
    }
  }
}

