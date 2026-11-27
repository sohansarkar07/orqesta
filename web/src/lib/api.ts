/**
 * Typed API client for the React frontend.
 * All requests go through the Express backend — NEVER to Flagsmith directly.
 * API tokens stay server-side.
 */

const API_BASE = (import.meta as unknown as { env: { DEV: boolean } }).env.DEV
  ? 'http://localhost:3001/api'
  : '/api'; // in production, frontend and backend are served from the same origin

export interface ApiError {
  error: string;
  code: string;
  details?: string;
}

class ApiClient {
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${API_BASE}${path}`;
    const opts: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);
    const json = await res.json();

    if (!res.ok) {
      const err = json as ApiError;
      const e = new Error(err.error || 'Request failed');
      (e as { code?: string; details?: string }).code = err.code;
      (e as { code?: string; details?: string }).details = err.details;
      throw e;
    }

    return json as T;
  }

  async health() {
    return this.request<{ ok: boolean; service: string; version: string }>('GET', '/health');
  }

  // ─── Settings ───────────────────────────────────────────────────────────────

  async connect(apiKey: string, apiUrl?: string) {
    return this.request<{
      connected: boolean;
      maskedKey: string;
      organisations: Array<{ id: number; name: string }>;
    }>('POST', '/settings/connect', { apiKey, apiUrl });
  }

  async settingsStatus() {
    return this.request<{
      connected: boolean;
      maskedKey?: string;
      apiUrl?: string;
      organisations?: Array<{ id: number; name: string }>;
    }>('GET', '/settings/status');
  }

  async disconnect() {
    return this.request<{ disconnected: boolean }>('POST', '/settings/disconnect', {});
  }

  // ─── Environments ───────────────────────────────────────────────────────────

  async environments() {
    return this.request<
      Array<{
        id: number;
        name: string;
        projects: Array<{
          id: number;
          name: string;
          environments: Array<{ id: number; name: string }>;
        }>;
      }>
    >('GET', '/environments');
  }

  async projectEnvironments(projectId: number) {
    return this.request<
      Array<{
        id: number;
        name: string;
        description?: string;
        created_date?: string;
      }>
    >('GET', `/environments/${projectId}`);
  }

  // ─── Compare ────────────────────────────────────────────────────────────────

  async compare(projectId: number, sourceEnvName: string, targetEnvName: string) {
    return this.request<import('./types.js').DriftReport>('POST', '/compare', {
      projectId,
      sourceEnvName,
      targetEnvName,
    });
  }

  // ─── Sync ───────────────────────────────────────────────────────────────────

  async syncPlan(projectId: number, sourceEnvName: string, targetEnvName: string) {
    return this.request<
      | { noDrift: true; message: string }
      | { planId: string; plan: import('./types.js').SyncPlan }
    >('POST', '/sync/plan', { projectId, sourceEnvName, targetEnvName });
  }

  async syncApply(
    planId: string,
    opts: { dryRun?: boolean; selectedOperationIds?: string[] } = {},
  ) {
    return this.request<import('./types.js').SyncResult & { plan: import('./types.js').SyncPlan }>(
      'POST',
      '/sync/apply',
      { planId, ...opts },
    );
  }

  // ─── Forensics ──────────────────────────────────────────────────────────────

  async auditLog(opts: {
    projectId: number;
    environmentId?: number;
    featureName?: string;
    pageSize?: number;
    page?: number;
  }) {
    const params = new URLSearchParams();
    params.set('projectId', String(opts.projectId));
    if (opts.environmentId) params.set('environmentId', String(opts.environmentId));
    if (opts.featureName) params.set('featureName', opts.featureName);
    if (opts.pageSize) params.set('pageSize', String(opts.pageSize));
    if (opts.page) params.set('page', String(opts.page));

    return this.request<{
      count: number;
      next: string | null;
      previous: string | null;
      results: import('./types.js').AuditEntry[];
    }>('GET', `/forensics/audit?${params.toString()}`);
  }

  async auditEntry(id: number) {
    return this.request<import('./types.js').AuditEntry>('GET', `/forensics/audit/${id}`);
  }

  // ─── Policy ─────────────────────────────────────────────────────────────────

  async policyRun(
    projectId: number,
    environmentName: string,
    policyYaml?: string,
  ) {
    return this.request<import('./types.js').PolicyRunResult>('POST', '/policy/run', {
      projectId,
      environmentName,
      policyYaml,
    });
  }

  async policyDefault() {
    return this.request<{ yaml: string }>('GET', '/policy/default');
  }

  // ─── Audience Guard ──────────────────────────────────────────────────────────

  async audienceCheck(projectId: number, sourceEnvName: string, targetEnvName: string) {
    return this.request<import('./types.js').AudienceGuardReport>('POST', '/audience/check', {
      projectId,
      sourceEnvName,
      targetEnvName,
    });
  }
}

export const api = new ApiClient();
