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
exports.ReleaseProvider = exports.ReleaseItem = void 0;
const vscode = __importStar(require("vscode"));
class ReleaseItem extends vscode.TreeItem {
    constructor(label, description, icon, iconColor, collapsible = vscode.TreeItemCollapsibleState.None, check) {
        super(label, collapsible);
        this.check = check;
        this.description = description;
        this.iconPath = new vscode.ThemeIcon(icon, iconColor);
    }
}
exports.ReleaseItem = ReleaseItem;
class ReleaseProvider {
    constructor(state) {
        this.state = state;
        this._onDidChange = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChange.event;
        this.checks = this.defaultChecks();
        state.onStateChange(() => this._onDidChange.fire(undefined));
    }
    defaultChecks() {
        return [
            { id: 'drift', name: 'Environment Drift', status: 'pending', detail: 'Not run yet' },
            { id: 'policy', name: 'Policy Checks', status: 'pending', detail: 'Not run yet' },
            { id: 'audience', name: 'Audience Guard', status: 'pending', detail: 'Not run yet' },
            { id: 'identity', name: 'Identity Evaluation', status: 'pending', detail: 'Not run yet' },
            { id: 'code', name: 'Code Intelligence', status: 'pending', detail: 'Not run yet' },
        ];
    }
    updateCheck(id, status, detail, findings) {
        const check = this.checks.find((c) => c.id === id);
        if (check) {
            check.status = status;
            check.detail = detail;
            check.findings = findings;
        }
        this._onDidChange.fire(undefined);
    }
    reset() { this.checks = this.defaultChecks(); this._onDidChange.fire(undefined); }
    getOverallStatus() {
        if (this.checks.some((c) => c.status === 'fail'))
            return 'fail';
        if (this.checks.every((c) => c.status === 'pending'))
            return 'pending';
        if (this.checks.some((c) => c.status === 'warn'))
            return 'warn';
        if (this.checks.every((c) => c.status === 'pass' || c.status === 'skipped'))
            return 'pass';
        return 'pending';
    }
    refresh() { this._onDidChange.fire(undefined); }
    getTreeItem(item) { return item; }
    getChildren(element) {
        const s = this.state.state;
        if (s.connection !== 'connected') {
            return [new ReleaseItem('Not connected', 'Connect to Flagsmith first', 'circle-slash')];
        }
        if (!element) {
            const overall = this.getOverallStatus();
            const statusMeta = {
                pass: ['check', 'testing.iconPassed'],
                fail: ['error', 'testing.iconFailed'],
                warn: ['warning', 'list.warningForeground'],
                pending: ['circle-outline', undefined],
                skipped: ['circle-slash', 'list.deemphasizedForeground'],
            };
            const overallLabel = overall === 'pass' ? 'Ready to release' :
                overall === 'fail' ? 'Blocking issues found' :
                    overall === 'warn' ? 'Warnings — review before releasing' :
                        'Run checks to assess release readiness';
            const [oIcon, oColor] = statusMeta[overall];
            const items = [
                new ReleaseItem(overallLabel, '', oIcon, oColor ? new vscode.ThemeColor(oColor) : undefined),
            ];
            for (const check of this.checks) {
                const [icon, color] = statusMeta[check.status];
                items.push(new ReleaseItem(check.name, check.detail, icon, color ? new vscode.ThemeColor(color) : undefined, check.findings?.length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, check));
            }
            return items;
        }
        return (element.check?.findings ?? []).map((f) => new ReleaseItem(f.flagName, f.message, f.severity === 'error' ? 'error' : 'warning', new vscode.ThemeColor(f.severity === 'error' ? 'list.errorForeground' : 'list.warningForeground')));
    }
}
exports.ReleaseProvider = ReleaseProvider;
//# sourceMappingURL=releaseProvider.js.map