# orqesta Quick Start — Full Demo Scenario

This guide takes you from zero to a complete orqesta demo in 10 minutes.

---

## Step 1: Choose Your Flagsmith Instance

### Option A: Flagsmith Cloud (Recommended — Zero Setup)

1. Go to https://app.flagsmith.com/signup
2. Create a free account
3. Skip to **Step 3** below

### Option B: Self-Hosted (Requires Docker)

If you have Docker Desktop or Docker Engine installed:

```powershell
# From Windows PowerShell in d:\orqesta:
cd d:\orqesta
docker compose up -d
```

Wait 60 seconds, then open http://localhost:8000 in your browser.

If you don't have Docker, see `SETUP_FLAGSMITH.md` for installation instructions.

---

## Step 2: Set Up Flagsmith (First-Time Setup)

If using **Flagsmith Cloud**, you're logged in already after signup.

If using **self-hosted** (http://localhost:8000):
1. Open http://localhost:8000
2. Create your admin account
3. Create an organisation

---

## Step 3: Create the Demo Project

1. **Create a project** called **"orqesta Demo"**
2. **Create two environments** in that project:
   - `Staging`
   - `Production`

---

## Step 4: Create Feature Flags with Intentional Drift

In the Flagsmith dashboard:

### Flag 1: `checkout_redesign` (enabled state drift)

1. Create a new flag: **`checkout_redesign`** (Boolean, no value)
2. In **Staging**: Enable it
3. In **Production**: Leave it disabled
4. **Make a few toggle changes in Staging** to generate audit log entries

### Flag 2: `hero_text` (value drift)

1. Create a new flag: **`hero_text`** (String)
2. In **Staging**: Set value to `"Save 20% Today"`
3. In **Production**: Set value to `"Free Shipping"`

### Flag 3: `dark_mode` (no drift — control)

1. Create a new flag: **`dark_mode`** (Boolean)
2. Leave it **disabled in both** Staging and Production

### Optional: Flag 4: `ab_test_button` (multivariate drift)

1. Create a multivariate flag: **`ab_test_button`**
2. Add two variants: `variant_a`, `variant_b`
3. In **Staging**: Set allocations to 50% / 50%
4. In **Production**: Set allocations to 70% / 30%

---

## Step 5: Get Your API Token

1. Go to **Organisation Settings** → **API Keys**
2. Copy your **Organisation API Token** (starts with `ser.` for cloud)
3. Keep it safe — this is your Management API credential

---

## Step 6: Configure orqesta

Open PowerShell in `d:\orqesta`:

```powershell
cd d:\orqesta

# Set your API token
$env:FLAGSMITH_API_KEY = "your_token_here"

# If using self-hosted:
# $env:FLAGSMITH_API_URL = "http://localhost:8000/api/v1"

# Verify connectivity
node dist/cli/index.js doctor
```

Expected output:
```
✓  API key configured
   source: environment variable

✓  API connectivity
   Connected — 1 organisation(s) accessible

All checks passed. orqesta is ready to use.
```

---

## Step 7: Run the Full Demo Workflow

### 7.1 Discover Environments

```powershell
node dist/cli/index.js environments
```

You should see your "orqesta Demo" project with Staging and Production listed.

### 7.2 Detect Drift

```powershell
node dist/cli/index.js compare Staging Production
```

Expected output:
```
Drift: Staging → Production

  Enabled state differences
    → checkout_redesign  enabled → disabled

  Value differences
    → hero_text
        source: "Save 20% Today"
        target: "Free Shipping"

  3 differences — 1 enabled-state, 1 value
```

### 7.3 Inspect Audit Log

```powershell
node dist/cli/index.js inspect checkout_redesign
```

You'll see the toggle events you created in Step 4, with timestamps and actor info.

### 7.4 Generate Sync Plan

```powershell
node dist/cli/index.js plan Staging Production
```

orqesta builds a typed, checksummed plan showing exactly what will change.

### 7.5 Preview (Dry-Run)

```powershell
node dist/cli/index.js apply --dry-run
```

Shows what _would_ happen, **without touching Production**.

### 7.6 Apply to Production (Interactive Approval)

```powershell
node dist/cli/index.js apply
```

orqesta shows the plan again, then asks:
```
? Apply these changes to the target environment? (y/N)
```

Type `y` and press Enter. It applies the changes and runs automatic verification.

### 7.7 Verify Result

```powershell
node dist/cli/index.js verify Staging Production
```

Should now report:
```
✓ Verification passed — Staging and Production are in sync
```

### 7.8 Generate Markdown Report

```powershell
node dist/cli/index.js report Staging Production --output demo-report.md
```

Open `demo-report.md` to see the full drift and sync report.

---

## Step 8: Check the Result in Flagsmith

Go back to the Flagsmith dashboard → Production environment.

- `checkout_redesign` should now be **enabled** (synced from Staging)
- `hero_text` should now be `"Save 20% Today"` (synced from Staging)
- Audit log should show the changes made by orqesta

---

## Step 9: Record Demo Video

Use screen recording software (OBS, Windows Game Bar, Loom) to record your terminal and browser:

1. Show the Flagsmith dashboard with the drift (Staging vs Production)
2. Run `orqesta compare Staging Production` — drift shown
3. Run `orqesta plan Staging Production` — plan generated
4. Run `orqesta apply` — approval gate → apply
5. Show the Flagsmith dashboard with Production now matching Staging
6. Run `orqesta verify Staging Production` — verification passed

Keep it under 3 minutes. Focus on the problem → solution → result story.

---

## Troubleshooting

### "No Flagsmith API key configured"

Set the environment variable:
```powershell
$env:FLAGSMITH_API_KEY = "your_token"
```

### "Authentication failed"

Your token might be incorrect. Re-copy it from Organisation Settings → API Keys.

### "Environment not found"

Check the name matches exactly (case-insensitive but check for typos). Run:
```powershell
node dist/cli/index.js environments
```
to see all available environments.

### "No drift detected"

Your flags are already in sync. Intentionally change a flag in Staging to create drift.

### Docker Compose fails

Ensure Docker Desktop is running. Check:
```powershell
docker ps
```

If containers aren't listed, restart:
```powershell
docker compose down
docker compose up -d
```

---

## What's Next?

- Push orqesta to a **public GitHub repository**
- Write a 2-minute description of the problem and solution
- Upload your demo video to YouTube or Loom
- Submit to **Toggle Wars — Track 03: Build on Open Source Flagsmith**
- Share the repo link, video link, and brief description

**Good luck!** 🚀
