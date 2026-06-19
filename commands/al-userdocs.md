---
description: Skriv dansk slutbruger-dokumentation (.md) ud fra en AL-kildemappe, emneopdelt og uden kode, klar til /website-build
argument-hint: "AL-kildemappe at dokumentere (fx src/Inventory/Item)"
---

# AL → dansk slutbruger-dokumentation

Læs en AL-kildemappe og skriv **dansk slutbruger-dokumentation** i markdown, der forklarer
**hvad funktionaliteten gør, og hvordan den bruges** — ikke hvordan den er kodet. Output er
`.md`-filer, der bagefter kan bygges til HTML/PDF med `/c4bc:website-build` og
`/c4bc:website-update-index` (eller `/c4bc:pdf-build`).

Argumentet (`$ARGUMENTS`) er den kildemappe, der skal dokumenteres (fx `src/Inventory/Item`).
Mangler argumentet, så spørg hvilken mappe (eller modul) der skal dokumenteres.

## Fremgangsmåde

1. **Læs hele kildemappen** (rekursivt): alle `.al`-filer — tabeller/tableextensions,
   pages/pageextensions, codeunits, reports, enums — samt undermapper. Forstå *formålet* for
   brugeren: hvilke felter, handlinger, opsætninger, rapporter og automatikker findes der, og
   hvornår bruger en bruger dem.

2. **Find emnerne.** Gruppér funktionaliteten i sammenhængende brugeremner (fx "felter på
   varekortet", "EAN-beregning", "udløbsberegning", "labels", "vare-referencer"). Dækker mappen
   tydeligt **forskellige** emner, så lav **én `.md`-fil pr. emne**. Er der reelt kun ét emne, så
   lav én fil.

3. **Skriv på dansk, til slutbrugere.** Handlingsorienteret og lettilgængeligt sprog.
   - Forklar felter/handlinger i **tabeller** (Felt/Handling → Anvendelse) eller korte afsnit.
   - Fremhæv felt- og systemnavne med **fed** (`**Felt**`) — ikke som `` `kode` ``.
   - Brug nummererede trin til "Sådan gør du"-procedurer og `>`-noter til Vigtigt/Info.
   - **Ingen kode, ingen tekniske ID'er.** Udelad AL-kode, objekt-/tabel-/codeunit-numre,
     feltnumre og "AL-objekter"-tabeller. De er irrelevante for brugeren. (Undtagelse: et
     rapport-/side-navn brugeren reelt skal søge efter må gerne nævnes.)
   - Beskriv automatikker (event-subscribers o.l.) som *adfærd* ("når X sker, gør systemet Y"),
     ikke som teknik.
   - Er en værdi styret af opsætning, så nævn **hvor** den sættes (setup-side/felt).

4. **Gem output** i `Ressourcer/<Modul>/`, hvor `<Modul>` afspejler kildemappen (fx
   `src/Inventory/Item` → `Ressourcer/Item`). Brug sigende danske filnavne pr. emne. Opret mappen
   hvis den ikke findes.

5. **Krydshenvisninger** mellem emnefilerne skrives som almindelige markdown-links, så de senere
   kan bygges til en portal.

## Bagefter (HTML/PDF)

Når `.md`-filerne er skrevet, så **foreslå** de næste skridt (kør dem kun hvis brugeren beder om
det):

- **Multi-side i portalen:** `/c4bc:website-build "<mappe>" → .website/da-DK` lægger én HTML-side
  pr. emne i en gruppemappe. **Rækkefølge-tip:** portalens menu sorterer sider efter **filnavn**
  (naturlig orden) ved hver `/c4bc:website-update-index`-kørsel, og menutitlen kommer fra sidens
  `<h1>` — ikke filnavnet. Vil du styre læserækkefølgen stabilt (fx oversigtssiden først), så giv
  HTML-filerne **nummer-præfiks** (`1. …`, `2. …`); præfikset ses ikke i menuen.
- **Saml portalens menu:** `/c4bc:website-update-index` efter et multi-side-build.
- **Samlet PDF:** `/c4bc:pdf-build` hvis der ønskes ét PDF-dokument i stedet.

## Output

Når dokumentationen er skrevet, så list de oprettede filer og deres emner, og nævn de foreslåede
næste skridt. Udskriv til sidst: `<promise>COMPLETE</promise>`
