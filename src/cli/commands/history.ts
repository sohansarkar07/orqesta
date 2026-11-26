/**
 * orqesta history <feature>
 * Show chronological audit events for a feature across all environments.
 */

import chalk from 'chalk';
import ora from 'ora';
import { createClient, resolveProject } from '../../utils/clientFactory.js';
import { printAuditEntries, printError } from '../../utils/output.js';
import type { FlagsmithAuditEntryDetail } from '../../types/flagsmith.js';

/** Concurrency-limited allSettled helper */
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

export async function historyCommand(
  featureName: string,
  opts: {
    project?: string;
    limit?: number;
    json?: boolean;
    withChanges?: boolean;
  },
): Promise<void> {
  const client = createClient();
  const spinner = ora(`Fetching change history for ${chalk.cyan(featureName)}...`).start();

  try {
    const projectId = await resolveProject(client, opts.project);

    const auditResponse = await client.getAuditLog(projectId, {
      featureName,
      pageSize: opts.limit ?? 50,
    });

    spinner.succeed(`${auditResponse.count} event(s) in audit log`);

    // Optionally fetch change details for each entry
    let entries: FlagsmithAuditEntryDetail[] | undefined;

    if (opts.withChanges) {
      const enrichSpinner = ora('Fetching change details...').start();
      const tasks = auditResponse.results.map(
        (entry) => () => client.getAuditEntry(entry.id),
      );
      const settled = await allSettledLimited(tasks, 5);
      entries = settled.map((result, i) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        return {
          ...auditResponse.results[i]!,
          change_details: [],
          change_type: 'UNKNOWN' as const,
        };
      });
      enrichSpinner.succeed(`Fetched details for ${entries.length} entries`);
    }

    const displayEntries = entries ?? auditResponse.results;

    if (opts.json) {
      console.log(JSON.stringify(entries ? { results: entries, count: auditResponse.count } : auditResponse, null, 2));
      return;
    }

    console.log('');
    console.log(
      chalk.bold(`Change history — ${chalk.cyan(featureName)}`),
    );
    console.log(
      chalk.dim(
        `  Total events: ${auditResponse.count}  |  Project ID: ${projectId}\n`,
      ),
    );

    printAuditEntries(displayEntries, featureName);

    if (!opts.withChanges) {
      console.log(
        chalk.dim(
          `  Tip: Use ${chalk.bold('--with-changes')} to fetch structured before/after values for each event.\n`,
        ),
      );
    }
  } catch (err) {
    spinner.fail('History fetch failed');
    if (err instanceof Error) {
      printError(err.message);
    } else {
      printError(String(err));
    }
    process.exit(1);
  }
}
