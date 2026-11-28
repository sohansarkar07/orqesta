import * as vscode from 'vscode';
import { StateManager, OrquestaState } from '../state';

export class OverviewItem extends vscode.TreeItem {
  constructor(
    label: string,
    description: string,
    icon: string,
    collapsibleState = vscode.TreeItemCollapsibleState.None,
    command?: vscode.Command,
  ) {
    super(label, collapsibleState);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon(icon);
    this.command = command;
  }
}

export class OverviewProvider implements vscode.TreeDataProvider<OverviewItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<OverviewItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly state: StateManager) {
    state.onStateChange(() => this._onDidChangeTreeData.fire(undefined));
  }

  getTreeItem(item: OverviewItem): vscode.TreeItem { return item; }

  getChildren(): OverviewItem[] {
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
    const items: OverviewItem[] = [
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
