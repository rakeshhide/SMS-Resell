import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Access forbidden. Administrator privileges required.'
    });
    return;
  }
  next();
}
