import prisma from './prisma';

/**
 * Ensure an allowlisted user has collaborator access to the shared board.
 *
 * For the given user, looks up the AuthorizedEmail entry for their email and
 * grants a `collaborator` WorkspaceMember row on every workspace owned by the
 * owner who authorized them. Idempotent (upsert on the workspaceId+userId
 * unique key) and never downgrades an existing owner/admin membership.
 *
 * No-op if the email isn't allowlisted (e.g. a pre-existing user who owns
 * their own data) or the authorizer owns no workspaces.
 */
export async function syncMembershipsForEmail(userId: string, email: string): Promise<void> {
  const entry = await prisma.authorizedEmail.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!entry) return;

  const ownerWorkspaces = await prisma.workspace.findMany({
    where: { createdById: entry.addedById },
    select: { id: true },
  });
  if (ownerWorkspaces.length === 0) return;

  await prisma.$transaction(
    ownerWorkspaces.map((w) =>
      prisma.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: w.id, userId } },
        update: {}, // never downgrade an existing role
        create: { workspaceId: w.id, userId, role: 'collaborator', invitedById: entry.addedById },
      })
    )
  );
}
