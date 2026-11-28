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
exports.OverviewProvider = exports.OverviewItem = void 0;
const vscode = __importStar(require("vscode"));
class OverviewItem extends vscode.TreeItem {
    constructor(label, description, icon, collapsibleState = vscode.TreeItemCollapsibleState.None, command) {
        super(label, collapsibleState);
        this.description = description;
        this.iconPath = new vscode.ThemeIcon(icon);
        this.command = command;
    }
}
exports.OverviewItem = OverviewItem;
class OverviewProvider {
    constructor(state) {
        this.state = state;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        state.onStateChange(() => this._onDidChangeTreeData.fire(undefined));
    }
    getTreeItem(item) { return item; }
    getChildren() {
        const s = this.state.state;
        if (s.connection === 'connecting') {
            return [new OverviewItem('Connecting…', '', 'loading~spin')];
        }
        if (s.connection === 'error') {
            return [
                new OverviewItem('Connection failed', s.error ?? '', 'error'),
                new OverviewItem('Connect to Flagsmith', 'Click to configure', 'plug', undefined, {
                    command: 'orqesta.connect', title: 'Connect',
                }),
            ];
        }
        if (s.connection === 'disconnected') {
            return [
                new OverviewItem('Not connected', 'Configure your Orqesta server', 'circle-slash'),
                new OverviewItem('Connect to Flagsmith', 'Click to configure', 'plug', undefined, {
                    command: 'orqesta.connect', title: 'Connect',
                }),
            ];
        }
        // Connected
        const items = [
            new OverviewItem('Connected', s.maskedToken ?? '', 'check'),
            new OverviewItem('Server', s.serverUrl, 'server'),
        ];
        if (s.organisations) {
            const orgCount = s.organisations.length;
            const projectCount = s.organisations.flatMap((o) => o.projects).length;
            const envCount = s.organisations.flatMap((o) => o.projects).flatMap((p) => p.environments).length;
            items.push(new OverviewItem('Organisations', String(orgCount), 'organization'));
            items.push(new OverviewItem('Projects', String(projectCount), 'package'));
            items.push(new OverviewItem('Environments', String(envCount), 'layers'));
        }
        if (s.selectedProjectName) {
            items.push(new OverviewItem('Active project', s.selectedProjectName, 'project'));
        }
        if (s.selectedSourceEnv && s.selectedTargetEnv) {
            items.push(new OverviewItem('Comparing', `${s.selectedSourceEnv} → ${s.selectedTargetEnv}`, 'diff'));
        }
        return items;
    }
}
exports.OverviewProvider = OverviewProvider;
//# sourceMappingURL=overviewProvider.js.map