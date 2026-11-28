"use strict";
/**
 * All ORQESTA VS Code commands.
 * Each registered command has a real implementation.
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
exports.registerCommands = registerCommands;
const vscode = __importStar(require("vscode"));
const client_1 = require("../api/client");
function handleError(err, context) {
    const msg = err instanceof client_1.OrquestaApiError
        ? `${context}: ${err.message}${err.code ? ` (${err.code})` : ''}`
        : err instanceof Error
            ? `${context}: ${err.message}`
            : `${context}: Unknown error`;
    if (err instanceof client_1.OrquestaApiError && err.code === 'NOT_CONFIGURED') {
        vscode.window.showWarningMessage('ORQESTA: Not connected to Flagsmith. Connect first.', 'Connect').then((choice) => {
            if (choice === 'Connect')
                vscode.commands.executeCommand('orqesta.connect');
        });
        return;
    }
    vscode.window.showErrorMessage(msg);
}
function registerCommands(context, state, scanner, safetyProvider, driftProvider, releaseProvider, diagnosticsProvider, flagsProvider, overviewProvider) {
    // ─── orqesta.connect ────────────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('orqesta.connect', async () => {
        state.updateClient();
        const serverUrl = state.credentials.getServerUrl();
        // First check if server is reachable without credentials
        try {
            const health = await state.client.health();
            if (!health.ok)
                throw new Error('Server not healthy');
        }
        catch {
            const choice = await vscode.window.showWarningMessage(`Cannot reach Orqesta server at ${serverUrl}. Start the server first with: npm run server`, 'Open Settings');
            if (choice === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'orqesta.serverUrl');
            }
            return;
        }
        // Check current status
        const status = await state.client.getStatus();
        if (status.connected) {
            vscode.window.showInformationMessage(`ORQESTA: Already connected (${status.maskedKey})`);
            await state.checkConnection();
            return;
        }
        // Prompt for token — stored in SecretStorage, never in settings
        const token = await vscode.window.showInputBox({
            title: 'ORQESTA: Connect to Flagsmith',
            prompt: 'Enter your Flagsmith Organisation API token',
            placeHolder: 'Your token (will be stored securely)',
            password: true,
            validateInput: (v) => v.trim() ? undefined : 'Token must not be empty',
        });
        if (!token)
            return;
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'ORQESTA: Connecting…', cancellable: false }, async () => {
            try {
                await state.client.connect(token.trim());
                await state.credentials.storeToken(token.trim());
                await state.checkConnection();
                vscode.window.showInformationMessage('ORQESTA: Connected to Flagsmith');
            }
            catch (err) {
                handleError(err, 'Connection failed');
            }
        });
    }));
    // ─── orqesta.refreshFlags ───────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('orqesta.refreshFlags', async () => {
        await state.loadEnvironments();
        flagsProvider.refresh();
        vscode.window.showInformationMessage('ORQESTA: Flags refreshed');
    }));
    // ─── orqesta.scanWorkspace ──────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('orqesta.scanWorkspace', async () => {
        if (vscode.workspace.workspaceFolders?.length === 0) {
            vscode.window.showWarningMessage('ORQESTA: Open a workspace folder first.');
            return;
        }
        safetyProvider.setLoading(true);
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'ORQESTA: Scanning workspace…', cancellable: false }, async () => {
            try {
                const scanResult = await scanner.scanWorkspace();
                const s = state.state;
                const findings = [];
                // Build known flag names from last drift or environments
                const knownFlags = new Set();
                const archivedFlags = new Set();
                if (s.lastDrift) {
                    s.lastDrift.drifts.forEach((d) => knownFlags.add(d.feature));
                }
                // Find missing references (in code but not in Flagsmith)
                for (const ref of scanResult.references) {
                    if (!ref.isDynamic && knownFlags.size > 0 && !knownFlags.has(ref.flagName)) {
                        findings.push({
                            type: 'missing_in_flagsmith',
                            flagName: ref.flagName,
                            message: `Referenced in code but not found in Flagsmith`,
                            severity: 'warning',
                            filePath: ref.filePath,
                            line: ref.line,
                        });
                    }
                }
                // Update diagnostics
                diagnosticsProvider.updateDiagnostics(scanResult, knownFlags, archivedFlags);
                safetyProvider.updateFindings(findings, scanResult);
                releaseProvider.updateCheck('code', findings.length > 0 ? 'warn' : 'pass', findings.length > 0
                    ? `${findings.length} issue${findings.length !== 1 ? 's' : ''} found in ${scanResult.filesScanned} files`
                    : `Clean — ${scanResult.filesScanned} files scanned`, findings);
                const msg = findings.length > 0
                    ? `Found ${findings.length} issue${findings.length !== 1 ? 's' : ''} in ${scanResult.filesScanned} files`
                    : `Scan complete — ${scanResult.filesScanned} files, no issues`;
                vscode.window.showInformationMessage(`ORQESTA: ${msg}`);
            }
            catch (err) {
                safetyProvider.setLoading(false);
                handleError(err, 'Scan failed');
            }
        });
    }));
    // ─── orqesta.compareEnvironments ───────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('orqesta.compareEnvironments', async () => {
        const s = state.state;
        if (s.connection !== 'connected') {
            vscode.commands.executeCommand('orqesta.connect');
            return;
        }
        const orgs = s.organisations ?? [];
        const projects = orgs.flatMap((o) => o.projects);
        if (projects.length === 0) {
            vscode.window.showWarningMessage('ORQESTA: No projects found. Check your connection.');
            return;
        }
        // Pick project
        let projectId = s.selectedProjectId;
        let projectName = s.selectedProjectName;
        if (!projectId) {
            const pick = await vscode.window.showQuickPick(projects.map((p) => ({ label: p.name, description: `id: ${p.id}`, id: p.id })), { title: 'ORQESTA: Select project' });
            if (!pick)
                return;
            projectId = pick.id;
            projectName = pick.label;
            state.update({ selectedProjectId: projectId, selectedProjectName: projectName });
        }
        const project = projects.find((p) => p.id === projectId);
        if (!project || project.environments.length < 2) {
            vscode.window.showWarningMessage('ORQESTA: Project needs at least 2 environments.');
            return;
        }
        const envNames = project.environments.map((e) => e.name);
        // Pick source
        const sourcePick = await vscode.window.showQuickPick(envNames.map((n) => ({ label: n })), { title: 'ORQESTA: Select source environment (reference)' });
        if (!sourcePick)
            return;
        // Pick target (exclude source)
        const targetPick = await vscode.window.showQuickPick(envNames.filter((n) => n !== sourcePick.label).map((n) => ({ label: n })), { title: 'ORQESTA: Select target environment (compare to)' });
        if (!targetPick)
            return;
        state.update({ selectedSourceEnv: sourcePick.label, selectedTargetEnv: targetPick.label });
        driftProvider.setLoading(true);
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `ORQESTA: Comparing ${sourcePick.label} → ${targetPick.label}…`, cancellable: false }, async () => {
            try {
                const drift = await state.client.compare(projectId, sourcePick.label, targetPick.label);
                state.update({ lastDrift: drift });
                driftProvider.refresh();
                releaseProvider.updateCheck('drift', drift.drifts.length > 0 ? 'warn' : 'pass', drift.drifts.length > 0
                    ? `${drift.drifts.length} difference${drift.drifts.length !== 1 ? 's' : ''} detected`
                    : 'Environments in sync');
                vscode.window.showInformationMessage(`ORQESTA: ${drift.drifts.length > 0 ? `${drift.drifts.length} differences found` : 'Environments are in sync'}`);
            }
            catch (err) {
                driftProvider.setError(err instanceof Error ? err.message : String(err));
                handleError(err, 'Comparison failed');
            }
        });
    }));
    // ─── orqesta.runPolicyCheck ─────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('orqesta.runPolicyCheck', async () => {
        const s = state.state;
        if (s.connection !== 'connected') {
            vscode.commands.executeCommand('orqesta.connect');
            return;
        }
        const projectId = s.selectedProjectId;
        const envName = s.selectedSourceEnv ?? s.selectedTargetEnv;
        if (!projectId || !envName) {
            vscode.window.showWarningMessage('ORQESTA: Run a comparison first to select environments.');
            return;
        }
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `ORQESTA: Running policy checks on ${envName}…`, cancellable: false }, async () => {
            try {
                const result = await state.client.runPolicy(projectId, envName);
                state.update({ lastPolicy: result });
                const findings = result.violations.map((v) => ({
                    type: v.severity === 'error' ? 'policy_error' : 'policy_warning',
                    flagName: v.feature,
                    message: `[${v.ruleId}] ${v.message}`,
                    severity: v.severity,
                }));
                releaseProvider.updateCheck('policy', result.errors > 0 ? 'fail' : result.warnings > 0 ? 'warn' : 'pass', `${result.errors} error${result.errors !== 1 ? 's' : ''}, ${result.warnings} warning${result.warnings !== 1 ? 's' : ''}, ${result.passed} passed`, findings);
                vscode.window.showInformationMessage(`ORQESTA Policy: ${result.errors} error${result.errors !== 1 ? 's' : ''}, ${result.warnings} warning${result.warnings !== 1 ? 's' : ''}, ${result.passed} passed`);
            }
            catch (err) {
                handleError(err, 'Policy check failed');
            }
        });
    }));
    // ─── orqesta.runAudienceGuard ────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('orqesta.runAudienceGuard', async () => {
        const s = state.state;
        if (s.connection !== 'connected') {
            vscode.commands.executeCommand('orqesta.connect');
            return;
        }
        if (!s.selectedProjectId || !s.selectedSourceEnv || !s.selectedTargetEnv) {
            vscode.window.showWarningMessage('ORQESTA: Run Compare Environments first.');
            return;
        }
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'ORQESTA: Running audience guard…', cancellable: false }, async () => {
            try {
                const report = await state.client.runAudienceGuard(s.selectedProjectId, s.selectedSourceEnv, s.selectedTargetEnv);
                state.update({ lastAudienceGuard: report });
                releaseProvider.updateCheck('audience', report.summary.critical > 0 ? 'fail' : report.summary.warning > 0 ? 'warn' : 'pass', report.flagsChecked === 0
                    ? 'No MV flags found'
                    : `${report.summary.total} regression${report.summary.total !== 1 ? 's' : ''} in ${report.flagsChecked} MV flag${report.flagsChecked !== 1 ? 's' : ''}`);
                vscode.window.showInformationMessage(`ORQESTA Audience Guard: ${report.summary.total} regression${report.summary.total !== 1 ? 's' : ''} (${report.flagsChecked} MV flags checked)`);
            }
            catch (err) {
                handleError(err, 'Audience guard failed');
            }
        });
    }));
    // ─── orqesta.evaluateIdentities ─────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('orqesta.evaluateIdentities', async () => {
        const s = state.state;
        if (s.connection !== 'connected') {
            vscode.commands.executeCommand('orqesta.connect');
            return;
        }
        if (!s.selectedProjectId || !s.selectedSourceEnv || !s.selectedTargetEnv) {
            vscode.window.showWarningMessage('ORQESTA: Run Compare Environments first.');
            return;
        }
        // Look for fixture files in the workspace
        const fixtureFiles = await vscode.workspace.findFiles('**/{orqesta-identities,identities}.{yml,yaml,json}', '**/node_modules/**', 5);
        let identities = [
            { identifier: 'user_standard', traits: [] },
            { identifier: 'user_premium', traits: [{ key: 'plan', value: 'premium' }] },
        ];
        if (fixtureFiles.length > 0) {
            const pick = await vscode.window.showQuickPick([
                { label: 'Use default identities (2)', description: 'user_standard, user_premium' },
                ...fixtureFiles.map((f) => ({
                    label: vscode.workspace.asRelativePath(f),
                    description: 'From workspace file',
                    uri: f,
                })),
            ], { title: 'ORQESTA: Select identity fixtures' });
            if (!pick)
                return;
        }
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'ORQESTA: Evaluating identities…', cancellable: false }, async () => {
            try {
                const report = await state.client.evaluateIdentities(s.selectedProjectId, s.selectedSourceEnv, s.selectedTargetEnv, identities);
                state.update({ lastEvalReport: report });
                releaseProvider.updateCheck('identity', report.summary.critical > 0 ? 'fail' : report.summary.warning > 0 ? 'warn' : 'pass', `${report.totalRegressions} regression${report.totalRegressions !== 1 ? 's' : ''} across ${report.identitiesEvaluated} identit${report.identitiesEvaluated !== 1 ? 'ies' : 'y'}`);
                vscode.window.showInformationMessage(`ORQESTA Identity Eval: ${report.totalRegressions} regression${report.totalRegressions !== 1 ? 's' : ''} (${report.summary.critical} critical, ${report.summary.warning} warning)`);
            }
            catch (err) {
                handleError(err, 'Identity evaluation failed');
            }
        });
    }));
    // ─── orqesta.reviewSyncPlan ──────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('orqesta.reviewSyncPlan', async () => {
        const s = state.state;
        if (s.connection !== 'connected') {
            vscode.commands.executeCommand('orqesta.connect');
            return;
        }
        if (!s.selectedProjectId || !s.selectedSourceEnv || !s.selectedTargetEnv) {
            vscode.window.showWarningMessage('ORQESTA: Run Compare Environments first.');
            return;
        }
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'ORQESTA: Generating sync plan…', cancellable: false }, async () => {
            try {
                const result = await state.client.createSyncPlan(s.selectedProjectId, s.selectedSourceEnv, s.selectedTargetEnv);
                if ('noDrift' in result) {
                    vscode.window.showInformationMessage('ORQESTA: Environments are already in sync. No plan needed.');
                    return;
                }
                const { plan, planId } = result;
                const ops = plan.operations;
                // Show plan in a quick pick for review
                const opItems = ops.map((op) => ({
                    label: `$(${op.type === 'enable' ? 'check' : op.type === 'disable' ? 'circle-slash' : 'edit'}) ${op.feature}`,
                    description: op.type,
                    detail: op.description,
                    picked: true,
                    opId: op.id,
                }));
                const selected = await vscode.window.showQuickPick(opItems, {
                    title: `ORQESTA: Sync Plan — ${plan.source.environment} → ${plan.target.environment}`,
                    placeHolder: 'Select operations to apply (all selected by default)',
                    canPickMany: true,
                });
                if (!selected || selected.length === 0) {
                    vscode.window.showInformationMessage('ORQESTA: Sync cancelled.');
                    return;
                }
                // Dry-run first
                const dryRunChoice = await vscode.window.showInformationMessage(`ORQESTA: Apply ${selected.length} operation${selected.length !== 1 ? 's' : ''}?`, { modal: true }, 'Dry-run first', 'Apply now', 'Cancel');
                if (!dryRunChoice || dryRunChoice === 'Cancel')
                    return;
                const dryRun = dryRunChoice === 'Dry-run first';
                const selectedIds = selected.map((s) => s.opId);
                await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: dryRun ? 'ORQESTA: Previewing…' : 'ORQESTA: Applying…', cancellable: false }, async () => {
                    try {
                        const applyResult = await state.client.applySyncPlan(planId, dryRun);
                        const msg = dryRun
                            ? `Dry-run complete — ${selected.length} operation${selected.length !== 1 ? 's' : ''} previewed, nothing written`
                            : `Applied ${selected.length} operation${selected.length !== 1 ? 's' : ''}`;
                        vscode.window.showInformationMessage(`ORQESTA: ${msg}`);
                    }
                    catch (err) {
                        handleError(err, 'Sync failed');
                    }
                });
            }
            catch (err) {
                handleError(err, 'Plan generation failed');
            }
        });
    }));
    // ─── orqesta.openSafetyFindings ──────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('orqesta.openSafetyFindings', () => {
        vscode.commands.executeCommand('orqesta.safety.focus');
    }));
    // ─── orqesta.openReleaseReadiness ────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('orqesta.openReleaseReadiness', () => {
        vscode.commands.executeCommand('orqesta.release.focus');
    }));
    // ─── orqesta.openDashboard ───────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('orqesta.openDashboard', () => {
        const serverUrl = state.credentials.getServerUrl().replace(':3001', ':5173');
        vscode.env.openExternal(vscode.Uri.parse(serverUrl));
    }));
    // ─── orqesta.refreshView ────────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('orqesta.refreshView', () => {
        state.checkConnection();
    }));
    // ─── orqesta.copyFlagName ───────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('orqesta.copyFlagName', async (item) => {
        if (item?.flagName) {
            await vscode.env.clipboard.writeText(item.flagName);
            vscode.window.showInformationMessage(`ORQESTA: Copied '${item.flagName}'`);
        }
    }));
}
//# sourceMappingURL=index.js.map