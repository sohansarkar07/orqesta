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

  // Check 1: API key present
  const apiKey = ConfigManager.getApiKey();
  checks.push({
    label: 'API key configured',
    pass: !!apiKey,
    note: apiKey
      ? `source: ${process.env.FLAGSMITH_API_KEY ? 'environment variable' : 'config file'}`
      : 'Set with: orqesta config set-key <YOUR_API_KEY> or FLAGSMITH_API_KEY env var',
  });

  // Check 2: API URL configured
  const apiUrl = ConfigManager.getApiUrl();
  checks.push({
    label: 'API URL configured',
    pass: true,
    note: apiUrl,
  });

  // Check 3: Config file path
  const configPath = ConfigManager.getConfigPath();
  checks.push({
    label: 'Config file location',
    pass: true,
    note: configPath,
  });

  // Check 4: API connectivity
  if (apiKey) {
    const client = createClient();
    const result = await client.ping();

    checks.push({
      label: 'API connectivity',
      pass: result.ok,
      note: result.ok
        ? `Connected — ${result.organisations?.length ?? 0} organisation(s) accessible`
        : 'Could not connect. Check your API key and network.',
    });

    if (result.ok && result.organisations && result.organisations.length > 0) {
      const orgName = result.organisations[0]!.name;
      checks.push({
        label: 'Authentication',
        pass: true,
        note: `Authenticated as a member of "${orgName}"`,
      });
    }
  }

  // Print results
  for (const check of checks) {
    const icon = check.pass ? chalk.green('✓') : chalk.red('✗');
    const label = check.pass
      ? chalk.bold(check.label)
      : chalk.bold.red(check.label);
    console.log(`  ${icon}  ${label}`);
    console.log(`     ${chalk.dim(check.note)}`);
    console.log('');
  }

  const failed = checks.filter((c) => !c.pass);
  if (failed.length === 0) {
    console.log(
      chalk.green.bold('  All checks passed. Orqesta is ready to use.\n'),
    );
  } else {
    printError(
      `${failed.length} check${failed.length > 1 ? 's' : ''} failed. Fix the issues above before continuing.`,
    );
    process.exit(1);
  }
}
