/**
 * Tests for /api/compare route.
 * Unit tests — mocked FlagsmithClient. No real API calls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import * as creds from '../credentials.js';

const DEFAULT_URL = 'https://api.flagsmith.com/api/v1';

const mockFeatures = [
  { id: 1, name: 'checkout_redesign', type: 'STANDARD' as const, description: '', is_archived: false, default_enabled: false, initial_value: null, created_date: '', project: 10 },
  { id: 2, name: 'hero_text',         type: 'STANDARD' as const, description: '', is_archived: false, default_enabled: false, initial_value: null, created_date: '', project: 10 },
];

const mockFeatureStates = (envId: number) => [
  {
    id: envId * 100 + 1,
    feature: 1, // numeric ID as returned by management API
    environment: envId,
    enabled: envId === 1,
    feature_state_value: null,
    multivariate_feature_state_values: [],
  },
  {
    id: envId * 100 + 2,
    feature: 2,
    environment: envId,
    enabled: true,
    feature_state_value: envId === 1 ? 'Save 20% Today' : 'Free Shipping',
    multivariate_feature_state_values: [],
  },
];

vi.mock('../../src/flagsmith/client.js', () => ({
  FlagsmithClient: vi.fn().mockImplementation(() => ({
    getEnvironments: vi.fn().mockResolvedValue([
      { id: 1, name: 'Staging',    api_key: 'env-key-staging', project: 10 },
      { id: 2, name: 'Production', api_key: 'env-key-prod',    project: 10 },
    ]),
    getFeatures: vi.fn().mockResolvedValue(mockFeatures),
    getFeatureStates: vi.fn().mockImplementation((key: string) =>
      Promise.resolve(mockFeatureStates(key === 'env-key-staging' ? 1 : 2))
    ),
  })),
  FlagsmithApiError: class FlagsmithApiError extends Error {
    statusCode?: number;
    constructor(msg: string, statusCode?: number) { super(msg); this.statusCode = statusCode; }
  },
}));

describe('POST /api/compare', () => {
  beforeEach(() => {
    creds.setCredentials('tok.testkey1234', DEFAULT_URL);
  });

  it('returns 401 when not configured', async () => {
    creds.clearCredentials();
    const savedToken = process.env.ORQUESTA_API_TOKEN;
    const savedLegacy = process.env.FLAGSMITH_API_KEY;
    delete process.env.ORQUESTA_API_TOKEN;
    delete process.env.FLAGSMITH_API_KEY;

    const res = await request(app).post('/api/compare').send({
      projectId: 10, sourceEnvName: 'Staging', targetEnvName: 'Production',
    });

    if (savedToken !== undefined) process.env.ORQUESTA_API_TOKEN = savedToken;
    if (savedLegacy !== undefined) process.env.FLAGSMITH_API_KEY = savedLegacy;

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('NOT_CONFIGURED');
  });

  it('returns 400 when body is missing required fields', async () => {
    const res = await request(app).post('/api/compare').send({ projectId: 10 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when environment does not exist', async () => {
    const res = await request(app).post('/api/compare').send({
      projectId: 10, sourceEnvName: 'Nonexistent', targetEnvName: 'Production',
    });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('ENV_NOT_FOUND');
  });

  it('returns real drift between Staging and Production', async () => {
    const res = await request(app).post('/api/compare').send({
      projectId: 10, sourceEnvName: 'Staging', targetEnvName: 'Production',
    });
    expect(res.status).toBe(200);
    expect(res.body.drifts).toBeDefined();
    expect(res.body.summary.total).toBeGreaterThan(0);
    const enabledDrift = res.body.drifts.find(
      (d: { category: string; feature: string }) =>
        d.category === 'enabled_state' && d.feature === 'checkout_redesign',
    );
    expect(enabledDrift).toBeDefined();
    const valueDrift = res.body.drifts.find(
      (d: { category: string; feature: string }) =>
        d.category === 'value_change' && d.feature === 'hero_text',
    );
    expect(valueDrift).toBeDefined();
  });

  it('never exposes environment api_key in the response', async () => {
    const res = await request(app).post('/api/compare').send({
      projectId: 10, sourceEnvName: 'Staging', targetEnvName: 'Production',
    });
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('env-key-staging');
    expect(body).not.toContain('env-key-prod');
  });

  it('reports no drift when environments are identical', async () => {
    const { FlagsmithClient } = await import('../../src/flagsmith/client.js');
    vi.mocked(FlagsmithClient).mockImplementationOnce(() => ({
      getEnvironments: vi.fn().mockResolvedValue([
        { id: 1, name: 'Staging',    api_key: 'key-a', project: 10 },
        { id: 2, name: 'Production', api_key: 'key-b', project: 10 },
      ]),
      getFeatures: vi.fn().mockResolvedValue([
        { id: 1, name: 'dark_mode', type: 'STANDARD', description: '', is_archived: false, default_enabled: false, initial_value: null, created_date: '', project: 10 },
      ]),
      getFeatureStates: vi.fn().mockResolvedValue([
        { id: 1, feature: 1, environment: 1, enabled: false, feature_state_value: null, multivariate_feature_state_values: [] },
      ]),
    } as any));

    creds.setCredentials('tok.testkey1234', DEFAULT_URL);
    const res = await request(app).post('/api/compare').send({
      projectId: 10, sourceEnvName: 'Staging', targetEnvName: 'Production',
    });
    expect(res.status).toBe(200);
    expect(res.body.summary.total).toBe(0);
  });
});
