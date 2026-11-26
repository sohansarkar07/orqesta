/**
 * POST /api/settings/connect   — validate and store credentials
 * GET  /api/settings/status    — return connection status (key masked)
 * POST /api/settings/disconnect — clear credentials
 */

import { Router } from 'express';
import { z } from 'zod';
import {
  setCredentials,
  clearCredentials,
  getCredentials,
  maskKey,
  requireClient,
} from '../credentials.js';
import { wrap } from '../middleware/errors.js';

export const settingsRouter = Router();

const ConnectBody = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  apiUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
});

settingsRouter.post(
  '/connect',
  wrap(async (req, res) => {
    const parsed = ConnectBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: parsed.error.issues.map((i) => i.message).join('; '),
      });
      return;
    }

    const { apiKey, apiUrl } = parsed.data;
    setCredentials(apiKey, apiUrl ?? '');

    // Validate by attempting a real ping
    const client = requireClient();
    const ping = await client.ping();

    if (!ping.ok) {
      clearCredentials(); // don't store bad credentials
      res.status(401).json({
        error: 'Authentication failed. The API key was rejected by Flagsmith.',
        code: 'AUTH_FAILED',
      });
      return;
    }

    const orgs = ping.organisations ?? [];
    res.json({
      connected: true,
      maskedKey: maskKey(apiKey),
      organisations: orgs.map((o) => ({ id: o.id, name: o.name })),
    });
  }),
);

settingsRouter.get(
  '/status',
  wrap(async (_req, res) => {
    const creds = getCredentials();
    if (!creds) {
      res.json({ connected: false });
      return;
    }

    const client = requireClient();
    const ping = await client.ping();

    res.json({
      connected: ping.ok,
      maskedKey: maskKey(creds.apiKey),
      apiUrl: creds.apiUrl,
      organisations: ping.organisations?.map((o) => ({ id: o.id, name: o.name })) ?? [],
    });
  }),
);

settingsRouter.post(
  '/disconnect',
  wrap(async (_req, res) => {
    clearCredentials();
    res.json({ disconnected: true });
  }),
);
