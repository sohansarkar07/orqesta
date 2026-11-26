/**
 * Rule: no_archived_flags_enabled
 * Archived features must not be enabled.
 */

import type { PolicyEnvironmentContext, PolicyRule, PolicyViolation } from '../schema.js';

export function noArchivedFlagsEnabledRule(
  ctx: PolicyEnvironmentContext,
  rule: PolicyRule,
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];

  for (const fs of ctx.featureStates) {
    if (fs.isArchived && fs.enabled) {
      violations.push({
        ruleId: rule.id,
        severity: rule.severity,
        feature: fs.name,
        message: `Feature '${fs.name}' is archived but still enabled.`,
        suggestion: 'Disable the feature before archiving, or un-archive if still in use.',
      });
    }
  }

  return violations;
}
