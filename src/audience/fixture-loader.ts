/**
 * Loads and validates identity fixture files for the Audience Regression Guard.
 * Supports YAML and JSON.
 *
 * Example fixture file (orqesta-identities.yml):
 *
 *   version: 1
 *   identities:
 *     - identifier: user_premium
 *       traits:
 *         - key: plan
 *           value: premium
 *         - key: country
 *           value: India
 *       description: Premium user in India
 *
 *     - identifier: user_free
 *       traits:
 *         - key: plan
 *           value: free
 */

import { promises as fs } from 'fs';
import path from 'path';
import { load as yamlLoad } from 'js-yaml';
import { z } from 'zod';
import type { IdentityFixtureFile } from './eval-types.js';

const TraitSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

const IdentitySchema = z.object({
  identifier: z.string().min(1, 'identifier must not be empty'),
  traits: z.array(TraitSchema).optional().default([]),
  description: z.string().optional(),
});

const FixtureFileSchema = z.object({
  version: z.literal(1),
  identities: z.array(IdentitySchema).min(1, 'identities list must not be empty'),
});

const DEFAULT_FILENAMES = [
  'orqesta-identities.yml',
  'orqesta-identities.yaml',
  'orqesta-identities.json',
];

export async function loadFixtureFile(filePath?: string): Promise<IdentityFixtureFile> {
  let resolvedPath: string;
  let raw: string;

  if (filePath) {
    resolvedPath = path.resolve(filePath);
    try {
      raw = await fs.readFile(resolvedPath, 'utf-8');
    } catch {
      throw new Error(`Identity fixture file not found: ${resolvedPath}`);
    }
  } else {
    const cwd = process.cwd();
    let found = false;
    resolvedPath = '';
    raw = '';

    for (const name of DEFAULT_FILENAMES) {
      const candidate = path.join(cwd, name);
      try {
        raw = await fs.readFile(candidate, 'utf-8');
        resolvedPath = candidate;
        found = true;
        break;
      } catch {
        // try next
      }
    }

    if (!found) {
      throw new Error(
        `No identity fixture file found. Create one of: ${DEFAULT_FILENAMES.join(', ')}\n` +
        `Or generate a template with: orqesta eval --init`,
      );
    }
  }

  let parsed: unknown;
  try {
    if (resolvedPath.endsWith('.json')) {
      parsed = JSON.parse(raw);
    } else {
      parsed = yamlLoad(raw);
    }
  } catch (err) {
    throw new Error(
      `Failed to parse fixture file at ${resolvedPath}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const result = FixtureFileSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid fixture file at ${resolvedPath}:\n${issues}`);
  }

  return result.data as IdentityFixtureFile;
}

/** Generate a starter fixture file template */
export function generateFixtureTemplate(): string {
  return `version: 1

# Define synthetic identities to evaluate against two Flagsmith environments.
# Orqesta will evaluate each identity against both environments and report differences.

identities:
  - identifier: user_standard
    description: Standard user with no special traits
    traits: []

  - identifier: user_premium
    description: Premium user
    traits:
      - key: plan
        value: premium
      - key: country
        value: US

  - identifier: user_beta
    description: Internal beta tester
    traits:
      - key: plan
        value: free
      - key: beta_tester
        value: true
`;
}
