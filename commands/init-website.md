---
description: Stilladsér dokumentationssitet (.website) med kildemateriale-mappe, README'er og start-script
argument-hint: "(valgfrit) sti til projektroden — standard er det aktuelle projekt"
---

# init-website — Opret dokumentationssitets mappestruktur

Opretter den faste mappe- og filstruktur, som projektets dokumentationssite bygger på.
Sitet består af færdige HTML-sider (genereret med `/html-guide`) samlet i en portal,
plus en `.sourcematerial.md`-mappe med det kildemateriale, siderne dannes ud fra.

Kør denne kommando **én gang** når et nyt projekt skal have dokumentation.

## Brug

```
/init-website                → opretter strukturen i projektroden
/init-website <projektrod>   → opretter strukturen under den angivne sti
```

## Hvad kommandoen opretter

```
.website/
├── .sourcematerial.md/
│   └── Readme.md                 ← forklarer kildemateriale-mappen
├── favicon.svg                   ← sitets ikon (kopieret fra claude4bc-submodulet)
├── README.md                     ← forklarer hvordan sitet åbnes/vedligeholdes
└── Start dokumentation.cmd       ← starter lokal server + åbner portalen

.claude/launch.json               ← (i git-roden) lokal preview-server til Claude Code
```

> `index.html` (selve portalen) oprettes **ikke** her — den dannes af `/update-website`,
> når du har genereret dine første sider med `/html-guide`. Indtil da viser den lokale
> server blot en mappeliste, hvilket er fint som udgangspunkt.

## Fremgangsmåde (for Claude)

1. **Bestem projektroden.** Hvis `$ARGUMENTS` er angivet, brug den sti. Ellers brug
   projektets rod (mappen der indeholder `.claude/`).
2. **Opret mapperne** `.website/` og `.website/.sourcematerial.md/` hvis de ikke findes.
3. **Opret hver fil nedenfor**, men kun hvis den **ikke allerede findes** — eksisterende
   filer må **aldrig overskrives** (de kan være tilpasset). Brug skabelonerne herunder verbatim.
4. **Kopiér `favicon.svg`** fra `${CLAUDE_PLUGIN_ROOT}/favicon.svg` til `.website/favicon.svg`,
   men kun hvis `.website/favicon.svg` **ikke allerede findes** — en eksisterende fil må
   **aldrig overskrives** (den kan være tilpasset til projektets brand).
5. **Opret/flet `.claude/launch.json`** (lokal preview-server til Claude Code):
   - Find git-roden med `git rev-parse --show-toplevel`. Slår det fejl (intet git-repo),
     så spring dette trin over.
   - Beregn `.website`-stien **relativ til git-roden**, med skråstreger
     (fx `.website` eller `EbroFrost Base App/.website`).
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

## Skabeloner

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

Brugervejledninger og tekniske noter, samlet i en lille portal (`index.html`)
med sidebjælke, søgning og et indholdsvindue.

## Sådan åbner du dokumentationen

### Anbefalet: dobbeltklik `Start dokumentation.cmd`
Filen starter en lille lokal webserver og åbner portalen i din browser automatisk.
Luk det sorte vindue igen for at stoppe serveren.

> **Hvorfor en server?** Hvis du bare dobbeltklikker `index.html` (åbner som `file://`),
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
1. Læg kildematerialet i `.sourcematerial.md/<emne>/` og kør `/html-guide` på det.
2. Læg den genererede HTML-fil i den relevante undermappe under `.website/`.
3. Kør `/update-website` — den scanner mapperne og opdaterer portalens menu automatisk.

Du behøver ikke redigere `index.html` i hånden; `/update-website` bygger menuen ud fra
de filer der ligger i `.website/`.
````

### Fil: `.website/.sourcematerial.md/Readme.md`

````markdown
# Kildemateriale til HTML

Denne mappe indeholder **kildematerialet** til dokumentationen — altså de rå noter,
brugervejledninger, PDF'er, tekstfiler og skærmbilleder, som de færdige HTML-sider
bygges ud fra.

## Hvad bruges materialet til?

Indholdet her er **input** til `/html-guide`-kommandoen. Når kommandoen køres på et
emne, læser den kildematerialet i den relevante undermappe og danner en poleret,
selvstændig HTML-side ud fra det. De genererede HTML-sider lægges i `.website/` (og
indgår i dokumentationsportalen `index.html`).

```
.sourcematerial.md/<emne>/   →   /html-guide   →   .website/<emne>/<side>.html
   (kildemateriale)                                  (færdig HTML-side)
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
   den relevante undermappe under `.website/`.
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
hedder `docs`); den serverer dokumentationen på <http://localhost:8765/>.

## Bemærk

- Kommandoen er **idempotent**: kør den trygt igen — eksisterende filer røres ikke.
- `script.js`, `styles-default.css`, `favicon.svg` og selve `/html-guide` ligger i claude4bc-submodulet.
  Projektets brandede `.website/styles.css` oprettes med `/create-css`. Kun `favicon.svg`
  kopieres herfra til `.website/`; resten oprettes ikke her.
- `launch.json` ligger i **git-roden** (`.claude/launch.json`), ikke i submodulet — Claude
  Codes preview-værktøj læser kun den placering. Den supplerer `Start dokumentation.cmd`
  (dobbeltklik-launcheren): begge starter den samme lokale server på port 8765.
