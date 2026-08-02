# BC Table Design — Full AL Examples

Complete examples following the Claude4BC conventions (English captions, tooltips on table fields, no prefixes, no "Ext" suffix).

## Master data table with number series, FlowField and SIFT

`RentalUnit.Table.al`

```al
table 95100 "Rental Unit"
{
    Caption = 'Rental Unit';
    DataClassification = CustomerContent;
    LookupPageId = "Rental Units";
    DrillDownPageId = "Rental Units";

    fields
    {
        field(1; "No."; Code[20])
        {
            Caption = 'No.';
            ToolTip = 'Specifies the number of the rental unit.';

            trigger OnValidate()
            begin
                if "No." <> xRec."No." then begin
                    GetRentalSetup();
                    NoSeries.TestManual(RentalSetup."Rental Unit Nos.");
                    "No. Series" := '';
                end;
            end;
        }
        field(2; Description; Text[100])
        {
            Caption = 'Description';
            ToolTip = 'Specifies a description of the rental unit.';
        }
        field(3; Status; Enum "Rental Unit Status")
        {
            Caption = 'Status';
            ToolTip = 'Specifies whether the rental unit is available, rented, or blocked.';
        }
        field(10; "Monthly Rate"; Decimal)
        {
            Caption = 'Monthly Rate';
            ToolTip = 'Specifies the monthly rental rate for the unit.';
            AutoFormatType = 1;
            MinValue = 0;
        }
        field(11; "Gen. Prod. Posting Group"; Code[20])
        {
            Caption = 'Gen. Prod. Posting Group';
            ToolTip = 'Specifies the general product posting group used when posting rental income for this unit.';
            TableRelation = "Gen. Product Posting Group";
        }
        field(20; "Rented Amount"; Decimal)
        {
            Caption = 'Rented Amount';
            ToolTip = 'Specifies the total amount posted for this rental unit within the date filter.';
            FieldClass = FlowField;
            CalcFormula = sum("Rental Ledger Entry".Amount where(
                "Rental Unit No." = field("No."),
                "Posting Date" = field("Date Filter")));
            Editable = false;
            AutoFormatType = 1;
        }
        field(21; "Date Filter"; Date)
        {
            Caption = 'Date Filter';
            ToolTip = 'Specifies the date filter used to calculate amounts for the rental unit.';
            FieldClass = FlowFilter;
        }
        field(30; "No. Series"; Code[20])
        {
            Caption = 'No. Series';
            ToolTip = 'Specifies the number series used to assign the number of the rental unit.';
            TableRelation = "No. Series";
            Editable = false;
        }
    }

    keys
    {
        key(PK; "No.")
        {
            Clustered = true;
        }
        key(Status; Status, Description) { }
    }

    fieldgroups
    {
        fieldgroup(DropDown; "No.", Description, Status) { }
        fieldgroup(Brick; "No.", Description, Status, "Monthly Rate") { }
    }

    var
        RentalSetup: Record "Rental Setup";
        NoSeries: Codeunit "No. Series";
        SetupRead: Boolean;

    trigger OnInsert()
    begin
        if "No." = '' then begin
            GetRentalSetup();
            RentalSetup.TestField("Rental Unit Nos.");
            "No. Series" := RentalSetup."Rental Unit Nos.";
            "No." := NoSeries.GetNextNo("No. Series");
        end;
    end;

    trigger OnDelete()
    var
        RentalLedgerEntry: Record "Rental Ledger Entry";
    begin
        RentalLedgerEntry.SetRange("Rental Unit No.", "No.");
        if not RentalLedgerEntry.IsEmpty() then
            Error(HasEntriesErr, "No.");
    end;

    local procedure GetRentalSetup()
    begin
        if SetupRead then
            exit;
        RentalSetup.Get();
        SetupRead := true;
    end;

    procedure AssistEdit(OldRentalUnit: Record "Rental Unit"): Boolean
    begin
        GetRentalSetup();
        RentalSetup.TestField("Rental Unit Nos.");
        if NoSeries.LookupRelatedNoSeries(RentalSetup."Rental Unit Nos.", OldRentalUnit."No. Series", "No. Series") then begin
            "No." := NoSeries.GetNextNo("No. Series");
            exit(true);
        end;
    end;

    var
        HasEntriesErr: Label 'You cannot delete rental unit %1 because it has ledger entries.', Comment = '%1 = Rental Unit No.';
}
```

Supporting enum (`RentalUnitStatus.Enum.al`):

```al
enum 95100 "Rental Unit Status"
{
    Extensible = true;

    value(0; Available) { Caption = 'Available'; }
    value(1; Rented) { Caption = 'Rented'; }
    value(2; Blocked) { Caption = 'Blocked'; }
}
```

## Table extension on a standard table

`Item.TableExt.al` — named after the base object (no "Ext" suffix). New table extensions require a test codeunit (project rule).

```al
tableextension 95101 Item extends Item
{
    fields
    {
        field(95100; "Rental Unit No."; Code[20])
        {
            Caption = 'Rental Unit No.';
            ToolTip = 'Specifies the rental unit that this item is assigned to.';
            DataClassification = CustomerContent;
            TableRelation = "Rental Unit" where(Status = const(Available));

            trigger OnValidate()
            var
                RentalUnit: Record "Rental Unit";
            begin
                if "Rental Unit No." = '' then
                    exit;
                RentalUnit.Get("Rental Unit No.");
                RentalUnit.TestField(Status, RentalUnit.Status::Available);
            end;
        }
        field(95101; "Rental Income Total"; Decimal)
        {
            Caption = 'Rental Income Total';
            ToolTip = 'Specifies the total rental income posted for the item''s rental unit.';
            FieldClass = FlowField;
            CalcFormula = sum("Rental Ledger Entry".Amount where("Rental Unit No." = field("Rental Unit No.")));
            Editable = false;
            AutoFormatType = 1;
        }
    }

    keys
    {
        key(RentalUnit; "Rental Unit No.") { }
    }

    procedure AssignRentalUnit()
    var
        RentalUnit: Record "Rental Unit";
        RentalUnits: Page "Rental Units";
    begin
        RentalUnit.SetRange(Status, RentalUnit.Status::Available);
        RentalUnits.SetTableView(RentalUnit);
        RentalUnits.LookupMode(true);
        if RentalUnits.RunModal() = Action::LookupOK then begin
            RentalUnits.GetRecord(RentalUnit);
            Validate("Rental Unit No.", RentalUnit."No.");
            Modify(true);
        end;
    end;
}
```

## Setup table (single record)

`RentalSetup.Table.al`

```al
table 95102 "Rental Setup"
{
    Caption = 'Rental Setup';
    DataClassification = CustomerContent;

    fields
    {
        field(1; "Primary Key"; Code[10])
        {
            Caption = 'Primary Key';
            ToolTip = 'Specifies the primary key of the setup record.';
        }
        field(2; "Rental Unit Nos."; Code[20])
        {
            Caption = 'Rental Unit Nos.';
            ToolTip = 'Specifies the number series used for rental units.';
            TableRelation = "No. Series";
        }
    }

    keys
    {
        key(PK; "Primary Key")
        {
            Clustered = true;
        }
    }
}
```
