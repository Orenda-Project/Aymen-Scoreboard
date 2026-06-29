import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/requireAuth';
import { validate } from '../middleware/validate';
import { addEmailSchema } from '../schemas/access.schema';
import { syncMembershipsForEmail } from '../lib/membership';

const router = Router();

router.use(requireAuth);

// Owner-only: the current user must own (be the 'owner' member of) >=1 workspace
async function requireOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { userId } = req as AuthRequest;
  const count = await prisma.workspaceMember.count({ where: { userId, role: 'owner' } });
  if (count === 0) {
    res.status(403).json({ error: 'Only a board owner can manage access' });
    return;
  }
  next();
}

router.use(requireOwner);

// GET /api/access/allowlist — emails this owner has authorized
router.get('/allowlist', async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const entries = await prisma.authorizedEmail.findMany({
    where: { addedById: userId },
    orderBy: { createdAt: 'asc' },
  });

  // Annotate with whether each email already has an account
  const emails = entries.map((e) => e.email);
  const accounts = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  const hasAccount = new Set(accounts.map((a) => a.email));

  res.json(
    entries.map((e) => ({
      email: e.email,
      createdAt: e.createdAt,
      hasAccount: hasAccount.has(e.email),
    }))
  );
});

// POST /api/access/allowlist { email } — authorize an email
router.post('/allowlist', validate(addEmailSchema), async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const email = String(req.body.email).toLowerCase();

  const existing = await prisma.authorizedEmail.findUnique({ where: { email } });
  if (existing && existing.addedById !== userId) {
    res.status(409).json({ error: 'This email is already authorized by another owner' });
    return;
  }

  await prisma.authorizedEmail.upsert({
    where: { email },
    update: {},
    create: { email, addedById: userId! },
  });

  // If the user already exists, grant shared access immediately
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await syncMembershipsForEmail(user.id, email);
  }

  res.status(201).json({ email, hasAccount: !!user });
});

// DELETE /api/access/allowlist/:email — revoke access
router.delete('/allowlist/:email', async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const email = String(req.params.email).toLowerCase();

  const owner = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (owner && owner.email.toLowerCase() === email) {
    res.status(400).json({ error: "You can't revoke your own access" });
    return;
  }

  // Only allow removing an entry this owner added
  await prisma.authorizedEmail.deleteMany({ where: { email, addedById: userId } });

  // Revoke the user's access to this owner's workspaces + force re-auth
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const ownerWorkspaces = await prisma.workspace.findMany({
      where: { createdById: userId },
      select: { id: true },
    });
    const wsIds = ownerWorkspaces.map((w) => w.id);
    await prisma.$transaction([
      prisma.workspaceMember.deleteMany({
        where: { userId: user.id, workspaceId: { in: wsIds }, role: { not: 'owner' } },
      }),
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);
  }

  res.json({ message: 'Access revoked' });
});

export default router;
