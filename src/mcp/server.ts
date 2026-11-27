#!/usr/bin/env node
/**
 * Orqesta MCP Server
 *
 * Exposes Orqesta functionality as MCP tools for AI clients
 * (Claude Desktop, Cursor, Kiro, VS Code, etc.)
 *
 * Tools:
 *   - get_environments       List all projects and environments
 *   - compare_environments   Detect drift between two environments
 *   - run_policy_check       Run policy rules against an environment
 *   - run_audience_guard     Compare MV allocation shifts between envs
 *   - eval_identities        Identity-level evaluation across two envs
 *
 * Configuration (env vars):
 *   ORQUESTA_API_TOKEN       Flagsmith Organisation API token (required)
 *   ORQUESTA_API_URL         Management API URL (default: Flagsmith Cloud)
 *   ORQUESTA_ENVIRONMENT_KEY Server-side env key for Flags API (optional)
 *   ORQUESTA_FLAGS_API_URL   Flags API URL (default: Flagsmith Cloud edge)
 *
 * Usage:
 *   node dist/src/mcp/server.js
 *
 * See: https://modelcontextprotocol.io
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { FlagsmithClient } from '../flagsmith/client.js';
import { DriftComparator } from '../drift/comparator.js';
import { buildEnvDoc } from '../utils/envDocBuilder.js';
import { PolicyRunner } from '../policies/runner.js';
import { loadPolicyFile } from '../policies/loader.js';
import { buildAudienceSnapshot, runAudienceGuard } from '../audience/guard.js';
import { runIdentityEvaluation } from '../audience/evaluator.js';
import { ConfigManager } from '../config/index.js';

// ─── Bootstrap ────────────────────────────────────────────────────────────────

function createClientOrThrow(): FlagsmithClient {
  const apiToken = ConfigManager.getApiToken();
  const apiUrl = ConfigManager.getApiUrl();
  const environmentKey = ConfigManager.getEnvironmentKey();
  const flagsApiUrl = ConfigManager.getFlagsApiUrl();

  if (!apiToken) {
    throw new Error(
      'ORQUESTA_API_TOKEN is not set. ' +
      'Set it to your Flagsmith Organisation API token before starting the MCP server.',
    );
  }

  return new FlagsmithClient({ apiToken, apiUrl, environmentKey, flagsApiUrl });
}

// ─── Server ───────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'orqesta',
  version: '0.1.0',
});

// ─── Tool: get_environments ───────────────────────────────────────────────────

server.tool(
  'get_environments',
  'List all Flagsmith projects and environments accessible with the configured API token.',
  {},
  async () => {
    const client = createClientOrThrow();
    const orgs = await client.getOrganisations();

    const lines: string[] = [];
    for (const org of orgs) {
      lines.push(`Organisation: ${org.name} (id: ${org.id})`);
      const projects = await client.getProjects(org.id);
      for (const project of projects) {
        lines.push(`  Project: ${project.name} (id: ${project.id})`);
        const envs = await client.getEnvironments(project.id);
        for (const env of envs) {
          lines.push(`    Environment: ${env.name}`);
        }
      }
    }

    return {
      content: [{ type: 'text' as const, text: lines.join('\n') || 'No environments found.' }],
    };
  },
);

// ─── Tool: compare_environments ───────────────────────────────────────────────

server.tool(
  'compare_environments',
  'Compare two Flagsmith environments and report configuration drift (enabled state, values, MV allocations).',
  {
    project_id: z.number().describe('Flagsmith project ID'),
    source_env: z.string().describe('Source environment name (reference)'),
    target_env: z.string().describe('Target environment name (compare to)'),
  },
  async ({ project_id, source_env, target_env }) => {
    const client = createClientOrThrow();
    const environments = await client.getEnvironments(project_id);

    const src = environments.find((e) => e.name.toLowerCase() === source_env.toLowerCase());
    const tgt = environments.find((e) => e.name.toLowerCase() === target_env.toLowerCase());

    if (!src) return { content: [{ type: 'text' as const, text: `Environment "${source_env}" not found. Available: ${environments.map((e) => e.name).join(', ')}` }] };
    if (!tgt) return { content: [{ type: 'text' as const, text: `Environment "${target_env}" not found. Available: ${environments.map((e) => e.name).join(', ')}` }] };

    const [features, srcStates, tgtStates] = await Promise.all([
      client.getFeatures(project_id),
      client.getFeatureStates(src.api_key),
      client.getFeatureStates(tgt.api_key),
    ]);

    const srcDoc = buildEnvDoc(src.id, src.api_key, project_id, srcStates, features);
    const tgtDoc = buildEnvDoc(tgt.id, tgt.api_key, project_id, tgtStates, features);
    const drift = DriftComparator.compare(srcDoc, src.name, tgtDoc, tgt.name);

    if (drift.drifts.length === 0) {
      return { content: [{ type: 'text' as const, text: `✓ ${source_env} and ${target_env} are in sync. No drift detected.` }] };
    }

    const lines: string[] = [
      `Drift: ${source_env} → ${target_env}`,
      `${drift.drifts.length} difference(s) found`,
      '',
    ];

    for (const d of drift.drifts) {
      lines.push(`  [${d.category}] ${d.feature}`);
      lines.push(`    ${d.description}`);
    }

    return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
  },
);

// ─── Tool: run_policy_check ───────────────────────────────────────────────────

server.tool(
  'run_policy_check',
  'Run Orqesta policy rules against a Flagsmith environment. Reports naming, description, archived flag and MV allocation violations.',
  {
    project_id: z.number().describe('Flagsmith project ID'),
    environment: z.string().describe('Environment name to check'),
  },
  async ({ project_id, environment }) => {
    const client = createClientOrThrow();
    const policy = await loadPolicyFile(); // loads default if no file found
    const runner = new PolicyRunner(client);
    const result = await runner.runForEnvironment(environment, project_id, policy.policies);

    const lines: string[] = [
      `Policy check: ${environment}`,
      `${result.errors} error(s), ${result.warnings} warning(s), ${result.passed} passed`,
      '',
    ];

    if (result.violations.length === 0) {
      lines.push('✓ All checks passed.');
    } else {
      for (const v of result.violations) {
        const icon = v.severity === 'error' ? '✗' : v.severity === 'warning' ? '⚠' : 'ℹ';
        lines.push(`  ${icon} [${v.severity.toUpperCase()}] ${v.feature} — ${v.message}`);
        if (v.suggestion) lines.push(`    Suggestion: ${v.suggestion}`);
      }
    }

    return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
  },
);

// ─── Tool: run_audience_guard ─────────────────────────────────────────────────

server.tool(
  'run_audience_guard',
  'Compare multivariate flag allocation percentages between two environments. Detects shifts that could change user segment exposure.',
  {
    project_id: z.number().describe('Flagsmith project ID'),
    source_env: z.string().describe('Source environment name'),
    target_env: z.string().describe('Target environment name'),
  },
  async ({ project_id, source_env, target_env }) => {
    const client = createClientOrThrow();
    const environments = await client.getEnvironments(project_id);

    const src = environments.find((e) => e.name.toLowerCase() === source_env.toLowerCase());
    const tgt = environments.find((e) => e.name.toLowerCase() === target_env.toLowerCase());

    if (!src) return { content: [{ type: 'text' as const, text: `Environment "${source_env}" not found.` }] };
    if (!tgt) return { content: [{ type: 'text' as const, text: `Environment "${target_env}" not found.` }] };

    const [features, srcStates, tgtStates] = await Promise.all([
      client.getFeatures(project_id),
      client.getFeatureStates(src.api_key),
      client.getFeatureStates(tgt.api_key),
    ]);

    const before = buildAudienceSnapshot(source_env, srcStates, features);
    const after  = buildAudienceSnapshot(target_env, tgtStates, features);
    const report = runAudienceGuard(source_env, target_env, before, after);

    if (report.flagsChecked === 0) {
      return { content: [{ type: 'text' as const, text: 'No multivariate flags found. Audience Guard only checks MULTIVARIATE type flags.' }] };
    }

    if (report.regressions.length === 0) {
      return { content: [{ type: 'text' as const, text: `✓ No audience regressions. ${report.flagsChecked} MV flag(s) checked, all allocations stable.` }] };
    }

    const lines: string[] = [`Audience Guard: ${source_env} → ${target_env}`, ''];
    for (const reg of report.regressions) {
      lines.push(`  [${reg.severity.toUpperCase()}] ${reg.feature}: ${reg.summary}`);
    }

    return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
  },
);

// ─── Tool: eval_identities ────────────────────────────────────────────────────

server.tool(
  'eval_identities',
  'Evaluate synthetic Flagsmith identities against two environments and report differences in flag evaluation results (enabled, value, variant).',
  {
    project_id: z.number().describe('Flagsmith project ID'),
    source_env: z.string().describe('Source environment name'),
    target_env: z.string().describe('Target environment name'),
    identities: z.array(z.object({
      identifier: z.string(),
      traits: z.array(z.object({
        key: z.string(),
        value: z.union([z.string(), z.number(), z.boolean()]),
      })).optional().default([]),
    })).describe('Synthetic identities to evaluate'),
  },
  async ({ project_id, source_env, target_env, identities }) => {
    const client = createClientOrThrow();
    const environments = await client.getEnvironments(project_id);

    const src = environments.find((e) => e.name.toLowerCase() === source_env.toLowerCase());
    const tgt = environments.find((e) => e.name.toLowerCase() === target_env.toLowerCase());

    if (!src) return { content: [{ type: 'text' as const, text: `Environment "${source_env}" not found.` }] };
    if (!tgt) return { content: [{ type: 'text' as const, text: `Environment "${target_env}" not found.` }] };

    const flagsApiUrl = ConfigManager.getFlagsApiUrl();
    const report = await runIdentityEvaluation(
      source_env, target_env,
      src.api_key, tgt.api_key,
      flagsApiUrl,
      identities,
    );

    if (report.totalRegressions === 0) {
      return { content: [{ type: 'text' as const, text: `✓ No evaluation regressions. ${report.identitiesEvaluated} identit${report.identitiesEvaluated !== 1 ? 'ies' : 'y'} checked, all consistent.` }] };
    }

    const lines: string[] = [`Evaluation: ${source_env} → ${target_env}`, `${report.totalRegressions} regression(s)`, ''];
    for (const result of report.results) {
      if (result.regressions.length === 0) continue;
      lines.push(`  ${result.identifier}`);
      for (const reg of result.regressions) {
        lines.push(`    [${reg.type}] ${reg.feature}: ${reg.explanation}`);
      }
    }

    return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
  },
);

// ─── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
