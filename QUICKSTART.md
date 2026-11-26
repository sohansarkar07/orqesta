# 🚀 Orqesta — Quick Start (5 Minutes)

**For Toggle Wars Hackathon Judges & Users**

This guide gets Orqesta + self-hosted Flagsmith running in one command.

---

## ⚡ Option 1: Docker Compose (Recommended)

Runs **self-hosted Flagsmith** + **Orqesta** together.

### Prerequisites
- Docker + Docker Compose installed
- 5 minutes

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta

# 2. Start everything (Flagsmith + PostgreSQL + Orqesta)
docker-compose up -d

# 3. Wait 30 seconds for Flagsmith to initialize
sleep 30

# 4. Open Flagsmith UI
open http://localhost:8000
```

### First-Time Setup in Flagsmith UI:
1. **Create admin account** at http://localhost:8000
2. **Create an organisation** (e.g. "My Org")
3. **Create a project** (e.g. "Demo App")
4. **Create 2 environments**: `Staging` and `Production`
5. **Add 2-3 feature flags** in each environment
6. **Get API key**: Organisation Settings → API Keys → Copy token

### Connect Orqesta to Flagsmith:
1. **Open Orqesta**: http://localhost:3001
2. **Go to Settings** (sidebar)
3. **Paste your API key** (from step 6 above)
4. **Set API URL**: `http://flagsmith:8000/api/v1` (already pre-configured in Docker)
5. **Click Connect**

### Try It Out:
- **Overview**: See your projects and environments
- **Compare**: Select `Staging` → `Production` → see drift
- **Sync**: Generate a sync plan → review → apply
- **Forensics**: View audit log of all changes
- **Policy**: Run governance checks

---

## ⚡ Option 2: Local Development (npm)

Use cloud Flagsmith (or your own hosted instance).

### Prerequisites
- Node.js 18+
- Flagsmith account (https://flagsmith.com)

### Steps

```bash
# 1. Clone + install
git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
npm install

# 2. Start API server
npm run server
# Runs on http://localhost:3001

# 3. Start frontend (new terminal)
cd web
npm run dev
# Runs on http://localhost:5173
```

### Connect to Flagsmith:
1. **Get API key** from https://app.flagsmith.com → Organisation Settings → API Keys
2. **Open Orqesta**: http://localhost:5173/app/settings
3. **Paste API key** + click Connect

---

## ⚡ Option 3: CLI Only (No Web UI)

Just use the CLI commands directly.

```bash
# Install
npm install

# Configure
export FLAGSMITH_API_KEY=ser.xxxxxxxxxxxxxxxx
export FLAGSMITH_API_URL=https://api.flagsmith.com/api/v1

# Run commands
npm run cli -- compare Staging Production
npm run cli -- sync Staging Production --dry-run
npm run cli -- inspect my_feature --with-changes
npm run cli -- lint Production --policy ./examples/policy.yml
```

---

## 🎯 What to Try (Demo Script)

### 1. **Compare Environments**
```bash
# Web UI: Compare → Select project + Staging → Production
# CLI: npm run cli -- compare Staging Production
```
See drift in:
- Enabled states
- Remote config values
- Multivariate allocations
- Missing flags

### 2. **Sync Environments**
```bash
# Web UI: Sync → Generate Plan → Review → Apply (or Dry-run)
# CLI: npm run cli -- sync Staging Production --dry-run
```
Features:
- Interactive approval (select which operations to apply)
- Dry-run mode (preview without changes)
- Stale-plan protection (detects concurrent changes)

### 3. **Audit Log (Forensics)**
```bash
# Web UI: Forensics → Select project + environment
# CLI: npm run cli -- inspect my_feature --with-changes
```
Shows:
- Who changed what
- When
- Before/after values for each field

### 4. **Policy Checks**
```bash
# Web UI: Policy → Run Policy Check
# CLI: npm run cli -- lint Production --policy ./examples/policy.yml
```
Built-in rules:
- Naming conventions (snake_case)
- Required descriptions
- No archived flags enabled
- Multivariate allocation validation
- Cross-environment parity checks

---

## 📊 Expected Output

### After `docker-compose up`:
```
✓ PostgreSQL started on :5432
✓ Flagsmith started on :8000
✓ Orqesta started on :3001
```

### After connecting in UI:
```
✓ Connected to Flagsmith
  Org: My Org
  Projects: 1
  Environments: 2
```

### After running Compare:
```
Environment Comparison
Staging → Production

4 DIFFERENCES
├─ 1 Enabled state
├─ 2 Value changes
└─ 1 Missing in target
```

---

## 🐛 Troubleshooting

### "Cannot connect to Flagsmith"
- **Docker**: Wait 60s for Flagsmith to fully start: `docker-compose logs flagsmith`
- **Cloud**: Check API key is valid and has Organisation scope

### "Port 3001 already in use"
```bash
# Kill existing process
lsof -ti:3001 | xargs kill -9

# Or change port
PORT=4001 npm run server
```

### "No projects found"
- Create a project + environment in Flagsmith UI first
- Make sure API key has correct scope (Organisation-level)

---

## 📚 Next Steps

- **Full docs**: [README.md](./README.md)
- **API docs**: http://localhost:3001/api/health
- **Example policy**: [examples/policy.yml](./examples/policy.yml)
- **Tests**: `npm test` (95 tests)

---

## 🎥 Video Demo

[TODO: Add Loom/YouTube link for hackathon submission]

---

**Built for Toggle Wars Hackathon — Track 03: Build on Open Source Flagsmith**
