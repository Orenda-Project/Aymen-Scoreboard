import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';

// Type alias for convenience — Express.Request is now augmented with userId/memberRole
export type AuthRequest = Request;

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Token expired or invalid' });
    return;
  }

  req.userId = payload.userId;
  next();
}
