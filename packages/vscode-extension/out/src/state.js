"use strict";
/**
 * Central state store for the VS Code extension.
 * All views subscribe to state changes via VS Code's EventEmitter.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManager = void 0;
const vscode = __importStar(require("vscode"));
const client_1 = require("./api/client");
const credentials_1 = require("./api/credentials");
class StateManager {
    constructor(secrets) {
        this._onStateChange = new vscode.EventEmitter();
        this.onStateChange = this._onStateChange.event;
        this.credentials = new credentials_1.CredentialManager(secrets);
        const serverUrl = this.credentials.getServerUrl();
        this.client = new client_1.OrquestaApiClient(serverUrl);
        this._state = {
            connection: 'disconnected',
            serverUrl,
        };
    }
    get state() {
        return { ...this._state };
    }
    update(partial) {
        this._state = { ...this._state, ...partial };
        this._onStateChange.fire(this._state);
    }
    updateClient() {
        const serverUrl = this.credentials.getServerUrl();
        this.client = new client_1.OrquestaApiClient(serverUrl);
        this.update({ serverUrl });
    }
    async checkConnection() {
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
            }
            else {
                this.update({ connection: 'disconnected' });
            }
        }
        catch (err) {
            this.update({
                connection: 'error',
                error: err instanceof Error ? err.message : 'Connection failed',
            });
        }
    }
    async loadEnvironments() {
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
        }
        catch (err) {
            // Non-fatal — connection may be valid but environments unavailable
        }
    }
    dispose() {
        this._onStateChange.dispose();
    }
}
exports.StateManager = StateManager;
//# sourceMappingURL=state.js.map