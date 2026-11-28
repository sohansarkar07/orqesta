"use strict";
/**
 * Secure credential management using VS Code SecretStorage.
 * API tokens are NEVER stored in workspace settings or logs.
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
exports.CredentialManager = void 0;
const vscode = __importStar(require("vscode"));
const SECRET_KEY = 'orqesta.apiToken';
const SERVER_URL_KEY = 'orqesta.serverUrl';
class CredentialManager {
    constructor(secrets) {
        this.secrets = secrets;
    }
    async getToken() {
        return this.secrets.get(SECRET_KEY);
    }
    async storeToken(token) {
        if (!token.trim()) {
            throw new Error('Token must not be empty.');
        }
        await this.secrets.store(SECRET_KEY, token.trim());
    }
    async clearToken() {
        await this.secrets.delete(SECRET_KEY);
    }
    async hasToken() {
        const token = await this.getToken();
        return !!token;
    }
    getServerUrl() {
        const config = vscode.workspace.getConfiguration('orqesta');
        return config.get('serverUrl', 'http://localhost:3001');
    }
    maskToken(token) {
        if (token.length <= 8)
            return '****';
        return token.slice(0, 4) + '…' + token.slice(-4);
    }
}
exports.CredentialManager = CredentialManager;
//# sourceMappingURL=credentials.js.map