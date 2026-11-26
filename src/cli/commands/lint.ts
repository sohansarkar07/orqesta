/**
 * orqesta lint <environment>
 * Run policy checks against a Flagsmith environment.
 */

import chalk from 'chalk';
import ora from 'ora';
import { createClient, resolveProject } from '../../utils/clientFactory.js';
import { PolicyRunner } from '../../policies/runner.js';
import { loadPolicyFile } from '../../policies/loader.js';
import { printPolicyResult, printError } from '../../utils/output.js';

export async function lintCommand(
  environmentName: string,
  opts: {
    project?: string;
    policy?: string;
    json?: boolean;
    format?: 'markdown' | 'json';
  },
): Promise<void> {
  const client = createClient();

  const spinner = ora('Loading policy file...').start();

  let policy;
  try {
    policy = await loadPolicyFile(opts.policy);
    spinner.succeed(
      `Loaded ${policy.policies.length} policy rule${policy.policies.length !== 1 ? 's' : ''}`,
    );
  } catch (err) {
    spinner.fail('Failed to load policy file');
    printError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const runSpinner = ora(
    `Running policy checks on ${chalk.cyan(environmentName)}...`,
  ).start();

  try {
    const projectId = await resolveProject(client, opts.project);
    const runner = new PolicyRunner(client);
    const result = await runner.runForEnvironment(
      environmentName,
      projectId,
      policy.policies,
    );

    runSpinner.succeed(
      `Policy check complete: ${result.errors} error${result.errors !== 1 ? 's' : ''}, ` +
        `${result.warnings} warning${result.warnings !== 1 ? 's' : ''}, ` +
        `${result.passed} passed`,
    );

    if (opts.json || opts.format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else if (opts.format === 'markdown') {
      printMarkdownPolicyResult(result);
    } else {
      printPolicyResult(result);
    }

    // Exit 1 if any errors
    if (result.errors > 0) {
      process.exit(1);
    }
  } catch (err) {
    runSpinner.fail('Policy check failed');
    printError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

function printMarkdownPolicyResult(
  result: Awaited<ReturnType<PolicyRunner['runForEnvironment']>>,
): void {
  console.log(`# Policy Report — ${result.environment}`);
  console.log('');
  console.log(`**Checked at:** ${result.timestamp}`);
  console.log('');
  console.log(
    `| Errors | Warnings | Infos | Passed |`,
  );
  console.log(`|--------|----------|-------|--------|`);
  console.log(
    `| ${result.errors} | ${result.warnings} | ${result.infos} | ${result.passed} |`,
  );
  console.log('');

  if (result.violations.length === 0) {
    console.log('✅ All checks passed.');
    return;
  }

  console.log('## Violations');
  console.log('');

  for (const v of result.violations) {
    const icon =
      v.severity === 'error' ? '❌' : v.severity === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`### ${icon} ${v.feature}`);
    console.log('');
    console.log(`- **Rule:** \`${v.ruleId}\``);
    console.log(`- **Severity:** ${v.severity}`);
    console.log(`- **Message:** ${v.message}`);
    if (v.suggestion) {
      console.log(`- **Suggestion:** ${v.suggestion}`);
    }
    console.log('');
  }
}
