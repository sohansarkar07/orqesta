/**
 * Server-side credential manager.
 * API keys are stored here and NEVER sent to the browser.
 * The frontend receives only masked representations.
 */

import { FlagsmithClient } from '../src/flagsmith/client.js';

interface StoredCredentials {
  apiKey: string;
  apiUrl: string;
}

// In-memory store for the running server session.
// On server restart, credentials must be re-entered — by design.
// For persistence across restarts, reads from env vars first.
let _credentials: StoredCredentials | null = null;

const DEFAULT_API_URL = 'https://api.flagsmith.com/api/v1';

function loadFromEnv(): StoredCredentials | null {
  const apiKey = process.env.FLAGSMITH_API_KEY;
  const apiUrl = process.env.FLAGSMITH_API_URL ?? DEFAULT_API_URL;
  if (apiKey && apiKey.trim()) {
    return { apiKey: apiKey.trim(), apiUrl: apiUrl.trim() };
  }
  return null;
}

export function getCredentials(): StoredCredentials | null {
  if (_credentials) return _credentials;
  // Fall back to env vars on first access
  const fromEnv = loadFromEnv();
  if (fromEnv) {
    _credentials = fromEnv;
  }
  return _credentials;
}

export function setCredentials(apiKey: string, apiUrl: string): void {
  _credentials = {
    apiKey: apiKey.trim(),
    apiUrl: apiUrl.trim() || DEFAULT_API_URL,
  };
}

export function clearCredentials(): void {
  _credentials = null;
}

export function maskKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '…' + key.slice(-4);
}

/** Returns a configured FlagsmithClient or throws if not configured. */
export function requireClient(): FlagsmithClient {
  const creds = getCredentials();
  if (!creds) {
    const err = new Error('NOT_CONFIGURED');
    (err as NodeJS.ErrnoException).code = 'NOT_CONFIGURED';
    throw err;
  }
  return new FlagsmithClient(creds.apiKey, creds.apiUrl);
}
