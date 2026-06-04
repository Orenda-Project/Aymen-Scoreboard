import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { WorkspaceRole } from '@prisma/client';

const ROLE_RANK: Record<WorkspaceRole, number> = {
  owner: 4,
  admin: 3,
  collaborator: 2,
  viewer: 1,
};

/**
 * Middleware factory. Call after requireAuth.
 * Attaches req.memberRole for downstream use.
 *
 * Example: router.delete('/:id', requireAuth, requireRole('admin'), handler)
 */
export function requireRole(minRole: WorkspaceRole) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // workspaceId can come from route params directly or via nested resource
    const workspaceId = req.params.workspaceId ?? req.resolvedWorkspaceId;

    if (!workspaceId) {
      res.status(400).json({ error: 'workspaceId is required' });
      return;
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: req.userId! } },
    });

    if (!member) {
      res.status(403).json({ error: 'You are not a member of this workspace' });
      return;
    }

    if (ROLE_RANK[member.role] < ROLE_RANK[minRole]) {
      res.status(403).json({ error: `This action requires the '${minRole}' role or higher` });
      return;
    }

    req.memberRole = member.role;
    next();
  };
}
