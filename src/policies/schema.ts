/**
 * Policy schema definitions and Zod validators
 */

import { z } from 'zod';

export const PolicyRuleSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(['error', 'warning', 'info']),
  rule: z.enum([
    'require_description',
    'naming_convention',
    'environment_parity',
    'no_archived_flags_enabled',
    'multivariate_allocations_sum',
  ]),
  environments: z.array(z.string()).optional(),
  pattern: z.string().optional(),         // for naming_convention
  parity_source: z.string().optional(),   // for environment_parity
});

export const PolicySchema = z.object({
  version: z.literal(1),
  policies: z.array(PolicyRuleSchema),
});

export type PolicyRule = z.infer<typeof PolicyRuleSchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type PolicyRuleType = PolicyRule['rule'];
export type PolicySeverity = PolicyRule['severity'];

export interface PolicyViolation {
  ruleId: string;
  severity: PolicySeverity;
  feature: string;
  message: string;
  suggestion?: string;
}

export interface PolicyRunResult {
  environment: string;
  timestamp: string;
  total: number;
  errors: number;
  warnings: number;
  infos: number;
  passed: number;
  violations: PolicyViolation[];
}

/** The context for a single environment that rules operate on */
export interface PolicyEnvironmentContext {
  environmentName: string;
  projectId: number;
  featureStates: PolicyFeatureState[];
}

export interface PolicyFeatureState {
  featureStateId: number;
  featureId: number;
  name: string;
  enabled: boolean;
  value: string | number | boolean | null;
  description?: string;
  isArchived: boolean;
  multivariateAllocations: Array<{
    id: number;
    percentage: number;
  }>;
}
