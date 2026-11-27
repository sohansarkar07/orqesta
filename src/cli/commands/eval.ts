/**
 * orqesta eval <source> <target>
 *
 * Identity-level Audience Regression Guard.
 * Evaluates synthetic identities against both environments via the Flagsmith
 * Flags API and classifies any differences in the evaluation results.
 *
 * Requires:
 *   - ORQUESTA_API_TOKEN (to list environments)
 *   - Both environment client/server keys (fetched automatically)
 *   - An identity fixture file (orqesta-identities.yml or --fixtures <path>)
 *
 * Exit codes:
 *   0 — no regressions (or only info-level)
 *   1 — critical or warning regressions detected
 */

import chalk from 'chalk';
import ora from 'ora';
import { promises as fs } from 'fs';
import { createClient, resolveProject } from '../../utils/clientFactory.js';
import { ConfigManager } from '../../config/index.js';
import { runIdentityEvaluation } from '../../audience/evaluator.js';
import { loadFixtureFile, generateFixtureTemplate } from '../../audience/fixture-loader.js';
import { printError } from '../../utils/output.js';
import type { EvalReport, EvalRegressionResult } from '../../audience/eval-types.js';

const TYPE_ICON: Record<string, string> = {
  ENABLEMENT_REGRESSION: '✗',
  ENABLEMENT_CHANGE:     '↑',
  VARIANT_CHANGE:        '⇄',
  VALUE_CHANGE:          '~',
  MISSING_FEATURE:       '?',
  EVALUATION_ERROR:      '!',
  UNCHANGED:             '✓',
};

const SEV_COLOR: Record<string, (s: string) => string> = {
  critical: chalk.red,
  warning:  chalk.yellow,
  info:     chalk.dim,
};

function printReport(report: EvalReport): void {
  console.log('');
  console.log(chalk.bold(`Identity Evaluation — ${report.sourceEnvironment} → ${report.targetEnvironment}`));
  console.log(chalk.dim(`Evaluated at ${report.timestamp}`));
  console.log('');
  console.log(chalk.dim(
    `  ${report.identitiesEvaluated} identit${report.identitiesEvaluated !== 1 ? 'ies' : 'y'} evaluated · ` +
    `${report.totalRegressions} regression${report.totalRegressions !== 1 ? 's' : ''}`,
  ));
  console.log('');

  if (report.totalRegressions === 0) {
    console.log(chalk.green('  ✓ No evaluation regressions detected. All identities receive consistent results.'));
    console.log('');
    return;
  }

  for (const result of report.results) {
    if (result.error) {
      console.log(`  ${chalk.red('!')}  ${chalk.bold(result.identifier)}`);
      console.log(`     ${chalk.red('Evaluation error:')} ${result.error}`);
      console.log('');
      continue;
    }

    if (result.regressions.length === 0) continue;

    console.log(`  ${chalk.bold(result.identifier)}`);
    if (result.traits.length > 0) {
      const traitStr = result.traits.map((t) => `${t.key}=${JSON.stringify(t.value)}`).join(', ');
      console.log(`  ${chalk.dim(traitStr)}`);
    }
    console.log('');

    for (const reg of result.regressions) {
      const icon  = TYPE_ICON[reg.type] ?? '?';
      const color = SEV_COLOR[reg.severity] ?? chalk.dim;
      console.log(`    ${color(icon)}  ${chalk.bold(reg.feature)}  ${chalk.dim(`[${reg.type}]`)}`);
      console.log(`       ${chalk.dim(reg.explanation)}`);

      if (reg.source && reg.target) {
        const srcStr = `enabled=${reg.source.enabled} value=${JSON.stringify(reg.source.value)}` +
          (reg.source.variant ? ` variant=${reg.source.variant}` : '');
        const tgtStr = `enabled=${reg.target.enabled} value=${JSON.stringify(reg.target.value)}` +
          (reg.target.variant ? ` variant=${reg.target.variant}` : '');
        console.log(`       ${chalk.dim(`${report.sourceEnvironment}:`)} ${srcStr}`);
        console.log(`       ${chalk.dim(`${report.targetEnvironment}:`)} ${tgtStr}`);
      }
      console.log('');
    }
  }

  // Summary
  const parts: string[] = [];
  if (report.summary.critical > 0) parts.push(chalk.red(`${report.summary.critical} critical`));
  if (report.summary.warning  > 0) parts.push(chalk.yellow(`${report.summary.warning} warning${report.summary.warning !== 1 ? 's' : ''}`));
  if (report.summary.info     > 0) parts.push(chalk.dim(`${report.summary.info} info`));

  if (report.summary.critical > 0 || report.summary.warning > 0) {
    printError(`Evaluation regressions: ${parts.join(', ')}`);
  }
}

export async function evalCommand(
  source: string,
  target: string,
  opts: {
    project?: string;
    fixtures?: string;
    features?: string;
    json?: boolean;
    init?: boolean;
  },
): Promise<void> {
  // --init: write a starter fixture file
  if (opts.init) {
    const dest = 'orqesta-identities.yml';
    try {
      await fs.access(dest);
      printError(`${dest} already exists. Remove it first or choose a different path.`);
      process.exit(1);
    } catch {
      // doesn't exist — good
    }
    await fs.writeFile(dest, generateFixtureTemplate(), 'utf-8');
    console.log(chalk.green(`✓ Created ${dest}`));
    console.log(chalk.dim(`  Edit the file, then run: orqesta eval ${source} ${target}`));
    return;
  }

  const spinner = ora('Loading identity fixtures...').start();

  try {
    // Load fixtures
    let fixtures;
    try {
      const fixtureFile = await loadFixtureFile(opts.fixtures);
      fixtures = fixtureFile.identities;
      spinner.succeed(`Loaded ${fixtures.length} identit${fixtures.length !== 1 ? 'ies' : 'y'}`);
    } catch (err) {
      spinner.fail('Failed to load identity fixtures');
      printError(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }

    // Resolve environments
    spinner.start('Resolving environments...');
    const client = createClient();
    const projectId = await resolveProject(client, opts.project);
    const environments = await client.getEnvironments(projectId);

    const sourceEnv = environments.find((e) => e.name.toLowerCase() === source.toLowerCase());
    const targetEnv = environments.find((e) => e.name.toLowerCase() === target.toLowerCase());

    if (!sourceEnv) {
      spinner.fail(`Environment "${source}" not found`);
      printError(`Available: ${environments.map((e) => `"${e.name}"`).join(', ')}`);
      process.exit(1);
    }
    if (!targetEnv) {
      spinner.fail(`Environment "${target}" not found`);
      printError(`Available: ${environments.map((e) => `"${e.name}"`).join(', ')}`);
      process.exit(1);
    }

    // Feature filter
    const featureFilter = opts.features
      ? opts.features.split(',').map((f) => f.trim()).filter(Boolean)
      : undefined;

    const flagsApiUrl = ConfigManager.getFlagsApiUrl();

    spinner.text = `Evaluating ${fixtures.length} identit${fixtures.length !== 1 ? 'ies' : 'y'} against ${source} and ${target}...`;

    const report = await runIdentityEvaluation(
      source,
      target,
      sourceEnv.api_key,  // client key — works with edge Flags API
      targetEnv.api_key,
      flagsApiUrl,
      fixtures,
      featureFilter,
    );

    spinner.stop();

    if (opts.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printReport(report);
    }

    // Exit 1 if any critical or warning regressions
    process.exit(report.summary.critical > 0 || report.summary.warning > 0 ? 1 : 0);
  } catch (err) {
    spinner.fail('Evaluation failed');
    printError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
