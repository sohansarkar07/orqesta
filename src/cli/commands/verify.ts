/**
 * orqesta verify <source> <target>
 * Verify that target environment matches source after a sync.
 */

import chalk from 'chalk';
import ora from 'ora';
import { createClient, resolveEnvironment, resolveProject } from '../../utils/clientFactory.js';
import { DriftComparator } from '../../drift/comparator.js';
import { printError } from '../../utils/output.js';

export async function verifyCommand(
  source: string,
  target: string,
  opts: {
    project?: string;
    json?: boolean;
  },
): Promise<void> {
  const client = createClient();
  const spinner = ora('Verifying environment consistency...').start();

  try {
    const projectId = await resolveProject(client, opts.project);

    const sourceEnv = await resolveEnvironment(client, source, projectId);
    const targetEnv = await resolveEnvironment(client, target, projectId);

    spinner.text = `Fetching ${chalk.cyan(sourceEnv.name)}...`;
    const sourceStates = await client.getFeatureStates(sourceEnv.apiKey);

    spinner.text = `Fetching ${chalk.cyan(targetEnv.name)}...`;
    const targetStates = await client.getFeatureStates(targetEnv.apiKey);

    spinner.text = 'Comparing...';

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

    if (drift.drifts.length === 0) {
      spinner.succeed(
        chalk.green(`✓ Verification passed — ${sourceEnv.name} and ${targetEnv.name} are in sync`),
      );
      console.log('');
    } else {
      spinner.fail(
        chalk.red(`✗ Verification failed — ${drift.drifts.length} difference(s) remain`),
      );
      console.log('');

      if (opts.json) {
        console.log(JSON.stringify(drift, null, 2));
      } else {
        for (const d of drift.drifts) {
          console.log(
            `  ${chalk.yellow('⚠')}  ${chalk.bold(d.feature)} — ${d.description}`,
          );
        }
        console.log('');
      }

      process.exit(1);
    }

    if (opts.json) {
      console.log(JSON.stringify({ verified: true, drift }, null, 2));
    }
  } catch (err) {
    spinner.fail('Verification failed');
    if (err instanceof Error) {
      printError(err.message);
    } else {
      printError(String(err));
    }
    process.exit(1);
  }
}
