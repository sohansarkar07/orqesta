/**
 * POST /api/compare
 * Body: { projectId: number, sourceEnvName: string, targetEnvName: string }
 * Returns: DriftReport (api_key fields stripped before sending to client)
 *
 * Uses the real DriftComparator — zero fabricated data.
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireClient } from '../credentials.js';
import { DriftComparator } from '../../src/drift/comparator.js';
import { wrap } from '../middleware/errors.js';
import type { FlagsmithEnvironmentDocument } from '../../src/types/flagsmith.js';

export const compareRouter = Router();

const CompareBody = z.object({
  projectId: z.number().int().positive(),
  sourceEnvName: z.string().min(1),
  targetEnvName: z.string().min(1),
});

compareRouter.post(
  '/',
  wrap(async (req, res) => {
    const parsed = CompareBody.safeParse(req.body);
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

    const sourceEnv = environments.find(
      (e) => e.name.toLowerCase() === sourceEnvName.toLowerCase(),
    );
    const targetEnv = environments.find(
      (e) => e.name.toLowerCase() === targetEnvName.toLowerCase(),
    );

    if (!sourceEnv) {
      res.status(404).json({
        error: `Environment "${sourceEnvName}" not found in project ${projectId}.`,
        code: 'ENV_NOT_FOUND',
        available: environments.map((e) => e.name),
      });
      return;
    }
    if (!targetEnv) {
      res.status(404).json({
        error: `Environment "${targetEnvName}" not found in project ${projectId}.`,
        code: 'ENV_NOT_FOUND',
        available: environments.map((e) => e.name),
      });
      return;
    }

    // Fetch real feature states from Flagsmith
    const [sourceStates, targetStates] = await Promise.all([
      client.getFeatureStates(sourceEnv.api_key),
      client.getFeatureStates(targetEnv.api_key),
    ]);

    // Build minimal environment documents for the comparator
    const toDoc = (
      states: typeof sourceStates,
      apiKey: string,
      envId: number,
    ): FlagsmithEnvironmentDocument => ({
      id: envId,
      api_key: apiKey,
      project: { id: projectId, name: '', organisation: 0, hide_disabled_flags: false, segments: [] },
      feature_states: states.map((s) => ({
        id: s.id,
        feature: s.feature,
        enabled: s.enabled,
        value: s.feature_state_value,
        multivariate_feature_state_values: s.multivariate_feature_state_values,
      })),
    });

    const drift = DriftComparator.compare(
      toDoc(sourceStates, sourceEnv.api_key, sourceEnv.id),
      sourceEnv.name,
      toDoc(targetStates, targetEnv.api_key, targetEnv.id),
      targetEnv.name,
    );

    // Strip api_key before sending to browser
    res.json({
      ...drift,
      source: { environment: drift.source.environment },
      target: { environment: drift.target.environment },
    });
  }),
);
