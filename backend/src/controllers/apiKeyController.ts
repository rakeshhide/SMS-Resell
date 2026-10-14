import { Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';
import { generateApiKey, encryptApiKey, decryptApiKey } from '../utils/crypto';
import { NotificationService } from '../services/notificationService';

const createKeySchema = z.object({
  name: z.string().min(2, 'Key name must be at least 2 characters').max(60),
  rateLimitPerMin: z.number().int().min(10).max(100000).optional(),
});

const revealKeySchema = z.object({
  password: z.string().min(1, 'Password is required to reveal secret key'),
});

export class ApiKeyController {
  /**
   * Create a new API key
   * Returns secret raw key and safely stores encrypted copy for password-verified reveals.
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
      const encryptedKey = encryptApiKey(rawKey);

      const insertRes = await pool.query(`
        INSERT INTO api_keys (user_id, name, key_prefix, key_hash, status, rate_limit_per_min, encrypted_key)
        VALUES ($1, $2, $3, $4, 'active', $5, $6)
        RETURNING id, name, key_prefix, status, rate_limit_per_min, created_at
      `, [req.user.id, name, keyPrefix, keyHash, rateLimitPerMin || 120, encryptedKey]);

      const record = insertRes.rows[0];

      // Dynamic server notification for security event
      NotificationService.createNotification({
        userId: req.user.id,
        title: 'New API Key Generated',
        message: `API Key "${name}" (${keyPrefix}...) was created. Store your secret key securely.`,
        type: 'security',
        actionLabel: 'Manage Keys',
        actionUrl: '/api-keys'
      }).catch((err) => console.error('[NOTIFICATION] Error creating key notice:', err.message));

      res.status(201).json({
        success: true,
        message: 'API key generated successfully.',
        apiKey: {
          id: record.id,
          name: record.name,
          prefix: record.key_prefix,
          rawSecretKey: rawKey,
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

      const revokedRecord = updateRes.rows[0];

      // Dynamic server notification for security revocation
      NotificationService.createNotification({
        userId: req.user.id,
        title: 'API Key Revoked',
        message: `API Key "${revokedRecord.name || 'Key'}" has been revoked and can no longer make API requests.`,
        type: 'security',
        actionLabel: 'Manage Keys',
        actionUrl: '/api-keys'
      }).catch((err) => console.error('[NOTIFICATION] Error creating revoke notice:', err.message));

      res.json({
        success: true,
        message: 'API key has been permanently revoked.',
        apiKey: revokedRecord
      });
    } catch (err: any) {
      console.error('[API_KEY_CONTROLLER] Revoke key error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to revoke API key.' });
    }
  }

  /**
   * Reveal raw secret key with user password verification
   */
  public static async revealKey(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const keyId = req.params.id;
      const parsed = revealKeySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Password required' });
        return;
      }

      const { password } = parsed.data;

      // 1. Fetch user password hash
      const userRes = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
      if (userRes.rowCount === 0) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, userRes.rows[0].password_hash);
      if (!isValidPassword) {
        res.status(401).json({ success: false, message: 'Incorrect account password. Access denied.' });
        return;
      }

      // 2. Fetch API key record
      const keyRes = await pool.query(
        'SELECT id, name, key_prefix, encrypted_key, status FROM api_keys WHERE id = $1 AND user_id = $2',
        [keyId, req.user.id]
      );

      if (keyRes.rowCount === 0) {
        res.status(404).json({ success: false, message: 'API key not found' });
        return;
      }

      const keyRow = keyRes.rows[0];

      if (!keyRow.encrypted_key) {
        res.status(400).json({
          success: false,
          message: 'This key was created under an older legacy format without stored encrypted credentials. Please generate a new key.'
        });
        return;
      }

      const decryptedKey = decryptApiKey(keyRow.encrypted_key);

      res.json({
        success: true,
        message: 'Password verified successfully.',
        apiKey: {
          id: keyRow.id,
          name: keyRow.name,
          prefix: keyRow.key_prefix,
          rawSecretKey: decryptedKey,
          status: keyRow.status
        }
      });
    } catch (err: any) {
      console.error('[API_KEY_CONTROLLER] Reveal key error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to reveal API key.' });
    }
  }
}

