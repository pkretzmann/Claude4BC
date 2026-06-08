# update-claude4bc.ps1
# Opdaterer Claude4BC submodulet til seneste version.
# Ligger i .claude/claude4bc/ og navigerer selv op til git-roden af projektet.

# Find git-roden (to niveauer op fra scriptets placering)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$gitRoot = git -C $scriptDir rev-parse --show-toplevel

if (-not $gitRoot) {
    Write-Host "Fejl: Kunne ikke finde git-roden." -ForegroundColor Red
    exit 1
}

$submodulePath = ".claude/claude4bc"

# Hent commit-info
$currentCommit = git -C "$gitRoot/$submodulePath" rev-parse --short HEAD
$remoteCommit = git -C "$gitRoot/$submodulePath" ls-remote origin HEAD | Select-Object -First 1 | ForEach-Object { $_.Split()[0].Substring(0, 7) }

Write-Host ""
Write-Host "Claude4BC submodule opdatering" -ForegroundColor Cyan
Write-Host "-------------------------------"
Write-Host "Projekt         : $gitRoot"
Write-Host "Nuværende commit: $currentCommit"
Write-Host "Seneste commit  : $remoteCommit"
Write-Host ""

if ($currentCommit -eq $remoteCommit) {
    Write-Host "Allerede på seneste version. Ingen opdatering nødvendig." -ForegroundColor Green
    exit 0
}

Write-Host "Følgende vil blive udført:"
Write-Host "  1. git submodule update --remote .claude/claude4bc"
Write-Host "  2. git add .claude/claude4bc"
Write-Host "  3. git commit -m `"Bump Claude4BC to latest`""
Write-Host "  4. git push"
Write-Host ""

$confirm = Read-Host "Fortsæt? (j/n)"
if ($confirm -ne "j") {
    Write-Host "Annulleret." -ForegroundColor Yellow
    exit 0
}

Set-Location $gitRoot

Write-Host ""
Write-Host "Opdaterer submodul..." -ForegroundColor Cyan
git submodule update --remote $submodulePath

Write-Host "Committer..." -ForegroundColor Cyan
git add $submodulePath
git commit -m "Bump Claude4BC to latest"

Write-Host "Pusher..." -ForegroundColor Cyan
git push

Write-Host ""
Write-Host "Færdig! Claude4BC er opdateret til seneste version." -ForegroundColor Green