# Flagsmith Self-Hosted Setup Instructions

Since Docker requires interactive sudo in WSL, here are three options:

---

## Option 1: Use Flagsmith Cloud (Fastest — Recommended for Demo)

1. Go to https://app.flagsmith.com/signup
2. Sign up for a free account
3. Create an organisation
4. Create a project (e.g. "orqesta Demo")
5. Create two environments:
   - **Staging**
   - **Production**
6. Create a few feature flags with different states in each environment:
   - `checkout_redesign` — enabled in Staging, disabled in Production
   - `hero_text` — set value "New Design" in Staging, "Old Design" in Production
   - `dark_mode` — disabled in both (no drift)
7. Get your **Organisation API Token**:
   - Organisation Settings → API Keys
   - Copy the token
8. Configure orqesta:
   ```bash
   cd d:\orqesta
   $env:FLAGSMITH_API_KEY = "your_token_here"
   node dist/cli/index.js doctor
   ```

Then run the demo workflow.

---

## Option 2: Self-Hosted with Docker Desktop (Windows GUI)

1. Download and install Docker Desktop for Windows:
   - https://www.docker.com/products/docker-desktop/
   - Restart Windows after installation
   - Ensure "Use WSL 2 based engine" is enabled in Docker Desktop settings

2. Download Flagsmith's docker-compose.yml:
   ```powershell
   cd d:\orqesta
   curl -o docker-compose.yml https://raw.githubusercontent.com/Flagsmith/flagsmith/main/docker-compose.yml
   ```

3. Start Flagsmith:
   ```powershell
   docker-compose up -d
   ```

4. Wait 1-2 minutes for services to initialize, then open:
   - http://localhost:8000

5. Create your admin account, organisation, project, and environments.

6. Get the Organisation API Token from Organisation Settings → API Keys.

7. Configure orqesta:
   ```powershell
   cd d:\orqesta
   $env:FLAGSMITH_API_KEY = "your_token"
   $env:FLAGSMITH_API_URL = "http://localhost:8000/api/v1"
   node dist/cli/index.js doctor
   ```

---

## Option 3: Self-Hosted in WSL2 (Manual Setup)

If you prefer Docker in WSL without Desktop:

1. Open WSL Ubuntu:
   ```powershell
   wsl -d Ubuntu
   ```

2. Inside WSL, install Docker Engine:
   ```bash
   # Update apt
   sudo apt-get update

   # Install prerequisites
   sudo apt-get install -y ca-certificates curl gnupg lsb-release

   # Add Docker's official GPG key
   sudo mkdir -p /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

   # Set up the repository
   echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
     $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

   # Install Docker Engine
   sudo apt-get update
   sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

   # Start Docker
   sudo service docker start

   # Test
   sudo docker run hello-world
   ```

3. Download Flagsmith docker-compose:
   ```bash
   cd /mnt/d/orqesta
   curl -o docker-compose.yml https://raw.githubusercontent.com/Flagsmith/flagsmith/main/docker-compose.yml
   ```

4. Start Flagsmith:
   ```bash
   sudo docker compose up -d
   ```

5. Access from Windows browser: http://localhost:8000

6. Follow the same setup as Option 2 for creating organisations, projects, and flags.

---

## Recommended: Use Flagsmith Cloud

**For the hackathon demo, Flagsmith Cloud is the fastest option.** It's free, official, production-grade, and skips all Docker complexity. orqesta supports both cloud and self-hosted instances identically — just set `FLAGSMITH_API_URL` for self-hosted.

Once you have an API token, run:

```powershell
cd d:\orqesta
$env:FLAGSMITH_API_KEY = "your_token_here"
node dist/cli/index.js doctor
node dist/cli/index.js environments
node dist/cli/index.js compare Staging Production
```

---

## Demo Scenario Setup (After You Have Flagsmith Running)

1. Create a project called **"orqesta Demo"**
2. Create two environments:
   - **Staging**
   - **Production**

3. Create these feature flags:

   | Flag Name | Type | Staging | Production | Purpose |
   |---|---|---|---|---|
   | `checkout_redesign` | Boolean | Enabled | Disabled | Enabled-state drift |
   | `hero_text` | String | "Save 20% Today" | "Free Shipping" | Value drift |
   | `dark_mode` | Boolean | Disabled | Disabled | No drift (control) |
   | `ab_test_button` | Multivariate | 50/50 split | 70/30 split | Multivariate drift |

4. Make a few manual changes to `checkout_redesign` in Staging to generate audit log entries.

5. Get your Organisation API Token.

6. Run the full orqesta workflow:

```powershell
cd d:\orqesta

# Set credentials
$env:FLAGSMITH_API_KEY = "your_token"
# If self-hosted:
# $env:FLAGSMITH_API_URL = "http://localhost:8000/api/v1"

# Health check
node dist/cli/index.js doctor

# List environments
node dist/cli/index.js environments

# Detect drift
node dist/cli/index.js compare Staging Production

# Inspect one flag
node dist/cli/index.js inspect checkout_redesign

# Generate sync plan
node dist/cli/index.js plan Staging Production

# Preview (no changes)
node dist/cli/index.js apply --dry-run

# Apply (requires confirmation)
node dist/cli/index.js apply

# Verify
node dist/cli/index.js verify Staging Production

# Generate report
node dist/cli/index.js report Staging Production --output demo-report.md
```

7. Record your screen while running this workflow.

8. Push to GitHub and submit to Toggle Wars with the demo video.

---

**Next step:** Choose an option, set up Flagsmith, and I'll help you run the demo scenario and record it.
