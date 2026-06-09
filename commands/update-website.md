---
description: Synkronisér dokumentationsportalen pr. sprog (.website/<sprog>/index.html) med de HTML-sider der ligger i sprogmappen, og hold rod-redirectens sprogliste opdateret
argument-hint: "(valgfrit) sti til .website eller til en bestemt sprogmappe — standard er alle sprog"
---

# update-website — Byg/opdatér dokumentationsportalens NAV (pr. sprog)

Holder hver sprogmappes portal `.website/<sprog>/index.html` i sync med de faktiske
HTML-sider i **samme** sprogmappe. Kommandoen **scanner filsystemet** og (gen)bygger
`NAV`-listen pr. sprog — den er idempotent og håndterer nye, omdøbte og slettede sider
automatisk. Den holder også rod-redirectens (`.website/index.html`) sprogliste opdateret.
`/html-guide` rører ikke nogen `index.html`; det er denne kommandos opgave.

## Brug

```
/update-website                       → synkroniser alle sprogmappers portaler i projektets .website/
/update-website <sti-til-.website>    → som ovenfor, men under den angivne .website-mappe
/update-website <sti-til-sprogmappe>  → synkroniser kun ét sprog (fx …/.website/da-DK)
```

## Fremgangsmåde (for Claude)

### 1. Find .website-mappen og sprogmapperne
- **Bestem `.website`-mappen og hvilke sprog der skal behandles:**
  - Ingen `$ARGUMENTS` → brug `<projektrod>/.website` og behandl **alle** sprogmapper i den.
  - `$ARGUMENTS` peger på en `.website`-mappe → brug den og behandl **alle** sprogmapper i den.
  - `$ARGUMENTS` peger på en **sprogmappe** (en undermappe i et `.website`, fx `.website/da-DK`)
    → behandl **kun** det sprog. `.website`-roden er da forældermappen (bruges til redirecten i trin 7).
  - Findes `.website` ikke, så bed brugeren køre `/init-website` først, og stop.
- **Sprogmapper** = de umiddelbare undermapper i `.website/`, hvis navn **ikke** starter med `.`
  (fx `da-DK`, `en-US`). Mapper der starter med `.` (`.sourcematerial.md` osv.) er **ikke** sprog.
  Findes ingen sprogmapper, så bed brugeren køre `/init-website` først, og stop.

Behandl **hver** valgt sprogmappe med trin 2–6. Kør derefter trin 7 (rod-redirect) og trin 8 (rapport).

### 2. Find siderne (i den aktuelle sprogmappe)
Søg rekursivt efter `*.html` i `.website/<sprog>/`, men **udelad**:
- `.website/<sprog>/index.html` (selve portalen)
- alt under `.sourcematerial.md/` (kildemateriale, ikke færdige sider)
- alt under mapper der starter med `.`

### 3. Udled NAV-data pr. side
For hver fundet side:
- **`path`** = stien **relativ til sprogmappen `.website/<sprog>/`**, med skråstreger (`/`), fx
  `Warehouse/Jungheinrich/Spærring og synkronisering med Jungheinrich.html`.
- **`group`** = den **øverste undermappe** i stien (fx `Warehouse`). Ligger siden direkte i
  sprogmappen, brug gruppen `"Generelt"`.
- **`title`** = en kort, læsbar titel. Tag den fra sidens `<header>`-`<h1>` (foretrukket), ellers
  fra `<title>` (fjern et evt. site-suffiks som `" · …"` eller `" — …"`). Hold den kortfattet.

### 4. Sortér
- Grupper i alfabetisk rækkefølge.
- Sider inden for en gruppe i naturlig orden (så "Step 0", "Step 1", … "Step 10" er korrekt).

### 5. Byg NAV-array'et
Generér JavaScript med **2-mellemrums indrykning**, præcis dette format:

```js
  { group: "<Gruppe>", items: [
    { title: "<Titel>", path: "<relativ/sti.html>" },
    { title: "<Titel>", path: "<relativ/sti.html>" },
  ]},
```

- Brug **dobbelt-citationstegn** om JS-strenge. Indeholder en titel/sti et `"` eller `\`, så
  escape det (`\"`, `\\`). Tegn som `&`, `æ`, `ø`, `å`, `—` er fine uden escaping.

### 6. Skriv `.website/<sprog>/index.html`

**Hvis portalen allerede findes:**
- Erstat **kun** indholdet mellem markørerne `// === NAV:START …` og `// === NAV:END ===`
  med de genererede grupper. Lad **alt andet** i filen stå urørt (titel, layout, scripts).
- Findes markørerne ikke (ældre fil), så erstat hele `const NAV = [ … ];`-arrayet og indsæt
  markørerne samtidig.
- **Favicon:** portalen ligger **én mappe nede** (i sprogmappen), så den deler favicon peger
  **tilbage til `.website`-roden** med `../favicon.svg`:
  - mangler `<head>` et `<link rel="icon" …>`, så indsæt
    `<link rel="icon" type="image/svg+xml" href="../favicon.svg" />` lige efter `<title>`.
  - findes linjen allerede, men peger på `favicon.svg` (rod-relativ til sprogmappen — typisk fra
    en migreret/ældre portal), så ret den til `../favicon.svg`. Peger den allerede på
    `../favicon.svg`, så rør den ikke.

**Hvis portalen ikke findes (første gang for dette sprog):**
- Læs den kanoniske skabelon `${CLAUDE_PLUGIN_ROOT}/html-guide/portal.html`.
- Erstat pladsholderne:
  - `{{SITE_TITLE}}` → projektets titel for dette sprog. Brug `$ARGUMENTS` hvis det ligner en titel,
    ellers et fornuftigt standardnavn (fx `"<Firmanavn> Dokumentation"` udledt af repoet, eller
    `"Dokumentation"`). Husk: `{{SITE_TITLE}}` optræder **tre** steder (`<title>`, sidebar-`<h1>`
    og `document.title`-suffikset).
  - `{{SITE_BADGE}}` → en kort label, fx `"Business Central"` (eller `"Dokumentation"`).
- **Favicon:** skabelonen peger på `favicon.svg`. Da portalen nu ligger i en sprogmappe, **ret**
  `href="favicon.svg"` til `href="../favicon.svg"`, så den finder den delte favicon i `.website`-roden.
- Indsæt de genererede grupper mellem `NAV:START`/`NAV:END`.
- Skriv resultatet til `.website/<sprog>/index.html`.

### 6b. Brand portalen med projektets farvepalette
Portalens sidebjælke og UI skal matche projektets `/create-css`-palette. Brandfarverne i portalen
ligger i `:root` mellem markørerne `/* === BRAND:START … */` og `/* === BRAND:END === */`.

- **Læs brandfarverne fra `.website/styles.css`** — de seks variabler i dens `:root`-BRAND-blok:
  `--brand-dark`, `--brand-mid`, `--brand-light`, `--brand-pale`, `--brand-subtle`, `--accent`.
- **Skriv dem ind i portalens `:root`** — erstat **kun** indholdet mellem `/* === BRAND:START … */`
  og `/* === BRAND:END === */` med de samme værdier. Lad resten af `:root` (neutrale tokens,
  `--sidebar-w`) og al øvrig CSS stå urørt.
- Findes markørerne ikke (ældre portal uden BRAND-blok), så erstat de eksisterende
  `--brand-*`-linjer i portalens `:root` og indsæt markørerne samtidig.
- **Findes `.website/styles.css` ikke** (projektet er ikke brandet med `/create-css`), så lad
  portalens skabelon-standardfarver stå, og **bemærk** i rapporten, at portalen bruger neutrale
  standardfarver — kør `/create-css` for at brande den.

Dette gælder **både** når portalen lige er oprettet fra skabelonen (trin 6) og når en eksisterende
portal opdateres — så brandfarverne holdes i sync med `.website/styles.css` ved hver kørsel.

### 7. Opdatér rod-redirecten `.website/index.html`
Hold redirect-sidens sprogliste i sync med de sprogmapper, der faktisk findes i `.website/`.
- **Find alle sprogmapper** i `.website/` (umiddelbare undermapper hvis navn ikke starter med `.`),
  **uanset** om kørslen kun behandlede ét sprog i `$ARGUMENTS` — listen skal afspejle hele sitet.
- **Bestem standardsproget:** `da-DK` hvis den findes blandt sprogmapperne, ellers den
  første i alfabetisk orden. Sortér `LOCALES` med standardsproget **først**.
- **Findes `.website/index.html`** → erstat **kun** indholdet mellem `// === LOCALES:START …`
  og `// === LOCALES:END ===` med de opdaterede værdier:

  ```js
      var LOCALES = ["<standardsprog>", "<øvrige sprog>"];
      var DEFAULT = "<standardsprog>";
  ```

  Lad alt andet i filen stå urørt. Findes markørerne ikke (ældre/manuel redirect), så lad filen
  være og **bemærk** i rapporten, at sproglisten ikke kunne opdateres automatisk.
- **Findes `.website/index.html` ikke** → opret den **ikke** her; bed brugeren køre `/init-website`
  for at danne redirect-siden, og bemærk det i rapporten.

### 8. Rapportér
Vis en kort oversigt **pr. sprog**: antal sider fundet, grupper, og hvad der er
**tilføjet/fjernet/omdøbt** i forhold til den tidligere NAV-liste. Nævn desuden, om
rod-redirectens sprogliste blev opdateret (og til hvilke sprog/standardsprog), og om portalernes
brandfarver blev synkroniseret fra `.website/styles.css` (eller om der blev brugt neutrale
standardfarver, fordi `.website/styles.css` mangler).

## Vigtigt

- Hver portals **NAV-liste er et genereret artefakt** — rediger den ikke i hånden; kør kommandoen igen.
- Portalens *layout/opførsel* (sidebar-struktur, søgning, routing) ændres i skabelonen
  `${CLAUDE_PLUGIN_ROOT}/html-guide/portal.html`, ikke i den enkelte `index.html`.
- Portalens **brandfarver** er ligeledes et genereret artefakt (BRAND-blokken mellem markørerne) —
  rediger dem ikke i hånden. De afledes af projektets `.website/styles.css`; skift farver med
  `/create-css` og kør derefter `/update-website` igen. Skabelonens egne BRAND-farver er kun en
  neutral standard for u-brandede projekter.
- Sti-værdier i `NAV` skal være **relative til portalen** (dvs. til sprogmappen `.website/<sprog>/`),
  så portalen kan loade siderne i sin iframe og fuldtekst-søgningen kan `fetch`'e dem. Hold derfor
  hver sides kildemateriale og færdige HTML i **samme** sprogmappe.
- Rod-`index.html` er **kun** en redirect — den har ingen NAV og skal ikke have sider lagt ved siden af.
  Denne kommando opdaterer kun dens `LOCALES`/`DEFAULT` mellem markørerne.
