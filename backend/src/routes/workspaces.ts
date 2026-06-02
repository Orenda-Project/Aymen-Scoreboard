import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import prisma from '../lib/prisma';
import { generateSecureToken } from '../lib/jwt';
import { sendInvitationEmail } from '../lib/email';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  acceptInviteSchema,
} from '../schemas/workspace.schema';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ─── GET /api/workspaces ──────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId: req.userId } } },
    include: {
      members: { select: { userId: true, role: true } },
      _count: { select: { positions: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(workspaces);
});

// ─── POST /api/workspaces ─────────────────────────────────────────────────────
router.post('/', validate(createWorkspaceSchema), async (req: AuthRequest, res: Response) => {
  const { name, description, icon, color } = req.body;

  const workspace = await prisma.workspace.create({
    data: {
      name,
      description,
      icon,
      color,
      createdById: req.userId,
      members: {
        create: { userId: req.userId, role: 'owner' },
      },
    },
    include: { members: true },
  });

  res.status(201).json(workspace);
});

// ─── GET /api/workspaces/:workspaceId ─────────────────────────────────────────
router.get('/:workspaceId', requireRole('viewer'), async (req: AuthRequest, res: Response) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: req.params.workspaceId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      },
      _count: { select: { positions: true } },
    },
  });
  if (!workspace) { res.status(404).json({ error: 'Workspace not found' }); return; }
  res.json(workspace);
});

// ─── PUT /api/workspaces/:workspaceId ─────────────────────────────────────────
router.put('/:workspaceId', requireRole('admin'), validate(updateWorkspaceSchema), async (req: AuthRequest, res: Response) => {
  const workspace = await prisma.workspace.update({
    where: { id: req.params.workspaceId },
    data: req.body,
  });
  res.json(workspace);
});

// ─── DELETE /api/workspaces/:workspaceId ──────────────────────────────────────
router.delete('/:workspaceId', requireRole('owner'), async (req: AuthRequest, res: Response) => {
  await prisma.workspace.delete({ where: { id: req.params.workspaceId } });
  res.json({ message: 'Workspace deleted' });
});

// ─── GET /api/workspaces/:workspaceId/members ─────────────────────────────────
router.get('/:workspaceId/members', requireRole('viewer'), async (req: AuthRequest, res: Response) => {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: req.params.workspaceId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { joinedAt: 'asc' },
  });
  res.json(members);
});

// ─── POST /api/workspaces/:workspaceId/invite ─────────────────────────────────
router.post('/:workspaceId/invite', requireRole('admin'), validate(inviteMemberSchema), async (req: AuthRequest, res: Response) => {
  const { email, role } = req.body;
  const { workspaceId } = req.params;

  // Check if already a member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const alreadyMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
    });
    if (alreadyMember) {
      res.status(409).json({ error: 'User is already a member of this workspace' });
      return;
    }
  }

  const token = generateSecureToken();
  const invitation = await prisma.invitation.create({
    data: {
      workspaceId,
      email,
      role,
      token,
      invitedById: req.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    include: {
      workspace: { select: { name: true } },
      invitedBy: { select: { name: true } },
    },
  });

  await sendInvitationEmail(
    email,
    invitation.invitedBy.name,
    invitation.workspace.name,
    role,
    token
  );

  res.status(201).json({ message: `Invitation sent to ${email}` });
});

// ─── POST /api/workspaces/accept-invite ──────────────────────────────────────
router.post('/accept-invite', validate(acceptInviteSchema), async (req: AuthRequest, res: Response) => {
  const { token } = req.body;

  const invite = await prisma.invitation.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    res.status(400).json({ error: 'Invitation is invalid or has expired' });
    return;
  }

  // User must be the invited email
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.email !== invite.email) {
    res.status(403).json({ error: 'This invitation was sent to a different email address' });
    return;
  }

  await prisma.$transaction([
    prisma.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId: req.userId, role: invite.role, invitedById: invite.invitedById },
    }),
    prisma.invitation.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ]);

  res.json({ message: 'Invitation accepted', workspaceId: invite.workspaceId });
});

// ─── PATCH /api/workspaces/:workspaceId/members/:userId ───────────────────────
router.patch('/:workspaceId/members/:userId', requireRole('admin'), validate(updateMemberRoleSchema), async (req: AuthRequest, res: Response) => {
  const { workspaceId, userId } = req.params;

  // Cannot change the owner's role
  const target = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (target?.role === 'owner') {
    res.status(403).json({ error: "Cannot change the owner's role" });
    return;
  }

  const updated = await prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId } },
    data: { role: req.body.role },
  });
  res.json(updated);
});

// ─── DELETE /api/workspaces/:workspaceId/members/:userId ──────────────────────
router.delete('/:workspaceId/members/:userId', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { workspaceId, userId } = req.params;

  const target = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (target?.role === 'owner') {
    res.status(403).json({ error: 'Cannot remove the workspace owner' });
    return;
  }

  await prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  res.json({ message: 'Member removed' });
});

export default router;
