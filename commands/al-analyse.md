---
description: Dan eller opdatér en dansk kodekvalitets-analyse (Analyse-<AppNavn>.html) af en downloadet/dekompileret AL-app — executive summary, fund grupperet i indsatsområder med P1/P2/P3-prioritet, foldbare tekniske detaljer og foreslået rækkefølge, efter skabelonen i al-analyse/
argument-hint: "AL-app-mappe der skal analyseres (+ evt. sprog, fx 'english'); tom = alle apps"
---

# AL-app → kodekvalitets-analyse

Analysér én app-mappe i et **analyse-repo** (downloadet/dekompileret AL-kilde) og skriv
en **kodekvalitets-analyse** som `Analyse-<AppNavn>.html` i projektroden — efter
**skabelonen** `al-analyse/Analyse-Skabelon.html` i dette skill-modul: et læsevenligt,
selvstændigt HTML-dokument med executive summary til ledelsen, fund grupperet i
**indsatsområder** med prioritet **P1/P2/P3**, foldbare tekniske detaljer og en
foreslået rækkefølge (quick wins først).

> ⚠️ **Kør autonomt.** Stil ingen spørgsmål undervejs — træf fornuftige valg og
> rapportér dem til sidst. Formaterings-artefakter fra downloadet (sammentrukne linjer,
> underscores i filnavne) indgår **ikke** i kvalitetsvurderingen.

`$ARGUMENTS` indeholder:
- **App-mappe** = mappen med den app, der skal analyseres (indeholder `app.json`).
  **Mangler den:** analysér alle app-mapper i repoet, der endnu ikke har en
  `Analyse-*.html`/`Analyse-*.md`, og kør opdaterings-passet (trin 7) på dem, der har.
- **Valgfrit sprog** (fx `english`, `deutsch`) = dokumentets sprog. **Standard er
  dansk.** Struktur, prioritets-tags og filnavngivning er ens uanset sprog.

## Skabelon og CSS

- **Skabelon:** `al-analyse/Analyse-Skabelon.html` i skill-modulet (submodulet kan
  hedde `claude4bc` eller `c4bc` — detektér den faktiske sti). Genbrug skabelonens
  opbygning, klassenavne og JavaScript (smooth scroll, scroll-spy, fold alle
  detaljer, til-toppen-knap, læse-progress, count-up) uændret.
- **Standard-CSS:** `al-analyse/styles.css` (udtrukket fra skabelonen — "editorial"-
  temaet). Indlejres i dokumentets `<style>` så filen er selvstændig. Justér kun
  brandfarver, hvis kunden har egne (fx via `/c4bc:website-create-css`-paletten).

## Fremgangsmåde

1. **Validér og saml fakta:**
   - Læs appens `app.json`: navn, id, version, `idRanges`, `runtime`,
     `application`/`platform`, `dependencies`, `internalsVisibleTo`. Tæl `.al`-filer
     og ca. kodelinjer.
   - Klassificér hver afhængighed: **i repoet** (kilden findes — påstande om den SKAL
     efterprøves mod koden) eller **ekstern** (adfærd må udledes af signaturer — og
     analysen skal sige det). Brug CLAUDE.md's app-tabel, hvis den findes.
   - Ingen `app.json` i mappen → sig det og stop for den mappe.

2. **Skalér arbejdet:**
   - **Lille app** (≤ ~15 filer): analysér alle filer selv.
   - **Stor app**: gruppér filerne i **funktionsområder** (efter navne/præfikser og
     objektreferencer), og send **parallelle analyse-agenter** afsted — én pr. område —
     der hver returnerer fund i formatet fra trin 3. Saml, dedupér og redigér
     resultaterne til ét dokument, og nævn i metodenoten at analysen er udført
     områdevis af parallelle agenter.

3. **Analysemetode:**
   - **Prioritet pr. fund** (skabelonens skala):
     **P1** — høj effekt på korrekthed/stabilitet i drift (stille datafejl, datatab,
     stoppede integrationer/jobs, sikkerhedshul) — gøres først ·
     **P2** — meningsfuld forbedring (robusthed, ydelse, vedligehold med mærkbar
     driftskonsekvens) · **P3** — oprydning / nice-to-have.
   - **Status pr. fund:** `verificeret` (læst og bekræftet i koden) ·
     `gennemgående` (mønster mange steder; nævnte linjer er repræsentative) ·
     `TODO i kode` (allerede markeret i kildekoden).
   - **Ubeskyttet `Get()`/`FindFirst()` er som udgangspunkt P3** — en hård
     runtime-fejl kan være acceptabel adfærd (fail fast), så manglende guard er i sig
     selv kun oprydning. Opgradér kun prioriteten, hvis konteksten konkret viser
     **stille fejl** (felter læses fra en tom record, forkerte tal uden fejl, data
     skrives videre) eller andet udtrykkeligt er angivet.
   - **Fix-forslag skal være gyldig AL.** AL har **ingen** `try/catch/finally`-blokke,
     **intet** `using`-statement til oprydning (kun namespace-direktiv) og **ingen**
     `async/await`. Foreslå i stedet: returværdi-tjek (`if not Evaluate(...) then`,
     `if Rec.Get(...) then`), `[TryFunction]` + `GetLastErrorText()`,
     `if Codeunit.Run(...) then`, `ErrorInfo`/`TestField`. Garanteret oprydning
     formuleres som **ubetinget nulstilling i kalderen efter Try-kaldet** (husk:
     SingleInstance-state ruller ikke tilbage med transaktionen). Baggrundskørsel
     foreslås som Job Queue / `StartSession` / Page Background Task — ikke "async".
   - Hvert fund har: kort brugervendt beskrivelse (hvad betyder det i drift) og en
     foldbar teknisk detalje med objekt-/linjereferencer og et konkret fix-forslag.
   - **Tjekliste** (minimum): ubeskyttede `Get`/`FindFirst` (→ P3, jf. ovenfor);
     ufiltreret `FindSet`+`Modify`; korrekt/forkert brug af `Handled`-mønstret;
     hardcodede templates/batches/grupper/testværdier; injektionsrisiko i
     strengbyggede queries (GraphQL/JSON/URL); secrets-håndtering (SecretText,
     IsolatedStorage, plain-text-kopier, logning af følsomme data); `case` uden
     `else`; databaseopslag/`CalcSums` i løkker pr. linje; manglende `SetLoadFields`;
     `FindLast()+1`-nummerering (samtidighed); `Message`/`Confirm`/`Sleep` i
     baggrunds-/Job Queue-stier uden `GuiAllowed()`; tomme/mangelfulde permission
     sets; død/udkommenteret kode og tomme stubbe; tooltips/captions/oversættelser;
     `app.json`-hygiejne (versionsdrift, døde preprocessorsymboler, generisk
     description).
   - **Efterprøv påstande:** kald ind i afhængige apps, hvis kilde ER i repoet, skal
     verificeres ved at læse/greppe den faktiske kode. Automatisk rapporterede fund,
     der afvises ved verifikation, udelades — og nævnes i metodenoten.

4. **Skriv dokumentet** — `Analyse-<AppNavn>.html` i projektroden, efter skabelonen:
   - **Header:** badge (app-navn), titel, manchet (lead), pills (app-version,
     BC-version/platform, runtime, objektinterval) og stat-strip med count-up
     (AL-objekter gennemgået, moduler/områder, indsatsområder, konkrete fund).
   - **Indholdsfortegnelse** (TOC) med scroll-spy.
   - **Executive Summary — anbefaling til ledelsen:** hvad appen er, samlet
     tilstand, **de tre vigtigste risici lige nu**, **hvad ledelsen bør beslutte**
     (kort/mellemlangt sigt + fasthold god praksis) og en samlet vurdering
     (verdict-boks). Skrives uden kode-referencer — ledelsen skal kunne læse den.
   - **Legend:** prioriteter (P1/P2/P3), status-tags og forklaring af de foldbare
     tekniske detaljer.
   - **Sektioner pr. indsatsområde** (nummererede, fx korrekthedsfejl, defensiv
     kodning, hardcodede værdier, integrationsrobusthed, baggrunds-/Job
     Queue-sikkerhed, nummerserier & samtidighed, performance, lokalisering & UX,
     teknisk gæld, datamodel & dokumentation — tilpas områderne til appen): intro,
     fund (`.finding` med tag + status + titel + brugervendt beskrivelse +
     `details.tech` med teknisk detalje), og evt. `note`-bokse med anbefalinger.
   - **Foreslået rækkefølge (quick wins først)** — nummereret liste der refererer
     sektionerne — og en **metodenote** (gennemgangens omfang, hvad status-tags
     betyder, afviste påstande).
   - **Footer:** app + version, "udarbejdet <måned år>", omfang.
   - Dokumentet skal være **selvstændigt**: CSS indlejret, ingen eksterne
     afhængigheder ud over webfonte.

5. **Sprog:** dansk, medmindre `$ARGUMENTS` angiver andet. Tekniske termer,
   objektnavne og kodecitater forbliver uoversatte.

6. **Ældre `.md`-analyser:** findes analysen som `Analyse-<AppNavn>.md` (ældre
   format), så bevar den — opdatér den kun idempotent (trin 7). Ved en **fuld
   genanalyse** dannes det nye dokument som HTML efter skabelonen, og `.md`-filen
   kan derefter fjernes/arkiveres (nævn det i rapporten).

7. **Findes analysen allerede, så opdatér idempotent — skriv aldrig blindt om:**
   - Tilføj/ajourfør "opdateret <måned år>" i footer (HTML) hhv. `**Opdateret:**
     <dato>` i hovedet (.md), og ajourfør forbehold/metodenote (hvilke
     afhængigheders kilde er kommet til siden sidst).
   - **Efterprøv eksisterende fund** mod nyligt tilgængelig afhængigheds-kilde; ret
     forkerte antagelser med daterede noter (*"Rettelse <dato>: …"*); nye fund
     markeres *"(nyt fund <dato>)"* og indplaceres i deres indsatsområde og i den
     foreslåede rækkefølge.
   - Tilføj/ajourfør et afsnit **"Efterprøvning mod nu tilgængelig kildekode"** med
     underpunkterne **Bekræftet / Korrigeret / Nyt fund / Fortsat uverificeret**.

8. **Rapportér:** oprettet eller opdateret, antal fund pr. prioritet (P1/P2/P3), de
   vigtigste valg truffet undervejs (områdeinddeling, agent-brug, ned-/opgraderede
   prioriteter), og hvad der fortsat er uverificeret. Nævn analysen i CLAUDE.md's
   Tooling-afsnit, hvis et sådant findes og ikke allerede henviser til den. Udskriv
   til sidst: `<promise>COMPLETE</promise>`
