---
bc-version: [all]
domain: style
keywords: [decompiled, download-source, formatting, casing, artifact, false-positive, analysis-repo, policy, soya, twoday]
technologies: [al]
countries: [w1]
application-area: [all]
---

# House policy: formatting artifacts in downloaded (decompiled) AL source are not findings

## Description

Source obtained via "Download Source" from a compiled app arrives with collapsed
formatting: line breaks are lost (`): Code[20]var` where `var` starts the next line's
variable section), file names replace spaces with underscores, and identifier casing
may look unconventional. The app demonstrably **compiles** — it is published — so any
claim that such code "will not compile" is false by construction. AL is
case-insensitive (`confirm()` ≡ `Confirm()`, `Setrange` ≡ `SetRange`), and quoted
identifiers (`"SomeName"`) are identifiers, not string literals.

## Best Practice

In analyses of downloaded/decompiled source, reject automatically reported
"syntax error" / "will not compile" / "misspelled built-in" findings that trace back
to collapsed formatting, identifier casing, or quoted identifiers. Count the
rejections and state them in the report's method note. Genuine string-content bugs
(e.g. a malformed GraphQL/JSON payload built at runtime) are unaffected by this rule —
those fail at runtime, not compile time, and remain real findings.

## Anti Pattern

Reporting `Code[20]var`, lower-case `confirm(`, `Setrange(`, or a quoted identifier
passed as an argument as compile errors or typos in a published app's downloaded
source.

## See also

- The repo-level CLAUDE.md of the analysis project, which documents the
  download-artifact conventions for the specific codebase.
