import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { hashApiKey } from '../utils/crypto';

export interface DeveloperApiRequest extends Request {
  apiKeyId?: string;
  apiUserId?: string;
  apiUser?: {
    id: string;
    email: string;
    fullName: string;
    status: string;
  };
}

export async function authenticateApiKey(
  req: DeveloperApiRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error_code: 'UNAUTHORIZED',
      message: 'Missing or malformed Authorization header. Expected format: Bearer sk_live_...'
    });
    return;
  }

  const rawKey = authHeader.split(' ')[1].trim();

  if (!rawKey.startsWith('sk_live_')) {
    res.status(401).json({
      success: false,
      error_code: 'INVALID_API_KEY_FORMAT',
      message: 'Invalid API key format.'
    });
    return;
  }

  const keyHash = hashApiKey(rawKey);

  try {
    const result = await pool.query(`
      SELECT 
        k.id AS api_key_id,
        k.status AS key_status,
        k.rate_limit_per_min,
        u.id AS user_id,
        u.email,
        u.full_name,
        u.status AS user_status
      FROM api_keys k
      JOIN users u ON k.user_id = u.id
      WHERE k.key_hash = $1
    `, [keyHash]);

    if (result.rowCount === 0) {
      res.status(401).json({
        success: false,
        error_code: 'INVALID_API_KEY',
        message: 'The provided API key does not exist or has been revoked.'
      });
      return;
    }

    const row = result.rows[0];

    if (row.key_status !== 'active') {
      res.status(403).json({
        success: false,
        error_code: 'KEY_REVOKED',
        message: 'This API key has been revoked and cannot be used.'
      });
      return;
    }

    if (row.user_status !== 'active') {
      res.status(403).json({
        success: false,
        error_code: 'ACCOUNT_SUSPENDED',
        message: 'Your developer account is currently inactive or suspended.'
      });
      return;
    }

    req.apiKeyId = row.api_key_id;
    req.apiUserId = row.user_id;
    req.apiUser = {
      id: row.user_id,
      email: row.email,
      fullName: row.full_name,
      status: row.user_status,
    };

    // Update last_used_at timestamp in background (non-blocking)
    pool.query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [row.api_key_id]).catch(() => {});

    next();
  } catch (err: any) {
    console.error('[API_AUTH] Verification error:', err.message);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: 'Failed to verify API authentication credentials.'
    });
  }
}
