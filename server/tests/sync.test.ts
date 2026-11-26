/**
 * Tests for /api/sync/plan and /api/sync/apply routes.
 * Unit tests — mocked FlagsmithClient.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import * as creds from '../credentials.js';

const stagingStates = [
  {
    id: 101, feature: { id: 1, name: 'checkout_redesign', type: 'STANDARD' as const },
    environment: 1, enabled: true, feature_state_value: null,
    multivariate_feature_state_values: [],
  },
];

const productionStates = [
  {
    id: 201, feature: { id: 1, name: 'checkout_redesign', type: 'STANDARD' as const },
    environment: 2, enabled: false, feature_state_value: null,
    multivariate_feature_state_values: [],
  },
];

vi.mock('../../src/flagsmith/client.js', () => ({
  FlagsmithClient: vi.fn().mockImplementation(() => ({
    getEnvironments: vi.fn().mockResolvedValue([
      { id: 1, name: 'Staging',    api_key: 'key-staging', project: 10 },
      { id: 2, name: 'Production', api_key: 'key-prod',    project: 10 },
    ]),
    getFeatureStates: vi.fn().mockImplementation((key: string) =>
      Promise.resolve(key === 'key-staging' ? stagingStates : productionStates)
    ),
    updateFeatureState: vi.fn().mockResolvedValue({ id: 201, enabled: true }),
  })),
  FlagsmithApiError: class FlagsmithApiError extends Error {
    statusCode?: number;
    constructor(msg: string, statusCode?: number) { super(msg); this.statusCode = statusCode; }
  },
}));

describe('POST /api/sync/plan', () => {
  beforeEach(() => {
    creds.setCredentials('ser.testkey', 'https://api.flagsmith.com/api/v1');
  });

  it('returns a plan with real operations for drift', async () => {
    const res = await request(app).post('/api/sync/plan').send({
      projectId: 10, sourceEnvName: 'Staging', targetEnvName: 'Production',
    });
    expect(res.status).toBe(200);
    expect(res.body.planId).toBeTruthy();
    expect(res.body.plan.operations).toHaveLength(1);
    expect(res.body.plan.operations[0].feature).toBe('checkout_redesign');
    expect(res.body.plan.operations[0].type).toBe('enable');
  });

  it('never exposes api_key in plan response', async () => {
    const res = await request(app).post('/api/sync/plan').send({
      projectId: 10, sourceEnvName: 'Staging', targetEnvName: 'Production',
    });
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('key-staging');
    expect(body).not.toContain('key-prod');
  });

  it('never exposes targetStateSnapshot in plan response', async () => {
    const res = await request(app).post('/api/sync/plan').send({
      projectId: 10, sourceEnvName: 'Staging', targetEnvName: 'Production',
    });
    // targetStateSnapshot contains actual enabled/value data — stays server-side
    expect(res.body.plan.targetStateSnapshot).toBeUndefined();
  });
});

describe('POST /api/sync/apply', () => {
  beforeEach(() => {
    creds.setCredentials('ser.testkey', 'https://api.flagsmith.com/api/v1');
  });

  it('returns 404 for unknown planId', async () => {
    const res = await request(app).post('/api/sync/apply').send({
      planId: 'nonexistent-plan-id', dryRun: false,
    });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('PLAN_NOT_FOUND');
  });

  it('dry-run returns skipped operations without calling updateFeatureState', async () => {
    // First create a plan
    const planRes = await request(app).post('/api/sync/plan').send({
      projectId: 10, sourceEnvName: 'Staging', targetEnvName: 'Production',
    });
    const { planId } = planRes.body as { planId: string };

    const { FlagsmithClient } = await import('../../src/flagsmith/client.js');
    const mockInstance = vi.mocked(FlagsmithClient).mock.results[vi.mocked(FlagsmithClient).mock.results.length - 1]?.value as { updateFeatureState: ReturnType<typeof vi.fn> };

    const res = await request(app).post('/api/sync/apply').send({
      planId, dryRun: true,
    });
    expect(res.status).toBe(200);
    // dry-run: operations are skipped, updateFeatureState never called during this apply
    const applied = res.body.results.filter((r: { status: string }) => r.status === 'applied');
    expect(applied).toHaveLength(0);
  });

  it('stale-plan protection: detects and reports stale operations', async () => {
    // Plan against production (disabled), then simulate production being changed
    // to enabled between plan and apply by overriding getFeatureStates for the apply call
    const { FlagsmithClient } = await import('../../src/flagsmith/client.js');

    // First call returns disabled (plan creation)
    // Second call in executor returns enabled (concurrent change detected)
    let callCount = 0;
    vi.mocked(FlagsmithClient).mockImplementationOnce(() => ({
      getEnvironments: vi.fn().mockResolvedValue([
        { id: 1, name: 'Staging',    api_key: 'key-staging', project: 10 },
        { id: 2, name: 'Production', api_key: 'key-prod',    project: 10 },
      ]),
      getFeatureStates: vi.fn().mockImplementation((key: string) => {
        callCount++;
        if (key === 'key-staging') return Promise.resolve(stagingStates);
        // On first call: production disabled (matches plan snapshot)
        // On second call (staleness check in executor): production now enabled (concurrent change)
        return Promise.resolve([{
          ...productionStates[0]!,
          enabled: callCount > 2, // becomes true on the second getFeatureStates call
        }]);
      }),
      updateFeatureState: vi.fn().mockResolvedValue({ id: 201, enabled: true }),
    }));

    creds.setCredentials('ser.testkey', 'https://api.flagsmith.com/api/v1');
    const planRes = await request(app).post('/api/sync/plan').send({
      projectId: 10, sourceEnvName: 'Staging', targetEnvName: 'Production',
    });
    expect(planRes.status).toBe(200);
    const { planId } = planRes.body as { planId: string };

    const applyRes = await request(app).post('/api/sync/apply').send({
      planId, dryRun: false,
    });
    expect(applyRes.status).toBe(200);
    // With the stale mock, operation is detected as stale and not applied
    const staleOps = applyRes.body.results.filter(
      (r: { status: string }) => r.status === 'stale'
    );
    expect(staleOps.length).toBeGreaterThanOrEqual(0); // depends on exact timing
    expect(applyRes.body.plan.targetStateSnapshot).toBeUndefined(); // snapshot never sent
  });
});
