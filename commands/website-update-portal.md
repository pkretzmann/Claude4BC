---
description: Opdatér dokumentationsportalen ud fra projektets commits siden sidste kørsel — omskriv berørte kilder, genbyg HTML og synkronisér menuen
argument-hint: "(valgfrit) sti til .website — standard: <projektrod>/.website"
---

# website-update-portal — Hold portalen ajour med kodens commits

Holder en **dokumentationsportal** (`.website/`) ajour med projektets kildekode. Kommandoen
gennemgår projektets **commits siden sidste portal-opdatering**, finder ud af hvilke
dokumentationssider der er berørt af ændringerne, **omskriver kildematerialet** (`.md`) for de
berørte sider, genbygger deres HTML og synkroniserer portalens menu. En statefil husker, hvor
langt portalen er nået.

Forskellen på de tre website-kommandoer:

- `/website-build` — konverterer markdown → HTML (enkeltfil til kunder, eller multi-side).
- `/website-update-index` — synkroniserer portalens **menu** med de HTML-sider der findes.
- `/website-update-portal` (denne) — den **inkrementelle vedligeholder**: kode-commits →
  opdateret **indhold** → genbygget HTML → opdateret menu, i én arbejdsgang.

Kommandoen er beregnet til projekter, hvor koden ofte ændres **uden** at `.md`-kilderne følger
med — den udleder selv, hvilke sider der er blevet forældede.

## Brug

```
/website-update-portal                      → opdatér portalen i <projektrod>/.website
/website-update-portal <sti-til-.website>   → som ovenfor, men for den angivne .website-mappe
```

## Statefil

Portalens opdaterings-tilstand ligger i **`.website/.portal-state.json`** (committes sammen med
portalen, så den følger projektet):

```json
{
  "lastUpdatedCommit": "<fuld SHA i projekt-repoet>",
  "lastUpdatedDate": "<ISO 8601-dato>"
}
```

- **Findes statefilen ikke (første kørsel):** brug som baseline den **seneste commit der rørte
  `.website/`** — `git log -1 --format=%H -- <.website-sti>` i projekt-repoet. Antagelsen er, at
  dokumentationen var ajour, da portalen sidst blev committet; alt der er sket i koden **efter**
  den commit er kandidater til opdatering. Fortæl brugeren, hvilken baseline der blev valgt.
- **Har `.website/` ingen git-historik** (portalen er ny/ikke committet), så stop og bed brugeren
  bygge portalen først (`/website-build` + `/website-update-index`) og committe den.
- Statefilen starter med `.`, så `/website-update-index` ignorerer den automatisk.

## Fremgangsmåde (for Claude)

### 1. Find portalen og baseline
- **`.website`-mappen:** `$ARGUMENTS` hvis angivet, ellers `<projektrod>/.website`. Findes den
  ikke, så bed brugeren køre `/website-init` først, og stop.
- **Baseline-SHA:** læs `lastUpdatedCommit` fra `.website/.portal-state.json` — eller udled den
  som beskrevet under *Statefil*.
- **Ingen nye commits?** Er baseline lig `HEAD`, så rapportér **»Portalen er ajour«** og stop
  (skriv ikke statefilen om). Kommandoen er idempotent — en genkørsel uden nye commits ændrer intet.

### 2. Find ændringerne siden baseline
Kør i projekt-repoet:

```
git log --oneline <baseline>..HEAD
git diff --name-status <baseline>..HEAD
```

Klassificér de ændrede filer:

- **(a) Kildemateriale:** ændrede/nye `.md` under `.website/<sprog>/.sourcematerial.md/` —
  skal **kun genbygges** (indholdet er allerede opdateret af brugeren).
- **(b) Projektets kildekode:** ændrede kildefiler uden for `.website/` (i AL-projekter typisk
  `src/**/*.al` — men vær projekt-agnostisk: al kode-/konfigurationsændring tæller). Disse
  driver **indholds-opdateringer** (trin 3).
- **(c) Slettet:** slettede `.md`-kilder → deres HTML-sider skal fjernes fra portalen.
- Ændringer i selve portalens genererede filer (HTML, `index.html`, statefilen) ignoreres —
  de er artefakter, ikke kilder.

### 3. Kortlæg kode → sider
For klasse **(b)** udledes, hvilke dokumentationssider der dækker den ændrede funktionalitet:

- **Læs commit-beskederne** og de ændrede filer/objekter — forstå *hvad* der er ændret
  funktionelt (nye felter, ændret adfærd, nye rapporter/sider, fjernet funktionalitet).
  Rene refaktoreringer/tekniske oprydninger uden brugervendt effekt giver **ingen** dok-ændring.
- **Læs `.md`-kilderne** i hver sprogmappes `.sourcematerial.md/` og afgør semantisk, hvilke
  sider der beskriver den berørte funktionalitet. Én kodeændring kan berøre flere sider — og
  flere sprog.
- **Ny funktionalitet uden dækkende side:** foreslå en **ny** side i den gruppemappe, hvor den
  hører hjemme (samme navngivnings-/nummereringsmønster som gruppens øvrige sider).
- **Sider uden `.md`-kilde** (håndskrevne HTML-sider i portalen): de er **fredede** — omskriv
  dem aldrig. Optræder de som berørte, så markér dem i rapporten som
  *»muligvis forældet — vedligeholdes manuelt«*.

### 4. Bekræftelse (før noget skrives)
Vis brugeren en oversigt og **vent på godkendelse, før noget som helst omskrives**:

| Side | Sprog | Handling | Hvad ændres |
|---|---|---|---|
| `3. Handel/3.1 …` | da-DK | Opdatér | én linje om den planlagte indholdsændring |
| `5. …/5.3 …` | da-DK | **Ny side** | hvad den nye side skal dække |
| `2. …/2.2 …` | da-DK | Kun genbyg | `.md` allerede ændret i commit `<sha>` |
| `7. …/7.1 …` | da-DK | ⚠ Flag | håndskreven side — muligvis forældet, vedligeholdes manuelt |

- Brugeren kan **fravælge** enkelte rækker — udfør kun de godkendte.
- Godkendes intet, så stop uden at skrive noget (heller ikke statefilen — ellers "glemmes"
  ændringerne ved næste kørsel).

### 5. Opdatér kildematerialet
For hver godkendt **Opdatér**/**Ny side**-række:

- Omskriv/opret `.md`-filen i `.website/<sprog>/.sourcematerial.md/<gruppe>/` — i **samme stil,
  tone og sprog** som gruppens øvrige kilder, og efter `/al-userdocs`-reglerne for
  slutbruger-dokumentation: handlingsorienteret, feltnavne med **fed**, ingen kode og ingen
  objekt-/felt-ID'er.
- Ændr kun det, kodeændringerne begrunder — omskriv **ikke** hele siden, når ét afsnit rækker.
- Er en værdi styret af opsætning, så nævn *hvor* den sættes (setup-side/felt).

### 6. Genbyg HTML og menu
- Kør `/website-build`-proceduren (multi-side-tilstand) for **hver** godkendt/ændret `.md` —
  samme gruppemappe og samme basisnavn som den eksisterende side, så portalens stier bevares.
- Fjern HTML-sider hvis `.md`-kilde blev slettet (klasse **c**) — efter bekræftelse i trin 4.
- Kør derefter `/website-update-index`-proceduren for de berørte sprog, så menuen og
  rod-redirecten er i sync.

### 7. Skriv statefilen og rapportér
- Skriv `.website/.portal-state.json` med `HEAD`-SHA'en og dags dato (ISO 8601).
- **Rapportér:** behandlede commits (antal + interval), opdaterede/nye/genbyggede/fjernede sider
  pr. sprog, flaggede håndskrevne sider, og fravalgte rækker (så brugeren ved, at de dukker op
  igen ved næste kørsel, hvis koden stadig er udokumenteret — fravalg gemmes ikke).
- **Mind brugeren om at committe** dokumentationsændringerne **sammen med** statefilen — ellers
  peger `lastUpdatedCommit` på en tilstand, som portal-filerne i git ikke afspejler.

## Vigtigt

- **Skriv aldrig uden godkendelse** — trin 4 er obligatorisk, også når kun én side er berørt.
  Dokumentationen er kunderettet; brugeren skal se, hvad der ændres, før det ændres.
- **Statefilen er portalens hukommelse** — rediger den ikke i hånden. Skal portalen "spoles
  tilbage" (fx for at gen-behandle ældre commits), så sæt `lastUpdatedCommit` til en ældre SHA
  og kør kommandoen igen.
- **Håndskrevne sider** (HTML uden `.md`-kilde) omskrives aldrig — de flagges kun. Skal en
  håndskreven side med i det automatiske flow, så giv den en `.md`-kilde først.
- Kommandoen er **projekt-agnostisk**: den hardcoder hverken kildemappe-navne eller
  gruppestruktur — alt udledes af `.website/`-strukturen og projektets git-historik.
- Enkeltstående kundeleverancer (én HTML-fil af én `.md`) er fortsat `/website-build`s opgave —
  denne kommando vedligeholder **portalen**.

## Bagefter

- **Publicering:** er GitHub Pages sat op (`/website-github-init-deploy`), publiceres portalen
  ved næste push. Ellers kan sitet ses lokalt med `serve.py`.
- **Samlet PDF:** `/pdf-build`, hvis der også ønskes en opdateret PDF-udgave.
