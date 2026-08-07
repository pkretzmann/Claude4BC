---
description: Verify a reported "BC doesn't respect setting X" complaint against the actual Base App source
argument-hint: <object or report name> — <the reported behaviour>
allowed-tools: Bash(bash:*), Bash(grep:*), Bash(sed:*), Bash(diff:*), Read, Glob, Grep, WebSearch, WebFetch
---

A customer or colleague reports that standard Business Central is not respecting a
setting, option or field. Verify it against the real source before believing it, before
denying it, and before searching a single forum.

**Report:** $ARGUMENTS

Work through this in order and stop as soon as the source gives a definitive answer.

## 1. Identify the object

Name the object and its ID (e.g. report 94 "Close Income Statement", codeunit 80
"Sales-Post"). If the report is vague about which object runs the behaviour, say so and
ask — do not guess at an object and then "confirm" it.

## 2. Pull the source

Use the `bc-baseapp-source` skill to fetch the object across the last three majors, with
diffs:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/bc-baseapp-source/scripts/bc-baseapp-source.sh" \
  <ObjectName> -d
```

If the customer is Danish, also pull the `dk-<major>` branch — localised base app can
override W1 behaviour.

## 3. Find the setting in code

- Locate the request-page field / setup field named in the complaint and note the
  backing variable.
- `grep -n "<Variable> *:=" ` across the file. **Every assignment outside the request
  page is a candidate override.** This is usually where the answer is.
- Also grep the setup table the field lives on (e.g. `GLSetup.`, `SalesSetup.`) for
  conditions that gate the behaviour.
- Check `OnPreReport` / `OnRun` / `OnOpenPage` specifically — forced overrides
  overwhelmingly live there.

## 4. Classify the finding

Put it in exactly one bucket and say which:

- **By design.** Standard code deliberately overrides the setting under a condition.
  Quote the condition and any `Confirm`/`Message` label that warns about it — users
  click through those. Give the customer the precondition to check.
- **Regression.** The diff shows Microsoft changed the logic between versions. Name the
  two versions and show the relevant hunk.
- **Not this object.** No code path can produce the reported behaviour → an extension,
  an event subscriber, or a misreading of the journal is responsible. Say so plainly and
  move to step 6.
- **Undetermined.** The source is consistent with several readings. Say that; do not
  pick the most satisfying one.

## 5. Check for a known issue — but only after the source

Search the Dynamics Community forums, BCApps issues and partner blogs. Report honestly
whether anything was found, and distinguish "no public report exists" from "I did not
find one". The source finding outranks forum consensus.

## 6. Output

Produce, in this order:

1. **Verdict** — one of the four buckets above, one sentence.
2. **Evidence** — the decisive code condition, minimal excerpt, with file and line.
3. **Version scope** — which majors the behaviour exists in (`unchanged w1-25..w1-28`,
   `new in w1-27`, etc.). Never state a behaviour without its version scope.
4. **What to check on the customer's environment** — a short, concrete list, ordered by
   how decisive each check is.
5. **Open questions** — anything you need from the customer to be certain. If the answer
   depends on an unknown, ask; do not assume the reading that makes the story tidy.
6. **Workaround or fix** — only if the source supports one. If the behaviour is by
   design, say the setting combination is unsupported rather than inventing a
   workaround.

## Guardrails

- Never conclude from memory of how BC works. If it is not in the fetched source, it is
  not evidence.
- Never invent an event name, field name or option value to make an explanation work —
  grep for it first.
- If a customer's description of the symptom does not match any code path, the most
  likely explanation is that the symptom was described imprecisely. Ask what they
  actually see on screen (how many lines, on which accounts) before theorising.
