/**
 * Policy runner
 * Runs all applicable policy rules for a given environment.
 */

import type { FlagsmithClient } from '../flagsmith/client.js';
import type {
  PolicyRule,
  PolicyViolation,
  PolicyRunResult,
  PolicyEnvironmentContext,
  PolicyFeatureState,
} from './schema.js';
import type { FlagsmithFeature } from '../types/flagsmith.js';import { requireDescriptionRule } from './rules/require_description.js';
import { namingConventionRule } from './rules/naming_convention.js';
import { noArchivedFlagsEnabledRule } from './rules/no_archived_flags_enabled.js';
import { multivariateAllocationsSumRule } from './rules/multivariate_allocations_sum.js';
import { environmentParityRule, type EnvironmentParityContext } from './rules/environment_parity.js';

export class PolicyRunner {
  constructor(private readonly client: FlagsmithClient) {}

  async runForEnvironment(
    environmentName: string,
    projectId: number,
    policies: PolicyRule[],
  ): Promise<PolicyRunResult> {
    // Resolve the environment API key from its name
    const environments = await this.client.getEnvironments(projectId);
    const env = environments.find(
      (e) => e.name.toLowerCase() === environmentName.toLowerCase(),
    );

    if (!env) {
      const names = environments.map((e) => `"${e.name}"`).join(', ');
      throw new Error(
        `Environment "${environmentName}" not found. Available: ${names}`,
      );
    }

    // Fetch feature states for the environment
    const featureStates = await this.client.getFeatureStates(env.api_key);

    // Fetch project-level features for descriptions and archived status
    let projectFeatures: FlagsmithFeature[] = [];
    try {
      projectFeatures = await this.fetchProjectFeatures(projectId);
    } catch {
      // Non-fatal: rules that need descriptions will just see empty descriptions
    }

    const featureMap = new Map<number, FlagsmithFeature>(
      projectFeatures.map((f) => [f.id, f]),
    );

    // Build the context — resolve numeric feature IDs using the features list
    const policyFeatureStates: PolicyFeatureState[] = featureStates.flatMap((fs) => {
      // feature may be a bare number (management API) or an object (some versions)
      const featureId = typeof fs.feature === 'number' ? fs.feature : fs.feature.id;
      const featureName = typeof fs.feature === 'number' ? undefined : fs.feature.name;

      const projectFeature = featureMap.get(featureId);
      // Resolve name: prefer inline name, fall back to features list
      const resolvedName = featureName ?? projectFeature?.name;
      if (!resolvedName) return []; // cannot identify this feature — skip

      return [{
        featureStateId: fs.id,
        featureId,
        name: resolvedName,
        enabled: fs.enabled,
        value: fs.feature_state_value,
        description: projectFeature?.description ?? '',
        isArchived: projectFeature?.is_archived ?? false,
        multivariateAllocations: fs.multivariate_feature_state_values.map(
          (mv) => ({
            id: mv.multivariate_feature_option,
            percentage: mv.percentage_allocation,
          }),
        ),
      }];
    });

    const ctx: PolicyEnvironmentContext = {
      environmentName,
      projectId,
      featureStates: policyFeatureStates,
    };

    // Filter policies to those that apply to this environment
    const applicablePolicies = policies.filter(
      (p) =>
        !p.environments ||
        p.environments.length === 0 ||
        p.environments.some(
          (e) => e.toLowerCase() === environmentName.toLowerCase(),
        ),
    );

    // Run all applicable rules
    const violations: PolicyViolation[] = [];

    for (const rule of applicablePolicies) {
      const ruleViolations = await this.runRule(rule, ctx, environments, projectId);
      violations.push(...ruleViolations);
    }

    const errors = violations.filter((v) => v.severity === 'error').length;
    const warnings = violations.filter((v) => v.severity === 'warning').length;
    const infos = violations.filter((v) => v.severity === 'info').length;

    // Count features that passed all rules (no violations for that feature)
    const allFeatureNames = new Set(policyFeatureStates.map((f) => f.name));
    const violatedFeatures = new Set(violations.map((v) => v.feature));
    const passed = [...allFeatureNames].filter((name) => !violatedFeatures.has(name)).length;

    return {
      environment: environmentName,
      timestamp: new Date().toISOString(),
      total: violations.length,
      errors,
      warnings,
      infos,
      passed,
      violations,
    };
  }

  private async runRule(
    rule: PolicyRule,
    ctx: PolicyEnvironmentContext,
    environments: Array<{ name: string; api_key: string }>,
    projectId: number,
  ): Promise<PolicyViolation[]> {
    switch (rule.rule) {
      case 'require_description':
        return requireDescriptionRule(ctx, rule);

      case 'naming_convention':
        return namingConventionRule(ctx, rule);

      case 'no_archived_flags_enabled':
        return noArchivedFlagsEnabledRule(ctx, rule);

      case 'multivariate_allocations_sum':
        return multivariateAllocationsSumRule(ctx, rule);

      case 'environment_parity': {
        const sourceEnvName = rule.parity_source;
        let sourceStates: Array<{ name: string; enabled: boolean }> | undefined;

        if (sourceEnvName) {
          const sourceEnv = environments.find(
            (e) => e.name.toLowerCase() === sourceEnvName.toLowerCase(),
          );
          if (sourceEnv) {
            try {
              const sourceFss = await this.client.getFeatureStates(sourceEnv.api_key);
              sourceStates = sourceFss
                .filter((fs) => typeof fs.feature !== 'number')
                .map((fs) => {
                  const feat = fs.feature as { id: number; name: string; type: 'STANDARD' | 'MULTIVARIATE' };
                  return { name: feat.name, enabled: fs.enabled };
                });
            } catch {
              // Non-fatal: rule will return no violations if source is unavailable
            }
          }
        } else {
          // Pick the first other environment
          const otherEnv = environments.find(
            (e) => e.name.toLowerCase() !== ctx.environmentName.toLowerCase(),
          );
          if (otherEnv) {
            try {
              const sourceFss = await this.client.getFeatureStates(otherEnv.api_key);
              sourceStates = sourceFss
                .filter((fs) => typeof fs.feature !== 'number')
                .map((fs) => {
                  const feat = fs.feature as { id: number; name: string; type: 'STANDARD' | 'MULTIVARIATE' };
                  return { name: feat.name, enabled: fs.enabled };
                });
            } catch {
              // Non-fatal
            }
          }
        }

        const parityCtx: EnvironmentParityContext = {
          ...ctx,
          sourceEnvironmentStates: sourceStates,
        };
        return environmentParityRule(parityCtx, rule);
      }

      default: {
        const exhaustive: never = rule.rule;
        return [
          {
            ruleId: rule.id,
            severity: 'error' as const,
            feature: '__engine__',
            message: `Unknown rule type: ${exhaustive as string}`,
          },
        ];
      }
    }
  }

  private async fetchProjectFeatures(projectId: number): Promise<FlagsmithFeature[]> {
    return this.client.getFeatures(projectId);
  }
}
