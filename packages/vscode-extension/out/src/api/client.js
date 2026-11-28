"use strict";
/**
 * Orqesta API client for the VS Code extension.
 * All calls go to the Orqesta Express server (default: http://localhost:3001).
 * This matches the same API the React dashboard uses — no business logic duplication.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrquestaApiClient = exports.OrquestaApiError = void 0;
const axios_1 = __importDefault(require("axios"));
class OrquestaApiError extends Error {
    constructor(message, code, status) {
        super(message);
        this.code = code;
        this.status = status;
        this.name = 'OrquestaApiError';
    }
}
exports.OrquestaApiError = OrquestaApiError;
// ─── Client ──────────────────────────────────────────────────────────────────
class OrquestaApiClient {
    constructor(serverUrl) {
        this.http = axios_1.default.create({
            baseURL: serverUrl.replace(/\/$/, '') + '/api',
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' },
        });
        this.http.interceptors.response.use((res) => res, (err) => {
            const data = err.response?.data;
            throw new OrquestaApiError(data?.error ?? err.message ?? 'Request failed', data?.code, err.response?.status);
        });
    }
    async health() {
        const res = await this.http.get('/health');
        return res.data;
    }
    async getStatus() {
        const res = await this.http.get('/settings/status');
        return res.data;
    }
    async connect(apiToken, apiUrl) {
        const res = await this.http.post('/settings/connect', {
            apiKey: apiToken,
            apiUrl: apiUrl || '',
        });
        return res.data;
    }
    async disconnect() {
        await this.http.post('/settings/disconnect', {});
    }
    async getEnvironments() {
        const res = await this.http.get('/environments');
        return res.data;
    }
    async compare(projectId, sourceEnvName, targetEnvName) {
        const res = await this.http.post('/compare', {
            projectId,
            sourceEnvName,
            targetEnvName,
        });
        return res.data;
    }
    async runPolicy(projectId, environmentName, policyYaml) {
        const res = await this.http.post('/policy/run', {
            projectId,
            environmentName,
            policyYaml,
        });
        return res.data;
    }
    async runAudienceGuard(projectId, sourceEnvName, targetEnvName) {
        const res = await this.http.post('/audience/check', {
            projectId,
            sourceEnvName,
            targetEnvName,
        });
        return res.data;
    }
    async evaluateIdentities(projectId, sourceEnvName, targetEnvName, identities) {
        const res = await this.http.post('/audience/eval', {
            projectId,
            sourceEnvName,
            targetEnvName,
            identities,
        });
        return res.data;
    }
    async createSyncPlan(projectId, sourceEnvName, targetEnvName) {
        const res = await this.http.post('/sync/plan', { projectId, sourceEnvName, targetEnvName });
        return res.data;
    }
    async applySyncPlan(planId, dryRun) {
        const res = await this.http.post('/sync/apply', { planId, dryRun });
        return res.data;
    }
}
exports.OrquestaApiClient = OrquestaApiClient;
//# sourceMappingURL=client.js.map