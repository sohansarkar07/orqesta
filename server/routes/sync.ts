/**
 * POST /api/sync/plan     — generate a real sync plan from drift
 * POST /api/sync/apply    — execute real PATCH operations (or dry-run)
 *
 * Both routes use the existing SyncPlanner and SyncExecutor.
 * The plan is held server-side; a planId is returned to the browser.
 * This prevents the browser from ever holding or modifying the plan.
 */

import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { requireClient } from '../credentials.js';
import { DriftComparator } from '../../src/drift/comparator.js';
import { SyncPlanner } from '../../src/sync/planner.js';
import { SyncExecutor } from '../../src/sync/executor.js';
import { buildEnvDoc } from '../../src/utils/envDocBuilder.js';
import { wrap } from '../middleware/errors.js';
import type { SyncPlan } from '../../src/types/sync.js';

export const syncRouter = Router();

// Server-side plan store: planId → SyncPlan
// Plans expire after 30 minutes to prevent stale state
const planStore = new Map<string, { plan: SyncPlan; expiresAt: number }>();
const PLAN_TTL_MS = 30 * 60 * 1000;

function cleanExpiredPlans() {
  const now = Date.now();
  for (const [id, entry] of planStore) {
    if (entry.expiresAt < now) planStore.delete(id);
  }
}

function sanitisePlan(plan: SyncPlan) {
  // Strip api_key from plan before sending to browser
  return {
    ...plan,
    source: { environment: plan.source.environment },
    target: { environment: plan.target.environment },
    // targetStateSnapshot stays server-side — not needed in browser
    targetStateSnapshot: undefined,
  };
}

const PlanBody = z.object({
  projectId: z.number().int().positive(),
  sourceEnvName: z.string().min(1),
  targetEnvName: z.string().min(1),
});

const ApplyBody = z.object({
  planId: z.string().min(1),
  dryRun: z.boolean().default(false),
  // selectedOperationIds: if provided, only apply these operations
  selectedOperationIds: z.array(z.string()).optional(),
});

syncRouter.post(
  '/plan',
  wrap(async (req, res) => {
    const parsed = PlanBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: parsed.error.issues.map((i) => i.message).join('; '),
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
      res.status(404).json({ error: `Environment "${sourceEnvName}" not found.`, code: 'ENV_NOT_FOUND' });
      return;
    }
    if (!targetEnv) {
      res.status(404).json({ error: `Environment "${targetEnvName}" not found.`, code: 'ENV_NOT_FOUND' });
      return;
    }

    const [features, sourceStates, targetStates] = await Promise.all([
      client.getFeatures(projectId),
      client.getFeatureStates(sourceEnv.api_key),
      client.getFeatureStates(targetEnv.api_key),
    ]);

    const sourceDoc = buildEnvDoc(sourceEnv.id, sourceEnv.api_key, projectId, sourceStates, features);
    const targetDoc = buildEnvDoc(targetEnv.id, targetEnv.api_key, projectId, targetStates, features);

    const drift = DriftComparator.compare(sourceDoc, sourceEnv.name, targetDoc, targetEnv.name);

    if (drift.drifts.length === 0) {
      res.json({ noDrift: true, message: 'Environments are already in sync.' });
      return;
    }

    const plan = SyncPlanner.buildPlan(drift, targetDoc.feature_states as any);

    // Store server-side
    cleanExpiredPlans();
    const planId = crypto.randomUUID();
    planStore.set(planId, { plan, expiresAt: Date.now() + PLAN_TTL_MS });

    res.json({
      planId,
      plan: sanitisePlan(plan),
    });
  }),
);

syncRouter.post(
  '/apply',
  wrap(async (req, res) => {
    const parsed = ApplyBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: parsed.error.issues.map((i) => i.message).join('; '),
      });
      return;
    }

    const { planId, dryRun, selectedOperationIds } = parsed.data;

    const entry = planStore.get(planId);
    if (!entry) {
      res.status(404).json({
        error: 'Plan not found or expired. Generate a new plan first.',
        code: 'PLAN_NOT_FOUND',
      });
      return;
    }

    if (entry.expiresAt < Date.now()) {
      planStore.delete(planId);
      res.status(410).json({
        error: 'Plan has expired (30-minute limit). Generate a fresh plan.',
        code: 'PLAN_EXPIRED',
      });
      return;
    }

    // Verify plan integrity
    if (!SyncPlanner.verifyChecksum(entry.plan)) {
      planStore.delete(planId);
      res.status(409).json({
        error: 'Plan integrity check failed. The plan may have been tampered with.',
        code: 'PLAN_TAMPERED',
      });
      return;
    }

    // Apply operation selection (filter to selected IDs if provided)
    let planToExecute = entry.plan;
    if (selectedOperationIds && selectedOperationIds.length > 0) {
      const selectedSet = new Set(selectedOperationIds);
      planToExecute = {
        ...entry.plan,
        operations: entry.plan.operations.filter((op) => selectedSet.has(op.id)),
      };
    }

    const client = requireClient();
    const executor = new SyncExecutor(client);

    const result = await executor.execute(planToExecute, { dryRun });

    // Consume plan after apply (non-dry-run) to prevent replay
    if (!dryRun) {
      planStore.delete(planId);
    }

    // Strip api_key from result before sending
    res.json({
      ...result,
      plan: sanitisePlan(result.plan),
    });
  }),
);
