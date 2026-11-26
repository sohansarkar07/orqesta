/**
 * Tests for DriftComparator
 */

import { describe, it, expect } from 'vitest';
import { DriftComparator } from '../src/drift/comparator.js';
import type { FlagsmithEnvironmentDocument } from '../src/types/flagsmith.js';

function makeDoc(
  apiKey: string,
  flags: Array<{
    name: string;
    enabled: boolean;
    value?: string | number | boolean | null;
    mvAllocations?: Array<{ optionId: number; percentage: number }>;
  }>,
): FlagsmithEnvironmentDocument {
  return {
    id: 1,
    api_key: apiKey,
    project: {
      id: 1,
      name: 'test',
      organisation: 1,
      hide_disabled_flags: false,
      segments: [],
    },
    feature_states: flags.map((f, idx) => ({
      id: idx + 1,
      feature: { id: idx + 1, name: f.name, type: 'STANDARD' },
      enabled: f.enabled,
      value: f.value ?? null,
      multivariate_feature_state_values:
        f.mvAllocations?.map((a) => ({
          id: a.optionId,
          multivariate_feature_option: a.optionId,
          percentage_allocation: a.percentage,
        })) ?? [],
    })),
  };
}

describe('DriftComparator', () => {
  it('reports no drift when environments are identical', () => {
    const sourceDoc = makeDoc('key-src', [
      { name: 'checkout_redesign', enabled: true, value: 'variant_b' },
      { name: 'dark_mode', enabled: false },
    ]);
    const targetDoc = makeDoc('key-tgt', [
      { name: 'checkout_redesign', enabled: true, value: 'variant_b' },
      { name: 'dark_mode', enabled: false },
    ]);

    const result = DriftComparator.compare(sourceDoc, 'Staging', targetDoc, 'Production');

    expect(result.drifts).toHaveLength(0);
    expect(result.summary.total).toBe(0);
  });

  it('detects enabled-state drift', () => {
    const sourceDoc = makeDoc('key-src', [
      { name: 'checkout_redesign', enabled: true },
    ]);
    const targetDoc = makeDoc('key-tgt', [
      { name: 'checkout_redesign', enabled: false },
    ]);

    const result = DriftComparator.compare(sourceDoc, 'Staging', targetDoc, 'Production');

    expect(result.drifts).toHaveLength(1);
    expect(result.drifts[0]!.category).toBe('enabled_state');
    expect(result.drifts[0]!.feature).toBe('checkout_redesign');
    expect(result.drifts[0]!.sourceValue).toBe(true);
    expect(result.drifts[0]!.targetValue).toBe(false);
    expect(result.summary.byCategory.enabled_state).toBe(1);
  });

  it('detects value drift', () => {
    const sourceDoc = makeDoc('key-src', [
      { name: 'hero_text', enabled: true, value: 'Save 20% today' },
    ]);
    const targetDoc = makeDoc('key-tgt', [
      { name: 'hero_text', enabled: true, value: 'Free shipping' },
    ]);

    const result = DriftComparator.compare(sourceDoc, 'Staging', targetDoc, 'Production');

    expect(result.drifts).toHaveLength(1);
    expect(result.drifts[0]!.category).toBe('value_change');
    expect(result.drifts[0]!.sourceValue).toBe('Save 20% today');
    expect(result.drifts[0]!.targetValue).toBe('Free shipping');
  });

  it('detects missing-in-target', () => {
    const sourceDoc = makeDoc('key-src', [
      { name: 'new_onboarding', enabled: true },
    ]);
    const targetDoc = makeDoc('key-tgt', []);

    const result = DriftComparator.compare(sourceDoc, 'Staging', targetDoc, 'Production');

    expect(result.drifts).toHaveLength(1);
    expect(result.drifts[0]!.category).toBe('missing_in_target');
    expect(result.drifts[0]!.feature).toBe('new_onboarding');
  });

  it('detects missing-in-source (extra in target)', () => {
    const sourceDoc = makeDoc('key-src', []);
    const targetDoc = makeDoc('key-tgt', [
      { name: 'old_feature', enabled: true },
    ]);

    const result = DriftComparator.compare(sourceDoc, 'Staging', targetDoc, 'Production');

    expect(result.drifts).toHaveLength(1);
    expect(result.drifts[0]!.category).toBe('missing_in_source');
  });

  it('detects multivariate allocation drift', () => {
    const sourceDoc = makeDoc('key-src', [
      {
        name: 'checkout_variant',
        enabled: true,
        mvAllocations: [
          { optionId: 1, percentage: 50 },
          { optionId: 2, percentage: 50 },
        ],
      },
    ]);
    const targetDoc = makeDoc('key-tgt', [
      {
        name: 'checkout_variant',
        enabled: true,
        mvAllocations: [
          { optionId: 1, percentage: 70 },
          { optionId: 2, percentage: 30 },
        ],
      },
    ]);

    const result = DriftComparator.compare(sourceDoc, 'Staging', targetDoc, 'Production');

    expect(result.drifts).toHaveLength(1);
    expect(result.drifts[0]!.category).toBe('multivariate_allocation');
  });

  it('reports correct summary counts for multiple drift types', () => {
    const sourceDoc = makeDoc('key-src', [
      { name: 'feature_a', enabled: true },
      { name: 'feature_b', enabled: true, value: 'new_value' },
      { name: 'feature_c', enabled: true }, // missing in target
    ]);
    const targetDoc = makeDoc('key-tgt', [
      { name: 'feature_a', enabled: false }, // enabled state drift
      { name: 'feature_b', enabled: true, value: 'old_value' }, // value drift
    ]);

    const result = DriftComparator.compare(sourceDoc, 'Staging', targetDoc, 'Production');

    expect(result.summary.byCategory.enabled_state).toBe(1);
    expect(result.summary.byCategory.value_change).toBe(1);
    expect(result.summary.byCategory.missing_in_target).toBe(1);
    expect(result.summary.total).toBe(3);
  });

  it('records source and target metadata', () => {
    const sourceDoc = makeDoc('key-src', []);
    const targetDoc = makeDoc('key-tgt', []);

    const result = DriftComparator.compare(sourceDoc, 'Staging', targetDoc, 'Production');

    expect(result.source.environment).toBe('Staging');
    expect(result.source.apiKey).toBe('key-src');
    expect(result.target.environment).toBe('Production');
    expect(result.target.apiKey).toBe('key-tgt');
    expect(result.timestamp).toBeTruthy();
  });

  it('does not report drift when only multivariate option order differs', () => {
    // Order of allocations should not matter — comparison is sorted by ID
    const sourceDoc = makeDoc('key-src', [
      {
        name: 'ab_test',
        enabled: true,
        mvAllocations: [
          { optionId: 1, percentage: 50 },
          { optionId: 2, percentage: 50 },
        ],
      },
    ]);
    const targetDoc = makeDoc('key-tgt', [
      {
        name: 'ab_test',
        enabled: true,
        mvAllocations: [
          { optionId: 2, percentage: 50 },
          { optionId: 1, percentage: 50 },
        ],
      },
    ]);

    const result = DriftComparator.compare(sourceDoc, 'Staging', targetDoc, 'Production');

    // Same allocations, just different order — should not be reported as drift
    expect(result.drifts).toHaveLength(0);
  });
});
