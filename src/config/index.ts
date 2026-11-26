/**
 * Configuration management
 * Stores Flagsmith API credentials securely using conf (encrypted user config store).
 * Falls back to environment variables.
 * 
 * Supports dual credential model:
 * - Management API Token (ORQUESTA_API_TOKEN) - for org/project/env operations
 * - Environment API Key (ORQUESTA_ENVIRONMENT_KEY) - for efficient flag retrieval
 */

import Conf from 'conf';
import { z } from 'zod';

const ConfigSchema = z.object({
  // Management API credentials
  apiToken: z.string().optional(),
  apiUrl: z.string().url().optional(),
  
  // Flags API credentials (optional)
  environmentKey: z.string().optional(),
  flagsApiUrl: z.string().url().optional(),
  
  // Legacy/fallback
  apiKey: z.string().optional(),
  
  // Context
  organisationId: z.number().optional(),
  projectId: z.number().optional(),
});

type Config = z.infer<typeof ConfigSchema>;

const store = new Conf<Config>({
  projectName: 'orqesta',
  schema: {
    apiToken: { type: 'string' },
    apiUrl: { type: 'string' },
    environmentKey: { type: 'string' },
    flagsApiUrl: { type: 'string' },
    apiKey: { type: 'string' },
    organisationId: { type: 'number' },
    projectId: { type: 'number' },
  },
});

export class ConfigManager {
  private static readonly DEFAULT_API_URL = 'https://api.flagsmith.com/api/v1';
  private static readonly DEFAULT_FLAGS_API_URL = 'https://edge.api.flagsmith.com/api/v1';

  /**
   * Get Management API token for organisation-level operations.
   * Reads from: ORQUESTA_API_TOKEN || FLAGSMITH_API_KEY (fallback) || stored config
   */
  static getApiToken(): string | undefined {
    return (
      process.env.ORQUESTA_API_TOKEN ||
      process.env.FLAGSMITH_API_KEY ||
      store.get('apiToken') ||
      store.get('apiKey') // legacy fallback
    );
  }

  /**
   * Get Management API base URL.
   * Reads from: ORQUESTA_API_URL || FLAGSMITH_API_URL || stored config
   */
  static getApiUrl(): string {
    return (
      process.env.ORQUESTA_API_URL ||
      process.env.FLAGSMITH_API_URL ||
      store.get('apiUrl') ||
      this.DEFAULT_API_URL
    );
  }

  /**
   * Get Environment API key for efficient flag retrieval (optional).
   * Reads from: ORQUESTA_ENVIRONMENT_KEY || stored config
   */
  static getEnvironmentKey(): string | undefined {
    return process.env.ORQUESTA_ENVIRONMENT_KEY || store.get('environmentKey');
  }

  /**
   * Get Flags API base URL.
   * Reads from: ORQUESTA_FLAGS_API_URL || stored config
   */
  static getFlagsApiUrl(): string {
    return (
      process.env.ORQUESTA_FLAGS_API_URL ||
      store.get('flagsApiUrl') ||
      this.DEFAULT_FLAGS_API_URL
    );
  }

  static getOrganisationId(): number | undefined {
    const env = process.env.FLAGSMITH_ORGANISATION_ID;
    return env ? parseInt(env, 10) : store.get('organisationId');
  }

  static getProjectId(): number | undefined {
    const env = process.env.FLAGSMITH_PROJECT_ID;
    return env ? parseInt(env, 10) : store.get('projectId');
  }

  // Setters
  static setApiToken(token: string): void {
    store.set('apiToken', token);
  }

  static setApiUrl(url: string): void {
    store.set('apiUrl', url);
  }

  static setEnvironmentKey(key: string): void {
    store.set('environmentKey', key);
  }

  static setFlagsApiUrl(url: string): void {
    store.set('flagsApiUrl', url);
  }

  static setOrganisationId(id: number): void {
    store.set('organisationId', id);
  }

  static setProjectId(id: number): void {
    store.set('projectId', id);
  }

  // Legacy compatibility
  static setApiKey(key: string): void {
    // Detect if it's an environment key or API token
    if (key.startsWith('ser.')) {
      store.set('environmentKey', key);
    } else {
      store.set('apiToken', key);
    }
  }

  static clearAll(): void {
    store.clear();
  }

  static getAll(): Config {
    return {
      apiToken: this.getApiToken(),
      apiUrl: this.getApiUrl(),
      environmentKey: this.getEnvironmentKey(),
      flagsApiUrl: this.getFlagsApiUrl(),
      organisationId: this.getOrganisationId(),
      projectId: this.getProjectId(),
    };
  }

  static getConfigPath(): string {
    return store.path;
  }
}
