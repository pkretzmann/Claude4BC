---
description: Initialiserer dokumentationssitet (.website) med sprogmapper (da-DK, en-US), rod-redirect, kildemateriale-mapper, README og start-script
argument-hint: "(valgfrit) sti til projektroden — standard er det aktuelle projekt"
---

# init-website — Opret dokumentationssitets mappestruktur

Opretter den faste mappe- og filstruktur, som projektets dokumentationssite bygger på.
Sitet er **flersproget**: roden af `.website/` indeholder kun en lille `index.html`, der
**sender videre** (redirect) til standardsprogets portal, og selve indholdet ligger i én
mappe pr. sprog (`da-DK`, `en-US`, …). Hver sprogmappe har sin egen portal (`index.html`,
dannet med `/update-website`), sine færdige HTML-sider og sin egen `.sourcematerial.md`-mappe
med det kildemateriale, siderne dannes ud fra.

Kør denne kommando **én gang** når et nyt projekt skal have dokumentation.

## Brug

```
/init-website                → opretter strukturen i projektroden
/init-website <projektrod>   → opretter strukturen under den angivne sti
```

## Hvad kommandoen opretter

```
.website/
├── index.html                   ← redirect-side: sender videre til standardsprogets portal
├── favicon.svg                  ← sitets ikon (delt på tværs af alle sprog)
├── README.md                    ← forklarer hvordan sitet åbnes/vedligeholdes
├── Start dokumentation.cmd      ← starter lokal server + åbner portalen
├── da-DK/                       ← standardsprog (redirect peger hertil)
│   └── .sourcematerial.md/
│       └── Readme.md            ← forklarer kildemateriale-mappen for da-DK
└── en-US/                       ← ekstra sprog
    └── .sourcematerial.md/
        └── Readme.md            ← forklarer kildemateriale-mappen for en-US

.claude/launch.json              ← (i git-roden) lokal preview-server til Claude Code
```

> **Standardsproget** er `da-DK`. Rod-`index.html` redirecter dertil (og forsøger først at
> matche browserens sprog mod de tilgængelige sprogmapper).
>
> Den enkelte sprogmappes portal (`da-DK/index.html`, `en-US/index.html`) oprettes **ikke**
> her — den dannes af `/update-website`, når du har genereret dine første sider med
> `/html-guide`. Indtil da viser den lokale server blot en mappeliste, hvilket er fint som
> udgangspunkt.

## Fremgangsmåde (for Claude)

> **Sprog.** Standardsproget er `da-DK`. Sprogene der stilladseres er `da-DK` og `en-US`.
> Beder brugeren udtrykkeligt om andre/flere sprog, så brug dem i stedet — det første sprog
> er standardsproget (redirect-målet).

1. **Bestem projektroden.** Hvis `$ARGUMENTS` er angivet, brug den sti. Ellers brug
   projektets rod (mappen der indeholder `.claude/`).
2. **Opret mapperne:**
   - `.website/`
   - pr. sprog: `.website/<sprog>/` og `.website/<sprog>/.sourcematerial.md/`
     (fx `.website/da-DK/.sourcematerial.md/` og `.website/en-US/.sourcematerial.md/`),
   - alle kun hvis de ikke allerede findes.
3. **Opret hver fil nedenfor**, men kun hvis den **ikke allerede findes** — eksisterende
   filer må **aldrig overskrives** (de kan være tilpasset). Brug skabelonerne herunder verbatim.
   - I roden: `README.md`, `Start dokumentation.cmd` og **rod-`index.html`** (redirect-siden —
     indsæt sprogene fra trin 0 i `LOCALES` og standardsproget i `DEFAULT` samt i `meta refresh`/no-script-linket).
   - Pr. sprog: `.website/<sprog>/.sourcematerial.md/Readme.md`.
4. **Kopiér `favicon.svg`** fra `${CLAUDE_PLUGIN_ROOT}/favicon.svg` til `.website/favicon.svg`
   (delt på tværs af sprog), men kun hvis `.website/favicon.svg` **ikke allerede findes** — en
   eksisterende fil må **aldrig overskrives** (den kan være tilpasset til projektets brand).
5. **Opret/flet `.claude/launch.json`** (lokal preview-server til Claude Code):
   - Find git-roden med `git rev-parse --show-toplevel`. Slår det fejl (intet git-repo),
     så spring dette trin over.
   - Beregn `.website`-stien **relativ til git-roden**, med skråstreger
     (fx `.website` eller `EbroFrost Base App/.website`). Serveren peger på `.website`-**roden**,
     så `http://localhost:8765/` rammer redirect-siden, der sender videre til standardsproget.
   - Målfilen er **`<git-rod>/.claude/launch.json`** — Claude Codes preview-værktøj læser
     **kun** `launch.json` i git-roden, så den kan ikke ligge i submodulet eller under `.website/`.
   - **Findes filen ikke** → opret den fra skabelonen herunder med `.website`-stien indsat i
     `--directory`.
   - **Findes filen** → læs den som JSON. Har `configurations` allerede en post, hvis
     `runtimeArgs` peger på samme `.website` (`--directory`-værdien), så lad den være
     (idempotent). Ellers **tilføj** en ny post — vælg et ledigt `name` (`docs`, ellers
     `docs-2`, …) og en ledig `port` (8765, ellers næste ledige) — og bevar alle
     eksisterende poster og felter uændret.
6. **Rapportér** kort hvad der blev oprettet/flettet, og hvad der blev sprunget over fordi det fandtes.

> **Migrering af et ældre site (uden sprogmapper).** Ligger der allerede en *portal* i
> `.website/index.html` (ældre struktur, hvor siderne lå direkte under `.website/`), så
> overskriver kommandoen den **ikke**. Fortæl i stedet brugeren, at det gamle indhold skal
> flyttes ind i standardsprogets mappe (`.website/da-DK/`), og at rod-`index.html` skal
> erstattes med redirect-skabelonen herunder (eller slettes, så `/init-website` kan danne den).
> Kør derefter `/update-website` for at genopbygge portalen pr. sprog.

## Skabeloner

### Fil: `.website/index.html` (rod-redirect)

> Sender videre til standardsprogets portal. `LOCALES`/`DEFAULT` (mellem markørerne) og
> `meta refresh`/no-script-linket indsættes ud fra de stilladserede sprog — standardsproget
> (`da-DK`) er fald-tilbage, mens browserens sprog forsøges matchet først. `/update-website`
> holder `LOCALES`/`DEFAULT` i sync, når der senere tilføjes eller fjernes sprogmapper.

```html
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="favicon.svg" />
  <title>Dokumentation</title>
  <meta http-equiv="refresh" content="0; url=da-DK/index.html" />
  <script>
    // Vælg sprogmappe ud fra browserens sprog; ellers standardsproget.
    (function () {
      // === LOCALES:START — auto-genereret af /update-website. Rediger ikke manuelt. ===
      var LOCALES = ["da-DK", "en-US"];
      var DEFAULT = "da-DK";
      // === LOCALES:END ===
      var want = (navigator.language || navigator.userLanguage || "").toLowerCase();
      var pick = DEFAULT;
      for (var i = 0; i < LOCALES.length; i++) {
        var l = LOCALES[i].toLowerCase();
        if (want === l || want.split("-")[0] === l.split("-")[0]) { pick = LOCALES[i]; break; }
      }
      location.replace(pick + "/index.html");
    })();
  </script>
</head>
<body>
  <p>Omdirigerer til dokumentationen … hvis intet sker, <a href="da-DK/index.html">klik her</a>.</p>
</body>
</html>
```

### Fil: `.website/Start dokumentation.cmd`

```cmd
@echo off
setlocal
rem ── Starter dokumentations-sitet lokalt og aabner det i browseren ──
rem Dobbeltklik denne fil. Luk vinduet for at stoppe serveren igen.
cd /d "%~dp0"
set "PORT=8765"
set "URL=http://localhost:%PORT%/"

rem ── Find Python (py-launcher foretraekkes, ellers python) ──
set "PY="
where py >nul 2>nul && set "PY=py"
if not defined PY (where python >nul 2>nul && set "PY=python")
if not defined PY (
  echo.
  echo  Python blev ikke fundet paa denne maskine.
  echo  Installer Python fra https://www.python.org/downloads/
  echo  ^(husk flueben i "Add Python to PATH" under installationen^)
  echo.
  pause
  exit /b 1
)

echo.
echo  Starter dokumentationen paa %URL% ...
echo  Luk dette vindue for at stoppe serveren.
echo.

rem ── Aabn browseren automatisk, lige efter serveren er klar ──
start "" /min cmd /c "timeout /t 1 >nul & start "" %URL%"

rem ── Start den lokale webserver (blokerer indtil vinduet lukkes) ──
%PY% -m http.server %PORT%

endlocal
```

### Fil: `.website/README.md`

````markdown
# Dokumentation

Brugervejledninger og tekniske noter, samlet i en lille portal med sidebjælke, søgning og et
indholdsvindue. Sitet er **flersproget**: roden indeholder kun en `index.html`, der sender
dig videre til dit sprog, og hvert sprog har sin egen portal i en undermappe:

```
.website/
├── index.html        ← sender videre til dit sprog (standard: da-DK)
├── da-DK/            ← dansk portal + sider
│   └── index.html
└── en-US/            ← engelsk portal + sider
    └── index.html
```

## Sådan åbner du dokumentationen

### Anbefalet: dobbeltklik `Start dokumentation.cmd`
Filen starter en lille lokal webserver og åbner portalen i din browser automatisk.
Du lander på rod-`index.html`, der straks sender dig videre til dit sprog. Luk det sorte
vindue igen for at stoppe serveren.

> **Hvorfor en server?** Hvis du bare dobbeltklikker en `index.html` (åbner som `file://`),
> kan **søgningen kun lede i sidernes titler**. Browsere blokerer nemlig af sikkerhedshensyn,
> at en `file://`-side henter indholdet af nabosider. Når dokumentationen i stedet serveres
> over `http://localhost`, kan portalen læse alle siders indhold og søge i **hele teksten**.

### Manuelt (hvis du hellere vil skrive kommandoen selv)
Åbn en terminal (PowerShell) i denne mappe og kør:

```powershell
py -m http.server 8765
```

Virker `py` ikke, så prøv:

```powershell
python -m http.server 8765
```

Åbn derefter **http://localhost:8765/** i din browser. Stop serveren igen med `Ctrl + C`
i terminalen.

> Mangler du Python? Hent det på <https://www.python.org/downloads/> og husk at sætte
> flueben i *"Add Python to PATH"* under installationen.

## Hosting på GitHub Pages
Lægges mappen på GitHub Pages (eller en anden http(s)-webserver), virker fuldtekst-søgningen
helt af sig selv — uden den lokale server. Det er den samme mekanik: indholdet ligger på
samme origin og kan derfor læses af portalen.

## Tilføj en ny side
1. Læg kildematerialet i dit sprogs mappe, `<sprog>/.sourcematerial.md/<emne>/`
   (fx `da-DK/.sourcematerial.md/<emne>/`), og kør `/html-guide` på det.
2. Læg den genererede HTML-fil i den relevante undermappe under **samme** sprogmappe
   (fx `da-DK/<emne>/`).
3. Kør `/update-website` — den scanner hver sprogmappe og opdaterer den pågældende portals
   menu automatisk (og holder rod-redirectens sprogliste opdateret).

Du behøver ikke redigere nogen `index.html` i hånden; `/update-website` bygger menuen ud fra
de filer der ligger i hver sprogmappe.

## Tilføj et nyt sprog
1. Opret en ny sprogmappe, fx `.website/de-DE/`, med en `.sourcematerial.md/`-undermappe.
2. Læg sider i den som beskrevet ovenfor og kør `/update-website` — den danner sprogets portal
   og tilføjer sproget til rod-redirecten.
````

### Fil: `.website/<sprog>/.sourcematerial.md/Readme.md`

> Opret denne fil i **hver** sprogmappe (fx `da-DK/.sourcematerial.md/Readme.md` og
> `en-US/.sourcematerial.md/Readme.md`). Stierne i teksten er relative til sprogmappen, så
> kildemateriale og færdige sider altid bor i samme sprog.

````markdown
# Kildemateriale til HTML

Denne mappe indeholder **kildematerialet** til dokumentationen i **dette sprog** — altså de rå
noter, brugervejledninger, PDF'er, tekstfiler og skærmbilleder, som de færdige HTML-sider
bygges ud fra. Hver sprogmappe (`da-DK/`, `en-US/`, …) har sin egen `.sourcematerial.md/`.

## Hvad bruges materialet til?

Indholdet her er **input** til `/html-guide`-kommandoen. Når kommandoen køres på et
emne, læser den kildematerialet i den relevante undermappe og danner en poleret,
selvstændig HTML-side ud fra det. De genererede HTML-sider lægges i **samme sprogmappe**
(og indgår i sprogets dokumentationsportal `index.html`).

```
<sprog>/.sourcematerial.md/<emne>/   →   /html-guide   →   <sprog>/<emne>/<side>.html
   (kildemateriale)                                          (færdig HTML-side)
```

Stylingen kommer fra projektets `.website/styles.css` (med fald-tilbage til den delte
`styles-default.css`), og den interaktive adfærd (indholdsfortegnelse, søgning,
kopiér-knapper, læse-fremgangslinje osv.) fra `script.js` i claude4bc-submodulet —
`/html-guide` inliner dem i hver side. Selve kildematerialet skal derfor **kun**
indeholde indhold — ikke styling.

## Organisering

Opret en undermappe pr. emne, fx:

| Mappe | Emne |
|-------|------|
| `<emne-1>/` | (kort beskrivelse) |
| `<emne-2>/` | (kort beskrivelse) |

Hver emnemappe kan indeholde flere filtyper:

- **`.md`** — den primære kilde (skrevne noter / brugervejledning i markdown)
- **`.pdf` / `.txt`** — originale vejledninger eller eksporter til reference
- **`.png`** — skærmbilleder af opsætning og felter

## Sådan tilføjer eller opdaterer du en side

1. Læg eller opdater kildematerialet i den relevante undermappe her.
2. Kør `/html-guide` på emnet for at danne (eller gendanne) HTML-siden, og læg den i
   den relevante undermappe under **samme** sprogmappe.
3. Kør `/update-website` for at opdatere portalens menu (se `.website/README.md`).
````

### Fil: `.claude/launch.json` (i git-roden)

> Indsæt `.website`-stien (relativ til git-roden) i `--directory`. Findes filen allerede,
> **flettes** posten ind som beskrevet i fremgangsmåden — hele filen overskrives **ikke**.

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "docs",
      "runtimeExecutable": "python",
      "runtimeArgs": ["-m", "http.server", "8765", "--directory", "<WEBSITE_REL>"],
      "port": 8765
    }
  ]
}
```

`<WEBSITE_REL>` = `.website`-stien relativ til git-roden (fx `.website` eller
`EbroFrost Base App/.website`). Start serveren i Claude Code via preview (konfigurationen
hedder `docs`); den serverer `.website`-roden på <http://localhost:8765/>, hvor redirect-siden
sender videre til standardsproget.

## Bemærk

- Kommandoen er **idempotent**: kør den trygt igen — eksisterende filer røres ikke.
- **Standardsproget er `da-DK`**, og rod-`index.html` er kun en redirect — alt indhold ligger
  i sprogmapperne (`da-DK/`, `en-US/`, …). Hver sprogmappes portal dannes af `/update-website`.
- `favicon.svg` ligger i **roden af `.website/`** og deles af alle sprog. Sider i en sprogmappe
  peger relativt tilbage til roden (fx `../favicon.svg` for en portal, `../../favicon.svg` for en
  side i `<sprog>/<emne>/`).
- `script.js`, `styles-default.css`, `favicon.svg` og selve `/html-guide` ligger i claude4bc-submodulet.
  Projektets brandede `.website/styles.css` oprettes med `/create-css`. Kun `favicon.svg`
  kopieres herfra til `.website/`; resten oprettes ikke her.
- `launch.json` ligger i **git-roden** (`.claude/launch.json`), ikke i submodulet — Claude
  Codes preview-værktøj læser kun den placering. Den supplerer `Start dokumentation.cmd`
  (dobbeltklik-launcheren): begge starter den samme lokale server på port 8765 på `.website`-roden.
