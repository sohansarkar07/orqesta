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
exports.DriftProvider = exports.DriftTreeItem = void 0;
const vscode = __importStar(require("vscode"));
const CATEGORY_LABEL = {
    enabled_state: 'Enabled state',
    value_change: 'Value change',
    multivariate_allocation: 'MV allocation',
    missing_in_target: 'Missing in target',
    missing_in_source: 'Extra in target',
};
const CATEGORY_ICON = {
    enabled_state: 'symbol-boolean',
    value_change: 'symbol-string',
    multivariate_allocation: 'graph',
    missing_in_target: 'diff-removed',
    missing_in_source: 'diff-added',
};
class DriftTreeItem extends vscode.TreeItem {
    constructor(label, description, icon, iconColor, collapsible = vscode.TreeItemCollapsibleState.None, driftItem) {
        super(label, collapsible);
        this.driftItem = driftItem;
        this.description = description;
        this.iconPath = new vscode.ThemeIcon(icon, iconColor);
    }
}
exports.DriftTreeItem = DriftTreeItem;
class DriftProvider {
    constructor(state) {
        this.state = state;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.loading = false;
        state.onStateChange(() => this._onDidChangeTreeData.fire(undefined));
    }
    refresh() { this._onDidChangeTreeData.fire(undefined); }
    getTreeItem(item) { return item; }
    getChildren(element) {
        const s = this.state.state;
        if (s.connection !== 'connected') {
            return [new DriftTreeItem('Not connected', 'Connect to Flagsmith first', 'circle-slash')];
        }
        if (this.loading) {
            return [new DriftTreeItem('Running comparison…', '', 'loading~spin')];
        }
        if (this.error) {
            return [new DriftTreeItem('Comparison failed', this.error, 'error')];
        }
        const drift = s.lastDrift;
        if (!drift) {
            return [
                new DriftTreeItem('No comparison run yet', '', 'diff'),
                new DriftTreeItem('Compare environments', 'Click to run', 'play', undefined, undefined),
            ];
        }
        if (!element) {
            // Top level: summary + category groups
            const items = [
                new DriftTreeItem(`${drift.source.environment} → ${drift.target.environment}`, `${drift.drifts.length} difference${drift.drifts.length !== 1 ? 's' : ''}`, drift.drifts.length > 0 ? 'warning' : 'check', drift.drifts.length > 0
                    ? new vscode.ThemeColor('list.warningForeground')
                    : new vscode.ThemeColor('testing.iconPassed')),
            ];
            if (drift.drifts.length === 0) {
                items.push(new DriftTreeItem('Environments in sync', '', 'check', new vscode.ThemeColor('testing.iconPassed')));
                return items;
            }
            // Group by category
            const byCategory = new Map();
            for (const d of drift.drifts) {
                const list = byCategory.get(d.category) ?? [];
                list.push(d);
                byCategory.set(d.category, list);
            }
            for (const [cat, items_in_cat] of byCategory) {
                const catItem = new DriftTreeItem(CATEGORY_LABEL[cat] ?? cat, `${items_in_cat.length}`, CATEGORY_ICON[cat] ?? 'diff', new vscode.ThemeColor('list.warningForeground'), vscode.TreeItemCollapsibleState.Expanded);
                catItem._category = cat;
                catItem._items = items_in_cat;
                items.push(catItem);
            }
            return items;
        }
        // Children of category node
        const categoryItems = element._items;
        if (!categoryItems)
            return [];
        return categoryItems.map((d) => {
            const item = new DriftTreeItem(d.feature, d.description, 'symbol-field', undefined, vscode.TreeItemCollapsibleState.None, d);
            item.tooltip = new vscode.MarkdownString(`**${d.feature}**\n\n${d.description}\n\n` +
                `Source: \`${JSON.stringify(d.sourceValue)}\`\n\n` +
                `Target: \`${JSON.stringify(d.targetValue)}\``);
            return item;
        });
    }
    setLoading(loading) {
        this.loading = loading;
        this.error = undefined;
        this._onDidChangeTreeData.fire(undefined);
    }
    setError(error) {
        this.loading = false;
        this.error = error;
        this._onDidChangeTreeData.fire(undefined);
    }
}
exports.DriftProvider = DriftProvider;
//# sourceMappingURL=driftProvider.js.map