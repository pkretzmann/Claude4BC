---
name: bc-page-design
description: Design and implement Business Central pages in AL. Use when creating or reviewing AL page or pageextension objects — choosing a page type (List, Card, Document, ListPart, CardPart, Worksheet, Role Center), laying out fields and FastTabs, adding actions or promoted actions (actionref), defining views, or wiring a list page to a card. Also use when asked to "make a page", "add a field to a page", or "extend a standard BC page".
---

# BC Page Design

Design pages the way the BC base application does. Follow alguidelines.dev and the shared Claude4BC conventions. Full AL examples: read `references/examples.md`.

## Choosing the page type

| Scenario | PageType | Notes |
|---|---|---|
| Overview of records, entry point | `List` | Set `CardPageId` so drill-down opens the card; `UsageCategory = Lists` |
| View/edit one master record | `Card` | FastTabs via `group()`; opened from list, so `UsageCategory = None` |
| Header + lines document | `Document` | Header fields in groups + a `part()` for the lines ListPart |
| Lines inside a document | `ListPart` | `AutoSplitKey = true` for line tables |
| Embedded FactBox | `CardPart` / `ListPart` | Referenced via `part()` in a `FactBoxes` area |
| Batch/journal entry | `Worksheet` | |
| Setup with one record | `Card` | `InsertAllowed = false; DeleteAllowed = false;` + `OnOpenPage` insert-if-empty pattern |
| Pick a record in a dialog | `List` | `LookupPageId` on the table points here |

## Skeleton rules

- `layout { area(Content) { ... } }` — lists use one `repeater(General)`; cards use FastTab `group()` blocks (`General` first, then functional groups, e.g. `Invoicing`, `Shipping`).
- Field order: primary key / No. first, then Description/Name, then the fields users need most. Card FastTabs group by task, not by table layout.
- Set `ApplicationArea = All` on every field and action (or the project's specific area).
- Lists: `Editable = false` when editing belongs on the card; set `SourceTableView` for fixed filtering/sorting.
- Add `views { view(...) { Filters = ...; } }` on list pages for common filtered slices instead of separate pages.
- FactBoxes: `area(FactBoxes)` with `part()` + `SubPageLink`.

## Actions

Use the modern promoted-actions syntax (BC 2022 wave 2+). Never use `Promoted = true` / `PromotedCategory` together with `actionref` on the same page.

```al
actions
{
    area(Processing)
    {
        action(PostDocument)
        {
            Caption = 'Post';
            Image = Post;
            ToolTip = 'Posts the document.';
            trigger OnAction() ...
        }
    }
    area(Navigation) { /* related pages, Image = ... */ }
    area(Promoted)
    {
        group(Category_Process)
        {
            actionref(PostDocument_Promoted; PostDocument) { }
        }
    }
}
```

- Promote only frequently used actions; on lists promote multi-row/process actions, on cards promote the follow-up actions (e.g. posting, approval). Don't mirror the same promoted set on list and card.
- Actions always need `ToolTip` (they have no table to inherit from) and an `Image`.

## Caption & ToolTip rules (project conventions — always apply)

- Captions and ToolTips are written in **English**. Translations go in XLIFF files (see `/c4bc:al-update-translations`).
- **Page objects: do NOT set ToolTip on fields.** ToolTips are defined on the table fields (BC 2024 wave 1+ / runtime 13.0, enforced by CodeCop AA0234) and inherited by every page. Only override on a page when the same field genuinely needs different guidance in that context.
- **PageExtension objects: ToolTip IS required on every added field** (when the field comes from a table extension, the tooltip still lives on the table extension field — but verify one exists; if the base table field has none, set it on the pageext field).
- ToolTip style: start with "Specifies …", ≤ 200 characters, no abbreviations.
- Field `Caption` comes from the table — never repeat it on the page unless it must differ.

## Naming & files (project conventions)

- No object prefixes unless agreed with the customer; namespaces ensure uniqueness.
- Page extension objects are named after the base object, **no "Ext" suffix**: `pageextension 95008 "Item Card" extends "Item Card"`.
- File names: `<BaseName>.Page.al` / `<BaseName>.PageExt.al` in PascalCase without spaces, e.g. `RentalUnitCard.Page.al`, `ItemCard.PageExt.al`.

## Required page properties checklist

- [ ] `PageType`, `SourceTable`, `Caption`
- [ ] List: `UsageCategory` (Lists/Documents/Tasks/Administration) + `ApplicationArea` on the page — required for search ("Tell me")
- [ ] List: `CardPageId` pointing to the card
- [ ] Card opened from a list: `UsageCategory = None` (avoid duplicate search hits)
- [ ] `DataCaptionFields` on cards showing which record is open (defaults to primary key + Description-like field)
- [ ] `Editable`, `InsertAllowed`, `DeleteAllowed`, `ModifyAllowed` where the default is wrong
- [ ] `AboutTitle`/`AboutText` (teaching tips) on pages central to a user workflow

## Quality gates

- Compile clean against CodeCop/UICop — especially AW0013 (mixed promoted syntax) and tooltip rules.
- Every new page reachable: from search (`UsageCategory`), from a related page action, or as a part.
- Consider a test codeunit with TestPages for page logic (see the `al-testing` skill).
