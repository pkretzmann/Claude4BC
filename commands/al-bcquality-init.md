---
description: Installér Microsofts BCQuality-vidensbase (github.com/microsoft/BCQuality) som Claude Code-plugin og forbind den til projektets CLAUDE.md, så review-/analyse-agenter kan bruge dens guardrails og skills
---

# al-bcquality-init — Installér BCQuality som plugin

Installér **BCQuality** (`https://github.com/microsoft/BCQuality`) som Claude Code-
**plugin** og gør den synlig for Claude via projektets CLAUDE.md. BCQuality er
Microsofts maskinlæsbare kvalitets-vidensbase for BC-udvikling (MIT-licens) med tre
lag — `microsoft/` (officielle platform-guardrails), `community/` (fælles BC-mønstre)
og `custom/` (partner-/kundespecifikke tilføjelser) — hver med `knowledge/`-filer og
`skills/`. Plugin'et eksponerer bridge-skill'en **`bcquality-al-review`**, som selv
kører BCQualitys Entry-protokol (`skills/entry.md` → dispatch → action-skills).

> ⚠️ **Kør autonomt.** Stil ingen spørgsmål undervejs — træf fornuftige valg og
> rapportér dem til sidst.

> ⚠️ **Klon ALDRIG BCQuality ind i et AL-workspace** (hverken som submodule eller
> almindelig klon): vidensbasen indeholder ~400 eksempel-`.al`-filer
> (`*.good.al`/`*.bad.al`), som AL-compileren opfatter som projektkilde og fejler
> på — compileren har ingen mappe-eksklusion. Plugin-installationen lægger filerne
> under brugerens `~/.claude/plugins/`, uden for workspacet.

## Fremgangsmåde

1. **Tjek om plugin'et allerede er installeret:** kør `claude plugin list` —
   optræder `bcquality@bcquality`, rapportér "allerede installeret" og hop til
   trin 3 (idempotent).

2. **Installér** (samme trin ligger i scriptet
   `${CLAUDE_PLUGIN_ROOT}/install-bcquality.ps1` til manuel kørsel):
   ```
   claude plugin marketplace add microsoft/BCQuality
   claude plugin install bcquality@bcquality
   ```
   Fejler installationen (fx intet netværk eller manglende `claude` CLI),
   rapportér fejlen og stop.

3. **Forbind til CLAUDE.md** (idempotent — spring over, hvis afsnittet findes):
   Tilføj et kort afsnit i projektets CLAUDE.md, fx under Tooling:

   > **BCQuality** (Microsoft, MIT) — en maskinlæsbar kvalitets-vidensbase for
   > BC/AL — er installeret som Claude Code-**plugin** (`bcquality` fra
   > `microsoft/BCQuality`-marketplacet); hver udvikler installerer den én gang
   > med `/c4bc:al-bcquality-init`. Ved code review og kvalitetsanalyse: kald
   > plugin-skill'en **`bcquality-al-review`**. Ved direkte regelopslag gælder
   > precedensen claude4bc-submodulets `bcquality-custom/knowledge/` →
   > plugin'ets `community/` → `microsoft/` (mest autoritative først). Klon
   > aldrig BCQuality ind i workspacet — dens eksempel-`.al`-filer knækker
   > AL-buildet.

   Findes ingen CLAUDE.md, udelades dette trin (nævn det i rapporten).

   > ⚠️ **Egne politikker:** Læg partner-/kundespecifikke regler i
   > **claude4bc-submodulets `bcquality-custom/knowledge/`** — IKKE i plugin'ets
   > `custom/`-mappe, som er pr. bruger og uden versionsstyring.

4. **Commit** en evt. CLAUDE.md-ændring i værtsprojektet med beskeden
   `Wire BCQuality plugin into CLAUDE.md` — medmindre brugeren har bedt om at
   lade være. Push aldrig uden aftale.

5. **Rapportér:** installeret eller allerede til stede, om CLAUDE.md blev
   opdateret, og at skill'en `bcquality-al-review` først er synlig i **nye**
   Claude Code-sessioner. Udskriv til sidst: `<promise>COMPLETE</promise>`

## Vedligehold

- Plugin'et er **pr. udvikler** (user scope) — hvert teammedlem kører kommandoen
  én gang. Der er ingen submodule-pointer at bumpe i projektet.
- Opdatering sker via plugin-manageren (`/plugin`-UI'et i Claude Code) eller ved
  at geninstallere: `claude plugin install bcquality@bcquality`.
