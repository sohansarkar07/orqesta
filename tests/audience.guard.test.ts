/**
 * Tests for the Audience Regression Guard.
 * Pure unit tests — no network calls.
 */

import { describe, it, expect } from 'vitest';
import { buildAudienceSnapshot, runAudienceGuard } from '../src/audience/guard.js';
import type { AudienceSnapshot } from '../src/audience/types.js';
import type { FlagsmithFeatureState, FlagsmithFeature } from '../src/types/flagsmith.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeFeature(id: number, name: string): FlagsmithFeature {
  return {
    id, name, type: 'MULTIVARIATE',
    description: `${name} description`,
    created_date: '2026-01-01T00:00:00Z',
    default_enabled: false,
    is_archived: false,
    project: 1,
  };
}

function makeFeatureState(
  featureId: number,
  featureName: string,
  allocations: Array<{ optionId: number; percentage: number }>,
): FlagsmithFeatureState {
  return {
    id: featureId * 10,
    feature: { id: featureId, name: featureName, type: 'MULTIVARIATE' },
    environment: 1,
    enabled: true,
    feature_state_value: null,
    multivariate_feature_state_values: allocations.map(({ optionId, percentage }) => ({
      id: optionId * 100,
      multivariate_feature_option: optionId,
      percentage_allocation: percentage,
    })),
  };
}

function makeSnapshot(
  feature: string,
  controlPercentage: number,
  variants: Array<{ optionId: number; percentage: number }>,
): AudienceSnapshot {
  return {
    feature,
    controlPercentage,
    variants: variants.map(({ optionId, percentage }) => ({
      optionId,
      label: `variant_${optionId}`,
      percentage,
    })),
    capturedAt: new Date().toISOString(),
  };
}

// ─── buildAudienceSnapshot ────────────────────────────────────────────────────

describe('buildAudienceSnapshot', () => {
  it('extracts MV flag allocations correctly', () => {
    const features = [makeFeature(1, 'checkout_v2')];
    const states: FlagsmithFeatureState[] = [
      makeFeatureState(1, 'checkout_v2', [
        { optionId: 101, percentage: 30 },
        { optionId: 102, percentage: 20 },
      ]),
    ];

    const snapshots = buildAudienceSnapshot('Staging', states, features);
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]!.feature).toBe('checkout_v2');
    expect(snapshots[0]!.variants).toHaveLength(2);
    expect(snapshots[0]!.controlPercentage).toBe(50); // 100 - 30 - 20
  });

  it('skips STANDARD (non-MV) flags', () => {
    const features: FlagsmithFeature[] = [
      { id: 1, name: 'dark_mode', type: 'STANDARD', description: '', created_date: '', default_enabled: false, is_archived: false, project: 1 },
    ];
    const states: FlagsmithFeatureState[] = [
      { id: 10, feature: { id: 1, name: 'dark_mode', type: 'STANDARD' }, environment: 1, enabled: true, feature_state_value: null, multivariate_feature_state_values: [] },
    ];

    const snapshots = buildAudienceSnapshot('Staging', states, features);
    expect(snapshots).toHaveLength(0);
  });

  it('skips states where feature is a bare number', () => {
    const features = [makeFeature(1, 'checkout_v2')];
    const states: FlagsmithFeatureState[] = [
      { id: 10, feature: 1, environment: 1, enabled: true, feature_state_value: null, multivariate_feature_state_values: [{ id: 100, multivariate_feature_option: 101, percentage_allocation: 30 }] },
    ];

    const snapshots = buildAudienceSnapshot('Staging', states, features);
    expect(snapshots).toHaveLength(0);
  });

  it('computes control percentage correctly when allocations sum to 100', () => {
    const features = [makeFeature(1, 'ab_test')];
    const states = [makeFeatureState(1, 'ab_test', [{ optionId: 1, percentage: 50 }, { optionId: 2, percentage: 50 }])];
    const snapshots = buildAudienceSnapshot('Prod', states, features);
    expect(snapshots[0]!.controlPercentage).toBe(0);
  });
});

// ─── runAudienceGuard ─────────────────────────────────────────────────────────

describe('runAudienceGuard', () => {
  it('returns no regressions when allocations are identical', () => {
    const before = [makeSnapshot('checkout_v2', 50, [{ optionId: 1, percentage: 30 }, { optionId: 2, percentage: 20 }])];
    const after  = [makeSnapshot('checkout_v2', 50, [{ optionId: 1, percentage: 30 }, { optionId: 2, percentage: 20 }])];

    const report = runAudienceGuard('Staging', 'Production', before, after);
    expect(report.regressions).toHaveLength(0);
    expect(report.flagsUnchanged).toBe(1);
    expect(report.summary.total).toBe(0);
  });

  it('detects a warning when a variant shifts by less than 10pp', () => {
    const before = [makeSnapshot('checkout_v2', 70, [{ optionId: 1, percentage: 30 }])];
    const after  = [makeSnapshot('checkout_v2', 65, [{ optionId: 1, percentage: 35 }])]; // +5pp

    const report = runAudienceGuard('Staging', 'Production', before, after);
    expect(report.regressions).toHaveLength(1);
    expect(report.regressions[0]!.severity).toBe('warning');
    expect(report.regressions[0]!.shifts[0]!.delta).toBe(5);
  });

  it('detects critical when a variant shifts by ≥10pp', () => {
    const before = [makeSnapshot('checkout_v2', 70, [{ optionId: 1, percentage: 30 }])];
    const after  = [makeSnapshot('checkout_v2', 55, [{ optionId: 1, percentage: 45 }])]; // +15pp

    const report = runAudienceGuard('Staging', 'Production', before, after);
    expect(report.regressions[0]!.severity).toBe('critical');
  });

  it('marks critical when allocations exceed 100%', () => {
    const before = [makeSnapshot('ab_test', 50, [{ optionId: 1, percentage: 50 }])];
    const after  = [makeSnapshot('ab_test', 0, [{ optionId: 1, percentage: 60 }, { optionId: 2, percentage: 50 }])]; // 110%

    const report = runAudienceGuard('Staging', 'Production', before, after);
    expect(report.regressions[0]!.severity).toBe('critical');
    expect(report.regressions[0]!.allocationsSumValid).toBe(false);
  });

  it('reports correct control shift', () => {
    const before = [makeSnapshot('feat', 50, [{ optionId: 1, percentage: 50 }])];
    const after  = [makeSnapshot('feat', 40, [{ optionId: 1, percentage: 60 }])];

    const report = runAudienceGuard('Staging', 'Production', before, after);
    const reg = report.regressions[0]!;
    expect(reg.controlShift.before).toBe(50);
    expect(reg.controlShift.after).toBe(40);
    expect(reg.controlShift.delta).toBe(-10);
  });

  it('ignores features not present in target', () => {
    const before = [makeSnapshot('feat_a', 50, [{ optionId: 1, percentage: 50 }])];
    const after:  AudienceSnapshot[] = []; // feature not in target

    const report = runAudienceGuard('Staging', 'Production', before, after);
    expect(report.regressions).toHaveLength(0);
    expect(report.flagsChecked).toBe(1);
  });

  it('reports correct summary counts', () => {
    const before = [
      makeSnapshot('feat_a', 70, [{ optionId: 1, percentage: 30 }]),
      makeSnapshot('feat_b', 50, [{ optionId: 2, percentage: 50 }]),
      makeSnapshot('feat_c', 60, [{ optionId: 3, percentage: 40 }]),
    ];
    const after = [
      makeSnapshot('feat_a', 55, [{ optionId: 1, percentage: 45 }]), // +15pp → critical
      makeSnapshot('feat_b', 45, [{ optionId: 2, percentage: 55 }]), // +5pp  → warning
      makeSnapshot('feat_c', 60, [{ optionId: 3, percentage: 40 }]), // unchanged
    ];

    const report = runAudienceGuard('Staging', 'Production', before, after);
    expect(report.summary.critical).toBe(1);
    expect(report.summary.warning).toBe(1);
    expect(report.flagsUnchanged).toBe(1);
    expect(report.flagsChecked).toBe(3);
  });
});
