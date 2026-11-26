/**
 * Rule: multivariate_allocations_sum
 * For multivariate flags, all percentage allocations must sum to exactly 100.
 */

import type { PolicyEnvironmentContext, PolicyRule, PolicyViolation } from '../schema.js';

export function multivariateAllocationsSumRule(
  ctx: PolicyEnvironmentContext,
  rule: PolicyRule,
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];

  for (const fs of ctx.featureStates) {
    if (fs.multivariateAllocations.length === 0) continue;

    const total = fs.multivariateAllocations.reduce(
      (sum, a) => sum + a.percentage,
      0,
    );

    // Allow for floating point imprecision (within 0.01%)
    if (Math.abs(total - 100) > 0.01) {
      violations.push({
        ruleId: rule.id,
        severity: rule.severity,
        feature: fs.name,
        message: `Feature '${fs.name}' multivariate allocations sum to ${total}%, expected 100%.`,
        suggestion: 'Adjust percentage allocations so they total exactly 100%.',
      });
    }
  }

  return violations;
}
