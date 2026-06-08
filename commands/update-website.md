---
description: Synkronisér dokumentationsportalen (.website/index.html) med de HTML-sider der ligger i .website/
argument-hint: "(valgfrit) sti til .website — standard er projektets .website-mappe"
---

# update-website — Byg/opdatér dokumentationsportalens NAV

Holder portalen `.website/index.html` i sync med de faktiske HTML-sider i `.website/`.
Kommandoen **scanner filsystemet** og (gen)bygger `NAV`-listen — den er idempotent og
håndterer nye, omdøbte og slettede sider automatisk. `/html-guide` rører ikke `index.html`;
det er denne kommandos opgave.

## Brug

```
/update-website                → synkroniser projektets .website/index.html
/update-website <sti-til-.website>
```

## Fremgangsmåde (for Claude)

### 1. Find portalmappen
- Hvis `$ARGUMENTS` er angivet, brug den sti. Ellers brug `<projektrod>/.website`.
- Findes mappen ikke, så bed brugeren køre `/init-website` først, og stop.

### 2. Find siderne
Søg rekursivt efter `*.html` i `.website/`, men **udelad**:
- `.website/index.html` (selve portalen)
- alt under `.sourcematerial.md/` (kildemateriale, ikke færdige sider)
- alt under mapper der starter med `.`

### 3. Udled NAV-data pr. side
For hver fundet side:
- **`path`** = stien **relativ til `.website/`**, med skråstreger (`/`), fx
  `Warehouse/Jungheinrich/Spærring og synkronisering med Jungheinrich.html`.
- **`group`** = den **øverste undermappe** i stien (fx `Warehouse`). Ligger siden direkte i
  `.website/`, brug gruppen `"Generelt"`.
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

### 6. Skriv `index.html`

**Hvis `.website/index.html` allerede findes:**
- Erstat **kun** indholdet mellem markørerne `// === NAV:START …` og `// === NAV:END ===`
  med de genererede grupper. Lad **alt andet** i filen stå urørt (titel, layout, scripts).
- Findes markørerne ikke (ældre fil), så erstat hele `const NAV = [ … ];`-arrayet og indsæt
  markørerne samtidig.

**Hvis `.website/index.html` ikke findes (første gang):**
- Læs den kanoniske skabelon `${CLAUDE_PLUGIN_ROOT}/html-guide/portal.html`.
- Erstat pladsholderne:
  - `{{SITE_TITLE}}` → projektets titel. Brug `$ARGUMENTS` hvis det ligner en titel, ellers et
    fornuftigt standardnavn (fx `"<Firmanavn> Dokumentation"` udledt af repoet, eller `"Dokumentation"`).
    Husk: `{{SITE_TITLE}}` optræder **tre** steder (`<title>`, sidebar-`<h1>` og `document.title`-suffikset).
  - `{{SITE_BADGE}}` → en kort label, fx `"Business Central"` (eller `"Dokumentation"`).
- Indsæt de genererede grupper mellem `NAV:START`/`NAV:END`.
- Skriv resultatet til `.website/index.html`.

### 7. Rapportér
Vis en kort oversigt: antal sider fundet, grupper, og hvad der er **tilføjet/fjernet/omdøbt**
i forhold til den tidligere NAV-liste.

## Vigtigt

- `index.html`'s **NAV-liste er et genereret artefakt** — rediger den ikke i hånden; kør kommandoen igen.
- Portalens *udseende/opførsel* (sidebar, søgning, routing) ændres i skabelonen
  `${CLAUDE_PLUGIN_ROOT}/html-guide/portal.html`, ikke i den enkelte `index.html`.
- Sti-værdier skal være **relative til `index.html`** (dvs. til `.website/`), så portalen kan
  loade siderne i sin iframe og fuldtekst-søgningen kan `fetch`'e dem.
