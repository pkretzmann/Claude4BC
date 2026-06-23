---
description: Synkronisér dokumentationsportalen pr. sprog (.website/<sprog>/index.html) med de HTML-sider der ligger i sprogmappen, og hold rod-redirectens sprogliste opdateret
argument-hint: "(valgfrit) sti til .website eller til en bestemt sprogmappe — standard er alle sprog"
---

# website-update-index — Byg/opdatér dokumentationsportalens NAV (pr. sprog)

Holder hver sprogmappes portal `.website/<sprog>/index.html` i sync med de faktiske
HTML-sider i **samme** sprogmappe. Kommandoen **scanner filsystemet** og (gen)bygger
`NAV`-listen pr. sprog — den er idempotent og håndterer nye, omdøbte og slettede sider
automatisk. Den holder også rod-redirectens (`.website/index.html`) sprogliste opdateret.
`/website-build` rører ikke nogen `index.html`; det er denne kommandos opgave.

## Brug

```
/website-update-index                       → synkroniser alle sprogmappers portaler i projektets .website/
/website-update-index <sti-til-.website>    → som ovenfor, men under den angivne .website-mappe
/website-update-index <sti-til-sprogmappe>  → synkroniser kun ét sprog (fx …/.website/da-DK)
```

## Fremgangsmåde (for Claude)

### 1. Find .website-mappen og sprogmapperne
- **Bestem `.website`-mappen og hvilke sprog der skal behandles:**
  - Ingen `$ARGUMENTS` → brug `<projektrod>/.website` og behandl **alle** sprogmapper i den.
  - `$ARGUMENTS` peger på en `.website`-mappe → brug den og behandl **alle** sprogmapper i den.
  - `$ARGUMENTS` peger på en **sprogmappe** (en undermappe i et `.website`, fx `.website/da-DK`)
    → behandl **kun** det sprog. `.website`-roden er da forældermappen (bruges til redirecten i trin 7).
  - Findes `.website` ikke, så bed brugeren køre `/website-init` først, og stop.
- **Sprogmapper** = de umiddelbare undermapper i `.website/`, hvis navn **ikke** starter med `.`
  (fx `da-DK`, `en-US`). Mapper der starter med `.` (`.sourcematerial.md` osv.) er **ikke** sprog.
  Findes ingen sprogmapper, så bed brugeren køre `/website-init` først, og stop.

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
- **Vælg portal-skabelon (tema-bevidst):** findes en projekt-ejet skabelon
  `<.website-rod>/.portal-template.html` (lagt der af et struktur-tema via `/website-theme`),
  så brug **den**. Ellers brug den delte, kanoniske `${CLAUDE_PLUGIN_ROOT}/html-guide/portal.html`.
  - Begge skabeloner eksponerer de samme markører (`BRAND`, `NAV`, `LOCALES`) og pladsholdere
    (`{{SITE_TITLE}}`, `{{SITE_BADGE}}`), så resten af trinnene nedenfor er ens uanset skabelon.
  - **Bemærk:** skifter man tema med `/website-theme`, ændres portalens *struktur* kun for nye
    eller gendannede portaler. For at en eksisterende portal får den nye struktur (fx skift
    mellem sidebar og top-nav), så **slet** `.website/<sprog>/index.html` og kør kommandoen igen
    (NAV genopbygges fra siderne). Et rent farve-/brand-skift kræver ikke sletning.
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
Portalens sidebjælke og UI skal matche projektets `/website-create-css`-palette. Brandfarverne i portalen
ligger i `:root` mellem markørerne `/* === BRAND:START … */` og `/* === BRAND:END === */`.

- **Læs brandfarverne fra `.website/styles.css`** — de seks variabler i dens `:root`-BRAND-blok:
  `--brand-dark`, `--brand-mid`, `--brand-light`, `--brand-pale`, `--brand-subtle`, `--accent`.
- **Skriv dem ind i portalens `:root`** — erstat **kun** indholdet mellem `/* === BRAND:START … */`
  og `/* === BRAND:END === */` med de samme værdier. Lad resten af `:root` (neutrale tokens,
  `--sidebar-w`) og al øvrig CSS stå urørt.
- Findes markørerne ikke (ældre portal uden BRAND-blok), så erstat de eksisterende
  `--brand-*`-linjer i portalens `:root` og indsæt markørerne samtidig.
- **Findes `.website/styles.css` ikke** (projektet er ikke brandet med `/website-create-css`), så lad
  portalens skabelon-standardfarver stå, og **bemærk** i rapporten, at portalen bruger neutrale
  standardfarver — kør `/website-create-css` for at brande den.

Dette gælder **både** når portalen lige er oprettet fra skabelonen (trin 6) og når en eksisterende
portal opdateres — så brandfarverne holdes i sync med `.website/styles.css` ved hver kørsel.

### 6c. Sprogvælger (globus-dropdown)
Portalens topbar har en globus-dropdown, hvor brugeren selv kan vælge sprog. Listen af sprog ligger i
portalens `const LOCALES = [ … ]` mellem markørerne `// === LOCALES:START …` og `// === LOCALES:END ===`.

- **Skriv hele sproglisten ind** mellem markørerne — **samme liste og rækkefølge som trin 7**
  (standardsproget først, derefter de øvrige), fx:

  ```js
      "da-DK", "en-US",
  ```

  Brug hele sitets sprogmapper (samme scanning som trin 7), **uanset** om kørslen kun behandlede ét
  sprog i `$ARGUMENTS` — alle portaler skal vise hele sproglisten.
- **Skriv ikke** det aktuelle sprog ind: portalens JS udleder det fra sin egen sti (mappenavnet), så
  `LOCALES`-blokken er **identisk** i alle sprogportaler.
- **Findes markørerne ikke** (ældre portal uden sprogvælger), så **spring over** og bemærk i
  rapporten, at portalen skal **gendannes fra skabelonen** for at få sprogvælgeren — slet
  `.website/<sprog>/index.html` og kør kommandoen igen (NAV genopbygges). Sprogvælgeren er en
  layout-ændring (skabelonen), ikke en NAV-ændring, så den injiceres ikke i en portal der mangler
  markup/CSS/JS til den.

Dette gælder **både** ved oprettelse fra skabelonen (trin 6) og ved opdatering af en eksisterende
portal — så sproglisten holdes i sync med sprogmapperne ved hver kørsel.

### 6d. Sidebar-accordion (sammenfoldelige grupper) — til/fra-valg
Portalen kan vise NAV-grupperne som **accordion**: klik på en gruppetitel for at folde gruppen
ud/sammen (kun gruppen med den aktive side er udfoldet ved indlæsning; søgning udfolder midlertidigt
alle grupper med træffere). Det styres af `const SIDEBAR_ACCORDION = …;` mellem markørerne
`// === ACCORDION:START …` og `// === ACCORDION:END ===` i portalen — værdien er enten `true` (til)
eller `false` (fra).

- **Standard er `false`** (Nej) — alle grupper vises altid udfoldet (det hidtidige udseende).
- **Ny portal fra skabelonen:** behold skabelonens standard `false`, medmindre brugeren
  **udtrykkeligt** beder om accordion (sæt da linjen mellem markørerne til `true;`).
- **Eksisterende portal:** **bevar** den nuværende værdi mellem markørerne — sæt den *ikke* tilbage
  til standard. Bruger portalen allerede accordion (`true`), forbliver den `true`, medmindre brugeren
  udtrykkeligt beder om at slå den fra.
- **Findes markørerne ikke** (ældre portal fra før accordion-valget): spring over og bemærk i
  rapporten, at valget kræver, at portalen gendannes fra skabelonen (slet `.website/<sprog>/index.html`
  og kør igen) — det er en layout-/skabelon-ændring, ikke en NAV-ændring.

Dette gælder **både** ved oprettelse og opdatering, så valget holdes konsistent på tværs af kørsler.

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
- **Findes `.website/index.html` ikke** → opret den **ikke** her; bed brugeren køre `/website-init`
  for at danne redirect-siden, og bemærk det i rapporten.

### 8. Rapportér
Vis en kort oversigt **pr. sprog**: antal sider fundet, grupper, og hvad der er
**tilføjet/fjernet/omdøbt** i forhold til den tidligere NAV-liste. Nævn desuden, om
rod-redirectens sprogliste blev opdateret (og til hvilke sprog/standardsprog), om portalernes
sprogvælger-liste (`LOCALES`) blev synkroniseret (og for hvilke portaler markørerne manglede, så de
skal gendannes fra skabelonen), og om portalernes brandfarver blev synkroniseret fra
`.website/styles.css` (eller om der blev brugt neutrale standardfarver, fordi `.website/styles.css`
mangler). Nævn også hver portals accordion-tilstand (`SIDEBAR_ACCORDION` = til/fra), og om en portal
manglede markørerne, så valget ikke kunne sættes.

## Vigtigt

- Hver portals **NAV-liste er et genereret artefakt** — rediger den ikke i hånden; kør kommandoen igen.
- Portalens *layout/opførsel* (sidebar-struktur, søgning, routing) ændres i skabelonen —
  projekt-ejet `<.website>/.portal-template.html` hvis den findes (lagt af et struktur-tema via
  `/website-theme`), ellers den delte `${CLAUDE_PLUGIN_ROOT}/html-guide/portal.html` — **ikke** i
  den enkelte `index.html`.
- Portalens **brandfarver** er ligeledes et genereret artefakt (BRAND-blokken mellem markørerne) —
  rediger dem ikke i hånden. De afledes af projektets `.website/styles.css`; skift farver med
  `/website-create-css` og kør derefter `/website-update-index` igen. Skabelonens egne BRAND-farver er kun en
  neutral standard for u-brandede projekter.
- Portalens **sprogliste** (`LOCALES`-blokken mellem markørerne) er også et genereret artefakt —
  rediger den ikke i hånden. Den afspejler sprogmapperne i `.website/` og holdes i sync ved hver
  kørsel. Sprogvælgeren skjules automatisk, hvis der kun findes ét sprog.
- Portalens **accordion-valg** (`SIDEBAR_ACCORDION` mellem `ACCORDION:START`/`END`) er et **bevaret
  valg** (ikke et genereret artefakt): standard er `false` (Nej), og en eksisterende portals værdi
  bevares ved opdatering. Slå til/fra ved at sætte linjen til `true;`/`false;` mellem markørerne
  (eller bed Claude om det). Accordion-CSS/JS ligger altid i skabelonen og er inaktiv, når valget er
  `false`.
- Sti-værdier i `NAV` skal være **relative til portalen** (dvs. til sprogmappen `.website/<sprog>/`),
  så portalen kan loade siderne i sin iframe og fuldtekst-søgningen kan `fetch`'e dem. Hold derfor
  hver sides kildemateriale og færdige HTML i **samme** sprogmappe.
- Rod-`index.html` er **kun** en redirect — den har ingen NAV og skal ikke have sider lagt ved siden af.
  Denne kommando opdaterer kun dens `LOCALES`/`DEFAULT` mellem markørerne.
