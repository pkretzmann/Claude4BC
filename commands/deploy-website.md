---
description: Initialisér en GitHub Actions-workflow der publicerer dokumentationssitet (.website) til GitHub Pages
argument-hint: "(valgfrit) sti til .website — standard er projektets .website-mappe"
---

# deploy-website — Publicér dokumentationssitet på GitHub Pages

Opretter GitHub Actions-workflowfilen `.github/workflows/DeployDocsWebsite.yaml`, der
automatisk bygger og udgiver projektets `.website`-site til **GitHub Pages**, hver gang
der pushes til hovedgrenen. Workflowen er generisk: den fungerer uanset om `.website`
ligger i repo-roden eller under en app-undermappe (fx `EbroFrost Base App/.website`),
også når stien indeholder mellemrum.

Kør denne kommando **én gang** pr. projekt, når dokumentationen skal lægges online.

## Brug

```
/deploy-website                → finder selv projektets .website og opretter workflowen
/deploy-website <sti-til-.website>
```

## Hvad kommandoen opretter

```
.github/
└── workflows/
    └── DeployDocsWebsite.yaml   ← GitHub Actions-workflow der publicerer .website til Pages
```

> Filen er det eneste, kommandoen opretter. Selve `.website`-indholdet dannes af
> `/init-website`, `/html-guide` og `/update-website`. GitHub Pages skal desuden slås til
> i repoets indstillinger (se afsnittet **Efter oprettelse**, som kommandoen printer).

## Fremgangsmåde (for Claude)

### 1. Find repo-roden
- Kør `git rev-parse --show-toplevel` for at få den absolutte sti til git-roden.
  Slår kommandoen fejl (intet git-repo), så bed brugeren initialisere git først og stop.
- Alle stier herunder beregnes **relativt til denne rod** og skrives med skråstreger (`/`).

### 2. Lokalisér `.website`-mappen
- Hvis `$ARGUMENTS` er angivet og peger på en eksisterende `.website`-mappe, brug den.
- Ellers søg efter mapper med navnet `.website` under repo-roden. **Udelad** mapper under
  `.git/`, `node_modules/` og `.claude/` (submodul-skabeloner må aldrig matche).
- Håndtér resultatet:
  - **Ingen `.website` fundet** → fortæl brugeren at køre `/claude4bc:init-website` først, og stop.
  - **Præcis én fundet** → brug den.
  - **Flere fundet** (monorepo med flere apps) → vis listen og **spørg** brugeren, hvilken
    der skal publiceres. (Bemærk: én workflow publicerer ét site — se `## Bemærk`.)
- Beregn `{{WEBSITE_PATH}}` = stien til den valgte mappe **relativ til repo-roden**, med
  skråstreger. Eksempler: `.website` (roden) eller `EbroFrost Base App/.website` (app-undermappe).
  **Ingen** indledende `./`, **ingen** afsluttende `/`.

### 3. Bestem hovedgrenen
- Forsøg `git symbolic-ref --short refs/remotes/origin/HEAD` og tag den sidste sti-del
  (fx `origin/main` → `main`).
- Slår det fejl, forsøg `git remote show origin` og læs linjen `HEAD branch:`.
- Slår begge fejl (intet `origin`-remote endnu), brug aktuel gren via
  `git rev-parse --abbrev-ref HEAD`, ellers fald tilbage på `main`.
- **Bekræft med brugeren**: »Publicér ved push til grenen «<gren>»? (standard: main)«.
  Brug svaret som `{{BRANCH}}`.

### 4. Substituér pladsholdere
- Tag YAML-skabelonen fra `## Skabeloner` verbatim.
- Erstat `{{WEBSITE_PATH}}` (optræder **2 gange**: i `paths:`-globben og i `path:`) og
  `{{BRANCH}}` (optræder **1 gang**).
- **Citering af stier med mellemrum:** `{{WEBSITE_PATH}}` indsættes altid inde i
  enkelt-citationstegn i YAML — både i `paths:`-globben (`'<sti>/**'`) og i
  `upload-pages-artifact`'s `path: '<sti>'`. Det gør stier med mellemrum gyldige.
  Indeholder stien selv et enkelt-citationstegn (sjældent), så fordobl det (`''`) jf. YAML.
- **Rør ikke** `${{ steps.deployment.outputs.page_url }}` — det er et GitHub Actions-udtryk,
  ikke en pladsholder, og skal stå ordret.

### 5. Sørg for at mappen findes, og skriv filen
- Opret `.github/workflows/` hvis den ikke findes (intet andet i mappen røres).
- Filnavnet er **præcis** `DeployDocsWebsite.yaml`.

### 6. Idempotens — overskriv aldrig i blinde
- Findes `.github/workflows/DeployDocsWebsite.yaml` allerede:
  - Generér det nye indhold og **sammenlign** med det eksisterende.
  - Er de identiske → rapportér »ingen ændringer« og stop.
  - Adskiller de sig (fx ændret sti eller gren) → **vis forskellen** (gammel vs. ny
    `path:`/`branches:`) og **spørg** brugeren, om filen skal opdateres. Skriv kun ved ja.

### 7. Rapportér og print opsætningsvejledningen
- Bekræft hvilken fil der blev oprettet/opdateret, samt valgt `{{WEBSITE_PATH}}` og `{{BRANCH}}`.
- Print derefter afsnittet **Efter oprettelse** nedenfor til brugeren.

## Skabeloner

### Fil: `.github/workflows/DeployDocsWebsite.yaml`

```yaml
name: Deploy Documentation Website
on:
  push:
    branches: [ {{BRANCH}} ]
    paths:
      - '{{WEBSITE_PATH}}/**'
      - '.github/workflows/DeployDocsWebsite.yaml'
  workflow_dispatch:
env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true   # dæmper Node20-deprecation-advarsel
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload website as Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '{{WEBSITE_PATH}}'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

> **Eksempel — site i roden:** `{{WEBSITE_PATH}}` = `.website` giver
> `paths: - '.website/**'` og `path: '.website'`.
> Kun `{{WEBSITE_PATH}}` og `{{BRANCH}}` substitueres; `${{ steps.deployment.outputs.page_url }}`
> står ordret.

## Efter oprettelse (printes til brugeren)

For at sitet bliver offentligt, skal GitHub Pages slås til med Actions som kilde:

1. **Slå Pages til som GitHub Actions-deployment:**
   GitHub → repoets **Settings** → **Pages** → under **Build and deployment** sættes
   **Source** til **»GitHub Actions«** (ikke »Deploy from a branch«). De to tilstande
   udelukker hinanden — skiftet er nødvendigt, ellers fejler deploy'et (404).
2. **Commit og push** workflowfilen — og dit `.website`-indhold — til grenen **«{{BRANCH}}»**.
   Workflowen kører automatisk ved push (og kan også startes manuelt under fanen **Actions**
   via **»Run workflow«**, takket være `workflow_dispatch`).
3. **Find dit site.** Efter et grønt kørsel ligger sitet på:
   `https://<owner>.github.io/<repo>/`
   (det præcise URL vises også i kørslens **deploy**-step og under Settings → Pages).

> **Stier er relative:** portalen og siderne i `.website` bruger relative stier, så sitet
> virker korrekt under repo-undermappen `/<repo>/` **uden** at skulle sætte en base-path.

## Bemærk

- Kommandoen er **idempotent**: kør den trygt igen. Findes workflowen allerede med samme
  indhold, sker intet; adskiller den sig, vises forskellen og du spørges før overskrivning.
- **Én workflow = ét site.** Har et monorepo flere apps med hver sin `.website`, publicerer
  denne workflow kun den valgte. GitHub udgiver desuden kun ét Pages-site pr. repo, så vælg
  den `.website`, der skal være projektets offentlige dokumentation.
- Workflowen kræver, at `.github/workflows/DeployDocsWebsite.yaml` selv er **committet** —
  GitHub Actions kører kun workflows, der findes i repoet på den pågældende gren.
- Skifter projektets hovedgren senere, så kør kommandoen igen og bekræft den nye gren.
