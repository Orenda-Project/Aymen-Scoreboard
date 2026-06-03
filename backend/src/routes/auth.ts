import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { sendPasswordResetEmail } from '../lib/email';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateSecureToken,
} from '../lib/jwt';
import { requireAuth } from '../middleware/requireAuth';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../middleware/requireAuth';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.status(201).json({ user, accessToken, refreshToken });
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.user.update({ where: { id: user.id }, data: { updatedAt: new Date() } });

  res.json({
    user: { id: user.id, name: user.name, email: user.email },
    accessToken,
    refreshToken,
  });
});

// POST /api/auth/refresh
router.post('/refresh', validate(refreshSchema), async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  });

  if (!stored || stored.userId !== payload.userId || stored.expiresAt < new Date()) {
    res.status(401).json({ error: 'Refresh token not recognised' });
    return;
  }

  // Rotate — delete old, issue new
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const newAccessToken = signAccessToken(payload.userId);
  const newRefreshToken = signRefreshToken(payload.userId);

  await prisma.refreshToken.create({
    data: {
      userId: payload.userId,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
});

// POST /api/auth/logout
router.post('/logout', validate(refreshSchema), async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  await prisma.refreshToken.deleteMany({
    where: { tokenHash: hashToken(refreshToken) },
  });
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
  });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json(user);
});

// POST /api/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(200).json({ message: 'If an account exists, a reset link has been sent' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  await sendPasswordResetEmail(user.email, token);

  res.status(200).json({ message: 'If an account exists, a reset link has been sent' });
});

// POST /api/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.expiresAt < new Date()) {
    res.status(400).json({ error: 'Invalid or expired reset token' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  });

  await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

  res.status(200).json({ message: 'Password reset successfully' });
});

export default router;
