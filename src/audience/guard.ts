/**
 * Audience Regression Guard
 *
 * Compares multivariate flag allocations between two environment snapshots
 * and identifies allocation shifts that could affect what percentage of
 * users see each feature variant.
 *
 * Rules:
 *   - critical: control audience shrinks by >10pp OR a variant grows by >10pp
 *   - warning:  any allocation changes by 1–10pp
 *   - info:     allocations sum changed (doesn't add to 100%) — config error
 */

import type {
  AudienceSnapshot,
  AudienceGuardReport,
  AudienceRegressionResult,
  VariantShift,
  RegressionSeverity,
  MultivariateVariant,
} from './types.js';
import type { FlagsmithFeatureState, FlagsmithFeature } from '../types/flagsmith.js';

const CRITICAL_THRESHOLD_PP = 10; // percentage-points

/**
 * Build an audience snapshot from raw feature states and feature metadata.
 */
export function buildAudienceSnapshot(
  environmentName: string,
  featureStates: FlagsmithFeatureState[],
  features: FlagsmithFeature[],
): AudienceSnapshot[] {
  const featureById = new Map(features.map((f) => [f.id, f]));
  const snapshots: AudienceSnapshot[] = [];

  for (const fs of featureStates) {
    // Skip if feature is a bare number (unresolved) or no MV allocations
    if (typeof fs.feature === 'number') continue;
    if (fs.multivariate_feature_state_values.length === 0) continue;

    const featureId = fs.feature.id;
    const featureName = fs.feature.name;
    const projectFeature = featureById.get(featureId);

    if (projectFeature?.type !== 'MULTIVARIATE') continue;

    const variants: MultivariateVariant[] = fs.multivariate_feature_state_values.map((mv) => ({
      optionId: mv.multivariate_feature_option,
      label: `variant_${mv.multivariate_feature_option}`,
      percentage: mv.percentage_allocation,
    }));

    const totalAllocated = variants.reduce((sum, v) => sum + v.percentage, 0);
    const controlPercentage = Math.max(0, 100 - totalAllocated);

    snapshots.push({
      feature: featureName,
      controlPercentage,
      variants,
      capturedAt: new Date().toISOString(),
    });
  }

  return snapshots;
}

/**
 * Compare two sets of audience snapshots and produce a regression report.
 * `before` = source environment (reference), `after` = target environment.
 */
export function runAudienceGuard(
  sourceEnvironment: string,
  targetEnvironment: string,
  before: AudienceSnapshot[],
  after: AudienceSnapshot[],
): AudienceGuardReport {
  const afterMap = new Map(after.map((s) => [s.feature, s]));
  const regressions: AudienceRegressionResult[] = [];
  let flagsUnchanged = 0;

  for (const beforeSnap of before) {
    const afterSnap = afterMap.get(beforeSnap.feature);
    if (!afterSnap) continue; // feature doesn't exist in target — skip

    const result = compareSnapshots(beforeSnap, afterSnap);
    if (result) {
      regressions.push(result);
    } else {
      flagsUnchanged++;
    }
  }

  const summary = {
    critical: regressions.filter((r) => r.severity === 'critical').length,
    warning:  regressions.filter((r) => r.severity === 'warning').length,
    info:     regressions.filter((r) => r.severity === 'info').length,
    total:    regressions.length,
  };

  return {
    environment: targetEnvironment,
    sourceEnvironment,
    timestamp: new Date().toISOString(),
    regressions,
    flagsChecked: before.length,
    flagsUnchanged,
    summary,
  };
}

function compareSnapshots(
  before: AudienceSnapshot,
  after: AudienceSnapshot,
): AudienceRegressionResult | null {
  // Build maps keyed by optionId
  const beforeVariants = new Map(before.variants.map((v) => [v.optionId, v]));
  const afterVariants  = new Map(after.variants.map((v) => [v.optionId, v]));

  const allOptionIds = new Set([...beforeVariants.keys(), ...afterVariants.keys()]);
  const shifts: VariantShift[] = [];
  let hasChange = false;

  for (const optionId of allOptionIds) {
    const b = beforeVariants.get(optionId)?.percentage ?? 0;
    const a = afterVariants.get(optionId)?.percentage ?? 0;
    const delta = a - b;
    if (delta !== 0) hasChange = true;

    shifts.push({
      optionId,
      label: beforeVariants.get(optionId)?.label ?? afterVariants.get(optionId)?.label ?? `variant_${optionId}`,
      before: b,
      after: a,
      delta,
    });
  }

  // Control shift
  const controlDelta = after.controlPercentage - before.controlPercentage;
  if (controlDelta !== 0) hasChange = true;

  const controlShift: VariantShift = {
    optionId: 0,
    label: 'control',
    before: before.controlPercentage,
    after: after.controlPercentage,
    delta: controlDelta,
  };

  if (!hasChange) return null;

  // Validate allocations sum
  const afterTotal = after.variants.reduce((sum, v) => sum + v.percentage, 0);
  const allocationsSumValid = afterTotal <= 100;

  // Determine severity
  const severity = determineSeverity(controlShift, shifts, allocationsSumValid);

  // Build summary
  const biggestShift = [...shifts, controlShift]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]!;

  const summary = buildSummary(before.feature, controlShift, shifts, allocationsSumValid);

  return {
    feature: before.feature,
    severity,
    summary,
    shifts,
    controlShift,
    allocationsSumValid,
  };
}

function determineSeverity(
  controlShift: VariantShift,
  variantShifts: VariantShift[],
  allocationsSumValid: boolean,
): RegressionSeverity {
  if (!allocationsSumValid) return 'critical';

  const maxAbsDelta = Math.max(
    Math.abs(controlShift.delta),
    ...variantShifts.map((s) => Math.abs(s.delta)),
  );

  if (maxAbsDelta >= CRITICAL_THRESHOLD_PP) return 'critical';
  if (maxAbsDelta > 0) return 'warning';
  return 'info';
}

function buildSummary(
  feature: string,
  controlShift: VariantShift,
  variantShifts: VariantShift[],
  allocationsSumValid: boolean,
): string {
  if (!allocationsSumValid) {
    return `Allocations exceed 100% — config error.`;
  }

  const changed = variantShifts.filter((s) => s.delta !== 0);

  if (controlShift.delta !== 0 && changed.length > 0) {
    const controlDir = controlShift.delta > 0 ? 'gained' : 'lost';
    return `Control audience ${controlDir} ${Math.abs(controlShift.delta)}pp; ${changed.length} variant${changed.length !== 1 ? 's' : ''} shifted.`;
  }

  if (controlShift.delta !== 0) {
    const dir = controlShift.delta > 0 ? '+' : '';
    return `Control audience shifted ${dir}${controlShift.delta}pp (${controlShift.before}% → ${controlShift.after}%).`;
  }

  const largest = changed.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]!;
  const dir = largest.delta > 0 ? '+' : '';
  return `${largest.label} shifted ${dir}${largest.delta}pp (${largest.before}% → ${largest.after}%).`;
}
