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
  environmentKey: z.string().optional(),
  flagsApiUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
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

    const { apiKey, apiUrl, environmentKey, flagsApiUrl } = parsed.data;
    setCredentials(apiKey, apiUrl ?? '', environmentKey, flagsApiUrl ?? '');

    // Validate by attempting a real ping
    const client = requireClient();
    const ping = await client.ping();

    if (!ping.management.ok) {
      clearCredentials();
      res.status(401).json({
        error: 'Authentication failed. The API key was rejected by Flagsmith.',
        code: 'AUTH_FAILED',
      });
      return;
    }

    const orgs = ping.management.organisations ?? [];
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
    if (!creds || !creds.apiToken) {
      res.json({ connected: false });
      return;
    }

    const client = requireClient();
    const ping = await client.ping();

    res.json({
      connected: ping.management.ok,
      maskedKey: maskKey(creds.apiToken),
      apiUrl: creds.apiUrl,
      organisations: ping.management.organisations?.map((o) => ({ id: o.id, name: o.name })) ?? [],
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
