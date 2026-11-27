/**
 * orqesta guard <source> <target>
 * Audience Regression Guard — compares multivariate flag allocations between
 * two environments and reports allocation shifts that could affect what
 * percentage of users sees each feature variant.
 */

import chalk from 'chalk';
import ora from 'ora';
import { createClient, resolveProject } from '../../utils/clientFactory.js';
import { buildAudienceSnapshot, runAudienceGuard } from '../../audience/guard.js';
import { printError } from '../../utils/output.js';
import type { AudienceGuardReport, AudienceRegressionResult } from '../../audience/types.js';

function severityColor(severity: AudienceRegressionResult['severity']) {
  if (severity === 'critical') return chalk.red;
  if (severity === 'warning') return chalk.yellow;
  return chalk.dim;
}

function severityIcon(severity: AudienceRegressionResult['severity']): string {
  if (severity === 'critical') return '✗';
  if (severity === 'warning') return '⚠';
  return 'ℹ';
}

function printReport(report: AudienceGuardReport): void {
  console.log('');
  console.log(chalk.bold(`Audience Regression Guard — ${report.sourceEnvironment} → ${report.environment}`));
  console.log(chalk.dim(`Checked at ${report.timestamp}`));
  console.log('');

  if (report.flagsChecked === 0) {
    console.log(chalk.dim('  No multivariate flags found. Nothing to check.'));
    console.log('');
    return;
  }

  console.log(chalk.dim(`  ${report.flagsChecked} multivariate flag${report.flagsChecked !== 1 ? 's' : ''} checked · ${report.flagsUnchanged} unchanged · ${report.summary.total} regression${report.summary.total !== 1 ? 's' : ''}`));
  console.log('');

  if (report.regressions.length === 0) {
    console.log(chalk.green('  ✓ No audience regressions detected. All MV allocations are stable.'));
    console.log('');
    return;
  }

  for (const reg of report.regressions) {
    const color = severityColor(reg.severity);
    const icon = severityIcon(reg.severity);

    console.log(`  ${color(icon)}  ${chalk.bold(reg.feature)}`);
    console.log(`     ${chalk.dim(reg.summary)}`);

    // Control row
    const cShift = reg.controlShift;
    if (cShift.delta !== 0) {
      const arrow = cShift.delta > 0 ? chalk.green(`+${cShift.delta}pp`) : chalk.red(`${cShift.delta}pp`);
      console.log(`     ${chalk.dim('control:')} ${cShift.before}% → ${cShift.after}%  ${arrow}`);
    }

    // Variant rows
    for (const shift of reg.shifts.filter((s) => s.delta !== 0)) {
      const arrow = shift.delta > 0 ? chalk.yellow(`+${shift.delta}pp`) : chalk.cyan(`${shift.delta}pp`);
      console.log(`     ${chalk.dim(shift.label + ':')} ${shift.before}% → ${shift.after}%  ${arrow}`);
    }

    if (!reg.allocationsSumValid) {
      console.log(`     ${chalk.red('⚠ Allocations exceed 100% — invalid configuration')}`);
    }

    console.log('');
  }

  // Summary line
  const parts: string[] = [];
  if (report.summary.critical > 0) parts.push(chalk.red(`${report.summary.critical} critical`));
  if (report.summary.warning  > 0) parts.push(chalk.yellow(`${report.summary.warning} warning${report.summary.warning !== 1 ? 's' : ''}`));
  if (report.summary.info     > 0) parts.push(chalk.dim(`${report.summary.info} info`));

  if (report.summary.critical > 0 || report.summary.warning > 0) {
    printError(`Audience regressions detected: ${parts.join(', ')}`);
  }
}

export async function guardCommand(
  source: string,
  target: string,
  opts: {
    project?: string;
    json?: boolean;
  },
): Promise<void> {
  const client = createClient();
  const spinner = ora('Running audience regression guard...').start();

  try {
    const projectId = await resolveProject(client, opts.project);

    spinner.text = 'Fetching environments...';
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

    spinner.text = 'Fetching feature metadata...';
    const features = await client.getFeatures(projectId);

    spinner.text = `Fetching ${source} allocations...`;
    const sourceStates = await client.getFeatureStates(sourceEnv.api_key);

    spinner.text = `Fetching ${target} allocations...`;
    const targetStates = await client.getFeatureStates(targetEnv.api_key);

    spinner.text = 'Comparing audience allocations...';

    const beforeSnapshots = buildAudienceSnapshot(source, sourceStates, features);
    const afterSnapshots  = buildAudienceSnapshot(target, targetStates, features);
    const report = runAudienceGuard(source, target, beforeSnapshots, afterSnapshots);

    spinner.stop();

    if (opts.json) {
      console.log(JSON.stringify(report, null, 2));
      process.exit(report.summary.critical > 0 ? 1 : 0);
    }

    printReport(report);

    // Exit 1 if any critical regressions
    process.exit(report.summary.critical > 0 ? 1 : 0);
  } catch (err) {
    spinner.fail('Guard check failed');
    printError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
