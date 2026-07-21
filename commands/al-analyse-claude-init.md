---
description: Dan eller opdatér en god CLAUDE.md (på engelsk) for et analyse-repo med downloadet/dekompileret AL-kilde — repo-type, app-oversigtstabel, afhængighedslag, analyse-begrænsninger og @-import af de fælles husregler. Med 'per-app' dannes desuden lokale CLAUDE.md-filer i de store app-mapper
argument-hint: "(valgfrit) sti til projektroden · 'per-app' [app-mappenavne…] → også lokale CLAUDE.md pr. app"
---

# Analyse-repo → CLAUDE.md

Analysér et **analyse-repo** — en samling af **downloadet/dekompileret AL-kilde** fra
publicerede Business Central-apps (typisk hentet med *Download Source* eller udpakket
fra `.app`/`.zip`-filer) — og skriv en **CLAUDE.md på engelsk** i projektroden, der
giver Claude Code den kontekst, som ikke billigt kan udledes af filerne selv.

Formålet er **kodeanalyse**, ikke app-udvikling: CLAUDE.md-filerne skal hjælpe med at
besvare "hvordan hænger X sammen / hvor kommer Y fra"-spørgsmål på tværs af apps — de
skal **ikke** indeholde build-, test- eller kodestils-instruktioner.

> ⚠️ **Kun analyse-repos.** Kendetegn: flade app-mapper (ingen `src/`), filnavne med
> underscores i stedet for mellemrum, sammenklappet formatering, tom `.alpackages`
> (kan ikke kompileres), app-mapper der er øjebliksbilleder fra forskellige
> BC-versioner. Almindelige **udviklingsprojekter er ikke denne kommandos opgave** —
> de får senere deres egen variant.

`$ARGUMENTS`:
- Valgfri **sti til projektroden** — mangler den, brug det aktuelle projekt.
- Nøgleordet **`per-app`** → dan desuden lokale CLAUDE.md-filer i app-mapperne
  (trin 4). Evt. efterfulgt af specifikke app-mappenavne, som så altid medtages
  uanset størrelse.

## Fremgangsmåde

1. **Validér repoet:**
   - Find alle `app.json`-filer (én pr. app-mappe). **Ingen fundet** → sig det
     (ikke et BC-repo) og stop.
   - Ligner repoet et **udviklingsprojekt** (fyldt `.alpackages`, `src/`-struktur,
     `launch.json` med publicering, AL-Go-filer under `.github/`)? → advar om at denne
     kommando er til analyse-repos, og stop medmindre brugeren udtrykkeligt vil
     fortsætte.

2. **Analysér — CLAUDE.md skal være udledt af fakta, ikke skabelon-fyld:**
   - **Hver `app.json`:** navn, id, version, `idRanges`, `runtime`,
     `application`/`platform`, `dependencies`, `internalsVisibleTo`. Byg
     **afhængighedsgrafen** og markér hvilke afhængigheder der ligger **i repoet**
     og hvilke der er **eksterne** (kilde ikke til stede).
   - **Integration på tværs af apps:** hvilken app abonnerer på hvilken apps events,
     interface-implementeringer på tværs, `internalsVisibleTo`-par der faktisk
     bruges, og procedurer der kaldes fra andre apps — analysespørgsmål handler
     typisk om flows på tværs af apps, så dette kort er guld værd.
   - **Kollisioner og dubletter:** overlappende objektranges mellem apps og
     objektnavne der findes i flere apps (fx to codeunits med samme navn i hver sin
     app) — klassiske analyse-fælder der skal nævnes eksplicit.
   - **Repoets form:** app-mapper (og evt. kilde-`.zip`s de er udpakket fra), flade
     filer vs. `src/`, underscore-navne, tom `.alpackages`, **blandede
     BC-målversioner** på tværs af mapperne, oversættelsesfiler (`.xlf`),
     `.website`-dokumentationssite.
   - **Objektpræfiks** (fx `RIT`) — sampl objektnavne på tværs af apps. Notér også
     de **eksterne** præfikser der optræder i koden (fx `LSC`, `XTEFV`, `Shpfy`).
   - **Skim de centrale objekter pr. app** (de største/mest refererede codeunits,
     tabeller, setup-objekter) og formulér **3–6 punkter pr. app** om
     hovedområderne med de vigtigste objektnavne nævnt.
   - `git log --oneline -10` for nylig aktivitet.

3. **Skriv `CLAUDE.md` i projektroden — på engelsk** — med disse afsnit
   (1–4 er kernen; 5–8 holdes korte; sigt efter **60–120 linjer** i alt):

   1. **Titel + "What this repo is"** — kunde/produkt, udgiver, og *eksplicit* at det
      er et **analysis repo** af downloadet kilde med de artefakter det medfører
      (flade filer, underscore-navne, sammenklappet formatering, kan ikke kompileres)
      — så Claude ikke fejltolker artefakterne som stilvalg.
   2. **App-oversigtstabel** (flere apps) eller faktablok (én app): mappe, app-id
      (kort form), objektranges, filantal, BC-målversion, afhængigheder i repoet —
      sorteret i **afhængighedsorden** (mest fundamentale først).
   3. **Pr. app:** 3–6 punkter om de vigtigste funktionsområder med nøgle-objektnavne.
      Findes der lokale CLAUDE.md-filer (trin 4), henvis til dem her.
   4. **Eksterne afhængigheder** — apps der refereres men ikke ligger i repoet
      (fx LS Central, FaVa, Shopify Connector), med noten *"when analysis hits an
      unknown object/field, assume it comes from one of these"* — og et
      **præfiks→app-kort** (fx `LSC` → LS Central, `XTEFV` → FaVa, `Shpfy` →
      Shopify Connector), så ukendte symboler hurtigt kan henføres.
   5. **Analysis constraints** — tom `.alpackages`/ikke kompilérbar, blandede
      BC-versioner mellem mapper, hvor ukendte symboler kommer fra — samt fundne
      **range-overlaps og navne-dubletter** fra trin 2.
   6. **Conventions** — objektpræfiks, filnavngivning, oversættelsesfiler og andet
      repo-specifikt. Medtag en **søgevejledning**: underscore-filnavne gør
      navnebaseret filsøgning upålidelig — grep på objektnavnet i filindholdet i
      stedet for at globbe på filnavne.
   7. **Husregler** — afslut med en `@`-import af den fælles CLAUDE.md fra
      submodulet, fx `@.claude/skills/claude4bc/CLAUDE.md`. **Detektér den faktiske
      mappesti** (submodulet kan hedde `claude4bc` eller `c4bc`); findes submodulet
      ikke, udelades linjen.
   8. **Pointers** — én linje om c4bc-dokumentationskommandoerne / `.website`-sitet,
      hvis det findes, samt **eksisterende analysedokumenter** i roden (fx
      `Analyse-*.md`).

   **Skrivestil:** koncis og skimbar; kun fakta Claude ikke selv billigt kan udlede;
   ingen tutorial-prosa; gentag ikke hvad en filliste alligevel viser.

4. **Lokale CLAUDE.md pr. app — kun når `per-app` er angivet:**
   - Dan som udgangspunkt kun for apps med **≥50 AL-filer** — en lokal fil for en
     app på 4 filer er støj. Apps nævnt eksplicit i `$ARGUMENTS` medtages dog
     altid. Rapportér hvilke apps der blev sprunget over og hvorfor.
   - Læg filen i app-mappens rod, **på engelsk**, ca. **40–80 linjer**, rent
     **analyseorienteret** (ingen build-/test-/stil-instruktioner):
     1. Indledende note: filen supplerer rodens CLAUDE.md, og mappen er et
        **versioneret snapshot** — filen skal dannes igen i den nye mappe, når en
        nyere version downloades.
     2. **Faktablok:** app-id (kort), version, objektranges, BC-målversion,
        afhængigheder — kort; gentag ikke rodens tabel.
     3. **Funktionsområde-kort** — filens hovedindhold: områder → nøgleobjekter
        **med objekt-id'er**, væsentligt dybere end rodens 3–6 punkter, så
        analysen hurtigt kan lande i det rigtige hjørne af appen.
     4. **Berøringsflader mod andre apps** — events udgivet/abonneret, interfaces
        erklæret/implementeret, `internalsVisibleTo` ind/ud, procedurer som andre
        apps kalder (og hvem der kalder dem).
     5. **Indgangspunkter til analyse** — setup-tabeller/-sider, rapporter og
        job-kø-objekter, permission sets.
     6. **App-specifikke faldgruber** — fx objektnavne der også findes i andre
        apps, eller områder hvor koden afviger fra resten af repoet.
   - Tilføj/ajourfør en henvisningslinje i rodens CLAUDE.md pr. lokal fil.

5. **Findes der allerede CLAUDE.md-filer, så opdatér idempotent — overskriv aldrig
   blindt:**
   - Læs den eksisterende fil først og **bevar håndskrevet prosa og afsnit**.
   - Synkronisér kun de **udledelige fakta** (app-tabel, versioner, afhængigheder,
     filantal) og tilføj manglende afsnit (typisk `@`-importen).
   - **Mappe-omdøbninger:** app-mappenavne indeholder versionsnumre — dukker et
     nyere snapshot af en app op, så opdatér tabelrækker og henvisninger i stedet
     for at tilføje dubletrækker.
   - **Forældede lokale filer (tjek altid, også uden `per-app`):** ligger der en
     CLAUDE.md i en app-mappe, der ikke længere er den nyeste downloadede version
     af appen, så flag den og tilbyd at gendanne den i den nye mappe.
   - Reglerne her gælder både rodens CLAUDE.md og de lokale filer fra trin 4.
   - Rapportér bagefter **hvad der blev ændret** i stedet for at skrive filen om.

6. **Rapportér:** oprettet eller opdateret (roden og evt. lokale filer), hvilke
   afsnit/fakta der blev skrevet/synkroniseret, hvilke apps der blev sprunget over i
   trin 4, og evt. fund der bør efterses manuelt (fx afhængigheder der hverken er i
   repoet eller kendte standard-apps). Udskriv til sidst:
   `<promise>COMPLETE</promise>`
