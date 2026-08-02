---
description: Split a classic NAV C/SIDE text export (Object Designer .txt) into one file per object — Type_No_Name.txt in an output folder, byte-preserving
argument-hint: "<export.txt> [output-folder] [--types Table,Codeunit,…] [--list]"
---

# nav-split-objects — Split a C/SIDE text export into one file per object

Split a classic NAV (C/SIDE) text export — one large `.txt` from the Object Designer
containing many objects — into **one file per object**, named
`<Type>_<No>_<Name>.txt` (e.g. `Table_36_Sales_Header.txt`).

## How to execute

Run the bundled script — **do not read or parse the export yourself** (exports can be
hundreds of MB; the script streams and splits deterministically and byte-preserving):

```powershell
& "${CLAUDE_PLUGIN_ROOT}/nav-split/split-nav-objects.ps1" -Path "<export.txt>" [-OutDir "<folder>"] [-Types Table,Codeunit] [-ListOnly]
```

Map the command arguments (`$ARGUMENTS`) to script parameters:

| Argument | Script parameter |
|---|---|
| first path | `-Path` (the export file) |
| second path (optional) | `-OutDir` — default is `<export-basename>-Objects` next to the source |
| `--types <list>` | `-Types` (comma-separated: Table, Form, Report, Dataport, Codeunit, XMLport, MenuSuite, Page, Query) |
| `--list` | `-ListOnly` — inventory only, writes nothing |

Then report the script's summary to the user: total objects, counts per type, output
folder, and any warnings (duplicates, content before the first `OBJECT` header).

## Rules

- The split is **byte-preserving**: each output file is the exact byte slice of the
  source, so encoding (UTF-8 or OEM/CP850 with æøå) is never corrupted, and
  concatenating all output files reproduces the source exactly. Never "help" by
  re-encoding or reformatting the output files.
- If the script reports no `OBJECT` headers, the file is probably not a C/SIDE export —
  you may then read the **first ~20 lines only** to diagnose (e.g. it might be an AL
  file, a FOB, or an XML) and tell the user.
- Re-running is idempotent: existing output files are overwritten (derived output).

## Examples

```
/nav-split-objects all_test.txt
/nav-split-objects "Changes 2024 and onwards.txt" Split --types Codeunit,Table
/nav-split-objects GDT/GDT_Customer.txt --list
```
