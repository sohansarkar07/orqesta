/**
 * Orqesta API Server
 *
 * Architecture:
 *   React frontend → Express (this file) → Flagsmith core modules → Flagsmith API
 *
 * Security model:
 *   - Management API tokens are stored server-side only (credentials.ts)
 *   - Tokens are never sent to the browser
 *   - Every response strips api_key fields before serialisation
 *   - CORS is restricted to localhost origins in production
 */

import express from 'express';
import cors from 'cors';
import { settingsRouter } from './routes/settings.js';
import { environmentsRouter } from './routes/environments.js';
import { compareRouter } from './routes/compare.js';
import { syncRouter } from './routes/sync.js';
import { forensicsRouter } from './routes/forensics.js';
import { policyRouter } from './routes/policy.js';
import { handleError } from './middleware/errors.js';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:4173', // Vite preview
    'http://localhost:3001', // Same-origin in production
  ],
  credentials: false, // no cookies — token is server-side only
}));

app.use(express.json({ limit: '1mb' }));

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'orqesta-api', version: '0.1.0' });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/settings',    settingsRouter);
app.use('/api/environments', environmentsRouter);
app.use('/api/compare',     compareRouter);
app.use('/api/sync',        syncRouter);
app.use('/api/forensics',   forensicsRouter);
app.use('/api/policy',      policyRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
});

// ─── Error handler ────────────────────────────────────────────────────────────

app.use(handleError);

// ─── Start ────────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Orqesta API server running at http://localhost:${PORT}`);
    console.log('Set FLAGSMITH_API_KEY env var or POST to /api/settings/connect');
  });
}

export { app };
