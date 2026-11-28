"use strict";
/**
 * Inline editor diagnostics for Flagsmith flag references.
 * Uses VS Code's native DiagnosticCollection API.
 *
 * Shows inline warnings/errors for:
 * - Missing flag: referenced in code but not in Flagsmith
 * - Archived flag: code references a flag marked as archived
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
exports.OrquestaCodeActionProvider = exports.DiagnosticsProvider = void 0;
const vscode = __importStar(require("vscode"));
const SOURCE = 'ORQESTA';
class DiagnosticsProvider {
    constructor(state) {
        this.state = state;
        this.collection = vscode.languages.createDiagnosticCollection('orqesta');
    }
    updateDiagnostics(scanResult, knownFlagNames, archivedFlagNames) {
        this.collection.clear();
        // Group references by file
        const byFile = new Map();
        for (const ref of scanResult.references) {
            const list = byFile.get(ref.filePath) ?? [];
            list.push(ref);
            byFile.set(ref.filePath, list);
        }
        for (const [filePath, refs] of byFile) {
            const diagnostics = [];
            for (const ref of refs) {
                if (ref.isDynamic)
                    continue; // skip — can't reliably diagnose dynamic refs
                const range = new vscode.Range(ref.line, ref.character, ref.line, ref.character + ref.flagName.length + 2);
                if (archivedFlagNames.has(ref.flagName)) {
                    const diag = new vscode.Diagnostic(range, `'${ref.flagName}' is an archived Flagsmith flag. Consider removing this reference.`, vscode.DiagnosticSeverity.Warning);
                    diag.source = SOURCE;
                    diag.code = 'archived-flag';
                    diag.tags = [vscode.DiagnosticTag.Deprecated];
                    diagnostics.push(diag);
                }
                else if (knownFlagNames.size > 0 && !knownFlagNames.has(ref.flagName)) {
                    const diag = new vscode.Diagnostic(range, `'${ref.flagName}' was not found in the selected Flagsmith environment. It may be missing or misspelled.`, vscode.DiagnosticSeverity.Warning);
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
    clear() {
        this.collection.clear();
    }
    dispose() {
        this.collection.dispose();
    }
}
exports.DiagnosticsProvider = DiagnosticsProvider;
/**
 * Code Action provider — offers quick fixes for ORQESTA diagnostics.
 */
class OrquestaCodeActionProvider {
    provideCodeActions(document, range, context) {
        const actions = [];
        for (const diag of context.diagnostics) {
            if (diag.source !== SOURCE)
                continue;
            if (diag.code === 'missing-flag') {
                // Action: refresh flags from Flagsmith
                const refresh = new vscode.CodeAction('Refresh Flagsmith flags', vscode.CodeActionKind.QuickFix);
                refresh.command = { command: 'orqesta.refreshFlags', title: 'Refresh Flagsmith flags' };
                refresh.diagnostics = [diag];
                actions.push(refresh);
                // Action: open safety findings
                const open = new vscode.CodeAction('Open ORQESTA Safety Findings', vscode.CodeActionKind.QuickFix);
                open.command = { command: 'orqesta.openSafetyFindings', title: 'Open Safety Findings' };
                open.diagnostics = [diag];
                actions.push(open);
            }
            if (diag.code === 'archived-flag') {
                const open = new vscode.CodeAction('View archived flag in ORQESTA', vscode.CodeActionKind.QuickFix);
                open.command = { command: 'orqesta.openSafetyFindings', title: 'Open Safety Findings' };
                open.diagnostics = [diag];
                actions.push(open);
            }
        }
        return actions;
    }
}
exports.OrquestaCodeActionProvider = OrquestaCodeActionProvider;
OrquestaCodeActionProvider.providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];
//# sourceMappingURL=diagnosticsProvider.js.map