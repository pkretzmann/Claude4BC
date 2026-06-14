---
description: Konvertér en eller flere markdown-brugervejledninger til en selvstændig, interaktiv HTML-side
argument-hint: "<fil.md | \"fil1.md\" \"fil2.md\" | mappe>"
---

# html-guide — Konverter markdown brugervejledning til HTML

Konverter en markdown-brugervejledning til en professionel, interaktiv HTML-fil med projektets farvepalette og designsystem (CSS i `.website/styles.css` med fald-tilbage til `${CLAUDE_PLUGIN_ROOT}/html-guide/styles-default.css`, JavaScript i `${CLAUDE_PLUGIN_ROOT}/html-guide/script.js`).

## Brug

```
/html-guide <fil.md>                       → én fil → én HTML (samme basisnavn, samme mappe)
/html-guide <fil1.md> <fil2.md> …          → flere filer → ÉN samlet HTML (i angiven rækkefølge)
/html-guide <mappe>                         → alle .md i mappen → ÉN samlet HTML (naturlig navne-rækkefølge)
/html-guide <mappe> → .website/<sprog>      → ÉN side pr. emne i sprogmappen (multi-side; til /update-website)
```

Eksempler:
- `/html-guide <mappe>/<vejledning>.md`
- `/html-guide "<mappe>/Step 0 — Oversigt.md" "<mappe>/Step 1.md"`
- `/html-guide "<mappe>"`
- `/html-guide "<mappe>" — skriv som multi-side i .website/da-DK` (multi-side-tilstand, se nedenfor)

## Hvad kommandoen gør

**Én fil (uændret):**
1. Læser den angivne `.md`-fil
2. Genererer en selvstændig `.html`-fil i **samme mappe** med samme basisnavn
3. Anvender projektets farvepalette og designsystem fra `.website/styles.css` — eller fald-tilbage-filen `${CLAUDE_PLUGIN_ROOT}/html-guide/styles-default.css` hvis `.website/styles.css` ikke findes (se nedenfor)

**Flere filer / en mappe (multi-fil-tilstand):**
1. Indsamler kildefilerne — enten de angivne filer (i argument-rækkefølge) eller alle `.md` i den
   angivne mappe (naturlig navne-rækkefølge, så "Truck Step 0", "1", … "10" kommer i rigtig orden).
   Kun `.md` medtages; midlertidige/kopi-filer (`*_tmp*`, `* copy*`, ikke-`.md`) ignoreres.
2. Genererer **én** samlet, selvstændig `.html`-fil efter reglerne i "Flere filer → ét dokument"
   nedenfor.
3. **Output-navn:** hvis sidste argument ender på `.html`, bruges det som output-sti. Ellers default:
   mappe-tilstand → `<mappenavn>.html` i samme mappe; fil-liste → afled fra guidens titel (typisk
   oversigts-/Step 0-filen) og placér i første fils mappe.

## Flere filer → ét dokument

Når der gives flere filer eller en mappe, samles alt til **ét** sammenhængende HTML-dokument:

- **Ét selvstændigt dokument:** præcis **én** `<header>`, **én** `<nav class="toc">`, **én**
  `<footer>` og CSS **én** gang — aldrig gentaget pr. kildefil.
- **Rækkefølge:** mappe = naturlig sortering af filnavne; fil-liste = argument-rækkefølgen.
- **Pr. kildefil = en sektionsgruppe:** filens `#` H1 bliver gruppens titel/afsnitsskel, og dens
  `##`-overskrifter bliver `.section`-kort under den. Hver gruppe får et entydigt anker-id.
- **Samlet indholdsfortegnelse:** én TOC med ét punkt pr. kildefil (filens titel), evt. med
  under-punkter for filens vigtigste `##`-afsnit. Alle links er **interne ankre** i siden.
- **Krydsreferencer omskrives:** henvisninger mellem filerne (fx "se Truck Step 2.md") bliver
  **interne anker-links** i samme side — ikke fil-links — da alt nu er én side.
- **Samlet titel:** afled en overordnet H1 til headeren (fx fra oversigts-/Step 0-filens titel eller
  mappenavnet), med badge/pills der opsummerer guiden.
- **Dubletter:** hvis flere filer gentager samme afsnit (fx "Hardware-opsætning"), beholdes de pr.
  gruppe for læsbarhed. Findes en oversigtsfil (fx Step 0), samler den typisk dette i forvejen.
- **End-user-reglerne gælder på tværs af alle samlede filer** — se "Ingen kode i dokumentationen"
  nedenfor. Tekniske "AL-objekter"-tabeller, objekt-/codeunit-/tabel-ID'er og kodeblokke udelades i
  hele den samlede HTML, uanset hvilken kildefil de stammer fra.

## Multi-side-tilstand (én side pr. emne → `.website/<sprog>`)

Ud over "ét samlet dokument" findes en **multi-side-tilstand**: i stedet for ét stort HTML-dokument
genereres **én selvstændig side pr. kildefil/emne**, lagt i sprogmappen, klar til at
`/update-website` binder dem sammen i en portal. Brug den til en **komplet, flersidet
dokumentationsportal** frem for ét langt dokument.

**Hvornår vælges denne tilstand:** når brugeren beder om "multi-side"/"flersidet" dokumentation,
**eller** når output-målet er en sprogmappe i et `.website` (fx `.website/da-DK`). Ellers gælder
enkeltfil-/ét-dokument-reglerne ovenfor.

Regler (forskelle fra "ét dokument"):

- **Én HTML pr. kildefil/emne** — ikke ét samlet dokument. Hver side er fuldt selvstændig efter de
  samme regler som enkeltfil-tilstanden (CSS **og** JS indlejret ordret, `<header>` med badge/pills,
  `<footer>`, og en **per-side `<nav class="toc">`** der linker til sidens egne `##`-sektioner).
- **Placering:** `.website/<sprog>/<gruppe>/<emne>.html`. Læg hver side i en **gruppemappe** der
  afspejler dokumentets dele (fx "Opsætning", "Daglig brug", "Reference").
- **Gruppe-rækkefølge:** `/update-website` sorterer grupper **alfabetisk** og bruger mappenavnet som
  menu-overskrift. Skal grupperne vises i en bestemt læse-rækkefølge, så **nummer-præfiks** mappenavnet
  (fx `1. Kom godt i gang`, `2. Opsætning`, `3. Daglig brug`).
- **Filnavne:** korte og helst ascii. Brug nummer-præfiks (`1-…`, `2-…`) for at styre rækkefølgen
  **inden for** en gruppe (siderne sorteres naturligt).
- **Favicon:** siderne ligger to mappeniveauer under `.website/`, så `href="../../favicon.svg"`
  (udelades hvis `.website/favicon.svg` ikke findes — se *Favicon*).
- **Ingen samlet header/TOC/footer på tværs** (modsat ét-dokument-tilstanden). Portalen fra
  `/update-website` leverer cross-side-navigationen.
- **Krydsside-links undgås:** referencer mellem siderne skrives som **tekst** ("se afsnittet
  Opsætning → Knyt data"), ikke som hyperlinks — siderne loades i portalens iframe, og relative
  fil-links på tværs af gruppemapper er skrøbelige. Interne ankre **på samme side** er fine.
- **End-user-/ingen-kode-reglerne gælder uændret** på hver side.
- **Efterbehandling:** bed brugeren køre `/update-website` bagefter for at bygge portalens menu og
  opdatere rod-redirectens sprogliste.

> **Hjælpescript (anbefalet for mange sider).** Da hver side skal indlejre `styles.css` + `script.js`
> **ordret**, er det både hurtigere og mindre fejlbehæftet at lade et lille script wrappe de
> Claude-skrevne bodies end at indsætte CSS/JS i hånden på N sider. Brug
> `${CLAUDE_PLUGIN_ROOT}/html-guide/build_pages.py`: Claude skriver **kun** hver sides body (selve
> `.section`-kortene) + et lille manifest, og scriptet indsætter ordret CSS/JS, bygger per-side-TOC'en,
> beregner favicon-stien og skriver siderne. Se scriptets egen dok-streng for manifest-formatet.
> Scriptet wrapper kun boilerplate — **indholdet** (kuratering, oversættelse, opdeling) skriver Claude.

## Styling (CSS)

Hele designsystemet — farvepalette **og** alle komponenter — ligger i ét stylesheet. Projektets
udgave er `.website/styles.css`; findes den ikke, bruges den fulde, neutralt-brandede default
`${CLAUDE_PLUGIN_ROOT}/html-guide/styles-default.css`.

- **Kommandoen skal læse stylesheetet og indsætte dets indhold ordret** i et
  `<style>`-element i `<head>` på den genererede HTML. Genskriv **aldrig** CSS fra hukommelsen —
  så undgås drift og layout-fejl (f.eks. den ombrydnings-sikre step-layout).
- **Valg af stylesheet (fald-tilbage-rækkefølge):**
  1. Findes `.website/styles.css` (projekt-specifik), bruges den.
  2. Findes den **ikke**, bruges default'en `${CLAUDE_PLUGIN_ROOT}/html-guide/styles-default.css`.
  - Findes **ingen** af de to filer, så stop og bed brugeren køre `/create-css <website-url> [type]`
    (eller `/init-website` efterfulgt af `/create-css`) før konverteringen fortsætter.
- **Brandfarver** ændres kun i `:root`-BRAND-blokken øverst i `.website/styles.css` (variablerne
  `--brand-dark`, `--brand-mid`, `--brand-light`, `--brand-pale`, `--brand-subtle`, `--accent`).
  Resten af filen (neutrale tokens og komponent-CSS) røres normalt ikke.
- Class-navnene nedenfor (`.section`, `.steps`, `.note`, `.fc-node` osv.) matcher klasserne i
  stylesheetet — brug dem uændret.

## Interaktivitet (JavaScript)

Vejledningerne er **som standard interaktive**. Et lille, kanonisk forbedringslag ligger i
`${CLAUDE_PLUGIN_ROOT}/html-guide/script.js`.

- **Kommandoen skal læse `${CLAUDE_PLUGIN_ROOT}/html-guide/script.js` og indsætte dens indhold ordret** i et
  `<script>`-element **lige før `</body>`**. Genskriv **aldrig** scriptet fra hukommelsen — på samme
  måde som CSS'en holdes kanonisk i `styles.css`.
- **Ren vanilla JS, ingen afhængigheder, intet build-step.** Alt er *progressive enhancement*:
  hver funktion er beskyttet (`if`-tjek), så vejledningen er **fuldt læsbar uden JavaScript** —
  scriptet tilføjer kun ekstra bekvemmelighed.
- Indbyggede funktioner (virker på tværs af alle guides, no-op hvis elementet ikke findes):
  - Blød scroll for TOC-/anker-links
  - Scroll-spy: aktivt TOC-punkt fremhæves (`.toc a.active`) mens man scroller
  - Kopiér-knap på `<pre>`-kodeblokke (tekniske guides)
  - "Fold alle ud/ind" på `<details>`-FAQ
  - "Til toppen"-knap der dukker op ved scroll
  - Scroll-reveal: `.section`-kort toner ind når de scrolles i syne (kun når `<body class="fx">` — se *Designregler*; respekterer `prefers-reduced-motion`)
- De tilhørende styles (`.copy-btn`, `.to-top-btn`, `.expand-all-btn`, `.toc a.active`) findes
  allerede i `styles.css` og skjules i print.

### Ikke understøttet: frameworks / build-steps

**React, Vue, Angular o.l. bruges ikke** — og heller ikke noget der kræver et build-step, npm eller
en CDN-runtime. Det ville bryde kerneideen: én **selvstændig, portabel** HTML-fil der kan kopieres
ind i et hvilket som helst projekt, åbnes ved at dobbeltklikke, printes og virke offline (`file://`).
Har en opgave brug for ægte app-dynamik (formularer, data, beregninger), er det en **webapp** — ikke
en brugervejledning — og hører ikke under denne kommando.

## Favicon

Sitet har et fælles ikon, `favicon.svg`, som ligger i **roden af `.website/`** (lægges der af
`/init-website`) og **deles på tværs af alle sprog**. Hver genereret side skal pege på det med et
`<link rel="icon">` i `<head>`.

- **Relativ sti — beregnes ud fra sidens placering i forhold til `.website/`.** Sitet er
  flersproget: siderne ligger i en sprogmappe (`.website/<sprog>/<emne>/<side>.html`), så `href`
  skal pege **tilbage til roden** med ét `../` pr. mappeniveau mellem siden og `.website/`:
  - portal direkte i sprogmappen `.website/<sprog>/` (ét niveau) → `href="../favicon.svg"`
  - side i `.website/<sprog>/<emne>/` (to niveauer) → `href="../../favicon.svg"`
  - side i `.website/<sprog>/<emne>/<under>/` (tre niveauer) → `href="../../../favicon.svg"`
  - dvs. ét `../` pr. mappeniveau mellem siden og `.website/`.
- **Hvorfor relativ (ikke `/favicon.svg`):** en rod-relativ sti virker kun når sitet serveres over
  `http://localhost`/GitHub Pages — ikke når en enkelt side åbnes som `file://`. Den relative sti
  virker i begge tilfælde og holder siden portabel.
- **Findes `.website/favicon.svg` ikke** (fx hvis `/init-website` ikke er kørt), så udelad
  `<link rel="icon">`-linjen helt frem for at lave et dødt link.

## Designregler

- **`<strong>`**: Altid `font-weight: 600` (ikke browser-default 700) — undgår visuelt "luft" i løbende tekst. Ingen farveoverride på `strong` i steps/info-bokse; brug kun farve i `.note strong` og `footer strong`
- **Skrifttype**: Inter (Google Fonts) med fallback til system-sans
- **Header**: Gradient fra `--brand-dark` til `--brand-light`, hvid tekst
- **Sektioner**: Hvide kort med let blå-grå skygge og afrundede hjørner (12px)
- **Tabeller**: Mørk navy header-række, zebra-stribet body, hover-highlight
- **Nummererede trin**: Cirkel-numre i brandfarve, lys baggrund. **Layout-regel (vigtig — håndhæves allerede af `styles.css`):** Brug **ikke** `display: flex` på selve `<li>` i `.steps`/`.sub-steps`. Flex gør hvert tekststykke og hvert inline-element til separate flex-items på én linje, så et trin der fylder mere end én linje kollapser til ét ord pr. linje. Brug i stedet `position: relative` på `<li>` med `padding-left` til at give plads, og placér cirkel-nummeret/pilen med `position: absolute` i venstre margen. Så flyder teksten normalt og ombrydes pænt over flere linjer. Reglerne scopes med child-combinator (`.steps > li`, ikke `.steps li`), så en `.sub-steps` nestet inde i et trin **ikke** arver nummercirklen og lægger sig oven i sin egen tekst.
- **Flowdiagrammer**: HTML-bokse (IKKE ASCII-art), brug `.fc-node`, `.fc-node.start`, `.fc-node.decision`, `.fc-node.action`, `.fc-node.end`
- **To-system data-flow-diagram** (`.sysflow`): til at vise data der flyder **mellem to systemer**. To `.sysflow-node`-bokse med en `.sysflow-wires`-søjle imellem; hver `.sysflow-wire` (`.to-right`/`.to-left`) har en `.sysflow-label` + fire `<i class="dot">`, hvor prikkerne glider langs wiren (ren CSS, ingen JS). Diagrammet er **dekorativt** — sæt `aria-hidden="true"` og hav den tilsvarende tabel/tekst tæt på. Eksempel:
  ```html
  <div class="sysflow" aria-hidden="true">
    <div class="sysflow-node">System A<span class="sysflow-sub">ejer stamdata</span></div>
    <div class="sysflow-wires">
      <div class="sysflow-wire to-right"><span class="sysflow-label">Stamdata ▶</span><i class="dot"></i><i class="dot"></i><i class="dot"></i><i class="dot"></i></div>
      <div class="sysflow-wire to-left"><span class="sysflow-label">◀ Hændelser</span><i class="dot"></i><i class="dot"></i><i class="dot"></i><i class="dot"></i></div>
    </div>
    <div class="sysflow-node">System B<span class="sysflow-sub">ejer hændelser</span></div>
  </div>
  ```
- **Bevægelse / scroll-reveal** (`.fx`): når `<body>` har klassen `fx`, toner `.section`-kort blødt ind, når de scrolles i syne (via `script.js`). Det er **progressive enhancement** og **opt-in**: CSS skjuler kun sektioner under `.js-fx`, som scriptet selv tilføjer — uden JS (eller ved `prefers-reduced-motion`) vises alt normalt. `build_pages.py` sætter `fx` som standard; i enkeltfil-tilstand tilføjer du selv `class="fx"` på `<body>`, hvis du vil have effekten. Tal kan tælle op ved at give et element `data-countup="<tal>"` (skriv slutværdien som elementets tekst, så no-JS viser den).
- **FAQ**: `<details>`/`<summary>` accordion
- **Advarselsboks** (Vigtigt): gul/orange note-box
- **Infoboks** (neutral info): blå info-box
- **Tekniske detaljer**: `<dl>` grid med monospace værdier
- **Footer**: Mørk brand-baggrund, firma-/projektnavn + dato
- **Dag-badge** (tidspunkter i eksempler): `<span class="day-tag">søndag</span>` — varm orange ramme, bruges til at fremhæve konkrete dage/tidspunkter i forklarende eksempler (f.eks. "produktion søndag — import mandag"). CSS for `.day-tag` er allerede defineret i `styles.css`.

## HTML-skelet

CSS hentes **altid** fra `.website/styles.css` — eller fald-tilbage-filen
`${CLAUDE_PLUGIN_ROOT}/html-guide/styles-default.css` hvis `.website/styles.css` ikke findes (se afsnittet *Styling (CSS)*)
— ikke fra en eksempel-HTML. Selve dokument-skelettet er:

```html
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>…</title>
  <link rel="icon" type="image/svg+xml" href="<relativ-sti-til-favicon.svg>" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    /* ← indsæt hele indholdet af det valgte stylesheet (.website/styles.css, ellers styles-default.css) her, ordret */
  </style>
</head>
<body>
  <header> … </header>
  <div class="container">
    <nav class="toc"> … </nav>
    <div class="section" id="…"> … </div>
    …
  </div>
  <footer> … </footer>
  <script>
    /* ← indsæt hele indholdet af ${CLAUDE_PLUGIN_ROOT}/html-guide/script.js her, ordret */
  </script>
</body>
</html>
```

## Målgruppe og tone

Vejledningerne er skrevet til **slutbrugere** — ikke udviklere. Sproget skal være handlingsorienteret og lettilgængeligt.

## Ingen kode i dokumentationen

- **Aldrig** inkludere kodeblokke (```` ```...``` ````), AL-kode, SQL, JSON eller lignende teknisk kode i den genererede HTML
- Feltnavne og systemnavne fremhæves med `<strong>` (eller skrives i en tabel) — **ikke** som `<code>`-elementer. `<strong>` ombrydes pænt i løbende tekst og lister, mens inline `<code>` har `white-space: nowrap` og kan bryde flerlinjet layout. (Dette er mønstret fra `Siloforbrugssporing.html`.) `strong { font-weight: 600 }` er allerede sat i `styles.css`, så fremhævningen ikke virker for tung, når teksten ombrydes over flere linjer
- Referencer til codeunits, tabelnumre og objektnavne udelades — de er irrelevante for brugeren
- Hvis kilden (markdown-filen) indeholder kodeblokke, **ignoreres de** eller omskrives til et brugervenligt handlingstrin
- Tekniske detaljer-sektioner (feltnumre, codeunit-ID'er, tabel-ID'er) medtages **ikke** i HTML-outputtet, medmindre de har direkte brugerværdi (f.eks. rapport-ID en bruger skal indtaste)
- "AL-objekter"-tabeller (kolonner som Objekt / ID / Fil) udelades **altid**
- Ved multi-fil/mappe-tilstand gælder disse regler **på tværs af alle samlede kildefiler** — teknisk indhold fjernes uanset hvilken fil det stammer fra

## Regler for konvertering fra markdown

| Markdown-element | HTML-komponent |
|---|---|
| `## Overskrift` + liste med tal | `.section` + `.steps` |
| `### Underoverskrift` | `<h3>` i `.section` |
| `| Tabel |` | `<table>` med thead/tbody |
| `> **Vigtigt:**` | `.note` box |
| `> Info` | `.info-box` |
| ASCII flowchart (```...```) | Rigtige `.flowchart` HTML-bokse |
| Kodeblok (```al / ```js osv.) | **Udelades** — omskriv til klartekst hvis nødvendigt |
| FAQ-sektion | `<details>`/`<summary>` accordion |
| Tekniske detaljer (feltnumre, obj-ID) | **Udelades** |
| "AL-objekter"-tabel (Objekt/ID/Fil) | **Udelades** |
| Flere kildefiler / en mappe | Ét dokument med fælles header/TOC/footer; hver fil = sektionsgruppe; AL-objekt-tabeller udelades |
| Mappe → `.website/<sprog>` (multi-side) | Én selvstændig side pr. emne i gruppemapper; per-side header/TOC/footer; bind sammen med `/update-website` |

## Påkrævet indhold

Alle HTML-filer skal indeholde:
- `<meta charset="UTF-8">` og viewport
- `<link rel="icon" type="image/svg+xml">` med relativ sti til `.website/favicon.svg` (se *Favicon* — udelades hvis filen ikke findes)
- Google Fonts Inter-import
- Hele indholdet af `.website/styles.css` (eller fald-tilbage `${CLAUDE_PLUGIN_ROOT}/html-guide/styles-default.css`) indsat ordret i `<style>`
- Hele indholdet af `${CLAUDE_PLUGIN_ROOT}/html-guide/script.js` indsat ordret i `<script>` lige før `</body>`
- `<header>` med gradient, badge, titel og pills
- `<nav class="toc">` med indholdsfortegnelse
- `<footer>` med firmanavn og dato

## Sprog

Vejledningens tekst forbliver på det originale sprog (typisk dansk). Kode, CSS og class-navne er på engelsk.
