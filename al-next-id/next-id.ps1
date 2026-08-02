# next-id.ps1 — print the first unused AL object ID of a given type within the
# project's configured idRanges. Deterministic; prints ONLY the number on success.
#
#   pwsh -NoProfile -File next-id.ps1 -Type codeunit [-Path <project-or-subdir>]
#
# Object IDs are namespaced per object type in AL (id 67800 may be a table AND a
# page AND a permissionset), so the search is filtered by -Type. Ranges are read
# from app.json (idRanges[] or the legacy idRange{}). Exit 0 + number on success;
# exit 1 + message on stderr otherwise.

[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Type,

    # A project root or any subdirectory of it. app.json is found by walking up.
    [string]$Path = "."
)

$ErrorActionPreference = 'Stop'

# AL object types that own a numeric ID. Reject anything else so a typo
# ("codunit") fails loudly instead of silently returning the range start.
$known = @(
    'table','tableextension','page','pageextension','codeunit',
    'report','reportextension','query','xmlport','enum','enumextension',
    'permissionset','permissionsetextension','profile','controladdin','entitlement'
)
$type = $Type.Trim().ToLowerInvariant()
if ($known -notcontains $type) {
    Write-Error "Unknown AL object type '$Type'. Expected one of: $($known -join ', ')."
    exit 1
}

# Find app.json by walking up from -Path.
$dir = (Resolve-Path -LiteralPath $Path).Path
$appJson = $null
while ($dir) {
    $candidate = Join-Path $dir 'app.json'
    if (Test-Path -LiteralPath $candidate) { $appJson = $candidate; break }
    $parent = Split-Path -Parent $dir
    if ($parent -eq $dir) { break }   # reached filesystem root
    $dir = $parent
}
if (-not $appJson) { Write-Error "No app.json found from '$Path' upward."; exit 1 }

$root = Split-Path -Parent $appJson
$app  = Get-Content -LiteralPath $appJson -Raw | ConvertFrom-Json

# Collect ranges: modern idRanges[] or legacy idRange{}.
$ranges = @()
if     ($app.idRanges) { $ranges = @($app.idRanges) }
elseif ($app.idRange)  { $ranges = @($app.idRange)  }
if (-not $ranges) { Write-Error "app.json ($appJson) has no idRanges/idRange."; exit 1 }
$ranges = $ranges | Sort-Object { [int]$_.from }

# Scan every .al file for declarations of the requested type and collect IDs.
# Match the type keyword as the first token on a line, immediately followed by
# the number — so 'table' never matches 'tableextension', 'enum' never matches
# 'enumextension', etc. Case-insensitive (AL keywords are case-insensitive).
$used = [System.Collections.Generic.HashSet[int]]::new()
$re   = [regex]::new("^\s*$([regex]::Escape($type))\s+(\d+)\b", 'IgnoreCase')
foreach ($f in (Get-ChildItem -LiteralPath $root -Recurse -Filter '*.al' -File)) {
    foreach ($line in [System.IO.File]::ReadAllLines($f.FullName)) {
        $m = $re.Match($line)
        if ($m.Success) { [void]$used.Add([int]$m.Groups[1].Value) }
    }
}

# First free ID, scanning ranges in ascending order.
foreach ($r in $ranges) {
    for ($id = [int]$r.from; $id -le [int]$r.to; $id++) {
        if (-not $used.Contains($id)) { Write-Output $id; exit 0 }
    }
}

Write-Error "No free '$type' ID available in the configured ranges (all used)."
exit 1
