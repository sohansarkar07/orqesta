/**
 * Tests for staleness detection in SyncPlanner
 */

import { describe, it, expect } from 'vitest';
import { SyncPlanner } from '../src/sync/planner.js';
import type { DriftReport } from '../src/types/drift.js';
import type { FlagsmithFeatureState } from '../src/types/flagsmith.js';

function makeFeatureState(
  id: number,
  name: string,
  enabled: boolean,
  value?: string | number | boolean | null,
): FlagsmithFeatureState {
  return {
    id,
    feature: { id, name, type: 'STANDARD' },
    environment: 1,
    enabled,
    feature_state_value: value ?? null,
    multivariate_feature_state_values: [],
  };
}

function makeDrift(overrides: Partial<DriftReport> = {}): DriftReport {
  return {
    source: { environment: 'Staging', apiKey: 'key-src' },
    target: { environment: 'Production', apiKey: 'key-tgt' },
    timestamp: new Date().toISOString(),
    drifts: [],
    summary: {
      total: 0,
      byCategory: {
        enabled_state: 0,
        value_change: 0,
        multivariate_allocation: 0,
        missing_in_source: 0,
        missing_in_target: 0,
      },
    },
    ...overrides,
  };
}

describe('SyncPlanner staleness detection', () => {
  it('detects no stale operations when target is unchanged', () => {
    const drift = makeDrift({
      drifts: [
        {
          feature: 'checkout_redesign',
          category: 'enabled_state',
          sourceValue: true,
          targetValue: false,
          description: 'test',
        },
      ],
    });

    const targetStatesAtPlanTime = [
      makeFeatureState(42, 'checkout_redesign', false, 'old_val'),
    ];

    const plan = SyncPlanner.buildPlan(drift, targetStatesAtPlanTime);

    // Current state is identical to plan-time state
    const currentTargetStates = [
      makeFeatureState(42, 'checkout_redesign', false, 'old_val'),
    ];

    const stale = SyncPlanner.detectStaleOperations(plan, currentTargetStates);
    expect(stale).toHaveLength(0);
  });

  it('detects stale operation when enabled state changed', () => {
    const drift = makeDrift({
      drifts: [
        {
          feature: 'feature_x',
          category: 'enabled_state',
          sourceValue: true,
          targetValue: false,
          description: 'test',
        },
      ],
    });

    const targetStatesAtPlanTime = [makeFeatureState(10, 'feature_x', false)];
    const plan = SyncPlanner.buildPlan(drift, targetStatesAtPlanTime);

    // Someone else enabled it after the plan was created
    const currentTargetStates = [makeFeatureState(10, 'feature_x', true)];

    const stale = SyncPlanner.detectStaleOperations(plan, currentTargetStates);
    expect(stale).toHaveLength(1);
    expect(stale[0]!.feature).toBe('feature_x');
    expect(stale[0]!.reason).toContain('enabled was false but is now true');
  });

  it('detects stale operation when value changed', () => {
    const drift = makeDrift({
      drifts: [
        {
          feature: 'hero_text',
          category: 'value_change',
          sourceValue: 'Save 20%',
          targetValue: 'Free shipping',
          description: 'test',
        },
      ],
    });

    const targetStatesAtPlanTime = [
      makeFeatureState(20, 'hero_text', true, 'Free shipping'),
    ];
    const plan = SyncPlanner.buildPlan(drift, targetStatesAtPlanTime);

    // Someone changed the value after the plan was created
    const currentTargetStates = [
      makeFeatureState(20, 'hero_text', true, 'Different value'),
    ];

    const stale = SyncPlanner.detectStaleOperations(plan, currentTargetStates);
    expect(stale).toHaveLength(1);
    expect(stale[0]!.feature).toBe('hero_text');
    expect(stale[0]!.reason).toContain('value was "Free shipping" but is now "Different value"');
  });

  it('detects stale operation when both enabled and value changed', () => {
    const drift = makeDrift({
      drifts: [
        {
          feature: 'combined',
          category: 'enabled_state',
          sourceValue: true,
          targetValue: false,
          description: 'test',
        },
      ],
    });

    const targetStatesAtPlanTime = [
      makeFeatureState(30, 'combined', false, 'initial'),
    ];
    const plan = SyncPlanner.buildPlan(drift, targetStatesAtPlanTime);

    // Both changed
    const currentTargetStates = [
      makeFeatureState(30, 'combined', true, 'changed'),
    ];

    const stale = SyncPlanner.detectStaleOperations(plan, currentTargetStates);
    expect(stale).toHaveLength(1);
    expect(stale[0]!.reason).toContain('enabled was false but is now true');
    expect(stale[0]!.reason).toContain('value was "initial" but is now "changed"');
  });

  it('detects no staleness for multiple operations when all unchanged', () => {
    const drift = makeDrift({
      drifts: [
        {
          feature: 'feature_a',
          category: 'enabled_state',
          sourceValue: true,
          targetValue: false,
          description: 'test',
        },
        {
          feature: 'feature_b',
          category: 'value_change',
          sourceValue: 'new',
          targetValue: 'old',
          description: 'test',
        },
      ],
    });

    const targetStatesAtPlanTime = [
      makeFeatureState(1, 'feature_a', false),
      makeFeatureState(2, 'feature_b', true, 'old'),
    ];
    const plan = SyncPlanner.buildPlan(drift, targetStatesAtPlanTime);

    // All unchanged
    const currentTargetStates = [
      makeFeatureState(1, 'feature_a', false),
      makeFeatureState(2, 'feature_b', true, 'old'),
    ];

    const stale = SyncPlanner.detectStaleOperations(plan, currentTargetStates);
    expect(stale).toHaveLength(0);
  });

  it('detects staleness for one of multiple operations', () => {
    const drift = makeDrift({
      drifts: [
        {
          feature: 'stable_feature',
          category: 'enabled_state',
          sourceValue: true,
          targetValue: false,
          description: 'test',
        },
        {
          feature: 'changed_feature',
          category: 'value_change',
          sourceValue: 'new',
          targetValue: 'old',
          description: 'test',
        },
      ],
    });

    const targetStatesAtPlanTime = [
      makeFeatureState(1, 'stable_feature', false),
      makeFeatureState(2, 'changed_feature', true, 'old'),
    ];
    const plan = SyncPlanner.buildPlan(drift, targetStatesAtPlanTime);

    // One changed, one unchanged
    const currentTargetStates = [
      makeFeatureState(1, 'stable_feature', false),
      makeFeatureState(2, 'changed_feature', true, 'concurrent_change'),
    ];

    const stale = SyncPlanner.detectStaleOperations(plan, currentTargetStates);
    expect(stale).toHaveLength(1);
    expect(stale[0]!.feature).toBe('changed_feature');
  });

  it('ignores operations without featureStateId', () => {
    const drift = makeDrift({
      drifts: [
        {
          feature: 'missing_in_target',
          category: 'missing_in_target',
          sourceValue: { enabled: true },
          targetValue: null,
          description: 'test',
        },
      ],
    });

    const plan = SyncPlanner.buildPlan(drift, []);

    // Operation has no featureStateId, so staleness check should skip it
    const stale = SyncPlanner.detectStaleOperations(plan, []);
    expect(stale).toHaveLength(0);
  });

  it('handles missing feature states gracefully', () => {
    const drift = makeDrift({
      drifts: [
        {
          feature: 'feature_x',
          category: 'enabled_state',
          sourceValue: true,
          targetValue: false,
          description: 'test',
        },
      ],
    });

    const targetStatesAtPlanTime = [makeFeatureState(99, 'feature_x', false)];
    const plan = SyncPlanner.buildPlan(drift, targetStatesAtPlanTime);

    // Current states are empty (feature was deleted)
    const stale = SyncPlanner.detectStaleOperations(plan, []);
    expect(stale).toHaveLength(0); // No crash — just no detection
  });
});
