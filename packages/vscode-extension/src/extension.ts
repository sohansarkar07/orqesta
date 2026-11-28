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

import * as vscode from 'vscode';
import { StateManager } from './state';
import { FlagScanner } from './scanner/flagScanner';
import { OverviewProvider } from './providers/overviewProvider';
import { FlagsProvider } from './providers/flagsProvider';
import { DriftProvider } from './providers/driftProvider';
import { SafetyProvider } from './providers/safetyProvider';
import { ReleaseProvider } from './providers/releaseProvider';
import { DiagnosticsProvider, OrquestaCodeActionProvider } from './providers/diagnosticsProvider';
import { registerCommands } from './commands/index';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // ─── State ──────────────────────────────────────────────────────────────────
  const state = new StateManager(context.secrets);
  context.subscriptions.push({ dispose: () => state.dispose() });

  // ─── Scanner ────────────────────────────────────────────────────────────────
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('orqesta');
  context.subscriptions.push(diagnosticCollection);
  const scanner = new FlagScanner(diagnosticCollection);
  context.subscriptions.push({ dispose: () => scanner.dispose() });

  // ─── Providers ──────────────────────────────────────────────────────────────
  const overviewProvider  = new OverviewProvider(state);
  const flagsProvider     = new FlagsProvider(state);
  const driftProvider     = new DriftProvider(state);
  const safetyProvider    = new SafetyProvider(state);
  const releaseProvider   = new ReleaseProvider(state);
  const diagnosticsProvider = new DiagnosticsProvider(state);
  context.subscriptions.push({ dispose: () => diagnosticsProvider.dispose() });

  // ─── Tree Views ─────────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('orqesta.overview',       overviewProvider),
    vscode.window.registerTreeDataProvider('orqesta.flags',          flagsProvider),
    vscode.window.registerTreeDataProvider('orqesta.codeIntelligence', safetyProvider),
    vscode.window.registerTreeDataProvider('orqesta.drift',          driftProvider),
    vscode.window.registerTreeDataProvider('orqesta.safety',         safetyProvider),
    vscode.window.registerTreeDataProvider('orqesta.release',        releaseProvider),
  );

  // ─── Code Actions ───────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { language: 'typescript' },
        { language: 'typescriptreact' },
        { language: 'javascript' },
        { language: 'javascriptreact' },
      ],
      new OrquestaCodeActionProvider(),
      { providedCodeActionKinds: OrquestaCodeActionProvider.providedCodeActionKinds },
    ),
  );

  // ─── Commands ───────────────────────────────────────────────────────────────
  registerCommands(
    context, state, scanner, safetyProvider, driftProvider,
    releaseProvider, diagnosticsProvider, flagsProvider, overviewProvider,
  );

  // ─── Auto-scan on save ──────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      const config = vscode.workspace.getConfiguration('orqesta');
      if (!config.get<boolean>('autoScan', true)) return;

      const lang = doc.languageId;
      if (!['typescript', 'typescriptreact', 'javascript', 'javascriptreact'].includes(lang)) return;

      scanner.scheduleScan((result) => {
        const s = state.state;
        const knownFlags = new Set<string>();
        const archivedFlags = new Set<string>();
        if (s.lastDrift) s.lastDrift.drifts.forEach((d) => knownFlags.add(d.feature));
        diagnosticsProvider.updateDiagnostics(result, knownFlags, archivedFlags);
      });
    }),
  );

  // ─── Settings change ────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('orqesta.serverUrl')) {
        state.updateClient();
        state.checkConnection();
      }
    }),
  );

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

export function deactivate(): void {
  // VS Code handles cleanup via context.subscriptions
}
