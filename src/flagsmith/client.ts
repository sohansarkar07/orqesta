/**
 * Flagsmith API client with dual credential support:
 * - Management API (Organisation token) - for org/project/env/feature/audit operations
 * - Flags API (Environment key) - for efficient bulk flag retrieval (optional)
 * 
 * All endpoints are official Flagsmith API endpoints.
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type {
  FlagsmithOrganisation,
  FlagsmithProject,
  FlagsmithEnvironment,
  FlagsmithFeature,
  FlagsmithFeatureState,
  FlagsmithEnvironmentDocument,
  FlagsmithAuditEntry,
  FlagsmithAuditEntryDetail,
  FlagsmithSegment,
  PaginatedResponse,
} from '../types/flagsmith.js';

export class FlagsmithApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly endpoint?: string,
  ) {
    super(message);
    this.name = 'FlagsmithApiError';
  }
}

export interface FlagsmithClientConfig {
  /** Management API token for org-level operations (required for most operations) */
  apiToken?: string;
  /** Management API base URL */
  apiUrl: string;
  /** Environment API key for efficient flag retrieval (optional) */
  environmentKey?: string;
  /** Flags API base URL */
  flagsApiUrl: string;
}

export class FlagsmithClient {
  private managementHttp?: AxiosInstance;
  private flagsHttp?: AxiosInstance;
  private config: FlagsmithClientConfig;

  constructor(config: FlagsmithClientConfig | string, legacyBaseUrl?: string) {
    // Legacy constructor support: FlagsmithClient(apiKey, baseUrl)
    if (typeof config === 'string') {
      const apiKey = config;
      const baseUrl = legacyBaseUrl || 'https://api.flagsmith.com/api/v1';
      
      // Auto-detect key type for backward compatibility
      if (apiKey.startsWith('ser.')) {
        this.config = {
          environmentKey: apiKey,
          apiUrl: baseUrl,
          flagsApiUrl: baseUrl.includes('edge.api.flagsmith.com') 
            ? baseUrl 
            : baseUrl.replace('api.flagsmith.com', 'edge.api.flagsmith.com'),
        };
      } else {
        this.config = {
          apiToken: apiKey,
          apiUrl: baseUrl,
          flagsApiUrl: baseUrl.replace('api.flagsmith.com', 'edge.api.flagsmith.com'),
        };
      }
    } else {
      this.config = config;
    }

    // Create Management API client if token provided
    if (this.config.apiToken && this.config.apiToken.trim()) {
      this.managementHttp = this.createManagementClient(
        this.config.apiToken,
        this.config.apiUrl,
      );
    }

    // Create Flags API client if environment key provided
    if (this.config.environmentKey && this.config.environmentKey.trim()) {
      this.flagsHttp = this.createFlagsClient(
        this.config.environmentKey,
        this.config.flagsApiUrl,
      );
    }
  }

  private createManagementClient(apiToken: string, baseUrl: string): AxiosInstance {
    const http = axios.create({
      baseURL: baseUrl.replace(/\/$/, ''),
      headers: {
        Authorization: `Api-Key ${apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 15_000,
    });

    http.interceptors.response.use(
      (res) => res,
      (err: AxiosError) => this.handleError(err, 'Management API'),
    );

    return http;
  }

  private createFlagsClient(environmentKey: string, baseUrl: string): AxiosInstance {
    const http = axios.create({
      baseURL: baseUrl.replace(/\/$/, ''),
      headers: {
        'X-Environment-Key': environmentKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 15_000,
    });

    http.interceptors.response.use(
      (res) => res,
      (err: AxiosError) => this.handleError(err, 'Flags API'),
    );

    return http;
  }

  private handleError(err: AxiosError, apiType: string): never {
    const status = err.response?.status;
    const url = err.config?.url ?? 'unknown endpoint';

    if (status === 401) {
      throw new FlagsmithApiError(
        `${apiType} authentication failed. Check your credentials.`,
        401,
        url,
      );
    }
    if (status === 403) {
      throw new FlagsmithApiError(
        `${apiType} permission denied for ${url}. The credential may lack the required permissions.`,
        403,
        url,
      );
    }
    if (status === 404) {
      throw new FlagsmithApiError(
        `Resource not found: ${url}`,
        404,
        url,
      );
    }
    if (status === 429) {
      throw new FlagsmithApiError(
        'Rate limited by Flagsmith API. Wait a moment and retry.',
        429,
        url,
      );
    }

    const message =
      (err.response?.data as { detail?: string })?.detail ||
      err.message;
    throw new FlagsmithApiError(
      `API error (${status ?? 'network'}): ${message}`,
      status,
      url,
    );
  }

  private requireManagementApi(): AxiosInstance {
    if (!this.managementHttp) {
      throw new FlagsmithApiError(
        'Management API token not configured. Set ORQUESTA_API_TOKEN or FLAGSMITH_API_KEY.',
      );
    }
    return this.managementHttp;
  }

  private requireFlagsApi(): AxiosInstance {
    if (!this.flagsHttp) {
      throw new FlagsmithApiError(
        'Environment API key not configured. Set ORQUESTA_ENVIRONMENT_KEY.',
      );
    }
    return this.flagsHttp;
  }

  // ===== Management API Methods =====
  // Require Management API token (ORQUESTA_API_TOKEN)

  async getOrganisations(): Promise<FlagsmithOrganisation[]> {
    const http = this.requireManagementApi();
    const res = await http.get<{ results: FlagsmithOrganisation[] }>(
      '/organisations/',
    );
    return res.data.results;
  }

  async getProjects(organisationId: number): Promise<FlagsmithProject[]> {
    const http = this.requireManagementApi();
    const res = await http.get<FlagsmithProject[]>(
      `/projects/?organisation=${organisationId}`,
    );
    // Some Flagsmith versions return an array, some paginate — handle both
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return (res.data as unknown as PaginatedResponse<FlagsmithProject>).results;
  }

  async getEnvironments(projectId: number): Promise<FlagsmithEnvironment[]> {
    const http = this.requireManagementApi();
    const res = await http.get<FlagsmithEnvironment[]>(
      `/environments/?project=${projectId}`,
    );
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return (res.data as unknown as PaginatedResponse<FlagsmithEnvironment>)
      .results;
  }

  /**
   * Fetches the full environment document using the Flags API.
   * This is the most efficient way to get a complete snapshot of all feature
   * states, segments and their overrides in one HTTP call.
   *
   * Requires ORQUESTA_ENVIRONMENT_KEY to be configured.
   */
  async getEnvironmentDocument(): Promise<FlagsmithEnvironmentDocument> {
    const http = this.requireFlagsApi();
    const res = await http.get<FlagsmithEnvironmentDocument>(
      '/environment-document/',
    );
    return res.data;
  }

  /**
   * Fetches feature states for an environment using the management API.
   * Returns only the environment defaults (no segment or identity overrides).
   */
  async getFeatureStates(
    environmentApiKey: string,
  ): Promise<FlagsmithFeatureState[]> {
    const http = this.requireManagementApi();
    const results: FlagsmithFeatureState[] = [];
    let url: string | null = `/environments/${environmentApiKey}/featurestates/?page_size=200`;

    while (url) {
      const res: { data: PaginatedResponse<FlagsmithFeatureState> } =
        await http.get<PaginatedResponse<FlagsmithFeatureState>>(url);
      results.push(...res.data.results);
      url = res.data.next
        ? new URL(res.data.next).pathname + new URL(res.data.next).search
        : null;
    }

    return results;
  }

  async updateFeatureState(
    environmentApiKey: string,
    featureStateId: number,
    patch: Partial<
      Pick<
        FlagsmithFeatureState,
        'enabled' | 'feature_state_value' | 'multivariate_feature_state_values'
      >
    >,
  ): Promise<FlagsmithFeatureState> {
    const http = this.requireManagementApi();
    const res = await http.patch<FlagsmithFeatureState>(
      `/environments/${environmentApiKey}/featurestates/${featureStateId}/`,
      patch,
    );
    return res.data;
  }

  async getAuditLog(
    projectId: number,
    opts: {
      environmentId?: number;
      featureName?: string;
      pageSize?: number;
      page?: number;
    } = {},
  ): Promise<PaginatedResponse<FlagsmithAuditEntry>> {
    const http = this.requireManagementApi();
    const params = new URLSearchParams();
    params.set('project', String(projectId));
    if (opts.environmentId) params.set('environment', String(opts.environmentId));
    if (opts.featureName) params.set('feature_name', opts.featureName);
    params.set('page_size', String(opts.pageSize ?? 50));
    if (opts.page) params.set('page', String(opts.page));

    const res = await http.get<PaginatedResponse<FlagsmithAuditEntry>>(
      `/audit/?${params.toString()}`,
    );
    return res.data;
  }

  async getAuditEntry(id: number): Promise<FlagsmithAuditEntryDetail> {
    const http = this.requireManagementApi();
    const res = await http.get<FlagsmithAuditEntryDetail>(`/audit/${id}/`);
    return res.data;
  }

  async getFeatures(projectId: number): Promise<FlagsmithFeature[]> {
    const http = this.requireManagementApi();
    const results: FlagsmithFeature[] = [];
    let url: string | null = `/projects/${projectId}/features/?page_size=200`;

    while (url) {
      const res: { data: PaginatedResponse<FlagsmithFeature> } =
        await http.get<PaginatedResponse<FlagsmithFeature>>(url);
      results.push(...res.data.results);
      url = res.data.next
        ? new URL(res.data.next).pathname + new URL(res.data.next).search
        : null;
    }

    return results;
  }

  async getSegments(projectId: number): Promise<FlagsmithSegment[]> {
    const http = this.requireManagementApi();
    const results: FlagsmithSegment[] = [];
    let url: string | null = `/projects/${projectId}/segments/?page_size=200`;

    while (url) {
      const res: { data: PaginatedResponse<FlagsmithSegment> } =
        await http.get<PaginatedResponse<FlagsmithSegment>>(url);
      results.push(...res.data.results);
      url = res.data.next
        ? new URL(res.data.next).pathname + new URL(res.data.next).search
        : null;
    }

    return results;
  }

  /**
   * Test connectivity and authentication for both APIs.
   * Returns status for Management API and Flags API separately.
   */
  async ping(): Promise<{
    management: { ok: boolean; organisations?: FlagsmithOrganisation[]; error?: string };
    flags: { ok: boolean; environment?: FlagsmithEnvironmentDocument; error?: string };
  }> {
    const result = {
      management: { ok: false } as { ok: boolean; organisations?: FlagsmithOrganisation[]; error?: string },
      flags: { ok: false } as { ok: boolean; environment?: FlagsmithEnvironmentDocument; error?: string },
    };

    // Test Management API if configured
    if (this.managementHttp) {
      try {
        const orgs = await this.getOrganisations();
        result.management = { ok: true, organisations: orgs };
      } catch (err) {
        result.management = {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    // Test Flags API if configured
    if (this.flagsHttp) {
      try {
        const envDoc = await this.getEnvironmentDocument();
        result.flags = { ok: true, environment: envDoc };
      } catch (err) {
        result.flags = {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    return result;
  }
}
