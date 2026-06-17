---
description: Sort using directives alphabetically in all .al files (the trailing ";" is ignored, so a parent namespace sorts before its children)
argument-hint: "(optional) a file, folder, or glob to limit the scope"
---

# Sort using directives

Sort the `using` directives in AL source files (`.al`) into a stable alphabetical order.

If an argument (`$ARGUMENTS`) is given, limit the work to that file, folder, or glob.
Otherwise process **every** `.al` file in the project (typically under `src/`).

## Sorting rule

Sort each file's contiguous block of `using` lines by the **namespace text only**:

- Strip the leading `using ` prefix and the **trailing `;`** before comparing. The `;` is
  **not** part of the sort key.
- Compare **ordinal / case-sensitively** (the AL compiler order), not culture-aware.

Because `;` is excluded, a parent namespace sorts **before** its own children — `.` (0x2E)
ranks below any namespace-segment character, so the shorter parent comes first:

```
using PwC.Securities.Security;          // parent first
using PwC.Securities.Security.ISIN.Price;
```

(If `;` were included in the key it would wrongly land **after** the child, because `;` (0x3B)
sorts after `.` — that is the bug this command exists to avoid.)

## Constraints

- Only **reorder** the existing `using` lines — never add, remove, or rewrite a directive.
- Sort only the **one contiguous block** of `using` lines (in AL it always sits between the
  `namespace` declaration and the object). If a file's `using` lines are somehow **not**
  contiguous, skip it and report it for manual review rather than guessing.
- Preserve everything else byte-for-byte: indentation, the existing line endings (these files
  are **CRLF**), and the final newline.
- A file already in the correct order must be left untouched (no rewrite).

## Procedure

1. Collect the target `.al` files (all under the project, or those matching `$ARGUMENTS`).
2. For each file, locate the contiguous run of lines matching `^using `.
3. Sort that run by the namespace key defined above (ordinal, `;` excluded).
4. If the sorted order differs from the current order, write the block back in place,
   preserving CRLF and the rest of the file. Otherwise leave the file as-is.
5. Report: which files were re-sorted, how many were already correct, and any files skipped
   for non-contiguous `using` blocks.

## Reference implementation (PowerShell)

A deterministic implementation. Adjust `$root` / the file selection for `$ARGUMENTS`.

```powershell
$root = "src"   # or the path/glob from $ARGUMENTS
$changed = 0; $already = 0; $warn = @()
foreach ($f in (Get-ChildItem $root -Recurse -Filter '*.al' -File)) {
    $lines = [System.IO.File]::ReadAllLines($f.FullName)
    $idx = @()
    for ($i = 0; $i -lt $lines.Count; $i++) { if ($lines[$i] -match '^using ') { $idx += $i } }
    if ($idx.Count -eq 0) { continue }
    $start = $idx[0]; $end = $idx[-1]
    if (($end - $start + 1) -ne $idx.Count) { $warn += $f.FullName; continue }  # non-contiguous
    $block = $lines[$start..$end]
    # sort key = namespace only: strip 'using ' prefix and trailing ';'
    $key = [Func[string, string]]{ param($s) ($s -replace '^using\s+', '' -replace ';\s*$', '') }
    $sorted = [System.Linq.Enumerable]::ToArray(
        [System.Linq.Enumerable]::OrderBy([string[]]$block, $key, [StringComparer]::Ordinal))
    if (($block -join "`n") -eq ($sorted -join "`n")) { $already++; continue }
    for ($j = 0; $j -lt $sorted.Count; $j++) { $lines[$start + $j] = $sorted[$j] }
    [System.IO.File]::WriteAllText($f.FullName, ($lines -join "`r`n") + "`r`n")
    $changed++
    Write-Host "sorted: $($f.FullName.Substring((Resolve-Path $root).Path.Length))"
}
Write-Host "changed: $changed, already correct: $already"
if ($warn.Count) { Write-Host "non-contiguous (skipped):"; $warn | ForEach-Object { Write-Host "  $_" } }
```

## Output

When everything is sorted and reported, print: `<promise>COMPLETE</promise>`
