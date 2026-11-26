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

  const maskKey = (key: string | undefined) => {
    if (!key) return chalk.dim('(not set)');
    if (key.length <= 8) return chalk.red('(too short — check your key)');
    return chalk.green(key.slice(0, 4) + '…' + key.slice(-4));
  };

  const apiKeySource = process.env.FLAGSMITH_API_KEY ? 'env:FLAGSMITH_API_KEY' : 'config file';
  const apiUrlSource = process.env.FLAGSMITH_API_URL ? 'env:FLAGSMITH_API_URL' : 'config file (or default)';

  console.log(`  ${chalk.bold('API Key:')}         ${maskKey(config.apiKey)} ${chalk.dim(`(${apiKeySource})`)}`);
  console.log(`  ${chalk.bold('API URL:')}         ${chalk.cyan(config.apiUrl ?? '(not set)')} ${chalk.dim(`(${apiUrlSource})`)}`);
  console.log(`  ${chalk.bold('Organisation ID:')} ${config.organisationId ?? chalk.dim('(not set)')}`);
  console.log(`  ${chalk.bold('Project ID:')}      ${config.projectId ?? chalk.dim('(not set)')}`);
  console.log('');
  console.log(`  ${chalk.dim('Config file:')} ${ConfigManager.getConfigPath()}`);
  console.log('');
}

export function configSetKeyCommand(key: string): void {
  if (!key.trim()) {
    console.error(chalk.red('API key must not be empty.'));
    process.exit(1);
  }
  ConfigManager.setApiKey(key.trim());
  console.log(chalk.green(`✓ API key saved to config file.`));
  console.log(chalk.dim('  Tip: You can also set FLAGSMITH_API_KEY as an environment variable.'));
}

export function configSetUrlCommand(url: string): void {
  if (!url.trim()) {
    console.error(chalk.red('URL must not be empty.'));
    process.exit(1);
  }
  ConfigManager.setApiUrl(url.trim());
  console.log(chalk.green(`✓ API URL set to ${url.trim()}`));
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
