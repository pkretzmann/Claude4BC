---
description: Opdatér projektets oversættelsesfiler (.xlf) til alt er oversat
argument-hint: "(valgfrit) sprog, fil eller område at fokusere på først"
---

# Update translations

Opdatér projektets oversættelsesfiler, så hver trans-unit er korrekt oversat i **alle** målsprog.

Hvis der er givet et argument (`$ARGUMENTS`), så start med det sprog / den fil / det område først.

## Filer

Oversættelser ligger som XLIFF-filer (`.xlf`), typisk i mappen `Translations/`. **Antag ikke
bestemte filnavne — find dem selv** ud fra deres roller:

- **Basefilen** er den compiler-genererede `*.g.xlf`. Den definerer **kildesproget** via attributten
  `source-language` på `<file>`-elementet og indeholder alle kildestrenge. Den er kun reference og
  oversættes **ikke**.
- **Oversættelsesfilerne** er alle øvrige `*.xlf`. Hver fil angiver sit **målsprog** via attributten
  `target-language` på `<file>`-elementet (fx `da-DK`, `de-DE`, `sv-SE`). Der kan være **flere**.

Behandl **hver** oversættelsesfil, og oversæt udelukkende til det sprog, dens `target-language` angiver.

## Hvad mangler oversættelse

I en given oversættelsesfil skal en trans-unit behandles, når mindst én er sand:

- `<target>` har en `state="needs-..."` (fx `needs-translation`, `needs-adaptation`, `needs-review-translation`).
- Trans-unit'en har **intet** `<target>`-element.
- `<target>` er blot en **kopi af `<source>`** (utranslateret pladsholder).

## Fremgangsmåde

For **hver** oversættelsesfil:

1. Bestem målsproget ud fra filens `target-language`.
2. Find alle units der mangler: søg efter `state="needs-` **og** efter targets der er identiske med source.
3. Oversæt hver til målsproget:
   - Brug de korrekte tegn/diakritiske tegn for sproget.
   - Hold terminologien **konsistent** i hele filen — samme kildeterm → samme oversættelse.
   - Oversæt **ikke** pladsholdere som `%1`, `#1###`, eller felt-/kontrolnavne i `{}`.
4. Sæt hver opdateret `<target>` til `state="translated"`.
5. Verificér:
   - Ingen `state="needs-` er tilbage i filen.
   - Intet `<target>` er en nøjagtig kopi af sin `<source>` (medmindre termen reelt er ens på begge sprog, fx et produktnavn).
6. Findes der et oversættelses-/build-tjek i projektet, så kør det. Ved fejl: ret og gå tilbage til trin 2.

Gentag indtil **alle** filer og sprog er fuldt oversat og tjekkene er grønne.

## Output

Når alt er færdigt, udskriv: `<promise>COMPLETE</promise>`
