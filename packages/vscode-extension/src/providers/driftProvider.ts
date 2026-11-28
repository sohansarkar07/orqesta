import * as vscode from 'vscode';
import { StateManager } from '../state';
import { DriftItem, DriftReport } from '../api/client';

const CATEGORY_LABEL: Record<string, string> = {
  enabled_state: 'Enabled state',
  value_change: 'Value change',
  multivariate_allocation: 'MV allocation',
  missing_in_target: 'Missing in target',
  missing_in_source: 'Extra in target',
};

const CATEGORY_ICON: Record<string, string> = {
  enabled_state: 'symbol-boolean',
  value_change: 'symbol-string',
  multivariate_allocation: 'graph',
  missing_in_target: 'diff-removed',
  missing_in_source: 'diff-added',
};

export class DriftTreeItem extends vscode.TreeItem {
  constructor(
    label: string,
    description: string,
    icon: string,
    iconColor?: vscode.ThemeColor,
    collapsible = vscode.TreeItemCollapsibleState.None,
    public readonly driftItem?: DriftItem,
  ) {
    super(label, collapsible);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon(icon, iconColor);
  }
}

export class DriftProvider implements vscode.TreeDataProvider<DriftTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<DriftTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private loading = false;
  private error: string | undefined;

  constructor(private readonly state: StateManager) {
    state.onStateChange(() => this._onDidChangeTreeData.fire(undefined));
  }

  refresh(): void { this._onDidChangeTreeData.fire(undefined); }
  getTreeItem(item: DriftTreeItem): vscode.TreeItem { return item; }

  getChildren(element?: DriftTreeItem): DriftTreeItem[] {
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
      const items: DriftTreeItem[] = [
        new DriftTreeItem(
          `${drift.source.environment} → ${drift.target.environment}`,
          `${drift.drifts.length} difference${drift.drifts.length !== 1 ? 's' : ''}`,
          drift.drifts.length > 0 ? 'warning' : 'check',
          drift.drifts.length > 0
            ? new vscode.ThemeColor('list.warningForeground')
            : new vscode.ThemeColor('testing.iconPassed'),
        ),
      ];

      if (drift.drifts.length === 0) {
        items.push(new DriftTreeItem('Environments in sync', '', 'check',
          new vscode.ThemeColor('testing.iconPassed')));
        return items;
      }

      // Group by category
      const byCategory = new Map<string, DriftItem[]>();
      for (const d of drift.drifts) {
        const list = byCategory.get(d.category) ?? [];
        list.push(d);
        byCategory.set(d.category, list);
      }

      for (const [cat, items_in_cat] of byCategory) {
        const catItem = new DriftTreeItem(
          CATEGORY_LABEL[cat] ?? cat,
          `${items_in_cat.length}`,
          CATEGORY_ICON[cat] ?? 'diff',
          new vscode.ThemeColor('list.warningForeground'),
          vscode.TreeItemCollapsibleState.Expanded,
        );
        (catItem as any)._category = cat;
        (catItem as any)._items = items_in_cat;
        items.push(catItem);
      }

      return items;
    }

    // Children of category node
    const categoryItems = (element as any)._items as DriftItem[] | undefined;
    if (!categoryItems) return [];

    return categoryItems.map((d) => {
      const item = new DriftTreeItem(
        d.feature,
        d.description,
        'symbol-field',
        undefined,
        vscode.TreeItemCollapsibleState.None,
        d,
      );
      item.tooltip = new vscode.MarkdownString(
        `**${d.feature}**\n\n${d.description}\n\n` +
        `Source: \`${JSON.stringify(d.sourceValue)}\`\n\n` +
        `Target: \`${JSON.stringify(d.targetValue)}\``,
      );
      return item;
    });
  }

  setLoading(loading: boolean): void {
    this.loading = loading;
    this.error = undefined;
    this._onDidChangeTreeData.fire(undefined);
  }

  setError(error: string): void {
    this.loading = false;
    this.error = error;
    this._onDidChangeTreeData.fire(undefined);
  }
}
