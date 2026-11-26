/**
 * Configuration management
 * Stores Flagsmith API credentials securely using conf (encrypted user config store).
 * Falls back to environment variables.
 */

import Conf from 'conf';
import { z } from 'zod';

const ConfigSchema = z.object({
  apiKey: z.string().optional(),
  apiUrl: z.string().url().optional(),
  organisationId: z.number().optional(),
  projectId: z.number().optional(),
});

type Config = z.infer<typeof ConfigSchema>;

const store = new Conf<Config>({
  projectName: 'orqesta',
  schema: {
    apiKey: { type: 'string' },
    apiUrl: { type: 'string' },
    organisationId: { type: 'number' },
    projectId: { type: 'number' },
  },
});

export class ConfigManager {
  private static readonly DEFAULT_API_URL = 'https://api.flagsmith.com/api/v1';

  static getApiKey(): string | undefined {
    return process.env.FLAGSMITH_API_KEY || store.get('apiKey');
  }

  static getApiUrl(): string {
    return (
      process.env.FLAGSMITH_API_URL ||
      store.get('apiUrl') ||
      this.DEFAULT_API_URL
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

  static setApiKey(key: string): void {
    store.set('apiKey', key);
  }

  static setApiUrl(url: string): void {
    store.set('apiUrl', url);
  }

  static setOrganisationId(id: number): void {
    store.set('organisationId', id);
  }

  static setProjectId(id: number): void {
    store.set('projectId', id);
  }

  static clearAll(): void {
    store.clear();
  }

  static getAll(): Config {
    return {
      apiKey: this.getApiKey(),
      apiUrl: this.getApiUrl(),
      organisationId: this.getOrganisationId(),
      projectId: this.getProjectId(),
    };
  }

  static getConfigPath(): string {
    return store.path;
  }
}
