---
bc-version: [all]
domain: error-handling
keywords: [get, guard, hard-failure, policy, priority, p3, soya, twoday]
technologies: [al]
countries: [w1]
application-area: [all]
---

# House policy: an unguarded Record.Get is at most a P3 finding — hard failure may be intended

## Description

This partner/customer policy (Soya/twoday) builds on
`microsoft/knowledge/error-handling/unchecked-get-throws-when-record-not-found.md`:
a bare `Rec.Get(...)` is an existence assertion that raises a clear runtime error when
the record is missing. Failing hard at the point of the problem is often preferable to
a defensive guard that lets execution continue with incomplete data and surfaces a
confusing error later — or never.

## Best Practice

In code reviews and quality analyses, categorize "unguarded `Get()`" findings as **P3**
(clean-up / accepted risk), never P1/P2 on their own. Describe the concrete runtime
consequence at that exact call site (which process stops, what the user sees) so the
reader can decide per case whether a guard is warranted. A guard IS warranted when the
surrounding logic must continue gracefully (e.g. optional setup, per-line enrichment
loops where one bad line should not kill a batch) — argue from the site, not from the
pattern.

## Anti Pattern

Blanket-flagging every unguarded `Get()` as a critical robustness defect, or
recommending `if not Rec.Get(...) then exit;` everywhere — silent exits hide missing
data and are frequently worse than the hard failure they replace.

## See also

- `microsoft/knowledge/error-handling/unchecked-get-throws-when-record-not-found.md` (in the BCQuality clone, e.g. `.claude/bcquality/`)
