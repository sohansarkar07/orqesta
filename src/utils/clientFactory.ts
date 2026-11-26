/**
 * Creates a FlagsmithClient from the current configuration.
 * Errors clearly when credentials are not configured.
 */

import { FlagsmithClient } from '../flagsmith/client.js';
import { ConfigManager } from '../config/index.js';
import { printError } from './output.js';

export function createClient(): FlagsmithClient {
  const apiToken = ConfigManager.getApiToken();
  const apiUrl = ConfigManager.getApiUrl();
  const environmentKey = ConfigManager.getEnvironmentKey();
  const flagsApiUrl = ConfigManager.getFlagsApiUrl();

  if (!apiToken && !environmentKey) {
    printError(
      'No Flagsmith credentials configured.\n' +
        '  Management API token: set ORQUESTA_API_TOKEN (required for most commands)\n' +
        '  Flags API key (optional): set ORQUESTA_ENVIRONMENT_KEY\n' +
        '  Or use: orqesta config set-key <YOUR_API_TOKEN>',
    );
    process.exit(1);
  }

  return new FlagsmithClient({ apiToken, apiUrl, environmentKey, flagsApiUrl });
}

/** Create a client and assert it has Management API access, failing clearly if not. */
export function createManagementClient(): FlagsmithClient {
  const apiToken = ConfigManager.getApiToken();
  if (!apiToken) {
    printError(
      'This command requires a Management API token.\n' +
        '  Set ORQUESTA_API_TOKEN or FLAGSMITH_API_KEY and retry.',
    );
    process.exit(1);
  }
  return createClient();
}

/** Resolve an environment reference (name or API key) to its API key. */
export async function resolveEnvironment(
  client: FlagsmithClient,
  nameOrKey: string,
  projectId: number,
): Promise<{ apiKey: string; name: string; id: number }> {
  const environments = await client.getEnvironments(projectId);

  const match = environments.find(
    (e) =>
      e.name.toLowerCase() === nameOrKey.toLowerCase() ||
      e.api_key === nameOrKey,
  );

  if (!match) {
    const names = environments.map((e) => `"${e.name}"`).join(', ');
    throw new Error(
      `Environment "${nameOrKey}" not found in project ${projectId}.\n` +
        `  Available: ${names}\n` +
        '  Use orqesta environments to list all environments.',
    );
  }

  return { apiKey: match.api_key, name: match.name, id: match.id };
}

/** Resolve project — from flag, config, or auto-detect from org. */
export async function resolveProject(
  client: FlagsmithClient,
  projectNameOrId?: string,
): Promise<number> {
  if (projectNameOrId) {
    const id = parseInt(projectNameOrId, 10);
    if (!isNaN(id)) return id;
  }

  const configured = ConfigManager.getProjectId();
  if (configured) return configured;

  const orgs = await client.getOrganisations();
  if (orgs.length === 0) {
    throw new Error('No organisations found for this API token.');
  }

  const firstOrg = orgs[0]!;
  const projects = await client.getProjects(firstOrg.id);

  if (projects.length === 0) {
    throw new Error(`No projects found in organisation "${firstOrg.name}".`);
  }

  if (projects.length === 1) {
    return projects[0]!.id;
  }

  throw new Error(
    'Multiple projects found. Specify one with --project <name-or-id> or set a default with orqesta config set-project <id>.\n' +
      `  Projects: ${projects.map((p) => `"${p.name}" (${p.id})`).join(', ')}`,
  );
}
