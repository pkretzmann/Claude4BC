# Claude4BC

Delt samling af Claude Code commands, **BC-skills**, HTML-guide og MCP-konfiguration til Business Central AL-projekter. Vedligeholdes ét sted og bruges på tværs af alle projekter via Git Submodule. Loades som et **in-place Claude Code-plugin** (`c4bc@skills-dir`), så kommandoerne er tilgængelige med namespace `/c4bc:*` og skills aktiveres automatisk, når opgaven matcher.

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
    website-update-portal.md ← Opdatér portalens indhold ud fra projektets commits (inkrementelt)
    website-github-init-deploy.md ← Publicér .website til GitHub Pages via GitHub Actions
    pdf-build.md           ← Saml .website-sitet til én PDF-brugervejledning pr. sprog
    al-update-translations.md ← Opdatér XLIFF-oversættelsesfiler
    al-sort-usings.md      ← Sortér using-direktiver alfabetisk i alle .al-filer
    al-userdocs.md         ← AL-kildemappe → dansk slutbruger-dokumentation (.md, uden kode)
    al-techdocs.md         ← AL-kildemappe (+ evt. spec) → teknisk dansk dokumentation (.md, med kode/layouts)
    al-analyse.md          ← AL-app-mappe (analyse-repo) → dansk kodekvalitets-analyse (Analyse-<AppNavn>.md)
    al-code-review.md      ← Ledelses-teknisk kode-review (HTML+PDF) af et AL-repo via al-mcp
    al-analyse-claude-init.md ← Analyse-repo (downloadet AL-kilde) → CLAUDE.md på engelsk til Claude Code
    al-bcquality-init.md   ← Installér Microsofts BCQuality-vidensbase som Claude Code-plugin
    al-next-id.md          ← Find første ledige AL-objekt-ID for en objekttype (inden for app.json idRanges)
    website-implement-language-selector.md ← Eftermontér sprogvælger i ældre portaler
    nav-split-objects.md   ← Split en klassisk NAV C/SIDE-teksteksport i én fil pr. objekt
    bc-verify-behavior.md  ← Efterprøv en rapporteret »BC respekterer ikke indstilling X« mod Base App-kilden
  skills/
    bc-page-design/        ← Skill: design af BC-sider (List/Card/Document, actions, tooltip-regler)
    bc-table-design/       ← Skill: design af BC-tabeller og table extensions (felter, nøgler, FlowFields)
    al-testing/            ← Skill: AL-testcodeunits (Given/When/Then, handlers, libraries)
    bc-extensibility/      ← Skill: events, posting-hooks, nummerserier, dimensioner, enums/interfaces
    bc-baseapp-source/     ← Skill: hent og diff Microsofts Base App AL-kilde på tværs af BC-versioner
      scripts/             ← bc-baseapp-source.sh — motoren (blobless clone af MSDyn365BC.Code.History)
  bcquality-custom/
    knowledge/             ← Egne (partner-/kunde-) kvalitetsregler; vinder over BCQuality-plugin'ets community/microsoft-lag
  al-analyse/
    Analyse-Skabelon.html  ← Kanonisk analyse-/rapportskabelon (bruges af al-analyse og website-build)
    styles.css             ← Stylesheet til analyse-skabelonen (editorial-tema)
  al-next-id/
    next-id.ps1            ← Hjælpescript til /al-next-id (scanner .al-filer for brugte objekt-ID'er)
  nav-split/
    split-nav-objects.ps1  ← Motor til /nav-split-objects (byte-bevarende split af C/SIDE-eksporter)
  html-guide/
    portal.html            ← Kanonisk skabelon til dokumentationsportalen (index.html)
    styles-default.css     ← Fuldt kanonisk fallback-stylesheet (neutralt brand)
    script.js              ← Standard JavaScript til HTML-guides (inkl. scroll-reveal-bevægelse)
    serve.py               ← Lokal no-cache dokumentationsserver (kopieres til .website/)
    build_pages.py         ← Hjælpescript til multi-side-tilstand (wrapper bodies → selvstændige sider)
    404.html               ← Standard 404-side til dokumentationssitet
    themes/                ← Tema-katalog: layouts/skins (classic, minimal, editorial, bold, landing, review)
  pdf-build/
    build-pdf.mjs          ← Generator: .website-HTML → samlet PDF (Playwright + pdf-lib)
    build-report-pdf.mjs   ← Generator: ét selvstændigt rapport-HTML → branded PDF (til al-code-review)
    package.json           ← Afhængigheder til build-pdf (installeres lokalt, git-ignoreret)
  docs/
    bc-dev-setup-guide.html ← Komplet guide til opsætning af BC-udviklingsmiljø
    Sådan anvendes Claude4BC.html ← Fuld brugerguide til alle kommandoer (website, AL-objekter, AL-analyse) + temaer
  .mcp.json                ← MCP-konfiguration (BC MCP Server m.fl.)
  CLAUDE.md                ← Fælles Claude Code kontekst
  update-claude4bc.ps1     ← Opdatér submodulet til seneste version (PowerShell)
  install-bcquality.ps1    ← Installér BCQuality-vidensbasen som Claude Code-plugin (PowerShell)
```

## Kom godt i gang

> 🚀 **Start her — komplet miljøopsætning:** [BC Dev Setup Guide](docs/bc-dev-setup-guide.html) er en omfattende guide til at sætte hele BC-udviklingsmiljøet op (MCP-servere, AL-LSP, BC MCP OAuth, hooks, Claude Code i AL-Go-pipelines og token-optimering) — med interaktivt vars-panel og setup-checkliste. `docs/Sådan anvendes Claude4BC.html` er derimod den fulde brugerguide til alle bundtets kommandoer — website/dokumentation, AL-objekter og AL-analyse — herunder hvordan du vælger tema/layout.

Værktøjet er et delt git-submodul, der virker som et **Claude Code-plugin** — du skal derfor **ikke kopiere filer manuelt**. Følg de tre trin herunder, så er du i gang; resten af opsætningen (initialisér site, brandfarver, byg guides) er beskrevet i den fulde vejledning.

1. **Tilføj submodulet** under `.claude/skills/` i dit projekt:

   ```bash
   git submodule add https://github.com/pkretzmann/Claude4BC.git .claude/skills/c4bc
   ```

2. **Genstart Claude Code.** Mappen indeholder en `plugin.json`, så den loades automatisk som pluginnet `c4bc`, og kommandoerne `/c4bc:…` samt skills dukker op automatisk.

3. **Importér de fælles husregler** i projektets egen `CLAUDE.md` (opret filen i git-roden, hvis den ikke findes) ved at tilføje denne linje:

   ```markdown
   @.claude/skills/c4bc/CLAUDE.md
   ```

   > ⚠️ **Hvorfor?** Claude Code loader kun *nestede* CLAUDE.md-filer (som submodulets) **on demand** — dvs. når Claude læser filer i selve submodul-mappen, hvilket sjældent sker under almindeligt AL-arbejde. Uden import-linjen er de fælles AL/DevOps-regler (Caption/ToolTip-krav, navngivning, AB#-commits m.m.) derfor **ikke** i kontekst i dit projekt. `@`-importen loader dem ved sessionstart.

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

### `/website-theme [tema-navn] [--preview]`
Vælg eller skift **visuelt tema** (layout/skin) for projektets dokumentationssite uden at røre indholdet. Temaerne ligger som katalog i `html-guide/themes/` (classic, minimal, editorial, bold, landing, review) og materialiseres ind i projektets `.website/`, så hvert projekt er selvstændigt og portabelt.

**Eksempler:**
```
/website-theme                 → lister temaerne
/website-theme editorial
/website-theme bold --preview
```

---

### `/website-build <fil.md | mappe>`
Konverterer en eller flere markdown-brugervejledninger til en professionel, selvstændig HTML-fil med projektets farvepalette og designsystem.

**Eksempler:**
```
/website-build vejledning.md
/website-build "Step 0 — Oversigt.md" "Step 1.md" "Step 2.md"
/website-build Dokumentation/
```

Bruger projektets `.website/styles.css` hvis den findes — ellers falder den tilbage på `.claude/skills/c4bc/html-guide/styles-default.css`. CSS og JavaScript indsættes ordret i den genererede HTML, så filen er selvstændig og virker offline.

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

### `/al-sort-usings [fil | mappe | glob]`
Sorterer `using`-direktiverne i alle `.al`-filer alfabetisk (ordinal/case-sensitiv — compilerens rækkefølge). Det afsluttende `;` indgår **ikke** i sorteringsnøglen, så et parent-namespace sorterer korrekt før sine children. Uden argument behandles hele projektet.

**Eksempler:**
```
/al-sort-usings
/al-sort-usings src/Sales
```

---

### `/al-next-id <objekttype>`
Finder det **første ledige AL-objekt-ID** for en given objekttype (codeunit, table, page, tableextension, …) inden for projektets `app.json` `idRanges`. Objekt-ID'er er namespacede pr. type, så svaret afhænger altid af typen.

**Eksempler:**
```
/al-next-id codeunit
/al-next-id tableextension
```

---

### `/al-bcquality-init`
Installerer Microsofts **BCQuality**-vidensbase ([github.com/microsoft/BCQuality](https://github.com/microsoft/BCQuality)) som **Claude Code-plugin** (user scope, én gang pr. udvikler) og forbinder den til projektets CLAUDE.md, så review-/analyse-agenter kan bruge dens guardrails og skills — bl.a. bridge-skill'en `bcquality-al-review`. Egne partner-/kunderegler i `bcquality-custom/knowledge/` vinder over plugin'ets community/microsoft-lag. Klon aldrig BCQuality ind i et AL-workspace — dens eksempel-`.al`-filer knækker AL-buildet. Kan også køres manuelt med `install-bcquality.ps1`; opdatering sker via plugin-manageren (`/plugin`).

**Eksempler:**
```
/al-bcquality-init
```

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

### `/website-update-portal [sti]`
Den **inkrementelle vedligeholder** af dokumentationsportalen: gennemgår projektets **commits siden sidste portal-opdatering** (statefilen `.website/.portal-state.json`), udleder hvilke sider der er berørt af kodeændringerne, **omskriver kildematerialet** (`.md`) for de berørte sider — efter brugerens godkendelse af en ændringsoversigt — genbygger deres HTML og synkroniserer menuen. Beregnet til projekter, hvor koden ofte ændres uden at `.md`-kilderne følger med.

**Eksempler:**
```
/website-update-portal
/website-update-portal "Customer Base App/.website"
```

Første kørsel bruger den seneste commit der rørte `.website/` som baseline. Håndskrevne HTML-sider uden `.md`-kilde omskrives aldrig — de flagges kun som *muligvis forældede*. Ingen nye commits → »Portalen er ajour«. Enkeltfil-leverancer er fortsat `/website-build`s opgave.

---

### `/website-implement-language-selector [sti]`
Efter-monterer globus-**sprogvælgeren** i portaler dannet **før** sprogvælgeren kom i skabelonen, og gør rod-redirecten `.website/index.html` "klæbende" (husker brugerens valg). Injicerer kirurgisk kun de manglende dele, så eksisterende — evt. oversat — UI-tekst bevares. Nye sites får vælgeren automatisk fra skabelonen.

**Eksempler:**
```
/website-implement-language-selector
/website-implement-language-selector .website/da-DK
```

---

### `/website-github-init-deploy [sti]`
Initialisér GitHub Actions-workflowen `.github/workflows/DeployDocsWebsite.yaml`, der publicerer projektets `.website`-site til **GitHub Pages**. Generisk: finder selv `.website` (i roden eller en app-undermappe, også med mellemrum i stien) og hovedgrenen, og indsætter dem i workflowen.

**Eksempler:**
```
/website-github-init-deploy
/website-github-init-deploy "Customer Base App/.website"
```

Idempotent — findes workflowen, vises forskellen og du spørges før overskrivning. Husk bagefter at sætte **Settings → Pages → Source = »GitHub Actions«** i repoet. Selve `.website`-indholdet dannes af `/website-init`, `/website-build` og `/website-update-index`.

### `/pdf-build [sti] [--locale xx-XX]`
Danner **én samlet PDF pr. sprog** ud af `.website`-sitet: brandet forside + indholdsfortegnelse med sidetal + alle indholdssider i portalens kapitelrækkefølge (fra `NAV`). Projekt-agnostisk — brandfarver fra `styles.css`, titel fra portalens `<title>`, logo fra `favicon.svg`. Renderes med headless Chromium (Playwright) og flettes med pdf-lib.

**Eksempler:**
```
/pdf-build
/pdf-build --locale da-DK
/pdf-build "Customer Base App/.website"
```

Output: `<.website>/<sprog>/Brugervejledning.pdf` (da-DK) / `User Guide.pdf` (en-US). Kræver Node.js; afhængigheder installeres én gang i plugin'ets `pdf-build/` (git-ignoreret). Sprog uden `NAV`-array springes over.

---

### `/al-code-review [sti] [--lang en|da] [--no-images] [--out <mappe>]`
Analyserer et Business Central AL-repo og danner et **ledelses-rettet teknisk kode-review** som selvstændig **HTML + PDF**: executive summary, samlet verdict-banner, et **RAG-bedømt status-dashboard** (fire scorecards + KPI-fliser) på tværs af *Code quality*, *Test coverage*, *Architecture & maintainability* og *Security & upgrade-readiness*, per-dimension fund, og prioriterede anbefalinger. Data hentes via **`al-mcp`** (`al_getdiagnostics`, `al_symbolsearch`, `al_symbolrelations`, `al_getpackagedependencies`) kombineret med en let filsystem-scanning. Illustrationer genereres med **Higgsfields** (kan slås fra med `--no-images`). Rapporten styles af det nye **`review`**-tema og kan placere billeder full-bleed/breakout uden for tekstspalten.

**Eksempler:**
```
/al-code-review
/al-code-review "Customer Base App" --lang da
/al-code-review --no-images --out docs/review
```

Output: `<out>/Code-Review-<app>-<dato>.html` + `.pdf` (+ `assets/`). Default `<out>` er `./code-review/`. PDF'en bygges med `pdf-build/build-report-pdf.mjs` (Playwright + pdf-lib, samme isolerede afhængigheder som `/pdf-build`). Findes projektets `.website/styles.css`, arves brandfarverne så rapporten matcher kundens identitet.

---

### `/nav-split-objects <eksport.txt> [output-mappe] [--types …] [--list]`
Splitter en **klassisk NAV C/SIDE-teksteksport** (én stor `.txt` fra Object Designer med tusindvis af objekter) i **én fil pr. objekt**, navngivet `<Type>_<Nr>_<Navn>.txt` (fx `Table_36_Sales_Header.txt`). Kører via et bundtet PowerShell-script, der **aldrig** lader modellen parse eksporten — splittet er **byte-bevarende**, så kodning (UTF-8 eller OEM/CP850 med æøå) aldrig ødelægges, og en sammenkædning af output-filerne genskaber kilden byte for byte. Håndterer Table, Form, Report, Dataport, Codeunit, XMLport, MenuSuite, Page og Query; en 185 MB-eksport med 7.500+ objekter splittes på ~15 sekunder.

**Eksempler:**
```
/nav-split-objects all_objects.txt
/nav-split-objects "Changes 2024.txt" Split --types Codeunit,Table
/nav-split-objects eksport.txt --list
```

Default-output er mappen `<eksportnavn>-Objects` ved siden af kildefilen. `--list` viser kun objekt-oversigten uden at skrive filer. Idempotent — genkørsel overskriver eksisterende output-filer.

---

### `/bc-verify-behavior <objekt> — <rapporteret adfærd>`
Efterprøver en rapporteret »standard BC respekterer ikke indstilling X« **mod Microsofts faktiske Base App-kilde** — før du tror på den, før du afviser den, og før du søger på ét eneste forum. Henter objektet via skill'en `bc-baseapp-source`, finder den bagvedliggende variabel og eftersporer **hver eneste tildeling uden for request-siden** (tvungne overrides bor næsten altid i `OnPreReport`/`OnRun`/`OnOpenPage`). Konklusionen placeres i præcis én kasse: **By design**, **Regression**, **Not this object** eller **Undetermined** — og altid med *versionsspænd*, aldrig en påstand uden. Forum-søgning sker først til sidst; kilden slår forum-konsensus.

**Eksempler:**
```
/bc-verify-behavior report 94 Close Income Statement — posterer detaljelinjer selvom Post to Retained Earnings Account er sat til Balance
/bc-verify-behavior codeunit 80 Sales-Post — bogfører ikke dimensioner fra kundekortet
```

Er kunden dansk, hentes `dk-<major>` også — lokaliseret base app kan overskrive W1-adfærd. Guardrails i kommandoen forbyder at konkludere ud fra hukommelse eller at opfinde event-/feltnavne: findes det ikke i den hentede kilde, er det ikke evidens.

---

## Skills

Ud over kommandoerne indeholder bundtet **Agent Skills** i `skills/`-mappen. Forskellen på de to: kommandoer starter *du* med `/c4bc:…`, mens skills aktiveres **automatisk af Claude**, når opgaven matcher — fx når du beder om en ny BC-side eller -tabel. Hver skill bager de fælles husregler (Caption/ToolTip-krav, navngivning uden prefix/»Ext«, testkrav) direkte ind i mønstrene, og har en `references/examples.md` med komplette AL-eksempler, som Claude læser efter behov.

| Skill | Aktiveres når… | Indhold |
|---|---|---|
| `bc-page-design` | der designes/ændres pages eller pageextensions | Valg af sidetype (List/Card/Document/…), layout & FastTabs, actions med `actionref`-promotion, views, tooltip-regler (ingen ToolTip på page-felter — de arves fra tabellen; krav om ToolTip på pageext-felter) |
| `bc-table-design` | der designes/ændres tabeller eller tableextensions | Felter med Caption/ToolTip/DataClassification, datatyper, nøgler & SIFT, FlowFields/FlowFilters, TableRelation & validering, nummerserie-mønster |
| `al-testing` | der skrives AL-tests (og efter nye codeunits/tableextensions — projektregel) | Testcodeunit-skelet, Given/When/Then, Assert, UI-handlers, TestPages, library-codeunits, isolation |
| `bc-extensibility` | standard BC-logik skal udvides | Integration events & subscribers, posting-hooks (Sales/Purch), nummerserier (moderne »No. Series«-modul), dimensioner, enum extensions & interfaces |
| `bc-baseapp-source` | der spørges til, hvordan et standard-BC-objekt **faktisk** er implementeret, eller om Microsoft har ændret det mellem versioner | Objektnavn → repo-sti i `StefanMaron/MSDyn365BC.Code.History`, hentning pr. branch (`w1-28`, `dk-28`, …), unified diff mellem majors, `-r sandbox` for hotfix-niveau. Slår både forum-søgning og gætteri fra hukommelsen — kilden er autoritativ og versionsfæstnet |

> ℹ️ **`bc-baseapp-source` kræver bash.** Motoren er `skills/bc-baseapp-source/scripts/bc-baseapp-source.sh`; på Windows køres den gennem Git Bash, som følger med Git for Windows. Første kørsel laver en blobless shallow clone (~1 MB pr. branch) i `$CLAUDE4BC_CACHE` (default `~/.cache/claude4bc`) — der er **ingen** GitHub-API involveret, så du kan ikke løbe ind i rate limits. Hentede filer lander i `./.bc-source` i **dit** projekt: tilføj `.bc-source/` til projektets `.gitignore` — Microsofts kilde må aldrig committes ind i et kunde-repo, og skal bruges som read-only reference, ikke kopieres ind i en extension.

Skills loades automatisk sammen med pluginnet — der kræves ingen opsætning ud over submodulet. Nye skills tilføjes som `skills/<navn>/SKILL.md` (hold den under ~200 linjer; større referencemateriale lægges i undermappen `references/`).

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
git submodule add https://github.com/pkretzmann/Claude4BC .claude/skills/c4bc
git add .
git commit -m "Add Claude4BC as submodule"
git push
```

Submodulet **skal ligge under en `.claude/skills/`-mappe** (gerne i git-roden, så det dækker alle apps i et monorepo). Det indeholder en `.claude-plugin/plugin.json` og loades derfor automatisk som et **in-place plugin** (`c4bc@skills-dir`) — uden marketplace eller install-trin. Kommandoerne bliver tilgængelige med namespace, fx `/c4bc:website-build`, skills loades fra `skills/`-mappen, og submodulets `.mcp.json` loades som plugin-MCP (med per-server-godkendelse). Genstart Claude Code efter tilføjelsen, så det nye plugin opdages.

Husk derefter import-linjen `@.claude/skills/c4bc/CLAUDE.md` i projektets egen `CLAUDE.md` (se **Kom godt i gang**, trin 3) — ellers loades de fælles husregler ikke ved sessionstart.

---

## Opdatér Claude4BC i et eksisterende projekt

Når der er ændringer i Claude4BC, kør medfølgende script fra git-roden i dit projekt:

```powershell
.\.claude\skills\c4bc\update-claude4bc.ps1
```

Scriptet finder selv git-roden, viser nuværende og seneste commit, og springer over hvis du allerede er på seneste version. Ellers beder det om bekræftelse (`j/n`) og udfører derefter: opdaterer submodulet (`git submodule update --remote`), committer ændringen (`"Bump Claude4BC to latest"`) og pusher.

> ℹ️ **Ældre projekter med mappen `claude4bc`:** Standardstien er nu `.claude/skills/c4bc`, men projekter med den gamle mappe `.claude/skills/claude4bc` virker uændret — scriptet finder submodulet ud fra sin egen placering, og kommando-namespacet har altid været `/c4bc:` (det kommer fra `plugin.json`, ikke mappenavnet). Sørg blot for, at `@`-import-linjen i projektets CLAUDE.md matcher den faktiske mappesti. Vil du migrere til den korte sti:
>
> ```bash
> git mv .claude/skills/claude4bc .claude/skills/c4bc
> git commit -m "Rename Claude4BC submodule folder to c4bc"
> ```
>
> (`git mv` opdaterer selv stien i `.gitmodules`.)

### Manuelt

Foretrækker du at køre trinene selv:

```bash
git submodule update --remote .claude/skills/c4bc
git add .claude/skills/c4bc
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

`.claude/skills/c4bc/html-guide/styles-default.css` er det fulde, neutralt-brandede standardstylesheet til HTML-guides og **deles** via submodulet — rediger den ikke per projekt. Ønsker du et projekt-specifikt stylesheet, opret `.website/styles.css` i dit projekt (typisk via `/website-create-css`, der seeder fra default'en og sætter dine brandfarver) — `/website-build` bruger den automatisk frem for default'en.