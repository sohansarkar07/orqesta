# orqesta — Technical Feasibility Investigation

> Completed before any code is written.  
> Sources: official Flagsmith docs, Flagsmith CLI GitHub repo, Flagsmith API reference.

---

## 1. What the Official Flagsmith CLI Already Supports

The Flagsmith CLI (`@flagsmith/cli`, v2.0.0, written in Go) covers:

| CLI Area | Commands |
|---|---|
| Auth | `login`, `logout`, `auth status`, `auth token` |
| Project / Org | `organisation list/get/create/update/delete`, `project list/get/create/update/delete` |
| Environments | `environment list/get/create/update/delete/clone`, `environment key list/create/delete`, `environment document` |
| Features | `feature list/get/create/update/delete`, `feature variant list/add/update/delete` |
| Flags | `flag list`, `flag get`, `flag update`, `flag enable/disable`, `flag delete` |
| Segments | `segment list/get/create/update/delete` |
| Evaluation | `evaluate` (simulate what an SDK resolves) |
| Raw API | `flagsmith api <path>` (curl-like proxy) |
| Config | `init` (writes `flagsmith.json`), `config` (show context) |

**What it does NOT do:**

- No cross-environment drift comparison.
- No synchronisation planning or selective sync.
- No audit-log inspection from the CLI.
- No "investigate a specific flag's history" workflow.
- No dry-run / preview of proposed changes.
- No conflict detection before writing.
- No post-sync verification.
- No human-approval gate before modifying production.
- No report generation (Markdown, JSON, HTML).

This confirms that **orqesta fills a genuine gap** in the existing toolchain. All planned modules are additive, not duplicative.

---

## 2. Flagsmith API — Endpoints Needed for orqesta

Authentication: Organisation API Token in `Authorization: Token <key>` header.  
Base URL: `https://api.flagsmith.com/api/v1/` (cloud) or configurable for self-hosted.

### 2.1 Project & Environment Discovery

| Operation | Endpoint | Method | Status |
|---|---|---|---|
| List organisations | `GET /organisations/` | GET | Confirmed |
| List projects | `GET /projects/?organisation=<id>` | GET | Confirmed |
| List environments | `GET /environments/?project=<id>` | GET | Confirmed |
| Get environment detail | `GET /environments/<api-key>/` | GET | Confirmed |

### 2.2 Feature & Flag Retrieval (per environment)

| Operation | Endpoint | Method | Status |
|---|---|---|---|
| List features (project-level) | `GET /projects/<id>/features/` | GET | Confirmed |
| List feature states (env-level) | `GET /environments/<api-key>/featurestates/` | GET | Confirmed |
| Get feature state | `GET /environments/<api-key>/featurestates/<id>/` | GET | Confirmed |
| List multivariate feature states | included in feature state response | — | Confirmed |

**Key fields in a feature state response:**

```json
{
  "id": 123,
  "feature": { "id": 1, "name": "checkout_redesign", "type": "STANDARD" },
  "enabled": true,
  "feature_state_value": "variant_b",
  "multivariate_feature_state_values": [
    { "multivariate_feature_option": 1, "percentage_allocation": 50 }
  ]
}
```

### 2.3 Segment Retrieval

| Operation | Endpoint | Method | Status |
|---|---|---|---|
| List segments | `GET /projects/<id>/segments/` | GET | Confirmed (CLI: `segment list`) |
| Get segment rules | `GET /projects/<id>/segments/<id>/` | GET | Confirmed (CLI: `segment get`) |
| List segment overrides | `GET /environments/<api-key>/featurestates/?feature=<id>` with segment filter | GET | Needs verification |

### 2.4 Audit Log

| Operation | Endpoint | Method | Status |
|---|---|---|---|
| List audit events | `GET /audit/?project=<id>` | GET | Confirmed (dashboard uses it) |
| Filter by environment | `?environment=<id>` | — | Confirmed |
| Filter by feature flag | `?feature_name=<name>` | — | Confirmed |

**Audit log event shape (from webhook docs, management API mirrors this):**

```json
{
  "created_date": "2020-02-23T17:30:57Z",
  "log": "Flag state changed: checkout_redesign",
  "author": { "id": 3, "email": "user@domain.com", "first_name": "Kyle", "last_name": "Johnson" },
  "environment": { "id": 1, "name": "Production" },
  "project": { "id": 6, "name": "Project name" },
  "related_object_id": 6,
  "related_object_type": "FEATURE_STATE"
}
```

**Important limitation:** The audit log records the event and actor but does **not** expose previous and new field values as structured data. It stores a human-readable `log` string, not a before/after JSON diff. orqesta must construct diffs by comparing snapshots, not by reading historical values from the audit log.

### 2.5 Supported Configuration Update Operations

| Operation | Endpoint | Method | Status |
|---|---|---|---|
| Update feature state (enabled, value) | `PUT /environments/<api-key>/featurestates/<id>/` | PUT | Confirmed |
| Partial update feature state | `PATCH /environments/<api-key>/featurestates/<id>/` | PATCH | Confirmed |
| Create feature state (new flag in env) | `POST /environments/<api-key>/featurestates/` | POST | Confirmed |
| Update multivariate allocations | Included in PUT to feature state | — | Confirmed |
| Clone environment | `POST /environments/<api-key>/clone/` | POST | Confirmed (CLI: `environment clone`) |

**Segment override sync:** Segment overrides are stored as feature states linked to a segment. Syncing them uses the same feature state PUT/PATCH endpoints but requires the target segment to exist in the target environment with a matching ID or name. This is a dependency orqesta's planner must check.

### 2.6 Environment Document (Local Evaluation JSON)

The CLI exposes `environment document` which calls `GET /environment-document/` with the server-side SDK key. This returns the full environment JSON including all feature states, segment rules and identities. **This is extremely useful for orqesta's drift detection** — it is a single call that retrieves the complete environment snapshot.

---

## 3. Capability Matrix

| Capability | Status | Endpoint / Source | Implementation Decision |
|---|---|---|---|
| Organisation/project/env discovery | ✅ Confirmed | `GET /organisations/`, `/projects/`, `/environments/` | Use directly |
| Feature list (project level) | ✅ Confirmed | `GET /projects/<id>/features/` | Use directly |
| Feature state retrieval (env level) | ✅ Confirmed | `GET /environments/<key>/featurestates/` | Core of drift detection |
| Full environment snapshot | ✅ Confirmed | `GET /environment-document/` (server-side SDK key) | Use for fast diff |
| Multivariate variant states | ✅ Confirmed | Included in feature state response | Compare allocations |
| Segment definitions (rules) | ✅ Confirmed | `GET /projects/<id>/segments/<id>/` | Compare rule trees |
| Segment overrides per feature | ⚠️ Partially confirmed | Feature state with segment field | Verify segment ID mapping across envs |
| Audit log (events + actor) | ✅ Confirmed | `GET /audit/?project=<id>&environment=<id>` | Show events, actor, timestamp |
| Audit log (before/after values) | ❌ Not supported | Not in API response | Construct diffs from snapshots instead |
| Selective feature state update | ✅ Confirmed | `PUT/PATCH /environments/<key>/featurestates/<id>/` | Use for sync |
| Environment clone (full copy) | ✅ Confirmed | `POST /environments/<key>/clone/` | Not used for selective sync |
| Change Requests (approval gate) | ⚠️ Scale-Up/Enterprise only | `/change-requests/` | orqesta provides its own approval gate |
| Feature versioning history | ⚠️ Enterprise only | `EF_VERSION` audit events | Treat as bonus if available |
| Post-sync verification | ✅ Confirmed | Re-fetch feature states after apply | Re-read and compare |
| Identity overrides comparison | ⚠️ Needs investigation | Edge API identities endpoint | Descope for MVP |

---

## 4. What orqesta Can Realistically Build in This Hackathon

### Confirmed Buildable (P0 — MVP)

1. **Connect and authenticate** to Flagsmith Cloud or self-hosted using `FLAGSMITH_API_KEY`.
2. **Discover** organisations, projects, environments.
3. **Retrieve full feature state snapshots** for two environments.
4. **Drift detection** — compare enabled state, value, and multivariate allocations for every flag.
5. **Readable diff output** in the terminal (colour-coded, categorised).
6. **JSON report** of drift.
7. **Synchronisation planner** — given diff output, produce a list of `PATCH` operations.
8. **Dry-run** — show what would change without calling any write API.
9. **Human approval gate** — interactive confirmation before applying.
10. **Apply** — execute PATCH operations against target environment.
11. **Verify** — re-fetch the target after apply and check that expected states now match.
12. **Audit log display** — show recent events for a flag with actor and timestamp.
13. **Markdown and JSON report export**.

### Buildable with Effort (P1)

1. **Segment rule diff** — compare rule trees and show readable rule-level differences.
2. **`orqesta inspect <feature>`** — show audit events and reconstructed history for one flag.
3. **Segment override sync** — sync segment overrides if segment IDs match across environments.

### Not Realistic in Hackathon Scope (P2)

1. **Before/after values in audit log** — not exposed by the API; would need historical snapshot storage.
2. **Change Request integration** — requires paid Flagsmith plan.
3. **Identity override comparison** — scope complexity is high.
4. **Full HTML report** — deprioritise in favour of Markdown.

---

## 5. Key Technical Decisions

### Language: TypeScript on Node.js
Justified: strong typing for API response validation, good ecosystem, easy npm distribution, `commander` or `yargs` for CLI, `zod` for schema validation, `axios` or `node-fetch` for HTTP.

### Drift Algorithm
1. Fetch `environment document` for environment A (single call, complete snapshot).
2. Fetch `environment document` for environment B.
3. Build a normalised map `flagName → { enabled, value, mvVariants }` for each env.
4. Walk both maps and produce a typed diff list.

The environment document endpoint is the most efficient approach — one HTTP call per environment instead of paginated feature state polling.

### Sync Plan
Diff output is an array of `DriftItem` objects. Each item maps to exactly one PATCH call.  
Before applying, orqesta re-fetches the current state to check it still matches the diff's source snapshot (staleness guard).

### Approval Gate
Interactive terminal prompt (single keypress: `y/N`). `--yes` flag bypasses for CI. `--dry-run` never reaches the prompt.

### Credentials
Stored in `.Orqestarc` (JSON) or read from environment variables:
- `FLAGSMITH_API_KEY` — Management API token.
- `FLAGSMITH_API_URL` — Override for self-hosted (default: `https://api.flagsmith.com`).

Never logged, never committed to source control.

### Output Modes
- Default: colour terminal with `chalk`.
- `--json`: machine-readable structured output.
- `--output report.md`: Markdown file.

---

## 6. What orqesta Does NOT Overlap With

| Existing Flagsmith Feature | orqesta Relationship |
|---|---|
| Dashboard environment view | Provides CLI equivalent + drift summary the dashboard doesn't have |
| `flagsmith environment clone` | Clone copies everything; orqesta does selective, reviewable sync |
| `flagsmith flag list` | Lists one env; orqesta compares two and surfaces differences |
| `flagsmith flag update` | Single flag; orqesta plans and applies a batch from a diff |
| Audit log in dashboard | Web UI only; orqesta brings it to CLI with structured output |
| Change Requests (paid) | orqesta provides its own approval gate for all plans |

---

## 7. Recommended MVP Implementation Sequence

**Step 1 — Scaffold and config (Day 1 morning)**
- TypeScript project, `commander` CLI, `zod`, `axios`, `chalk`, `ora`.
- `orqesta doctor` — validate config and connectivity.
- `orqesta environments` — list projects and environments.

**Step 2 — Drift detection (Day 1 afternoon)**
- `orqesta compare <env-a> <env-b>` — fetch environment documents, diff, display.
- JSON output mode.

**Step 3 — Sync planning and dry-run (Day 2 morning)**
- `orqesta plan <source> <target>` — generate typed plan from diff.
- `orqesta apply --dry-run` — print plan, make no writes.

**Step 4 — Apply and verify (Day 2 afternoon)**
- `orqesta apply` — approval prompt, staleness guard, PATCH, verify.
- `orqesta verify <source> <target>` — post-apply re-check.

**Step 5 — Audit forensics (Day 3 morning)**
- `orqesta inspect <feature>` — fetch audit events, display with actor and timestamp.
- `orqesta history <feature>` — chronological audit event list.

**Step 6 — Reports and polish (Day 3 afternoon)**
- `orqesta report --format markdown` — full drift + sync report.
- README, example outputs, tests.

**Step 7 — Demo prep and final tests (Day 4)**
- End-to-end test with real Flagsmith instance.
- Demo video recording.

---

## 8. Known Limitations (to Document in README)

1. Audit log does not expose before/after field values. orqesta shows the event and actor, not a structured before/after diff.
2. Segment override sync requires segment IDs to match across environments. Cross-environment segment IDs are only identical when environments share the same project (which is the normal case in Flagsmith).
3. Identity overrides are out of scope for the MVP.
4. Change Requests (Flagsmith's paid approval flow) are not integrated. orqesta's own approval gate is used instead.
5. Feature versioning (Enterprise) history is not used.
6. orqesta reads and writes using the Management API Token. It requires at minimum View Environment and Update Feature State permissions.
