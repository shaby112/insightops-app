#!/bin/bash
set -e

echo ""
echo "  InsightOps - Self-Hosted AI Business Intelligence"
echo ""

if ! command -v docker &> /dev/null; then
  echo "Docker not found. Please install Docker Desktop:"
  echo "https://www.docker.com/products/docker-desktop/"
  open "https://www.docker.com/products/docker-desktop/"
  exit 1
fi

if ! docker info &> /dev/null 2>&1; then
  echo "Docker is installed but not running. Starting Docker..."
  open -a Docker
  echo "Waiting for Docker to start..."
  while ! docker info &> /dev/null 2>&1; do
    sleep 2
  done
fi

INSTALL_DIR="$HOME/.insightops"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "Downloading InsightOps release files..."
curl -sL https://releases.insightops.dev/latest/docker-compose.yml -o docker-compose.yml
curl -sL https://releases.insightops.dev/latest/.env.example -o .env.example

if [ ! -f .env ]; then
  cp .env.example .env
fi

docker compose pull
docker compose up -d

echo "InsightOps is running at http://localhost:8080"
open http://localhost:8080
