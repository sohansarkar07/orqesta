/**
 * Tests for /api/settings routes.
 * Uses mocked FlagsmithClient to avoid real network calls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import * as creds from '../credentials.js';

const DEFAULT_URL = 'https://api.flagsmith.com/api/v1';

vi.mock('../../src/flagsmith/client.js', () => ({
  FlagsmithClient: vi.fn().mockImplementation(() => ({
    ping: vi.fn().mockResolvedValue({
      management: { ok: true, organisations: [{ id: 1, name: 'Test Org', plan: 'free' }] },
      flags:      { ok: false },
    }),
  })),
  FlagsmithApiError: class FlagsmithApiError extends Error {
    statusCode?: number;
    constructor(msg: string, statusCode?: number) {
      super(msg);
      this.statusCode = statusCode;
    }
  },
}));

describe('POST /api/settings/connect', () => {
  beforeEach(() => { creds.clearCredentials(); });

  it('returns 400 when apiKey is missing', async () => {
    const res = await request(app).post('/api/settings/connect').send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when apiUrl is invalid', async () => {
    const res = await request(app)
      .post('/api/settings/connect')
      .send({ apiKey: 'tok.testkey', apiUrl: 'not-a-url' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('stores credentials and returns connected when ping succeeds', async () => {
    const res = await request(app)
      .post('/api/settings/connect')
      .send({ apiKey: 'tok.testkey1234', apiUrl: DEFAULT_URL });
    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(true);
    expect(res.body.maskedKey).toBe('tok.…1234');
    expect(res.body.organisations).toHaveLength(1);
    expect(JSON.stringify(res.body)).not.toContain('tok.testkey1234');
  });

  it('never exposes the full API key in the response', async () => {
    const secret = 'tok.supersecrettoken9999';
    const res = await request(app).post('/api/settings/connect').send({ apiKey: secret });
    expect(JSON.stringify(res.body)).not.toContain(secret);
  });
});

describe('GET /api/settings/status', () => {
  beforeEach(() => { creds.clearCredentials(); });

  it('returns connected: false when no credentials set', async () => {
    // Ensure env vars don't interfere
    const saved = process.env.ORQUESTA_API_TOKEN;
    delete process.env.ORQUESTA_API_TOKEN;
    const savedLegacy = process.env.FLAGSMITH_API_KEY;
    delete process.env.FLAGSMITH_API_KEY;

    const res = await request(app).get('/api/settings/status');

    if (saved !== undefined) process.env.ORQUESTA_API_TOKEN = saved;
    if (savedLegacy !== undefined) process.env.FLAGSMITH_API_KEY = savedLegacy;

    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(false);
  });

  it('returns connected: true with masked key when credentials are set', async () => {
    creds.setCredentials('tok.validkey5678', DEFAULT_URL);
    const res = await request(app).get('/api/settings/status');
    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(true);
    expect(res.body.maskedKey).toBe('tok.…5678');
    expect(JSON.stringify(res.body)).not.toContain('tok.validkey5678');
  });
});

describe('POST /api/settings/disconnect', () => {
  it('clears credentials', async () => {
    creds.setCredentials('tok.somekey1234', DEFAULT_URL);
    expect(creds.getCredentials()).not.toBeNull();
    const res = await request(app).post('/api/settings/disconnect').send({});
    expect(res.status).toBe(200);
    expect(res.body.disconnected).toBe(true);
    // Temporarily hide env vars so loadFromEnv doesn't refill
    const savedToken = process.env.ORQUESTA_API_TOKEN;
    const savedLegacy = process.env.FLAGSMITH_API_KEY;
    delete process.env.ORQUESTA_API_TOKEN;
    delete process.env.FLAGSMITH_API_KEY;
    expect(creds.getCredentials()).toBeNull();
    if (savedToken !== undefined) process.env.ORQUESTA_API_TOKEN = savedToken;
    if (savedLegacy !== undefined) process.env.FLAGSMITH_API_KEY = savedLegacy;
  });
});
