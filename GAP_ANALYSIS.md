# orqesta — Flagsmith Capability Gap Analysis

**Research date:** November 2026  
**Sources:** Flagsmith GitHub source (`api/`), official docs, CLI README, MCP server repo  
**Method:** Source-first. Every claim traces to a file, endpoint, or doc page.

---

## 1. Audit Log — The Critical Correction

The earlier RESEARCH.md stated: *"The audit log records the event and actor but does NOT expose previous and new field values as structured data."*

**This was wrong. The source proves otherwise.**

From `api/audit/serializers.py`:

```python
class AuditLogRetrieveSerializer(serializers.ModelSerializer):
    change_details = serializers.SerializerMethodField()
    change_type = serializers.SerializerMethodField()

    def get_change_details(self, instance: AuditLog) -> list[AuditLogChangeDetail]:
        if history_record := instance.history_record:
            return AuditLogChangeDetailsSerializer(
                instance=history_record.get_change_details(),
                many=True,
            ).data
        return []
```

From `api/audit/types.py`:

```python
class AuditLogChangeDetail(TypedDict):
    field: str
    old: int | float | str | bool | None
    new: int | float | str | bool | None
```

**Confirmed:** `GET /api/v1/audit/<id>/` (single entry retrieve) returns structured `change_details` with `field`, `old`, and `new` values, plus `change_type` (CREATE / UPDATE / DELETE / UNKNOWN). The list endpoint (`GET /api/v1/audit/`) does not include `change_details`. Only the single-record retrieve does.

**Availability:** This is in the open-source codebase. It works with self-hosted Flagsmith. The `history_record_class_path` and `history_record_id` fields on `AuditLog` are populated for most event types (the source notes some segment override priority changes may not have them).

**Impact on orqesta:** orqesta's `inspect` command currently calls the list endpoint and says structured before/after values are unavailable. This is incorrect. After fetching the list, orqesta must call the retrieve endpoint for each entry to get `change_details`.

---

## 2. Full Platform Capability Matrix

### 2.1 Web Dashboard

| Capability | Exists in Dashboard | Detail |
|---|---|---|
| View flags per environment | ✅ ALREADY EXISTS | Full list, state, value, segment overrides |
| Compare two environments | ❌ NOT EXISTS | No side-by-side diff view anywhere in the dashboard |
| Cross-env drift summary | ❌ NOT EXISTS | No concept of drift in the UI |
| Audit log (search, filter) | ✅ ALREADY EXISTS | Per-project, filterable, paginated |
| Audit log before/after values | ✅ ALREADY EXISTS | Available in single-entry detail view (confirmed in source) |
| Environment clone | ✅ ALREADY EXISTS | POST /environments/<key>/clone/ — full copy, not selective |
| Selective sync between envs | ❌ NOT EXISTS | No capability; clone is all-or-nothing |
| Sync plan with dry-run | ❌ NOT EXISTS | Does not exist |
| Human approval gate for sync | ⚠️ PARTIALLY EXISTS | Change Requests (Scale-Up / Enterprise only) |
| Scheduled flag changes | ⚠️ PARTIALLY EXISTS | Scale-Up / Enterprise only |
| Feature health monitoring | ✅ ALREADY EXISTS | Grafana/Prometheus/webhook integration |
| Release pipelines | ✅ ALREADY EXISTS | Closed beta, immutable once published |
| Feature versioning history | ⚠️ PARTIALLY EXISTS | Available on v2 environments only; visibility capped by plan |

### 2.2 Management API

| Endpoint | What It Does | Confirmed |
|---|---|---|
| `GET /organisations/` | List orgs | ✅ |
| `GET /projects/?organisation=<id>` | List projects | ✅ |
| `GET /environments/?project=<id>` | List environments | ✅ |
| `POST /environments/<key>/clone/` | Full environment clone | ✅ (source: `environments/views.py`) |
| `GET /environments/<key>/document` | Full environment document via management API | ✅ (source: `environments/views.py` `get_document` action) |
| `GET /environments/<key>/featurestates/` | List feature states | ✅ |
| `PATCH /environments/<key>/featurestates/<id>/` | Update a feature state | ✅ |
| `GET /audit/?project=<id>` | List audit events (no change_details) | ✅ |
| `GET /audit/<id>/` | Single audit entry with structured `change_details` | ✅ **CONFIRMED IN SOURCE** |
| `GET /projects/<id>/features/` | List features | ✅ |
| `GET /projects/<id>/segments/` | List segment definitions | ✅ |
| `GET /environments/<env>/featurestates/?feature=<id>` | Segment overrides for a feature | ✅ |

**Key gap confirmed in source:** The `GET /environments/<key>/document` endpoint on the management API (not the SDK endpoint) requires using the `api_key` as a lookup field and uses the `get_document` action on the `EnvironmentViewSet`. This is distinct from the SDK environment document endpoint that uses the server-side key. orqesta currently uses the SDK-style endpoint. The management API document endpoint uses the client-side `api_key` with the management token — this is cleaner and already accessible with our existing credentials.

### 2.3 Official Flagsmith CLI (`@flagsmith/cli` v2)

| Command | What It Does |
|---|---|
| `flag list` | Lists flags in one environment |
| `flag get <name>` | Gets one flag in one environment |
| `flag update <name>` | Toggles or sets value of one flag |
| `environment clone` | Full clone of one environment |
| `environment document` | Dumps the environment document JSON |
| `flagsmith api <path>` | Raw API proxy |
| `evaluate` | Simulates what an SDK resolves |

**What the official CLI does NOT have:**
- No cross-environment comparison (`diff` or `compare`)
- No drift report
- No selective sync (plan + apply)
- No dry-run for multi-flag operations
- No approval gate
- No audit log access
- No change history per flag
- No post-sync verification

### 2.4 Flagsmith MCP Server

The MCP server (`github.com/Flagsmith/flagsmith-mcp`) is auto-generated from the Flagsmith OpenAPI schema using Speakeasy. It exposes the raw Management API as MCP tools — one tool per endpoint. 

**What it provides:** Raw API access from an AI agent. Each endpoint is a callable tool.  
**What it does not provide:** Any higher-order workflow — no diff, no plan, no sync, no audit forensics, no structured change history.

The MCP server and orqesta serve completely different use cases. The MCP server is an AI coding tool. orqesta is a developer safety CLI.

### 2.5 Release Pipelines

- Closed beta (not generally available).
- Immutable once published — cannot be edited after publishing.
- Automates flag progression through defined stages, not drift remediation.
- Does not detect drift. Does not compare environments. Does not produce a selective sync plan.
- Orthogonal to orqesta's use case.

### 2.6 Feature Versioning (v2)

- Per-environment, opt-in (`use_v2_feature_versioning`).
- Tracks history of published versions for a feature within one environment.
- Access to version list: `GET /environments/<id>/features/<id>/versions/`
- Provides historical state snapshots per feature per environment.
- **Important:** Version history visibility is capped by subscription plan (`feature_history_visibility_days`). Self-hosted installations with no subscription metadata get unlimited visibility.
- **Does not** compare across environments.
- **Does not** produce a diff or sync plan.

### 2.7 Change Requests

- Scale-Up and Enterprise plans only.
- Provides a four-eyes workflow for individual flag changes.
- Does not cover bulk sync operations.
- Requires enabling per environment.
- Self-hosted open-source installations cannot use Change Requests without an Enterprise license.

---

## 3. Analysis of the Six Proposed Differentiators

### 3.1 Custom Configuration Policy Engine

**Proposed:** Define rules like "production flags must have descriptions" or "multivariate allocations must sum to 100%."

**What Flagsmith provides:**  
- No policy engine. No validation rules beyond basic data type constraints.
- The API enforces that multivariate allocations sum to 100% server-side, but nothing else.

**Classification:** EXTENSION OPPORTUNITY

**Gap:**  
No tooling exists to define or enforce custom policies across environments. Teams have no way to audit "which flags violate our conventions" without writing custom scripts.

**API support:**  
All needed data is available: flag names, descriptions, types, values, multivariate allocations, segment override counts via `GET /environments/<key>/featurestates/` and `GET /projects/<id>/features/`.

**Self-hosted:** Works fully. The APIs used are core Management API, available in open-source self-hosted.

**Proposed implementation:**  
A `orqesta lint` command. Loads a `.orqesta-policy.json` file (user-authored, committed to source control) containing rules, fetches the environment's current state, runs each rule, and reports violations. Rules could cover:
- Naming conventions (regex on flag name)
- Required description on production flags
- Max segment override count
- Flags enabled in production must also exist in staging
- Flags with multivariate options must have all options allocated

**Why use orqesta instead of Flagsmith dashboard:** The dashboard has no policy concept at all. This would be entirely new functionality.

---

### 3.2 Historical Configuration Snapshots and Time-Travel Comparison

**Proposed:** Compare an environment's current state against its state at a point in the past.

**What Flagsmith provides:**  
- **Audit log:** Events with timestamps, actors, and (via retrieve) structured `change_details` (field, old, new). Available via `GET /audit/<id>/`.
- **Feature versioning v2:** Per-feature version history within one environment. Gives exact state of a flag at each published version.
- **Neither** provides a full environment-level snapshot at an arbitrary past timestamp.

**Classification:** PARTIALLY EXISTS

**Gap:**  
The audit log gives event-by-event changes, not a reconstructed snapshot. Reconstructing "what did the entire environment look like at time T" requires replaying all audit events backwards from the current state — the API does not serve this directly. Feature versioning gives per-flag history within one environment, but not cross-environment and not for environments that haven't opted into v2.

**API support:**  
- `GET /audit/?project=<id>&environments=<id>` — get all events for an environment
- `GET /audit/<id>/` — get `change_details` (field, old, new) for a specific event
- Feature versioning v2 (if enabled): `GET /environments/<id>/features/<id>/versions/`

**Self-hosted:** Audit log fully available. Feature versioning v2 available on self-hosted, but history visibility may be limited depending on subscription metadata configured.

**Proposed implementation:**  
orqesta could implement a best-effort reconstruction: for each flag, walk backwards through audit events (using `change_details.old`) to reconstruct its state at a given time. This is approximate — events that predate the available audit window cannot be reconstructed. orqesta should be explicit about this limitation.

**Why use orqesta instead of Flagsmith dashboard:** The dashboard shows audit events as a timeline, not as a reconstructed snapshot. No "show me this flag's state 2 weeks ago" view exists.

---

### 3.3 Cross-Environment Policy Compliance

**Proposed:** Rules like "any flag enabled in Production must be enabled in Staging first" or "Production must not have flags absent from Staging."

**What Flagsmith provides:**  
Nothing. No cross-environment rules or checks.

**Classification:** EXTENSION OPPORTUNITY

**Gap:**  
Teams often have implicit conventions about environment promotion order. orqesta could make these explicit and checkable.

**API support:**  
Both environments' feature states are readable via `GET /environments/<key>/featurestates/`. Comparison is straightforward. This is essentially the drift detection already built, extended with configurable policy rules.

**Self-hosted:** Fully supported. All needed APIs are core Management API.

**Proposed implementation:**  
Extend the `lint` command (or separate `orqesta policy`) with cross-environment rules:
```json
{
  "rules": [
    { "type": "must_exist_in", "source": "Staging", "target": "Production" },
    { "type": "enabled_before", "source": "Production", "must_be_enabled_in": "Staging" }
  ]
}
```

**Why use orqesta instead of Flagsmith dashboard:** Completely new functionality. The dashboard has no cross-environment policy concept.

---

### 3.4 Configuration Risk Analysis with Explainable Findings

**Proposed:** "This sync will enable a flag in production that has never been tested in staging. Risk: HIGH."

**What Flagsmith provides:**  
- Feature health (unhealthy/healthy signals from observability providers) — this is reactive monitoring, not predictive risk.
- Release pipelines can abort on unhealthy flags, but this requires feature health integration and is closed beta.
- No pre-change risk scoring.

**Classification:** EXTENSION OPPORTUNITY

**Gap:**  
No tooling proactively explains why a proposed change might be risky before it is applied.

**API support:**  
orqesta already has all needed data for rule-based risk analysis:
- Is this flag new to the target environment? (`missing_in_target`)
- Was this flag previously enabled, then disabled, in the target? (audit log)
- How many segment overrides does it have? (featurestates)
- Is it a multivariate flag being changed? (feature type + allocations)
- How recently was it last changed? (audit log timestamp)

**Self-hosted:** Fully supported.

**Proposed implementation:**  
Add a risk score to each `SyncOperation` in the plan output. Scoring rules:
- `missing_in_target` → HIGH (enabling untested flag in production)
- `enabled_state`: false→true + not recently changed in source → MEDIUM
- `multivariate_allocation` change → MEDIUM (may affect live experiments)
- `value_change` on enabled flag → LOW-MEDIUM

Display the risk score in `plan` and `apply` output. Require typed confirmation ("type PRODUCTION to confirm") for HIGH-risk operations.

**Why use orqesta instead of Flagsmith dashboard:** The dashboard has no risk analysis. It applies changes immediately after confirmation. No pre-change risk scoring exists anywhere.

---

### 3.5 Selective Synchronisation with Stale-Plan Protection

**Proposed:** Generate a plan from a diff, let the developer select which changes to apply, and refuse to execute if the environments have changed since the plan was created.

**What Flagsmith provides:**  
- `POST /environments/<key>/clone/` — full clone, all-or-nothing, no preview, no dry-run, no selection.
- Change Requests — single-flag, human-approved writes. Scale-Up / Enterprise only. Not bulk, not cross-environment.
- No selective sync. No plan concept. No staleness detection.

**Classification:** EXTENSION OPPORTUNITY — **this is orqesta's clearest unique value**

**Gap:**  
Every path in Flagsmith to modify an environment is immediate (or Change-Request-gated on paid plans). No tool generates a reviewable, selective, dry-run-able sync plan from cross-environment drift.

**API support:**  
- `PATCH /environments/<key>/featurestates/<id>/` for applying individual changes — confirmed available.
- All diff data via featurestates endpoints — confirmed available.

**Self-hosted:** Fully supported. PATCH featurestates is core Management API available in all plans.

**Implementation status in orqesta:** Already built (`plan` + `apply` commands, checksum staleness guard, dry-run, approval prompt). The only gap is **the stale-plan check currently uses a checksum of operation IDs, not a live re-fetch of the target's current state.** The correct staleness guard should re-fetch the target environment's featurestates just before applying and verify that each target feature state's current value still matches the `currentValue` recorded in the plan. This is a correctness fix, not a new feature.

**Why use orqesta instead of Flagsmith dashboard or CLI:** The dashboard has no selective sync. The CLI's `environment clone` is all-or-nothing. No other tool offers plan → dry-run → approve → apply → verify for cross-environment flag synchronisation.

---

### 3.6 Advanced Environment Parity Analysis

**Proposed:** Deeper analysis than just enabled/value diff — including segment rule comparison, flag metadata consistency, and multi-environment matrix views.

**What Flagsmith provides:**  
- Dashboard shows flags per environment but not side by side.
- No segment-rule diff across environments.
- No flag metadata consistency checks (e.g. description present in one env but feature has no description in another — actually descriptions are project-level, so this is N/A).

**Classification:** PARTIALLY EXISTS (basic data available; analysis layer missing)

**Gap:**  
Segment overrides are per-environment but segment definitions are per-project. If the same segment exists in both environments with different overrides for a flag, the current orqesta diff sees this. What it does not currently do is compare segment rule definitions between project segments and flag-scoped feature-specific segments.

**API support:**  
- `GET /projects/<id>/segments/` — full segment rules
- Segment override feature states via `featurestates` with `feature_segment` field populated

**Self-hosted:** Fully supported.

**Proposed implementation:**  
Extend `compare` to include segment-override diff: for each flag, compare not just the environment default but also each segment override (by segment name, since IDs match within a project). Show "Segment 'beta_users': Staging=enabled, Production=disabled" in the diff output.

**Why use orqesta instead of Flagsmith dashboard:** The dashboard shows segment overrides per flag per environment, but only one at a time. No cross-environment segment override comparison exists.

---

## 4. Ranked Opportunities for Track 03

### #1 — Selective Sync with Stale-Plan Protection (EXTEND WHAT'S BUILT)

**Strength:** Genuine gap. No Flagsmith-provided tool does this. The official CLI cannot do selective sync. The dashboard cannot do it. Change Requests (paid) are single-flag, not bulk, and not cross-environment. This is confirmed unique functionality.

**Current orqesta status:** Largely built. Needs one correctness fix: the staleness guard should re-fetch and compare actual feature state values before applying, not just verify the checksum of operation IDs.

**Demo value:** High. The workflow is concrete and immediately understandable.

**Track 03 fit:** Strong. It is built on self-hosted Flagsmith, uses the Management API throughout, and solves a real problem.

---

### #2 — Structured Audit Forensics using `change_details` (FIX AND EXTEND WHAT'S BUILT)

**Strength:** The `GET /audit/<id>/` retrieve endpoint returns `change_details` with `field`, `old`, `new`. orqesta currently does not use this. Fixing `inspect` and `history` to call the retrieve endpoint gives genuine before/after field-level diffs — something the dashboard shows but the CLI cannot access at all.

**Current orqesta status:** Calls the list endpoint only. Incorrectly documents that before/after values are unavailable.

**Demo value:** High. "What changed, who changed it, what was the value before and after" is a compelling demo moment.

**Track 03 fit:** Strong. This directly uses open-source Flagsmith internals (the `history_record` mechanism) that are available on self-hosted. It adds CLI-accessible forensics that the dashboard has in the UI only.

---

### #3 — Configuration Policy Linting (`orqesta lint`)

**Strength:** Completely new functionality — Flagsmith has no policy engine at all. Teams have implicit conventions; orqesta makes them explicit and checkable in CI.

**Current orqesta status:** Not built.

**Demo value:** Medium-high. Requires authoring a policy file, which adds setup friction for a demo, but the output is clear and the value is obvious.

**Track 03 fit:** Good. Works with self-hosted, uses only core Management API, adds real developer workflow value.

---

## 5. Immediate Corrections Required in Existing orqesta Code

### Fix 1 — Staleness guard in `apply`

**File:** `src/sync/executor.ts` and `src/sync/planner.ts`  
**Problem:** Current staleness guard verifies a SHA-256 checksum of operation IDs. This only catches tampered plan files. It does not catch the case where the target environment was modified by someone else between `plan` and `apply`.  
**Fix:** Before applying each operation, re-fetch the target feature state and verify its current `enabled` and `feature_state_value` match the `currentValue` recorded in the plan. If they don't match, mark that operation as `stale` and skip it, reporting to the user.

### Fix 2 — Audit `inspect` and `history` commands use list endpoint only

**File:** `src/cli/commands/inspect.ts`, `src/cli/commands/history.ts`  
**Problem:** Both commands use `GET /audit/?project=<id>` which returns the list serializer. The list serializer does NOT include `change_details`. The retrieve serializer (`GET /audit/<id>/`) does.  
**Fix:** After fetching the list, for each entry where `related_object_type` is `FEATURE_STATE` or `FEATURE`, call `GET /audit/<id>/` to fetch `change_details` and display the structured before/after diff.

### Fix 3 — Document environment document endpoint correctly

**File:** `src/flagsmith/client.ts`  
**Problem:** `getEnvironmentDocument` uses a custom header `X-Environment-Key` and clears the `Authorization` header. But the management API's `/environments/<api_key>/document` action uses the management token and the client-side API key as a URL path segment. These are different endpoints.  
**Current usage in orqesta:** The `compare`, `plan`, `verify`, and `report` commands don't use `getEnvironmentDocument` at all — they call `getFeatureStates`. The `getEnvironmentDocument` method is dead code currently.  
**Fix:** Either remove `getEnvironmentDocument` or redirect it to `GET /environments/<api_key>/document/` using the management token (which is what the management API actually uses).

---

## 6. Summary Table

| Feature | Flagsmith | orqesta current | Priority |
|---|---|---|---|
| Cross-env drift detection | ❌ | ✅ built | — |
| Structured audit before/after (CLI) | ❌ CLI, ✅ dashboard | ⚠ uses list endpoint only | Fix 2 |
| Selective sync with dry-run | ❌ | ✅ built | — |
| Stale-plan protection (real) | ❌ | ⚠ checksum only | Fix 1 |
| Config policy linting | ❌ | ❌ not built | Build (P1) |
| Segment override diff | ❌ | ❌ not built | Build (P1) |
| Risk scoring on sync plan | ❌ | ❌ not built | Build (P1) |
| Environment clone (all-or-nothing) | ✅ | — | Out of scope |
| Change Requests (paid) | ✅ paid only | orqesta approval gate is free-tier equivalent | — |
| Feature health monitoring | ✅ | — | Out of scope |
| Release pipelines | ✅ beta | — | Out of scope |
