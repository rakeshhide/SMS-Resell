import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

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

        // Create initial wallet
        await client.query(`
          INSERT INTO wallets (user_id, balance, currency)
          VALUES ($1, 0.0000, 'INR')
        `, [newUser.id]);

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
}
