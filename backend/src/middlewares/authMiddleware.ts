import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. Missing or invalid Bearer token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_enterprise_otp_platform_2026_x98f4a';

  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };

    const result = await pool.query(
      'SELECT id, email, full_name, role, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rowCount === 0) {
      res.status(401).json({ success: false, message: 'User account not found.' });
      return;
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      res.status(403).json({ success: false, message: 'Account suspended or inactive. Please contact support.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
}
