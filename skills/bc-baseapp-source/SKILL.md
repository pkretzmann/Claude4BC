---
name: bc-baseapp-source
description: Fetch and diff Microsoft Business Central Base App AL source across BC versions. Use whenever you need to see how a standard BC object is actually implemented, confirm whether Microsoft changed an object between releases, check if a reported "BC doesn't respect setting X" is a regression, find integration events available on a standard object, or locate the base implementation before writing an event subscriber. Triggers on requests like "what does report 94 actually do", "did Microsoft change Sales-Post in BC 28", "diff codeunit 80 between versions", "which events can I subscribe to on the Item table", "show me the base app source for X".
---

# BC Base App Source

Fetch the real AL source of any standard Business Central object and diff it across
versions. This beats forum searching and beats reasoning from memory — the source is
authoritative and version-pinned.

Source: `StefanMaron/MSDyn365BC.Code.History` (on-prem artifacts, one branch per
country-major, e.g. `w1-28`, `dk-28`) and `StefanMaron/MSDyn365BC.Sandbox.Code.History`
(SaaS artifacts including hotfixes). All code is Microsoft's; treat it as read-only
reference, never paste it wholesale into a customer extension.

## Usage

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/bc-baseapp-source/scripts/bc-baseapp-source.sh" \
  <object-name> [-b w1-26,w1-27,w1-28] [-d] [-l] [-a] [-o DIR] [-r sandbox]
```

| Flag | Meaning |
|---|---|
| `-b, --branches` | Comma-separated branches. Default: latest three `w1-*` majors, resolved live. |
| `-d, --diff` | Unified diff between consecutive branches. |
| `-l, --list` | Only list matching repo paths, download nothing. |
| `-a, --all` | Fetch every match instead of erroring on ambiguity. |
| `-o, --out` | Output dir (default `./.bc-source`). |
| `-r, --repo` | `onprem` (default) or `sandbox`. |

Object name is matched on the file-name stem; spaces, dots and dashes are stripped, so
`"Gen. Journal Line"`, `GenJournalLine` and `gen-journal-line` all work.

Files land as `<Object>.<Type>.<branch>.al`, CRLF stripped so diffs are clean.

The first run makes a blobless shallow clone (`--filter=tree:0`) in
`$CLAUDE4BC_CACHE` (default `~/.cache/claude4bc`) — about 1 MB per branch, no GitHub
API involved, so there is no rate limit to hit. Subsequent runs reuse it.

The script is bash; on Windows run it through Git Bash (`bash …`), which ships with Git
for Windows. Downloads land in the current project — add `.bc-source/` to the project's
`.gitignore`, since Microsoft's source must never be committed into a customer repo.

## Examples

```bash
# Did Microsoft change the year-end close report recently?
bash "${CLAUDE_PLUGIN_ROOT}/skills/bc-baseapp-source/scripts/bc-baseapp-source.sh" \
  CloseIncomeStatement -d

# Danish localisation of Sales-Post, one specific version
bash "${CLAUDE_PLUGIN_ROOT}/skills/bc-baseapp-source/scripts/bc-baseapp-source.sh" \
  SalesPost -b dk-28

# SaaS build including hotfixes
bash "${CLAUDE_PLUGIN_ROOT}/skills/bc-baseapp-source/scripts/bc-baseapp-source.sh" \
  SalesPost -r sandbox -b w1-28

# Where does this object live in the repo?
bash "${CLAUDE_PLUGIN_ROOT}/skills/bc-baseapp-source/scripts/bc-baseapp-source.sh" \
  "Gen. Journal Line" -l
```

## Reading the result

After fetching, work directly on the downloaded `.al` files with grep:

```bash
# every integration event you could subscribe to
grep -n "IntegrationEvent\|BusinessEvent" .bc-source/SalesPost.Codeunit.w1-28.al

# every assignment to an option variable (finds code that overrides user choices)
grep -n "PostToRetainedEarningsAcc *:=" .bc-source/CloseIncomeStatement.Report.w1-28.al

# the request page fields, to see what the user can actually set
sed -n '/requestpage/,/^    }/p' .bc-source/CloseIncomeStatement.Report.w1-28.al
```

## Notes

- Branch naming is `<country>-<major>`: `w1-28` is BC 2026 release wave 1 W1,
  `dk-28` is the Danish localisation. Localised behaviour lives on the country branch —
  for Danish customers always check `dk-*` as well as `w1-*` before concluding
  "standard BC does X".
- A `404` for one branch means the object did not exist in that version — often the
  most interesting finding of all.
- The repo lags the very latest SaaS minor by up to a day; for a hotfix-level question
  use `-r sandbox`.
- Report the BC version alongside any conclusion. "Report 94 forces Details when ACY is
  set (unchanged w1-25..w1-28)" is a usable answer; "report 94 forces Details" is not.
