import * as vscode from 'vscode';
import { StateManager } from '../state';
import { SafetyFinding } from './safetyProvider';

export type ReleaseCheckStatus = 'pass' | 'warn' | 'fail' | 'pending' | 'skipped';

export interface ReleaseCheck {
  id: string;
  name: string;
  status: ReleaseCheckStatus;
  detail: string;
  findings?: SafetyFinding[];
}

export class ReleaseItem extends vscode.TreeItem {
  constructor(
    label: string,
    description: string,
    icon: string,
    iconColor?: vscode.ThemeColor,
    collapsible = vscode.TreeItemCollapsibleState.None,
    public readonly check?: ReleaseCheck,
  ) {
    super(label, collapsible);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon(icon, iconColor);
  }
}

export class ReleaseProvider implements vscode.TreeDataProvider<ReleaseItem> {
  private _onDidChange = new vscode.EventEmitter<ReleaseItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChange.event;
  private checks: ReleaseCheck[] = this.defaultChecks();

  constructor(private readonly state: StateManager) {
    state.onStateChange(() => this._onDidChange.fire(undefined));
  }

  private defaultChecks(): ReleaseCheck[] {
    return [
      { id: 'drift',    name: 'Environment Drift',  status: 'pending', detail: 'Not run yet' },
      { id: 'policy',   name: 'Policy Checks',       status: 'pending', detail: 'Not run yet' },
      { id: 'audience', name: 'Audience Guard',      status: 'pending', detail: 'Not run yet' },
      { id: 'identity', name: 'Identity Evaluation', status: 'pending', detail: 'Not run yet' },
      { id: 'code',     name: 'Code Intelligence',   status: 'pending', detail: 'Not run yet' },
    ];
  }

  updateCheck(id: string, status: ReleaseCheckStatus, detail: string, findings?: SafetyFinding[]): void {
    const check = this.checks.find((c) => c.id === id);
    if (check) { check.status = status; check.detail = detail; check.findings = findings; }
    this._onDidChange.fire(undefined);
  }

  reset(): void { this.checks = this.defaultChecks(); this._onDidChange.fire(undefined); }

  getOverallStatus(): ReleaseCheckStatus {
    if (this.checks.some((c) => c.status === 'fail')) return 'fail';
    if (this.checks.every((c) => c.status === 'pending')) return 'pending';
    if (this.checks.some((c) => c.status === 'warn')) return 'warn';
    if (this.checks.every((c) => c.status === 'pass' || c.status === 'skipped')) return 'pass';
    return 'pending';
  }

  refresh(): void { this._onDidChange.fire(undefined); }
  getTreeItem(item: ReleaseItem): vscode.TreeItem { return item; }

  getChildren(element?: ReleaseItem): ReleaseItem[] {
    const s = this.state.state;
    if (s.connection !== 'connected') {
      return [new ReleaseItem('Not connected', 'Connect to Flagsmith first', 'circle-slash')];
    }

    if (!element) {
      const overall = this.getOverallStatus();
      const statusMeta: Record<ReleaseCheckStatus, [string, string | undefined]> = {
        pass:    ['check',          'testing.iconPassed'],
        fail:    ['error',          'testing.iconFailed'],
        warn:    ['warning',        'list.warningForeground'],
        pending: ['circle-outline', undefined],
        skipped: ['circle-slash',   'list.deemphasizedForeground'],
      };

      const overallLabel =
        overall === 'pass'    ? 'Ready to release' :
        overall === 'fail'    ? 'Blocking issues found' :
        overall === 'warn'    ? 'Warnings — review before releasing' :
        'Run checks to assess release readiness';

      const [oIcon, oColor] = statusMeta[overall];
      const items: ReleaseItem[] = [
        new ReleaseItem(overallLabel, '', oIcon,
          oColor ? new vscode.ThemeColor(oColor) : undefined),
      ];

      for (const check of this.checks) {
        const [icon, color] = statusMeta[check.status];
        items.push(new ReleaseItem(
          check.name, check.detail, icon,
          color ? new vscode.ThemeColor(color) : undefined,
          check.findings?.length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
          check,
        ));
      }
      return items;
    }

    return (element.check?.findings ?? []).map((f) =>
      new ReleaseItem(f.flagName, f.message,
        f.severity === 'error' ? 'error' : 'warning',
        new vscode.ThemeColor(f.severity === 'error' ? 'list.errorForeground' : 'list.warningForeground'),
      ),
    );
  }
}
