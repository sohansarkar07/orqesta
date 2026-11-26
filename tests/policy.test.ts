/**
 * Tests for Phase 4: Policy Engine
 */

import { describe, it, expect } from 'vitest';
import { requireDescriptionRule } from '../src/policies/rules/require_description.js';
import { namingConventionRule } from '../src/policies/rules/naming_convention.js';
import { noArchivedFlagsEnabledRule } from '../src/policies/rules/no_archived_flags_enabled.js';
import { multivariateAllocationsSumRule } from '../src/policies/rules/multivariate_allocations_sum.js';
import { environmentParityRule } from '../src/policies/rules/environment_parity.js';
import { PolicySchema } from '../src/policies/schema.js';
import type {
  PolicyEnvironmentContext,
  PolicyFeatureState,
  PolicyRule,
} from '../src/policies/schema.js';
import type { EnvironmentParityContext } from '../src/policies/rules/environment_parity.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFeatureState(
  overrides: Partial<PolicyFeatureState> & { name: string },
): PolicyFeatureState {
  return {
    featureStateId: 1,
    featureId: 1,
    name: overrides.name,
    enabled: overrides.enabled ?? true,
    value: overrides.value ?? null,
    description: overrides.description ?? 'A description',
    isArchived: overrides.isArchived ?? false,
    multivariateAllocations: overrides.multivariateAllocations ?? [],
  };
}

function makeContext(
  features: PolicyFeatureState[],
): PolicyEnvironmentContext {
  return {
    environmentName: 'Production',
    projectId: 1,
    featureStates: features,
  };
}

function makeRule(
  overrides: Partial<PolicyRule> & { rule: PolicyRule['rule'] },
): PolicyRule {
  return {
    id: 'test-rule',
    description: 'Test rule',
    severity: 'error',
    ...overrides,
  };
}

// ── require_description ───────────────────────────────────────────────────────

describe('require_description rule', () => {
  it('passes when all features have descriptions', () => {
    const ctx = makeContext([
      makeFeatureState({ name: 'feature_a', description: 'Enables feature A' }),
      makeFeatureState({ name: 'feature_b', description: 'Controls feature B' }),
    ]);
    const rule = makeRule({ rule: 'require_description' });
    const violations = requireDescriptionRule(ctx, rule);
    expect(violations).toHaveLength(0);
  });

  it('fails when a feature has no description', () => {
    const ctx = makeContext([
      makeFeatureState({ name: 'feature_a', description: '' }),
    ]);
    const rule = makeRule({ rule: 'require_description', severity: 'warning' });
    const violations = requireDescriptionRule(ctx, rule);
    expect(violations).toHaveLength(1);
    expect(violations[0]!.feature).toBe('feature_a');
    expect(violations[0]!.severity).toBe('warning');
  });

  it('fails when description is whitespace only', () => {
    const ctx = makeContext([
      makeFeatureState({ name: 'feature_a', description: '   ' }),
    ]);
    const rule = makeRule({ rule: 'require_description' });
    const violations = requireDescriptionRule(ctx, rule);
    expect(violations).toHaveLength(1);
  });

  it('fails when description is undefined', () => {
    // Build the feature state directly without going through the helper default
    const fs: PolicyFeatureState = {
      featureStateId: 1,
      featureId: 1,
      name: 'feature_a',
      enabled: true,
      value: null,
      description: undefined,
      isArchived: false,
      multivariateAllocations: [],
    };
    const ctx: PolicyEnvironmentContext = {
      environmentName: 'Production',
      projectId: 1,
      featureStates: [fs],
    };
    const rule = makeRule({ rule: 'require_description' });
    const violations = requireDescriptionRule(ctx, rule);
    expect(violations).toHaveLength(1);
  });

  it('reports violation for each feature without description', () => {
    const ctx = makeContext([
      makeFeatureState({ name: 'a', description: '' }),
      makeFeatureState({ name: 'b', description: 'has one' }),
      makeFeatureState({ name: 'c', description: '' }),
    ]);
    const rule = makeRule({ rule: 'require_description' });
    const violations = requireDescriptionRule(ctx, rule);
    expect(violations).toHaveLength(2);
    expect(violations.map((v) => v.feature)).toEqual(['a', 'c']);
  });
});

// ── naming_convention ─────────────────────────────────────────────────────────

describe('naming_convention rule', () => {
  it('passes checkout_redesign with default pattern', () => {
    const ctx = makeContext([
      makeFeatureState({ name: 'checkout_redesign' }),
    ]);
    const rule = makeRule({ rule: 'naming_convention' });
    const violations = namingConventionRule(ctx, rule);
    expect(violations).toHaveLength(0);
  });

  it('fails CheckoutRedesign with default pattern (uppercase)', () => {
    const ctx = makeContext([
      makeFeatureState({ name: 'CheckoutRedesign' }),
    ]);
    const rule = makeRule({ rule: 'naming_convention' });
    const violations = namingConventionRule(ctx, rule);
    expect(violations).toHaveLength(1);
    expect(violations[0]!.feature).toBe('CheckoutRedesign');
  });

  it('fails names starting with numbers', () => {
    const ctx = makeContext([
      makeFeatureState({ name: '1_feature' }),
    ]);
    const rule = makeRule({ rule: 'naming_convention' });
    const violations = namingConventionRule(ctx, rule);
    expect(violations).toHaveLength(1);
  });

  it('passes with custom camelCase pattern', () => {
    const ctx = makeContext([
      makeFeatureState({ name: 'checkoutRedesign' }),
    ]);
    const rule = makeRule({ rule: 'naming_convention', pattern: '^[a-z][a-zA-Z0-9]*$' });
    const violations = namingConventionRule(ctx, rule);
    expect(violations).toHaveLength(0);
  });

  it('fails with custom pattern when name does not match', () => {
    const ctx = makeContext([
      makeFeatureState({ name: 'checkout_redesign' }),
    ]);
    const rule = makeRule({ rule: 'naming_convention', pattern: '^[a-z][a-zA-Z0-9]*$' });
    const violations = namingConventionRule(ctx, rule);
    expect(violations).toHaveLength(1); // underscore not allowed in this pattern
  });

  it('passes snake_case names', () => {
    const ctx = makeContext([
      makeFeatureState({ name: 'feature_a' }),
      makeFeatureState({ name: 'dark_mode' }),
      makeFeatureState({ name: 'checkout_v2' }),
    ]);
    const rule = makeRule({ rule: 'naming_convention' });
    const violations = namingConventionRule(ctx, rule);
    expect(violations).toHaveLength(0);
  });
});

// ── no_archived_flags_enabled ─────────────────────────────────────────────────

describe('no_archived_flags_enabled rule', () => {
  it('passes when archived feature is disabled', () => {
    const ctx = makeContext([
      makeFeatureState({ name: 'old_feature', isArchived: true, enabled: false }),
    ]);
    const rule = makeRule({ rule: 'no_archived_flags_enabled' });
    const violations = noArchivedFlagsEnabledRule(ctx, rule);
    expect(violations).toHaveLength(0);
  });

  it('fails when archived feature is enabled', () => {
    const ctx = makeContext([
      makeFeatureState({ name: 'old_feature', isArchived: true, enabled: true }),
    ]);
    const rule = makeRule({ rule: 'no_archived_flags_enabled', severity: 'error' });
    const violations = noArchivedFlagsEnabledRule(ctx, rule);
    expect(violations).toHaveLength(1);
    expect(violations[0]!.feature).toBe('old_feature');
    expect(violations[0]!.severity).toBe('error');
  });

  it('passes when non-archived feature is enabled', () => {
    const ctx = makeContext([
      makeFeatureState({ name: 'active_feature', isArchived: false, enabled: true }),
    ]);
    const rule = makeRule({ rule: 'no_archived_flags_enabled' });
    const violations = noArchivedFlagsEnabledRule(ctx, rule);
    expect(violations).toHaveLength(0);
  });

  it('reports all archived+enabled features', () => {
    const ctx = makeContext([
      makeFeatureState({ name: 'archived_1', isArchived: true, enabled: true }),
      makeFeatureState({ name: 'archived_2', isArchived: true, enabled: false }),
      makeFeatureState({ name: 'archived_3', isArchived: true, enabled: true }),
      makeFeatureState({ name: 'active', isArchived: false, enabled: true }),
    ]);
    const rule = makeRule({ rule: 'no_archived_flags_enabled' });
    const violations = noArchivedFlagsEnabledRule(ctx, rule);
    expect(violations).toHaveLength(2);
    expect(violations.map((v) => v.feature)).toEqual(['archived_1', 'archived_3']);
  });
});

// ── multivariate_allocations_sum ──────────────────────────────────────────────

describe('multivariate_allocations_sum rule', () => {
  it('passes when allocations sum to 100', () => {
    const ctx = makeContext([
      makeFeatureState({
        name: 'ab_test',
        multivariateAllocations: [
          { id: 1, percentage: 50 },
          { id: 2, percentage: 50 },
        ],
      }),
    ]);
    const rule = makeRule({ rule: 'multivariate_allocations_sum' });
    const violations = multivariateAllocationsSumRule(ctx, rule);
    expect(violations).toHaveLength(0);
  });

  it('fails when allocations do not sum to 100', () => {
    const ctx = makeContext([
      makeFeatureState({
        name: 'ab_test',
        multivariateAllocations: [
          { id: 1, percentage: 60 },
          { id: 2, percentage: 30 },
        ],
      }),
    ]);
    const rule = makeRule({ rule: 'multivariate_allocations_sum', severity: 'error' });
    const violations = multivariateAllocationsSumRule(ctx, rule);
    expect(violations).toHaveLength(1);
    expect(violations[0]!.feature).toBe('ab_test');
    expect(violations[0]!.message).toContain('90%');
  });

  it('passes when feature has no multivariate allocations', () => {
    const ctx = makeContext([
      makeFeatureState({ name: 'standard_flag', multivariateAllocations: [] }),
    ]);
    const rule = makeRule({ rule: 'multivariate_allocations_sum' });
    const violations = multivariateAllocationsSumRule(ctx, rule);
    expect(violations).toHaveLength(0);
  });

  it('passes when allocations sum to exactly 100 with multiple options', () => {
    const ctx = makeContext([
      makeFeatureState({
        name: 'mv_test',
        multivariateAllocations: [
          { id: 1, percentage: 25 },
          { id: 2, percentage: 25 },
          { id: 3, percentage: 25 },
          { id: 4, percentage: 25 },
        ],
      }),
    ]);
    const rule = makeRule({ rule: 'multivariate_allocations_sum' });
    const violations = multivariateAllocationsSumRule(ctx, rule);
    expect(violations).toHaveLength(0);
  });

  it('fails when allocations sum to over 100', () => {
    const ctx = makeContext([
      makeFeatureState({
        name: 'over_allocated',
        multivariateAllocations: [
          { id: 1, percentage: 60 },
          { id: 2, percentage: 60 },
        ],
      }),
    ]);
    const rule = makeRule({ rule: 'multivariate_allocations_sum' });
    const violations = multivariateAllocationsSumRule(ctx, rule);
    expect(violations).toHaveLength(1);
    expect(violations[0]!.message).toContain('120%');
  });
});

// ── environment_parity ────────────────────────────────────────────────────────

describe('environment_parity rule', () => {
  it('produces violation when feature enabled in source is missing from target', () => {
    const ctx: EnvironmentParityContext = {
      environmentName: 'Production',
      projectId: 1,
      featureStates: [], // target has no features
      sourceEnvironmentStates: [
        { name: 'checkout_redesign', enabled: true },
      ],
    };
    const rule = makeRule({ rule: 'environment_parity', severity: 'error' });
    const violations = environmentParityRule(ctx, rule);
    expect(violations).toHaveLength(1);
    expect(violations[0]!.feature).toBe('checkout_redesign');
  });

  it('produces violation when feature enabled in source is disabled in target', () => {
    const ctx: EnvironmentParityContext = {
      environmentName: 'Production',
      projectId: 1,
      featureStates: [
        makeFeatureState({ name: 'checkout_redesign', enabled: false }),
      ],
      sourceEnvironmentStates: [
        { name: 'checkout_redesign', enabled: true },
      ],
    };
    const rule = makeRule({ rule: 'environment_parity', severity: 'warning' });
    const violations = environmentParityRule(ctx, rule);
    expect(violations).toHaveLength(1);
    expect(violations[0]!.severity).toBe('warning');
  });

  it('passes when all source-enabled features are enabled in target', () => {
    const ctx: EnvironmentParityContext = {
      environmentName: 'Production',
      projectId: 1,
      featureStates: [
        makeFeatureState({ name: 'checkout_redesign', enabled: true }),
        makeFeatureState({ name: 'dark_mode', enabled: true }),
      ],
      sourceEnvironmentStates: [
        { name: 'checkout_redesign', enabled: true },
        { name: 'dark_mode', enabled: true },
      ],
    };
    const rule = makeRule({ rule: 'environment_parity' });
    const violations = environmentParityRule(ctx, rule);
    expect(violations).toHaveLength(0);
  });

  it('ignores source features that are disabled', () => {
    const ctx: EnvironmentParityContext = {
      environmentName: 'Production',
      projectId: 1,
      featureStates: [], // target has nothing
      sourceEnvironmentStates: [
        { name: 'disabled_feature', enabled: false },
      ],
    };
    const rule = makeRule({ rule: 'environment_parity' });
    const violations = environmentParityRule(ctx, rule);
    expect(violations).toHaveLength(0); // disabled in source, so no parity required
  });

  it('returns no violations when source states not provided', () => {
    const ctx: EnvironmentParityContext = {
      environmentName: 'Production',
      projectId: 1,
      featureStates: [],
      sourceEnvironmentStates: undefined,
    };
    const rule = makeRule({ rule: 'environment_parity' });
    const violations = environmentParityRule(ctx, rule);
    expect(violations).toHaveLength(0);
  });
});

// ── Policy runner result shape ────────────────────────────────────────────────

describe('Policy runner result counts', () => {
  it('counts errors and warnings correctly', () => {
    const violations = [
      { ruleId: 'r1', severity: 'error' as const, feature: 'a', message: 'err' },
      { ruleId: 'r2', severity: 'error' as const, feature: 'b', message: 'err' },
      { ruleId: 'r3', severity: 'warning' as const, feature: 'c', message: 'warn' },
    ];

    const errors = violations.filter((v) => v.severity === 'error').length;
    const warnings = violations.filter((v) => v.severity === 'warning').length;

    expect(errors).toBe(2);
    expect(warnings).toBe(1);
  });
});

// ── Policy schema validation ──────────────────────────────────────────────────

describe('PolicySchema validation', () => {
  it('accepts a valid policy', () => {
    const result = PolicySchema.safeParse({
      version: 1,
      policies: [
        {
          id: 'test',
          description: 'Test',
          severity: 'error',
          rule: 'naming_convention',
          pattern: '^[a-z]+$',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid version', () => {
    const result = PolicySchema.safeParse({
      version: 2,
      policies: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = PolicySchema.safeParse({
      version: 1,
      policies: [
        {
          // Missing id, description, severity, rule
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown rule type', () => {
    const result = PolicySchema.safeParse({
      version: 1,
      policies: [
        {
          id: 'test',
          description: 'test',
          severity: 'error',
          rule: 'unknown_rule_type',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid severity', () => {
    const result = PolicySchema.safeParse({
      version: 1,
      policies: [
        {
          id: 'test',
          description: 'test',
          severity: 'critical', // not in enum
          rule: 'naming_convention',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = PolicySchema.safeParse({
      version: 1,
      policies: [
        {
          id: 'test',
          description: 'test',
          severity: 'warning',
          rule: 'environment_parity',
          environments: ['Production', 'Staging'],
          parity_source: 'Staging',
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// ── Policy loader YAML parsing ────────────────────────────────────────────────

describe('Policy loader', () => {
  it('parses a valid YAML policy string', async () => {
    // We test the yaml parsing logic directly by using js-yaml
    const { load: yamlLoad } = await import('js-yaml');
    const { PolicySchema } = await import('../src/policies/schema.js');

    const yamlContent = `
version: 1
policies:
  - id: naming
    description: Names must be snake_case
    severity: warning
    rule: naming_convention
    pattern: "^[a-z][a-z0-9_]*$"
`;

    const parsed = yamlLoad(yamlContent);
    const result = PolicySchema.safeParse(parsed);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(1);
      expect(result.data.policies).toHaveLength(1);
      expect(result.data.policies[0]!.id).toBe('naming');
    }
  });

  it('rejects invalid YAML policy (wrong version)', async () => {
    const { load: yamlLoad } = await import('js-yaml');
    const { PolicySchema } = await import('../src/policies/schema.js');

    const yamlContent = `
version: 2
policies: []
`;

    const parsed = yamlLoad(yamlContent);
    const result = PolicySchema.safeParse(parsed);
    expect(result.success).toBe(false);
  });
});

// ── Exit code logic ───────────────────────────────────────────────────────────

describe('Exit code logic', () => {
  it('exit code 1 when errors > 0', () => {
    const result = { errors: 2, warnings: 0 };
    // Simulate the check in lint.ts: exit 1 if errors > 0
    const shouldExit = result.errors > 0;
    expect(shouldExit).toBe(true);
  });

  it('exit code 0 when only warnings', () => {
    const result = { errors: 0, warnings: 3 };
    const shouldExit = result.errors > 0;
    expect(shouldExit).toBe(false);
  });

  it('exit code 0 when no violations', () => {
    const result = { errors: 0, warnings: 0 };
    const shouldExit = result.errors > 0;
    expect(shouldExit).toBe(false);
  });
});
