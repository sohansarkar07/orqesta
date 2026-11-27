/**
 * Tests for the identity-level evaluation engine.
 * Uses mocked HTTP calls — no live Flagsmith requests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { runIdentityEvaluation } from '../src/audience/evaluator.js';
import type { IdentityFixture } from '../src/audience/eval-types.js';

vi.mock('axios');

const mockAxios = vi.mocked(axios, true);

// Helper to build a mock Flagsmith Flags API response
function mockFlagsResponse(flags: Array<{
  name: string;
  enabled: boolean;
  value?: string | number | boolean | null;
  variant?: string | null;
}>) {
  return {
    identifier: 'test',
    flags: flags.map((f) => ({
      feature: { id: Math.random(), name: f.name, type: 'STANDARD' },
      enabled: f.enabled,
      feature_state_value: f.value ?? null,
      reason: 'STATIC',
      variant: f.variant ?? null,
    })),
    traits: [],
  };
}

const identities: IdentityFixture[] = [
  { identifier: 'user_a', traits: [{ key: 'plan', value: 'premium' }] },
  { identifier: 'user_b', traits: [] },
];

beforeEach(() => {
  vi.clearAllMocks();

  // Mock axios.create to return an object with a post method
  const mockPost = vi.fn();
  mockAxios.create = vi.fn().mockReturnValue({ post: mockPost });

  // Default: source has dark_mode enabled, target has it disabled
  mockPost
    .mockResolvedValueOnce({ data: mockFlagsResponse([
      { name: 'dark_mode', enabled: true, value: 'auto' },
      { name: 'checkout_v2', enabled: true, value: null },
    ]) })
    .mockResolvedValueOnce({ data: mockFlagsResponse([
      { name: 'dark_mode', enabled: false, value: 'auto' },
      { name: 'checkout_v2', enabled: true, value: null },
    ]) })
    // second identity — same responses
    .mockResolvedValueOnce({ data: mockFlagsResponse([
      { name: 'dark_mode', enabled: true, value: 'auto' },
    ]) })
    .mockResolvedValueOnce({ data: mockFlagsResponse([
      { name: 'dark_mode', enabled: false, value: 'auto' },
    ]) });
});

describe('runIdentityEvaluation', () => {
  it('detects ENABLEMENT_REGRESSION when flag is enabled in source but disabled in target', async () => {
    const report = await runIdentityEvaluation(
      'Development', 'Production',
      'dev-key', 'prod-key',
      'https://edge.api.flagsmith.com/api/v1',
      [identities[0]!],
    );

    expect(report.totalRegressions).toBe(1);
    const reg = report.results[0]!.regressions[0]!;
    expect(reg.type).toBe('ENABLEMENT_REGRESSION');
    expect(reg.severity).toBe('critical');
    expect(reg.feature).toBe('dark_mode');
    expect(reg.source.enabled).toBe(true);
    expect(reg.target!.enabled).toBe(false);
  });

  it('reports UNCHANGED for features with identical evaluation', async () => {
    const report = await runIdentityEvaluation(
      'Development', 'Production',
      'dev-key', 'prod-key',
      'https://edge.api.flagsmith.com/api/v1',
      [identities[0]!],
    );

    // checkout_v2 is same in both → no regression
    const checkoutReg = report.results[0]!.regressions.find((r) => r.feature === 'checkout_v2');
    expect(checkoutReg).toBeUndefined();
  });

  it('evaluates multiple identities independently', async () => {
    const report = await runIdentityEvaluation(
      'Development', 'Production',
      'dev-key', 'prod-key',
      'https://edge.api.flagsmith.com/api/v1',
      identities,
    );

    expect(report.identitiesEvaluated).toBe(2);
    expect(report.results).toHaveLength(2);
    expect(report.results[0]!.identifier).toBe('user_a');
    expect(report.results[1]!.identifier).toBe('user_b');
  });

  it('records an EVALUATION_ERROR when the Flags API fails', async () => {
    // Reset mock to throw
    const mockPost = vi.fn().mockRejectedValue(
      Object.assign(new Error('Network error'), { isAxiosError: true, response: undefined })
    );
    mockAxios.create = vi.fn().mockReturnValue({ post: mockPost });
    vi.mocked(axios.isAxiosError).mockReturnValue(true);

    const report = await runIdentityEvaluation(
      'Development', 'Production',
      'bad-key', 'bad-key',
      'https://edge.api.flagsmith.com/api/v1',
      [{ identifier: 'user_error', traits: [] }],
    );

    expect(report.results[0]!.error).toBeDefined();
    expect(report.results[0]!.regressions).toHaveLength(0);
  });

  it('applies feature filter correctly', async () => {
    // Both calls return dark_mode + checkout_v2
    const mockPost = vi.fn()
      .mockResolvedValueOnce({ data: mockFlagsResponse([
        { name: 'dark_mode', enabled: true },
        { name: 'checkout_v2', enabled: false },
      ]) })
      .mockResolvedValueOnce({ data: mockFlagsResponse([
        { name: 'dark_mode', enabled: false },
        { name: 'checkout_v2', enabled: true },
      ]) });
    mockAxios.create = vi.fn().mockReturnValue({ post: mockPost });

    const report = await runIdentityEvaluation(
      'Dev', 'Prod',
      'k1', 'k2',
      'https://edge.api.flagsmith.com/api/v1',
      [{ identifier: 'user_a', traits: [] }],
      ['dark_mode'], // only check dark_mode
    );

    // Only dark_mode should be in results
    const featureNames = report.results[0]!.regressions.map((r) => r.feature);
    expect(featureNames).toContain('dark_mode');
    expect(featureNames).not.toContain('checkout_v2');
  });

  it('summary counts are correct', async () => {
    const mockPost = vi.fn()
      // identity 1: source
      .mockResolvedValueOnce({ data: mockFlagsResponse([
        { name: 'feat_a', enabled: true },
        { name: 'feat_b', enabled: true, value: 'old' },
      ]) })
      // identity 1: target
      .mockResolvedValueOnce({ data: mockFlagsResponse([
        { name: 'feat_a', enabled: false },   // ENABLEMENT_REGRESSION → critical
        { name: 'feat_b', enabled: true, value: 'new' }, // VALUE_CHANGE → info
      ]) });
    mockAxios.create = vi.fn().mockReturnValue({ post: mockPost });

    const report = await runIdentityEvaluation(
      'Dev', 'Prod', 'k1', 'k2',
      'https://edge.api.flagsmith.com/api/v1',
      [{ identifier: 'user_a', traits: [] }],
    );

    expect(report.summary.critical).toBe(1);
    expect(report.summary.info).toBe(1);
    expect(report.summary.total).toBe(2);
  });
});
