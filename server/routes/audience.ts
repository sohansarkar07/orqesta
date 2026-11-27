/**
 * POST /api/audience/check
 * Body: { projectId: number, sourceEnvName: string, targetEnvName: string }
 *
 * Runs the Audience Regression Guard — compares multivariate flag allocations
 * between source and target environments and reports allocation shifts.
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireClient } from '../credentials.js';
import { buildAudienceSnapshot, runAudienceGuard } from '../../src/audience/guard.js';
import { wrap } from '../middleware/errors.js';

export const audienceRouter = Router();

const CheckBody = z.object({
  projectId: z.number().int().positive(),
  sourceEnvName: z.string().min(1),
  targetEnvName: z.string().min(1),
});

audienceRouter.post(
  '/check',
  wrap(async (req, res) => {
    const parsed = CheckBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      return;
    }

    const { projectId, sourceEnvName, targetEnvName } = parsed.data;
    const client = requireClient();

    const environments = await client.getEnvironments(projectId);

    const sourceEnv = environments.find((e) => e.name.toLowerCase() === sourceEnvName.toLowerCase());
    const targetEnv = environments.find((e) => e.name.toLowerCase() === targetEnvName.toLowerCase());

    if (!sourceEnv) {
      res.status(404).json({
        error: `Environment "${sourceEnvName}" not found.`,
        code: 'ENV_NOT_FOUND',
        available: environments.map((e) => e.name),
      });
      return;
    }
    if (!targetEnv) {
      res.status(404).json({
        error: `Environment "${targetEnvName}" not found.`,
        code: 'ENV_NOT_FOUND',
        available: environments.map((e) => e.name),
      });
      return;
    }

    const [features, sourceStates, targetStates] = await Promise.all([
      client.getFeatures(projectId),
      client.getFeatureStates(sourceEnv.api_key),
      client.getFeatureStates(targetEnv.api_key),
    ]);

    const beforeSnapshots = buildAudienceSnapshot(sourceEnvName, sourceStates, features);
    const afterSnapshots  = buildAudienceSnapshot(targetEnvName, targetStates, features);
    const report = runAudienceGuard(sourceEnvName, targetEnvName, beforeSnapshots, afterSnapshots);

    res.json(report);
  }),
);
