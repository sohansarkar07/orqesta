/**
 * orqesta doctor — check connectivity, auth, and configuration health
 */

import chalk from 'chalk';
import { createClient } from '../../utils/clientFactory.js';
import { ConfigManager } from '../../config/index.js';
import { printError } from '../../utils/output.js';

export async function doctorCommand(): Promise<void> {
  console.log('');
  console.log(chalk.bold('Orqesta — Doctor'));
  console.log('');

  const checks: Array<{ label: string; pass: boolean; note: string }> = [];

  const apiToken = ConfigManager.getApiToken();
  const environmentKey = ConfigManager.getEnvironmentKey();
  const apiUrl = ConfigManager.getApiUrl();
  const flagsApiUrl = ConfigManager.getFlagsApiUrl();
  const configPath = ConfigManager.getConfigPath();

  // --- Credential presence ---
  checks.push({
    label: 'Management API token',
    pass: !!apiToken,
    note: apiToken
      ? `Configured via ${process.env.ORQUESTA_API_TOKEN || process.env.FLAGSMITH_API_KEY ? 'environment variable' : 'config file'}`
      : 'Not configured. Set ORQUESTA_API_TOKEN (or legacy FLAGSMITH_API_KEY)',
  });

  checks.push({
    label: 'Flags API key (optional)',
    pass: true,
    note: environmentKey
      ? `Configured via ${process.env.ORQUESTA_ENVIRONMENT_KEY ? 'environment variable' : 'config file'}`
      : 'Not configured — set ORQUESTA_ENVIRONMENT_KEY to enable faster compare/lint',
  });

  // --- URLs ---
  checks.push({ label: 'Management API URL', pass: true, note: apiUrl });
  checks.push({ label: 'Flags API URL',       pass: true, note: flagsApiUrl });
  checks.push({ label: 'Config file location', pass: true, note: configPath });

  // --- Live connectivity ---
  if (apiToken || environmentKey) {
    try {
      const client = createClient();
      const result = await client.ping();

      // Management API
      if (apiToken) {
        if (result.management.ok) {
          const orgCount = result.management.organisations?.length ?? 0;
          checks.push({
            label: 'Management API connectivity',
            pass: true,
            note: `Connected — ${orgCount} organisation(s) accessible`,
          });
          const orgName = result.management.organisations?.[0]?.name;
          if (orgName) {
            checks.push({
              label: 'Management API authentication',
              pass: true,
              note: `Authenticated to "${orgName}"`,
            });
          }
        } else {
          checks.push({
            label: 'Management API connectivity',
            pass: false,
            note: result.management.error ?? 'Could not connect. Check your credentials and network.',
          });
        }
      }

      // Flags API
      if (environmentKey) {
        if (result.flags.ok) {
          const envName = result.flags.environment?.name ?? 'Unknown';
          const projectName = result.flags.environment?.project.name ?? 'Unknown';
          checks.push({
            label: 'Flags API connectivity',
            pass: true,
            note: `Connected to environment "${envName}" in project "${projectName}"`,
          });
        } else {
          checks.push({
            label: 'Flags API connectivity',
            pass: false,
            note: result.flags.error ?? 'Could not connect. Check your environment key and network.',
          });
        }
      }
    } catch (error) {
      checks.push({
        label: 'API connectivity',
        pass: false,
        note: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  }

  // --- Print ---
  for (const check of checks) {
    const icon  = check.pass ? chalk.green('✓') : chalk.red('✗');
    const label = check.pass ? chalk.bold(check.label) : chalk.bold.red(check.label);
    console.log(`  ${icon}  ${label}`);
    console.log(`     ${chalk.dim(check.note)}`);
    console.log('');
  }

  const failed = checks.filter((c) => !c.pass);
  if (failed.length === 0) {
    console.log(chalk.green.bold('  All checks passed. Orqesta is ready to use.\n'));
  } else {
    printError(`${failed.length} check${failed.length > 1 ? 's' : ''} failed. Fix the issues above before continuing.`);
    process.exit(1);
  }
}
