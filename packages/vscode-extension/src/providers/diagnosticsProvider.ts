/**
 * Inline editor diagnostics for Flagsmith flag references.
 * Uses VS Code's native DiagnosticCollection API.
 *
 * Shows inline warnings/errors for:
 * - Missing flag: referenced in code but not in Flagsmith
 * - Archived flag: code references a flag marked as archived
 */

import * as vscode from 'vscode';
import { FlagReference, ScanResult } from '../scanner/flagScanner';
import { StateManager } from '../state';

const SOURCE = 'ORQESTA';

export class DiagnosticsProvider {
  private readonly collection: vscode.DiagnosticCollection;

  constructor(private readonly state: StateManager) {
    this.collection = vscode.languages.createDiagnosticCollection('orqesta');
  }

  updateDiagnostics(
    scanResult: ScanResult,
    knownFlagNames: Set<string>,
    archivedFlagNames: Set<string>,
  ): void {
    this.collection.clear();

    // Group references by file
    const byFile = new Map<string, FlagReference[]>();
    for (const ref of scanResult.references) {
      const list = byFile.get(ref.filePath) ?? [];
      list.push(ref);
      byFile.set(ref.filePath, list);
    }

    for (const [filePath, refs] of byFile) {
      const diagnostics: vscode.Diagnostic[] = [];

      for (const ref of refs) {
        if (ref.isDynamic) continue; // skip — can't reliably diagnose dynamic refs

        const range = new vscode.Range(
          ref.line, ref.character,
          ref.line, ref.character + ref.flagName.length + 2, // +2 for quotes
        );

        if (archivedFlagNames.has(ref.flagName)) {
          const diag = new vscode.Diagnostic(
            range,
            `'${ref.flagName}' is an archived Flagsmith flag. Consider removing this reference.`,
            vscode.DiagnosticSeverity.Warning,
          );
          diag.source = SOURCE;
          diag.code = 'archived-flag';
          diag.tags = [vscode.DiagnosticTag.Deprecated];
          diagnostics.push(diag);
        } else if (knownFlagNames.size > 0 && !knownFlagNames.has(ref.flagName)) {
          const diag = new vscode.Diagnostic(
            range,
            `'${ref.flagName}' was not found in the selected Flagsmith environment. It may be missing or misspelled.`,
            vscode.DiagnosticSeverity.Warning,
          );
          diag.source = SOURCE;
          diag.code = 'missing-flag';
          diagnostics.push(diag);
        }
      }

      if (diagnostics.length > 0) {
        this.collection.set(vscode.Uri.file(filePath), diagnostics);
      }
    }
  }

  clear(): void {
    this.collection.clear();
  }

  dispose(): void {
    this.collection.dispose();
  }
}

/**
 * Code Action provider — offers quick fixes for ORQESTA diagnostics.
 */
export class OrquestaCodeActionProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diag of context.diagnostics) {
      if (diag.source !== SOURCE) continue;

      if (diag.code === 'missing-flag') {
        // Action: refresh flags from Flagsmith
        const refresh = new vscode.CodeAction(
          'Refresh Flagsmith flags',
          vscode.CodeActionKind.QuickFix,
        );
        refresh.command = { command: 'orqesta.refreshFlags', title: 'Refresh Flagsmith flags' };
        refresh.diagnostics = [diag];
        actions.push(refresh);

        // Action: open safety findings
        const open = new vscode.CodeAction(
          'Open ORQESTA Safety Findings',
          vscode.CodeActionKind.QuickFix,
        );
        open.command = { command: 'orqesta.openSafetyFindings', title: 'Open Safety Findings' };
        open.diagnostics = [diag];
        actions.push(open);
      }

      if (diag.code === 'archived-flag') {
        const open = new vscode.CodeAction(
          'View archived flag in ORQESTA',
          vscode.CodeActionKind.QuickFix,
        );
        open.command = { command: 'orqesta.openSafetyFindings', title: 'Open Safety Findings' };
        open.diagnostics = [diag];
        actions.push(open);
      }
    }

    return actions;
  }
}
