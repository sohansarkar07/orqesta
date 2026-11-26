/**
 * orqesta report — generate a drift or sync report
 */

import chalk from 'chalk';
import ora from 'ora';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { createClient, resolveEnvironment, resolveProject } from '../../utils/clientFactory.js';
import { DriftComparator } from '../../drift/comparator.js';
import { SyncPlanner } from '../../sync/planner.js';
import type { DriftReport } from '../../types/drift.js';
import type { SyncPlan } from '../../types/sync.js';
import { printError } from '../../utils/output.js';

const PLAN_CACHE_FILE = path.join(os.tmpdir(), 'orqesta-plan.json');

export async function reportCommand(
  source: string,
  target: string,
  opts: {
    project?: string;
    format?: 'markdown' | 'json';
    output?: string;
  },
): Promise<void> {
  const client = createClient();
  const spinner = ora('Generating report...').start();

  try {
    const projectId = await resolveProject(client, opts.project);
    const sourceEnv = await resolveEnvironment(client, source, projectId);
    const targetEnv = await resolveEnvironment(client, target, projectId);

    spinner.text = `Fetching ${chalk.cyan(sourceEnv.name)}...`;
    const sourceStates = await client.getFeatureStates(sourceEnv.apiKey);

    spinner.text = `Fetching ${chalk.cyan(targetEnv.name)}...`;
    const targetStates = await client.getFeatureStates(targetEnv.apiKey);

    spinner.text = 'Detecting drift...';

    const sourceDoc = {
      id: sourceEnv.id,
      api_key: sourceEnv.apiKey,
      project: { id: projectId, name: '', organisation: 0, hide_disabled_flags: false, segments: [] },
      feature_states: sourceStates.map((s) => ({
        id: s.id,
        feature: s.feature,
        enabled: s.enabled,
        value: s.feature_state_value,
        multivariate_feature_state_values: s.multivariate_feature_state_values,
      })),
    };

    const targetDoc = {
      id: targetEnv.id,
      api_key: targetEnv.apiKey,
      project: { id: projectId, name: '', organisation: 0, hide_disabled_flags: false, segments: [] },
      feature_states: targetStates.map((s) => ({
        id: s.id,
        feature: s.feature,
        enabled: s.enabled,
        value: s.feature_state_value,
        multivariate_feature_state_values: s.multivariate_feature_state_values,
      })),
    };

    const drift = DriftComparator.compare(
      sourceDoc,
      sourceEnv.name,
      targetDoc,
      targetEnv.name,
    );

    const plan = SyncPlanner.buildPlan(drift, targetStates);

    // Load a previous sync result if available
    let format = opts.format ?? 'markdown';

    let content: string;
    if (format === 'json') {
      content = JSON.stringify({ drift, plan }, null, 2);
    } else {
      content = buildMarkdownReport(drift, plan);
    }

    const outputFile =
      opts.output ??
      `Orqesta-report-${Date.now()}.${format === 'json' ? 'json' : 'md'}`;

    await fs.writeFile(outputFile, content, 'utf-8');

    spinner.succeed(`Report written to ${chalk.cyan(outputFile)}`);
    console.log('');
    console.log(chalk.dim(`  Drift summary: ${drift.summary.total} difference(s) found`));
    console.log(chalk.dim(`  Sync plan: ${plan.operations.length} operation(s) proposed\n`));
  } catch (err) {
    spinner.fail('Report generation failed');
    if (err instanceof Error) {
      printError(err.message);
    } else {
      printError(String(err));
    }
    process.exit(1);
  }
}

function buildMarkdownReport(drift: DriftReport, plan: SyncPlan): string {
  const lines: string[] = [];

  lines.push('# Orqesta Environment Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Source:** ${drift.source.environment}`);
  lines.push(`**Target:** ${drift.target.environment}`);
  lines.push('');

  lines.push('## Drift Summary');
  lines.push('');
  lines.push(`Total differences detected: **${drift.summary.total}**`);
  lines.push('');

  if (drift.summary.total > 0) {
    lines.push('| Category | Count |');
    lines.push('|---|---|');
    lines.push(`| Enabled state | ${drift.summary.byCategory.enabled_state} |`);
    lines.push(`| Value change | ${drift.summary.byCategory.value_change} |`);
    lines.push(`| Multivariate allocation | ${drift.summary.byCategory.multivariate_allocation} |`);
    lines.push(`| Missing in target | ${drift.summary.byCategory.missing_in_target} |`);
    lines.push(`| Extra in target | ${drift.summary.byCategory.missing_in_source} |`);
    lines.push('');

    lines.push('## Detailed Differences');
    lines.push('');

    for (const d of drift.drifts) {
      lines.push(`### ${d.feature}`);
      lines.push('');
      lines.push(`- **Category:** ${d.category}`);
      lines.push(`- **Source (${drift.source.environment}):** \`${JSON.stringify(d.sourceValue)}\``);
      lines.push(`- **Target (${drift.target.environment}):** \`${JSON.stringify(d.targetValue)}\``);
      lines.push(`- **Description:** ${d.description}`);
      lines.push('');
    }
  } else {
    lines.push('✅ No drift detected. Both environments are in sync.');
    lines.push('');
  }

  lines.push('## Synchronisation Plan');
  lines.push('');
  lines.push(`**Checksum:** \`${plan.checksum}\``);
  lines.push(`**Created:** ${plan.createdAt}`);
  lines.push('');

  if (plan.operations.length > 0) {
    lines.push('| Feature | Operation | Current | Proposed |');
    lines.push('|---|---|---|---|');

    for (const op of plan.operations) {
      lines.push(
        `| \`${op.feature}\` | ${op.type} | \`${JSON.stringify(op.currentValue)}\` | \`${JSON.stringify(op.proposedValue)}\` |`,
      );
    }
    lines.push('');
  } else {
    lines.push('No operations planned.');
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('*Generated by [Orqesta](https://github.com/Orqesta/Orqesta) — Flagsmith configuration safety CLI*');
  lines.push('');

  return lines.join('\n');
}
