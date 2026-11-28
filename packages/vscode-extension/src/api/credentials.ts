/**
 * Secure credential management using VS Code SecretStorage.
 * API tokens are NEVER stored in workspace settings or logs.
 */

import * as vscode from 'vscode';

const SECRET_KEY = 'orqesta.apiToken';
const SERVER_URL_KEY = 'orqesta.serverUrl';

export class CredentialManager {
  constructor(private readonly secrets: vscode.SecretStorage) {}

  async getToken(): Promise<string | undefined> {
    return this.secrets.get(SECRET_KEY);
  }

  async storeToken(token: string): Promise<void> {
    if (!token.trim()) {
      throw new Error('Token must not be empty.');
    }
    await this.secrets.store(SECRET_KEY, token.trim());
  }

  async clearToken(): Promise<void> {
    await this.secrets.delete(SECRET_KEY);
  }

  async hasToken(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  getServerUrl(): string {
    const config = vscode.workspace.getConfiguration('orqesta');
    return config.get<string>('serverUrl', 'http://localhost:3001');
  }

  maskToken(token: string): string {
    if (token.length <= 8) return '****';
    return token.slice(0, 4) + '…' + token.slice(-4);
  }
}
