import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import prisma from '../lib/prisma';

const router = Router({ mergeParams: true });

router.use(requireAuth);

// ─── GET /api/workspaces/:workspaceId/analytics ───────────────────────────────
router.get('/', requireRole('viewer'), async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.params;

  const positions = await prisma.position.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { candidates: true } },
      candidates: {
        include: {
          values: {
            where: { column: { name: 'Status' } },
            select: { value: true },
          },
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  const summary = positions.map((pos) => {
    const statusCounts: Record<string, number> = {};
    pos.candidates.forEach((c) => {
      const status = c.values[0]?.value ?? 'Unknown';
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    });

    return {
      positionId: pos.id,
      positionName: pos.name,
      color: pos.color,
      isActive: pos.isActive,
      totalCandidates: pos._count.candidates,
      statusBreakdown: statusCounts,
    };
  });

  const totalCandidates = summary.reduce((acc, p) => acc + p.totalCandidates, 0);

  res.json({ totalCandidates, positions: summary });
});

// ─── GET /api/workspaces/:workspaceId/analytics/positions/:positionId ─────────
router.get('/positions/:positionId', requireRole('viewer'), async (req: AuthRequest, res: Response) => {
  const { positionId } = req.params;

  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: {
      customStatuses: true,
      candidates: {
        include: {
          values: {
            include: { column: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!position) { res.status(404).json({ error: 'Position not found' }); return; }

  const statusCounts: Record<string, number> = {};
  position.candidates.forEach((c) => {
    const statusValue = c.values.find((v) => v.column.name === 'Status');
    const status = statusValue?.value ?? 'Unknown';
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  });

  res.json({
    positionId: position.id,
    positionName: position.name,
    color: position.color,
    isActive: position.isActive,
    totalCandidates: position.candidates.length,
    statusBreakdown: statusCounts,
    customStatuses: position.customStatuses,
  });
});

export default router;
