/**
 * Rule: environment_parity
 * Every feature enabled in the parity_source environment must also exist
 * and be enabled in the target environment.
 */

import type { PolicyEnvironmentContext, PolicyRule, PolicyViolation } from '../schema.js';

export interface EnvironmentParityContext extends PolicyEnvironmentContext {
  sourceEnvironmentStates?: Array<{ name: string; enabled: boolean }>;
}

export function environmentParityRule(
  ctx: EnvironmentParityContext,
  rule: PolicyRule,
): PolicyViolation[] {
  if (!ctx.sourceEnvironmentStates || ctx.sourceEnvironmentStates.length === 0) {
    // No source environment data provided — cannot evaluate
    return [];
  }

  const targetMap = new Map(
    ctx.featureStates.map((fs) => [fs.name, fs]),
  );

  const violations: PolicyViolation[] = [];

  for (const sourceFeature of ctx.sourceEnvironmentStates) {
    if (!sourceFeature.enabled) continue; // Only check features that are enabled in source

    const targetFeature = targetMap.get(sourceFeature.name);

    if (!targetFeature) {
      violations.push({
        ruleId: rule.id,
        severity: rule.severity,
        feature: sourceFeature.name,
        message: `Feature '${sourceFeature.name}' is enabled in source environment but does not exist in '${ctx.environmentName}'.`,
        suggestion: `Create feature '${sourceFeature.name}' in '${ctx.environmentName}'.`,
      });
    } else if (!targetFeature.enabled) {
      violations.push({
        ruleId: rule.id,
        severity: rule.severity,
        feature: sourceFeature.name,
        message: `Feature '${sourceFeature.name}' is enabled in source but disabled in '${ctx.environmentName}'.`,
        suggestion: `Enable feature '${sourceFeature.name}' in '${ctx.environmentName}' or disable it in source.`,
      });
    }
  }

  return violations;
}
