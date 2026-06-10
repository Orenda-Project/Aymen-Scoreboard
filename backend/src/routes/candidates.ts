import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import prisma from '../lib/prisma';
import {
  createCandidateSchema,
  updateCandidateValuesSchema,
  reorderCandidatesSchema,
} from '../schemas/candidate.schema';

// mergeParams picks up :workspaceId and :positionId from parent routers
const router = Router({ mergeParams: true });

router.use(requireAuth);

// Helper: get workspaceId from positionId for role check
async function resolveWorkspaceId(positionId: string): Promise<string | null> {
  const pos = await prisma.position.findUnique({
    where: { id: positionId },
    select: { workspaceId: true },
  });
  return pos?.workspaceId ?? null;
}

// Inject workspaceId into req so requireRole can find it
router.use(async (req, res, next) => {
  const workspaceId = await resolveWorkspaceId(req.params.positionId);
  if (!workspaceId) { res.status(404).json({ error: 'Position not found' }); return; }
  req.resolvedWorkspaceId = workspaceId;
  req.params.workspaceId = workspaceId;
  next();
});

// ─── GET /api/positions/:positionId/candidates ────────────────────────────────
router.get('/', requireRole('viewer'), async (req: AuthRequest, res: Response) => {
  const candidates = await prisma.candidate.findMany({
    where: { positionId: req.params.positionId },
    include: {
      values: {
        include: { column: { select: { id: true, name: true, type: true } } },
      },
      files: {
        select: { id: true, columnId: true, originalName: true, mimeType: true, sizeBytes: true, uploadedAt: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  // Shape the response to match frontend expectations:
  // candidate.data = { [columnName]: value }
  const shaped = candidates.map((c) => ({
    id: c.id,
    positionId: c.positionId,
    sortOrder: c.sortOrder,
    createdAt: c.createdAt,
    data: Object.fromEntries(c.values.map((v) => [v.column.name, v.value])),
    files: c.files,
  }));

  res.json(shaped);
});

// ─── POST /api/positions/:positionId/candidates ───────────────────────────────
router.post('/', requireRole('collaborator'), validate(createCandidateSchema), async (req: AuthRequest, res: Response) => {
  const { positionId } = req.params;
  const { name, email, phone } = req.body;

  const maxOrder = await prisma.candidate.aggregate({
    where: { positionId },
    _max: { sortOrder: true },
  });

  // Find the fixed column IDs
  const columns = await prisma.column.findMany({
    where: { positionId, isFixed: true },
    select: { id: true, name: true },
  });

  const colMap = Object.fromEntries(columns.map((c) => [c.name, c.id]));

  const candidate = await prisma.candidate.create({
    data: {
      positionId,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      createdById: req.userId!,
      values: {
        createMany: {
          // candidateId is filled in by Prisma via the nested relation — passing it is a validation error
          data: [
            colMap['Name']  && name  && { columnId: colMap['Name'],  value: name },
            colMap['Email'] && email && { columnId: colMap['Email'], value: email },
            colMap['Phone'] && phone && { columnId: colMap['Phone'], value: phone },
          ].filter(Boolean) as { columnId: string; value: string }[],
          skipDuplicates: true,
        },
      },
    },
    include: { values: { include: { column: { select: { name: true } } } } },
  });

  res.status(201).json({
    id: candidate.id,
    positionId: candidate.positionId,
    data: Object.fromEntries(candidate.values.map((v) => [v.column.name, v.value])),
  });
});

// ─── PATCH /api/positions/:positionId/candidates/:candidateId/values ──────────
router.patch('/:candidateId/values', requireRole('collaborator'), validate(updateCandidateValuesSchema), async (req: AuthRequest, res: Response) => {
  const { candidateId } = req.params;
  const { values } = req.body as { values: Record<string, string | null> };

  const upserts = Object.entries(values).map(([columnId, value]) =>
    prisma.candidateValue.upsert({
      where: { candidateId_columnId: { candidateId, columnId } },
      update: { value, updatedById: req.userId! },
      create: { candidateId, columnId, value, updatedById: req.userId! },
    })
  );

  await prisma.$transaction(upserts);

  // Log to audit (non-fatal)
  const auditWorkspaceId = req.params.workspaceId;
  if (auditWorkspaceId) {
    prisma.auditLog.create({
      data: {
        workspaceId: auditWorkspaceId,
        userId: req.userId!!,
        action: 'UPDATE',
        entityType: 'candidate',
        entityId: candidateId,
        newValue: values,
      },
    }).catch((err: Error) => console.error('[AUDIT LOG ERROR]', err.message));
  }

  res.json({ message: 'Values updated' });
});

// ─── DELETE /api/positions/:positionId/candidates/:candidateId ────────────────
router.delete('/:candidateId', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  await prisma.candidate.delete({ where: { id: req.params.candidateId } });
  res.json({ message: 'Candidate deleted' });
});

// ─── PATCH /api/positions/:positionId/candidates/reorder ──────────────────────
router.patch('/reorder', requireRole('collaborator'), validate(reorderCandidatesSchema), async (req: AuthRequest, res: Response) => {
  const updates = (req.body.order as string[]).map((id: string, index: number) =>
    prisma.candidate.update({ where: { id }, data: { sortOrder: index } })
  );
  await prisma.$transaction(updates);
  res.json({ message: 'Candidates reordered' });
});

export default router;
