Write-Host ""
Write-Host "InsightOps - Self-Hosted AI Business Intelligence" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker not found. Please install Docker Desktop:" -ForegroundColor Yellow
    Write-Host "https://www.docker.com/products/docker-desktop/" -ForegroundColor Blue
    Start-Process "https://www.docker.com/products/docker-desktop/"
    exit 1
}

$installDir = "$env:USERPROFILE\.insightops"
New-Item -ItemType Directory -Force -Path $installDir | Out-Null
Set-Location $installDir

Invoke-WebRequest -Uri "https://releases.insightops.dev/latest/docker-compose.yml" -OutFile "docker-compose.yml"
Invoke-WebRequest -Uri "https://releases.insightops.dev/latest/.env.example" -OutFile ".env.example"

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}

docker compose pull
docker compose up -d

Write-Host "InsightOps is running at http://localhost:8080" -ForegroundColor Green
Start-Process "http://localhost:8080"
