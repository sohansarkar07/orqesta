/**
 * Tests for SyncPlanner
 */

import { describe, it, expect } from 'vitest';
import { SyncPlanner } from '../src/sync/planner.js';
import type { DriftReport } from '../src/types/drift.js';
import type { FlagsmithFeatureState } from '../src/types/flagsmith.js';

function makeFeatureState(
  id: number,
  name: string,
  enabled: boolean,
  value?: string | null,
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

describe('SyncPlanner', () => {
  it('produces an enable operation for an enabled_state drift', () => {
    const drift = makeDrift({
      drifts: [
        {
          feature: 'checkout_redesign',
          category: 'enabled_state',
          sourceValue: true,
          targetValue: false,
          description: 'Staging: enabled → Production: disabled',
        },
      ],
      summary: {
        total: 1,
        byCategory: { enabled_state: 1, value_change: 0, multivariate_allocation: 0, missing_in_source: 0, missing_in_target: 0 },
      },
    });

    const targetStates = [makeFeatureState(42, 'checkout_redesign', false)];
    const plan = SyncPlanner.buildPlan(drift, targetStates);

    expect(plan.operations).toHaveLength(1);
    const op = plan.operations[0]!;
    expect(op.type).toBe('enable');
    expect(op.feature).toBe('checkout_redesign');
    expect(op.featureStateId).toBe(42);
    expect(op.proposedValue).toBe(true);
    expect(op.currentValue).toBe(false);
  });

  it('produces a disable operation for a disabled source', () => {
    const drift = makeDrift({
      drifts: [
        {
          feature: 'old_feature',
          category: 'enabled_state',
          sourceValue: false,
          targetValue: true,
          description: 'Staging: disabled → Production: enabled',
        },
      ],
      summary: {
        total: 1,
        byCategory: { enabled_state: 1, value_change: 0, multivariate_allocation: 0, missing_in_source: 0, missing_in_target: 0 },
      },
    });

    const targetStates = [makeFeatureState(7, 'old_feature', true)];
    const plan = SyncPlanner.buildPlan(drift, targetStates);

    expect(plan.operations[0]!.type).toBe('disable');
    expect(plan.operations[0]!.featureStateId).toBe(7);
  });

  it('produces a set_value operation for a value drift', () => {
    const drift = makeDrift({
      drifts: [
        {
          feature: 'hero_text',
          category: 'value_change',
          sourceValue: 'Save 20% today',
          targetValue: 'Free shipping',
          description: 'Value differs',
        },
      ],
      summary: {
        total: 1,
        byCategory: { enabled_state: 0, value_change: 1, multivariate_allocation: 0, missing_in_source: 0, missing_in_target: 0 },
      },
    });

    const targetStates = [makeFeatureState(15, 'hero_text', true, 'Free shipping')];
    const plan = SyncPlanner.buildPlan(drift, targetStates);

    expect(plan.operations[0]!.type).toBe('set_value');
    expect(plan.operations[0]!.proposedValue).toBe('Save 20% today');
    expect(plan.operations[0]!.featureStateId).toBe(15);
  });

  it('marks missing_in_target as requiring manual intervention (no featureStateId)', () => {
    const drift = makeDrift({
      drifts: [
        {
          feature: 'new_onboarding',
          category: 'missing_in_target',
          sourceValue: { enabled: true },
          targetValue: null,
          description: 'Feature exists in Staging but not in Production',
        },
      ],
      summary: {
        total: 1,
        byCategory: { enabled_state: 0, value_change: 0, multivariate_allocation: 0, missing_in_source: 0, missing_in_target: 1 },
      },
    });

    const plan = SyncPlanner.buildPlan(drift, []);

    expect(plan.operations).toHaveLength(1);
    expect(plan.operations[0]!.featureStateId).toBeUndefined();
    expect(plan.operations[0]!.description).toContain('Manual creation required');
  });

  it('skips missing_in_source (cannot sync source → target when source lacks it)', () => {
    const drift = makeDrift({
      drifts: [
        {
          feature: 'extra_in_prod',
          category: 'missing_in_source',
          sourceValue: null,
          targetValue: { enabled: true },
          description: 'Extra in Production',
        },
      ],
      summary: {
        total: 1,
        byCategory: { enabled_state: 0, value_change: 0, multivariate_allocation: 0, missing_in_source: 1, missing_in_target: 0 },
      },
    });

    const plan = SyncPlanner.buildPlan(drift, []);
    // missing_in_source is explicitly excluded from the plan
    expect(plan.operations).toHaveLength(0);
  });

  it('produces a valid checksum and verifies it', () => {
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

    const plan = SyncPlanner.buildPlan(drift, [
      makeFeatureState(99, 'feature_x', false),
    ]);

    expect(plan.checksum).toBeTruthy();
    expect(SyncPlanner.verifyChecksum(plan)).toBe(true);
  });

  it('detects a tampered plan (checksum mismatch)', () => {
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

    const plan = SyncPlanner.buildPlan(drift, [
      makeFeatureState(99, 'feature_x', false),
    ]);

    // Tamper with the plan
    const tampered = { ...plan, checksum: 'invalid_checksum' };
    expect(SyncPlanner.verifyChecksum(tampered)).toBe(false);
  });

  it('records source and target metadata', () => {
    const drift = makeDrift();
    const plan = SyncPlanner.buildPlan(drift, []);

    expect(plan.source.environment).toBe('Staging');
    expect(plan.target.environment).toBe('Production');
    expect(plan.createdAt).toBeTruthy();
  });
});
