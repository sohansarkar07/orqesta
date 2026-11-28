# ORQESTA — Configuration Safety for Flagsmith

A native VS Code extension that brings Orqesta's Flagsmith safety tools directly into your editor.

**Browse feature flags, detect missing references, compare environments, evaluate identity regressions, enforce policy, and review release readiness — all without leaving VS Code.**

---

## Prerequisites

1. **Orqesta API server** running (`npm run server` in the orqesta repo) — default: `http://localhost:3001`
2. **Flagsmith** account (Cloud or self-hosted)
3. A Flagsmith **Organisation API token**

---

## Setup

1. Install the extension (`.vsix` file)
2. Click the ORQESTA icon in the Activity Bar (or run `ORQESTA: Connect to Flagsmith`)
3. Enter your Flagsmith Organisation API token when prompted
4. Your token is stored securely in VS Code SecretStorage — never in settings files

### Configure server URL

If your Orqesta server runs on a different port or host:

```
Settings → ORQESTA → Server URL
```

Default: `http://localhost:3001`

### Self-hosted Flagsmith

The Orqesta server handles all Flagsmith communication. Set the server URL in Orqesta settings — the extension connects to Orqesta, not Flagsmith directly.

---

## Features

### Activity Bar

Six views in the ORQESTA Activity Bar panel:

| View | Purpose |
|---|---|
| **Overview** | Connection status, org/project/environment summary |
| **Feature Flags** | Browse and search real Flagsmith flags |
| **Code Intelligence** | Missing, unused, and archived flag findings |
| **Environment Drift** | Categorised diff between two environments |
| **Safety Findings** | Aggregated issues from all checks |
| **Release Readiness** | Consolidated pass/warn/fail per check |

### Code Intelligence (workspace scanner)

Scans your TypeScript/JavaScript workspace for Flagsmith SDK usage patterns.

**Supported patterns:**
- `flagsmith.isFeatureEnabled('flag_name')`
- `flagsmith.getValue('flag_name')`
- `flagsmith.hasFeature('flag_name')`
- `client.isFeatureEnabled('flag_name')`
- `client.getValue('flag_name')`
- `isFeatureEnabled('flag_name')` (bare call)

**Detects:**
- Flags referenced in code but not found in Flagsmith
- Flags in Flagsmith not referenced in scanned code
- Code referencing archived flags

**Limitations:**
- Only static string literals are detected. Dynamic references (variables, template literals) are noted but not resolved.
- When dynamic references are detected, unused-flag analysis is disabled (conservative).
- Test files may reference flags only in test context — review unused findings manually.

### Inline Diagnostics

Yellow squiggles on flag references that are:
- Missing in the selected Flagsmith environment
- Referencing archived flags

Hover for explanation. Right-click for quick actions.

### Environment Drift

Runs the Orqesta comparison engine against two real environments. Results grouped by category: enabled state, value change, MV allocation, missing.

### Identity Regression

Evaluates synthetic user identities against two environments. Uses existing fixture files (`orqesta-identities.yml`) from your workspace if present.

Classifications: `ENABLEMENT_REGRESSION`, `VALUE_CHANGE`, `VARIANT_CHANGE`, `MISSING_FEATURE`.

> **Note:** This evaluates synthetic identities only — not actual production users.

### Policy Check

Runs existing Orqesta policy rules: naming convention, descriptions, archived flags, MV allocations, environment parity. Findings shown in Release Readiness.

### Release Readiness

Aggregates results from all checks. A READY state only displays when configured checks have actually passed — not based on an arbitrary score.

### Safe Sync Review

Generates a sync plan, shows all proposed operations, allows selective approval, and runs dry-run before any real write to Flagsmith.

---

## Commands

| Command | Description |
|---|---|
| `ORQESTA: Connect to Flagsmith` | Configure connection (token stored in SecretStorage) |
| `ORQESTA: Refresh Feature Flags` | Reload flags from Flagsmith |
| `ORQESTA: Scan Workspace` | Scan for flag references |
| `ORQESTA: Compare Environments` | Run environment drift detection |
| `ORQESTA: Run Audience Guard` | Check MV allocation shifts |
| `ORQESTA: Evaluate Identities` | Identity-level evaluation |
| `ORQESTA: Run Policy Check` | Governance policy rules |
| `ORQESTA: Open Safety Findings` | Focus safety panel |
| `ORQESTA: Open Release Readiness` | Focus release panel |
| `ORQESTA: Review Sync Plan` | Generate and review sync plan |
| `ORQESTA: Open Dashboard` | Open Orqesta web dashboard |

---

## Security

- API tokens stored in **VS Code SecretStorage** only — never in `settings.json`, workspace files, or logs
- All Flagsmith communication goes through the **Orqesta API server** — the extension never talks to Flagsmith directly
- Credentials are masked in all UI output
- Source code is scanned locally — never sent to any external service

---

## Configuration

| Setting | Default | Description |
|---|---|---|
| `orqesta.serverUrl` | `http://localhost:3001` | Orqesta API server URL |
| `orqesta.autoScan` | `true` | Auto-scan on file save |
| `orqesta.scanInclude` | `["**/*.ts","**/*.tsx","**/*.js","**/*.jsx"]` | Files to scan |
| `orqesta.scanExclude` | `["**/node_modules/**","**/dist/**",...]` | Files to skip |
| `orqesta.defaultProject` | — | Default Flagsmith project ID |
| `orqesta.defaultSourceEnv` | — | Default source environment |
| `orqesta.defaultTargetEnv` | — | Default target environment |

---

## Known Limitations

1. Dynamic flag names cannot be statically analysed
2. Audit log requires a paid Flagsmith plan — Forensics view shows a message when unavailable
3. Extension requires the Orqesta server to be running
4. The extension does not modify Flagsmith configuration directly — all writes go through Orqesta's approval flow

---

## MCP Coexistence

The ORQESTA MCP server remains fully functional alongside this extension. The extension provides a **native developer interface**; the MCP server provides an **AI agent interface**. Both use the same Orqesta API.

---

## License

MIT
