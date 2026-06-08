# create-css — Generér brandfarver til html-guide ud fra en hjemmeside

Udled en farvepalette fra en virksomheds hjemmeside (og en valgfri branche-"flavor") og skriv den
ind i `:root`-blokken øverst i projektets `.website/styles.css`. Bruges til at brande
`/html-guide`-output til et nyt projekt med én kommando.

## Brug

```
/create-css <website-url> [type]
```

- `<website-url>` — virksomhedens hjemmeside, fx `https://www.eksempel.dk`.
- `[type]` (valgfri) — branche/flavor, der giver paletten karakter og fungerer som fallback, hvis
  farverne fra siden er svage. Frit tekstfelt; indbyggede presets:
  - **Production** — industriel stål-blå, køligt gråt, høj kontrast.
  - **Consulting** — afdæmpet corporate navy, diskret accent.
  - **Wine Retail** — bordeaux/burgundy som primær, varm guld-accent.
  - (andet/ukendt) — neutral, afbalanceret palette ud fra de fundne farver.

Eksempler:
- `/create-css https://www.eksempel.dk`
- `/create-css https://www.vingaarden.dk "Wine Retail"`
- `/create-css https://www.fabrik.dk Production`

## Hvad kommandoen gør

1. **Hent siden.** Brug `WebFetch` på `<website-url>` og udtræk virksomhedens primære brandfarver.
   Kig især efter:
   - `<meta name="theme-color">`
   - CSS `:root`-custom-properties / SCSS-variabler (fx `--primary`, `--brand`, `--accent`)
   - baggrundsfarve på header/nav og på den primære knap (call-to-action)
   - link-farve og logo-farver
   Returnér konkrete **hex-værdier** for: primær, sekundær og accent. Hvis siden ikke kan hentes,
   så sig det og fortsæt ud fra `type`-preset alene. Er der **hverken** brugbare farver fra siden
   **eller** en `type`, så fald tilbage på en neutral, professionel blå standardpalette og gør
   brugeren opmærksom på, at farverne er gættet og bør justeres i `:root`.

2. **Afled paletten.** Udled de fem brand-variabler som en sammenhængende ramp fra den primære
   farve, plus en accent:
   | Variabel | Rolle | Udledning |
   |---|---|---|
   | `--brand-dark` | headers, primær | primærfarven (mørkeste, god kontrast mod hvid tekst) |
   | `--brand-mid` | links, tabelhoveder | primær, ~15–25 % lysere |
   | `--brand-light` | accenter, pile, badges | accent-/sekundærfarven |
   | `--brand-pale` | hover, decision-bokse | meget lys tone af primær (~90 % lyshed) |
   | `--brand-subtle` | step-baggrunde | næsten hvid tone af primær (~96 % lyshed) |
   | `--accent` | generel accent | samme som `--brand-light` eller en komplementær accent |
   Lad `type`-preset påvirke temperatur/accent og udfylde huller. Sikr **WCAG-læsbarhed**:
   hvid tekst skal have tilstrækkelig kontrast mod `--brand-dark` og `--brand-mid`.

3. **Vis og bekræft.** Præsentér den foreslåede palette for brugeren som en liste med hex-værdier
   (og gerne en kort begrundelse pr. farve). **Skriv først, når brugeren har bekræftet** — eller
   juster efter brugerens feedback.

4. **Skriv til stylesheetet.** Opdatér **kun** `:root`-BRAND-blokken (variablerne `--brand-dark`,
   `--brand-mid`, `--brand-light`, `--brand-pale`, `--brand-subtle`, `--accent`) og linjen
   `Company:` i toppen af `.website/styles.css`. Rør **ikke** ved de neutrale tokens
   eller komponent-CSS længere nede.
   - Findes `.website/styles.css` **ikke**, så **kopiér først** det fulde kanoniske stylesheet
     `.claude/claude4bc/html-guide/styles-default.css` til `.website/styles.css`, og sæt derefter
     brandfarverne i `:root`. Så får projektet et komplet stylesheet (komponenter + neutrale tokens)
     med sine egne brandfarver.
   - Findes `.website/`-mappen ikke, så bed brugeren køre `/init-website` først.

5. **Afslut** med en kort opsummering og forslag om at køre `/html-guide` for at se resultatet.

## Noter

- Farveudtræk er best-effort. Hjemmesider eksponerer ikke altid rene brandfarver — `:root`-blokken
  er derfor altid håndredigerbar bagefter.
- Kommandoen ændrer kun farver. Layout og komponenter er låst i resten af `.website/styles.css` og
  påvirkes ikke.
- Sproget i selve vejledningerne styres af `/html-guide`, ikke her.
