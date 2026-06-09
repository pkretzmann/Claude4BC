# Claude4BC

Delt samling af Claude Code commands, HTML-guide og MCP-konfiguration til Business Central AL-projekter. Vedligeholdes ét sted og bruges på tværs af alle projekter via Git Submodule. Loades som et **in-place Claude Code-plugin** (`claude4bc@skills-dir`), så kommandoerne er tilgængelige med namespace `/claude4bc:*`.

## Indhold

```
Claude4BC/
  .claude-plugin/
    plugin.json            ← Plugin-manifest (gør bundtet til et in-place plugin)
  commands/
    create-css.md          ← Generér brandfarver fra en hjemmeside
    html-guide.md          ← Konverter markdown til HTML-brugervejledning
    init-website.md        ← Stilladsér dokumentationssitet (.website)
    update-website.md      ← Synkronisér portalens NAV med .website/-sider
    deploy-website.md      ← Publicér .website til GitHub Pages via GitHub Actions
    update-translations.md ← Opdatér XLIFF-oversættelsesfiler
  html-guide/
    styles-default.css     ← Fuldt kanonisk fallback-stylesheet (neutralt brand)
    script.js              ← Standard JavaScript til HTML-guides
    portal.html            ← Kanonisk skabelon til dokumentationsportalen (index.html)
    Sådan anvendes Html guide.html
  .mcp.json                ← MCP-konfiguration (BC MCP Server m.fl.)
  CLAUDE.md                ← Fælles Claude Code kontekst
  update-claude4bc.ps1     ← Opdatér submodulet til seneste version (PowerShell)
```

## Commands

### `/create-css <website-url> [type]`
Henter brandfarver fra en virksomheds hjemmeside og skriver dem ind i `:root`-blokken i projektets `.website/styles.css`. Findes filen ikke, seedes den først fra den fulde default `styles-default.css`. Bruges til at brande HTML-guides til et nyt projekt med én kommando.

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

Bruger projektets `.website/styles.css` hvis den findes — ellers falder den tilbage på `.claude/skills/claude4bc/html-guide/styles-default.css`. CSS og JavaScript indsættes ordret i den genererede HTML, så filen er selvstændig og virker offline.

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

### `/init-website [projektrod]`
Stilladsér dokumentationssitet i et nyt projekt: opretter `.website/`-mappen med kildemateriale-mappe, README'er og start-script.

**Eksempler:**
```
/init-website
/init-website C:\sti\til\projekt
```

Opretter `.website/`, `.website/.sourcematerial.md/` samt `Readme.md`-filer og `Start dokumentation.cmd`. Kommandoen er idempotent — eksisterende filer overskrives aldrig. Selve portalen (`index.html`) dannes af `/update-website`.

---

### `/update-website [sti]`
Synkroniserer dokumentationsportalen `.website/index.html` med de HTML-sider der ligger i `.website/`. Scanner filsystemet og (gen)bygger `NAV`-listen grupperet efter undermappe — idempotent, og håndterer nye/omdøbte/slettede sider automatisk.

**Eksempler:**
```
/update-website
/update-website C:\sti\til\projekt\.website
```

Findes `index.html` ikke i forvejen, oprettes den fra den kanoniske skabelon `html-guide/portal.html`. Findes den, opdateres **kun** `NAV`-listen (mellem `NAV:START`/`NAV:END`) — resten af portalen bevares. `/html-guide` rører ikke `index.html`; det er denne kommandos opgave.

---

### `/deploy-website [sti]`
Stilladsér GitHub Actions-workflowen `.github/workflows/DeployDocsWebsite.yaml`, der publicerer projektets `.website`-site til **GitHub Pages**. Generisk: finder selv `.website` (i roden eller en app-undermappe, også med mellemrum i stien) og hovedgrenen, og indsætter dem i workflowen.

**Eksempler:**
```
/deploy-website
/deploy-website "EbroFrost Base App/.website"
```

Idempotent — findes workflowen, vises forskellen og du spørges før overskrivning. Husk bagefter at sætte **Settings → Pages → Source = »GitHub Actions«** i repoet. Selve `.website`-indholdet dannes af `/init-website`, `/html-guide` og `/update-website`.

---

## Tilføj Claude4BC til et projekt

Kør følgende fra git-roden i dit projekt:

```bash
git submodule add https://github.com/pkretzmann/Claude4BC .claude/skills/claude4bc
git add .
git commit -m "Add Claude4BC as submodule"
git push
```

Submodulet **skal ligge under en `.claude/skills/`-mappe** (gerne i git-roden, så det dækker alle apps i et monorepo). Det indeholder en `.claude-plugin/plugin.json` og loades derfor automatisk som et **in-place plugin** (`claude4bc@skills-dir`) — uden marketplace eller install-trin. Kommandoerne bliver tilgængelige med namespace, fx `/claude4bc:html-guide`, og submodulets `.mcp.json` loades som plugin-MCP (med per-server-godkendelse). Genstart Claude Code efter tilføjelsen, så det nye plugin opdages.

---

## Opdatér Claude4BC i et eksisterende projekt

Når der er ændringer i Claude4BC, kør medfølgende script fra git-roden i dit projekt:

```powershell
.\.claude\skills\claude4bc\update-claude4bc.ps1
```

Scriptet finder selv git-roden, viser nuværende og seneste commit, og springer over hvis du allerede er på seneste version. Ellers beder det om bekræftelse (`j/n`) og udfører derefter: opdaterer submodulet (`git submodule update --remote`), committer ændringen (`"Bump Claude4BC to latest"`) og pusher.

### Manuelt

Foretrækker du at køre trinene selv:

```bash
git submodule update --remote .claude/skills/claude4bc
git add .claude/skills/claude4bc
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

`.claude/skills/claude4bc/html-guide/styles-default.css` er det fulde, neutralt-brandede standardstylesheet til HTML-guides og **deles** via submodulet — rediger den ikke per projekt. Ønsker du et projekt-specifikt stylesheet, opret `.website/styles.css` i dit projekt (typisk via `/create-css`, der seeder fra default'en og sætter dine brandfarver) — `/html-guide` bruger den automatisk frem for default'en.