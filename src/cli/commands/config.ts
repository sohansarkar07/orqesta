/**
 * orqesta config — manage local configuration
 */

import chalk from 'chalk';
import { ConfigManager } from '../../config/index.js';

export function configShowCommand(): void {
  const config = ConfigManager.getAll();

  console.log('');
  console.log(chalk.bold('orqesta configuration'));
  console.log('');

  const maskValue = (val: string | undefined) => {
    if (!val) return chalk.dim('(not set)');
    if (val.length <= 8) return chalk.red('(too short — check your credential)');
    return chalk.green(val.slice(0, 4) + '…' + val.slice(-4));
  };

  const tokenSource = process.env.ORQUESTA_API_TOKEN
    ? 'env:ORQUESTA_API_TOKEN'
    : process.env.FLAGSMITH_API_KEY
      ? 'env:FLAGSMITH_API_KEY (legacy)'
      : 'config file';

  const envKeySource = process.env.ORQUESTA_ENVIRONMENT_KEY
    ? 'env:ORQUESTA_ENVIRONMENT_KEY'
    : 'config file';

  const apiUrlSource = process.env.ORQUESTA_API_URL || process.env.FLAGSMITH_API_URL
    ? 'environment variable'
    : 'config file (or default)';

  console.log(`  ${chalk.bold('Management API token:')} ${maskValue(config.apiToken)}  ${chalk.dim(`(${tokenSource})`)}`);
  console.log(`  ${chalk.bold('Management API URL:')}   ${chalk.cyan(config.apiUrl ?? '(not set)')}  ${chalk.dim(`(${apiUrlSource})`)}`);
  console.log(`  ${chalk.bold('Flags API key:')}        ${maskValue(config.environmentKey)}  ${chalk.dim(`(${envKeySource})`)}`);
  console.log(`  ${chalk.bold('Flags API URL:')}        ${chalk.cyan(config.flagsApiUrl ?? '(not set)')}`);
  console.log(`  ${chalk.bold('Organisation ID:')}      ${config.organisationId ?? chalk.dim('(not set)')}`);
  console.log(`  ${chalk.bold('Project ID:')}           ${config.projectId ?? chalk.dim('(not set)')}`);
  console.log('');
  console.log(`  ${chalk.dim('Config file:')} ${ConfigManager.getConfigPath()}`);
  console.log('');
}

export function configSetKeyCommand(key: string): void {
  if (!key.trim()) {
    console.error(chalk.red('API token must not be empty.'));
    process.exit(1);
  }
  ConfigManager.setApiKey(key.trim()); // setApiKey auto-detects env key vs token
  console.log(chalk.green('✓ Credential saved to config file.'));
  if (key.startsWith('ser.')) {
    console.log(chalk.dim('  Detected as Flags API key (ser. prefix). Stored as environment key.'));
    console.log(chalk.dim('  For Management API access set ORQUESTA_API_TOKEN separately.'));
  } else {
    console.log(chalk.dim('  Stored as Management API token.'));
    console.log(chalk.dim('  Tip: You can also set ORQUESTA_API_TOKEN as an environment variable.'));
  }
}

export function configSetUrlCommand(url: string): void {
  if (!url.trim()) {
    console.error(chalk.red('URL must not be empty.'));
    process.exit(1);
  }
  ConfigManager.setApiUrl(url.trim());
  console.log(chalk.green(`✓ Management API URL set to ${url.trim()}`));
}

export function configSetProjectCommand(projectId: string): void {
  const id = parseInt(projectId, 10);
  if (isNaN(id)) {
    console.error(chalk.red(`Invalid project ID: "${projectId}". Must be a number.`));
    process.exit(1);
  }
  ConfigManager.setProjectId(id);
  console.log(chalk.green(`✓ Default project set to ID ${id}`));
}

export function configClearCommand(): void {
  ConfigManager.clearAll();
  console.log(chalk.green('✓ Configuration cleared.'));
}
