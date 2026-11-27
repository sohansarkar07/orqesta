/**
 * orqesta plan <source> <target>
 * Generate a sync plan from drift.
 */

import ora from 'ora';
import { createClient, resolveEnvironment, resolveProject } from '../../utils/clientFactory.js';
import { DriftComparator } from '../../drift/comparator.js';
import { SyncPlanner } from '../../sync/planner.js';
import { buildEnvDoc } from '../../utils/envDocBuilder.js';
import { printSyncPlan, printError } from '../../utils/output.js';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const PLAN_CACHE_FILE = path.join(os.tmpdir(), 'orqesta-plan.json');

export async function planCommand(
  source: string,
  target: string,
  opts: {
    project?: string;
    json?: boolean;
  },
): Promise<void> {
  const client = createClient();
  const spinner = ora('Generating synchronisation plan...').start();

  try {
    const projectId = await resolveProject(client, opts.project);

    spinner.text = 'Resolving environments...';
    const sourceEnv = await resolveEnvironment(client, source, projectId);
    const targetEnv = await resolveEnvironment(client, target, projectId);

    spinner.text = 'Fetching feature list...';
    const features = await client.getFeatures(projectId);

    spinner.text = `Fetching ${chalk.cyan(sourceEnv.name)} environment...`;
    const sourceStates = await client.getFeatureStates(sourceEnv.apiKey);

    spinner.text = `Fetching ${chalk.cyan(targetEnv.name)} environment...`;
    const targetStates = await client.getFeatureStates(targetEnv.apiKey);

    spinner.text = 'Detecting drift...';

    const sourceDoc = buildEnvDoc(sourceEnv.id, sourceEnv.apiKey, projectId, sourceStates, features);
    const targetDoc = buildEnvDoc(targetEnv.id, targetEnv.apiKey, projectId, targetStates, features);

    const drift = DriftComparator.compare(sourceDoc, sourceEnv.name, targetDoc, targetEnv.name);

    if (drift.drifts.length === 0) {
      spinner.succeed('No drift detected — nothing to synchronise');
      return;
    }

    spinner.text = 'Building sync plan...';
    const plan = SyncPlanner.buildPlan(drift, targetDoc.feature_states as any);

    await fs.writeFile(PLAN_CACHE_FILE, JSON.stringify(plan, null, 2), 'utf-8');
    spinner.succeed(`Plan generated and cached to ${chalk.dim(PLAN_CACHE_FILE)}`);

    if (opts.json) {
      console.log(JSON.stringify(plan, null, 2));
    } else {
      printSyncPlan(plan);
      console.log(chalk.dim(`  To apply this plan: ${chalk.bold('orqesta apply')}`));
      console.log(chalk.dim(`  To preview without changes: ${chalk.bold('orqesta apply --dry-run')}\n`));
    }
  } catch (err) {
    spinner.fail('Plan generation failed');
    printError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
