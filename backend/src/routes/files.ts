import { Router, Response } from 'express';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/requireAuth';
import prisma from '../lib/prisma';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

function validateFile(mimeType: string, size: number): string | null {
  if (!ALLOWED_MIME_TYPES.includes(mimeType))
    return 'File type not allowed. Accepted: PDF, DOC, DOCX, JPG, PNG';
  if (size > 10 * 1024 * 1024) return 'File too large. Maximum size is 10 MB';
  return null;
}

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
// Stores the file bytes in Postgres (no external storage service needed).
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

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: req.userId! } },
  });
  if (!member || member.role === 'viewer') {
    res.status(403).json({ error: 'Insufficient permissions to upload files' });
    return;
  }

  // Replace any existing file for this candidate+column
  const existing = await prisma.file.findFirst({ where: { candidateId, columnId } });
  if (existing) {
    await prisma.file.delete({ where: { id: existing.id } });
  }

  const file = await prisma.file.create({
    data: {
      candidateId,
      columnId,
      originalName: req.file.originalname,
      storageKey: '',
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      content: req.file.buffer,
      uploadedById: req.userId!,
    },
  });

  // Return metadata only — not the raw bytes
  res.status(201).json({
    id: file.id,
    candidateId: file.candidateId,
    columnId: file.columnId,
    originalName: file.originalName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    uploadedAt: file.uploadedAt,
  });
});

// ─── GET /api/files/:fileId/content ──────────────────────────────────────────
// Streams the raw file bytes back to the client with the correct Content-Type.
// The frontend fetches this with an Authorization header, converts to a Blob,
// creates an object URL, and sets that as the <iframe> src for PDF preview.
router.get('/:fileId/content', async (req: AuthRequest, res: Response) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.fileId } });
  if (!file || !file.content) { res.status(404).json({ error: 'File not found' }); return; }

  const workspaceId = await getWorkspaceId(file.candidateId);
  if (!workspaceId) { res.status(404).json({ error: 'File not found' }); return; }

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: req.userId! } },
  });
  if (!member) { res.status(403).json({ error: 'Access denied' }); return; }

  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
  res.setHeader('Content-Length', String(file.sizeBytes));
  res.send(file.content);
});

// ─── GET /api/files/:fileId/url ───────────────────────────────────────────────
// Kept for compatibility — returns metadata so the frontend knows the file exists.
// The actual bytes are served via /:fileId/content (requires auth header).
router.get('/:fileId/url', async (req: AuthRequest, res: Response) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.fileId } });
  if (!file) { res.status(404).json({ error: 'File not found' }); return; }

  const workspaceId = await getWorkspaceId(file.candidateId);
  if (!workspaceId) { res.status(404).json({ error: 'File not found' }); return; }

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: req.userId! } },
  });
  if (!member) { res.status(403).json({ error: 'Access denied' }); return; }

  res.json({
    url: `/api/files/${file.id}/content`,
    file: { id: file.id, originalName: file.originalName, mimeType: file.mimeType, sizeBytes: file.sizeBytes },
  });
});

// ─── DELETE /api/files/:fileId ────────────────────────────────────────────────
router.delete('/:fileId', async (req: AuthRequest, res: Response) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.fileId } });
  if (!file) { res.status(404).json({ error: 'File not found' }); return; }

  const workspaceId = await getWorkspaceId(file.candidateId);
  if (!workspaceId) { res.status(404).json({ error: 'File not found' }); return; }

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: req.userId! } },
  });
  if (!member || member.role === 'viewer') {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }

  await prisma.file.delete({ where: { id: file.id } });
  res.json({ message: 'File deleted' });
});

export default router;
