/**
 * Orqesta API client for the VS Code extension.
 * All calls go to the Orqesta Express server (default: http://localhost:3001).
 * This matches the same API the React dashboard uses — no business logic duplication.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ─── Types mirroring the core (no import from ESM root package) ──────────────

export interface ConnectionStatus {
  connected: boolean;
  maskedKey?: string;
  apiUrl?: string;
  organisations?: Array<{ id: number; name: string }>;
}

export interface OrgNode {
  id: number;
  name: string;
  projects: ProjectNode[];
}

export interface ProjectNode {
  id: number;
  name: string;
  environments: EnvironmentNode[];
}

export interface EnvironmentNode {
  id: number;
  name: string;
}

export interface FlagItem {
  id: number;
  name: string;
  type: 'STANDARD' | 'MULTIVARIATE';
  enabled: boolean;
  value: string | number | boolean | null;
  description?: string;
  isArchived: boolean;
}

export type DriftCategory =
  | 'missing_in_source'
  | 'missing_in_target'
  | 'enabled_state'
  | 'value_change'
  | 'multivariate_allocation';

export interface DriftItem {
  feature: string;
  category: DriftCategory;
  sourceValue: unknown;
  targetValue: unknown;
  description: string;
}

export interface DriftReport {
  source: { environment: string };
  target: { environment: string };
  timestamp: string;
  drifts: DriftItem[];
  summary: { total: number; byCategory: Record<DriftCategory, number> };
}

export interface PolicyViolation {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  feature: string;
  message: string;
  suggestion?: string;
}

export interface PolicyResult {
  environment: string;
  timestamp: string;
  total: number;
  errors: number;
  warnings: number;
  passed: number;
  violations: PolicyViolation[];
}

export interface AudienceRegression {
  feature: string;
  severity: 'critical' | 'warning' | 'info';
  summary: string;
  shifts: Array<{ label: string; before: number; after: number; delta: number }>;
  controlShift: { label: string; before: number; after: number; delta: number };
  allocationsSumValid: boolean;
}

export interface AudienceGuardReport {
  environment: string;
  sourceEnvironment: string;
  timestamp: string;
  regressions: AudienceRegression[];
  flagsChecked: number;
  flagsUnchanged: number;
  summary: { critical: number; warning: number; info: number; total: number };
}

export interface IdentityFixture {
  identifier: string;
  traits?: Array<{ key: string; value: string | number | boolean }>;
  description?: string;
}

export interface EvalRegression {
  feature: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  explanation: string;
  source: { featureName: string; enabled: boolean; value: unknown; variant: string | null };
  target: { featureName: string; enabled: boolean; value: unknown; variant: string | null } | null;
}

export interface EvalReport {
  sourceEnvironment: string;
  targetEnvironment: string;
  timestamp: string;
  identitiesEvaluated: number;
  totalRegressions: number;
  summary: { critical: number; warning: number; info: number; total: number };
  results: Array<{
    identifier: string;
    traits: Array<{ key: string; value: unknown }>;
    regressions: EvalRegression[];
    featuresEvaluated: number;
    error?: string;
  }>;
}

export interface SyncPlan {
  source: { environment: string };
  target: { environment: string };
  createdAt: string;
  checksum: string;
  operations: Array<{
    id: string;
    feature: string;
    type: string;
    currentValue: unknown;
    proposedValue: unknown;
    description: string;
    featureStateId?: number;
  }>;
}

export class OrquestaApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'OrquestaApiError';
  }
}

// ─── Client ──────────────────────────────────────────────────────────────────

export class OrquestaApiClient {
  private http: AxiosInstance;

  constructor(serverUrl: string) {
    this.http = axios.create({
      baseURL: serverUrl.replace(/\/$/, '') + '/api',
      timeout: 30_000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.http.interceptors.response.use(
      (res) => res,
      (err: AxiosError) => {
        const data = err.response?.data as { error?: string; code?: string } | undefined;
        throw new OrquestaApiError(
          data?.error ?? err.message ?? 'Request failed',
          data?.code,
          err.response?.status,
        );
      },
    );
  }

  async health(): Promise<{ ok: boolean; version: string }> {
    const res = await this.http.get<{ ok: boolean; service: string; version: string }>('/health');
    return res.data;
  }

  async getStatus(): Promise<ConnectionStatus> {
    const res = await this.http.get<ConnectionStatus>('/settings/status');
    return res.data;
  }

  async connect(apiToken: string, apiUrl?: string): Promise<ConnectionStatus> {
    const res = await this.http.post<ConnectionStatus>('/settings/connect', {
      apiKey: apiToken,
      apiUrl: apiUrl || '',
    });
    return res.data;
  }

  async disconnect(): Promise<void> {
    await this.http.post('/settings/disconnect', {});
  }

  async getEnvironments(): Promise<OrgNode[]> {
    const res = await this.http.get<OrgNode[]>('/environments');
    return res.data;
  }

  async compare(projectId: number, sourceEnvName: string, targetEnvName: string): Promise<DriftReport> {
    const res = await this.http.post<DriftReport>('/compare', {
      projectId,
      sourceEnvName,
      targetEnvName,
    });
    return res.data;
  }

  async runPolicy(projectId: number, environmentName: string, policyYaml?: string): Promise<PolicyResult> {
    const res = await this.http.post<PolicyResult>('/policy/run', {
      projectId,
      environmentName,
      policyYaml,
    });
    return res.data;
  }

  async runAudienceGuard(projectId: number, sourceEnvName: string, targetEnvName: string): Promise<AudienceGuardReport> {
    const res = await this.http.post<AudienceGuardReport>('/audience/check', {
      projectId,
      sourceEnvName,
      targetEnvName,
    });
    return res.data;
  }

  async evaluateIdentities(
    projectId: number,
    sourceEnvName: string,
    targetEnvName: string,
    identities: IdentityFixture[],
  ): Promise<EvalReport> {
    const res = await this.http.post<EvalReport>('/audience/eval', {
      projectId,
      sourceEnvName,
      targetEnvName,
      identities,
    });
    return res.data;
  }

  async createSyncPlan(projectId: number, sourceEnvName: string, targetEnvName: string): Promise<{ planId: string; plan: SyncPlan } | { noDrift: true; message: string }> {
    const res = await this.http.post<{ planId: string; plan: SyncPlan } | { noDrift: true; message: string }>(
      '/sync/plan',
      { projectId, sourceEnvName, targetEnvName },
    );
    return res.data;
  }

  async applySyncPlan(planId: string, dryRun: boolean): Promise<unknown> {
    const res = await this.http.post('/sync/apply', { planId, dryRun });
    return res.data;
  }
}
