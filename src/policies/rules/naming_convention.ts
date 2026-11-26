/**
 * Rule: naming_convention
 * Feature names must match a regex pattern.
 * Default pattern: ^[a-z][a-z0-9_]*$
 */

import type { PolicyEnvironmentContext, PolicyRule, PolicyViolation } from '../schema.js';

const DEFAULT_PATTERN = '^[a-z][a-z0-9_]*$';

export function namingConventionRule(
  ctx: PolicyEnvironmentContext,
  rule: PolicyRule,
): PolicyViolation[] {
  const pattern = rule.pattern ?? DEFAULT_PATTERN;
  let regex: RegExp;

  try {
    regex = new RegExp(pattern);
  } catch {
    return [
      {
        ruleId: rule.id,
        severity: 'error',
        feature: '__config__',
        message: `Invalid regex pattern in naming_convention rule: ${pattern}`,
      },
    ];
  }

  const violations: PolicyViolation[] = [];

  for (const fs of ctx.featureStates) {
    if (!regex.test(fs.name)) {
      violations.push({
        ruleId: rule.id,
        severity: rule.severity,
        feature: fs.name,
        message: `Feature name '${fs.name}' does not match naming convention '${pattern}'.`,
        suggestion: `Rename the feature to follow the pattern: ${pattern}`,
      });
    }
  }

  return violations;
}
