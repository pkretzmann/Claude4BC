<#
.SYNOPSIS
    Split a classic NAV C/SIDE text export (Object Designer .txt) into one file per object.

.DESCRIPTION
    Scans the export for top-level "OBJECT <Type> <No> <Name>" headers and writes each
    object to <OutDir>\<Type>_<No>_<SanitizedName>.txt.

    The split is byte-preserving: each output file is the exact byte slice of the source
    (including the blank separator lines that follow an object), so concatenating all
    output files in order reproduces the source file byte for byte. This means the
    source encoding (UTF-8, OEM/CP850, CP1252, ...) is never touched or corrupted.
    Only the file NAME is decoded (strict UTF-8, falling back to CP850/DOS) so Danish
    characters in object names come out right either way.

.PARAMETER Path
    The C/SIDE text export to split.

.PARAMETER OutDir
    Output folder. Default: "<export-basename>-Objects" next to the source file.

.PARAMETER Types
    Optional filter: only write these object types (Table, Form, Report, Dataport,
    Codeunit, XMLport, MenuSuite, Page, Query).

.PARAMETER ListOnly
    Print the object inventory (type, number, name) without writing any files.

.EXAMPLE
    .\split-nav-objects.ps1 -Path "C:\NAV\all_objects.txt"

.EXAMPLE
    .\split-nav-objects.ps1 -Path export.txt -Types Codeunit,Table -OutDir C:\NAV\Split
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Path,

    [Parameter(Position = 1)]
    [string]$OutDir,

    [ValidateSet('Table', 'Form', 'Report', 'Dataport', 'Codeunit', 'XMLport', 'MenuSuite', 'Page', 'Query')]
    [string[]]$Types,

    [switch]$ListOnly
)

$ErrorActionPreference = 'Stop'

$Path = (Resolve-Path -LiteralPath $Path).ProviderPath
if (-not $OutDir) {
    $OutDir = Join-Path (Split-Path -Parent $Path) ([IO.Path]::GetFileNameWithoutExtension($Path) + '-Objects')
}

# Latin-1 maps every byte 1:1 to a char, so char index == byte index and no byte is ever altered.
$latin1 = [Text.Encoding]::GetEncoding(28591)
$bytes = [IO.File]::ReadAllBytes($Path)
$text = $latin1.GetString($bytes)

$headerRe = [regex]'(?m)^OBJECT (Table|Form|Report|Dataport|Codeunit|XMLport|MenuSuite|Page|Query) (\d+) ([^\r\n]*)'
$headers = $headerRe.Matches($text)

if ($headers.Count -eq 0) {
    throw "No 'OBJECT <Type> <No> <Name>' headers found - '$Path' does not look like a C/SIDE text export."
}

if ($headers[0].Index -gt 0 -and $text.Substring(0, $headers[0].Index).Trim().Length -gt 0) {
    Write-Warning "The file has content before the first OBJECT header; it will not be written to any output file."
}

function ConvertTo-ObjectName([string]$RawLatin1Name) {
    # Re-decode the name for the FILENAME only: strict UTF-8 first, CP850 (DOS Danish) fallback.
    $raw = $script:latin1.GetBytes($RawLatin1Name)
    try {
        $name = [Text.UTF8Encoding]::new($false, $true).GetString($raw)
    } catch {
        $name = [Text.Encoding]::GetEncoding(850).GetString($raw)
    }
    $name = $name -replace '[^\p{L}\p{Nd}]+', '_'
    return $name.Trim('_')
}

$objects = for ($i = 0; $i -lt $headers.Count; $i++) {
    $m = $headers[$i]
    $end = if ($i + 1 -lt $headers.Count) { $headers[$i + 1].Index } else { $text.Length }
    [pscustomobject]@{
        Type   = $m.Groups[1].Value
        No     = [int]$m.Groups[2].Value
        Name   = ConvertTo-ObjectName $m.Groups[3].Value
        Start  = $m.Index
        Length = $end - $m.Index
    }
}

if ($Types) {
    $objects = @($objects | Where-Object { $Types -contains $_.Type })
    if ($objects.Count -eq 0) {
        throw "No objects of type(s) $($Types -join ', ') found in the export."
    }
}

if ($ListOnly) {
    $objects | Select-Object Type, No, Name | Format-Table -AutoSize
} else {
    New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
    $seen = @{}
    $duplicates = 0
    foreach ($obj in $objects) {
        $key = '{0}_{1}' -f $obj.Type, $obj.No
        if ($seen.ContainsKey($key)) {
            $duplicates++
            Write-Warning "Duplicate object $key ('$($obj.Name)') - overwriting the earlier occurrence."
        }
        $seen[$key] = $true

        $file = Join-Path $OutDir ('{0}_{1}_{2}.txt' -f $obj.Type, $obj.No, $obj.Name)
        $fs = [IO.File]::Create($file)
        try {
            $fs.Write($bytes, $obj.Start, $obj.Length)
        } finally {
            $fs.Close()
        }
    }
}

Write-Host ''
Write-Host ("Objects found: {0}" -f $objects.Count)
$objects | Group-Object Type | Sort-Object Name | ForEach-Object {
    Write-Host ("  {0,-9} {1,6}" -f $_.Name, $_.Count)
}
if (-not $ListOnly) {
    Write-Host ("Output: {0}" -f $OutDir)
    if ($duplicates -gt 0) {
        Write-Host ("Duplicates overwritten: {0}" -f $duplicates)
    }
}
