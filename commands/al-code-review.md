---
description: Analyze a Business Central AL repository and produce an executive technical-review report (HTML + PDF) — executive summary, RAG-rated status dashboard, per-dimension findings and AI illustrations
argument-hint: "[<sti til AL-projekt / app.json>] [--lang en|da] [--no-images] [--out <mappe>]"
---

# al-code-review — Executive technical review of a BC AL repository

Produce a **technical code review written for a CEO/CFO audience**: it opens with an
**executive summary**, shows an **overall verdict** and a **RAG-rated status dashboard**
(four traffic-light scorecards + KPI tiles), then per-dimension findings illustrated with
AI-generated technical/user images, and finally prioritized recommendations. Output is a
self-contained **HTML** report **and** a branded **PDF**.

The report is styled by the **`review`** theme (`${CLAUDE_PLUGIN_ROOT}/html-guide/themes/review/styles.css`),
which provides the `.exec-summary`, `.verdict-banner`, `.dashboard`/`.scorecard`, `.kpi-row`/`.kpi`
and breakout-`figure` components. Data comes from the **`al-mcp`** server.

> This is a **technical** document — unlike `/website-build` (end-user docs, strips code/IDs),
> object names, IDs, diagnostics and code are **kept** here. Do **not** route this through
> `/website-build`; this command writes its own self-contained HTML.

## Brug

```
/c4bc:al-code-review                          → find AL-projekt, byg rapport (HTML+PDF) i ./code-review/
/c4bc:al-code-review <sti-til-projekt>        → analysér et bestemt AL-projekt (mappe med app.json)
/c4bc:al-code-review --lang da                → skriv rapporten på dansk (default: engelsk, jf. CLAUDE.md)
/c4bc:al-code-review --no-images              → spring AI-illustrationer over (brug pladsholder-figurer)
/c4bc:al-code-review --out docs/review        → skriv output i en anden mappe
```

## Forudsætninger

- **`al-mcp`** MCP-serveren skal være tilgængelig (symbol-/diagnostik-opslag). Hentes schema'er
  med ToolSearch (`al_addproject`, `al_getdiagnostics`, `al_symbolsearch`, `al_symbolrelations`,
  `al_getpackagedependencies`, `al_downloadsymbols`).
- **Node.js** til PDF-trinnet (samme værktøjsmappe som `/c4bc:pdf-build`).
- **Higgsfields** MCP (`generate_image`, `job_status`) til illustrationer — valgfri; uden den
  (eller med `--no-images`) bruges pladsholder-figurer.

## Fremgangsmåde (for Claude)

### 1. Lokalisér AL-projektet
- Er der givet en sti i `$ARGUMENTS` (et argument der **ikke** starter med `--`) som peger på en
  mappe med `app.json`, så brug den.
- Ellers søg efter `app.json` under repo-roden (`git rev-parse --show-toplevel`), **udelad**
  `.git/`, `node_modules/`, `.claude/`. Præcis én → brug den; flere (monorepo) → vis listen og
  **spørg**; ingen → bed brugeren pege på projektet og stop.
- Læs `app.json`: `name`, `publisher`, `version`, `application`/`platform`/`runtime`, `idRanges`,
  `dependencies`. Disse fodrer headeren, KPI-fliser og dimensionen *Security & upgrade-readiness*.

### 2. Registrér projektet i `al-mcp` og sørg for symboler
- `al_addproject` med `projectPath` = projektmappen. Hvis symboler mangler (tomme søgeresultater
  eller fejl om manglende afhængigheder), kør `al_downloadsymbols` og prøv igen.

### 3. Indsaml data
Kombinér **al-mcp** med en let filsystem-scanning (Glob/Grep):

- **Diagnostik:** `al_getdiagnostics` med `projectPath` (evt. `severities:['error','warning']`,
  `limit:500`). Tæl errors / warnings / info, og grupér efter `code` for de hyppigste regler.
- **Objekt-inventar:** `al_symbolsearch` med `query:'*'`, `filters.scope:'project'` og
  `filters.kinds` pr. type (`Table`, `TableExtension`, `Page`, `PageExtension`, `Codeunit`,
  `Report`, `Enum`, `Interface`, `PermissionSet`, `Query`, `XmlPort`). Tæl pr. type.
- **Kobling/relationer:** for de største/mest centrale objekter, `al_symbolrelations`
  (`ExtendedBy`, `UsedAsSourceTable`, `Implements`/`Extends`) for at vurdere kobling og udvidelser.
- **Afhængigheder & version:** `al_getpackagedependencies` (`projectPath`) + `app.json` `application`/
  `platform`/`runtime` → BC-mål-version vs. nuværende, og om afhængigheder er friske.
- **Filsystem-scan (Glob/Grep i projektmappen):**
  - **Navnekonvention** (CLAUDE.md): filer `<Base>.<ObjectType>.al`; ingen `Ext`-suffix på
    extension-objekter. Tæl afvigelser.
  - **Caption/ToolTip:** fields uden `Caption`; table-felter/page-felter uden `ToolTip` hvor krævet
    (PageExt skal have ToolTip). Grep efter `field(` vs. `Caption`/`ToolTip`.
  - **Test:** filer der matcher `*Test.Codeunit.al` (eller `Subtype = Test`).
  - **Security:** `permissionset`-objekter til stede? Grep efter `ObsoleteState`/`ObsoleteTag`
    (deprecering) og brug af forældede API'er.
  - **Prefix:** er der prefix på objekter (jf. CLAUDE.md: kun efter aftale)?

### 4. Scor de fire dimensioner (RAG)
Brug rubrikken nedenfor. Hver dimension får en **score 0–100**, en **RAG-farve** og en
**1-linjes verdict**. Sæt også et samlet vægtet **overall**-tal og en bogstavkarakter.

RAG-tærskler: **Green ≥ 75 · Amber 50–74 · Red < 50**.
Overall = vægtet snit (Code quality 30 % · Test coverage 25 % · Architecture 25 % · Security 20 %).
Karakter: **A ≥ 85 · B 75–84 · C 60–74 · D 45–59 · E < 45**.

| Dimension | Green (75–100) | Amber (50–74) | Red (<50) |
|---|---|---|---|
| **Code quality / diagnostics** | 0 errors, lav warning-tæthed, Caption/ToolTip dækket | warnings eller manglende Caption/ToolTip eller navnekonventions-afvigelser | kompileringsfejl |
| **Test coverage** | test/forretningslogik-ratio ≥ ~0,5, bredt dækket | nogle test-codeunits (ratio < 0,5) | ingen test-codeunits |
| **Architecture & maintainability** | konsistent navngivning, små/fokuserede objekter, lav kobling | blandet navngivning, store objekter eller høj kobling | ingen struktur/konventioner, monolitiske objekter |
| **Security & upgrade-readiness** | permission sets til stede, ingen forældet API, BC-mål aktuelt | manglende permission sets, lidt forældet API, lidt bagud på version | ingen permissions, udbredt forældet API, langt bagud / ikke upgrade-klar |

Begrund hver score kort med de **faktiske tal** (fx "23 warnings, 0 errors; 12 felter uden ToolTip").

### 5. Generér illustrationer (valgfri — default til)
Medmindre `--no-images` er sat, og hvis `generate_image` er tilgængelig:

- Lav **1 hero** (full-bleed) — abstrakt, professionel teknisk illustration der passer en
  bestyrelses-/ledelsesrapport (fx "modern Business Central / ERP architecture, abstract data
  flows, navy and gold corporate palette, clean, no text"), og **2–3 sektions-billeder**: ét
  *teknisk* (arkitektur/moduler) og ét *bruger-orienteret* (mennesker der bruger software).
- Kald `generate_image` med en passende `model` (fx `nano_banana_pro` til rene, tekstfrie
  illustrationer; `aspect_ratio` ~ `16:9` til hero) og poll `job_status` (`sync:true`) til
  terminal status. Hent resultat-URL'en.
- **Download** hvert billede til `<out>/assets/` (PowerShell `Invoke-WebRequest` eller `curl`) og
  **referér dem relativt** (`assets/<navn>.png`) i HTML'en. PDF-trinnet renderer via `file://`,
  så relative billeder kommer med i PDF'en.
- Placér hero som `figure.full-bleed` lige efter headeren/verdict, og sektions-billeder som
  `figure.breakout-left` / `figure.breakout-right` inde i de relevante dimension-sektioner.
- **Fallback:** ved `--no-images`, manglende Higgsfields, eller fejl → indsæt en pæn pladsholder-
  `figure` (tom ramme + caption, fx "Illustration — generér med Higgsfields") og fortsæt. Rapporten
  skal altid bygge færdig.

### 6. Skriv rapport-HTML'en (selvstændig)
Skriv `<out>/Code-Review-<app-navn>-<YYYY-MM-DD>.html` efter skelettet i `/website-build`
(*HTML-skelet*), men med **teknisk indhold tilladt**:

1. **CSS:** læs `${CLAUDE_PLUGIN_ROOT}/html-guide/themes/review/styles.css` og indsæt **ordret** i
   `<style>`. **Brand-bevaring:** findes projektets `.website/styles.css`, så overskriv de 6
   `:root`-BRAND-variabler (`--brand-dark` … `--accent`) i den inlinede CSS med projektets værdier;
   ellers behold `review`-temaets defaults.
2. **JS:** læs `${CLAUDE_PLUGIN_ROOT}/html-guide/script.js` og indsæt **ordret** i et `<script>`
   lige før `</body>`. Sæt `class="fx"` på `<body>` for blød scroll-reveal.
3. **Layout (rækkefølge):**
   - `<header>`: badge `Technical Code Review`, `h1` = app-navn, `p` = repo + dato, `.header-pills`
     med BC-version, objekt-antal og overall-karakter.
   - **Hero** `figure.full-bleed` (hvis billede).
   - **`.exec-summary`** — `<h2>Executive Summary</h2>` + 2–4 sætninger i ledelsessprog: hvad er
     kodebasen, samlet tilstand, vigtigste risici, og anbefalet handling.
   - **`.verdict-banner`** — score-cirkel (karakter), label, titel (fx "Solid foundation, addressable
     gaps") og 1–2 sætninger.
   - **`.dashboard`** — fire `.scorecard` (én pr. dimension) med `rag-green/amber/red`-klasse,
     `.sc-title`, `.rating-badge` (Strong / Adequate / At-risk), `.sc-score` og `.sc-verdict`.
   - **`.kpi-row`** — fliser: errors, warnings, objekter i alt, test-ratio %, BC-mål-version
     (brug `data-countup="<tal>"` på numeriske værdier; sæt `is-good`/`is-warn`/`is-bad`).
   - **Per-dimension `.section`** (én pr. dimension): fund, tabeller (fx top diagnostik-koder,
     objekt-inventar), og breakout-`figure`. Teknisk indhold (objekt-ID'er, regelkoder, kodeklip
     hvor relevant) er **tilladt**.
   - **`.section` Recommendations** — prioriteret liste (P1/P2/P3) som `.steps` eller tabel, med
     forventet effekt pr. punkt.
   - `<footer>` med firma-/projektnavn + dato.
4. Brug komponent-skabelonerne nedenfor for de review-specifikke blokke.

### 7. Byg PDF'en
Samme idempotente install som `/c4bc:pdf-build`, og kald den **single-dokument**-renderer:

```bash
cd "${CLAUDE_PLUGIN_ROOT}/pdf-build"
[ -d node_modules ] || npm install
npx playwright install chromium
node "${CLAUDE_PLUGIN_ROOT}/pdf-build/build-report-pdf.mjs" \
  --html "<absolut sti til Code-Review-….html>" \
  --title "<app-navn> — Code Review" --subtitle "Technical Code Review" \
  --badge "Confidential"
```
PDF'en skrives ved siden af HTML'en (samme basisnavn, `.pdf`). Giv evt. `--logo` med en sti til et
SVG-logo (fx `.website/favicon.svg`).

### 8. Rapportér
Vis stierne til HTML + PDF, **overall**-karakteren og de fire RAG-ratings (én linje pr. dimension),
samt om billeder blev genereret eller sprunget over. Afslut med `<promise>COMPLETE</promise>`.

## Komponent-skabeloner (review-tema)

```html
<!-- Executive summary -->
<section class="exec-summary">
  <h2>Executive Summary</h2>
  <p>… 2–4 sentences in plain business language …</p>
</section>

<!-- Overall verdict -->
<div class="verdict-banner">
  <div class="verdict-score"><span class="grade">B</span><span class="out">OVERALL</span></div>
  <div class="verdict-body">
    <div class="verdict-label">Repository verdict</div>
    <div class="verdict-title">Solid foundation, addressable gaps</div>
    <div class="verdict-text">…</div>
  </div>
</div>

<!-- Full-bleed hero image -->
<figure class="figure full-bleed">
  <img src="assets/hero.png" alt="">
  <figcaption class="figure-caption">…</figcaption>
</figure>

<!-- Status dashboard: one scorecard per dimension -->
<div class="dashboard">
  <div class="scorecard rag-green">
    <div class="sc-head"><span class="sc-title">Code Quality</span>
      <span class="rating-badge">Strong</span></div>
    <div class="sc-score">82</div>
    <div class="sc-verdict">0 errors, low warning density.</div>
  </div>
  <!-- rag-amber → "Adequate", rag-red → "At-risk" -->
</div>

<!-- KPI tiles -->
<div class="kpi-row">
  <div class="kpi"><div class="kpi-value is-good" data-countup="0">0</div><div class="kpi-label">Errors</div></div>
  <div class="kpi"><div class="kpi-value is-warn" data-countup="23">23</div><div class="kpi-label">Warnings</div></div>
  <div class="kpi"><div class="kpi-value" data-countup="148">148</div><div class="kpi-label">Objects</div></div>
  <div class="kpi"><div class="kpi-value is-warn">38%</div><div class="kpi-label">Test ratio</div></div>
</div>

<!-- Breakout image inside a dimension section -->
<figure class="figure breakout-right">
  <img src="assets/architecture.png" alt="">
  <figcaption class="figure-caption">…</figcaption>
</figure>
```

## Output

```
<out>/                              (default: ./code-review/)
├── Code-Review-<app>-<date>.html   ← self-contained report (review theme)
├── Code-Review-<app>-<date>.pdf    ← branded PDF (cover + report + page numbers)
└── assets/                         ← AI-generated illustrations (relative refs)
```

## Bemærk

- **Idempotent:** kør igen for at regenerere; overskriver HTML/PDF og assets.
- **Sprog:** rapportteksten følger `--lang` (default engelsk, jf. CLAUDE.md). Class-navne/CSS er engelsk.
- **Ratings er reproducerbare:** byg dem på de faktiske tal fra al-mcp + scanningen, ikke på fornemmelse.
- **Tema:** rapporten inliner `review`-temaet direkte; den behøver **ikke** at `.website` er sat op.
  Findes `.website/styles.css`, arves projektets brandfarver, så rapporten matcher kundens identitet.
