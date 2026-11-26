/**
 * Terminal output utilities — colour, tables, diffs
 * Uses chalk for colour. All output is to stdout unless specified.
 */

import chalk from 'chalk';
import type { DriftReport, DriftItem, DriftCategory } from '../types/drift.js';
import type { SyncPlan, SyncResult } from '../types/sync.js';
import type { FlagsmithAuditEntry, AuditChangeDetail } from '../types/flagsmith.js';
import type { PolicyRunResult, PolicyViolation } from '../policies/schema.js';

const ICONS = {
  ok: chalk.green('✓'),
  warn: chalk.yellow('⚠'),
  error: chalk.red('✗'),
  info: chalk.blue('ℹ'),
  arrow: chalk.dim('→'),
};

export function printDriftReport(report: DriftReport): void {
  const { drifts, source, target, summary } = report;

  console.log('');
  console.log(
    chalk.bold(`Drift: ${chalk.cyan(source.environment)} → ${chalk.cyan(target.environment)}`),
  );
  console.log(chalk.dim(`Compared at ${report.timestamp}`));
  console.log('');

  if (drifts.length === 0) {
    console.log(
      `${ICONS.ok} ${chalk.green('No drift detected.')} Both environments are in sync.\n`,
    );
    return;
  }

  // Group by category
  const grouped = groupDrifts(drifts);

  if (grouped.missing_in_target.length > 0) {
    console.log(chalk.bold.yellow(`  Missing in ${target.environment}`));
    for (const d of grouped.missing_in_target) {
      console.log(`    ${ICONS.warn} ${chalk.yellow(d.feature)}`);
      console.log(`        ${chalk.dim(d.description)}`);
    }
    console.log('');
  }

  if (grouped.missing_in_source.length > 0) {
    console.log(chalk.bold.yellow(`  Extra in ${target.environment} (not in ${source.environment})`));
    for (const d of grouped.missing_in_source) {
      console.log(`    ${ICONS.info} ${chalk.cyan(d.feature)}`);
      console.log(`        ${chalk.dim(d.description)}`);
    }
    console.log('');
  }

  if (grouped.enabled_state.length > 0) {
    console.log(chalk.bold(`  Enabled state differences`));
    for (const d of grouped.enabled_state) {
      const src = d.sourceValue ? chalk.green('enabled') : chalk.red('disabled');
      const tgt = d.targetValue ? chalk.green('enabled') : chalk.red('disabled');
      console.log(`    ${ICONS.arrow} ${chalk.bold(d.feature)}  ${src} ${chalk.dim('→')} ${tgt}`);
    }
    console.log('');
  }

  if (grouped.value_change.length > 0) {
    console.log(chalk.bold(`  Value differences`));
    for (const d of grouped.value_change) {
      console.log(`    ${ICONS.arrow} ${chalk.bold(d.feature)}`);
      console.log(
        `        ${chalk.dim('source:')} ${chalk.green(JSON.stringify(d.sourceValue))}`,
      );
      console.log(
        `        ${chalk.dim('target:')} ${chalk.red(JSON.stringify(d.targetValue))}`,
      );
    }
    console.log('');
  }

  if (grouped.multivariate_allocation.length > 0) {
    console.log(chalk.bold(`  Multivariate allocation differences`));
    for (const d of grouped.multivariate_allocation) {
      console.log(`    ${ICONS.arrow} ${chalk.bold(d.feature)}`);
      console.log(
        `        ${chalk.dim('source:')} ${formatAllocations(d.sourceValue as Array<{ id: number; percentage: number }>)}`,
      );
      console.log(
        `        ${chalk.dim('target:')} ${formatAllocations(d.targetValue as Array<{ id: number; percentage: number }>)}`,
      );
    }
    console.log('');
  }

  // Summary line
  const parts: string[] = [];
  if (summary.byCategory.enabled_state > 0)
    parts.push(`${summary.byCategory.enabled_state} enabled-state`);
  if (summary.byCategory.value_change > 0)
    parts.push(`${summary.byCategory.value_change} value`);
  if (summary.byCategory.multivariate_allocation > 0)
    parts.push(`${summary.byCategory.multivariate_allocation} multivariate`);
  if (summary.byCategory.missing_in_target > 0)
    parts.push(`${summary.byCategory.missing_in_target} missing-in-target`);
  if (summary.byCategory.missing_in_source > 0)
    parts.push(`${summary.byCategory.missing_in_source} extra-in-target`);

  console.log(
    chalk.bold(
      `  ${chalk.red(`${summary.total} difference${summary.total !== 1 ? 's' : ''}`)} — ${parts.join(', ')}`,
    ),
  );
  console.log('');
}

export function printSyncPlan(plan: SyncPlan): void {
  console.log('');
  console.log(chalk.bold('Sync Plan'));
  console.log(
    `  ${chalk.dim('Source:')} ${chalk.cyan(plan.source.environment)}`,
  );
  console.log(
    `  ${chalk.dim('Target:')} ${chalk.cyan(plan.target.environment)}`,
  );
  console.log(`  ${chalk.dim('Created:')} ${plan.createdAt}`);
  console.log(`  ${chalk.dim('Checksum:')} ${plan.checksum}`);
  console.log('');

  if (plan.operations.length === 0) {
    console.log(`${ICONS.ok} No operations to apply.\n`);
    return;
  }

  console.log(chalk.bold('  Proposed operations'));
  for (const op of plan.operations) {
    const icon =
      op.featureStateId === undefined ? ICONS.warn : ICONS.info;
    console.log(`    ${icon} [${chalk.dim(op.type)}] ${chalk.bold(op.feature)}`);
    console.log(`        ${chalk.dim(op.description)}`);
  }
  console.log('');
  console.log(
    chalk.dim(
      `  ${plan.operations.filter((o) => o.featureStateId !== undefined).length} actionable, ${plan.operations.filter((o) => o.featureStateId === undefined).length} require manual intervention`,
    ),
  );
  console.log('');
}

export function printSyncResult(result: SyncResult): void {
  console.log('');
  console.log(chalk.bold('Sync Result'));
  console.log(`  ${chalk.dim('Applied at:')} ${result.appliedAt}`);
  console.log('');

  for (const r of result.results) {
    if (r.status === 'applied') {
      console.log(
        `  ${ICONS.ok} ${chalk.green('applied')}  ${chalk.bold(r.operation.feature)} [${r.operation.type}]`,
      );
    } else if (r.status === 'skipped') {
      const reason = r.error ?? 'dry-run';
      console.log(
        `  ${ICONS.info} ${chalk.yellow('skipped')}  ${chalk.bold(r.operation.feature)} — ${chalk.dim(reason)}`,
      );
    } else if (r.status === 'stale') {
      console.log(
        `  ${ICONS.warn} ${chalk.yellow('stale')}    ${chalk.bold(r.operation.feature)} — ${chalk.yellow(r.staleReason ?? 'target state changed')}`,
      );
    } else {
      console.log(
        `  ${ICONS.error} ${chalk.red('failed')}   ${chalk.bold(r.operation.feature)} — ${chalk.red(r.error ?? 'unknown error')}`,
      );
    }
  }

  console.log('');

  if (result.hasStaleness) {
    console.log(
      `${ICONS.warn} ${chalk.yellow('Staleness detected.')} Some operations were skipped because the target state changed since the plan was created.\n` +
        `     ${chalk.dim('Re-run')} ${chalk.bold('orqesta plan')} ${chalk.dim('to generate a fresh plan.')}\n`,
    );
  }

  if (result.verificationPassed) {
    console.log(`${ICONS.ok} ${chalk.green('Verification passed.')} Target matches source for all synced flags.\n`);
  } else {
    console.log(`${ICONS.error} ${chalk.red('Verification failed.')} Residual drift detected:\n`);
    if (result.verificationDrifts) {
      for (const d of result.verificationDrifts) {
        console.log(`    ${ICONS.warn} ${d.feature}: ${d.description}`);
      }
    }
    console.log('');
  }
}

export function printAuditEntries(
  entries: Array<FlagsmithAuditEntry & { change_details?: AuditChangeDetail[] }>,
  featureName?: string,
): void {
  console.log('');
  if (featureName) {
    console.log(chalk.bold(`Audit log — ${chalk.cyan(featureName)}`));
  } else {
    console.log(chalk.bold(`Audit log`));
  }
  console.log('');

  if (entries.length === 0) {
    console.log(`  ${ICONS.info} No audit entries found.\n`);
    return;
  }

  for (const entry of entries) {
    const when = new Date(entry.created_date).toLocaleString();
    const actor = entry.author
      ? chalk.bold(`${entry.author.first_name} ${entry.author.last_name} <${entry.author.email}>`)
      : chalk.dim('system/unknown');
    const env = entry.environment ? chalk.dim(`[${entry.environment.name}]`) : '';

    console.log(`  ${chalk.dim(when)} ${env}`);
    console.log(`    ${chalk.bold(entry.log)}`);
    console.log(`    ${chalk.dim('by')} ${actor}`);

    if (entry.change_details && entry.change_details.length > 0) {
      for (const detail of entry.change_details) {
        const oldVal = chalk.red(JSON.stringify(detail.old));
        const newVal = chalk.green(JSON.stringify(detail.new));
        console.log(
          `      ${chalk.dim(detail.field + ':')} ${oldVal} ${chalk.dim('→')} ${newVal}`,
        );
      }
    }

    console.log('');
  }
}

export function printError(message: string): void {
  console.error(`\n${ICONS.error} ${chalk.red(message)}\n`);
}

export function printSuccess(message: string): void {
  console.log(`\n${ICONS.ok} ${chalk.green(message)}\n`);
}

export function printInfo(message: string): void {
  console.log(`${ICONS.info} ${chalk.dim(message)}`);
}

export function printPolicyResult(result: PolicyRunResult): void {
  console.log('');
  console.log(chalk.bold(`Policy check — ${chalk.cyan(result.environment)}`));
  console.log(chalk.dim(`Checked at ${result.timestamp}`));
  console.log('');

  if (result.violations.length === 0) {
    console.log(
      `${ICONS.ok} ${chalk.green('All checks passed.')} ${result.passed} feature${result.passed !== 1 ? 's' : ''} checked.\n`,
    );
    return;
  }

  const errors = result.violations.filter((v) => v.severity === 'error');
  const warnings = result.violations.filter((v) => v.severity === 'warning');
  const infos = result.violations.filter((v) => v.severity === 'info');

  if (errors.length > 0) {
    console.log(chalk.bold.red(`  Errors`));
    for (const v of errors) {
      console.log(`    ${ICONS.error} ${chalk.bold(v.feature)}`);
      console.log(`        ${chalk.red(v.message)}`);
      if (v.suggestion) {
        console.log(`        ${chalk.dim('Suggestion: ' + v.suggestion)}`);
      }
    }
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(chalk.bold.yellow(`  Warnings`));
    for (const v of warnings) {
      console.log(`    ${ICONS.warn} ${chalk.bold(v.feature)}`);
      console.log(`        ${chalk.yellow(v.message)}`);
      if (v.suggestion) {
        console.log(`        ${chalk.dim('Suggestion: ' + v.suggestion)}`);
      }
    }
    console.log('');
  }

  if (infos.length > 0) {
    console.log(chalk.bold(`  Info`));
    for (const v of infos) {
      console.log(`    ${ICONS.info} ${chalk.bold(v.feature)}`);
      console.log(`        ${chalk.dim(v.message)}`);
      if (v.suggestion) {
        console.log(`        ${chalk.dim('Suggestion: ' + v.suggestion)}`);
      }
    }
    console.log('');
  }

  // Summary line
  const summaryParts: string[] = [];
  if (errors.length > 0) summaryParts.push(chalk.red(`${errors.length} error${errors.length !== 1 ? 's' : ''}`));
  if (warnings.length > 0) summaryParts.push(chalk.yellow(`${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`));
  if (infos.length > 0) summaryParts.push(chalk.blue(`${infos.length} info`));
  summaryParts.push(chalk.green(`${result.passed} passed`));

  console.log(chalk.bold(`  Summary: ${summaryParts.join(', ')}`));
  console.log('');
}

function groupDrifts(drifts: DriftItem[]): Record<DriftCategory, DriftItem[]> {
  const groups: Record<DriftCategory, DriftItem[]> = {
    missing_in_source: [],
    missing_in_target: [],
    enabled_state: [],
    value_change: [],
    multivariate_allocation: [],
  };

  for (const d of drifts) {
    groups[d.category].push(d);
  }

  return groups;
}

function formatAllocations(
  allocs: Array<{ id: number; percentage: number }> | undefined,
): string {
  if (!allocs || allocs.length === 0) return chalk.dim('(none)');
  return allocs.map((a) => `option ${a.id}: ${a.percentage}%`).join(', ');
}
