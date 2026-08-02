# BC Extensibility — Full AL Examples

## Event subscriber codeunit (sales posting)

`SalesEvents.Codeunit.al`

```al
codeunit 95120 "Sales Events"
{
    [EventSubscriber(ObjectType::Codeunit, Codeunit::"Sales-Post", OnBeforePostSalesDoc, '', false, false)]
    local procedure OnBeforePostSalesDoc(var SalesHeader: Record "Sales Header")
    var
        RentalContractCheck: Codeunit "Rental Contract Check";
    begin
        RentalContractCheck.VerifySalesHeader(SalesHeader);
    end;

    [EventSubscriber(ObjectType::Codeunit, Codeunit::"Sales-Post", OnAfterPostSalesDoc, '', false, false)]
    local procedure OnAfterPostSalesDoc(var SalesHeader: Record "Sales Header"; var GenJnlPostLine: Codeunit "Gen. Jnl.-Post Line"; SalesShptHdrNo: Code[20]; RetRcpHdrNo: Code[20]; SalesInvHdrNo: Code[20]; SalesCrMemoHdrNo: Code[20])
    var
        RentalIncomePosting: Codeunit "Rental Income Posting";
    begin
        if SalesInvHdrNo <> '' then
            RentalIncomePosting.RegisterInvoice(SalesHeader, SalesInvHdrNo);
    end;
}
```

The subscribers stay thin; `Rental Contract Check` and `Rental Income Posting` hold the logic and get their own test codeunits.

Note: base app event signatures change between versions — always verify the current parameter list with `al_symbolsearch` (al-mcp) or Go to Definition on the publisher before writing the subscriber.

## OnBefore + IsHandled veto pattern

```al
[EventSubscriber(ObjectType::Codeunit, Codeunit::"Sales-Post", OnBeforeSendPostedDocumentRecord, '', false, false)]
local procedure OnBeforeSendPostedDocumentRecord(var SalesHeader: Record "Sales Header"; var IsHandled: Boolean)
begin
    if IsHandled then
        exit; // someone else already replaced the behavior
    if not UsesRentalDelivery(SalesHeader) then
        exit;
    SendViaRentalPortal(SalesHeader);
    IsHandled := true; // we fully replaced the standard behavior
end;
```

## Publishing integration events in your own routine

`RentalContractPost.Codeunit.al` (skeleton of a custom posting routine):

```al
codeunit 95121 "Rental Contract Post"
{
    TableNo = "Rental Contract";

    trigger OnRun()
    var
        IsHandled: Boolean;
    begin
        OnBeforePostRentalContract(Rec, IsHandled);
        if IsHandled then
            exit;

        CheckContract(Rec);
        PostLedgerEntries(Rec);
        FinalizeContract(Rec);

        OnAfterPostRentalContract(Rec);
    end;

    local procedure PostLedgerEntries(var RentalContract: Record "Rental Contract")
    var
        RentalLedgerEntry: Record "Rental Ledger Entry";
        NextEntryNo: Integer;
    begin
        if RentalLedgerEntry.FindLast() then
            NextEntryNo := RentalLedgerEntry."Entry No.";
        NextEntryNo += 1;

        RentalLedgerEntry.Init();
        RentalLedgerEntry."Entry No." := NextEntryNo;
        RentalLedgerEntry."Rental Unit No." := RentalContract."Rental Unit No.";
        RentalLedgerEntry."Posting Date" := RentalContract."Posting Date";
        RentalLedgerEntry.Amount := RentalContract."Monthly Rate";
        RentalLedgerEntry."Dimension Set ID" := RentalContract."Dimension Set ID";
        OnBeforeInsertRentalLedgerEntry(RentalLedgerEntry, RentalContract);
        RentalLedgerEntry.Insert();
    end;

    [IntegrationEvent(false, false)]
    local procedure OnBeforePostRentalContract(var RentalContract: Record "Rental Contract"; var IsHandled: Boolean)
    begin
    end;

    [IntegrationEvent(false, false)]
    local procedure OnAfterPostRentalContract(var RentalContract: Record "Rental Contract")
    begin
    end;

    [IntegrationEvent(false, false)]
    local procedure OnBeforeInsertRentalLedgerEntry(var RentalLedgerEntry: Record "Rental Ledger Entry"; RentalContract: Record "Rental Contract")
    begin
    end;
}
```

## Default dimensions on a custom master data table

Add the standard shortcut-dimension plumbing to the entity table:

```al
field(40; "Global Dimension 1 Code"; Code[20])
{
    Caption = 'Global Dimension 1 Code';
    ToolTip = 'Specifies the global dimension 1 code for the rental unit.';
    CaptionClass = '1,1,1';
    TableRelation = "Dimension Value".Code where("Global Dimension No." = const(1));

    trigger OnValidate()
    begin
        ValidateShortcutDimCode(1, "Global Dimension 1 Code");
    end;
}

procedure ValidateShortcutDimCode(FieldNumber: Integer; var ShortcutDimCode: Code[20])
var
    DimMgt: Codeunit DimensionManagement;
begin
    DimMgt.ValidateDimValueCode(FieldNumber, ShortcutDimCode);
    if not IsTemporary then begin
        DimMgt.SaveDefaultDim(Database::"Rental Unit", "No.", FieldNumber, ShortcutDimCode);
        Modify();
    end;
end;
```

And register the table for default dimensions:

```al
[EventSubscriber(ObjectType::Codeunit, Codeunit::DimensionManagement, OnSetupObjectNoList, '', false, false)]
local procedure OnSetupObjectNoList(var TempAllObjWithCaption: Record AllObjWithCaption temporary)
var
    DimMgt: Codeunit DimensionManagement;
begin
    DimMgt.DefaultDimObjectNoWithGlobalDimsList(TempAllObjWithCaption, Database::"Rental Unit");
end;
```

## Enum extension + interface implementation

`PriceCalculationHandler.EnumExt.al`

```al
enumextension 95122 "Price Calculation Handler" extends "Price Calculation Handler"
{
    value(95120; "Rental Pricing")
    {
        Caption = 'Rental Pricing';
        Implementation = "Price Calculation" = "Rental Price Calculation";
    }
}
```

## Own extension point: enum + interface + dispatcher

```al
enum 95123 "Rental Charge Type" implements "Rental Charge Calculation"
{
    Extensible = true;

    value(0; Monthly)
    {
        Caption = 'Monthly';
        Implementation = "Rental Charge Calculation" = "Monthly Charge Calc";
    }
    value(1; Daily)
    {
        Caption = 'Daily';
        Implementation = "Rental Charge Calculation" = "Daily Charge Calc";
    }
}

interface "Rental Charge Calculation"
{
    procedure CalculateCharge(RentalContract: Record "Rental Contract"): Decimal;
}
```

Dispatch without a case statement — other apps can extend the enum and plug in:

```al
local procedure GetCharge(RentalContract: Record "Rental Contract"): Decimal
var
    ChargeCalc: Interface "Rental Charge Calculation";
begin
    ChargeCalc := RentalContract."Charge Type";
    exit(ChargeCalc.CalculateCharge(RentalContract));
end;
```

## Testing a subscriber

Subscribers are tested through the standard routine they hook into:

```al
[Test]
procedure PostingSalesInvoiceRegistersRentalIncome()
begin
    // [SCENARIO] Posting a sales invoice for a rental item registers rental income
    Initialize();
    // [GIVEN] A sales invoice with a rental item line
    LibraryRental.CreateSalesInvoiceWithRentalItem(SalesHeader);
    // [WHEN] The invoice is posted (fires Sales-Post events)
    PostedInvoiceNo := LibrarySales.PostSalesDocument(SalesHeader, true, true);
    // [THEN] Rental income is registered for the unit
    ...
end;
```
