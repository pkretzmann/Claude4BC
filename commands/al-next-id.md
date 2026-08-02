---
description: Print the first unused AL object ID of a given type (codeunit, table, page, …) within the project's app.json idRanges
argument-hint: "<objecttype> — e.g. codeunit, table, page, tableextension"
---

# al-next-id — Find the next free AL object ID

Print the **first unused object ID** for a given object **type** inside the project's
configured ID range(s). Object IDs in AL are namespaced **per type** (id `67800` may be a
table *and* a page *and* a permissionset at the same time), so the answer always depends on
the type you ask for.

The ranges come from the project's `app.json` (`idRanges[]`, or the legacy `idRange{}`).
"First unused" means the **lowest gap** in the range for that type — not `max + 1` — so holes
left by deleted objects get reused.

## Usage

```
/c4bc:al-next-id codeunit          → e.g. 67802
/c4bc:al-next-id table
/c4bc:al-next-id tableextension
/c4bc:al-next-id page
```

Accepted types: `table`, `tableextension`, `page`, `pageextension`, `codeunit`, `report`,
`reportextension`, `query`, `xmlport`, `enum`, `enumextension`, `permissionset`,
`permissionsetextension`, `profile`, `controladdin`, `entitlement`.

## Procedure (for Claude)

1. **Read the object type** from `$ARGUMENTS` (the first token). If none was given, ask the
   user which object type they want a number for, then stop until they answer.
2. **Locate the project root** — the directory containing `app.json` for the AL project being
   worked on (use `git rev-parse --show-toplevel`, or the current working directory). The
   script also walks upward to find `app.json`, so passing any subdirectory is fine.
3. **Run the bundled script.** It does the parsing deterministically and prints only the number:

   ```bash
   pwsh -NoProfile -File "${CLAUDE_PLUGIN_ROOT}/al-next-id/next-id.ps1" -Type <objecttype> -Path "<project root>"
   ```

4. **Report the single ID** it printed (e.g. `67802`). On failure the script writes a message
   to stderr and exits non-zero — relay that (unknown type, no `app.json`, or range exhausted)
   rather than inventing a number.

## What the script does (short)

- Finds `app.json` by walking up from `-Path`, and reads its `idRanges`/`idRange`.
- Scans every `.al` file under the project for lines beginning with `<type> <number>` (matched
  so `table` never catches `tableextension`, `enum` never catches `enumextension`, etc.).
- Returns the lowest number in the configured range(s) not already used by that type.

## Notes

- **Read-only:** it never edits files — it just reports the next free number.
- **Per type:** always pass the exact object type; the count for codeunits is independent of
  tables, pages, etc.
- **Deterministic:** the number-crunching lives in the script, not in Claude's head, so the
  result is exact and repeatable.
