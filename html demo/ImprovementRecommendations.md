# Customer Base App — Improvement Recommendations

> Prioriteret backlog af korrektheds-, robustheds- og vedligeholdelsesforbedringer for
> Customer-udvidelsen (app v27.0.0.10, BC Cloud platform 25, runtime 16, ID-interval 50000–50149),
> baseret på en fuld gennemgang af alle 563 `.al`-objekter under `src/`.
>
> Gennemgangen dækker modulerne **Inventory** (136 filer), **Manufacturing** (116), **Warehouse** (75),
> **Sales** (71), **Operation** (71), **Base** (45), **Purchases** (43), **AgriNorCold** (3) og
> **ControlAddIns** (3). Hvert punkt nævner de(t) relevante objekt(er), så det kan tages op direkte.

## Sådan læses dokumentet

- **P1** = høj effekt på korrekthed/stabilitet, gøres først. **P2** = meningsfuld forbedring. **P3** = oprydning / nice-to-have.
- **(verificeret)** = læst og bekræftet i koden. **(gennemgående)** = mønster der optræder mange steder og bør auditeres samlet. **(TODO i kode)** = allerede markeret med en `// TODO`-kommentar.
- Objekt-, felt- og procedurenavne holdes på **engelsk**; brødtekst er på **dansk**.

---

## 1. Korrekthedsfejl i Operation-modulets PASTA-objekter — copy-paste fra NEST

Operation-modulet har parallelle objektsæt for produktionslinjerne **NEST** og **PASTA**. Flere PASTA-objekter
er tydeligvis kopieret fra NEST-versionen uden at rette tabelreferencerne, så PASTA-logik læser og **skriver**
i NEST-tabeller. Dette er den alvorligste klynge af fund, fordi det er en stille data-integritetsfejl — der
kastes ingen fejl, men data ender i de forkerte tabeller.

- [ ] **P1 — `Operation Report Pasta` indsætter børneposter i NEST-tabeller** *(verificeret)*. I
  `OperationReportPasta.Table.al:29-32` deklarerer `OnValidate` på feltet `"Production Order"` lokale
  records af typen `Record "Finished Good NEST"` og `Record "Water Accounting NEST"`, og indsætter i dem
  (linje 52-80). Da objektet er PASTA-operationsrapporten, bør det bruge `"Finished Good Pasta"` (table 50041)
  og `"Water Accounting Pasta"` (table 50043). I dag landes PASTA-vand- og færdigvareregistreringer i
  NEST-tabellerne → forkert rapportering og forurenede NEST-data.
- [ ] **P1 — `Start/Stop-Snail Pasta` slår op i `Operation Report NEST`** *(verificeret)*. I
  `StartStopSnailPASTA.Table.al:26` bruger `OnValidate` på `"Operation Report Entry No."` en
  `Record "Operation Report NEST"` (linje 26-29) til at finde `LineNo`, selvom feltets `TableRelation`
  (linje 21) korrekt peger på `"Operation Report Pasta"`. Opslaget bør ske mod `"Operation Report Pasta"`.
- [ ] **P1 — `Start/Stop-Snail Pasta.FindEntryNo` finder max Entry No. i NEST-tabellen** *(verificeret)*.
  `StartStopSnailPASTA.Table.al:155` deklarerer `Snail: Record "Start/Stop-Snail NEST"` og beregner næste
  `Entry No.` ud fra NEST-tabellen i stedet for PASTA-tabellen (`StartStopSnailPASTA.Table.al:153-170`).
  Resultatet kan give dublerede eller springende nøgler i PASTA-tabellen.
- [ ] **P2 — Felt `"Item No."` på `Start/Stop-Snail Pasta` er `Code[100]` og slår op i `"Line No."`**
  *(verificeret)*. `StartStopSnailPASTA.Table.al:72-77`: feltet hedder `"Item No."` men har
  `CalcFormula = lookup("Operation Report Pasta"."Line No." …)` og typen `Code[100]` (standard Item No. er
  `Code[20]`). Enten er navnet forkert, eller også er formlen forkert — afklar intentionen og ret type/formel.
- [ ] **P3 — `Reason`-option har caption/member-mismatch** *(verificeret)*. På både
  `StartStopSnailPASTA.Table.al:55-60` og `StartStopSnailNEST.Table.al` har `OptionCaption` værdien `…,TEST`
  mens `OptionMembers` har `…,Maintainance`. Caption og member bør stemme overens for at undgå forvirring i UI
  og i kode der refererer til option-værdien.

> **Anbefaling:** Gennemgå **hele** PASTA-mappen (`src/Operation/PASTA`) systematisk mod NEST-pendanten og
> verificér hver tabel-/record-reference. Mønstret optræder mindst tre steder; der kan være flere.

---

## 2. Defensiv håndtering af `Get()` og `FindFirst()` *(gennemgående)*

Gennem hele kodebasen kaldes `Get()` på setup- og master-tabeller (og `FindFirst()` på filtrerede sæt) uden
at returværdien tjekkes, hvorefter felter læses fra en evt. tom/uinitialiseret record. Resultatet er stille
fejl: tomme felter skrives videre, eller en efterfølgende validering fejler med en kryptisk besked langt fra
årsagen. Dette er det mest udbredte enkeltmønster i gennemgangen.

- [ ] **P1 — Ubeskyttede `Setup.Get()` før feltadgang** *(gennemgående)*. Repræsentative steder:
  `SalesHeader.TableExt.al:132` (`ManualWhseSetup.Get()`), `SalesLineSubscribers.Codeunit.al:98,123`
  (`JungheinrichSetup.Get()`), `PurchaseHeaderSubscribers.Codeunit.al:88` (`OrderAddr.Get()`),
  `ItemJnlPostEventFunctions.Codeunit.al:116` (`ManufacturingSetup.Get()`),
  `ItemJournalLineEvents.Codeunit.al:156` (`WarehouseSetup.Get()`). Mønster: `if not X.Get() then` → klar
  `Error`/`ErrorInfo` med navigation til opsætningssiden, eller `TestField`-stil validering tidligt.
- [ ] **P1 — Ubeskyttede `Item.Get()` før beregning** *(gennemgående)*. Fx
  `PurchaseLineEvents.Codeunit.al:21`, `SalesPostHelper.Codeunit.al:185`,
  `NiceLabelPostProduction.Codeunit.al:142` (Item-felter `"Kg. Per Bag"`/`"Bag Per Pallet"` bruges uden at
  `Item` er hentet). Pallet-/mængdeberegninger på tomme Item-felter giver 0 eller forkerte tal uden fejl.
- [ ] **P2 — `FindFirst()` uden returtjek, derefter feltadgang** *(gennemgående)*. Fx
  `OperationListProduction.Page.al:1378`, `OperationListPlanClosed.Page.al:340`,
  `ProdOrderLineEvents.Codeunit.al:76`. Tilføj `if … FindFirst() then` omkring feltadgangen.
- [ ] **P2 — `if X.Get(...) then;` med tomt body skjuler fejl** *(gennemgående)*. Fx
  `ItemReferenceMgtHelper.Codeunit.al:20`, `SingleInstanceLotNoInfo.Codeunit.al:50`,
  `OperationListProduction.Page.al:1235,1255,1285` (stale `ItemLocal` genbruges mellem løkke-iterationer →
  forkert pallet-optælling). Beslut eksplicit not-found-adfærd (clear/exit/default) i stedet for tomt `then;`.
- [ ] **P3 — Kompleks short-circuit `and` med side­effekter** *(verificeret)*.
  `BarcodeManagement.Codeunit.al:156,222,580` samler `Item.Get(...) and (… or (LocalLotNoInfo.Get(...) …))` i
  én betingelse. Det er svært at læse og afhænger af evalueringsrækkefølge — opdel i separate `if`-trin.

> **Anbefaling:** Slå AL-reglen for ubeskyttet `Get` til i `custom.ruleset.json` (rule **AA0175**) og gennemfør
> en samlet oprydning. En lille hjælpe-codeunit med `GetSalesSetup()`/`GetManufacturingSetup()` der laver
> `Get()` + `ErrorInfo` ét sted, fjerner gentagelsen.

---

## 3. Hardcodede journal-templates, batches og posting-grupper *(TODO i kode)*

En række kritiske flows vælger journal-template/batch eller posting-grupper via hardcodede strenge. Flere er
allerede markeret med `// TODO PKR: Hardcoded values`. Hvis en opsætning omdøbes, fejler flowet stille eller med
en uklar fejl. Disse værdier bør flyttes til en setup-tabel (fx en udvidelse af `Manufacturing Setup` /
`Inventory Setup` / en ny `Customer Setup`).

- [ ] **P1 — Sample-postering bruger hardcodede kladdenavne** *(TODO i kode)*.
  `SampleScanning.Page.al:144-145,184-185`: `'OMPOSTER'`/`'SAMPLE'` og `'VARE'`/`'SAMPLE'`. Ingen validering af
  at batchen findes. Flyt til setup og `TestField` før brug.
- [ ] **P1 — WMS-overflytning bruger hardcodet item-journal-template** *(TODO i kode)*.
  `ProcessWMSImport.Codeunit.al:552-553`: `ItemTemplate := 'OVERFLYTNI';` med kommentar
  `// TODO - Find Template and Document No.` og udkommenteret `SelectItemTemplateForTransfer()`. Implementér
  template-/bilagsnr.-valg og validér eksistens.
- [ ] **P1 — `Handle Lot. No`-regulering bruger hardcodet `'VARE'`/`'STANDARD'`** *(TODO i kode)*.
  `HandleLotNo.Report.al:82,189-190` (`// TODO PKR: Hard-coded values`, linje 188). Samme behov som ovenfor.
- [ ] **P2 — `Purchase Line."No."` TableRelation udelukker hardcodet posting-gruppe `'SALGVARE'`**
  *(TODO i kode)*. `PurchaseLine.TableExt.al:14-22` (`// TODO PKR: Hardcoded values`). Forretningslogik i en
  `filter(<> 'SALGVARE')` er svær at vedligeholde — flyt udelukkede grupper til en setup-tabel.
- [ ] **P2 — Øvrige hardcodede TODO-steder** *(TODO i kode)*: `CreateNewLotNos.Codeunit.al:40,109,188`,
  `UpdateInvPostingGroups.Report.al:23`, `NiceLabelItemFile(BC).Report.al:23`. Saml dem i samme setup-oprydning.

---

## 4. Integrationsrobusthed — WMS, EDI, Evocon, NiceLabel, Azure Blob

De eksterne integrationer er kernen i løsningen, men flere af dem mangler ensartet fejlhåndtering, logning og
oprydning. Et enkelt uventet svar eller en låst fil kan i dag efterlade systemet i en inkonsistent tilstand
eller stoppe en Job Queue.

- [ ] **P1 — `foreach` med `exit` springer Azure-filsletning over** *(verificeret)*.
  `ManualWhseImportFunction.Codeunit.al:44-50`: flere `exit` inde i fil-løkken hopper ud af **hele** `foreach`
  og springer `Commit()` + filsletning (linje 68-70) over. En enkelt ikke-CSV- eller ukendt-type-fil efterlader
  alle resterende filer uimporteret og uslettet i Azure. Brug `continue` pr. fil; reservér `exit` til kritisk stop.
- [ ] **P1 — `CODEUNIT.Run(... Item Jnl.-Post Batch ...)` uden fejltjek** *(verificeret)*.
  `ProcessWMSImport.Codeunit.al:587`: posteringen kører uden at returværdien tjekkes, og batch-sletning sker
  uanset (linje 591). Fejlet postering → data slettes alligevel. Tjek resultatet før oprydning.
- [ ] **P1 — Uhåndteret HTTP-status i Evocon-kald** *(verificeret)*.
  `EvoconProdOrderService.Codeunit.al:36-38`: `Client.Post()` lagrer status/indhold men skelner ikke 2xx fra
  4xx/5xx. En HTTP 500 behandles som "complete". Parse `Response.HttpStatusCode()` og rejs fejl ved ikke-2xx.
- [ ] **P1 — Manglende fejl når hverken Sales- eller Transfer-dokument findes** *(verificeret)*.
  `ProcessWMSImport.Codeunit.al:164-169` og `:505-517`: ved picking/status-import forsøges først `SalesHeader.Get`,
  derefter `TransferHeader.Get`; hvis begge fejler, fortsætter koden uden fejl, og WMS-status opdateres aldrig.
  Tilføj eksplicit `Error`/log når intet dokument matcher.
- [ ] **P2 — EDI-parsing i AgriNorCold er skrøbelig og uden grænsetjek** *(verificeret)*.
  `ImportEDIAgriNorCold.Report.al:399-409` (`SplitString`) skriver i `array[10]` uden at tjekke at antallet af
  felter ≤ 10; overløb ignoreres stille. Indsamlede fejl (`ErrorList`/`SendError`,
  `ImportEDIAgriNorCold.Report.al:177-215`) vises eller logges aldrig — `SendError` sættes men bruges ikke.
  Tilføj grænsetjek + log importfejl til en tabel/notifikation.
- [ ] **P2 — Azure-upload-fejl efterlader status uændret** *(verificeret)*.
  `JungheinrichExportFunctions.Codeunit.al:75-79`: ved upload-fejl kaldes `error(GetLastErrorText())` uden at
  sætte dokumentets `WMS Status` til en fejltilstand → genforsøg kan ikke skelnes. Sæt status til "Failed"/lignende
  før fejlen rejses, og overvej retry/backoff.
- [ ] **P2 — Lot-opslag på SSCC antager første match** *(verificeret)*.
  `ProcessWMSImport.Codeunit.al:488`: ved blank Lot No. vælges `LotNoInformation.FindFirst()` på Item+SSCC.
  Matcher flere lots samme SSCC, vælges den første blindt. Sikr unik SSCC→Lot-mapping og log tvetydige tilfælde.
- [ ] **P2 — Silo-/sample-postering sluger fejl pr. linje** *(verificeret)*.
  `SiloConsumptionMgt.Codeunit.al:240-243` og `NiceLabelImportPallet.Codeunit.al:169`
  (`if not …Insert(true) then;`): fejl pr. linje vises kun som `Message` (eller slet ikke) og logges ikke
  vedvarende. Log til en fejltabel med kontekst (item, lot, ordre) så delvise fejl kan fejlsøges.

---

## 5. Baggrunds-/Job Queue-sikkerhed *(gennemgående)*

Flere integrations- og posteringsstier kan køre fra Job Queue, webhook eller anden ikke-GUI-kontekst, men
indeholder `Message()`/`Confirm()`/`Sleep()`. `Message`/`Confirm` uden `GuiAllowed()`-guard fejler eller hænger
i baggrunden.

- [ ] **P2 — `Message`/`Confirm` uden `GuiAllowed()` i potentielt baggrundskørende kode** *(gennemgående)*. Fx
  `ReleaseSalesDocSubscribers.Codeunit.al:29`, `EvoconProdOrderService` (`StoreResult`), dele af
  `ManualWhseImportFunction`. Wrap i `if GuiAllowed() then …` eller erstat med `ErrorInfo`/logning.
  *(Bemærk: flere steder, fx `SiloConsumptionMgt.Codeunit.al:242`, gør det allerede korrekt — brug dem som mønster.)*
- [ ] **P2 — `Sleep(1000)` i forretningslogik** *(verificeret)*.
  `ShippingAgentReportMgt.Codeunit.al:83,179`: hardcodet pause mellem e-mail-afsendelser blokerer brugeren og
  fejler i batch. Fjern `Sleep` og stol på asynkron afsendelse, eller brug en kø-/event-mekanisme.

---

## 6. Nummerserier & samtidighed

Flere steder allokeres nye nøgler/numre via `FindLast() + 1` i stedet for `No. Series`. Det er ikke
samtidighedssikkert (to brugere kan få samme nummer) og omgår standard-nummerserie-logikken.

- [ ] **P2 — SSCC-reservationspost allokerer `Entry No.` via `FindLast()+1`** *(verificeret)*.
  `SSCCPickRegistration.Page.al:130-133`: trods `LockTable()` er der race mellem `FindLast()` og `Insert()`.
  Brug en `No. Series` eller sikr korrekt isolation.
- [ ] **P2 — Modtagelseskontrol-nr. via `FindLast()+1` uden dubletkontrol** *(verificeret)*.
  `ReceivingManagement.Codeunit.al:17-31` (`CreateModtagelsesKontrol`): inkrementerer uden at tjekke om der
  allerede findes en modtagelse for indkøbsordren → muligt dublet. Brug nummerserie + eksistenstjek.
- [ ] **P3 — `CreateLots` kaldes uafhængigt af om varen er lot-styret** *(verificeret)*.
  `ReceivingManagement.Codeunit.al:35-45`: tjek `Item` lot-tracking-opsætning før der oprettes lot-poster, så
  ikke-lot-varer ikke får spurious lots.

---

## 7. Performance

Mindre, men nemme gevinster. Ingen er kritiske, men de optimerer hyppigt kørende stier.

- [ ] **P3 — Manglende/forkert `SetLoadFields`** *(gennemgående)*. Fx
  `SalesLineSubscribers.Codeunit.al:166` (inkonsistent brug). Bemærk: påstande om at
  `OutputJnlExplRouteEvents.Codeunit.al:78` *ikke kompilerer* er **falske** — `SetLoadFields("Kg. Per Bag", Item."Bag Per Pallet")`
  er gyldigt; det er blot en stilistisk inkonsistens (bland ikke streng-feltnavn og kvalificeret feltreference).
- [ ] **P3 — `CalcFields` i løkke / redundant `CalcFields`** *(gennemgående)*. Fx
  `ReplanProdOrder.Report.al:27,34`, `BarcodeManagement.Codeunit.al:540-543,554-557`,
  `StartStopSnail.Table.al:39` (redundant `CalcFields` på FlowFields i `OnValidate`). Beregn uden for løkken
  eller fjern hvor unødvendigt; brug `SetLoadFields` hvor felter alligevel læses enkeltvis.

---

## 8. Lokalisering & UX

- [ ] **P2 — Hardcodede danske brugervendte strenge** *(gennemgående)*. Fx i `Truck`-siderne
  (`TrucktoTransferOrder.Page.al`, `TrucktoSalesOrder.Page.al`) ligger labels som
  `'Vil du flytte hentet antal (%1) ?'` direkte i koden. Sørg for at alle brugervendte tekster er `Label`s og
  dækket i `Translations/Customer.da-DK.xlf` (kør `/claude4bc:update-translations`).
- [ ] **P2 — Fejl uden kontekst eller navigation** *(gennemgående)*. Mange `Error(...)` mangler hvilken record
  der fejlede (fx `OperationListProduction.Page.al:529,552`, operations-rapport-tabellernes
  `Error5000xLbl`-serie). Brug `ErrorInfo` med record-No. og evt. `AddNavigationAction` (mønster som i
  demoens `TogglUser.GetFromUserID`).
- [ ] **P3 — Manglende `ToolTip` på custom-felter** *(gennemgående)*. Mange felter på
  `SalesHeader.TableExt.al` / `SalesLine.TableExt.al` (50000-serien) og
  `RawMaterialPackNEST.Table.al` mangler `ToolTip`/`Caption`. Tilføj for konsistent brugerhjælp.
- [ ] **P3 — Stavefejl i tekster** *(verificeret)*: `UserSetup.TableExt.al:18,25,32,39,44` (`'Specfies …'` →
  `'Specifies …'`), `PurchaseLine.TableExt.al:91` (`'… must be orderes …'` → `'… ordered …'`),
  `SalesLine.TableExt.al:49` (`'%2is'` → `'%2 is'`). Ret labels og opdatér XLIFF.

---

## 9. Teknisk gæld — dødt/obsolet kode, manglende namespaces

- [ ] **P2 — Obsolet kode markeret til sletning er stadig aktivt** *(TODO i kode)*. Fx
  `AdjustOutputMgt.Codeunit.al:3` + `AdjustOutputWizard.Page.al:8` ("obsolete when we receive the quantity in
  the file from Nicelabel"), `CreateOutputPallet.XmlPort.al:10` ("Delete this xmlport"),
  `ItemVendor.TableExt.al:1` ("Delete this table extension"), `Item.TableExt.al:87` ("Delete this field").
  Beslut: fjern (med `[Obsolete]`/upgrade-step efter behov) eller fjern TODO'en med begrundelse.
- [ ] **P2 — Manglende `namespace`-deklaration** *(verificeret)*.
  `UndoSalesShptLineEvents.Codeunit.al:1` mangler namespace i øvrigt konsekvent navngivet kodebase. Tilføj for
  konsistens og at undgå navnekonflikter.
- [ ] **P3 — Udbredt `// TODO: - Refactor` + `#pragma warning disable`** *(TODO i kode)*. Næsten alle
  layout-rapporter (`SalesInvoiceCustomer`, `SalesCreditMemoCustomer`, `ReminderCustomer`,
  `BSOrderConfirmation`, `PurchaseOrder`, `FinanceChargeMemo`, `StatementCustomer`, `SalesQuoteCustomer`)
  undertrykker `AL0667`/`AA0206` med en refaktor-TODO. Lav ét fælles oprydningsspor for rapport-RDLC/labels.
- [ ] **P3 — "Ping Pong DLL"-TODO'er i ledger-/liste-sider** *(TODO i kode)*. Fx
  `ConsumptionProdOrder.Page.al:26`, `ProducedItemLots2PASTA/NEST/BC16.Page.al`,
  `ConsumedItemsFilter1/2/3.Page.al`, `NESTList.Page.al:20`, `BC16List.Page.al:15`, `BC8List.Page.al:12`,
  `BSBooking.Report.al:572`. Disse refererer en legacy DotNet/"Ping Pong"-løsning der ikke kan køre i Cloud —
  afklar om de er døde eller skal erstattes med Cloud-kode.
- [ ] **P3 — Udkommenteret kode og uafklarede TODO-spørgsmål** *(TODO i kode)*. Fx
  `TrucktoTransferOrder.Page.al:139` (`//TODO: hvad skal der ske her?`),
  `SalesOrderSubform.PageExt.al:214` (`// TODO PKR: Ved ikke hvad 9A mener her:`),
  `PostedTransferCMR.Report.al:92-458` (udkommenterede kolonner/sprogvalg),
  `ReceiveLines.Table.al:994,1034` (udkommenteret TableRelation/cross-ref). Afklar eller fjern.

---

## 10. Datamodel & dokumentation

- [ ] **P3 — Manglende `DataClassification` på felter** *(verificeret)*. `RawMaterialPackNEST.Table.al`
  (felter 8-88) mangler `DataClassification` på flere felter selvom tabel-headeren sætter den. Tilføj eksplicit
  pr. felt for GDPR/compliance-klarhed.
- [ ] **P3 — Inkonsistent felt-/parameternavngivning** *(verificeret)*. Snail-tabellerne bruger snart
  `Start`, snart `StartTime` for felt 80, og parametre hedder skiftevis `pLineNo`/`LineNumber`/`inLineNo`.
  Standardisér navngivningen på tværs af Operation-modulet.

---

## Foreslået rækkefølge (quick wins først)

1. **Operation PASTA-fejl (§1)** — højeste korrekthedsrisiko, isolerede rettelser. Verificér hele PASTA-mappen.
2. **Integrationsrobusthed (§4)** — `exit`→`continue` i Azure-import, fejltjek på posterings-`Run`, Evocon HTTP-status,
   EDI-grænsetjek. Forhindrer datatab og hængende jobs.
3. **Defensiv `Get()`/`FindFirst()` (§2)** — slå AA0175 til, ryd op via fælles setup-getters.
4. **Hardcodede templates/grupper (§3)** — flyt til setup-tabel; rydder samtidig en stor del af `// TODO PKR`-gælden.
5. **Baggrundssikkerhed & nummerserier (§5, §6)** — gør integrationsstier Job Queue-sikre.
6. **Lokalisering, UX, teknisk gæld (§7–§10)** — løbende oprydning; kør `/claude4bc:update-translations` til sidst.

> **Metodenote:** Fundene stammer fra en modulopdelt gennemgang af alle 563 `.al`-filer. Punkter markeret
> *(verificeret)* er læst direkte i koden. Punkter markeret *(gennemgående)* er mønstre med flere forekomster,
> hvor de nævnte linjer er repræsentative — bekræft hvert enkelt sted før rettelse. Bemærk at flere automatisk
> rapporterede "kompilerer ikke"-påstande (fx manglende semikolon på sidste statement før `end`, eller
> `SetLoadFields`-syntaks) blev **afvist ved verifikation** og er udeladt; appen kompilerer.

*Anbefalinger udarbejdet juni 2026 — fuld gennemgang af Customer Base App v27.0.0.10.*
