/**
 * orqesta environments — list projects and environments
 */

import chalk from 'chalk';
import { createClient, resolveProject } from '../../utils/clientFactory.js';
import { ConfigManager } from '../../config/index.js';
import { printError } from '../../utils/output.js';

export async function environmentsCommand(opts: {
  project?: string;
  json?: boolean;
}): Promise<void> {
  const client = createClient();

  const orgs = await client.getOrganisations();

  if (orgs.length === 0) {
    printError('No organisations found for this API key.');
    process.exit(1);
  }

  const output: Array<{
    organisation: string;
    project: { id: number; name: string };
    environments: Array<{ id: number; name: string; apiKey: string }>;
  }> = [];

  for (const org of orgs) {
    const projects = await client.getProjects(org.id);

    for (const project of projects) {
      if (opts.project) {
        const match =
          project.name.toLowerCase() !== opts.project.toLowerCase() &&
          String(project.id) !== opts.project;
        if (match) continue;
      }

      const environments = await client.getEnvironments(project.id);
      output.push({
        organisation: org.name,
        project: { id: project.id, name: project.name },
        environments: environments.map((e) => ({
          id: e.id,
          name: e.name,
          apiKey: e.api_key,
        })),
      });
    }
  }

  if (opts.json) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  console.log('');
  console.log(chalk.bold('Projects and Environments'));
  console.log('');

  for (const item of output) {
    console.log(
      `  ${chalk.dim('Org:')} ${chalk.bold(item.organisation)}  ${chalk.dim('Project:')} ${chalk.bold(item.project.name)} ${chalk.dim(`(id: ${item.project.id})`)}`,
    );

    if (item.environments.length === 0) {
      console.log(`    ${chalk.dim('No environments found.')}`);
    }

    for (const env of item.environments) {
      console.log(
        `    ${chalk.cyan('•')} ${chalk.bold(env.name)} ${chalk.dim(`— sdk key: ${env.apiKey}`)}`,
      );
    }

    console.log('');
  }

  const totalEnvs = output.reduce((n, o) => n + o.environments.length, 0);
  console.log(
    chalk.dim(
      `  Found ${output.length} project(s), ${totalEnvs} environment(s).\n`,
    ),
  );
}
