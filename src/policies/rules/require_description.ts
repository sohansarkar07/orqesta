/**
 * Rule: require_description
 * Each feature must have a non-empty description.
 */

import type { PolicyEnvironmentContext, PolicyRule, PolicyViolation } from '../schema.js';

export function requireDescriptionRule(
  ctx: PolicyEnvironmentContext,
  rule: PolicyRule,
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];

  for (const fs of ctx.featureStates) {
    if (!fs.description || fs.description.trim() === '') {
      violations.push({
        ruleId: rule.id,
        severity: rule.severity,
        feature: fs.name,
        message: `Feature '${fs.name}' has no description.`,
        suggestion: 'Add a description in the Flagsmith UI or via the API.',
      });
    }
  }

  return violations;
}
