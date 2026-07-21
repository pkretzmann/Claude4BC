---
description: Dan eller opdatér en dansk kodekvalitets-analyse (Analyse-<AppNavn>.md) af en downloadet/dekompileret AL-app — fakta, arkitektur, fund pr. fil med alvorlighedsgrader og prioriteret handlingsliste
argument-hint: "AL-app-mappe der skal analyseres (+ evt. sprog, fx 'english'); tom = alle apps"
---

# AL-app → kodekvalitets-analyse

Analysér én app-mappe i et **analyse-repo** (downloadet/dekompileret AL-kilde) og skriv
en **kodekvalitets-analyse** som `Analyse-<AppNavn>.md` i projektroden — samme type
dokument som fx `Analyse-Twoday-Shopify-Extension.md`: hvad appen løser, filstruktur,
arkitektur, fund pr. fil med alvorlighedsgrader og en prioriteret handlingsliste.

> ⚠️ **Kør autonomt.** Stil ingen spørgsmål undervejs — træf fornuftige valg og
> rapportér dem til sidst. Formaterings-artefakter fra downloadet (sammentrukne linjer,
> underscores i filnavne) indgår **ikke** i kvalitetsvurderingen.

`$ARGUMENTS` indeholder:
- **App-mappe** = mappen med den app, der skal analyseres (indeholder `app.json`).
  **Mangler den:** analysér alle app-mapper i repoet, der endnu ikke har en
  `Analyse-*.md`, og kør opdaterings-passet (trin 6) på dem, der har.
- **Valgfrit sprog** (fx `english`, `deutsch`) = dokumentets sprog. **Standard er
  dansk.** Struktur, alvorligheds-emoji og filnavngivning er ens uanset sprog.

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
     der hver returnerer fund pr. fil i formatet fra trin 3. Saml, dedupér og redigér
     resultaterne til ét dokument, og nævn i forbeholdet at analysen er udført
     områdevis af parallelle agenter.

3. **Analysemetode (pr. fil):**
   - Kvalitetsvurdering pr. fil: **lav / middel / høj**.
   - Fund på fast skala: 🔴 **Kritisk** (fejl/afbrydelse/datatab/sikkerhedshul i
     drift) · 🟠 **Væsentlig** (robusthed, ydelse, sikkerhedssvaghed) · 🟡 **Mindre**
     (vedligehold, stil, UX, oversættelse). Hvert fund har: linjereference(r),
     konsekvens i drift og et konkret fix-forslag. Nummerér kritiske/væsentlige fund
     (K1…, V1…) så handlingslisten kan referere dem.
   - **Tjekliste** (minimum): ubeskyttede `Get`/`FindFirst`; ufiltreret
     `FindSet`+`Modify`; korrekt/forkert brug af `Handled`-mønstret; hardcodede
     testværdier; injektionsrisiko i strengbyggede queries (GraphQL/JSON/URL);
     secrets-håndtering (SecretText, IsolatedStorage, plain-text-kopier, logging af
     følsomme data); `case` uden `else`; databaseopslag/`CalcSums` i løkker pr. linje;
     manglende `SetLoadFields`; tomme/mangelfulde permission sets; død/udkommenteret
     kode og tomme stubbe; tooltips/captions/oversættelser; `app.json`-hygiejne
     (versionsdrift, døde preprocessorsymboler, generisk description).
   - **Efterprøv påstande:** kald ind i afhængige apps, hvis kilde ER i repoet, skal
     verificeres ved at læse/greppe den faktiske kode. Markér fund som *verificeret*
     hhv. *udledt af signaturer*.

4. **Skriv dokumentet** — `Analyse-<AppNavn>.md` i projektroden, med faste afsnit:
   - **Hoved:** app, version, publisher, app-id, objektinterval, omfang (filer/linjer),
     analysedato, grundlag (kildemappe).
   - **Forbehold** (blockquote): dekompilerings-artefakter vurderes ikke; hvilke
     afhængigheder der mangler i repoet (→ adfærd udledt af signaturer); evt. at
     analysen er udført af parallelle områdeagenter.
   - **§1 Hvad løser appen?** — nummererede kerneopgaver + tabel "Berørte områder".
   - **§2 Filstruktur pr. funktionsområde** — anbefalet `src/`-træ med objekt-id'er og
     én-linjes formål pr. fil/gruppe.
   - **§3 Arkitektur og dataflow** — ASCII-diagram + kort kommentar om designmønstre.
   - **§4 Kvalitetsanalyse pr. område/fil** — alvorlighedslegende, fund pr. fil, og pr.
     område en opsamling "Områdets vigtigste risici".
   - **§5 Samlet vurdering** — tabel (arkitektur, funktionel korrekthed, robusthed,
     ydelse, vedligehold, oversættelse/UX) + **prioriteret handlingsliste** + slutnote
     om, hvad der kræver efterprøvning i et testmiljø.

5. **Sprog:** dansk, medmindre `$ARGUMENTS` angiver andet. Tekniske termer,
   objektnavne og kodecitater forbliver uoversatte.

6. **Findes analysen allerede, så opdatér idempotent — skriv aldrig blindt om:**
   - Tilføj `**Opdateret:** <dato>` i hovedet og ajourfør forbeholdet (hvilke
     afhængigheders kilde er kommet til siden sidst).
   - **Efterprøv eksisterende fund** mod nyligt tilgængelig afhængigheds-kilde; ret
     forkerte antagelser med daterede noter (*"Rettelse <dato>: …"*); nye fund markeres
     *"(nyt fund <dato>)"* og føjes til handlingslisten.
   - Tilføj/ajourfør **§6 "Efterprøvning mod nu tilgængelig kildekode"** med
     underpunkterne **Bekræftet / Korrigeret / Nyt fund / Fortsat uverificeret**.

7. **Rapportér:** oprettet eller opdateret, antal fund pr. alvorlighed, de vigtigste
   valg truffet undervejs (områdeinddeling, agent-brug), og hvad der fortsat er
   uverificeret. Nævn analysen i CLAUDE.md's Tooling-afsnit, hvis et sådant findes og
   ikke allerede henviser til den. Udskriv til sidst: `<promise>COMPLETE</promise>`
