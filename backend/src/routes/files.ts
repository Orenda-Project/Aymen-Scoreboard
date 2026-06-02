import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import prisma from '../lib/prisma';
import { uploadFile, getSignedDownloadUrl, deleteFile, validateFile } from '../lib/s3';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(requireAuth);

// Helper: resolve workspaceId from candidateId
async function getWorkspaceId(candidateId: string): Promise<string | null> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { position: { select: { workspaceId: true } } },
  });
  return candidate?.position.workspaceId ?? null;
}

// ─── POST /api/files/upload ───────────────────────────────────────────────────
// Body: multipart/form-data with fields: file, candidateId, columnId
router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }

  const { candidateId, columnId } = req.body;
  if (!candidateId || !columnId) {
    res.status(400).json({ error: 'candidateId and columnId are required' });
    return;
  }

  const validationError = validateFile(req.file.mimetype, req.file.size);
  if (validationError) { res.status(400).json({ error: validationError }); return; }

  // Permission check
  const workspaceId = await getWorkspaceId(candidateId);
  if (!workspaceId) { res.status(404).json({ error: 'Candidate not found' }); return; }
  req.params.workspaceId = workspaceId;
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: req.userId } },
  });
  if (!member || member.role === 'viewer') {
    res.status(403).json({ error: 'Insufficient permissions to upload files' });
    return;
  }

  // Delete existing file for this candidate+column if any
  const existing = await prisma.file.findFirst({ where: { candidateId, columnId } });
  if (existing) {
    await deleteFile(existing.storageKey).catch(() => {});
    await prisma.file.delete({ where: { id: existing.id } });
  }

  const storageKey = await uploadFile(req.file.buffer, req.file.mimetype, req.file.originalname);

  const file = await prisma.file.create({
    data: {
      candidateId,
      columnId,
      originalName: req.file.originalname,
      storageKey,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      uploadedById: req.userId,
    },
  });

  res.status(201).json(file);
});

// ─── GET /api/files/:fileId/url ───────────────────────────────────────────────
router.get('/:fileId/url', async (req: AuthRequest, res: Response) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.fileId } });
  if (!file) { res.status(404).json({ error: 'File not found' }); return; }

  // Check membership
  const workspaceId = await getWorkspaceId(file.candidateId);
  if (!workspaceId) { res.status(404).json({ error: 'File not found' }); return; }

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: req.userId } },
  });
  if (!member) { res.status(403).json({ error: 'Access denied' }); return; }

  const signedUrl = await getSignedDownloadUrl(file.storageKey);
  res.json({ url: signedUrl, expiresIn: 900, file: { id: file.id, originalName: file.originalName, mimeType: file.mimeType, sizeBytes: file.sizeBytes } });
});

// ─── DELETE /api/files/:fileId ────────────────────────────────────────────────
router.delete('/:fileId', async (req: AuthRequest, res: Response) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.fileId } });
  if (!file) { res.status(404).json({ error: 'File not found' }); return; }

  const workspaceId = await getWorkspaceId(file.candidateId);
  if (!workspaceId) { res.status(404).json({ error: 'File not found' }); return; }

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: req.userId } },
  });
  if (!member || member.role === 'viewer') {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }

  await deleteFile(file.storageKey).catch(() => {});
  await prisma.file.delete({ where: { id: file.id } });

  res.json({ message: 'File deleted' });
});

export default router;
