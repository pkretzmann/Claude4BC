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
    init-website.md        ← Initialisér dokumentationssitet (.website)
    update-website.md      ← Synkronisér portalens NAV med .website/-sider
    deploy-website.md      ← Publicér .website til GitHub Pages via GitHub Actions
    update-translations.md ← Opdatér XLIFF-oversættelsesfiler
  html-guide/
    styles-default.css     ← Fuldt kanonisk fallback-stylesheet (neutralt brand)
    script.js              ← Standard JavaScript til HTML-guides
    serve.py               ← Lokal no-cache dokumentationsserver (kopieres til .website/)
    portal.html            ← Kanonisk skabelon til dokumentationsportalen (index.html)
    build_pages.py         ← Hjælpescript til multi-side-tilstand (wrapper bodies → selvstændige sider)
  docs/
    bc-dev-setup-guide.html ← Komplet guide til opsætning af BC-udviklingsmiljø
    Sådan anvendes Html guide.html ← Sådan bruges /claude4bc:html-guide-kommandoen
  .mcp.json                ← MCP-konfiguration (BC MCP Server m.fl.)
  CLAUDE.md                ← Fælles Claude Code kontekst
  update-claude4bc.ps1     ← Opdatér submodulet til seneste version (PowerShell)
```

## Kom godt i gang

> 🚀 **Start her — komplet miljøopsætning:** [BC Dev Setup Guide](docs/bc-dev-setup-guide.html) er en omfattende guide til at sætte hele BC-udviklingsmiljøet op (MCP-servere, AL-LSP, BC MCP OAuth, hooks, Claude Code i AL-Go-pipelines og token-optimering) — med interaktivt vars-panel og setup-checkliste. `docs/Sådan anvendes Html guide.html` dækker derimod kun selve `/claude4bc:html-guide`-kommandoen.

Værktøjet er et delt git-submodul, der virker som et **Claude Code-plugin** — du skal derfor **ikke kopiere filer manuelt**. Følg de to trin herunder, så er du i gang; resten af opsætningen (initialisér site, brandfarver, byg guides) er beskrevet i den fulde vejledning.

1. **Tilføj submodulet** under `.claude/skills/` i dit projekt:

   ```bash
   git submodule add https://github.com/pkretzmann/Claude4BC.git .claude/skills/claude4bc
   ```

2. **Genstart Claude Code.** Mappen indeholder en `plugin.json`, så den loades automatisk som pluginnet `claude4bc`, og kommandoerne `/claude4bc:…` dukker op i listen over slash-kommandoer.

> 📖 **Fuld vejledning:** Se [Sådan anvendes Html guide](docs/Sådan%20anvendes%20Html%20guide.html) — afsnit **»4 · Kom i gang i et nyt projekt«** gennemgår de resterende trin (`/init-website`, `/create-css`, `/html-guide`, `/update-website`) samt forskellen på submodul og plugin.

---

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
Initialisér dokumentationssitet i et nyt projekt: opretter `.website/`-mappen med kildemateriale-mappe, README'er og start-script.

**Eksempler:**
```
/init-website
/init-website C:\sti\til\projekt
```

Opretter `.website/`, `.website/.sourcematerial.md/` samt `Readme.md`-filer, `favicon.svg`, `serve.py`, `Start dokumentation.cmd` og en lokal preview-konfiguration (`.claude/launch.json` i git-roden, til Claude Codes preview). Den lokale server er `serve.py` — en no-cache-server, så browseren ikke viser gamle (cachede) sider; rå `python -m http.server` svarer `304 Not Modified` og genbruger den cachede side. Kommandoen er idempotent — eksisterende filer overskrives aldrig (`launch.json` flettes). Selve portalen (`index.html`) dannes af `/update-website`.

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
Initialisér GitHub Actions-workflowen `.github/workflows/DeployDocsWebsite.yaml`, der publicerer projektets `.website`-site til **GitHub Pages**. Generisk: finder selv `.website` (i roden eller en app-undermappe, også med mellemrum i stien) og hovedgrenen, og indsætter dem i workflowen.

**Eksempler:**
```
/deploy-website
/deploy-website "EbroFrost Base App/.website"
```

Idempotent — findes workflowen, vises forskellen og du spørges før overskrivning. Husk bagefter at sætte **Settings → Pages → Source = »GitHub Actions«** i repoet. Selve `.website`-indholdet dannes af `/init-website`, `/html-guide` og `/update-website`.

---

## MCP-servere

`.mcp.json` indeholder tre MCP-servere, der loades som plugin-MCP når Claude4BC tilføjes som submodul (med per-server-godkendelse):

- **`ado`** — Azure DevOps MCP Server til arbejde med work items, sprints, test plans og søgning.
- **`al-mcp`** — AL Dependency MCP Server (`altool`) til BC symbol-opslag i projektets `.alpackages`.
- **`bc-mcp`** — BC MCP Server (proxy) til live BC-data fra et BC-miljø.

> ⚠️ **Vigtigt:** De tre servere i `.mcp.json` er **kun eksempler** på, hvordan opsætningen kan se ud. Værdierne (organisation, stier, `TenantId`, `ClientId`, `Environment`, `Company` m.fl.) peger på ét konkret miljø og **skal rettes til for det enkelte projekt**, før de virker. Tilpas bl.a.:
>
> - `ado`: organisationsnavnet (`Kretzmann`) og `AZURE_DEVOPS_PAT` (sættes som miljøvariabel).
> - `al-mcp`: stierne til projektmappen og `--packagecachepath` (`.alpackages`).
> - `bc-mcp`: stien til `BcMCPProxy.exe` samt `TenantId`, `ClientId`, `Environment`, `Company` og `ConfigurationName`.

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