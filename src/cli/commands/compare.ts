/**
 * orqesta compare <source> <target>
 * Compare two environments and display drift.
 */

import ora from 'ora';
import { createClient, resolveEnvironment, resolveProject } from '../../utils/clientFactory.js';
import { DriftComparator } from '../../drift/comparator.js';
import { printDriftReport, printError } from '../../utils/output.js';
import chalk from 'chalk';

export async function compareCommand(
  source: string,
  target: string,
  opts: {
    project?: string;
    json?: boolean;
  },
): Promise<void> {
  const client = createClient();

  const spinner = ora('Resolving environments...').start();

  try {
    const projectId = await resolveProject(client, opts.project);

    const sourceEnv = await resolveEnvironment(client, source, projectId);
    const targetEnv = await resolveEnvironment(client, target, projectId);

    spinner.text = `Fetching ${chalk.cyan(sourceEnv.name)} environment document...`;
    const sourceStates = await client.getFeatureStates(sourceEnv.apiKey);

    spinner.text = `Fetching ${chalk.cyan(targetEnv.name)} environment document...`;
    const targetStates = await client.getFeatureStates(targetEnv.apiKey);

    spinner.text = 'Comparing environments...';

    // Convert feature states to minimal environment documents for comparison
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

    spinner.succeed('Comparison complete');

    if (opts.json) {
      console.log(JSON.stringify(drift, null, 2));
    } else {
      printDriftReport(drift);
    }

    // Store drift for plan command if there are differences
    if (drift.drifts.length > 0) {
      // We'll store this in a local cache file for the plan command
      // For now, just note it in the output
    }

    process.exit(drift.drifts.length > 0 ? 1 : 0);
  } catch (err) {
    spinner.fail('Comparison failed');
    if (err instanceof Error) {
      printError(err.message);
    } else {
      printError(String(err));
    }
    process.exit(1);
  }
}
