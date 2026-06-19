---
description: Skriv teknisk dansk dokumentation (.md) ud fra en AL-kildemappe (+ valgfri spec-fil) — handlinger, filformater/record-layouts, flow-diagrammer og objekt-tabeller, klar til /website-build
argument-hint: "AL-kildemappe at dokumentere (+ evt. sti til spec-fil, fx PDF)"
---

# AL → teknisk dansk dokumentation

Læs en AL-kildemappe (og evt. en leverandør-/interface-specifikation) og skriv **teknisk
dokumentation** i markdown, der forklarer **hvordan integrationen/modulet faktisk virker**:
handlinger, filformater, record-layouts, statusforløb, objekter og opsætning. Dette er det
**tekniske modstykke** til `/c4bc:al-userdocs` (som skriver kodefri slutbruger-docs) — her er kode,
ID'er og layouts netop pointen.

Output er `.md`-filer, der bagefter kan bygges til en **teknisk HTML-side** (se afsnittet *Teknisk
HTML* nedenfor) eller en PDF.

`$ARGUMENTS` indeholder:
- **Første sti** = AL-kildemappen, der skal dokumenteres (fx `src/Warehouse/Jungheinrich`). Mangler
  den, så spørg hvilken mappe/modul.
- **Valgfri yderligere sti** = en **specifikation** at krydsreferere (PDF, markdown eller tekst —
  fx en leverandørs interface-spec). Bruges som "sandhed nr. 2" ved siden af koden.

## Fremgangsmåde

1. **Læs hele kildemappen rekursivt** — alle `.al`-filer: tabeller/tableextensions,
   pages/pageextensions, codeunits, reports, enums, xmlports, samt undermapper. Forstå *mekanikken*:
   - **Handlinger** — hvilke operationer findes der (eksport/import, opret/ret/slet, bogfør,
     spær …), hvad udløser dem, og hvilken procedure/codeunit står for hver.
   - **Filformater / dataformater** — hvis modulet udveksler filer/beskeder: filtyper, navngivning,
     felt-positioner/-bredder, separatorer, record-typer.
   - **Statusforløb** — enums/flag der viser, hvor en post er i flowet.
   - **Integrationspunkter, opsætning og objekt-ID'er.**

2. **Hvis en spec-fil er angivet, så læs den også.**
   - Er det en **PDF**, så udtræk teksten først. Forsøg i rækkefølge: Read-værktøjets PDF-støtte;
     ellers `python` med `pypdf` (skriv til en UTF-8-tekstfil for at undgå kodning-fejl); ellers
     `pdftotext`. Hvis intet virker, så sig det og fortsæt ud fra koden alene.
   - **Krydsreferér kode mod spec.** Hvor de er enige, bekræft layoutet (giver tillid til
     byte-positioner). Hvor de **afviger** (typisk filnavne, der i koden er opsætnings-styrede
     præfikser), så skriv kodens adfærd som "sådan gør vi" og specens som "standardnavnet", og gør
     forskellen eksplicit.

3. **Skriv på dansk, til en teknisk læser** (udvikler/konsulent). Modsat `/c4bc:al-userdocs`
   **bevares** her:
   - **Kode-nære detaljer:** codeunit-/tabel-/enum-numre, procedurenavne, feltnavne, record-layouts
     med felt-positioner og -typer, og en samlet **objekt-tabel** (Objekt / Type / Nr. / Rolle).
   - **Diagrammer** — vis flow med [Mermaid](https://mermaid.js.org/) (`flowchart`, `sequenceDiagram`),
     som renderes i GitHub og de fleste markdown-viewere. Mindst ét **arkitektur-/oversigtsdiagram**
     og — hvor det giver mening — **sekvensdiagrammer** for de vigtigste forløb.
   - **Pædagogik bevares stadig:** start med "det store billede", forklar grundbegreber før detaljer,
     og brug noter (`>`) til faldgruber og vigtige pointer. Teknisk ≠ tør.
   - Brug `` `kode` `` til navne/ID'er og tabeller til layouts og felt-oversigter.

4. **Gem output** et fornuftigt sted:
   - Hører dokumentationen til en eksisterende **materiale-/manualmappe** (fx hvor spec-filen
     ligger), så læg `.md`'en **dér** ved siden af kilden.
   - Ellers i `Ressourcer/<Modul>/`, hvor `<Modul>` afspejler kildemappen. Opret mappen hvis nødvendigt.
   - Brug et sigende dansk filnavn (fx `<Modul> - Handlinger og filtyper.md`). Dækker mappen flere
     klart adskilte emner, så overvej én fil pr. emne (ligesom `/c4bc:al-userdocs`).

5. **Ryd op** efter midlertidige hjælpefiler (fx udtrukket PDF-tekst), når dokumentet er skrevet.

## Teknisk HTML (valgfrit næste skridt)

`/c4bc:website-build` er bygget til **slutbruger**-sider og **fjerner kode, objekt-tabeller og
tekniske ID'er** — så den må **ikke** bruges direkte på teknisk dokumentation. Vil du have en
teknisk side ind i portalen, så byg den med denne opskrift (det er bevidst manuelt, så det tekniske
indhold bevares):

1. Skriv **body-HTML'en** ud fra `.md`'en: `<header>` (badge/pills), `<nav class="toc">`,
   `.section`-kort, tabeller, noter/info-bokse og `<footer>` — efter komponent-klasserne i
   `.website/styles.css`.
2. **Konvertér Mermaid-diagrammer til portalens egne `.fc-node`-flowcharts** (`<div class="flowchart">`
   med `.fc-node` / `.fc-node.start` / `.fc-node.decision` / `.fc-node.action` og `.fc-arrow`),
   da portalen ikke renderer Mermaid.
3. **Inline ordret** hele `.website/styles.css` i et `<style>` i `<head>`, og hele
   `html-guide/script.js` i et `<script>` før `</body>` (genskriv dem aldrig fra hukommelsen).
   Sæt `<body class="fx">`. Et lille script der læser de tre dele (CSS, JS, body) og samler filen
   er den sikreste måde.
4. **Placér** siden i en gruppemappe i sprogmappen, fx `.website/da-DK/<Gruppe>/<titel>.html`, og
   sæt favicon-stien efter dybden (to niveauer → `../../favicon.svg`).
5. Kør **`/c4bc:website-update-index`**, så siden kommer i portalens menu.

Findes der allerede en teknisk side om samme emne, så **opdatér** den i stedet (krydshenvis frem for
at duplikere), og tilføj evt. de officielle navne/begreber fra specen.

## Output

Når dokumentationen er skrevet, så list de oprettede/opdaterede filer og deres indhold, nævn om en
spec blev krydsrefereret (og evt. afvigelser fundet), og foreslå næste skridt (teknisk HTML +
`/c4bc:website-update-index`, eller `/c4bc:pdf-build`). Udskriv til sidst:
`<promise>COMPLETE</promise>`
