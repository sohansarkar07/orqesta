/**
 * Central state store for the VS Code extension.
 * All views subscribe to state changes via VS Code's EventEmitter.
 */

import * as vscode from 'vscode';
import { OrquestaApiClient, OrgNode, DriftReport, PolicyResult, AudienceGuardReport, EvalReport } from './api/client';
import { CredentialManager } from './api/credentials';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface OrquestaState {
  connection: ConnectionState;
  serverUrl: string;
  maskedToken?: string;
  organisations?: OrgNode[];
  selectedProjectId?: number;
  selectedProjectName?: string;
  selectedSourceEnv?: string;
  selectedTargetEnv?: string;
  lastDrift?: DriftReport;
  lastPolicy?: PolicyResult;
  lastAudienceGuard?: AudienceGuardReport;
  lastEvalReport?: EvalReport;
  error?: string;
}

export class StateManager {
  private _state: OrquestaState;
  private _onStateChange = new vscode.EventEmitter<OrquestaState>();
  readonly onStateChange = this._onStateChange.event;

  public client: OrquestaApiClient;
  public credentials: CredentialManager;

  constructor(secrets: vscode.SecretStorage) {
    this.credentials = new CredentialManager(secrets);
    const serverUrl = this.credentials.getServerUrl();
    this.client = new OrquestaApiClient(serverUrl);

    this._state = {
      connection: 'disconnected',
      serverUrl,
    };
  }

  get state(): OrquestaState {
    return { ...this._state };
  }

  update(partial: Partial<OrquestaState>): void {
    this._state = { ...this._state, ...partial };
    this._onStateChange.fire(this._state);
  }

  updateClient(): void {
    const serverUrl = this.credentials.getServerUrl();
    this.client = new OrquestaApiClient(serverUrl);
    this.update({ serverUrl });
  }

  async checkConnection(): Promise<void> {
    this.update({ connection: 'connecting', error: undefined });
    try {
      const status = await this.client.getStatus();
      if (status.connected) {
        this.update({
          connection: 'connected',
          maskedToken: status.maskedKey,
        });
        // Load environments
        await this.loadEnvironments();
      } else {
        this.update({ connection: 'disconnected' });
      }
    } catch (err) {
      this.update({
        connection: 'error',
        error: err instanceof Error ? err.message : 'Connection failed',
      });
    }
  }

  async loadEnvironments(): Promise<void> {
    try {
      const orgs = await this.client.getEnvironments();
      this.update({ organisations: orgs });

      // Auto-select first project if only one
      const allProjects = orgs.flatMap((o) => o.projects);
      if (allProjects.length === 1 && allProjects[0]) {
        const proj = allProjects[0];
        this.update({
          selectedProjectId: proj.id,
          selectedProjectName: proj.name,
        });
        // Auto-select first two envs
        if (proj.environments.length >= 2) {
          this.update({
            selectedSourceEnv: proj.environments[0]?.name,
            selectedTargetEnv: proj.environments[1]?.name,
          });
        }
      }
    } catch (err) {
      // Non-fatal — connection may be valid but environments unavailable
    }
  }

  dispose(): void {
    this._onStateChange.dispose();
  }
}
