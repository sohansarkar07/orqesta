/**
 * Flagsmith Management API client
 * Uses the Organisation API Token for authentication.
 * All endpoints are official Flagsmith Management API endpoints.
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

export class FlagsmithClient {
  private http: AxiosInstance;

  constructor(apiKey: string, baseUrl: string) {
    if (!apiKey.trim()) {
      throw new FlagsmithApiError('API key must not be empty');
    }

    this.http = axios.create({
      baseURL: baseUrl.replace(/\/$/, ''),
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 15_000,
    });

    // Never log the Authorization header
    this.http.interceptors.request.use((config) => {
      return config;
    });

    this.http.interceptors.response.use(
      (res) => res,
      (err: AxiosError) => {
        const status = err.response?.status;
        const url = err.config?.url ?? 'unknown endpoint';

        if (status === 401) {
          throw new FlagsmithApiError(
            'Authentication failed. Check your FLAGSMITH_API_KEY.',
            401,
            url,
          );
        }
        if (status === 403) {
          throw new FlagsmithApiError(
            `Permission denied for ${url}. The API key may lack the required permissions.`,
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
      },
    );
  }

  async getOrganisations(): Promise<FlagsmithOrganisation[]> {
    const res = await this.http.get<{ results: FlagsmithOrganisation[] }>(
      '/organisations/',
    );
    return res.data.results;
  }

  async getProjects(organisationId: number): Promise<FlagsmithProject[]> {
    const res = await this.http.get<FlagsmithProject[]>(
      `/projects/?organisation=${organisationId}`,
    );
    // Some Flagsmith versions return an array, some paginate — handle both
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return (res.data as unknown as PaginatedResponse<FlagsmithProject>).results;
  }

  async getEnvironments(projectId: number): Promise<FlagsmithEnvironment[]> {
    const res = await this.http.get<FlagsmithEnvironment[]>(
      `/environments/?project=${projectId}`,
    );
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return (res.data as unknown as PaginatedResponse<FlagsmithEnvironment>)
      .results;
  }

  /**
   * Fetches the full environment document using the server-side SDK key.
   * This is the most efficient way to get a complete snapshot of all feature
   * states, segments and their overrides in one HTTP call.
   *
   * Requires a SERVER-SIDE environment API key (not the client-side key).
   * Falls back to the management API feature state list if document fails.
   */
  async getEnvironmentDocument(
    serverSideApiKey: string,
  ): Promise<FlagsmithEnvironmentDocument> {
    // The environment document endpoint uses the SDK API key, not the management token
    const res = await this.http.get<FlagsmithEnvironmentDocument>(
      `/environment-document/`,
      {
        headers: {
          'X-Environment-Key': serverSideApiKey,
          Authorization: undefined, // environment document uses SDK key header
        },
      },
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
    const results: FlagsmithFeatureState[] = [];
    let url: string | null = `/environments/${environmentApiKey}/featurestates/?page_size=200`;

    while (url) {
      const res: { data: PaginatedResponse<FlagsmithFeatureState> } =
        await this.http.get<PaginatedResponse<FlagsmithFeatureState>>(url);
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
    const res = await this.http.patch<FlagsmithFeatureState>(
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
    const params = new URLSearchParams();
    params.set('project', String(projectId));
    if (opts.environmentId) params.set('environment', String(opts.environmentId));
    if (opts.featureName) params.set('feature_name', opts.featureName);
    params.set('page_size', String(opts.pageSize ?? 50));
    if (opts.page) params.set('page', String(opts.page));

    const res = await this.http.get<PaginatedResponse<FlagsmithAuditEntry>>(
      `/audit/?${params.toString()}`,
    );
    return res.data;
  }

  async getAuditEntry(id: number): Promise<FlagsmithAuditEntryDetail> {
    const res = await this.http.get<FlagsmithAuditEntryDetail>(`/audit/${id}/`);
    return res.data;
  }

  async getFeatures(projectId: number): Promise<FlagsmithFeature[]> {
    const results: FlagsmithFeature[] = [];
    let url: string | null = `/projects/${projectId}/features/?page_size=200`;

    while (url) {
      const res: { data: PaginatedResponse<FlagsmithFeature> } =
        await this.http.get<PaginatedResponse<FlagsmithFeature>>(url);
      results.push(...res.data.results);
      url = res.data.next
        ? new URL(res.data.next).pathname + new URL(res.data.next).search
        : null;
    }

    return results;
  }

  async getSegments(projectId: number): Promise<FlagsmithSegment[]> {
    const results: FlagsmithSegment[] = [];
    let url: string | null = `/projects/${projectId}/segments/?page_size=200`;

    while (url) {
      const res: { data: PaginatedResponse<FlagsmithSegment> } =
        await this.http.get<PaginatedResponse<FlagsmithSegment>>(url);
      results.push(...res.data.results);
      url = res.data.next
        ? new URL(res.data.next).pathname + new URL(res.data.next).search
        : null;
    }

    return results;
  }

  /** Simple connectivity + auth check — returns true if the API key is valid */
  async ping(): Promise<{ ok: boolean; organisations?: FlagsmithOrganisation[] }> {
    try {
      const orgs = await this.getOrganisations();
      return { ok: true, organisations: orgs };
    } catch (err) {
      if (err instanceof FlagsmithApiError) {
        return { ok: false };
      }
      throw err;
    }
  }
}
