# orqesta — Project Context

> Single reference document. Covers what was built, every file, the architecture, what works, what's pending, and the exact next steps.

---

## What is orqesta?

orqesta is an open-source CLI tool for teams using Flagsmith. It fills a gap the official Flagsmith CLI leaves open: it compares two environments, explains configuration drift, generates a selective synchronisation plan, previews it, applies it only after human approval, and verifies the result.

**Hackathon:** Toggle Wars — Track 03: Build on Open Source Flagsmith
**Language:** TypeScript on Node.js 24
**Distribution:** npm package (`orqesta`)
**Status:** MVP complete — builds cleanly, 17 tests pass, all commands wired

---

## The Problem It Solves

Teams running Flagsmith across Staging and Production regularly hit three issues:

1. They don't know which flags differ between environments until something breaks.
2. The audit log in the dashboard is a wall of text — no CLI access, no filtering.
3. Syncing configs manually is risky; there is no dry-run or approval gate.

The official Flagsmith CLI (`@flagsmith/cli`) handles single-environment flag reads and writes. It has no cross-environment diff, no sync planner, no approval gate, and no audit forensics. orqesta adds exactly those things.

---

## The Complete Workflow

```
orqesta doctor                           → verify credentials and connectivity
orqesta environments                     → list all projects and environments
orqesta compare Staging Production       → detect and display drift
orqesta inspect checkout_redesign        → show audit events for one flag
orqesta history checkout_redesign        → full chronological audit log
orqesta plan Staging Production          → build a typed sync plan
orqesta apply --dry-run                  → preview with no writes
orqesta apply                            → prompt → apply → auto-verify
orqesta verify Staging Production        → post-sync confirmation
orqesta report Staging Production        → export markdown/json report
orqesta config set-key <token>           → store API token
orqesta config show                      → show current config (key masked)
```

---

## Project File Map

```
d:\orqesta\
│
├── src/
│   ├── cli/
│   │   ├── index.ts                   CLI entry point — Commander setup, all commands registered
│   │   └── commands/
│   │       ├── doctor.ts              Health check: config + API connectivity
│   │       ├── environments.ts        List orgs, projects, environments
│   │       ├── compare.ts             Cross-environment drift detection + display
│   │       ├── plan.ts                Build sync plan from drift, cache to temp file
│   │       ├── apply.ts               Load plan, approval gate, execute, verify
│   │       ├── verify.ts              Standalone post-sync verification
│   │       ├── inspect.ts             Audit log for one feature flag
│   │       ├── history.ts             Full audit log across all environments
│   │       ├── report.ts              Markdown or JSON drift+plan report export
│   │       └── config.ts              set-key, set-url, set-project, show, clear
│   │
│   ├── flagsmith/
│   │   └── client.ts                  Flagsmith Management API HTTP client (axios)
│   │                                  Endpoints: organisations, projects, environments,
│   │                                  feature states (paginated), audit log, segments,
│   │                                  PATCH feature state, ping/health check
│   │
│   ├── drift/
│   │   └── comparator.ts              Compares two env snapshots → DriftReport
│   │                                  Detects: enabled_state, value_change,
│   │                                  multivariate_allocation, missing_in_source,
│   │                                  missing_in_target
│   │
│   ├── sync/
│   │   ├── planner.ts                 DriftReport → SyncPlan with SHA-256 checksum
│   │   └── executor.ts                Applies SyncPlan via PATCH, runs verification,
│   │                                  handles partial failures
│   │
│   ├── types/
│   │   ├── flagsmith.ts               All Flagsmith API response types
│   │   ├── drift.ts                   DriftItem, DriftReport, NormalisedFeatureState
│   │   └── sync.ts                    SyncPlan, SyncOperation, SyncResult
│   │
│   ├── config/
│   │   └── index.ts                   ConfigManager: env vars + conf file storage
│   │                                  Keys: apiKey, apiUrl, organisationId, projectId
│   │
│   └── utils/
│       ├── output.ts                  Terminal output — chalk colours, diff tables,
│       │                              printDriftReport, printSyncPlan, printSyncResult,
│       │                              printAuditEntries, printError, printSuccess
│       └── clientFactory.ts           createClient(), resolveEnvironment(), resolveProject()
│
├── tests/
│   ├── drift.comparator.test.ts       9 unit tests — vitest
│   └── sync.planner.test.ts           8 unit tests — vitest
│
├── scripts/
│   ├── seed-demo-data.ts              Auto-creates demo flags with intentional drift
│   │                                  in a live Flagsmith instance
│   ├── install-docker-wsl.sh          Installs Docker Engine in WSL2 Ubuntu
│   ├── setup-flagsmith-wsl.ps1        Windows PowerShell launcher for WSL setup
│   └── orqesta.ps1                  Convenience wrapper: .\scripts\orqesta.ps1 <cmd>
│
├── docker-compose.yml                 Official Flagsmith self-hosted compose file
│
├── README.md                          Full documentation (installation, all commands,
│                                      architecture, Flagsmith API table, limitations)
├── QUICKSTART.md                      Step-by-step demo scenario (10 min to running demo)
├── SETUP_FLAGSMITH.md                 Three options for self-hosting Flagsmith
├── RESEARCH.md                        Technical feasibility investigation:
│                                      API capability matrix, confirmed endpoints,
│                                      known limitations, implementation decisions
├── STATUS.md                          P0/P1/P2 checklist, demo scenario, judging notes
├── package.json                       name: orqesta, version: 0.1.0, type: module
├── tsconfig.json                      target: ES2022, moduleResolution: bundler
└── .gitignore                         excludes node_modules, dist, .env, reports
```

---

## Key Architecture Decisions

### Flagsmith API — What orqesta Uses

| Operation | Endpoint | Used by |
|---|---|---|
| List organisations | `GET /organisations/` | doctor, environments |
| List projects | `GET /projects/?organisation=<id>` | environments, all commands |
| List environments | `GET /environments/?project=<id>` | environments, compare, plan |
| List feature states | `GET /environments/<key>/featurestates/` | compare, plan, verify |
| Update feature state | `PATCH /environments/<key>/featurestates/<id>/` | apply |
| List audit events | `GET /audit/?project=<id>` | inspect, history |
| List segments | `GET /projects/<id>/segments/` | client (available, not yet used in compare) |

Authentication: `Authorization: Token <Management API Token>` header on all requests.

### Drift Algorithm

1. Fetch paginated feature states for both environments via Management API.
2. Build `Map<flagName, NormalisedFeatureState>` for each environment.
3. Walk the union of all flag names.
4. For each flag, compare: enabled, value, multivariate allocations (sorted by option ID).
5. Output: typed `DriftItem[]` grouped by category.

### Sync Safety Chain

```
plan            → builds SyncPlan with SHA-256 checksum of operation IDs
apply           → verifies checksum (staleness guard)
                → warns if plan is older than 15 minutes
                → shows full plan again
                → requires explicit "y" at prompt (skipped with --yes)
                → PATCHes each operation independently
                → records applied/skipped/failed per operation
                → re-fetches both environments
                → re-runs comparator on synced features only
                → reports verification pass/fail
```

Never silently overwrites production. Never applies based on a stale or tampered plan.

### Output Modes

Every command supports `--json` for machine-readable output (CI use). Default is coloured terminal output via chalk. `report` exports Markdown or JSON files.

### Configuration Precedence

1. Environment variables: `FLAGSMITH_API_KEY`, `FLAGSMITH_API_URL`, `FLAGSMITH_ORGANISATION_ID`, `FLAGSMITH_PROJECT_ID`
2. Stored config file (via `conf` package, OS-appropriate secure location)
3. Defaults (`https://api.flagsmith.com/api/v1`)

API key is never logged or printed in full (masked in `config show`).

---

## Dependencies

| Package | Purpose |
|---|---|
| `commander` | CLI framework |
| `axios` | HTTP client |
| `zod` | Schema validation (config) |
| `chalk` | Terminal colours |
| `ora` | Spinner for async operations |
| `inquirer` | Interactive confirmation prompt in `apply` |
| `conf` | Secure config file storage |
| `tsx` | Dev-time TypeScript execution |
| `vitest` | Test runner |
| `typescript` | Compiler |

---

## Test Coverage

| Test | What It Verifies |
|---|---|
| DriftComparator: no drift | Identical envs produce zero drift items |
| DriftComparator: enabled_state | Detects true→false enabled diff |
| DriftComparator: value_change | Detects string value diff |
| DriftComparator: missing_in_target | Flag in source, absent in target |
| DriftComparator: missing_in_source | Flag in target, absent in source |
| DriftComparator: multivariate | Detects allocation percentage diff |
| DriftComparator: summary counts | Correct byCategory counts for multi-drift |
| DriftComparator: metadata | Source/target names and timestamp present |
| DriftComparator: sort invariance | Same allocations in different order = no drift |
| SyncPlanner: enable op | enabled_state=false → type:enable, correct featureStateId |
| SyncPlanner: disable op | enabled_state=true (src=false) → type:disable |
| SyncPlanner: set_value op | value_change → type:set_value, correct values |
| SyncPlanner: missing_in_target | No featureStateId, manual intervention note |
| SyncPlanner: skip missing_in_source | Category excluded from plan entirely |
| SyncPlanner: checksum valid | SHA-256 of sorted operation IDs, verifies true |
| SyncPlanner: checksum tampered | Modified checksum verifies false |
| SyncPlanner: metadata | Source/target/createdAt recorded in plan |

All 17 tests pass. Build has zero TypeScript errors.

---

## Known Limitations (Documented in README)

1. **Audit log before/after values** — The Flagsmith API stores a human-readable string per event, not structured field diffs. orqesta shows events and actors but cannot reconstruct previous values.
2. **Segment rule diffing** — Segment definitions are fetched but not yet compared by the drift engine. Cross-environment segment rule drift is not detected in the MVP.
3. **missing_in_target sync** — Flags absent from target are listed in the plan but not auto-created. Creating a feature state in a new environment is supported by the API but excluded from the MVP for safety.
4. **Identity overrides** — Out of scope. These are per-environment by design and require the Edge API.
5. **Change Requests** — Flagsmith's built-in four-eyes approval (Scale-Up/Enterprise only) is not integrated. orqesta uses its own approval gate.
6. **Feature versioning history** — Enterprise-only audit events (`EF_VERSION`) are listed if present but not specially handled.

---

## What Still Needs Doing Before Submission

### Must Do (Blockers)
- [ ] Get a Flagsmith instance running (Cloud or self-hosted via `scripts/setup-flagsmith-wsl.ps1`)
- [ ] Run `scripts/seed-demo-data.ts` to populate drift scenario
- [ ] Run the full demo workflow end-to-end against real data
- [ ] Fix any issues found during real-data testing
- [ ] Record a demo video (2–3 minutes)

### Should Do (Submission Quality)
- [ ] Push to a public GitHub repository
- [ ] Add GitHub Actions CI workflow (run `npm test` on push)
- [ ] Add a `npm link` or `npx orqesta` section to README
- [ ] Add example terminal output screenshots or asciinema recording to README

### Nice to Have (Track 03 Score Boost)
- [ ] Segment rule diff (compare segment rule trees between environments)
- [ ] `orqesta apply --select` to cherry-pick which operations to apply

---

## How to Run the Demo Right Now

### 1. Start Flagsmith (self-hosted)

From Windows PowerShell:
```powershell
.\scripts\setup-flagsmith-wsl.ps1
# Enter your WSL sudo password when prompted
# Wait ~90 seconds for Flagsmith to start
# Open http://localhost:8000 in browser
```

### 2. Create project and environments in Flagsmith dashboard

- Project: "orqesta Demo"
- Environments: "Staging" and "Production"
- Get Organisation API Token from Organisation Settings → API Keys

### 3. Seed demo data

```powershell
$env:FLAGSMITH_API_KEY = "your_token"
$env:FLAGSMITH_API_URL = "http://localhost:8000/api/v1"
npx tsx scripts/seed-demo-data.ts
```

This creates 4 flags with pre-configured drift.

### 4. Run orqesta

```powershell
node dist/cli/index.js doctor
node dist/cli/index.js environments
node dist/cli/index.js compare Staging Production
node dist/cli/index.js inspect checkout_redesign
node dist/cli/index.js plan Staging Production
node dist/cli/index.js apply --dry-run
node dist/cli/index.js apply
node dist/cli/index.js verify Staging Production
node dist/cli/index.js report Staging Production --output demo-report.md
```

---

## Track 03 Judging Criteria — How orqesta Scores

| Criterion | Evidence |
|---|---|
| **Flagsmith is central** | Every feature uses the Management API. No Flagsmith = no product. |
| **Real-world impact** | Env drift is a genuine production pain point for all multi-env Flagsmith users. |
| **Creativity** | No existing tool (official or third-party) combines drift + forensics + safe sync CLI. |
| **Demo quality** | One clear narrative: drift detected → plan → approve → apply → verified. |
| **Self-hosted support** | `FLAGSMITH_API_URL` works with any instance. `docker-compose.yml` included. |
| **Reusability** | Modular, documented, npm-distributable, tested, open-source. |
| **Developer experience** | Colour output, helpful errors, `--json` for CI, Markdown reports. |

---

## Summary

orqesta is complete as an MVP. The code builds, all tests pass, all CLI commands are wired and functional. The only remaining work is running it against a live Flagsmith instance for final validation and recording the demo video.
