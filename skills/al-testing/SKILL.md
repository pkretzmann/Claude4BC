---
name: al-testing
description: Write AL test codeunits for Business Central. Use when writing or reviewing tests for AL code — test codeunits (Subtype = Test), Given/When/Then structure, test libraries, Assert, UI handlers (ConfirmHandler, MessageHandler, ModalPageHandler), TestPage interaction, or test isolation/initialization. Project rule — every new codeunit and table extension must get a test codeunit, so also use this after implementing new AL objects.
---

# AL Testing

Write tests like the BC system application does. Project rule: **new codeunits and table extensions always get an AL test codeunit.** Full examples: read `references/examples.md`.

## Test app basics

- Tests live in a separate test app (AL-Go: `test/` folder with its own `app.json`) that depends on the main app plus Microsoft's test libraries: *Library Assert*, *Tests-TestLibraries*, *Any*.
- File naming: `<Name>Test.Codeunit.al` (e.g. `RentalUnitTest.Codeunit.al`).
- Run tests via AL Test Tool, AL-Go pipeline, or `al_run_tests` (al-mcp).

## Test codeunit skeleton

```al
codeunit 95150 "Rental Unit Test"
{
    Subtype = Test;
    TestPermissions = Disabled;

    var
        Assert: Codeunit "Library Assert";
        LibraryRental: Codeunit "Library - Rental";
        IsInitialized: Boolean;

    [Test]
    procedure MonthlyRateCannotBeNegative()
    begin
        // [SCENARIO] Validation rejects a negative monthly rate
        Initialize();
        // [GIVEN] / [WHEN] / [THEN] — see structure below
    end;

    local procedure Initialize()
    begin
        if IsInitialized then
            exit;
        // one-time setup: create setup record, number series, posting groups
        IsInitialized := true;
        Commit();
    end;
}
```

## Given/When/Then structure (matches the DevOps TEST-task format)

Every test follows the same comment skeleton — these comments mirror the acceptance criteria on the TEST work item:

```al
[Test]
procedure PostingCreatesLedgerEntry()
begin
    // [SCENARIO 95001] Posting a rental contract creates a rental ledger entry
    Initialize();

    // [GIVEN] A rental unit and a released rental contract
    ...
    // [WHEN] The contract is posted
    ...
    // [THEN] A rental ledger entry exists with the contract amount
    ...
end;
```

- One behavior per test; the procedure name states the expected outcome (`PostingCreatesLedgerEntry`, not `Test1`).
- `[SCENARIO]` line can carry the AB# work item number.

## Assertions

Use `Assert` (codeunit "Library Assert") with a message per assertion:

```al
Assert.AreEqual(ExpectedAmount, RentalLedgerEntry.Amount, 'Ledger entry amount');
Assert.IsTrue(RentalUnit.Get(UnitNo), 'Rental unit must exist');
Assert.RecordCount(RentalLedgerEntry, 1);
asserterror RentalUnit.Validate("Monthly Rate", -1);
Assert.ExpectedError('cannot be negative');   // partial match — avoid asserting full formatted strings
```

## UI handlers

Tests run headless — any UI interaction needs a handler declared on the test:

```al
[Test]
[HandlerFunctions('ConfirmYesHandler,PostedMessageHandler')]
procedure PostWithConfirmation() ...

[ConfirmHandler]
procedure ConfirmYesHandler(Question: Text[1024]; var Reply: Boolean)
begin
    Reply := true;
end;

[MessageHandler]
procedure PostedMessageHandler(Message: Text[1024])
begin
end;
```

Other common handlers: `[ModalPageHandler]`, `[PageHandler]`, `[StrMenuHandler]`, `[RequestPageHandler]`, `[SendNotificationHandler]`. An unfired declared handler fails the test — declare only the ones the scenario triggers.

## TestPages (testing page behavior)

```al
var
    RentalUnitCard: TestPage "Rental Unit Card";
begin
    RentalUnitCard.OpenEdit();
    RentalUnitCard.GoToRecord(RentalUnit);
    RentalUnitCard."Monthly Rate".SetValue(1000);
    RentalUnitCard.Close();
end;
```

Use TestPages when the behavior lives on the page (visibility, editability, actions, page triggers); test table/codeunit logic directly on records instead.

## Library codeunits

Put reusable test-data creation in a `Library - <Area>` codeunit (file `LibraryRental.Codeunit.al`, normal Subtype):

- `CreateRentalUnit(var RentalUnit: Record "Rental Unit")` — inserts a valid record with generated data (use codeunit `Any` for random values).
- Use Microsoft's libraries for standard data: `Library - Sales`, `Library - Inventory`, `Library - ERP Setup`, etc. — never hand-roll a customer or item.

## Isolation & pitfalls

- Each test creates its own data; never depend on demo data or on another test's leftovers.
- The `Initialize()` + `IsInitialized` pattern handles one-time setup; per-test data goes in `[GIVEN]`.
- `asserterror` rolls back the failed statement only — re-get records afterwards.
- `Commit()` only at the end of `Initialize()`; a stray `Commit()` in test flow breaks isolation.
- Dimensions, number series, and posting setup are the usual missing pieces when a posting test fails — create them in the library, not inline.
