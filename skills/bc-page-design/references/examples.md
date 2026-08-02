# BC Page Design — Full AL Examples

Complete, compilable examples following the Claude4BC conventions (English captions, tooltips on table fields, actionref promotion, no prefixes, no "Ext" suffix).

## List page with card drill-down, views and promoted actions

`RentalUnits.Page.al`

```al
page 95100 "Rental Units"
{
    PageType = List;
    SourceTable = "Rental Unit";
    Caption = 'Rental Units';
    CardPageId = "Rental Unit Card";
    Editable = false;
    ApplicationArea = All;
    UsageCategory = Lists;

    layout
    {
        area(Content)
        {
            repeater(General)
            {
                field("No."; Rec."No.")
                {
                    ApplicationArea = All;
                }
                field(Description; Rec.Description)
                {
                    ApplicationArea = All;
                }
                field(Status; Rec.Status)
                {
                    ApplicationArea = All;
                }
                field("Monthly Rate"; Rec."Monthly Rate")
                {
                    ApplicationArea = All;
                }
            }
        }
        area(FactBoxes)
        {
            part(UnitDetails; "Rental Unit FactBox")
            {
                ApplicationArea = All;
                SubPageLink = "No." = field("No.");
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(ReleaseUnits)
            {
                Caption = 'Release';
                Image = ReleaseDoc;
                ToolTip = 'Releases the selected rental units so they can be rented out.';
                ApplicationArea = All;

                trigger OnAction()
                var
                    RentalUnit: Record "Rental Unit";
                begin
                    CurrPage.SetSelectionFilter(RentalUnit);
                    RentalUnit.ModifyAll(Status, RentalUnit.Status::Available, true);
                end;
            }
        }
        area(Promoted)
        {
            group(Category_Process)
            {
                actionref(ReleaseUnits_Promoted; ReleaseUnits) { }
            }
        }
    }

    views
    {
        view(AvailableUnits)
        {
            Caption = 'Available';
            Filters = where(Status = const(Available));
        }
        view(RentedUnits)
        {
            Caption = 'Rented';
            Filters = where(Status = const(Rented));
        }
    }
}
```

Note: no ToolTip on the repeater fields — they inherit from the `Rental Unit` table fields.

## Card page with FastTabs

`RentalUnitCard.Page.al`

```al
page 95101 "Rental Unit Card"
{
    PageType = Card;
    SourceTable = "Rental Unit";
    Caption = 'Rental Unit Card';
    ApplicationArea = All;
    UsageCategory = None; // opened via the list — keep out of search
    DataCaptionFields = "No.", Description;

    layout
    {
        area(Content)
        {
            group(General)
            {
                Caption = 'General';

                field("No."; Rec."No.")
                {
                    ApplicationArea = All;

                    trigger OnAssistEdit()
                    begin
                        if Rec.AssistEdit(xRec) then
                            CurrPage.Update();
                    end;
                }
                field(Description; Rec.Description)
                {
                    ApplicationArea = All;
                    ShowMandatory = true;
                }
                field(Status; Rec.Status)
                {
                    ApplicationArea = All;
                    Importance = Promoted;
                }
            }
            group(Invoicing)
            {
                Caption = 'Invoicing';

                field("Monthly Rate"; Rec."Monthly Rate")
                {
                    ApplicationArea = All;
                }
                field("Gen. Prod. Posting Group"; Rec."Gen. Prod. Posting Group")
                {
                    ApplicationArea = All;
                    Importance = Additional;
                }
            }
        }
    }

    actions
    {
        area(Navigation)
        {
            action(RentalContracts)
            {
                Caption = 'Rental Contracts';
                Image = Documents;
                ToolTip = 'Shows the rental contracts for this rental unit.';
                ApplicationArea = All;
                RunObject = page "Rental Contracts";
                RunPageLink = "Rental Unit No." = field("No.");
            }
        }
        area(Promoted)
        {
            group(Category_Unit)
            {
                Caption = 'Unit';
                actionref(RentalContracts_Promoted; RentalContracts) { }
            }
        }
    }
}
```

## Page extension on a standard page

`ItemCard.PageExt.al` — extension object named after the base object (no "Ext" suffix).

```al
pageextension 95102 "Item Card" extends "Item Card"
{
    layout
    {
        addlast(General)
        {
            field("Rental Unit No."; Rec."Rental Unit No.")
            {
                ApplicationArea = All;
                ToolTip = 'Specifies the rental unit that this item is assigned to.';
            }
        }
        movebefore("Rental Unit No."; Description)
    }

    actions
    {
        addlast(Processing)
        {
            action(AssignRentalUnit)
            {
                Caption = 'Assign Rental Unit';
                Image = LinkWithExisting;
                ToolTip = 'Assigns this item to a rental unit.';
                ApplicationArea = All;

                trigger OnAction()
                begin
                    Rec.AssignRentalUnit();
                end;
            }
        }
        addlast(Category_Process)
        {
            actionref(AssignRentalUnit_Promoted; AssignRentalUnit) { }
        }
    }
}
```

On page extensions the ToolTip is stated explicitly on each added field (project rule) — unless the field's table-extension field already defines it and the inherited text fits.

## Setup page (single-record pattern)

```al
page 95103 "Rental Setup"
{
    PageType = Card;
    SourceTable = "Rental Setup";
    Caption = 'Rental Setup';
    ApplicationArea = All;
    UsageCategory = Administration;
    InsertAllowed = false;
    DeleteAllowed = false;

    layout
    {
        area(Content)
        {
            group(Numbering)
            {
                Caption = 'Numbering';

                field("Rental Unit Nos."; Rec."Rental Unit Nos.")
                {
                    ApplicationArea = All;
                }
            }
        }
    }

    trigger OnOpenPage()
    begin
        Rec.Reset();
        if not Rec.Get() then begin
            Rec.Init();
            Rec.Insert();
        end;
    end;
}
```
