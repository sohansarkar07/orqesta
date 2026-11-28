import * as vscode from 'vscode';
import { StateManager } from '../state';
import { FlagReference, ScanResult } from '../scanner/flagScanner';

export class SafetyItem extends vscode.TreeItem {
  constructor(
    label: string,
    description: string,
    icon: string,
    iconColor?: vscode.ThemeColor,
    collapsible = vscode.TreeItemCollapsibleState.None,
    public readonly data?: unknown,
  ) {
    super(label, collapsible);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon(icon, iconColor);
  }
}

export interface SafetyFinding {
  type: 'missing_in_flagsmith' | 'unused_in_code' | 'archived' | 'policy_error' | 'policy_warning' | 'drift';
  flagName: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  filePath?: string;
  line?: number;
}

export class SafetyProvider implements vscode.TreeDataProvider<SafetyItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SafetyItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private findings: SafetyFinding[] = [];
  private scanResult: ScanResult | undefined;
  private loading = false;

  constructor(private readonly state: StateManager) {
    state.onStateChange(() => this._onDidChangeTreeData.fire(undefined));
  }

  updateFindings(findings: SafetyFinding[], scanResult?: ScanResult): void {
    this.findings = findings;
    if (scanResult) this.scanResult = scanResult;
    this.loading = false;
    this._onDidChangeTreeData.fire(undefined);
  }

  setLoading(loading: boolean): void {
    this.loading = loading;
    this._onDidChangeTreeData.fire(undefined);
  }

  refresh(): void { this._onDidChangeTreeData.fire(undefined); }
  getTreeItem(item: SafetyItem): vscode.TreeItem { return item; }

  getChildren(element?: SafetyItem): SafetyItem[] {
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
          new SafetyItem('Scan workspace', 'Detect missing/unused flags', 'search', undefined,
            undefined, { command: 'orqesta.scanWorkspace' }),
        ];
      }

      const errors = this.findings.filter((f) => f.severity === 'error');
      const warnings = this.findings.filter((f) => f.severity === 'warning');
      const infos = this.findings.filter((f) => f.severity === 'info');

      const items: SafetyItem[] = [];

      if (errors.length > 0) {
        const group = new SafetyItem(
          'Errors', `${errors.length}`, 'error',
          new vscode.ThemeColor('list.errorForeground'),
          vscode.TreeItemCollapsibleState.Expanded,
        );
        (group as any)._items = errors;
        items.push(group);
      }

      if (warnings.length > 0) {
        const group = new SafetyItem(
          'Warnings', `${warnings.length}`, 'warning',
          new vscode.ThemeColor('list.warningForeground'),
          vscode.TreeItemCollapsibleState.Expanded,
        );
        (group as any)._items = warnings;
        items.push(group);
      }

      if (infos.length > 0) {
        const group = new SafetyItem(
          'Info', `${infos.length}`, 'info',
          undefined, vscode.TreeItemCollapsibleState.Collapsed,
        );
        (group as any)._items = infos;
        items.push(group);
      }

      if (this.findings.length === 0) {
        items.push(new SafetyItem(
          'No findings', 'All checks passed',
          'check', new vscode.ThemeColor('testing.iconPassed'),
        ));
      }

      if (this.scanResult) {
        items.push(new SafetyItem(
          `${this.scanResult.filesScanned} files scanned`,
          new Date(this.scanResult.scannedAt).toLocaleTimeString(),
          'file-code',
        ));
        if (this.scanResult.hasDynamicReferences) {
          items.push(new SafetyItem(
            'Dynamic references detected',
            'Some flags may be used dynamically',
            'warning',
            new vscode.ThemeColor('list.warningForeground'),
          ));
        }
      }

      return items;
    }

    // Children of group
    const groupItems = (element as any)._items as SafetyFinding[] | undefined;
    if (!groupItems) return [];

    return groupItems.map((f) => {
      const icon = f.severity === 'error' ? 'error' : f.severity === 'warning' ? 'warning' : 'info';
      const item = new SafetyItem(
        f.flagName,
        f.message,
        icon,
        f.severity === 'error'
          ? new vscode.ThemeColor('list.errorForeground')
          : f.severity === 'warning'
            ? new vscode.ThemeColor('list.warningForeground')
            : undefined,
        vscode.TreeItemCollapsibleState.None,
        f,
      );
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
