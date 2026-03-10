#!/bin/bash
set -e

echo ""
echo "  Kuantra - Self-Hosted AI Business Intelligence"
echo ""

if ! command -v docker &> /dev/null; then
  echo "Docker not found. Installing Docker..."
  curl -fsSL https://get.docker.com | sh
fi

if ! docker info &> /dev/null 2>&1; then
  echo "Please start Docker daemon and rerun this script."
  exit 1
fi

INSTALL_DIR="$HOME/.kuantra"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "Downloading Kuantra release files..."
curl -sL https://releases.kuantra.dev/latest/docker-compose.yml -o docker-compose.yml
curl -sL https://releases.kuantra.dev/latest/.env.example -o .env.example

if [ ! -f .env ]; then
  cp .env.example .env
fi

docker compose pull
docker compose up -d

echo "Kuantra is running at http://localhost:8080"
xdg-open http://localhost:8080 >/dev/null 2>&1 || true
