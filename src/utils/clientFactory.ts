/**
 * Creates a FlagsmithClient from the current configuration.
 * Errors clearly when API key is not configured.
 */

import { FlagsmithClient } from '../flagsmith/client.js';
import { ConfigManager } from '../config/index.js';
import { printError } from './output.js';

export function createClient(): FlagsmithClient {
  const apiKey = ConfigManager.getApiKey();
  const apiUrl = ConfigManager.getApiUrl();

  if (!apiKey) {
    printError(
      'No Flagsmith API key configured.\n' +
        '  Set it with: orqesta config set-key <YOUR_API_KEY>\n' +
        '  Or export:   FLAGSMITH_API_KEY=<YOUR_API_KEY>',
    );
    process.exit(1);
  }

  return new FlagsmithClient(apiKey, apiUrl);
}

/** Resolve an environment reference (name or API key) to its API key */
export async function resolveEnvironment(
  client: FlagsmithClient,
  nameOrKey: string,
  projectId: number,
): Promise<{ apiKey: string; name: string; id: number }> {
  const environments = await client.getEnvironments(projectId);

  // Try matching by name (case-insensitive) or by API key
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

/** Resolve project — from flag, config, or interactive if ambiguous */
export async function resolveProject(
  client: FlagsmithClient,
  projectNameOrId?: string,
): Promise<number> {
  // If explicitly provided, use it
  if (projectNameOrId) {
    const id = parseInt(projectNameOrId, 10);
    if (!isNaN(id)) return id;
  }

  // Fall back to configured project
  const configured = ConfigManager.getProjectId();
  if (configured) return configured;

  // Try the user's organisations and pick the first project
  const orgs = await client.getOrganisations();
  if (orgs.length === 0) {
    throw new Error('No organisations found for this API key.');
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
    `Multiple projects found. Specify one with --project <name-or-id> or run orqesta environments to see all.\n` +
      `  Projects: ${projects.map((p) => `"${p.name}" (${p.id})`).join(', ')}`,
  );
}
