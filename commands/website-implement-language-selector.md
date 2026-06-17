---
description: Tilføj (efter-monter) sprogvælgeren til eksisterende dokumentationsportaler der er dannet før sprogvælgeren fandtes — uden at miste oversat UI-tekst
argument-hint: "(valgfrit) sti til .website eller til en bestemt sprogmappe — standard er alle sprog"
---

# website-implement-language-selector — Efter-montér sprogvælgeren i ældre portaler

Tilføjer globus-**sprogvælgeren** til portaler (`.website/<sprog>/index.html`) der blev dannet
**før** sprogvælgeren kom i skabelonen, og gør rod-redirecten `.website/index.html` "klæbende"
(husker brugerens valg). Kommandoen **injicerer kirurgisk** kun de manglende dele, så portalens
eksisterende — evt. **oversatte** — UI-tekst (undertekst, søgefelt, brødkrumme, knapper) bevares.

> **Hvornår.** Brug denne kommando på et site hvor topbaren mangler sprogvælgeren. Et **nyt** site
> får den automatisk fra skabelonen (`/website-update-index` danner portalen ud fra
> `${CLAUDE_PLUGIN_ROOT}/html-guide/portal.html`, som allerede indeholder vælgeren). Denne kommando
> er kun til **ældre** portaler, hvor en `/website-update-index` ellers ville springe vælgeren over (den
> er en layout-ændring, ikke en NAV-ændring).

> **Idempotent.** Indeholder en portal allerede vælgeren (markup med `id="langpick"`), springes den
> over. Kør trygt kommandoen igen.

## Brug

```
/website-implement-language-selector                       → alle sprogmappers portaler i projektets .website/
/website-implement-language-selector <sti-til-.website>    → som ovenfor, under den angivne .website-mappe
/website-implement-language-selector <sti-til-sprogmappe>  → kun ét sprog (fx …/.website/da-DK)
```

## Fremgangsmåde (for Claude)

### 1. Find .website-mappen og sprogmapperne
Som i `/website-update-index`:
- Ingen `$ARGUMENTS` → `<projektrod>/.website`, behandl **alle** sprogmapper.
- `$ARGUMENTS` = en `.website`-mappe → den, alle sprogmapper.
- `$ARGUMENTS` = en **sprogmappe** → kun det sprog (`.website`-roden er forældermappen, til trin 4).
- Findes `.website` ikke → bed brugeren køre `/website-init` først, og stop.
- **Sprogmapper** = umiddelbare undermapper i `.website/` hvis navn **ikke** starter med `.`
  (fx `da-DK`, `en-US`). Findes ingen → bed om `/website-init`, og stop.

### 2. Hent de kanoniske dele af vælgeren
**Foretrukket:** læs skabelonen `${CLAUDE_PLUGIN_ROOT}/html-guide/portal.html` og udtræk de fire
dele derfra (så de altid matcher den nyeste skabelon):
1. **CSS-blokken** `/* ── Sprogvælger ── */ … */` (lige før `.frame-wrap{…}`).
2. **Topbar-markuppen** `<div class="langpick" id="langpick" hidden> … </div>`.
3. **`const LOCALES`-blokken** inkl. `// === LOCALES:START … END ===`-markørerne.
4. **Sprogvælger-IIFE'en** `/* ── Sprogvælger ── */ (function () { … })();` (lige før `/* Init */`).

Kan skabelonen ikke læses, så brug de **indlejrede kopier** nederst i denne fil (afsnit
"Kanoniske kodestumper") — de er funktionelt identiske.

### 3. For hver portal `.website/<sprog>/index.html`
Spring portalen over hvis den **ikke findes** (bemærk i rapporten — kør `/website-update-index` for at
danne den), eller hvis den **allerede** indeholder `id="langpick"` (vælgeren findes → kun trin 3e).

Ellers injicér de fire dele ved disse ankre (lad alt andet stå urørt):

- **a) CSS** — indsæt CSS-blokken i `<style>` **mellem** `.open-ext:hover{…}`-reglen og
  `.frame-wrap{…}`.
- **b) Markup** — indsæt `<div class="langpick" …> … </div>` i topbaren **mellem**
  `<div class="crumb" id="crumb">…</div>` og `<a class="open-ext" …>`.
- **c) LOCALES** — indsæt `const LOCALES = [ … ];`-blokken **lige efter** `const NAV = [ … ];`
  (før `const navEl`). Findes NAV-arrayet ikke, så **spring portalen over** og bemærk, at den er
  for gammel/afvigende og skal **gendannes fra skabelonen** (`/website-update-index`).
- **d) JS** — indsæt sprogvælger-IIFE'en **lige før** den afsluttende `/* Init */`/`routeFromHash();`
  (fald-tilbage-anker: lige før `</script>`).
- **e) LOCALES-indhold** — skriv hele sitets sprogliste mellem `LOCALES:START/END`,
  **standardsproget først** (`da-DK` hvis den findes, ellers første i alfabetisk orden), derefter de
  øvrige — fx `"da-DK", "en-US",`. **Identisk i alle portaler** (JS'en udleder det *aktuelle* sprog
  fra portalens egen mappe-sti, så listen må **ikke** udelade "current"). Gælder også portaler der
  allerede havde vælgeren — hold listen i sync.

### 3f. Oversæt de synlige strenge til portalens sprog
Vælgerens få brugersynlige strenge skal være på portalens sprog. Sæt dem ud fra denne tabel
(ukendt sprog → engelsk):

| Sprog  | knap `aria-label`/`title` | fald-tilbage-label (`\|\| '…'`) |
|--------|---------------------------|----------------------------------|
| da-DK  | `Skift sprog`             | `Sprog`                          |
| en-US  | `Change language`         | `Language`                       |
| de-DE  | `Sprache wechseln`        | `Sprache`                        |
| sv-SE  | `Byt språk`               | `Språk`                          |
| nb-NO / nn-NO | `Bytt språk`       | `Språk`                          |
| nl-NL  | `Taal wijzigen`           | `Taal`                           |
| fr-FR  | `Changer de langue`       | `Langue`                         |
| es-ES  | `Cambiar idioma`          | `Idioma`                         |

> Selve sprognavnene i menuen kommer fra `Intl.DisplayNames([code])` og vises altid på sprogets
> **eget** sprog ("Dansk", "English") i alle portaler — de skal **ikke** oversættes manuelt.
> Kommentar-overskrifterne (`/* ── Sprogvælger ── */`) er kosmetiske; oversæt dem gerne for pænheds
> skyld, men det er ikke påkrævet.

### 4. Gør rod-redirecten klæbende
Fil: `.website/index.html`. Sørg for at redirect-scriptet **først** læser et gemt manuelt valg, før
det falder tilbage til browsersproget:

- Indeholder scriptet allerede `localStorage.getItem("docs.locale")` → lad det være.
- Ellers erstat **kun** valg-logikken (mellem funktionsstart og `location.replace(...)`) med den
  klæbende variant nedenfor. **Bevar** `// === LOCALES:START … END ===`-blokken (`LOCALES`/`DEFAULT`)
  og no-script-linket i `<body>` uændret.
- Findes `.website/index.html` ikke → opret den **ikke** her; bed brugeren køre `/website-init`.

```js
      function valid(c){ for (var i = 0; i < LOCALES.length; i++) { if (LOCALES[i] === c) return true; } return false; }
      var pick = null;
      // 1) Manuelt gemt valg (sat af portalens sprogvælger) vinder.
      try { var saved = localStorage.getItem("docs.locale"); if (saved && valid(saved)) pick = saved; } catch (e) {}
      // 2) Ellers browserens sprog, med standardsproget som fald-tilbage.
      if (!pick) {
        var want = (navigator.language || navigator.userLanguage || "").toLowerCase();
        pick = DEFAULT;
        for (var i = 0; i < LOCALES.length; i++) {
          var l = LOCALES[i].toLowerCase();
          if (want === l || want.split("-")[0] === l.split("-")[0]) { pick = LOCALES[i]; break; }
        }
      }
      location.replace(pick + "/index.html");
```

### 5. Validér og rapportér
- **Validér** at hver ændret portals samlede `<script>` stadig parser (fx `node --check` på det
  udtrukne script, eller en hurtig brace/paren-kontrol). Vælgeren skjules automatisk via
  `wrap.hidden = false` kun når der er ≥ 2 sprog.
- **Rapportér** pr. portal: *injiceret* / *fandtes allerede* / *sprunget over* (mangler ankre →
  gendan fra skabelon), om rod-redirecten blev gjort klæbende, og hvilken sprogliste der blev skrevet.
- **Anbefal** at køre `/website-update-index` bagefter — nu hvor markørerne findes, holder den fremover
  `NAV`, `LOCALES` og `BRAND` i sync.

## Bemærk
- Kommandoen **rører kun** `.website/<sprog>/index.html` (portaler) og `.website/index.html`
  (rod-redirect). Den ændrer **ikke** indholds-siderne eller skabelonen i submodulet.
- Efter monteringen er portalen funktionelt identisk med skabelon-output, men beholder sin egen
  (evt. oversatte) chrome. Fremtidige `/website-update-index`-kørsler vedligeholder markør-blokkene.

## Kanoniske kodestumper (fald-tilbage hvis skabelonen ikke kan læses)

> Indrykning: CSS/markup med projektets eksisterende stil; JS med 2 mellemrum. Oversæt de
> markerede strenge jf. tabellen i trin 3f (eksemplerne herunder viser da-DK / en-US).

### a) CSS (i `<style>`, mellem `.open-ext:hover{…}` og `.frame-wrap{…}`)

```css

  /* ── Sprogvælger ── */            /* en-US: Language selector */
  .langpick{position:relative}
  .langpick-btn{
    display:inline-flex; align-items:center; gap:6px;
    font-size:12.5px; font-weight:600; color:var(--gray-700);
    background:none; border:1px solid var(--gray-200); border-radius:8px;
    padding:7px 10px; cursor:pointer; font-family:inherit; transition:all .12s;
  }
  .langpick-btn:hover{background:var(--brand-subtle); border-color:var(--brand-light); color:var(--brand-dark)}
  .langpick-btn svg{display:block}
  .langpick-menu{
    display:none; position:absolute; top:calc(100% + 6px); right:0; z-index:20;
    min-width:160px; padding:6px; background:var(--white);
    border:1px solid var(--gray-200); border-radius:10px; box-shadow:0 8px 28px rgba(10,25,40,.16);
  }
  .langpick.open .langpick-menu{display:block}
  .langpick-menu button{
    display:flex; align-items:center; gap:8px; width:100%; text-align:left;
    padding:8px 10px; border:0; border-radius:7px; background:none; cursor:pointer;
    font-family:inherit; font-size:13px; color:var(--gray-700); transition:background .12s,color .12s;
  }
  .langpick-menu button:hover{background:var(--brand-subtle); color:var(--brand-dark)}
  .langpick-menu button.current{background:var(--brand-pale); color:var(--brand-dark); font-weight:600}
```

### b) Markup (i topbaren, mellem `crumb` og `open-ext`)

```html
      <div class="langpick" id="langpick" hidden>
        <button class="langpick-btn" id="langpickBtn" aria-haspopup="true" aria-expanded="false" aria-label="Skift sprog" title="Skift sprog">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          <span id="langpickCur"></span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="langpick-menu" id="langpickMenu" role="menu"></div>
      </div>
```

### c) `const LOCALES`-blok (lige efter `const NAV = [ … ];`)

```js

/* Tilgængelige sprog. Udfyldes af /website-update-index ud fra sprogmapperne i .website/.
   Rediger ikke indholdet mellem LOCALES:START og LOCALES:END manuelt. */
const LOCALES = [
  // === LOCALES:START — auto-genereret af /update-website. Rediger ikke manuelt. ===
  "da-DK", "en-US",
  // === LOCALES:END ===
];
```

### d) Sprogvælger-IIFE (lige før `/* Init */ routeFromHash();`)

```js

/* ── Sprogvælger ── */
(function () {
  var wrap = document.getElementById('langpick');
  if (!wrap || !Array.isArray(LOCALES) || LOCALES.length < 2) return;  // skjul ved 0-1 sprog
  var btn = document.getElementById('langpickBtn');
  var cur = document.getElementById('langpickCur');
  var menu = document.getElementById('langpickMenu');

  // Aktuelt sprog = mappenavnet portalen ligger i (…/<sprog>/index.html)
  var segs = location.pathname.replace(/\/index\.html?$/i, '').split('/').filter(Boolean);
  var current = segs.length ? segs[segs.length - 1] : '';

  function label(code) {
    try {
      var dn = new Intl.DisplayNames([code], { type: 'language' });
      var s = dn.of(code.split('-')[0]);
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : code;
    } catch (e) { return code; }
  }

  cur.textContent = label(current) || current || 'Sprog';
  LOCALES.forEach(function (code) {
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'menuitem');
    b.textContent = label(code);
    if (code === current) b.className = 'current';
    b.addEventListener('click', function () {
      try { localStorage.setItem('docs.locale', code); } catch (e) {}
      location.href = '../' + code + '/index.html';
    });
    menu.appendChild(b);
  });

  function close() { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = wrap.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  menu.addEventListener('click', function (e) { e.stopPropagation(); });

  wrap.hidden = false;
})();
```
