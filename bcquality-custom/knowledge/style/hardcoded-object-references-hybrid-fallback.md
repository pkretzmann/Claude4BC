---
bc-version: [all]
domain: style
keywords: [hardcoded, object-reference, report, setup, fallback, compile-safety, policy, soya, twoday]
technologies: [al]
countries: [w1]
application-area: [all]
---

# House policy: hardcoded object references are compile-safe; prefer setup with hardcoded fallback

## Description

A hardcoded object reference such as `Report::"Combine Shipments"` is verified at
compile time: if the referenced object is removed or renamed, the app fails to build —
a loud, early warning. Moving the ID to a setup field alone trades that compile-time
safety for a runtime failure the day the setup row is wrong or empty. This
partner/customer policy (Soya/twoday) therefore treats hardcoded object references as
**P3** (nice-to-have flexibility), not as defects.

## Best Practice

When configurability is genuinely useful, recommend the **hybrid** pattern: a getter
that reads the setup field and falls back to the compile-checked reference.

```al
procedure GetShipmentReportID(): Integer
begin
    Setup.GetRecordOnce();
    if Setup."Shipment Report ID" <> 0 then
        exit(Setup."Shipment Report ID");
    exit(Report::"Combine Shipments");
end;
```

This keeps the compile-time dependency (build breaks if the report disappears) while
allowing per-environment overrides. Hardcoded **data** values (journal names, posting
groups, shipping-agent codes) are a different matter — they reference records that can
legitimately differ per company/environment and remain real findings.

## Anti Pattern

Flagging `Report::"X"` / `Codeunit::"X"` references as P1/P2 "missing fallback"
defects, or recommending pure setup-table lookups with no compile-checked default.

## See also

- `microsoft/knowledge/error-handling/unchecked-get-throws-when-record-not-found.md` (in the BCQuality clone, e.g. `.claude/bcquality/`)
  — the same "fail loudly, early" philosophy applied to record lookups.
