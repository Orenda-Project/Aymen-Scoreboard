import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

import authRouter from './routes/auth';
import workspacesRouter from './routes/workspaces';
import positionsRouter from './routes/positions';
import candidatesRouter from './routes/candidates';
import filesRouter from './routes/files';
import analyticsRouter from './routes/analytics';

const app = express();
const PORT = process.env.PORT ?? 3001;

// Required on Railway/reverse proxies (rate-limit + correct client IP)
app.set('trust proxy', 1);

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://scoreboard-production-c69b.up.railway.app',
  'http://localhost:5173',
  'http://localhost:3001',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // stricter limit for auth endpoints
  message: { error: 'Too many auth attempts, please try again later' },
});

app.use(limiter);
app.use('/api/auth', authLimiter);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Serve frontend static files ──────────────────────────────────────────────
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));
app.get('/', (_req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/workspaces', workspacesRouter);

// Positions nested under workspaces
app.use('/api/workspaces/:workspaceId/positions', positionsRouter);

// Candidates nested under positions
app.use('/api/positions/:positionId/candidates', candidatesRouter);

// Files — standalone (candidateId + columnId passed in body)
app.use('/api/files', filesRouter);

// Analytics
app.use('/api/workspaces/:workspaceId/analytics', analyticsRouter);

// ─── SPA fallback: serve index.html for non-API routes ──────────────────────────
app.use((_req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message, err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`);
});

export default app;
