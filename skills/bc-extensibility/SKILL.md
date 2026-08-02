---
name: bc-extensibility
description: Extend standard Business Central business logic in AL without modifying base app code. Use when subscribing to or publishing events (integration events, event subscribers), hooking into posting routines (Sales/Purchase posting), working with number series, default dimensions, enum extensions, or interfaces for pluggable logic. Also use when asked "how do I hook into X in BC", "run code when a document is posted", or "add a value to a standard enum".
---

# BC Extensibility

Prefer standard BC functionality and configuration before customizing (project rule). When code is needed, extend via events, enums and interfaces — never duplicate base app logic. Full examples: read `references/examples.md`.

## Finding the right hook

1. Search for `IntegrationEvent` publishers in the relevant base app object (use `al_symbolsearch`/`al_symbolrelations` from al-mcp, or Ctrl+Shift+F in `.alpackages` sources).
2. Naming tells intent: `OnBefore<Action>` (can veto via `IsHandled`), `OnAfter<Action>` (react/augment), `OnValidate...` (field-level).
3. If no publisher exists: check whether an enum + interface extension point exists instead; as a last resort, request an event from Microsoft (AL-Go: `#pragma` note it) rather than copying base code.

## Event subscribers

```al
codeunit 95120 "Sales Events"
{
    SingleInstance = true;

    [EventSubscriber(ObjectType::Codeunit, Codeunit::"Sales-Post", OnAfterPostSalesDoc, '', false, false)]
    local procedure OnAfterPostSalesDoc(var SalesHeader: Record "Sales Header"; SalesShptHdrNo: Code[20]; SalesInvHdrNo: Code[20])
    begin
        ...
    end;
}
```

- One subscriber codeunit per functional area (e.g. `SalesEvents.Codeunit.al`), subscribers `local`.
- `SingleInstance = true` only when the codeunit holds state; stateless subscriber codeunits don't need it.
- Keep subscribers thin — delegate real logic to a normal procedure/codeunit so it stays testable.
- `OnBefore*` + `IsHandled` pattern: check `IsHandled` first, set it only when you fully replace the behavior.
- Subscribers run inside the caller's transaction — no `Commit()`, no UI (`GuiAllowed()` guard if you must message).

## Publishing your own events

Add extension points to your own posting/processing codeunits from day one:

```al
[IntegrationEvent(false, false)]
local procedure OnBeforePostRentalContract(var RentalContract: Record "Rental Contract"; var IsHandled: Boolean)
begin
end;
```

First argument `true` only when subscribers need access to the publisher's `var` state (rare).

## Posting routines — key hook points

| Goal | Hook |
|---|---|
| Validate before sales posting | `Sales-Post`: `OnBeforePostSalesDoc` |
| React after sales posting | `Sales-Post`: `OnAfterPostSalesDoc` |
| Add fields to posted documents | TableExt on posted tables + `OnAfterInitFromSalesHeader`-style copy events (fields with same ID/type transfer automatically via `TransferFields`) |
| Influence G/L posting | `Gen. Jnl.-Post Line`: `OnAfterInitGLEntry`, or better: posting setup/dimensions |
| Purchase equivalents | `Purch.-Post` mirrors the sales events |

Custom posting routines follow the base pattern: a `...-Post` codeunit working on a journal-like buffer, `OnRun` = post one document, ledger entries inserted sequentially with `Entry No.` from `FindLast`+1, events published around each step.

## Number series (modern "No. Series" module, BC 24+)

- Setup field `"<Entity> Nos."` (Code[20], `TableRelation = "No. Series"`).
- `OnInsert`: `"No." := NoSeries.GetNextNo(Setup."<Entity> Nos.");`
- `OnValidate` of "No.": `NoSeries.TestManual(...)`; card `AssistEdit`: `NoSeries.LookupRelatedNoSeries(...)`.
- Legacy `NoSeriesManagement` is obsolete — do not use it in new code.

## Dimensions

- Master data entities that post amounts get default dimensions: call `DimMgt.InsertDefaultDim`-pattern via table field triggers, i.e. add your table ID to "Default Dimension" by providing the standard `"Global Dimension 1 Code"`/`"Global Dimension 2 Code"` fields and `ValidateShortcutDimCode` procedure (see examples).
- Documents/journal lines carry `"Dimension Set ID"`; combine sets with `DimensionManagement.GetCombinedDimensionSetID`.
- Posted entries copy the dimension set ID — never rebuild dimensions after posting.

## Enums & interfaces

- Extend standard enums with `enumextension`; `value` IDs in the project range. If the enum implements an interface, provide the implementation: `value(95100; Rental) { Caption = 'Rental'; Implementation = "Price Calculation" = "Rental Price Calc"; }`.
- Own extension points: `enum` with `Extensible = true` + `interface` + a dispatcher (`IPriceCalc := Enum::...`); this beats case-statements that others can't extend.

## Naming & files (project conventions)

- `SalesEvents.Codeunit.al`, `RentalContractPost.Codeunit.al`, `PaymentMethod.EnumExt.al` — PascalCase, `<BaseName>.<ObjectType>.al`.
- Enum extensions named after the base enum (no "Ext" suffix): `enumextension 95100 "Payment Method" extends "Payment Method"`.
- New codeunits require a test codeunit (project rule — see the `al-testing` skill); subscribers are tested by invoking the standard routine (e.g. post a sales order in the test) and asserting the effect.
