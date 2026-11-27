#!/usr/bin/env node
/**
 * Orqesta CLI — Flagsmith configuration safety, drift detection and change forensics
 */

import { Command } from 'commander';
import { createRequire } from 'module';
import { doctorCommand } from './commands/doctor.js';
import { environmentsCommand } from './commands/environments.js';
import { compareCommand } from './commands/compare.js';
import { planCommand } from './commands/plan.js';
import { applyCommand } from './commands/apply.js';
import { inspectCommand } from './commands/inspect.js';
import { historyCommand } from './commands/history.js';
import { verifyCommand } from './commands/verify.js';
import { reportCommand } from './commands/report.js';
import { lintCommand } from './commands/lint.js';
import { guardCommand } from './commands/guard.js';
import {
  configShowCommand,
  configSetKeyCommand,
  configSetUrlCommand,
  configSetProjectCommand,
  configClearCommand,
} from './commands/config.js';

// Read version from package.json
const require = createRequire(import.meta.url);
const pkg = require('../../../package.json') as { version: string };

const program = new Command();

program
  .name('orqesta')
  .description(
    'Flagsmith configuration safety, environment drift detection and change forensics',
  )
  .version(pkg.version);

// ─── doctor ──────────────────────────────────────────────────────────────────
program
  .command('doctor')
  .description('Check configuration, connectivity and authentication health')
  .action(async () => {
    await doctorCommand();
  });

// ─── environments ─────────────────────────────────────────────────────────────
program
  .command('environments')
  .alias('envs')
  .description('List all accessible projects and environments')
  .option('-p, --project <name-or-id>', 'Filter by project name or ID')
  .option('--json', 'Output as JSON')
  .action(async (opts: { project?: string; json?: boolean }) => {
    await environmentsCommand(opts);
  });

// ─── compare ──────────────────────────────────────────────────────────────────
program
  .command('compare <source> <target>')
  .description('Compare two environments and show configuration drift')
  .option('-p, --project <name-or-id>', 'Project name or ID')
  .option('--json', 'Output as JSON')
  .action(async (source: string, target: string, opts: { project?: string; json?: boolean }) => {
    await compareCommand(source, target, opts);
  });

// ─── plan ─────────────────────────────────────────────────────────────────────
program
  .command('plan <source> <target>')
  .description('Generate a synchronisation plan from source to target')
  .option('-p, --project <name-or-id>', 'Project name or ID')
  .option('--json', 'Output as JSON')
  .action(async (source: string, target: string, opts: { project?: string; json?: boolean }) => {
    await planCommand(source, target, opts);
  });

// ─── apply ────────────────────────────────────────────────────────────────────
program
  .command('apply')
  .description('Apply the most recent sync plan to the target environment')
  .option('--dry-run', 'Preview changes without modifying anything')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('--json', 'Output result as JSON')
  .option('--plan-file <path>', 'Use a specific plan file instead of the cached one')
  .action(async (opts: { dryRun?: boolean; yes?: boolean; json?: boolean; planFile?: string }) => {
    await applyCommand(opts);
  });

// ─── verify ───────────────────────────────────────────────────────────────────
program
  .command('verify <source> <target>')
  .description('Verify target environment matches source after a sync')
  .option('-p, --project <name-or-id>', 'Project name or ID')
  .option('--json', 'Output as JSON')
  .action(async (source: string, target: string, opts: { project?: string; json?: boolean }) => {
    await verifyCommand(source, target, opts);
  });

// ─── inspect ──────────────────────────────────────────────────────────────────
program
  .command('inspect <feature>')
  .description('Show audit history and change events for a specific feature flag')
  .option('-p, --project <name-or-id>', 'Project name or ID')
  .option('-e, --environment <name>', 'Filter to a specific environment')
  .option('-n, --limit <number>', 'Maximum number of events to show (default: 25)', '25')
  .option('--with-changes', 'Fetch structured before/after change details for each event')
  .option('--json', 'Output as JSON')
  .action(async (feature: string, opts: { project?: string; environment?: string; limit?: number; json?: boolean; withChanges?: boolean }) => {
    await inspectCommand(feature, opts);
  });

// ─── history ──────────────────────────────────────────────────────────────────
program
  .command('history <feature>')
  .description('Show full change history for a feature flag across all environments')
  .option('-p, --project <name-or-id>', 'Project name or ID')
  .option('-n, --limit <number>', 'Maximum number of events to show (default: 50)', '50')
  .option('--with-changes', 'Fetch structured before/after change details for each event')
  .option('--json', 'Output as JSON')
  .action(async (feature: string, opts: { project?: string; limit?: number; json?: boolean; withChanges?: boolean }) => {
    await historyCommand(feature, opts);
  });

// ─── report ───────────────────────────────────────────────────────────────────
program
  .command('report <source> <target>')
  .description('Generate a drift and sync plan report')
  .option('-p, --project <name-or-id>', 'Project name or ID')
  .option('-f, --format <format>', 'Output format: markdown or json (default: markdown)', 'markdown')
  .option('-o, --output <file>', 'Output file path')
  .action(async (source: string, target: string, opts: { project?: string; format?: 'markdown' | 'json'; output?: string }) => {
    await reportCommand(source, target, opts);
  });

// ─── guard ────────────────────────────────────────────────────────────────────
program
  .command('guard <source> <target>')
  .description('Audience Regression Guard — detect multivariate allocation shifts between environments')
  .option('-p, --project <name-or-id>', 'Project name or ID')
  .option('--json', 'Output as JSON')
  .action(async (source: string, target: string, opts: { project?: string; json?: boolean }) => {
    await guardCommand(source, target, opts);
  });

// ─── lint ─────────────────────────────────────────────────────────────────────
program
  .command('lint <environment>')
  .description('Run policy checks against a Flagsmith environment')
  .option('-p, --project <name-or-id>', 'Project name or ID')
  .option('--policy <path>', 'Path to policy file (default: auto-discover .orqesta-policy.yml)')
  .option('-f, --format <format>', 'Output format: markdown or json (default: terminal)', 'terminal')
  .option('--json', 'Output as JSON (shorthand for --format json)')
  .action(async (environment: string, opts: { project?: string; policy?: string; format?: 'markdown' | 'json'; json?: boolean }) => {
    await lintCommand(environment, opts);
  });

// ─── config ───────────────────────────────────────────────────────────────────
const configCmd = program.command('config').description('Manage Orqesta configuration');
configCmd
  .command('show')
  .description('Show current configuration (API key masked)')
  .action(() => {
    configShowCommand();
  });

configCmd
  .command('set-key <key>')
  .description('Store your Flagsmith Management API token')
  .action((key: string) => {
    configSetKeyCommand(key);
  });

configCmd
  .command('set-url <url>')
  .description('Set the Flagsmith API base URL (for self-hosted instances)')
  .action((url: string) => {
    configSetUrlCommand(url);
  });

configCmd
  .command('set-project <id>')
  .description('Set the default project ID')
  .action((id: string) => {
    configSetProjectCommand(id);
  });

configCmd
  .command('clear')
  .description('Clear all stored configuration')
  .action(() => {
    configClearCommand();
  });

// ─── Boot ─────────────────────────────────────────────────────────────────────
program.parseAsync(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nOrqesta fatal error: ${message}\n`);
  process.exit(1);
});
