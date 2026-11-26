/**
 * GET /api/forensics/audit
 *   ?projectId=<n>&environmentId=<n>&featureName=<s>&pageSize=<n>&page=<n>
 *
 * GET /api/forensics/audit/:id
 *   Returns the full audit entry with structured change_details
 */

import { Router } from 'express';
import { requireClient } from '../credentials.js';
import { wrap } from '../middleware/errors.js';

export const forensicsRouter = Router();

forensicsRouter.get(
  '/audit',
  wrap(async (req, res) => {
    const projectId = parseInt(String(req.query.projectId ?? ''), 10);
    if (isNaN(projectId)) {
      res.status(400).json({ error: 'projectId is required', code: 'VALIDATION_ERROR' });
      return;
    }

    const environmentId = req.query.environmentId
      ? parseInt(String(req.query.environmentId), 10)
      : undefined;
    const featureName = req.query.featureName
      ? String(req.query.featureName)
      : undefined;
    const pageSize = req.query.pageSize
      ? Math.min(parseInt(String(req.query.pageSize), 10), 100)
      : 50;
    const page = req.query.page
      ? parseInt(String(req.query.page), 10)
      : undefined;

    const client = requireClient();
    const result = await client.getAuditLog(projectId, {
      environmentId,
      featureName,
      pageSize,
      page,
    });

    res.json(result);
  }),
);

forensicsRouter.get(
  '/audit/:id',
  wrap(async (req, res) => {
    const id = parseInt(String(req.params['id'] ?? ''), 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid audit entry ID', code: 'VALIDATION_ERROR' });
      return;
    }

    const client = requireClient();
    const entry = await client.getAuditEntry(id);
    res.json(entry);
  }),
);
