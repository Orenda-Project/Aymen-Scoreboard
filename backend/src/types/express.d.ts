import { WorkspaceRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      memberRole?: WorkspaceRole;
      resolvedWorkspaceId?: string;
    }
  }
}

export {};
