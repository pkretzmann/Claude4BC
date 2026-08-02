---
bc-version: [all]
domain: style
keywords: [decompiled, download-source, formatting, casing, artifact, false-positive, analysis-repo, policy, soya, twoday, overload, duplicate-signature, named-return-value]
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

Two patterns that keep getting misreported:

- **Named return value glued to `var`** — a signature like
  `procedure Foo(...) ReturnValue: Decimal;` with the next line's `var` section
  collapsed onto it reads as "`Decimal var`". That is a lost line break, not a
  syntax error or a "malformed signature".
- **"Duplicate procedure signatures"** — procedures with the same name but
  different parameter types are legal AL **overloads** (e.g. one taking
  `Record "Sales Line"` and one taking `Record "Sales Invoice Line"`). Never a
  finding, regardless of formatting.

## Best Practice

In analyses of downloaded/decompiled source, reject automatically reported
"syntax error" / "will not compile" / "misspelled built-in" / "duplicate signature" /
"malformed signature" findings that trace back to collapsed formatting, identifier
casing, quoted identifiers, or legal overloads. **Rejected means omitted**: such an
item must not appear in the report at all — not even downgraded to a P3 "cleanup"
finding, and citing this rule in the finding's technical detail does not make it
reportable. Count the rejections and state them in the report's method note only.
Genuine string-content bugs
(e.g. a malformed GraphQL/JSON payload built at runtime) are unaffected by this rule —
those fail at runtime, not compile time, and remain real findings.

## Anti Pattern

Reporting `Code[20]var`, `... ReturnValue: Decimal;` + `var` on one line, lower-case
`confirm(`, `Setrange(`, or a quoted identifier passed as an argument as compile
errors or typos in a published app's downloaded source. Reporting same-name
procedures with different parameter types as "duplicate signatures". Keeping such an
item as a P3 finding "with a rule reference" instead of omitting it.

## See also

- The repo-level CLAUDE.md of the analysis project, which documents the
  download-artifact conventions for the specific codebase.
