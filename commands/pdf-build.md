---
description: Dan én samlet PDF-brugervejledning (forside + indholdsfortegnelse + alle sider) ud af et .website-dokumentationssite
argument-hint: "(valgfrit) sti til .website og/eller --locale da-DK"
---

# pdf-build — Saml dokumentationssitet til én PDF

Genererer **én samlet PDF pr. sprog** ud af HTML-siderne i projektets `.website`-site:
en brandet **forside**, en **indholdsfortegnelse med sidetal**, og derefter **alle
indholdssider** i præcis samme kapitelrækkefølge som portalen (læst fra `NAV`-arrayet i
`<sprog>/index.html`). Nederst på hver side stemples et sidetal.

Kommandoen er **projekt-agnostisk**: brandfarverne læses fra `.website/styles.css`, titlen fra
portalens `<title>`, og logoet fra `.website/favicon.svg`. Den virker for alle sprogmapper
(`da-DK`, `en-US`, …) der har et `NAV`-array — sprog uden NAV springes over.

Rendering sker med **headless Chromium** (Playwright), der honorerer `@media print` i siderne,
og PDF'erne flettes med **pdf-lib**. Output pr. sprog: `<.website>/<sprog>/Brugervejledning.pdf`
(dansk) / `User Guide.pdf` (engelsk).

## Brug

```
/c4bc:pdf-build                          → finder selv projektets .website, bygger alle sprog
/c4bc:pdf-build <sti-til-.website>
/c4bc:pdf-build --locale da-DK           → kun ét sprog
/c4bc:pdf-build <sti> --locale en-US
```

Valgfri parametre kan gives videre til scriptet: `--title`, `--subtitle`, `--date`, `--output`.

## Forudsætninger

- **Node.js** skal være installeret (`node --version`).
- Værktøjernes afhængigheder (Playwright + pdf-lib) installeres **én gang** i selve plugin'et —
  se trin 2. Chromium hentes af Playwright (~120 MB, deles på tværs af projekter).
- **Netadgang** under generering er en fordel: så indlejres Google Fonts (Inter / JetBrains Mono)
  korrekt i PDF'en; ellers falder den tilbage til systemskrifttyper.

## Fremgangsmåde (for Claude)

### 1. Lokalisér `.website`-mappen
- Er der givet en sti i `$ARGUMENTS` (et argument der **ikke** starter med `--`), og peger den på en
  eksisterende `.website`-mappe, så brug den.
- Ellers søg efter en mappe ved navn `.website` under repo-roden (`git rev-parse --show-toplevel`).
  **Udelad** `.git/`, `node_modules/` og `.claude/` (submodul-skabeloner må aldrig matche).
  - **Ingen fundet** → bed brugeren køre `/c4bc:website-init` først, og stop.
  - **Præcis én** → brug den.
  - **Flere** (monorepo) → vis listen og **spørg**, hvilken der skal bygges.

### 2. Sørg for at værktøjet er installeret (idempotent)
Kør i plugin'ets `pdf-build`-mappe — afhængighederne ligger isoleret dér, ikke i projektet:

```bash
cd "${CLAUDE_PLUGIN_ROOT}/pdf-build"
[ -d node_modules ] || npm install
npx playwright install chromium     # hopper hurtigt over hvis allerede hentet
```

> `node_modules/` og `.tmp/` er git-ignoreret i plugin'et, så de forurener ikke Claude4BC-repoet.

### 3. Kør generatoren
Kald det bundtede script og giv den **absolutte** sti til `.website` med (citér stier med mellemrum):

```bash
node "${CLAUDE_PLUGIN_ROOT}/pdf-build/build-pdf.mjs" --website "<absolut sti til .website>"
```

- Uden `--locale` bygges **alle** sprogmapper der har et NAV-array; sprog uden NAV springes over
  (logges som »springer … over«).
- Videregiv evt. brugerens `--locale`/`--title`/`--subtitle`/`--date`/`--output` ordret.

### 4. Rapportér
- Vis hvilke PDF'er der blev dannet og deres stier (scriptet printer `✓ <sti> (N sider)` pr. sprog).
- Nævn hvis et sprog blev sprunget over fordi det manglede et NAV-array (fx en endnu tom `en-US`).

## Output

```
.website/
├── da-DK/
│   └── Brugervejledning.pdf      ← forside + TOC + alle danske sider
└── en-US/
    └── User Guide.pdf            ← dannes når en-US har indhold (NAV-array)
```

## Hvad scriptet gør (kort)

1. Finder `.website` (arg eller opadgående søgning), læser brandfarver fra `styles.css`, logo fra
   `favicon.svg`.
2. For hvert sprog: læser `NAV` fra `<sprog>/index.html`, danner forside + TOC, renderer hver
   indholdsside til PDF i print-tilstand, og fletter alt til ét dokument med løbende sidetal.
3. Skriver `<sprog>/<Brugervejledning|User Guide>.pdf`.

## Bemærk

- **Idempotent:** kør den trygt igen — den overskriver blot den eksisterende PDF.
- **Datoen** på forsiden er dags dato (lokaliseret). Overstyr med `--date "…"` ved behov.
- Hver indholdsside renderes med sit eget print-layout (`@media print` i siden folder accordions
  ud, skjuler søgefelt/knapper/animationer og bevarer brandfarverne).
- Sprogmapper genkendes på mønsteret `xx-XX` (fx `da-DK`, `en-US`).
- PDF'en kan udelades fra GitHub Pages-deploy hvis ønsket, men kan også blot ligge i sprogmappen
  og downloades direkte.
