---
name: bc-table-design
description: Design and implement Business Central tables and table extensions in AL. Use when creating or reviewing AL table or tableextension objects — choosing data types, defining fields with Caption/ToolTip/DataClassification, keys and SIFT indexes, FlowFields and FlowFilters, TableRelation lookups, or OnValidate logic. Also use when asked to "create a table", "add a field to a table", or "extend a standard BC table like Item or Customer".
---

# BC Table Design

Design tables the way the BC base application does. Follow alguidelines.dev and the shared Claude4BC conventions. Full AL examples: read `references/examples.md`.

## Table vs. TableExtension

- **New entity** (own lifecycle, own pages) → new `table` in the project's ID range.
- **Extra data on a standard entity** (Item, Customer, Sales Header, …) → `tableextension`. Prefer standard BC fields and setup before adding custom fields.
- Extension objects are named after the base object, **no "Ext" suffix**: `tableextension 95008 Item extends Item` — namespaces ensure uniqueness.
- File names: `<BaseName>.Table.al` / `<BaseName>.TableExt.al`, PascalCase without spaces, e.g. `RentalUnit.Table.al`, `Item.TableExt.al`.
- No field/object prefixes unless agreed with the customer.

## Every field must have

```al
field(10; Description; Text[100])
{
    Caption = 'Description';
    ToolTip = 'Specifies a description of the rental unit.';
    DataClassification = CustomerContent;
}
```

- **`Caption`** — English; translations via XLIFF (`/c4bc:al-update-translations`).
- **`ToolTip`** — defined on the **table** field (BC 2024 wave 1+ / runtime 13.0; CodeCop AA0234). Pages inherit it — do not repeat on pages. Style: "Specifies …", ≤ 200 chars.
- **`DataClassification`** — `CustomerContent` for business data; `EndUserIdentifiableInformation` for user-identifying data; `SystemMetadata` for internal state. Avoid leaving the table-level `DataClassification = ToBeClassified`.

## Data types — quick guidance

| Need | Use |
|---|---|
| Record key / references | `Code[20]` (match the referenced field's length exactly) |
| Names/descriptions | `Text[100]` (match base app lengths when related) |
| Money/quantities | `Decimal` (+ `AutoFormatType = 1` and `AutoFormatExpression` for amounts) |
| Fixed value set | `Enum` (never `Option` in new code — enums are extensible) |
| Yes/No | `Boolean` |
| Dates | `Date`; timestamps `DateTime` |
| Free-form long text | `Blob` with helper procedures, or Text with a realistic max length |

## Keys and SIFT

- Primary key first, minimal, stable — typically `field("No.")` or a composite of document type/no./line no.
- Secondary keys only for real access paths (sorting on lists, range filters in code). Each key costs write performance.
- SIFT for summed FlowFields: `key(Amounts; "Rental Unit No.", "Posting Date") { SumIndexFields = Amount; }`.
- `MaintainSqlIndex`/`MaintainSiftIndex = false` on keys used rarely.

## FlowFields & FlowFilters

- FlowFields: `FieldClass = FlowField;` + `CalcFormula`; always `Editable = false`. Remember `CalcFields` before reading in code.
- FlowFilters (e.g. `Date Filter`) feed `CalcFormula` `filter(...)` expressions.
- Don't overuse FlowFields on hot list pages — each visible FlowField is a query.

## Relations & validation

- `TableRelation` for every reference field; add `where()` filters when only a subset is valid:
  `TableRelation = Item where(Blocked = const(false));`
- Business rules in `OnValidate` on the field; keep triggers short and delegate to procedures/codeunits.
- `TestField` for mandatory prerequisites; use `Error` with labels (`Label 'text'`), never hardcoded message strings.
- Cross-record cleanup in `OnDelete` (delete child lines, check for posted entries and block deletion).
- Consider `Blocked` fields instead of deletion for master data used in posted documents.

## Master-data checklist (new entity table)

- [ ] `No.` with number series (`AssistEdit` pattern + `"No. Series"` field; see the `bc-extensibility` skill)
- [ ] `Description`/`Name`, `Search Name` if users search by name
- [ ] `Blocked` flag if the entity participates in posting
- [ ] `LookupPageId` + `DrillDownPageId` set to the list page
- [ ] Posting-relevant setup: posting groups, dimensions (`"Global Dimension 1 Code"` pattern) if amounts flow to G/L
- [ ] **Write an AL test codeunit** — required by project rules for new tables and table extensions (see the `al-testing` skill)

## Quality gates

- Compile clean against CodeCop — AA0234 (table field tooltips) enabled.
- Field lengths of reference fields match the referenced primary key exactly.
- New tableextension fields on transactional standard tables: consider upgrade/backfill implications.
