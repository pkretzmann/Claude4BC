# update-claude4bc.ps1
# Tjekker om Claude4BC submodulet er opdateret, og opdaterer det hvis ønsket.

# Find projektets git-rod (ikke submodulets)
$gitRoot = git -C $PSScriptRoot rev-parse --show-superproject-working-tree 2>$null

if (-not $gitRoot) {
    Write-Host "Fejl: Kunne ikke finde projektets git-rod." -ForegroundColor Red
    exit 1
}

# Find submodule stien relativt til git-roden
$submodulePath = git -C $gitRoot submodule status | 
    Where-Object { $_ -match "claude4bc" } | 
    ForEach-Object { ($_.Trim() -split "\s+")[1] }

if (-not $submodulePath) {
    Write-Host "Fejl: Kunne ikke finde claude4bc submodulet." -ForegroundColor Red
    exit 1
}

$fullSubmodulePath = Join-Path $gitRoot $submodulePath

# Hent commit-info
$currentCommit = git -C $fullSubmodulePath rev-parse --short HEAD 2>$null
$remoteCommit = git -C $fullSubmodulePath ls-remote origin HEAD 2>$null | 
    Select-Object -First 1 | 
    ForEach-Object { $_.Split()[0].Substring(0, 7) }

Write-Host ""
Write-Host "Claude4BC submodule status" -ForegroundColor Cyan
Write-Host "--------------------------"
Write-Host "Projekt         : $gitRoot"
Write-Host "Submodule sti   : $submodulePath"
Write-Host "Nuvaerende commit: $currentCommit"
Write-Host "Seneste commit  : $remoteCommit"
Write-Host ""

if ($currentCommit -eq $remoteCommit) {
    Write-Host "Du er paa seneste version af Claude4BC." -ForegroundColor Green
    exit 0
}

Write-Host "Der er en nyere version af Claude4BC tilgaengelig." -ForegroundColor Yellow
Write-Host ""
Write-Host "Foelgende vil blive udfoert:"
Write-Host "  1. git submodule update --remote $submodulePath"
Write-Host "  2. git add $submodulePath"
Write-Host "  3. git commit -m 'Bump Claude4BC to latest'"
Write-Host "  4. git push"
Write-Host ""

$confirm = Read-Host "Opdater nu? (j/n)"
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
Write-Host "Faerdig! Claude4BC er opdateret til seneste version." -ForegroundColor Green