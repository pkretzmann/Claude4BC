---
description: Vælg eller skift visuelt tema (layout/skin) for projektets dokumentationssite — materialiserer et tema fra html-guide/themes/ ind i .website/
argument-hint: "(intet = list temaer) | <tema-navn> | <tema-navn> --preview"
---

# website-theme — Vælg layout/tema for dokumentationssitet

Skift sitets **visuelle tema** uden at røre indholdet. Et tema er et komplet *skin*
(og evt. en struktur-variant) der implementerer **samme class-kontrakt** som
`/website-build` udsender — så de samme sider kan få markant forskellige udseender.
Temaerne ligger som **katalog** i `${CLAUDE_PLUGIN_ROOT}/html-guide/themes/` og
**materialiseres** (kopieres) ind i projektets `.website/`, så hvert projekt er
selvstændigt og portabelt.

## Brug

```
/website-theme                      → list tilgængelige temaer + vis aktivt tema
/website-theme <tema-navn>          → anvend temaet på dette projekts .website/
/website-theme <tema-navn> --preview → byg en engangs-demoside (uden at ændre projektet)
```

Eksempler:
- `/website-theme`
- `/website-theme editorial`
- `/website-theme landing`
- `/website-theme minimal --preview`

## Indbyggede temaer

Listen læses dynamisk fra `theme.json` i hver `${CLAUDE_PLUGIN_ROOT}/html-guide/themes/<navn>/`.
De medfølgende temaer er:

| Navn | Type | Look |
|---|---|---|
| `classic` | sidebar | Blå gradient-header, hvide afrundede kort. Baseline. |
| `minimal` | sidebar | Monokrom, tæt, hårfine streger, flad lille header (docs-stil). |
| `editorial` | sidebar | Serif display-overskrifter, papir-baggrund, smal læsespalte (magasin). |
| `bold` | sidebar | Gradient-hero, runde knapper, store kort m. skygge, høj kontrast. |
| `landing` | top-nav | **Struktur-variant**: hero-forside + vandret top-nav + iframe. |

> **Sidebar vs. struktur.** `sidebar`-temaer genbruger den delte portal
> (`${CLAUDE_PLUGIN_ROOT}/html-guide/portal.html`), som blot re-farves med projektets
> brandfarver. Et `top-nav`/struktur-tema leverer sin **egen** `portal.html` og ændrer
> dermed portalens opbygning, ikke kun farverne.

## Fremgangsmåde (for Claude)

### A. Ingen argumenter — list temaer
1. Læs hver `${CLAUDE_PLUGIN_ROOT}/html-guide/themes/*/theme.json` og vis en tabel:
   `label` · `structure` · `preview`/`description`.
2. **Vis det aktive tema:** læs `Theme:`-linjen i `<projektrod>/.website/styles.css`
   (i header-kommentaren). Findes `.website/styles.css` ikke, så nævn at projektet endnu
   ikke er brandet/tematiseret — foreslå `/website-init` + `/website-create-css`.
3. Slut med et forslag: `/website-theme <navn>` for at skifte, evt. `--preview` først.

### B. `<tema-navn>` — anvend tema
1. **Valider temaet.** Findes `${CLAUDE_PLUGIN_ROOT}/html-guide/themes/<navn>/styles.css`
   ikke, så list de gyldige navne og stop.
2. **Find `.website/`.** Brug `<projektrod>/.website` (mappen der indeholder `.claude/`),
   eller en `.website`-sti i `$ARGUMENTS` hvis angivet. Findes `.website/` ikke, så bed
   brugeren køre `/website-init` først, og stop.
3. **Bevar projektets identitet (vigtigt).** Inden du overskriver, så læs fra den
   **eksisterende** `.website/styles.css` (hvis den findes):
   - de seks brandfarver i `:root`-BRAND-blokken (`--brand-dark`, `--brand-mid`,
     `--brand-light`, `--brand-pale`, `--brand-subtle`, `--accent`), og
   - `Company:`-værdien i header-kommentaren.
4. **Skriv det nye stylesheet.** Kopiér `${CLAUDE_PLUGIN_ROOT}/html-guide/themes/<navn>/styles.css`
   til `.website/styles.css` (ordret), og **derefter**:
   - Sæt `Theme: <navn>` og `Company:`-værdien i header-kommentaren (genbrug den bevarede
     `Company:`, ellers behold temaets `<projekt>`-pladsholder).
   - **Brandfarver:** fandtes der brandfarver i trin 3, så skriv dem ind i den nye fils
     `:root`-BRAND-blok (så projektets brand bevares på tværs af tema-skift). Fandtes der
     **ingen** (helt nyt/ubrandet projekt), så behold temaets `brandDefaults` fra `theme.json`
     og **bemærk**, at brandfarverne kan sættes med `/website-create-css`.
   - Rør **ikke** temaets øvrige tokens/komponent-CSS (de definerer netop temaets look).
5. **Portal-skabelon (struktur).**
   - Findes `${CLAUDE_PLUGIN_ROOT}/html-guide/themes/<navn>/portal.html` (struktur-tema),
     så kopiér den til `<.website>/.portal-template.html` (projekt-ejet portal-kilde).
   - Findes den **ikke** (sidebar-tema), så **slet** et evt. eksisterende
     `<.website>/.portal-template.html`, så `/website-update-index` falder tilbage til den
     delte `${CLAUDE_PLUGIN_ROOT}/html-guide/portal.html`.
6. **Bed om regenerering.** Fortæl brugeren at køre:
   - `/website-update-index` — genopbygger portalerne (henter den nye struktur/farver), og
   - `/website-build …` — regenererer siderne med det nye stylesheet inlinet.
   > Begge er nødvendige: temaets stylesheet inlines i hver side af `/website-build`, og
   > portalens look/struktur opdateres af `/website-update-index`.
7. **Rapportér** kort: gammelt → nyt tema, om brandfarver blev bevaret eller sat fra
   `brandDefaults`, og om en struktur-portal blev lagt ind (eller projekt-templaten fjernet).

### C. `<tema-navn> --preview` — se temaet uden at ændre projektet
1. Valider temaet som i trin B.1.
2. Byg **én** selvstændig demoside ud fra `${CLAUDE_PLUGIN_ROOT}/html-guide/themes/_sample/`
   efter de **samme** regler som `/website-build` i enkeltfil-tilstand:
   - Indlejr `${CLAUDE_PLUGIN_ROOT}/html-guide/themes/<navn>/styles.css` **ordret** i `<style>`.
   - Indlejr `${CLAUDE_PLUGIN_ROOT}/html-guide/script.js` **ordret** i `<script>` før `</body>`.
   - Brug dokument-skelettet fra `/website-build` (header/badge/pills, `.container`,
     `nav.toc`, `.section`-kort, `footer`). Sæt gerne `class="fx"` på `<body>`.
   - Udelad `<link rel="icon">` (preview er en løsrevet fil).
3. Skriv demosiden til en **throwaway**-sti, fx `<projektrod>/.theme-preview/<navn>.html`
   (opret mappen hvis nødvendig; den er ikke en del af `.website/`). Rapportér stien, så
   brugeren kan åbne den i en browser. Ændr **intet** i `.website/`.

## Bemærk

- Kommandoen ændrer kun **udseende/struktur**, ikke indhold. Sidernes tekst og
  class-navne er uændrede — derfor virker tema-skift uden at omskrive siderne.
- **Brandfarver bevares som standard** ved tema-skift (trin 3–4). Vil du i stedet udlede
  en ny palette fra en hjemmeside, så kør `/website-create-css <url> [type]` bagefter.
- Det **aktive tema** registreres i `Theme:`-linjen i `.website/styles.css` — rediger den
  ikke i hånden; skift tema med denne kommando.
- Nye temaer tilføjes ved at lægge en mappe i `${CLAUDE_PLUGIN_ROOT}/html-guide/themes/`
  med `styles.css` + `theme.json` (og `portal.html` hvis strukturen afviger). Se
  `${CLAUDE_PLUGIN_ROOT}/html-guide/themes/README.md` for class-kontrakten.
