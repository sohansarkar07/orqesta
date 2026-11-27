/**
 * Policy file loader
 * Loads and validates .orqesta-policy.yml or a provided path.
 * Supports both YAML and JSON.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { load as yamlLoad } from 'js-yaml';
import { PolicySchema } from './schema.js';
import type { Policy } from './schema.js';

const DEFAULT_FILENAMES = [
  '.orqesta-policy.yml',
  '.orqesta-policy.yaml',
  '.orqesta-policy.json',
];

export async function loadPolicyFile(filePath?: string): Promise<Policy> {
  let resolvedPath: string;
  let raw: string;

  if (filePath) {
    resolvedPath = path.resolve(filePath);
    try {
      raw = await fs.readFile(resolvedPath, 'utf-8');
    } catch {
      throw new Error(`Policy file not found: ${resolvedPath}`);
    }
  } else {
    // Auto-discover in cwd
    const cwd = process.cwd();
    let found = false;

    for (const name of DEFAULT_FILENAMES) {
      resolvedPath = path.join(cwd, name);
      try {
        raw = await fs.readFile(resolvedPath, 'utf-8');
        found = true;
        break;
      } catch {
        // Try next
      }
    }

    if (!found) {
      // Return built-in default policy
      return getDefaultPolicy();
    }
  }

  // Parse YAML or JSON
  let parsed: unknown;
  try {
    if (resolvedPath!.endsWith('.json')) {
      parsed = JSON.parse(raw!);
    } else {
      parsed = yamlLoad(raw!);
    }
  } catch (err) {
    throw new Error(
      `Failed to parse policy file at ${resolvedPath!}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Validate against schema
  const result = PolicySchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid policy file at ${resolvedPath!}:\n${issues}`);
  }

  return result.data;
}

/** Default built-in policy applied when no policy file is found */
function getDefaultPolicy(): Policy {
  return {
    version: 1,
    policies: [
      {
        id: 'default-naming',
        description: 'Feature names must follow snake_case convention',
        severity: 'warning',
        rule: 'naming_convention',
        pattern: '^[a-z][a-z0-9_]*$',
      },
      {
        id: 'default-require-description',
        description: 'Features should have descriptions',
        severity: 'warning',
        rule: 'require_description',
      },
      {
        id: 'default-no-archived-enabled',
        description: 'Archived flags must not be enabled',
        severity: 'error',
        rule: 'no_archived_flags_enabled',
      },
      {
        id: 'default-mv-sum',
        description: 'Multivariate allocations must sum to 100%',
        severity: 'error',
        rule: 'multivariate_allocations_sum',
      },
    ],
  };
}
