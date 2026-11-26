#!/usr/bin/env bash
# install-docker-wsl.sh
# Run this INSIDE WSL Ubuntu to install Docker Engine and start Flagsmith.
# Usage from Windows:
#   wsl -d Ubuntu -- bash /mnt/d/orqesta/scripts/install-docker-wsl.sh

set -euo pipefail

echo ""
echo "=== Installing Docker Engine in WSL2 Ubuntu ==="
echo ""

# 1. Update package list
sudo apt-get update -y

# 2. Install prerequisites
sudo apt-get install -y \
  ca-certificates \
  curl \
  gnupg \
  lsb-release

# 3. Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo "Docker GPG key added."
fi

# 4. Add Docker repository
UBUNTU_CODENAME=$(lsb_release -cs)
# Fallback: Ubuntu 26.04 (Resolute) may not have a Docker repo yet — use noble/jammy
if [ "$UBUNTU_CODENAME" = "resolute" ] || [ "$UBUNTU_CODENAME" = "oracular" ]; then
  echo "Ubuntu codename '$UBUNTU_CODENAME' — using 'noble' repo as fallback."
  DOCKER_REPO_CODENAME="noble"
else
  DOCKER_REPO_CODENAME="$UBUNTU_CODENAME"
fi

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  ${DOCKER_REPO_CODENAME} stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Install Docker Engine
sudo apt-get update -y
sudo apt-get install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin

echo ""
echo "Docker Engine installed."

# 6. Start Docker daemon
if ! sudo service docker status | grep -q "running"; then
  sudo service docker start
  sleep 3
fi

# 7. Add current user to docker group (avoids sudo for future commands)
sudo usermod -aG docker "$USER"

echo ""
echo "=== Starting Flagsmith (self-hosted) ==="
echo ""

# 8. Run Flagsmith from the shared Windows folder
cd /mnt/d/orqesta

# Start Flagsmith
sudo docker compose up -d

echo ""
echo "=== Waiting for Flagsmith to initialise (up to 90 seconds) ==="
echo ""

for i in $(seq 1 30); do
  if curl -sf http://localhost:8000/api/v1/health/ > /dev/null 2>&1; then
    echo ""
    echo "✓ Flagsmith is running at http://localhost:8000"
    break
  fi
  echo -n "."
  sleep 3
done

echo ""
echo "=== Done ==="
echo ""
echo "Open your browser to: http://localhost:8000"
echo ""
echo "After setup, get your Organisation API Token from:"
echo "  Organisation Settings → API Keys"
echo ""
echo "Then configure orqesta from Windows PowerShell:"
echo "  \$env:FLAGSMITH_API_KEY = 'your_token'"
echo "  \$env:FLAGSMITH_API_URL = 'http://localhost:8000/api/v1'"
echo "  node d:\\orqesta\\dist\\cli\\index.js doctor"
echo ""
