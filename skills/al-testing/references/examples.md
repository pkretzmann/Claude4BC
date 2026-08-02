# AL Testing — Full Examples

Complete test codeunit + library codeunit for the Rental Unit examples used in the `bc-table-design` and `bc-page-design` skills.

## Test codeunit

`RentalUnitTest.Codeunit.al`

```al
codeunit 95150 "Rental Unit Test"
{
    Subtype = Test;
    TestPermissions = Disabled;

    var
        Assert: Codeunit "Library Assert";
        LibraryRental: Codeunit "Library - Rental";
        Any: Codeunit Any;
        IsInitialized: Boolean;

    [Test]
    procedure InsertAssignsNumberFromSeries()
    var
        RentalUnit: Record "Rental Unit";
    begin
        // [SCENARIO] Inserting a rental unit without a number assigns one from the number series
        Initialize();

        // [GIVEN] An empty rental unit record
        RentalUnit.Init();

        // [WHEN] The record is inserted
        RentalUnit.Insert(true);

        // [THEN] A number is assigned and the series is recorded
        Assert.AreNotEqual('', RentalUnit."No.", 'No. must be assigned from the number series');
        Assert.AreNotEqual('', RentalUnit."No. Series", 'No. Series must be recorded');
    end;

    [Test]
    procedure NegativeMonthlyRateIsRejected()
    var
        RentalUnit: Record "Rental Unit";
    begin
        // [SCENARIO] Validation rejects a negative monthly rate
        Initialize();

        // [GIVEN] A rental unit
        LibraryRental.CreateRentalUnit(RentalUnit);

        // [WHEN] A negative monthly rate is validated
        asserterror RentalUnit.Validate("Monthly Rate", -1);

        // [THEN] The validation fails
        Assert.ExpectedErrorCode('TestValidation');
    end;

    [Test]
    procedure CannotDeleteUnitWithLedgerEntries()
    var
        RentalUnit: Record "Rental Unit";
    begin
        // [SCENARIO] A rental unit with ledger entries cannot be deleted
        Initialize();

        // [GIVEN] A rental unit with one ledger entry
        LibraryRental.CreateRentalUnit(RentalUnit);
        LibraryRental.CreateRentalLedgerEntry(RentalUnit."No.", Any.DecimalInRange(100, 1000, 2));

        // [WHEN] The unit is deleted
        asserterror RentalUnit.Delete(true);

        // [THEN] Deletion is blocked with an explanatory error
        Assert.ExpectedError('ledger entries');
    end;

    [Test]
    [HandlerFunctions('ConfirmYesHandler')]
    procedure ReleaseActionSetsStatusAvailable()
    var
        RentalUnit: Record "Rental Unit";
        RentalUnits: TestPage "Rental Units";
    begin
        // [SCENARIO] The Release action on the list sets the unit status to Available
        Initialize();

        // [GIVEN] A blocked rental unit shown on the list page
        LibraryRental.CreateRentalUnit(RentalUnit);
        RentalUnit.Validate(Status, RentalUnit.Status::Blocked);
        RentalUnit.Modify(true);
        RentalUnits.OpenView();
        RentalUnits.GoToRecord(RentalUnit);

        // [WHEN] The Release action is invoked
        RentalUnits.ReleaseUnits.Invoke();

        // [THEN] The unit is available
        RentalUnit.Get(RentalUnit."No.");
        Assert.AreEqual(RentalUnit.Status::Available, RentalUnit.Status, 'Status after release');
    end;

    [ConfirmHandler]
    procedure ConfirmYesHandler(Question: Text[1024]; var Reply: Boolean)
    begin
        Reply := true;
    end;

    local procedure Initialize()
    begin
        if IsInitialized then
            exit;
        LibraryRental.EnsureRentalSetup();
        IsInitialized := true;
        Commit();
    end;
}
```

## Library codeunit

`LibraryRental.Codeunit.al` — reusable, valid test data; no `Subtype = Test`.

```al
codeunit 95151 "Library - Rental"
{
    var
        Any: Codeunit Any;

    procedure EnsureRentalSetup()
    var
        RentalSetup: Record "Rental Setup";
        NoSeries: Record "No. Series";
        NoSeriesLine: Record "No. Series Line";
    begin
        if not RentalSetup.Get() then begin
            RentalSetup.Init();
            RentalSetup.Insert();
        end;
        if RentalSetup."Rental Unit Nos." <> '' then
            exit;

        NoSeries.Init();
        NoSeries.Code := 'RENTAL-T';
        NoSeries."Default Nos." := true;
        NoSeries."Manual Nos." := true;
        if NoSeries.Insert() then;

        NoSeriesLine.Init();
        NoSeriesLine."Series Code" := NoSeries.Code;
        NoSeriesLine."Line No." := 10000;
        NoSeriesLine."Starting No." := 'RU00001';
        if NoSeriesLine.Insert() then;

        RentalSetup.Validate("Rental Unit Nos.", NoSeries.Code);
        RentalSetup.Modify(true);
    end;

    procedure CreateRentalUnit(var RentalUnit: Record "Rental Unit")
    begin
        EnsureRentalSetup();
        RentalUnit.Init();
        RentalUnit.Insert(true);
        RentalUnit.Validate(Description, Any.AlphanumericText(50));
        RentalUnit.Validate("Monthly Rate", Any.DecimalInRange(100, 10000, 2));
        RentalUnit.Modify(true);
    end;

    procedure CreateRentalLedgerEntry(RentalUnitNo: Code[20]; Amount: Decimal)
    var
        RentalLedgerEntry: Record "Rental Ledger Entry";
        EntryNo: Integer;
    begin
        if RentalLedgerEntry.FindLast() then
            EntryNo := RentalLedgerEntry."Entry No.";
        RentalLedgerEntry.Init();
        RentalLedgerEntry."Entry No." := EntryNo + 1;
        RentalLedgerEntry."Rental Unit No." := RentalUnitNo;
        RentalLedgerEntry."Posting Date" := WorkDate();
        RentalLedgerEntry.Amount := Amount;
        RentalLedgerEntry.Insert();
    end;
}
```

## Test app.json fragment

```json
{
  "dependencies": [
    { "id": "<main-app-id>", "name": "<Main App>", "publisher": "<Publisher>", "version": "1.0.0.0" },
    { "id": "dd0be2ea-f733-4d65-bb34-a28f4624fb14", "name": "Library Assert", "publisher": "Microsoft", "version": "26.0.0.0" },
    { "id": "9856ae4f-d1a7-46ef-89bb-6ef056398228", "name": "System Application Test Library", "publisher": "Microsoft", "version": "26.0.0.0" },
    { "id": "e7320ebb-08b3-4406-b1ec-b4927d3e280b", "name": "Any", "publisher": "Microsoft", "version": "26.0.0.0" },
    { "id": "5d86850b-0d76-4eca-bd7b-951ad998e997", "name": "Tests-TestLibraries", "publisher": "Microsoft", "version": "26.0.0.0" }
  ]
}
```

Adjust versions to the project's BC version; AL-Go pipelines resolve them at build time.
