# Orqesta — Quick Start

Get Orqesta running in under 10 minutes.

---

## Option A — Docker (self-hosted Flagsmith + Orqesta)

Runs everything locally: Flagsmith, PostgreSQL, and Orqesta.

**Prerequisites:** Docker Desktop installed and running.

```bash
git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
docker compose up -d
```

Wait about 30 seconds for Flagsmith to initialise, then:

**1. Set up Flagsmith** — open http://localhost:8000
- Create an admin account
- Create an organisation (e.g. "Demo Org")
- Create a project (e.g. "Demo App")
- Create two environments: `Staging` and `Production`
- Add a few feature flags in each with different values

**2. Get your API token** — click your organisation name → **API Access** tab → **Create API Key** → copy the token

**3. Seed demo data** (optional — creates flags with intentional drift):

```bash
export ORQUESTA_API_TOKEN="your_token_here"
export ORQUESTA_API_URL="http://localhost:8000/api/v1"
npx tsx scripts/seed-demo-data.ts
```

**4. Open Orqesta** — http://localhost:3001
- Go to **Settings** (sidebar)
- Paste your API token
- Set API URL to `http://localhost:8000/api/v1`
- Click **Connect**

> **Note:** Use `http://localhost:8000/api/v1` in the Orqesta Settings UI (host-to-host).  
> The Docker Compose file already pre-sets `http://flagsmith:8000/api/v1` for container-to-container communication.

---

## Option B — Flagsmith Cloud + local dev

No Docker needed. Uses your existing Flagsmith Cloud account.

**Prerequisites:** Node.js 18+, Flagsmith account at https://flagsmith.com

```bash
git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
npm install
```

Get your token from https://app.flagsmith.com → Organisation name → API Access → Create API Key.

**Start the API server:**
```bash
export ORQUESTA_API_TOKEN="your_token_here"
npm run server
# Running at http://localhost:3001
```

**Start the web dashboard (new terminal):**
```bash
cd web
npm run dev
# Running at http://localhost:5173
```

Open http://localhost:5173/app — the dashboard will connect automatically using the token from your environment.

---

## Option C — CLI only

```bash
git clone https://github.com/sohansarkar07/orqesta.git
cd orqesta
npm install
npm run build
npm link

export ORQUESTA_API_TOKEN="your_token_here"
orqesta doctor
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ORQUESTA_API_TOKEN` | Yes | Flagsmith Organisation API token |
| `ORQUESTA_API_URL` | No | Management API URL (default: `https://api.flagsmith.com/api/v1`) |
| `ORQUESTA_ENVIRONMENT_KEY` | No | Server-side environment key (`ser.` prefix) — optional performance boost |
| `ORQUESTA_FLAGS_API_URL` | No | Flags API URL (default: `https://edge.api.flagsmith.com/api/v1`) |
| `FLAGSMITH_API_KEY` | No | Legacy alias for `ORQUESTA_API_TOKEN` |

For self-hosted, set both `ORQUESTA_API_URL` and `ORQUESTA_FLAGS_API_URL` to your instance URL.

---

## First commands to try

```bash
# 1. Confirm connectivity
orqesta doctor

# 2. List your environments
orqesta environments

# 3. Detect drift
orqesta compare Staging Production

# 4. Generate sync plan
orqesta plan Staging Production

# 5. Preview without writing
orqesta apply --dry-run

# 6. Apply with confirmation gate
orqesta apply

# 7. Verify environments are now in sync
orqesta verify Staging Production

# 8. Run policy checks
orqesta lint Production

# 9. Check for audience allocation regressions (MV flags only)
orqesta guard Staging Production
```

---

## Troubleshooting

**"Management API connectivity" check fails**
- Verify your token is an Organisation API Token (from Organisation Settings → API Access), not an environment SDK key
- For self-hosted, confirm Flagsmith is running: `docker compose logs flagsmith`
- Run `orqesta doctor` — it shows which checks pass and which fail

**Docker: Orqesta connects to Flagsmith but sees no data**
- After creating your API token in the Flagsmith UI, update the Orqesta Settings page with the token and URL `http://localhost:8000/api/v1`

**"No projects found"**
- Create a project in the Flagsmith dashboard first, then run `orqesta environments`

**Port 3001 already in use**
```bash
PORT=4001 npm run server
```

**Self-hosted Flagsmith not starting**
```bash
docker compose logs flagsmith
# Common cause: PostgreSQL not ready yet — wait 30s and try again
```

**Secret masking**  
API tokens are never sent to the browser and never logged. The dashboard and all CLI output show masked versions like `Md2C…xJeu`.
