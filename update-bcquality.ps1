# update-bcquality.ps1
# Tjekker om BCQuality submodulet (github.com/microsoft/BCQuality) er opdateret,
# viser hvad der er aendret, og opdaterer det hvis oensket.
# Installeres med /c4bc:al-bcquality-init (standard-sti .claude/bcquality).

param(
    [string]$SubmodulePath = ".claude/bcquality"
)

# Find projektets git-rod via dette scripts placering (scriptet ligger i
# claude4bc-submodulet, hvis superprojekt ER vaertsprojektet).
$gitRoot = git -C $PSScriptRoot rev-parse --show-superproject-working-tree 2>$null

if (-not $gitRoot) {
    Write-Host "Fejl: Kunne ikke finde projektets git-rod." -ForegroundColor Red
    exit 1
}
$gitRoot = (Resolve-Path $gitRoot).Path

$fullSubmodulePath = Join-Path $gitRoot ($SubmodulePath.Replace('/', [IO.Path]::DirectorySeparatorChar))

if (-not (Test-Path (Join-Path $fullSubmodulePath ".git"))) {
    Write-Host "Fejl: '$SubmodulePath' er ikke et initialiseret submodule." -ForegroundColor Red
    Write-Host "Koer /c4bc:al-bcquality-init foerst (eller angiv stien: .\update-bcquality.ps1 -SubmodulePath <sti>)."
    exit 1
}

# Hent commit-info
$currentCommit = git -C $fullSubmodulePath rev-parse --short HEAD 2>$null
git -C $fullSubmodulePath fetch origin 2>$null | Out-Null
$remoteCommit = git -C $fullSubmodulePath ls-remote origin HEAD 2>$null |
    Select-Object -First 1 |
    ForEach-Object { $_.Split()[0].Substring(0, 7) }

Write-Host ""
Write-Host "BCQuality submodule status" -ForegroundColor Cyan
Write-Host "--------------------------"
Write-Host "Projekt           : $gitRoot"
Write-Host "Submodule sti     : $SubmodulePath"
Write-Host "Nuvaerende commit : $currentCommit"
Write-Host "Seneste commit    : $remoteCommit"
Write-Host ""

if ($currentCommit -eq $remoteCommit) {
    Write-Host "Du er paa seneste version af BCQuality." -ForegroundColor Green
    exit 0
}

Write-Host "Der er en nyere version af BCQuality tilgaengelig." -ForegroundColor Yellow
Write-Host ""
Write-Host "Aendringer siden din version:" -ForegroundColor Cyan
git -C $fullSubmodulePath log --oneline "$currentCommit..FETCH_HEAD"
Write-Host ""
Write-Host "Beroerte filer (pr. lag microsoft/, community/, custom/):" -ForegroundColor Cyan
git -C $fullSubmodulePath diff --stat "$currentCommit..FETCH_HEAD"
Write-Host ""
Write-Host "Foelgende vil blive udfoert:"
Write-Host "  1. git submodule update --remote $SubmodulePath"
Write-Host "  2. git add $SubmodulePath"
Write-Host "  3. git commit -m 'Bump BCQuality to latest'"
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
git submodule update --remote $SubmodulePath

Write-Host "Committer..." -ForegroundColor Cyan
git add $SubmodulePath
git commit -m "Bump BCQuality to latest"

Write-Host "Pusher..." -ForegroundColor Cyan
git push

Write-Host ""
Write-Host "Faerdig! BCQuality er opdateret til seneste version." -ForegroundColor Green
