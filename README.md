# Orqesta

**Flagsmith configuration safety, environment drift detection, change forensics, policy enforcement, and audience regression guard.**

Orqesta is an open-source CLI + web dashboard built on top of [Flagsmith](https://flagsmith.com). It answers the questions teams face when managing feature flags across multiple environments:

- **What is different between my environments?** — Compare any two environments and get a readable, categorised drift report.
- **What changed, who changed it, and what did it look like before?** — Inspect structured audit history with before/after field values.
- **Does our configuration meet our standards?** — Run policy checks in CI and catch violations before they reach production.
- **Did my sync accidentally shift user exposure?** — Audience Regression Guard catches multivariate allocation shifts after a sync.

Built for [Toggle Wars Hackathon — Track 03: Build on Open Source Flagsmith](https://www.wemakedevs.org/hackathons/flagsmith).

---

## Quick Start

### Option A — Docker (self-hosted Flagsmith + Orqesta, 5 minutes)

```bash
git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
docker compose up -d

# Wait ~30 seconds, then:
# 1. Open Flagsmith:  http://localhost:8000  — create account + API key
# 2. Open Orqesta:    http://localhost:3001  — paste API key in Settings
```

**→ [Full Docker guide](./QUICKSTART.md)**

### Option B — Flagsmith Cloud + local dev

```bash
git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta && npm install

# Terminal 1 — API server
export ORQUESTA_API_TOKEN="your_flagsmith_org_token"
npm run server         # http://localhost:3001

# Terminal 2 — Web dashboard
cd web && npm run dev  # http://localhost:5173
```

### Option C — CLI only

```bash
git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta && npm install && npm run build && npm link

export ORQUESTA_API_TOKEN="your_flagsmith_org_token"
orqesta doctor
orqesta compare Staging Production
```

---

## Credentials

Orqesta needs a **Flagsmith Organisation API Token** (Management API).

**Obtain it from:** Flagsmith dashboard → click your organisation name → **API Access** tab → **Create API Key**.

| Variable | Purpose | Required |
|---|---|---|
| `ORQUESTA_API_TOKEN` | Management API token | Yes |
| `ORQUESTA_API_URL` | Management API base URL | No (default: `https://api.flagsmith.com/api/v1`) |
| `ORQUESTA_ENVIRONMENT_KEY` | Environment key (`ser.` prefix) for Flags API | No |
| `ORQUESTA_FLAGS_API_URL` | Flags API base URL | No (default: `https://edge.api.flagsmith.com/api/v1`) |
| `FLAGSMITH_API_KEY` | Legacy alias for `ORQUESTA_API_TOKEN` | No |
| `FLAGSMITH_API_URL` | Legacy alias for `ORQUESTA_API_URL` | No |

Copy `.env.example` to `.env` and fill in your values. Never commit `.env`.

### Self-hosted Flagsmith

```bash
export ORQUESTA_API_TOKEN="your_token"
export ORQUESTA_API_URL="http://localhost:8000/api/v1"
export ORQUESTA_FLAGS_API_URL="http://localhost:8000/api/v1"
orqesta doctor
```

---

## Features

### 1. Environment Drift Detection

Compare any two Flagsmith environments. Every difference is categorised:

| Category | Meaning |
|---|---|
| `enabled_state` | Flag enabled in one env, disabled in the other |
| `value_change` | Remote config value differs |
| `multivariate_allocation` | MV percentage allocation differs |
| `missing_in_target` | Flag exists in source but not target |
| `missing_in_source` | Flag exists in target but not source |

```bash
orqesta compare Staging Production
# exits 0 if in sync, 1 if drift found — CI-safe
```

### 2. Selective Synchronisation with Stale-Plan Protection

Generate a typed plan from drift. Preview with dry-run. Choose which operations to apply. A snapshot of the target state taken at plan-creation time is compared before every apply — concurrent changes are detected and skipped rather than silently overwritten.

```bash
orqesta plan Staging Production
orqesta apply --dry-run          # preview — no writes
orqesta apply                    # interactive y/N gate
orqesta verify Staging Production
```

### 3. Configuration Forensics

Inspect audit history for any feature flag with structured before/after field values.

```bash
orqesta inspect checkout_redesign
orqesta inspect checkout_redesign --with-changes
```

> **Note:** The Flagsmith audit API requires a paid plan. On free-tier Cloud accounts, Orqesta shows a clear message and suggests the CLI fallback.

### 4. Policy Engine

Define standards as YAML, run them in CI.

```bash
orqesta lint Production
orqesta lint Production --policy ./orqesta-policy.yml
# exits 0 if no errors, 1 on violations
```

Five built-in rules: `naming_convention`, `require_description`, `no_archived_flags_enabled`, `multivariate_allocations_sum`, `environment_parity`.

### 5. Audience Regression Guard

Detects multivariate flag allocation shifts between environments that could change what percentage of users sees each variant.

```bash
orqesta guard Staging Production
# critical: shift ≥10pp  → exits 1 (CI-safe)
# warning:  shift 1–9pp
```

### 6. Identity Evaluation

Evaluates synthetic user identities against two environments via the Flagsmith Flags API and classifies any differences in evaluation results.

```bash
# Create a fixture file
orqesta eval Development Production --init

# Edit orqesta-identities.yml, then run:
orqesta eval Development Production

# Output per identity:
#   [ENABLEMENT_REGRESSION] dark_mode — user loses access
#   [VALUE_CHANGE]          api_rate_limit — value changed
```

Fixture file format (`orqesta-identities.yml`):

```yaml
version: 1
identities:
  - identifier: user_standard
    traits: []
  - identifier: user_premium
    traits:
      - key: plan
        value: premium
```

Supported regression types: `ENABLEMENT_REGRESSION`, `ENABLEMENT_CHANGE`, `VARIANT_CHANGE`, `VALUE_CHANGE`, `MISSING_FEATURE`, `EVALUATION_ERROR`.

---

## CLI Reference

```
orqesta doctor                                # health check
orqesta environments                          # list projects + environments
orqesta compare <source> <target>             # drift detection
orqesta plan <source> <target>                # generate sync plan
orqesta apply [--dry-run] [--yes]             # apply plan
orqesta verify <source> <target>              # post-sync check
orqesta inspect <feature> [--with-changes]    # audit history
orqesta history <feature>                     # full change history
orqesta lint <environment> [--policy <path>]  # policy checks
orqesta guard <source> <target>               # audience regression
orqesta eval <source> <target>              # identity-level evaluation
orqesta eval <source> <target> --init      # create starter fixture file
orqesta report <source> <target>              # export report
orqesta config set-key <token>                # store token
orqesta config set-url <url>                  # set API URL
orqesta config set-project <id>               # set default project
orqesta config clear                          # remove all stored config
```

---

## Policy Configuration

Create `.orqesta-policy.yml` in your project root:

```yaml
version: 1

policies:
  - id: naming-convention
    description: Flag names must be lowercase snake_case.
    severity: warning
    rule: naming_convention
    pattern: "^[a-z][a-z0-9_]*$"

  - id: production-descriptions
    description: Production flags must have a description.
    severity: error
    rule: require_description
    environments:
      - Production

  - id: no-archived-enabled
    description: Archived flags must not be enabled.
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

---

## Demo Data

Seed a fresh Flagsmith instance with intentional drift for demonstration:

```bash
export ORQUESTA_API_TOKEN="your_token"
export ORQUESTA_API_URL="http://localhost:8000/api/v1"  # self-hosted
npx tsx scripts/seed-demo-data.ts
```

This creates four flags with intentional drift between Staging and Production:

| Flag | Staging | Production | Drift type |
|---|---|---|---|
| `checkout_redesign` | enabled | disabled | enabled_state |
| `hero_text` | "Save 20% Today" | "Free Shipping" | value_change |
| `dark_mode` | disabled | disabled | — (no drift) |
| `new_user_onboarding` | enabled | disabled | enabled_state |

---

## Architecture

```
src/
├── cli/commands/           11 CLI commands
├── flagsmith/client.ts     Management API + Flags API HTTP client (dual auth)
├── drift/comparator.ts     Cross-environment diff engine
├── sync/
│   ├── planner.ts          Drift → SyncPlan with snapshot + checksum
│   └── executor.ts         Stale detection, apply, post-sync verification
├── policies/               Policy engine — schema, loader, runner, 5 built-in rules
├── audience/               Audience Regression Guard — MV allocation diff
├── config/index.ts         ConfigManager — env vars + local store
└── types/                  Flagsmith, drift, sync types

server/
├── index.ts                Express API server
└── routes/                 settings, environments, compare, sync,
                            forensics, policy, audience

web/src/
├── pages/app/              Dashboard: Overview, Compare, Sync, Forensics,
│                           Policy, Audience, Settings
├── lib/api.ts              Typed fetch client
└── lib/hooks.ts            React data hooks
```

### Flagsmith API endpoints used

| Operation | Endpoint | Auth |
|---|---|---|
| Test connectivity | `GET /organisations/` | Management API |
| List projects | `GET /projects/?organisation=<id>` | Management API |
| List environments | `GET /environments/?project=<id>` | Management API |
| Fetch feature states | `GET /environments/<key>/featurestates/` | Management API |
| Update feature state | `PATCH /environments/<key>/featurestates/<id>/` | Management API |
| Audit log | `GET /audit/?project=<id>` | Management API |
| Audit entry detail | `GET /audit/<id>/` | Management API |
| Project features | `GET /projects/<id>/features/` | Management API |
| Segments | `GET /projects/<id>/segments/` | Management API |
| Environment document | `GET /environment-document/` | Flags API (`ser.` key) |

Authentication:
- Management API: `Authorization: Api-Key <token>`
- Flags API: `X-Environment-Key: <ser.key>`

Compatible with Flagsmith Cloud and self-hosted instances.

---

## Self-Hosted Setup

```bash
# Start Flagsmith + Orqesta together
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f flagsmith

# Seed demo data (after creating org + API key in Flagsmith UI)
export ORQUESTA_API_TOKEN="your_token"
export ORQUESTA_API_URL="http://localhost:8000/api/v1"
npx tsx scripts/seed-demo-data.ts

# Run doctor to verify
orqesta doctor
```

The `docker-compose.yml` runs:
- **Flagsmith** on port `8000` (API + Admin UI)
- **PostgreSQL** on port `5432`
- **Orqesta** on port `3001` (API + web dashboard)

---

## MCP Server

Orqesta ships an MCP (Model Context Protocol) server that exposes its core tools to AI clients (Claude Desktop, Cursor, Kiro, VS Code with Continue, etc.).

### Configuration

Add to your MCP client config:

```json
{
  "mcpServers": {
    "orqesta": {
      "command": "node",
      "args": ["/path/to/orqesta/dist/src/mcp/server.js"],
      "env": {
        "ORQUESTA_API_TOKEN": "your_flagsmith_org_token",
        "ORQUESTA_API_URL": "https://api.flagsmith.com/api/v1"
      }
    }
  }
}
```

For self-hosted Flagsmith, set `ORQUESTA_API_URL` and `ORQUESTA_FLAGS_API_URL` to your instance URLs.

### Available tools

| Tool | Description |
|---|---|
| `get_environments` | List all projects and environments |
| `compare_environments` | Detect drift between two environments |
| `run_policy_check` | Run policy rules against an environment |
| `run_audience_guard` | Compare MV allocation shifts |
| `eval_identities` | Identity-level evaluation across two environments |

All tools use the same core logic as the CLI — no duplicate business logic.

---

```bash
npm test         # 106 tests across 9 test files
```

All tests are pure unit tests — no live API calls, no network. Flagsmith responses are mocked.

| File | Tests | Coverage |
|---|---|---|
| `tests/drift.comparator.test.ts` | 9 | Drift detection, all 5 categories |
| `tests/sync.planner.test.ts` | 8 | Plan generation, checksums |
| `tests/sync.stale.test.ts` | 8 | Stale-plan detection |
| `tests/forensics.test.ts` | 14 | Audit entry parsing |
| `tests/policy.test.ts` | 37 | All 5 policy rules |
| `tests/audience.guard.test.ts` | 11 | Audience Regression Guard |
| `server/tests/compare.test.ts` | 6 | Compare API route |
| `server/tests/sync.test.ts` | 6 | Sync plan + apply routes |
| `server/tests/settings.test.ts` | 7 | Credentials + secret masking |

---

## Known Limitations

1. **Audit log** — Requires a paid Flagsmith plan. Free-tier Cloud returns 500; Orqesta shows a clear message.
2. **Segment rule diffing** — Cross-environment segment comparison is not implemented. Only environment-default feature state drift is detected.
3. **`missing_in_target` sync** — Flags absent from the target are shown but not auto-created. Create the feature in Flagsmith first, then sync the state.
4. **Identity overrides** — Out of scope. Identity-level overrides are per-environment by design.
5. **Change Requests** — Flagsmith's built-in four-eyes approval (Scale-Up/Enterprise) is not integrated. Orqesta provides its own interactive confirmation gate.

---

## License

MIT
