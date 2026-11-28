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
exports.FlagsProvider = exports.FlagTreeItem = void 0;
const vscode = __importStar(require("vscode"));
class FlagTreeItem extends vscode.TreeItem {
    constructor(flagName, flagData, isCategory = false, label) {
        super(label ?? flagName, isCategory
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None);
        this.flagName = flagName;
        this.flagData = flagData;
        this.isCategory = isCategory;
        if (!isCategory && flagData) {
            this.contextValue = 'flagItem';
            this.description = flagData.enabled ? 'enabled' : 'disabled';
            this.iconPath = new vscode.ThemeIcon(flagData.isArchived ? 'archive' :
                flagData.type === 'MULTIVARIATE' ? 'symbol-enum' :
                    flagData.enabled ? 'symbol-boolean' : 'circle-slash', flagData.isArchived ? new vscode.ThemeColor('list.warningForeground') :
                flagData.enabled ? new vscode.ThemeColor('testing.iconPassed') :
                    new vscode.ThemeColor('list.deemphasizedForeground'));
            this.tooltip = new vscode.MarkdownString(`**${flagData.name}**\n\n` +
                `Type: ${flagData.type}\n\n` +
                `Status: ${flagData.enabled ? '✓ Enabled' : '✗ Disabled'}\n\n` +
                (flagData.isArchived ? '⚠ Archived\n\n' : '') +
                (flagData.description ? `Description: ${flagData.description}\n\n` : '') +
                (flagData.value !== null ? `Value: \`${JSON.stringify(flagData.value)}\`` : ''));
            this.command = {
                command: 'orqesta.showFlagDetail',
                title: 'Show Flag Detail',
                arguments: [flagData],
            };
        }
        else if (isCategory) {
            this.iconPath = new vscode.ThemeIcon('list-unordered');
        }
    }
}
exports.FlagTreeItem = FlagTreeItem;
class FlagsProvider {
    constructor(state) {
        this.state = state;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.flags = [];
        this.loading = false;
        this.searchQuery = '';
        state.onStateChange((s) => {
            if (s.connection === 'connected') {
                this.loadFlags();
            }
            else {
                this.flags = [];
                this._onDidChangeTreeData.fire(undefined);
            }
        });
    }
    refresh(scanResult) {
        if (scanResult)
            this.scanResult = scanResult;
        this._onDidChangeTreeData.fire(undefined);
    }
    setSearch(query) {
        this.searchQuery = query.toLowerCase();
        this._onDidChangeTreeData.fire(undefined);
    }
    async loadFlags() {
        const s = this.state.state;
        if (!s.selectedProjectId || !s.selectedSourceEnv)
            return;
        this.loading = true;
        this.error = undefined;
        this._onDidChangeTreeData.fire(undefined);
        try {
            // Get flag states via environments endpoint then featurestates
            const orgs = await this.state.client.getEnvironments();
            const allProjects = orgs.flatMap((o) => o.projects);
            const proj = allProjects.find((p) => p.id === s.selectedProjectId);
            if (!proj)
                return;
            // We collect flag metadata from the compare endpoint (it uses featurestates internally)
            // For pure flag listing we request the environments + build from drift data
            // This avoids adding a new endpoint — reuses /api/compare
            const sourceEnv = s.selectedSourceEnv ?? proj.environments[0]?.name;
            if (!sourceEnv)
                return;
            // Use a self-compare (source === target) trick to get all flags without drift
            // Actually better: use existing environments data which gives us flag names
            // We surface flags from the last drift report if available, or trigger a compare
            if (s.lastDrift) {
                const names = new Set([
                    ...s.lastDrift.drifts.map((d) => d.feature),
                ]);
                this.flags = [...names].map((name) => ({
                    id: 0,
                    name,
                    type: 'STANDARD',
                    enabled: true,
                    value: null,
                    isArchived: false,
                }));
            }
            this.loading = false;
            this._onDidChangeTreeData.fire(undefined);
        }
        catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to load flags';
            this.loading = false;
            this._onDidChangeTreeData.fire(undefined);
        }
    }
    async loadFlagsFromEnvironment(projectId, envName) {
        // Trigger a compare against self to surface all flag names
        // This is a lightweight approach using existing endpoints
        this.loading = true;
        this.error = undefined;
        this._onDidChangeTreeData.fire(undefined);
        try {
            const s = this.state.state;
            const proj = s.organisations?.flatMap((o) => o.projects).find((p) => p.id === projectId);
            if (!proj)
                return;
            const envs = proj.environments;
            if (envs.length < 2) {
                // Single environment — can't compare but we can still show it's loaded
                this.flags = [];
                this.loading = false;
                this._onDidChangeTreeData.fire(undefined);
                return;
            }
            // Compare source vs target to surface all flags
            const target = envs.find((e) => e.name !== envName) ?? envs[0];
            if (!target)
                return;
            const drift = await this.state.client.compare(projectId, envName, target.name);
            // Build flag list from drift + non-drift features
            const allFeatureNames = new Set();
            drift.drifts.forEach((d) => allFeatureNames.add(d.feature));
            this.flags = [...allFeatureNames].map((name) => {
                const drift_item = drift.drifts.find((d) => d.feature === name);
                return {
                    id: 0,
                    name,
                    type: 'STANDARD',
                    enabled: drift_item?.sourceValue === true || drift_item?.targetValue === true,
                    value: null,
                    isArchived: false,
                };
            });
            this.loading = false;
            this._onDidChangeTreeData.fire(undefined);
        }
        catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to load flags';
            this.loading = false;
            this._onDidChangeTreeData.fire(undefined);
        }
    }
    getTreeItem(item) { return item; }
    getChildren(element) {
        if (this.loading) {
            return [new FlagTreeItem('', null, false, 'Loading flags…')];
        }
        if (this.error) {
            return [new FlagTreeItem('', null, false, `Error: ${this.error}`)];
        }
        const s = this.state.state;
        if (s.connection !== 'connected') {
            return [new FlagTreeItem('', null, false, 'Connect to Flagsmith first')];
        }
        if (!element) {
            // Filter by search
            let filtered = this.flags;
            if (this.searchQuery) {
                filtered = filtered.filter((f) => f.name.toLowerCase().includes(this.searchQuery));
            }
            if (filtered.length === 0) {
                const msg = this.searchQuery
                    ? `No flags matching "${this.searchQuery}"`
                    : 'No flags found. Run a comparison first.';
                return [new FlagTreeItem('', null, false, msg)];
            }
            return filtered.map((f) => new FlagTreeItem(f.name, f));
        }
        return [];
    }
}
exports.FlagsProvider = FlagsProvider;
//# sourceMappingURL=flagsProvider.js.map