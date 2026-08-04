# install-bcquality.ps1
# Installerer Microsofts BCQuality-vidensbase (github.com/microsoft/BCQuality)
# som Claude Code-plugin (user scope). Koeres een gang pr. udvikler — plugin'et
# lander under brugerens ~/.claude/plugins, IKKE i projektet.
# Kan ogsaa koeres via kommandoen /c4bc:al-bcquality-init.
#
# Klon aldrig BCQuality ind i et AL-workspace: dens ~400 eksempel-.al-filer
# opfattes som projektkilde af AL-compileren og faar buildet til at fejle.

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Host "Fejl: 'claude' CLI blev ikke fundet i PATH. Installer Claude Code foerst." -ForegroundColor Red
    exit 1
}

# Allerede installeret?
$installed = claude plugin list 2>$null | Out-String
if ($installed -match "bcquality@bcquality") {
    Write-Host "BCQuality-plugin'et er allerede installeret." -ForegroundColor Green
    exit 0
}

Write-Host "Tilfoejer BCQuality-marketplacet..." -ForegroundColor Cyan
claude plugin marketplace add microsoft/BCQuality

Write-Host "Installerer plugin'et..." -ForegroundColor Cyan
claude plugin install bcquality@bcquality
if ($LASTEXITCODE -ne 0) {
    Write-Host "Fejl: installationen mislykkedes (se output ovenfor)." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Faerdig! BCQuality er installeret som Claude Code-plugin (user scope)." -ForegroundColor Green
Write-Host "Skill'en 'bcquality-al-review' er tilgaengelig i nye Claude Code-sessioner."
