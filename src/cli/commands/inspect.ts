/**
 * orqesta inspect <feature>
 * Show audit log and history for a specific feature flag.
 */

import chalk from 'chalk';
import ora from 'ora';
import { createClient, resolveProject } from '../../utils/clientFactory.js';
import { printAuditEntries, printError } from '../../utils/output.js';
import type { FlagsmithAuditEntryDetail } from '../../types/flagsmith.js';

/** Concurrency-limited Promise.allSettled — runs at most `limit` promises at once */
async function allSettledLimited<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<Array<PromiseSettledResult<T>>> {
  const results: Array<PromiseSettledResult<T>> = [];
  let idx = 0;

  async function runNext(): Promise<void> {
    while (idx < tasks.length) {
      const current = idx++;
      try {
        const value = await tasks[current]!();
        results[current] = { status: 'fulfilled', value };
      } catch (reason) {
        results[current] = { status: 'rejected', reason };
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () =>
    runNext(),
  );
  await Promise.all(workers);
  return results;
}

export async function inspectCommand(
  featureName: string,
  opts: {
    project?: string;
    environment?: string;
    limit?: number;
    json?: boolean;
    withChanges?: boolean;
  },
): Promise<void> {
  const client = createClient();
  const spinner = ora(`Fetching audit history for ${chalk.cyan(featureName)}...`).start();

  try {
    const projectId = await resolveProject(client, opts.project);

    let environmentId: number | undefined;

    if (opts.environment) {
      const environments = await client.getEnvironments(projectId);
      const env = environments.find(
        (e) =>
          e.name.toLowerCase() === opts.environment!.toLowerCase() ||
          e.api_key === opts.environment,
      );
      if (env) {
        environmentId = env.id;
      }
    }

    const auditResponse = await client.getAuditLog(projectId, {
      environmentId,
      featureName,
      pageSize: opts.limit ?? 25,
    });

    spinner.succeed(`Found ${auditResponse.count} audit entries for "${featureName}"`);

    // Filter to entries relevant to this feature
    const entries = auditResponse.results.filter((e) => {
      const log = e.log.toLowerCase();
      const feature = featureName.toLowerCase();
      return (
        log.includes(feature) ||
        e.related_object_type === 'FEATURE' ||
        e.related_object_type === 'FEATURE_STATE' ||
        e.related_object_type === 'EF_VERSION'
      );
    });

    // Optionally fetch detailed change_details for each relevant entry
    let detailedEntries: FlagsmithAuditEntryDetail[] | undefined;

    if (opts.withChanges) {
      const enrichSpinner = ora('Fetching change details...').start();
      const detailTasks = entries.map(
        (entry) => () => client.getAuditEntry(entry.id),
      );
      const settled = await allSettledLimited(detailTasks, 5);

      detailedEntries = settled.map((result, i) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        // Merge in an empty change_details on failure
        return {
          ...entries[i]!,
          change_details: [],
          change_type: 'UNKNOWN' as const,
        };
      });
      enrichSpinner.succeed(`Fetched details for ${detailedEntries.length} entries`);
    }

    if (opts.json) {
      console.log(
        JSON.stringify(
          {
            feature: featureName,
            total: auditResponse.count,
            entries: detailedEntries ?? entries,
          },
          null,
          2,
        ),
      );
      return;
    }

    printAuditEntries(detailedEntries ?? entries, featureName);

    if (auditResponse.count > entries.length) {
      console.log(
        chalk.dim(
          `  Showing ${entries.length} of ${auditResponse.count} entries. ` +
            `Use ${chalk.bold('--limit')} to see more.\n`,
        ),
      );
    }

    if (!opts.withChanges) {
      console.log(
        chalk.dim(
          `  Tip: Use ${chalk.bold('--with-changes')} to fetch structured before/after values for each event.\n`,
        ),
      );
    }
  } catch (err) {
    spinner.fail('Inspect failed');
    if (err instanceof Error) {
      printError(err.message);
    } else {
      printError(String(err));
    }
    process.exit(1);
  }
}
