# Orqesta

**Flagsmith configuration safety, environment drift detection, change forensics and policy enforcement.**

Orqesta is an open-source CLI + Web UI that extends the [Flagsmith](https://flagsmith.com) developer workflow. It answers three questions teams face when managing feature flags across multiple environments:

- **What is different between my environments?** Compare any two environments and get a readable, categorised diff.
- **What changed, who changed it, and what did it look like before?** Inspect structured audit history with before/after field values.
- **Does our configuration meet our standards?** Run policy checks against an environment and catch violations in CI before they reach production.

Built for [Toggle Wars Hackathon — Track 03: Build on Open Source Flagsmith](https://www.wemakedevs.org/hackathons/flagsmith).

---

## 🚀 Quick Start (5 Minutes)

```bash
# Start self-hosted Flagsmith + Orqesta with Docker
git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
docker-compose up -d

# Open Flagsmith UI: http://localhost:8000 (create account + API key)
# Open Orqesta UI: http://localhost:3001 (paste API key in Settings)
```

**→ [Full Quick Start Guide](./QUICKSTART.md)**

---

## Features

### Environment Drift Detection
Compare two Flagsmith environments and get a categorised report of every difference: enabled state, remote config values, multivariate allocations, and missing flags.

### Selective Synchronisation with Stale-Plan Protection
Generate a typed synchronisation plan from drift, preview it with dry-run, approve it interactively, and apply only the operations you choose. A snapshot of the target state taken at plan-creation time is compared against the live state before every apply — concurrent changes by other users are detected and skipped rather than silently overwritten.

### Configuration Forensics
Inspect the full audit history for any feature flag. When the Flagsmith API exposes structured `change_details` (field-level before/after values), Orqesta fetches and displays them. Actor, timestamp, environment, and change type are always shown.

### Policy Engine & Linting
Define team-specific configuration standards in a YAML policy file and run them against any environment. Five built-in rules cover naming conventions, descriptions, archived flags, multivariate allocations, and cross-environment parity. Exits with code 1 on errors — suitable for CI gates.

### Safe by Default
- Read-only operations are always safe.
- Dry-run never writes to Flagsmith.
- Production changes require explicit `y` confirmation (or `--yes` for CI).
- Plan files record target state snapshots so stale operations are caught before apply.
- API keys are masked in all output and never written to logs.

---

## Requirements

- Node.js 18 or later
- A Flagsmith account (cloud or self-hosted)
- A Flagsmith **Organisation API Token** (Management API — not an environment SDK key)

---

## Installation

### From npm

```bash
npm install -g orqesta
```

### From source

```bash
git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
npm install
npm run build
npm link
```

---

## Configuration

Orqesta reads credentials from environment variables or a local config file.

### Option 1 — Environment variable (recommended for CI)

```bash
export FLAGSMITH_API_KEY="your_organisation_api_token"
```

### Option 2 — Stored config (interactive use)

```bash
orqesta config set-key your_organisation_api_token
```

### Self-hosted Flagsmith

```bash
export FLAGSMITH_API_URL="https://your-flagsmith.example.com/api/v1"
# or
orqesta config set-url https://your-flagsmith.example.com/api/v1
```

### Pin a default project (optional)

```bash
orqesta config set-project 42
```

See `.env.example` for a full list of supported environment variables.

---

## CLI Usage

### Health check

```bash
orqesta doctor
```

Verifies your API key, API URL, and connectivity. Run this first.

### List environments

```bash
orqesta environments
orqesta environments --json
```

### Detect drift between two environments

```bash
orqesta compare Staging Production
orqesta compare Staging Production --json
orqesta compare Staging Production --project "My App"
```

Exits with code `0` if environments are in sync, `1` if drift is found. CI-safe.

### Inspect audit history for a flag

```bash
orqesta inspect checkout_redesign
orqesta inspect checkout_redesign --environment Production
orqesta inspect checkout_redesign --with-changes    # fetch structured before/after diffs
orqesta inspect checkout_redesign --limit 50
```

### View full change history

```bash
orqesta history checkout_redesign
orqesta history checkout_redesign --with-changes --json
```

### Generate a synchronisation plan

```bash
orqesta plan Staging Production
orqesta plan Staging Production --json
```

Saves the plan to a local temp file for `apply` to use.

### Preview changes (dry-run)

```bash
orqesta apply --dry-run
```

Shows every proposed change. Writes nothing to Flagsmith.

### Apply with approval gate

```bash
orqesta apply            # interactive y/N prompt
orqesta apply --yes      # skip prompt (CI/CD)
orqesta apply --plan-file ./my-plan.json
```

Orqesta re-fetches the target environment before applying and skips any operation where the target has changed since the plan was created. Runs post-apply verification automatically.

### Verify environments are in sync

```bash
orqesta verify Staging Production
```

Exits `0` if in sync, `1` if residual drift remains.

### Export a report

```bash
orqesta report Staging Production
orqesta report Staging Production --format markdown --output drift-report.md
orqesta report Staging Production --format json
```

### Run policy checks

```bash
orqesta lint Production
orqesta lint Staging --policy ./orqesta-policy.yml
orqesta lint Production --json
```

Exits `0` if no `error`-severity violations, `1` otherwise.

### Configuration management

```bash
orqesta config show             # show current config (API key masked)
orqesta config set-key <token>  # store Flagsmith API token
orqesta config set-url <url>    # set API URL for self-hosted
orqesta config set-project <id> # set default project
orqesta config clear            # remove all stored config
```

---

## Policy Configuration

Create `.orqesta-policy.yml` in your project root (or pass `--policy <path>`):

```yaml
version: 1

policies:
  - id: naming-convention
    description: Feature flag names must be lowercase snake_case.
    severity: warning
    rule: naming_convention
    pattern: "^[a-z][a-z0-9_]*$"

  - id: production-descriptions
    description: All flags in Production must have a description.
    severity: error
    rule: require_description
    environments:
      - Production

  - id: no-archived-enabled
    description: Archived flags must not be enabled in any environment.
    severity: error
    rule: no_archived_flags_enabled

  - id: mv-allocations
    description: Multivariate allocations must sum to exactly 100%.
    severity: error
    rule: multivariate_allocations_sum

  - id: staging-production-parity
    description: Features enabled in Staging must also be enabled in Production.
    severity: warning
    rule: environment_parity
    parity_source: Staging
    environments:
      - Production
```

### Available rules

| Rule | Description | Options |
|---|---|---|
| `naming_convention` | Names must match a regex | `pattern` (default: `^[a-z][a-z0-9_]*$`) |
| `require_description` | Features must have a non-empty description | — |
| `no_archived_flags_enabled` | Archived features must not be in enabled state | — |
| `multivariate_allocations_sum` | MV allocations must sum to exactly 100% | — |
| `environment_parity` | Features enabled in source must be enabled in target | `parity_source` |

If no policy file is found, a built-in default policy runs (naming convention, no archived enabled, MV sum).

---

## Architecture

```
src/
├── cli/
│   ├── index.ts                 Commander entry point — all 11 commands
│   └── commands/
│       ├── doctor.ts            Health check
│       ├── environments.ts      List projects and environments
│       ├── compare.ts           Drift detection and display
│       ├── plan.ts              Sync plan generation
│       ├── apply.ts             Approval gate, stale check, apply, verify
│       ├── verify.ts            Post-sync re-check
│       ├── inspect.ts           Audit history for one flag
│       ├── history.ts           Full audit log across environments
│       ├── report.ts            Markdown/JSON report export
│       ├── lint.ts              Policy engine runner
│       └── config.ts            Credential management
│
├── flagsmith/
│   └── client.ts                Flagsmith Management API HTTP client
│
├── drift/
│   └── comparator.ts            Cross-environment diff engine
│
├── sync/
│   ├── planner.ts               Drift → SyncPlan with snapshot + checksum
│   └── executor.ts              Stale detection, apply, post-sync verification
│
├── policies/
│   ├── schema.ts                Zod policy file schema and types
│   ├── loader.ts                YAML/JSON policy file loader
│   ├── runner.ts                Rule execution engine
│   └── rules/                  One file per rule implementation
│       ├── naming_convention.ts
│       ├── require_description.ts
│       ├── no_archived_flags_enabled.ts
│       ├── multivariate_allocations_sum.ts
│       └── environment_parity.ts
│
├── config/
│   └── index.ts                 ConfigManager — env vars + local config store
│
├── types/
│   ├── flagsmith.ts             Flagsmith API response types
│   ├── drift.ts                 DriftItem, DriftReport
│   └── sync.ts                  SyncPlan, SyncOperation, SyncResult
│
└── utils/
    ├── output.ts                Terminal output — chalk, diffs, tables
    └── clientFactory.ts         Client factory, environment name resolution

tests/
├── drift.comparator.test.ts    (9 tests)
├── sync.planner.test.ts        (8 tests)
├── sync.stale.test.ts          (8 tests)
├── forensics.test.ts           (14 tests)
└── policy.test.ts              (37 tests)
```

### Flagsmith API endpoints used

| Operation | Endpoint |
|---|---|
| Organisation discovery | `GET /organisations/` |
| Project listing | `GET /projects/?organisation=<id>` |
| Environment listing | `GET /environments/?project=<id>` |
| Feature state retrieval | `GET /environments/<key>/featurestates/` |
| Feature state update | `PATCH /environments/<key>/featurestates/<id>/` |
| Audit log (list) | `GET /audit/?project=<id>` |
| Audit log (detail with before/after) | `GET /audit/<id>/` |
| Project features | `GET /projects/<id>/features/` |
| Segment listing | `GET /projects/<id>/segments/` |

All operations use the **Flagsmith Management API** with an Organisation API Token. Compatible with Flagsmith Cloud and self-hosted instances running Flagsmith 2.263.0 or later.

---

## Testing

```bash
npm test               # run all 76 tests
npm run test:watch     # watch mode
npm run lint           # type-check only
```

Tests use Vitest with no live API calls — all Flagsmith responses are mocked or constructed inline.

---

## Self-Hosted Flagsmith

The quickest way to run Flagsmith locally for development:

```bash
docker compose up -d
```

Then open `http://localhost:8000`, create your admin account, and get your Organisation API Token from Organisation Settings → API Keys.

Configure Orqesta to point to it:

```bash
export FLAGSMITH_API_KEY="your_token"
export FLAGSMITH_API_URL="http://localhost:8000/api/v1"
orqesta doctor
```

A seed script is included to populate demo flags with intentional drift:

```bash
npx tsx scripts/seed-demo-data.ts
```

---

## Demo Workflow

```bash
# 1. Confirm connectivity
orqesta doctor

# 2. List your environments
orqesta environments

# 3. Detect drift between Staging and Production
orqesta compare Staging Production

# 4. Investigate a specific flag's audit history
orqesta inspect checkout_redesign --with-changes

# 5. Generate a selective sync plan
orqesta plan Staging Production

# 6. Preview — no changes made
orqesta apply --dry-run

# 7. Apply after reviewing — requires y/N confirmation
orqesta apply

# 8. Confirm environments are now in sync
orqesta verify Staging Production

# 9. Run policy checks against Production
orqesta lint Production

# 10. Export a Markdown report
orqesta report Staging Production --output drift-report.md
```

---

## Known Limitations

1. **Audit log before/after values** — The structured `change_details` (field, old, new) are only available on the single-entry retrieve endpoint (`GET /audit/<id>/`), not the list. Orqesta fetches them on demand with `--with-changes`. Not all event types populate `change_details`; older Flagsmith versions may return empty arrays.

2. **Segment rule diffing** — Segment definitions are fetched but cross-environment segment rule comparison is not implemented. Only environment-default feature state drift is detected.

3. **`missing_in_target` sync** — Flags absent from the target environment are shown in the plan but not auto-created. Creating a feature state in a new environment requires manual setup in the Flagsmith dashboard first.

4. **Identity overrides** — Out of scope. Identity-level overrides are per-environment by design and require the Flagsmith Edge API.

5. **Change Requests** — Flagsmith's built-in four-eyes approval (Scale-Up/Enterprise only) is not integrated. Orqesta provides its own interactive confirmation gate that works on all Flagsmith plans.

6. **Frontend dashboard** — Not yet built. All functionality is available through the CLI.

7. **Required permissions** — The Management API Token needs at minimum: View Environment, Update Feature State. The `lint require_description` rule additionally needs View Project.

---

## License

MIT
