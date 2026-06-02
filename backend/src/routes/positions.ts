import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import prisma from '../lib/prisma';
import {
  createPositionSchema,
  updatePositionSchema,
  createColumnSchema,
  updateColumnSchema,
  reorderColumnsSchema,
  createCustomStatusSchema,
} from '../schemas/position.schema';

const router = Router({ mergeParams: true }); // mergeParams picks up :workspaceId

router.use(requireAuth);

// ─── GET /api/workspaces/:workspaceId/positions ───────────────────────────────
router.get('/', requireRole('viewer'), async (req: AuthRequest, res: Response) => {
  const positions = await prisma.position.findMany({
    where: { workspaceId: req.params.workspaceId },
    include: {
      columns: { where: { isVisible: true }, orderBy: { sortOrder: 'asc' } },
      customStatuses: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { candidates: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });
  res.json(positions);
});

// ─── POST /api/workspaces/:workspaceId/positions ──────────────────────────────
router.post('/', requireRole('admin'), validate(createPositionSchema), async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.params;
  const { name, description, color } = req.body;

  const maxOrder = await prisma.position.aggregate({
    where: { workspaceId },
    _max: { sortOrder: true },
  });

  const position = await prisma.position.create({
    data: {
      workspaceId,
      name,
      description,
      color,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      createdById: req.userId,
      // Default columns matching the frontend defaults
      columns: {
        createMany: {
          data: [
            { name: 'Name',   type: 'text',   isFixed: true,  isVisible: true,  sortOrder: 0 },
            { name: 'Email',  type: 'email',  isFixed: true,  isVisible: false, sortOrder: 1 },
            { name: 'Phone',  type: 'phone',  isFixed: true,  isVisible: false, sortOrder: 2 },
            { name: 'Status', type: 'status', isFixed: false, isVisible: true,  sortOrder: 3 },
          ],
        },
      },
    },
    include: {
      columns: { orderBy: { sortOrder: 'asc' } },
      customStatuses: true,
    },
  });

  res.status(201).json(position);
});

// ─── PUT /api/workspaces/:workspaceId/positions/:positionId ───────────────────
router.put('/:positionId', requireRole('admin'), validate(updatePositionSchema), async (req: AuthRequest, res: Response) => {
  const position = await prisma.position.update({
    where: { id: req.params.positionId },
    data: req.body,
  });
  res.json(position);
});

// ─── PATCH /:positionId/toggle-active ─────────────────────────────────────────
router.patch('/:positionId/toggle-active', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const current = await prisma.position.findUnique({ where: { id: req.params.positionId }, select: { isActive: true } });
  const position = await prisma.position.update({
    where: { id: req.params.positionId },
    data: { isActive: !current?.isActive },
  });
  res.json(position);
});

// ─── DELETE /api/workspaces/:workspaceId/positions/:positionId ────────────────
router.delete('/:positionId', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  await prisma.position.delete({ where: { id: req.params.positionId } });
  res.json({ message: 'Position deleted' });
});

// ═════════════════════════════════════════════════════════════════════════════
// COLUMNS
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/workspaces/:workspaceId/positions/:positionId/columns
router.get('/:positionId/columns', requireRole('viewer'), async (req: AuthRequest, res: Response) => {
  const columns = await prisma.column.findMany({
    where: { positionId: req.params.positionId },
    orderBy: { sortOrder: 'asc' },
  });
  res.json(columns);
});

// POST /api/workspaces/:workspaceId/positions/:positionId/columns
router.post('/:positionId/columns', requireRole('admin'), validate(createColumnSchema), async (req: AuthRequest, res: Response) => {
  const maxOrder = await prisma.column.aggregate({
    where: { positionId: req.params.positionId },
    _max: { sortOrder: true },
  });

  const column = await prisma.column.create({
    data: {
      positionId: req.params.positionId,
      name: req.body.name,
      type: req.body.type,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  res.status(201).json(column);
});

// PUT /api/workspaces/:workspaceId/positions/:positionId/columns/:columnId
router.put('/:positionId/columns/:columnId', requireRole('admin'), validate(updateColumnSchema), async (req: AuthRequest, res: Response) => {
  const column = await prisma.column.update({
    where: { id: req.params.columnId },
    data: req.body,
  });
  res.json(column);
});

// DELETE /api/workspaces/:workspaceId/positions/:positionId/columns/:columnId
router.delete('/:positionId/columns/:columnId', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const column = await prisma.column.findUnique({ where: { id: req.params.columnId } });
  if (column?.isFixed) {
    res.status(403).json({ error: 'Cannot delete a fixed column' });
    return;
  }
  await prisma.column.delete({ where: { id: req.params.columnId } });
  res.json({ message: 'Column deleted' });
});

// PATCH /positions/:positionId/columns/reorder
router.patch('/:positionId/columns/reorder', requireRole('admin'), validate(reorderColumnsSchema), async (req: AuthRequest, res: Response) => {
  const updates = (req.body.order as string[]).map((id: string, index: number) =>
    prisma.column.update({ where: { id }, data: { sortOrder: index } })
  );
  await prisma.$transaction(updates);
  res.json({ message: 'Columns reordered' });
});

// ═════════════════════════════════════════════════════════════════════════════
// CUSTOM STATUSES
// ═════════════════════════════════════════════════════════════════════════════

// GET /positions/:positionId/statuses
router.get('/:positionId/statuses', requireRole('viewer'), async (req: AuthRequest, res: Response) => {
  const statuses = await prisma.customStatus.findMany({
    where: { positionId: req.params.positionId },
    orderBy: { sortOrder: 'asc' },
  });
  res.json(statuses);
});

// POST /positions/:positionId/statuses
router.post('/:positionId/statuses', requireRole('collaborator'), validate(createCustomStatusSchema), async (req: AuthRequest, res: Response) => {
  const { name, colorClass } = req.body;
  const maxOrder = await prisma.customStatus.aggregate({
    where: { positionId: req.params.positionId },
    _max: { sortOrder: true },
  });

  const status = await prisma.customStatus.create({
    data: {
      positionId: req.params.positionId,
      name,
      colorClass,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  res.status(201).json(status);
});

// DELETE /positions/:positionId/statuses/:statusId
router.delete('/:positionId/statuses/:statusId', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  await prisma.customStatus.delete({ where: { id: req.params.statusId } });
  res.json({ message: 'Status deleted' });
});

export default router;
