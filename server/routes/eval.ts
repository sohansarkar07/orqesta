/**
 * POST /api/audience/eval
 * Body: { projectId, sourceEnvName, targetEnvName, identities, featureFilter? }
 *
 * Identity-level evaluation — evaluates synthetic identities against both
 * environments via the Flagsmith Flags API and classifies differences.
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireClient } from '../credentials.js';
import { runIdentityEvaluation } from '../../src/audience/evaluator.js';
import { wrap } from '../middleware/errors.js';
import { ConfigManager } from '../../src/config/index.js';

export const evalRouter = Router();

const TraitSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

const IdentitySchema = z.object({
  identifier: z.string().min(1),
  traits: z.array(TraitSchema).optional().default([]),
  description: z.string().optional(),
});

const EvalBody = z.object({
  projectId: z.number().int().positive(),
  sourceEnvName: z.string().min(1),
  targetEnvName: z.string().min(1),
  identities: z.array(IdentitySchema).min(1, 'At least one identity is required'),
  featureFilter: z.array(z.string()).optional(),
});

evalRouter.post(
  '/',
  wrap(async (req, res) => {
    const parsed = EvalBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      return;
    }

    const { projectId, sourceEnvName, targetEnvName, identities, featureFilter } = parsed.data;
    const client = requireClient();

    const environments = await client.getEnvironments(projectId);
    const sourceEnv = environments.find((e) => e.name.toLowerCase() === sourceEnvName.toLowerCase());
    const targetEnv = environments.find((e) => e.name.toLowerCase() === targetEnvName.toLowerCase());

    if (!sourceEnv) {
      res.status(404).json({ error: `Environment "${sourceEnvName}" not found.`, code: 'ENV_NOT_FOUND', available: environments.map((e) => e.name) });
      return;
    }
    if (!targetEnv) {
      res.status(404).json({ error: `Environment "${targetEnvName}" not found.`, code: 'ENV_NOT_FOUND', available: environments.map((e) => e.name) });
      return;
    }

    const flagsApiUrl = ConfigManager.getFlagsApiUrl();

    const report = await runIdentityEvaluation(
      sourceEnvName,
      targetEnvName,
      sourceEnv.api_key,
      targetEnv.api_key,
      flagsApiUrl,
      identities,
      featureFilter,
    );

    res.json(report);
  }),
);
