"use strict";
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
exports.SafetyProvider = exports.SafetyItem = void 0;
const vscode = __importStar(require("vscode"));
class SafetyItem extends vscode.TreeItem {
    constructor(label, description, icon, iconColor, collapsible = vscode.TreeItemCollapsibleState.None, data) {
        super(label, collapsible);
        this.data = data;
        this.description = description;
        this.iconPath = new vscode.ThemeIcon(icon, iconColor);
    }
}
exports.SafetyItem = SafetyItem;
class SafetyProvider {
    constructor(state) {
        this.state = state;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.findings = [];
        this.loading = false;
        state.onStateChange(() => this._onDidChangeTreeData.fire(undefined));
    }
    updateFindings(findings, scanResult) {
        this.findings = findings;
        if (scanResult)
            this.scanResult = scanResult;
        this.loading = false;
        this._onDidChangeTreeData.fire(undefined);
    }
    setLoading(loading) {
        this.loading = loading;
        this._onDidChangeTreeData.fire(undefined);
    }
    refresh() { this._onDidChangeTreeData.fire(undefined); }
    getTreeItem(item) { return item; }
    getChildren(element) {
        const s = this.state.state;
        if (s.connection !== 'connected') {
            return [new SafetyItem('Not connected', 'Connect to Flagsmith first', 'circle-slash')];
        }
        if (this.loading) {
            return [new SafetyItem('Scanning…', '', 'loading~spin')];
        }
        if (!element) {
            if (this.findings.length === 0 && !this.scanResult) {
                return [
                    new SafetyItem('No scan run yet', 'Run workspace scan or policy check', 'info'),
                    new SafetyItem('Scan workspace', 'Detect missing/unused flags', 'search', undefined, undefined, { command: 'orqesta.scanWorkspace' }),
                ];
            }
            const errors = this.findings.filter((f) => f.severity === 'error');
            const warnings = this.findings.filter((f) => f.severity === 'warning');
            const infos = this.findings.filter((f) => f.severity === 'info');
            const items = [];
            if (errors.length > 0) {
                const group = new SafetyItem('Errors', `${errors.length}`, 'error', new vscode.ThemeColor('list.errorForeground'), vscode.TreeItemCollapsibleState.Expanded);
                group._items = errors;
                items.push(group);
            }
            if (warnings.length > 0) {
                const group = new SafetyItem('Warnings', `${warnings.length}`, 'warning', new vscode.ThemeColor('list.warningForeground'), vscode.TreeItemCollapsibleState.Expanded);
                group._items = warnings;
                items.push(group);
            }
            if (infos.length > 0) {
                const group = new SafetyItem('Info', `${infos.length}`, 'info', undefined, vscode.TreeItemCollapsibleState.Collapsed);
                group._items = infos;
                items.push(group);
            }
            if (this.findings.length === 0) {
                items.push(new SafetyItem('No findings', 'All checks passed', 'check', new vscode.ThemeColor('testing.iconPassed')));
            }
            if (this.scanResult) {
                items.push(new SafetyItem(`${this.scanResult.filesScanned} files scanned`, new Date(this.scanResult.scannedAt).toLocaleTimeString(), 'file-code'));
                if (this.scanResult.hasDynamicReferences) {
                    items.push(new SafetyItem('Dynamic references detected', 'Some flags may be used dynamically', 'warning', new vscode.ThemeColor('list.warningForeground')));
                }
            }
            return items;
        }
        // Children of group
        const groupItems = element._items;
        if (!groupItems)
            return [];
        return groupItems.map((f) => {
            const icon = f.severity === 'error' ? 'error' : f.severity === 'warning' ? 'warning' : 'info';
            const item = new SafetyItem(f.flagName, f.message, icon, f.severity === 'error'
                ? new vscode.ThemeColor('list.errorForeground')
                : f.severity === 'warning'
                    ? new vscode.ThemeColor('list.warningForeground')
                    : undefined, vscode.TreeItemCollapsibleState.None, f);
            if (f.filePath) {
                item.resourceUri = vscode.Uri.file(f.filePath);
                item.command = {
                    command: 'vscode.open',
                    title: 'Open file',
                    arguments: [
                        vscode.Uri.file(f.filePath),
                        { selection: new vscode.Range(f.line ?? 0, 0, f.line ?? 0, 0) },
                    ],
                };
            }
            return item;
        });
    }
}
exports.SafetyProvider = SafetyProvider;
//# sourceMappingURL=safetyProvider.js.map