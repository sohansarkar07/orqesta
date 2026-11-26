/**
 * Server-side credential manager.
 * API keys are stored here and NEVER sent to the browser.
 * The frontend receives only masked representations.
 * 
 * Supports dual credential model:
 * - Management API Token - for org/project/env operations
 * - Environment API Key - for efficient flag retrieval (optional)
 */

import { FlagsmithClient } from '../src/flagsmith/client.js';

interface StoredCredentials {
  // Management API
  apiToken?: string;
  apiUrl: string;
  
  // Flags API (optional)
  environmentKey?: string;
  flagsApiUrl: string;
}

// In-memory store for the running server session.
// On server restart, credentials must be re-entered — by design.
// For persistence across restarts, reads from env vars first.
let _credentials: StoredCredentials | null = null;

const DEFAULT_API_URL = 'https://api.flagsmith.com/api/v1';
const DEFAULT_FLAGS_API_URL = 'https://edge.api.flagsmith.com/api/v1';

function loadFromEnv(): StoredCredentials | null {
  const apiToken = process.env.ORQUESTA_API_TOKEN || process.env.FLAGSMITH_API_KEY;
  const environmentKey = process.env.ORQUESTA_ENVIRONMENT_KEY;
  const apiUrl = process.env.ORQUESTA_API_URL || process.env.FLAGSMITH_API_URL || DEFAULT_API_URL;
  const flagsApiUrl = process.env.ORQUESTA_FLAGS_API_URL || DEFAULT_FLAGS_API_URL;
  
  if (apiToken && apiToken.trim()) {
    return {
      apiToken: apiToken.trim(),
      apiUrl: apiUrl.trim(),
      environmentKey: environmentKey?.trim(),
      flagsApiUrl: flagsApiUrl.trim(),
    };
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

export function setCredentials(
  apiToken: string,
  apiUrl: string,
  environmentKey?: string,
  flagsApiUrl?: string,
): void {
  _credentials = {
    apiToken: apiToken.trim(),
    apiUrl: apiUrl.trim() || DEFAULT_API_URL,
    environmentKey: environmentKey?.trim(),
    flagsApiUrl: flagsApiUrl?.trim() || DEFAULT_FLAGS_API_URL,
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
  if (!creds || !creds.apiToken) {
    const err = new Error('NOT_CONFIGURED');
    (err as NodeJS.ErrnoException).code = 'NOT_CONFIGURED';
    throw err;
  }
  return new FlagsmithClient({
    apiToken: creds.apiToken,
    apiUrl: creds.apiUrl,
    environmentKey: creds.environmentKey,
    flagsApiUrl: creds.flagsApiUrl,
  });
}
