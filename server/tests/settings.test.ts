/**
 * Tests for /api/settings routes.
 * Uses mocked FlagsmithClient to avoid real network calls.
 * Clearly labelled as unit tests — not live integration tests.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import * as creds from '../credentials.js';

// Mock FlagsmithClient.ping so tests never hit the real API
vi.mock('../../src/flagsmith/client.js', () => ({
  FlagsmithClient: vi.fn().mockImplementation(() => ({
    ping: vi.fn().mockResolvedValue({
      ok: true,
      organisations: [{ id: 1, name: 'Test Org', plan: 'free' }],
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
  beforeEach(() => {
    creds.clearCredentials();
  });

  it('returns 400 when apiKey is missing', async () => {
    const res = await request(app).post('/api/settings/connect').send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when apiUrl is invalid', async () => {
    const res = await request(app)
      .post('/api/settings/connect')
      .send({ apiKey: 'ser.testkey', apiUrl: 'not-a-url' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('stores credentials and returns connected when ping succeeds', async () => {
    const res = await request(app)
      .post('/api/settings/connect')
      .send({ apiKey: 'ser.testkey1234', apiUrl: 'https://api.flagsmith.com/api/v1' });
    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(true);
    expect(res.body.maskedKey).toBe('ser.…1234');
    expect(res.body.organisations).toHaveLength(1);
    // API key must NOT be in the response
    expect(JSON.stringify(res.body)).not.toContain('ser.testkey1234');
  });

  it('never exposes the full API key in the response', async () => {
    const secretKey = 'ser.supersecrettoken9999';
    const res = await request(app)
      .post('/api/settings/connect')
      .send({ apiKey: secretKey });
    const body = JSON.stringify(res.body);
    expect(body).not.toContain(secretKey);
  });
});

describe('GET /api/settings/status', () => {
  beforeEach(() => {
    creds.clearCredentials();
  });

  it('returns connected: false when no credentials set', async () => {
    const res = await request(app).get('/api/settings/status');
    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(false);
  });

  it('returns connected: true with masked key when credentials are set', async () => {
    creds.setCredentials('ser.validkey5678', 'https://api.flagsmith.com/api/v1');
    const res = await request(app).get('/api/settings/status');
    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(true);
    expect(res.body.maskedKey).toBe('ser.…5678');
    expect(JSON.stringify(res.body)).not.toContain('ser.validkey5678');
  });
});

describe('POST /api/settings/disconnect', () => {
  it('clears credentials', async () => {
    creds.setCredentials('ser.key', 'https://api.flagsmith.com/api/v1');
    const res = await request(app).post('/api/settings/disconnect').send({});
    expect(res.status).toBe(200);
    expect(res.body.disconnected).toBe(true);
    expect(creds.getCredentials()).toBeNull();
  });
});
