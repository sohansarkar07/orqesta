/**
 * orqesta compare <source> <target>
 * Compare two environments and display drift.
 */

import ora from 'ora';
import { createClient, resolveEnvironment, resolveProject } from '../../utils/clientFactory.js';
import { DriftComparator } from '../../drift/comparator.js';
import { printDriftReport, printError } from '../../utils/output.js';
import type { EnvironmentDocumentFeatureState } from '../../types/flagsmith.js';
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

    // Fetch features so we can resolve feature IDs → names
    spinner.text = 'Fetching feature list...';
    const features = await client.getFeatures(projectId);
    const featureById = new Map(features.map((f) => [f.id, f]));

    spinner.text = `Fetching ${chalk.cyan(sourceEnv.name)} feature states...`;
    const sourceStates = await client.getFeatureStates(sourceEnv.apiKey);

    spinner.text = `Fetching ${chalk.cyan(targetEnv.name)} feature states...`;
    const targetStates = await client.getFeatureStates(targetEnv.apiKey);

    spinner.text = 'Comparing environments...';

    // Build environment documents with resolved feature names
    const toDoc = (
      states: typeof sourceStates,
      envId: number,
      apiKey: string,
    ) => ({
      id: envId,
      api_key: apiKey,
      project: { id: projectId, name: '', organisation: 0, hide_disabled_flags: false, segments: [] },
      feature_states: states.flatMap((s): EnvironmentDocumentFeatureState[] => {
        // feature may be an ID number (management API) or object (some versions)
        const featureId = typeof s.feature === 'number' ? s.feature : s.feature.id;
        const featureMeta = featureById.get(featureId);
        if (!featureMeta) return []; // skip unknown features
        return [{
          id: s.id,
          feature: { id: featureMeta.id, name: featureMeta.name, type: featureMeta.type },
          enabled: s.enabled,
          value: s.feature_state_value,
          multivariate_feature_state_values: s.multivariate_feature_state_values,
        }];
      }),
    });

    const sourceDoc = toDoc(sourceStates, sourceEnv.id, sourceEnv.apiKey);
    const targetDoc = toDoc(targetStates, targetEnv.id, targetEnv.apiKey);

    const drift = DriftComparator.compare(sourceDoc, sourceEnv.name, targetDoc, targetEnv.name);

    spinner.succeed('Comparison complete');

    if (opts.json) {
      console.log(JSON.stringify(drift, null, 2));
    } else {
      printDriftReport(drift);
    }

    process.exit(drift.drifts.length > 0 ? 1 : 0);
  } catch (err) {
    spinner.fail('Comparison failed');
    printError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
