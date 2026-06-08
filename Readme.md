# Claude4BC

Delt samling af Claude Code commands, HTML-guide og MCP-konfiguration til Business Central AL-projekter. Vedligeholdes ét sted og bruges på tværs af alle projekter via Git Submodule.

## Indhold

```
Claude4BC/
  commands/
    create-css.md          ← Generér brandfarver fra en hjemmeside
    html-guide.md          ← Konverter markdown til HTML-brugervejledning
    update-translations.md ← Opdatér XLIFF-oversættelsesfiler
  html-guide/
    styles-default.css     ← Standard stylesheet til HTML-guides
    script.js              ← Standard JavaScript til HTML-guides
    Sådan anvendes Html guide.html
  .mcp.json                ← MCP-konfiguration (BC MCP Server m.fl.)
  CLAUDE.md                ← Fælles Claude Code kontekst
  update-claude4bc.ps1     ← Opdatér submodulet til seneste version (PowerShell)
```

## Commands

### `/create-css <website-url> [type]`
Henter brandfarver fra en virksomheds hjemmeside og skriver dem ind i `:root`-blokken i `.claude/html-guide/styles.css`. Bruges til at brande HTML-guides til et nyt projekt med én kommando.

**Eksempler:**
```
/create-css https://www.eksempel.dk
/create-css https://www.fabrik.dk Production
/create-css https://www.vingaarden.dk "Wine Retail"
```

Valgfri `type`-presets: `Production`, `Consulting`, `Wine Retail` — påvirker palettens karakter og bruges som fallback hvis hjemmesidens farver er svage.

---

### `/html-guide <fil.md | mappe>`
Konverterer en eller flere markdown-brugervejledninger til en professionel, selvstændig HTML-fil med projektets farvepalette og designsystem.

**Eksempler:**
```
/html-guide vejledning.md
/html-guide "Step 0 — Oversigt.md" "Step 1.md" "Step 2.md"
/html-guide Dokumentation/
```

Bruger `.claude/html-guide/styles.css` hvis den findes — ellers falder den tilbage på `.claude/claude4bc/html-guide/styles-default.css`. CSS og JavaScript indsættes ordret i den genererede HTML, så filen er selvstændig og virker offline.

---

### `/update-translations [argument]`
Opdaterer projektets XLIFF-oversættelsesfiler (`.xlf`) så alle trans-units er korrekt oversat i alle målsprog. Finder selv base- og oversættelsesfiler ud fra `source-language`/`target-language`-attributter.

**Eksempler:**
```
/update-translations
/update-translations da-DK
/update-translations Translations/MyApp.da-DK.xlf
```

Behandler alle `.xlf`-filer i projektet og sætter oversatte units til `state="translated"`. Afslutter med `COMPLETE` når alle filer og sprog er fuldt oversat.

---

## Tilføj Claude4BC til et projekt

Kør følgende fra git-roden i dit projekt:

```bash
git submodule add https://github.com/pkretzmann/Claude4BC .claude/claude4bc
git add .
git commit -m "Add Claude4BC as submodule"
git push
```

Submodulet lander i `.claude/claude4bc/` og Claude Code finder automatisk commands og konfiguration.

---

## Opdatér Claude4BC i et eksisterende projekt

Når der er ændringer i Claude4BC, kør medfølgende script fra git-roden i dit projekt:

```powershell
.\.claude\claude4bc\update-claude4bc.ps1
```

Scriptet finder selv git-roden, viser nuværende og seneste commit, og springer over hvis du allerede er på seneste version. Ellers beder det om bekræftelse (`j/n`) og udfører derefter: opdaterer submodulet (`git submodule update --remote`), committer ændringen (`"Bump Claude4BC to latest"`) og pusher.

### Manuelt

Foretrækker du at køre trinene selv:

```bash
git submodule update --remote .claude/claude4bc
git add .claude/claude4bc
git commit -m "Bump Claude4BC to latest"
git push
```

---

## Klon et projekt med submodulet

```bash
git clone --recurse-submodules https://github.com/pkretzmann/<projekt>
```

Eller hvis projektet allerede er klonet uden submoduler:

```bash
git submodule update --init
```

---

## Lokal CSS-override

`styles-default.css` er standardstylesheetet til HTML-guides. Ønsker du et projekt-specifikt stylesheet, opret `.claude/html-guide/styles.css` i dit projekt — `/html-guide`-kommandoen bruger den automatisk frem for default.