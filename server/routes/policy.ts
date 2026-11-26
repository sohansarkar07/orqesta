/**
 * POST /api/policy/run
 *   Body: { projectId, environmentName, policyYaml? }
 *   Runs the real PolicyRunner against a live Flagsmith environment.
 *
 * GET /api/policy/default
 *   Returns the built-in default policy as YAML text.
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireClient } from '../credentials.js';
import { PolicyRunner } from '../../src/policies/runner.js';
import { PolicySchema } from '../../src/policies/schema.js';
import { load as yamlLoad } from 'js-yaml';
import { wrap } from '../middleware/errors.js';

export const policyRouter = Router();

const DEFAULT_POLICY_YAML = `version: 1

policies:
  - id: naming-convention
    description: Feature flag names must be lowercase snake_case.
    severity: warning
    rule: naming_convention
    pattern: "^[a-z][a-z0-9_]*$"

  - id: no-archived-enabled
    description: Archived flags must not be enabled.
    severity: error
    rule: no_archived_flags_enabled

  - id: mv-allocations-sum
    description: Multivariate allocations must sum to exactly 100%.
    severity: error
    rule: multivariate_allocations_sum
`;

const RunBody = z.object({
  projectId: z.number().int().positive(),
  environmentName: z.string().min(1),
  policyYaml: z.string().optional(), // if omitted, default policy is used
});

policyRouter.post(
  '/run',
  wrap(async (req, res) => {
    const parsed = RunBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      return;
    }

    const { projectId, environmentName, policyYaml } = parsed.data;

    // Parse and validate the policy
    const yamlToParse = policyYaml ?? DEFAULT_POLICY_YAML;
    let parsedPolicy: unknown;
    try {
      parsedPolicy = yamlLoad(yamlToParse);
    } catch (err) {
      res.status(400).json({
        error: `Failed to parse policy YAML: ${err instanceof Error ? err.message : String(err)}`,
        code: 'POLICY_PARSE_ERROR',
      });
      return;
    }

    const policyResult = PolicySchema.safeParse(parsedPolicy);
    if (!policyResult.success) {
      res.status(400).json({
        error: 'Invalid policy configuration',
        code: 'POLICY_INVALID',
        details: policyResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      return;
    }

    const client = requireClient();
    const runner = new PolicyRunner(client);

    const result = await runner.runForEnvironment(
      environmentName,
      projectId,
      policyResult.data.policies,
    );

    res.json(result);
  }),
);

policyRouter.get(
  '/default',
  wrap(async (_req, res) => {
    res.json({ yaml: DEFAULT_POLICY_YAML });
  }),
);
