/**
 * orqesta apply — execute the most recent sync plan
 * Requires explicit confirmation unless --yes is passed.
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import ora from 'ora';
import { confirm } from '@inquirer/prompts';
import { createClient } from '../../utils/clientFactory.js';
import { SyncPlanner } from '../../sync/planner.js';
import { SyncExecutor } from '../../sync/executor.js';
import { printSyncPlan, printSyncResult, printError } from '../../utils/output.js';
import type { SyncPlan } from '../../types/sync.js';

const PLAN_CACHE_FILE = path.join(os.tmpdir(), 'orqesta-plan.json');

export async function applyCommand(opts: {
  dryRun?: boolean;
  yes?: boolean;
  json?: boolean;
  planFile?: string;
}): Promise<void> {
  const planFile = opts.planFile ?? PLAN_CACHE_FILE;

  // Load plan
  let plan: SyncPlan;
  try {
    const raw = await fs.readFile(planFile, 'utf-8');
    plan = JSON.parse(raw) as SyncPlan;
  } catch {
    printError(
      `No sync plan found at ${planFile}.\n` +
        `  Run ${chalk.bold('orqesta plan <source> <target>')} first.`,
    );
    process.exit(1);
  }

  // Verify plan checksum (staleness guard)
  if (!SyncPlanner.verifyChecksum(plan)) {
    printError(
      'The sync plan checksum does not match. The plan may have been modified.\n' +
        `  Re-run ${chalk.bold('orqesta plan')} to generate a fresh plan.`,
    );
    process.exit(1);
  }

  // Show plan
  printSyncPlan(plan);

  if (plan.operations.length === 0) {
    console.log(chalk.green('Nothing to apply.\n'));
    return;
  }

  if (opts.dryRun) {
    console.log(chalk.yellow.bold('  Dry-run mode — no changes will be made.\n'));
  }

  // Age check: warn if plan is older than 15 minutes
  const planAgeMs = Date.now() - new Date(plan.createdAt).getTime();
  if (planAgeMs > 15 * 60 * 1000) {
    console.log(
      chalk.yellow(
        `  ⚠  This plan was generated ${Math.round(planAgeMs / 60000)} minutes ago. The environments may have changed.\n` +
          `     Re-run ${chalk.bold('orqesta plan')} to get a fresh plan.\n`,
      ),
    );
  }

  // Confirmation gate — not shown for dry-run
  if (!opts.dryRun && !opts.yes) {
    const actionable = plan.operations.filter(
      (op) => op.featureStateId !== undefined,
    ).length;

    console.log(
      chalk.red.bold(
        `  This will apply ${actionable} change${actionable !== 1 ? 's' : ''} to ${chalk.cyan(plan.target.environment)}.`,
      ),
    );
    console.log('');

    const confirmed = await confirm({
      message: 'Apply these changes to the target environment?',
      default: false,
    });

    if (!confirmed) {
      console.log(chalk.dim('\nAborted. No changes were made.\n'));
      return;
    }

    console.log('');
  }

  const client = createClient();
  const executor = new SyncExecutor(client);
  const spinner = ora(opts.dryRun ? 'Previewing changes...' : 'Applying changes...').start();

  try {
    const result = await executor.execute(plan, {
      dryRun: opts.dryRun ?? false,
    });

    spinner.succeed(opts.dryRun ? 'Preview complete' : 'Apply complete');

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printSyncResult(result);
    }

    const failed = result.results.filter((r) => r.status === 'failed');
    if (failed.length > 0 || !result.verificationPassed || result.hasStaleness) {
      process.exit(1);
    }
  } catch (err) {
    spinner.fail('Apply failed');
    if (err instanceof Error) {
      printError(err.message);
    } else {
      printError(String(err));
    }
    process.exit(1);
  }
}
