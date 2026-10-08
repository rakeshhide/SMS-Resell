import { Response } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';
import { generateApiKey } from '../utils/crypto';

const createKeySchema = z.object({
  name: z.string().min(2, 'Key name must be at least 2 characters').max(60),
  rateLimitPerMin: z.number().int().min(10).max(600).optional(),
});

export class ApiKeyController {
  /**
   * Create a new API key
   * Returns secret raw key ONLY ONCE.
   */
  public static async createKey(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const parsed = createKeySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Invalid input' });
        return;
      }

      const { name, rateLimitPerMin } = parsed.data;
      const { rawKey, keyPrefix, keyHash } = generateApiKey();

      const insertRes = await pool.query(`
        INSERT INTO api_keys (user_id, name, key_prefix, key_hash, status, rate_limit_per_min)
        VALUES ($1, $2, $3, $4, 'active', $5)
        RETURNING id, name, key_prefix, status, rate_limit_per_min, created_at
      `, [req.user.id, name, keyPrefix, keyHash, rateLimitPerMin || 120]);

      const record = insertRes.rows[0];

      res.status(201).json({
        success: true,
        message: 'API key generated successfully. Copy your secret key now; it will never be displayed again.',
        apiKey: {
          id: record.id,
          name: record.name,
          prefix: record.key_prefix,
          rawSecretKey: rawKey, // Shown only once
          status: record.status,
          rateLimitPerMin: record.rate_limit_per_min,
          createdAt: record.created_at,
        }
      });
    } catch (err: any) {
      console.error('[API_KEY_CONTROLLER] Create key error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to generate API key.' });
    }
  }

  /**
   * List API keys for logged in user (safe - no raw keys or hashes exposed)
   */
  public static async listKeys(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await pool.query(`
        SELECT id, name, key_prefix, status, rate_limit_per_min, last_used_at, created_at
        FROM api_keys
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [req.user.id]);

      res.json({
        success: true,
        keys: result.rows
      });
    } catch (err: any) {
      console.error('[API_KEY_CONTROLLER] List keys error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to retrieve API keys.' });
    }
  }

  /**
   * Revoke an existing API key immediately
   */
  public static async revokeKey(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const keyId = req.params.id;

      const updateRes = await pool.query(`
        UPDATE api_keys
        SET status = 'revoked'
        WHERE id = $1 AND user_id = $2
        RETURNING id, name, status
      `, [keyId, req.user.id]);

      if (updateRes.rowCount === 0) {
        res.status(404).json({ success: false, message: 'API key not found or already revoked.' });
        return;
      }

      res.json({
        success: true,
        message: 'API key has been permanently revoked.',
        apiKey: updateRes.rows[0]
      });
    } catch (err: any) {
      console.error('[API_KEY_CONTROLLER] Revoke key error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to revoke API key.' });
    }
  }
}
