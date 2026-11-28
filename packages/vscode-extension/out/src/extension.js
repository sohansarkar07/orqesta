"use strict";
/**
 * ORQESTA VS Code Extension — Main entry point.
 *
 * Architecture: the extension calls the Orqesta Express API server
 * (http://localhost:3001 by default). All business logic lives in the
 * existing shared core — this extension is a client, not a reimplementation.
 *
 * Security: credentials are stored in VS Code SecretStorage only.
 * API tokens are never placed in settings.json or logs.
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const state_1 = require("./state");
const flagScanner_1 = require("./scanner/flagScanner");
const overviewProvider_1 = require("./providers/overviewProvider");
const flagsProvider_1 = require("./providers/flagsProvider");
const driftProvider_1 = require("./providers/driftProvider");
const safetyProvider_1 = require("./providers/safetyProvider");
const releaseProvider_1 = require("./providers/releaseProvider");
const diagnosticsProvider_1 = require("./providers/diagnosticsProvider");
const index_1 = require("./commands/index");
async function activate(context) {
    // ─── State ──────────────────────────────────────────────────────────────────
    const state = new state_1.StateManager(context.secrets);
    context.subscriptions.push({ dispose: () => state.dispose() });
    // ─── Scanner ────────────────────────────────────────────────────────────────
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('orqesta');
    context.subscriptions.push(diagnosticCollection);
    const scanner = new flagScanner_1.FlagScanner(diagnosticCollection);
    context.subscriptions.push({ dispose: () => scanner.dispose() });
    // ─── Providers ──────────────────────────────────────────────────────────────
    const overviewProvider = new overviewProvider_1.OverviewProvider(state);
    const flagsProvider = new flagsProvider_1.FlagsProvider(state);
    const driftProvider = new driftProvider_1.DriftProvider(state);
    const safetyProvider = new safetyProvider_1.SafetyProvider(state);
    const releaseProvider = new releaseProvider_1.ReleaseProvider(state);
    const diagnosticsProvider = new diagnosticsProvider_1.DiagnosticsProvider(state);
    context.subscriptions.push({ dispose: () => diagnosticsProvider.dispose() });
    // ─── Tree Views ─────────────────────────────────────────────────────────────
    context.subscriptions.push(vscode.window.registerTreeDataProvider('orqesta.overview', overviewProvider), vscode.window.registerTreeDataProvider('orqesta.flags', flagsProvider), vscode.window.registerTreeDataProvider('orqesta.codeIntelligence', safetyProvider), vscode.window.registerTreeDataProvider('orqesta.drift', driftProvider), vscode.window.registerTreeDataProvider('orqesta.safety', safetyProvider), vscode.window.registerTreeDataProvider('orqesta.release', releaseProvider));
    // ─── Code Actions ───────────────────────────────────────────────────────────
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider([
        { language: 'typescript' },
        { language: 'typescriptreact' },
        { language: 'javascript' },
        { language: 'javascriptreact' },
    ], new diagnosticsProvider_1.OrquestaCodeActionProvider(), { providedCodeActionKinds: diagnosticsProvider_1.OrquestaCodeActionProvider.providedCodeActionKinds }));
    // ─── Commands ───────────────────────────────────────────────────────────────
    (0, index_1.registerCommands)(context, state, scanner, safetyProvider, driftProvider, releaseProvider, diagnosticsProvider, flagsProvider, overviewProvider);
    // ─── Auto-scan on save ──────────────────────────────────────────────────────
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((doc) => {
        const config = vscode.workspace.getConfiguration('orqesta');
        if (!config.get('autoScan', true))
            return;
        const lang = doc.languageId;
        if (!['typescript', 'typescriptreact', 'javascript', 'javascriptreact'].includes(lang))
            return;
        scanner.scheduleScan((result) => {
            const s = state.state;
            const knownFlags = new Set();
            const archivedFlags = new Set();
            if (s.lastDrift)
                s.lastDrift.drifts.forEach((d) => knownFlags.add(d.feature));
            diagnosticsProvider.updateDiagnostics(result, knownFlags, archivedFlags);
        });
    }));
    // ─── Settings change ────────────────────────────────────────────────────────
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('orqesta.serverUrl')) {
            state.updateClient();
            state.checkConnection();
        }
    }));
    // ─── Status bar ─────────────────────────────────────────────────────────────
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBar.command = 'orqesta.connect';
    context.subscriptions.push(statusBar);
    state.onStateChange((s) => {
        switch (s.connection) {
            case 'connected':
                statusBar.text = `$(check) ORQESTA`;
                statusBar.tooltip = `Connected to Flagsmith${s.selectedProjectName ? ` — ${s.selectedProjectName}` : ''}`;
                statusBar.backgroundColor = undefined;
                break;
            case 'connecting':
                statusBar.text = `$(loading~spin) ORQESTA`;
                statusBar.tooltip = 'Connecting to Flagsmith…';
                break;
            case 'error':
                statusBar.text = `$(error) ORQESTA`;
                statusBar.tooltip = `Connection error: ${s.error}`;
                statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
            default:
                statusBar.text = `$(plug) ORQESTA`;
                statusBar.tooltip = 'Click to connect to Flagsmith';
                statusBar.backgroundColor = undefined;
        }
        statusBar.show();
    });
    statusBar.text = '$(plug) ORQESTA';
    statusBar.tooltip = 'Click to connect to Flagsmith';
    statusBar.show();
    // ─── Initial connection check ───────────────────────────────────────────────
    // Non-blocking — check if already connected from a previous session
    state.checkConnection().catch(() => {
        // Server may not be running yet — that's fine
    });
}
function deactivate() {
    // VS Code handles cleanup via context.subscriptions
}
//# sourceMappingURL=extension.js.map