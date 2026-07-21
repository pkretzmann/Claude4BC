# Claude4BC

Delt samling af Claude Code commands, HTML-guide og MCP-konfiguration til Business Central AL-projekter. Vedligeholdes ét sted og bruges på tværs af alle projekter via Git Submodule. Loades som et **in-place Claude Code-plugin** (`claude4bc@skills-dir`), så kommandoerne er tilgængelige med namespace `/claude4bc:*`.

## Indhold

```
Claude4BC/
  .claude-plugin/
    plugin.json            ← Plugin-manifest (gør bundtet til et in-place plugin)
  commands/
    website-create-css.md  ← Generér brandfarver fra en hjemmeside
    website-theme.md       ← Vælg/skift visuelt tema (layout/skin) for sitet
    website-build.md       ← Konverter markdown til HTML-brugervejledning
    website-init.md        ← Initialisér dokumentationssitet (.website)
    website-update-index.md ← Synkronisér portalens NAV med .website/-sider
    website-github-init-deploy.md ← Publicér .website til GitHub Pages via GitHub Actions
    pdf-build.md           ← Saml .website-sitet til én PDF-brugervejledning pr. sprog
    al-update-translations.md ← Opdatér XLIFF-oversættelsesfiler
    al-sort-usings.md      ← Sortér using-direktiver alfabetisk i alle .al-filer
    al-userdocs.md         ← AL-kildemappe → dansk slutbruger-dokumentation (.md, uden kode)
    al-techdocs.md         ← AL-kildemappe (+ evt. spec) → teknisk dansk dokumentation (.md, med kode/layouts)
    al-analyse.md          ← AL-app-mappe (analyse-repo) → dansk kodekvalitets-analyse (Analyse-<AppNavn>.md)
    al-analyse-claude-init.md ← Analyse-repo (downloadet AL-kilde) → CLAUDE.md på engelsk til Claude Code
  html-guide/
  pdf-build/
    build-pdf.mjs          ← Generator: .website-HTML → samlet PDF (Playwright + pdf-lib)
    package.json           ← Afhængigheder til build-pdf (installeres lokalt, git-ignoreret)
    styles-default.css     ← Fuldt kanonisk fallback-stylesheet (neutralt brand)
    script.js              ← Standard JavaScript til HTML-guides (inkl. scroll-reveal-bevægelse)
    serve.py               ← Lokal no-cache dokumentationsserver (kopieres til .website/)
    portal.html            ← Kanonisk skabelon til dokumentationsportalen (index.html)
    build_pages.py         ← Hjælpescript til multi-side-tilstand (wrapper bodies → selvstændige sider)
    themes/                ← Tema-katalog: layouts/skins (classic, minimal, editorial, bold, landing)
  docs/
    bc-dev-setup-guide.html ← Komplet guide til opsætning af BC-udviklingsmiljø
    Sådan anvendes Claude4BC.html ← Fuld brugerguide til alle kommandoer (website, AL-objekter, AL-analyse) + temaer
  .mcp.json                ← MCP-konfiguration (BC MCP Server m.fl.)
  CLAUDE.md                ← Fælles Claude Code kontekst
  update-claude4bc.ps1     ← Opdatér submodulet til seneste version (PowerShell)
```

## Kom godt i gang

> 🚀 **Start her — komplet miljøopsætning:** [BC Dev Setup Guide](docs/bc-dev-setup-guide.html) er en omfattende guide til at sætte hele BC-udviklingsmiljøet op (MCP-servere, AL-LSP, BC MCP OAuth, hooks, Claude Code i AL-Go-pipelines og token-optimering) — med interaktivt vars-panel og setup-checkliste. `docs/Sådan anvendes Claude4BC.html` er derimod den fulde brugerguide til alle bundtets kommandoer — website/dokumentation, AL-objekter og AL-analyse — herunder hvordan du vælger tema/layout.

Værktøjet er et delt git-submodul, der virker som et **Claude Code-plugin** — du skal derfor **ikke kopiere filer manuelt**. Følg de to trin herunder, så er du i gang; resten af opsætningen (initialisér site, brandfarver, byg guides) er beskrevet i den fulde vejledning.

1. **Tilføj submodulet** under `.claude/skills/` i dit projekt:

   ```bash
   git submodule add https://github.com/pkretzmann/Claude4BC.git .claude/skills/claude4bc
   ```

2. **Genstart Claude Code.** Mappen indeholder en `plugin.json`, så den loades automatisk som pluginnet `claude4bc`, og kommandoerne `/claude4bc:…` dukker op i listen over slash-kommandoer.

> 📖 **Fuld vejledning:** Se [Sådan anvendes Claude4BC](docs/Sådan%20anvendes%20Claude4BC.html) — afsnit **»3 · Kom i gang i et nyt projekt«** gennemgår de resterende trin (`/website-init`, `/website-create-css`, `/website-build`, `/website-update-index`) samt forskellen på submodul og plugin.

---

## Commands

### `/website-create-css <website-url> [type]`
Henter brandfarver fra en virksomheds hjemmeside og skriver dem ind i `:root`-blokken i projektets `.website/styles.css`. Findes filen ikke, seedes den først fra den fulde default `styles-default.css`. Bruges til at brande HTML-guides til et nyt projekt med én kommando.

**Eksempler:**
```
/website-create-css https://www.eksempel.dk
/website-create-css https://www.fabrik.dk Production
/website-create-css https://www.vingaarden.dk "Wine Retail"
```

Valgfri `type`-presets: `Production`, `Consulting`, `Wine Retail` — påvirker palettens karakter og bruges som fallback hvis hjemmesidens farver er svage.

---

### `/website-build <fil.md | mappe>`
Konverterer en eller flere markdown-brugervejledninger til en professionel, selvstændig HTML-fil med projektets farvepalette og designsystem.

**Eksempler:**
```
/website-build vejledning.md
/website-build "Step 0 — Oversigt.md" "Step 1.md" "Step 2.md"
/website-build Dokumentation/
```

Bruger projektets `.website/styles.css` hvis den findes — ellers falder den tilbage på `.claude/skills/claude4bc/html-guide/styles-default.css`. CSS og JavaScript indsættes ordret i den genererede HTML, så filen er selvstændig og virker offline.

---

### `/al-update-translations [argument]`
Opdaterer projektets XLIFF-oversættelsesfiler (`.xlf`) så alle trans-units er korrekt oversat i alle målsprog. Finder selv base- og oversættelsesfiler ud fra `source-language`/`target-language`-attributter.

**Eksempler:**
```
/al-update-translations
/al-update-translations da-DK
/al-update-translations Translations/MyApp.da-DK.xlf
```

Behandler alle `.xlf`-filer i projektet og sætter oversatte units til `state="translated"`. Afslutter med `COMPLETE` når alle filer og sprog er fuldt oversat.

---

### `/al-userdocs <AL-kildemappe>`
Læser en AL-kildemappe og skriver **dansk slutbruger-dokumentation** (`.md`) — *hvad* funktionaliteten gør og *hvordan* den bruges, **uden** kode, objekt-ID'er eller feltnumre. Emneopdelt (én fil pr. emne), klar til `/website-build` + `/website-update-index`.

**Eksempler:**
```
/al-userdocs src/Inventory/Item
/al-userdocs src/Manufacturing/NiceLabel
```

Gemmer som regel i `Ressourcer/<Modul>/`. Beskriver automatikker som *adfærd* ("når X sker, gør systemet Y") frem for teknik.

---

### `/al-techdocs <AL-kildemappe> [spec-fil]`
Det **tekniske modstykke** til `/al-userdocs`: læser en AL-kildemappe (og evt. en leverandør-/interface-spec, fx en PDF) og skriver **teknisk dansk dokumentation** (`.md`) — handlinger, filformater/record-layouts med felt-positioner, statusforløb, flow-/sekvensdiagrammer (Mermaid) og en objekt-tabel. Her er kode, ID'er og layouts netop pointen.

**Eksempler:**
```
/al-techdocs src/Warehouse/Jungheinrich
/al-techdocs src/Warehouse/Jungheinrich "Ressourcer/.../Interface_Host_WMS.pdf"
```

Krydsreferér kode mod specen (bekræfter layouts; gør afvigelser eksplicitte). En teknisk side bygges **ikke** med `/website-build` (den stripper kode) — følg i stedet kommandoens *Teknisk HTML*-opskrift (inline `styles.css`/`script.js` ordret, Mermaid → `.fc-node`) og kør derefter `/website-update-index`.

---

### `/al-analyse-claude-init [projektrod] ['per-app' [app-mapper…]]`
Dan eller opdatér en **CLAUDE.md på engelsk** for et **analyse-repo** — en samling downloadet/dekompileret AL-kilde fra publicerede BC-apps (flade filer, underscore-navne, tom `.alpackages`). Udleder indholdet af `app.json`-filerne og koden: repo-type, app-oversigtstabel i afhængighedsorden, 3–6 hovedområder pr. app, eksterne afhængigheder, analyse-begrænsninger og konventioner — og afslutter med en `@`-import af submodulets fælles CLAUDE.md (husregler), så de loades på projektniveau. Med nøgleordet **`per-app`** dannes desuden lokale CLAUDE.md-filer i de store app-mapper.

**Eksempler:**
```
/al-analyse-claude-init
/al-analyse-claude-init C:\AL\Soya
/al-analyse-claude-init C:\AL\Soya per-app
```

Idempotent — findes der en CLAUDE.md i forvejen, bevares håndskrevet prosa og kun udledelige fakta synkroniseres. Almindelige udviklingsprojekter er **ikke** kommandoens opgave (den advarer og stopper); de får senere deres egen variant.

---

### `/al-analyse [app-mappe] [sprog]`
Dan eller opdatér en **kodekvalitets-analyse** (`Analyse-<AppNavn>.md` i projektroden) af én downloadet/dekompileret AL-app i et analyse-repo: hvad appen løser, filstruktur pr. funktionsområde, arkitektur-/dataflow-diagram, fund pr. fil på fast alvorlighedsskala (🔴/🟠/🟡) med linjereferencer og fix-forslag, samlet vurdering og prioriteret handlingsliste. Store apps analyseres områdevis af parallelle agenter; referencer til afhængige apps, hvis kilde ligger i repoet, efterprøves mod faktisk kode. Kører autonomt; output er dansk medmindre andet sprog angives.

**Eksempler:**
```
/al-analyse "Soya Special Handling_twoday_1.0.20250625.3"
/al-analyse "Twoday Shopify Extension_twoday_1.0.20260701.1" english
/al-analyse
```

Uden argument analyseres alle app-mapper uden eksisterende `Analyse-*.md`, og eksisterende analyser opdateres idempotent (daterede rettelser, nye fund og et §6 "Efterprøvning mod nu tilgængelig kildekode").

---

### `/website-init [projektrod]`
Initialisér dokumentationssitet i et nyt projekt: opretter `.website/`-mappen med kildemateriale-mappe, README'er og start-script.

**Eksempler:**
```
/website-init
/website-init C:\sti\til\projekt
```

Opretter `.website/`, `.website/.sourcematerial.md/` samt `Readme.md`-filer, `favicon.svg`, `serve.py`, `Start dokumentation.cmd` og en lokal preview-konfiguration (`.claude/launch.json` i git-roden, til Claude Codes preview). Den lokale server er `serve.py` — en no-cache-server, så browseren ikke viser gamle (cachede) sider; rå `python -m http.server` svarer `304 Not Modified` og genbruger den cachede side. Kommandoen er idempotent — eksisterende filer overskrives aldrig (`launch.json` flettes). Selve portalen (`index.html`) dannes af `/website-update-index`.

---

### `/website-update-index [sti]`
Synkroniserer dokumentationsportalen `.website/index.html` med de HTML-sider der ligger i `.website/`. Scanner filsystemet og (gen)bygger `NAV`-listen grupperet efter undermappe — idempotent, og håndterer nye/omdøbte/slettede sider automatisk.

**Eksempler:**
```
/website-update-index
/website-update-index C:\sti\til\projekt\.website
```

Findes `index.html` ikke i forvejen, oprettes den fra den kanoniske skabelon `html-guide/portal.html`. Findes den, opdateres **kun** `NAV`-listen (mellem `NAV:START`/`NAV:END`) — resten af portalen bevares. `/website-build` rører ikke `index.html`; det er denne kommandos opgave.

---

### `/website-github-init-deploy [sti]`
Initialisér GitHub Actions-workflowen `.github/workflows/DeployDocsWebsite.yaml`, der publicerer projektets `.website`-site til **GitHub Pages**. Generisk: finder selv `.website` (i roden eller en app-undermappe, også med mellemrum i stien) og hovedgrenen, og indsætter dem i workflowen.

**Eksempler:**
```
/website-github-init-deploy
/website-github-init-deploy "EbroFrost Base App/.website"
```

Idempotent — findes workflowen, vises forskellen og du spørges før overskrivning. Husk bagefter at sætte **Settings → Pages → Source = »GitHub Actions«** i repoet. Selve `.website`-indholdet dannes af `/website-init`, `/website-build` og `/website-update-index`.

### `/pdf-build [sti] [--locale xx-XX]`
Danner **én samlet PDF pr. sprog** ud af `.website`-sitet: brandet forside + indholdsfortegnelse med sidetal + alle indholdssider i portalens kapitelrækkefølge (fra `NAV`). Projekt-agnostisk — brandfarver fra `styles.css`, titel fra portalens `<title>`, logo fra `favicon.svg`. Renderes med headless Chromium (Playwright) og flettes med pdf-lib.

**Eksempler:**
```
/pdf-build
/pdf-build --locale da-DK
/pdf-build "EbroFrost Base App/.website"
```

Output: `<.website>/<sprog>/Brugervejledning.pdf` (da-DK) / `User Guide.pdf` (en-US). Kræver Node.js; afhængigheder installeres én gang i plugin'ets `pdf-build/` (git-ignoreret). Sprog uden `NAV`-array springes over.

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

Submodulet **skal ligge under en `.claude/skills/`-mappe** (gerne i git-roden, så det dækker alle apps i et monorepo). Det indeholder en `.claude-plugin/plugin.json` og loades derfor automatisk som et **in-place plugin** (`claude4bc@skills-dir`) — uden marketplace eller install-trin. Kommandoerne bliver tilgængelige med namespace, fx `/claude4bc:website-build`, og submodulets `.mcp.json` loades som plugin-MCP (med per-server-godkendelse). Genstart Claude Code efter tilføjelsen, så det nye plugin opdages.

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

`.claude/skills/claude4bc/html-guide/styles-default.css` er det fulde, neutralt-brandede standardstylesheet til HTML-guides og **deles** via submodulet — rediger den ikke per projekt. Ønsker du et projekt-specifikt stylesheet, opret `.website/styles.css` i dit projekt (typisk via `/website-create-css`, der seeder fra default'en og sætter dine brandfarver) — `/website-build` bruger den automatisk frem for default'en.