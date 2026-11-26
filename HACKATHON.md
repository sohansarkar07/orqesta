# 🏆 Toggle Wars Hackathon Submission — Orqesta

**Track 03: Build on Open Source Flagsmith**

---

## 📋 Project Overview

**Name**: Orqesta  
**Tagline**: Flagsmith configuration safety, environment drift detection, change forensics and policy enforcement  
**GitHub**: https://github.com/sohansarkar07/orqesta  
**Live Demo**: [TODO: Add deployed URL or Loom video]

---

## ✅ Hackathon Requirements Met

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| **Self-hosted Flagsmith** | ✅ Yes | `docker-compose.yml` includes Flagsmith + PostgreSQL |
| **Integrations and plugins** | ✅ Yes | Express API proxy + React dashboard + CLI wrapper |
| **Developer tools** | ✅ Yes | 5 CLI commands, policy engine, drift detection, sync planner |
| **Easy for others to reuse** | ✅ Yes | One-command Docker setup, npm package, full docs |

---

## 🎯 Problem Statement

Teams using Flagsmith across multiple environments face three critical challenges:

### 1. **Configuration Drift**
- Flags get out of sync between Staging and Production
- No easy way to see what's different
- Risk of Production having wrong config

### 2. **Change Forensics**
- "Who enabled dark_mode in Production?"
- "What was the value before?"
- Flagsmith audit log exists but lacks field-level details in UI

### 3. **Policy Enforcement**
- No naming conventions enforced
- Production flags missing descriptions
- Archived flags accidentally left enabled
- No pre-deployment validation

---

## 💡 Solution: Orqesta

Orqesta extends Flagsmith with three core capabilities:

### 1. **Environment Drift Detection**
Compare any two environments and get a categorised report:
- ✅ Enabled state differences
- ✅ Remote config value changes
- ✅ Multivariate allocation differences
- ✅ Flags missing in target
- ✅ Extra flags in target (not in source)

**Demo**:
```bash
orqesta compare Staging Production
# or use Web UI: Compare page
```

### 2. **Selective Synchronisation with Stale-Plan Protection**
- Generate a typed sync plan from drift
- Preview with dry-run
- Interactive approval (select which operations to apply)
- **Stale-plan detection**: If another user changes Production between plan creation and apply, those operations are skipped (no silent overwrites)

**Demo**:
```bash
orqesta sync Staging Production --dry-run
# or use Web UI: Sync page
```

### 3. **Configuration Forensics**
- Fetch full audit history for any feature flag
- Display structured `change_details` (field-level before/after)
- Filter by project, environment, feature name
- Actor, timestamp, change type always shown

**Demo**:
```bash
orqesta inspect dark_mode --with-changes
# or use Web UI: Forensics page
```

### 4. **Policy Engine & Linting**
- Define team standards in YAML
- 5 built-in rules:
  - Naming conventions (snake_case)
  - Required descriptions (per environment)
  - No archived flags enabled
  - Multivariate allocation validation (must sum to 100%)
  - Cross-environment parity checks
- Exits with code 1 on errors — suitable for CI gates

**Demo**:
```bash
orqesta lint Production --policy ./examples/policy.yml
# or use Web UI: Policy page
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Orqesta (Your Server)                                      │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ CLI          │───▶│ Core Logic   │◀───│ React UI     │ │
│  │ 5 commands   │    │ - Comparator │    │ 6 pages      │ │
│  └──────────────┘    │ - Planner    │    └──────┬───────┘ │
│                      │ - Executor   │            │          │
│                      │ - Policy     │            │          │
│                      └──────┬───────┘            │          │
│                             │                    │          │
│                             │    ┌───────────────┘          │
│                             ▼    ▼                          │
│                      ┌──────────────┐                       │
│                      │ Express API  │                       │
│                      │ 15 endpoints │                       │
│                      └──────┬───────┘                       │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Flagsmith          │
                   │  (Cloud or Self-hosted)│
                   │  Management API     │
                   └─────────────────────┘
```

**Key Design Decisions**:
- **Management API tokens stored server-side only** (never sent to browser)
- **Plan snapshots held server-side** to verify no concurrent changes
- **Core logic shared** between CLI and Web UI (DRY principle)
- **TypeScript end-to-end** for type safety
- **95 unit tests** (76 CLI + 19 server)

---

## 🚀 Quick Start for Judges

### Option 1: Docker (Self-Hosted Flagsmith Included)

```bash
git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
docker-compose up -d

# Wait 30s for Flagsmith to initialize
sleep 30

# Open Flagsmith UI: http://localhost:8000
# 1. Create admin account
# 2. Create org + project + 2 environments (Staging, Production)
# 3. Add 2-3 feature flags
# 4. Get API key from Organisation Settings

# Open Orqesta UI: http://localhost:3001
# 5. Go to Settings → paste API key → Connect
# 6. Try Compare, Sync, Forensics, Policy pages
```

### Option 2: CLI Only

```bash
npm install
export FLAGSMITH_API_KEY=ser.xxxxxxxxxxxxxxxx
export FLAGSMITH_API_URL=https://api.flagsmith.com/api/v1

npm run cli -- compare Staging Production
npm run cli -- sync Staging Production --dry-run
npm run cli -- inspect dark_mode --with-changes
npm run cli -- lint Production --policy ./examples/policy.yml
```

**Full guide**: [QUICKSTART.md](./QUICKSTART.md)

---

## 🎨 Features Showcase

### 1. Compare (Drift Detection)
**Screenshot**: [TODO: Add screenshot]

**What it shows**:
- Side-by-side comparison of Staging vs Production
- 4 drift categories with counts
- Table view: feature name, source value, target value, category
- CLI equivalent command hint

**Technical highlight**: Uses Flagsmith's `getFeatureStates()` to fetch all flags for both environments, then runs field-level comparison.

---

### 2. Sync (Plan & Apply)
**Screenshot**: [TODO: Add screenshot]

**What it shows**:
- Generated sync plan with operations (enable, disable, set_value)
- Checkboxes to select which operations to apply
- Dry-run mode (preview without changes)
- Stale-plan warning (if target changed since plan creation)
- Success/error summary after apply

**Technical highlight**: 
- Server stores `targetStateSnapshot` at plan creation
- Before apply, fetches current state and compares checksums
- If mismatch, skips affected operations and shows warning

---

### 3. Forensics (Audit Log)
**Screenshot**: [TODO: Add screenshot]

**What it shows**:
- Timeline of changes with actor, timestamp, environment
- Expandable change_details showing before/after field values
- Filter by project, environment, feature name
- Badge colors: CREATE (green), UPDATE (blue), DELETE (red)

**Technical highlight**: Calls Flagsmith's audit log API, then fetches individual entries to get structured `change_details`.

---

### 4. Policy (Linting)
**Screenshot**: [TODO: Add screenshot]

**What it shows**:
- Policy check results grouped by severity (error, warning, info)
- Compliance score progress bar
- Per-violation details: feature, rule ID, message, suggestion
- Custom YAML editor (or use default policy)

**Technical highlight**: Policy engine runs 5 built-in rules against live feature states. Each rule returns violations with severity. Errors cause CLI exit code 1 (fail CI build).

---

### 5. Settings (Connection)
**Screenshot**: [TODO: Add screenshot]

**What it shows**:
- Connection status (connected/not connected)
- Masked API key display
- Organisation name and count
- Connect/disconnect buttons

**Technical highlight**: API token is stored server-side only. Browser never sees the full token, only masked version (e.g., `ser.***abc123`).

---

## 📊 Technical Stats

| Metric | Value |
|--------|-------|
| **Total Lines of Code** | ~9,000+ |
| **TypeScript Files** | 65+ |
| **React Components** | 15+ |
| **API Endpoints** | 15 |
| **CLI Commands** | 5 |
| **Tests** | 95 (100% passing) |
| **Test Coverage** | High (all core logic tested) |
| **TypeScript Errors** | 0 |
| **ESLint Errors** | 0 |
| **Dependencies** | Minimal (express, chalk, zod, vitest) |

---

## 🔐 Security & Safety

### Security Features
- ✅ Management API tokens stored server-side only
- ✅ Tokens masked in all responses (`ser.***abc123`)
- ✅ CORS restricted to localhost origins
- ✅ No token storage in browser localStorage/cookies
- ✅ Plan snapshots kept server-side (not sent to client)

### Safety Features
- ✅ Dry-run mode for all write operations
- ✅ Interactive approval (user must confirm before apply)
- ✅ Stale-plan detection (concurrent change protection)
- ✅ Read-only operations always safe
- ✅ Production changes require explicit `y` or `--yes`

---

## 🧪 Testing

### Test Suites
1. **CLI unit tests** (76 tests)
   - DriftComparator: 15 tests
   - SyncPlanner: 12 tests
   - SyncExecutor: 10 tests
   - PolicyRunner: 18 tests
   - FlagsmithClient: 8 tests
   - Commands: 13 tests

2. **Server integration tests** (19 tests)
   - Settings routes: 5 tests
   - Compare routes: 4 tests
   - Sync routes: 10 tests (including stale-plan protection)

**Run tests**:
```bash
npm test              # all tests
npm run test:server   # server only
npm run test:cli      # CLI only
```

---

## 📦 Deployment

### Docker (Recommended)
```bash
docker build -t orqesta .
docker run -p 3001:3001 \
  -e FLAGSMITH_API_KEY=$YOUR_KEY \
  orqesta
```

### Docker Compose (Self-Hosted Flagsmith)
```bash
docker-compose up -d
# Runs Flagsmith + PostgreSQL + Orqesta together
```

### VPS/Cloud
```bash
npm ci
npm run build
export FLAGSMITH_API_KEY=your_key
npm run server
```

Supports: AWS, DigitalOcean, Fly.io, Railway, Heroku, Render

---

## 🎯 Why This Matters

### For Solo Developers
- Catch config drift before it reaches users
- Enforce naming conventions in personal projects
- Quick sync from Staging to Production

### For Teams
- **Safety**: Stale-plan protection prevents accidental overwrites
- **Governance**: Policy checks enforce team standards
- **Forensics**: "Who changed what and when?" answered instantly
- **CI/CD**: `orqesta lint` in CI fails build on policy violations

### For Organizations
- **Compliance**: Policy rules codify governance requirements
- **Audit trail**: Full change history with field-level details
- **Multi-environment**: Compare/sync across Dev/Staging/Prod/Canary
- **Self-hosted**: Run Orqesta + Flagsmith entirely on your infrastructure

---

## 🚧 Future Roadmap

### Next 3 Months
- [ ] WebSocket support for real-time audit log
- [ ] Drift alerts (notify on Slack/Discord when envs diverge)
- [ ] CI/CD integrations (GitHub Actions, GitLab CI templates)
- [ ] Export drift reports (CSV, JSON, PDF)
- [ ] Multi-org support (switch between orgs in UI)

### Next 6 Months
- [ ] Scheduled sync jobs (cron-based auto-sync)
- [ ] Approval workflows (Staging→Prod requires 2 approvers)
- [ ] Custom policy rule engine (user-defined rules)
- [ ] Rollback capability (revert to previous state)
- [ ] AI-powered drift explanations ("Why is this different?")

---

## 👥 Team

**Solo Developer**: [Your Name]  
**GitHub**: [@sohansarkar07](https://github.com/sohansarkar07)  
**Twitter/X**: [TODO: Add if applicable]  
**LinkedIn**: [TODO: Add if applicable]

---

## 📜 License

MIT License — see [LICENSE](./LICENSE)

---

## 🙏 Acknowledgments

- **Flagsmith**: For building an amazing open-source feature flag platform
- **WeMakeDevs**: For organizing Toggle Wars Hackathon
- **Community**: Everyone who tested and provided feedback

---

## 📹 Demo Video

[TODO: Add Loom or YouTube link — 3-5 minute walkthrough]

**What to show**:
1. Docker Compose startup (self-hosted Flagsmith)
2. Create org + project + flags in Flagsmith UI
3. Connect Orqesta to Flagsmith
4. Compare Staging vs Production (show drift)
5. Generate sync plan → review → apply
6. View audit log in Forensics
7. Run policy checks → show violations

---

## 📧 Contact

Questions? Reach out:
- **GitHub Issues**: https://github.com/sohansarkar07/orqesta/issues
- **Email**: [TODO: Add if public]
- **Discord**: [TODO: Add if applicable]

---

**Built with ❤️ for Toggle Wars Hackathon — Track 03: Build on Open Source Flagsmith**
