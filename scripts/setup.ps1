# setup.ps1 — One-command local dev setup
# Usage: .\scripts\setup.ps1

Write-Host "`n[1/6] Copying environment template..." -ForegroundColor Cyan
if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.example" ".env.local"
  Write-Host "  Created .env.local — fill in NEXTAUTH_SECRET, RESEND_API_KEY, etc." -ForegroundColor Yellow
} else {
  Write-Host "  .env.local already exists, skipping" -ForegroundColor Gray
}

Write-Host "`n[2/6] Installing dependencies..." -ForegroundColor Cyan
npm ci

Write-Host "`n[3/6] Starting PostgreSQL via Docker..." -ForegroundColor Cyan
docker compose up db -d
Write-Host "  Waiting for Postgres to be healthy (10s)..."
Start-Sleep -Seconds 10

Write-Host "`n[4/6] Exporting DATABASE_URL for Prisma CLI..." -ForegroundColor Cyan
# Prisma 7 reads DATABASE_URL from the process environment, not from .env files
$env:DATABASE_URL = "postgresql://invoice_user:invoice_pass@localhost:5432/invoice_app"
Write-Host "  DATABASE_URL set for this session"

Write-Host "`n[5/6] Running database migrations..." -ForegroundColor Cyan
npx prisma migrate dev --name init

Write-Host "`n[6/6] Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate

Write-Host "`nSetup complete! Start the dev server with:" -ForegroundColor Green
Write-Host "  `$env:DATABASE_URL = 'postgresql://invoice_user:invoice_pass@localhost:5432/invoice_app'" -ForegroundColor Gray
Write-Host "  npm run dev`n" -ForegroundColor White
