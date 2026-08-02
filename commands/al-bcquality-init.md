---
description: Installér Microsofts BCQuality-vidensbase (github.com/microsoft/BCQuality) som git-submodule i .claude/bcquality og forbind den til projektets CLAUDE.md, så review-/analyse-agenter kan bruge dens guardrails og skills
argument-hint: "(valgfrit) alternativ submodule-sti — standard .claude/bcquality"
---

# al-bcquality-init — Installér BCQuality i projektet

Tilføj **BCQuality** (`https://github.com/microsoft/BCQuality`) som git-submodule i
projektet og gør den synlig for Claude via CLAUDE.md. BCQuality er Microsofts
maskinlæsbare kvalitets-vidensbase for BC-udvikling (MIT-licens) med tre lag —
`microsoft/` (officielle platform-guardrails), `community/` (fælles BC-mønstre) og
`custom/` (partner-/kundespecifikke tilføjelser) — hver med `knowledge/`-filer og
`skills/`. Konventionen er, at en agent starter i **`skills/entry.md`**, som
dispatcher til de relevante action-skills.

> ⚠️ **Kør autonomt.** Stil ingen spørgsmål undervejs — træf fornuftige valg og
> rapportér dem til sidst. Kommandoen kører i **værtsprojektet**: submodulet
> registreres i projektets `.gitmodules`, ikke i claude4bc.

`$ARGUMENTS` = valgfri alternativ sti til submodulet. Standard: `.claude/bcquality`
(bevidst **ikke** `.claude/skills/` — BCQuality bruger sin egen `entry.md`-konvention,
ikke Claude Codes `SKILL.md`-format, og skal ikke ind i skill-auto-discovery).

## Fremgangsmåde

1. **Validér:**
   - Projektroden skal være et git-repo (`git rev-parse --git-dir`) — ellers stop
     med besked om at køre `git init` først.
   - **Findes submodulet allerede** (stien optræder i `.gitmodules`): kør
     `git submodule update --init <sti>`, rapportér "allerede installeret —
     initialiseret/opdateret" og hop til trin 3 (idempotent).

2. **Installér:**
   ```
   git submodule add https://github.com/microsoft/BCQuality <sti>
   git submodule update --init <sti>
   ```
   Fejler add (fx intet netværk, eller mappen findes i forvejen uden at være
   registreret), rapportér fejlen og stop — ryd ikke op i eksisterende filer.

3. **Forbind til CLAUDE.md** (idempotent — spring over, hvis afsnittet findes):
   Tilføj et kort afsnit i projektets CLAUDE.md, fx under Tooling:

   > **BCQuality** (Microsoft, MIT) ligger som submodule i `<sti>` — en
   > maskinlæsbar kvalitets-vidensbase for BC/AL. Ved code review og
   > kvalitetsanalyse (fx `/c4bc:al-analyse`): start i `<sti>/skills/entry.md`
   > (dispatch til action-skills) og slå konkrete regler op med precedensen
   > claude4bc-submodulets `bcquality-custom/knowledge/` → klonens `community/`
   > → `microsoft/` (mest autoritative først).

   Findes ingen CLAUDE.md, udelades dette trin (nævn det i rapporten).

   > ⚠️ **Egne politikker:** Læg partner-/kundespecifikke regler i
   > **claude4bc-submodulets `bcquality-custom/knowledge/`** — IKKE i klonens
   > `custom/`-mappe. Klonen skal holdes ren, så den kan følge Microsofts repo
   > uden fork eller lokale ændringer.

4. **Commit** ændringerne i værtsprojektet (`.gitmodules`, submodule-pointeren og
   evt. CLAUDE.md) med beskeden `Add BCQuality knowledge base as submodule` —
   medmindre brugeren har bedt om at lade være. Push aldrig uden aftale.

5. **Rapportér:** installeret eller allerede til stede (og om den blev opdateret),
   den valgte sti, om CLAUDE.md blev opdateret, og evt. manuelle efterspil (fx
   `git submodule update --init` på andre kloner). Udskriv til sidst:
   `<promise>COMPLETE</promise>`

## Vedligehold

Opdatering til nyeste BCQuality sker med scriptet
**`${CLAUDE_PLUGIN_ROOT}/update-bcquality.ps1`** (samme mønster som
`update-claude4bc.ps1`): viser status og ændringerne siden din version
(commit-liste + berørte filer pr. lag), spørger om bekræftelse og kører derefter
`submodule update --remote` + commit + push. Kør det fra en terminal:
`.\.claude\skills\c4bc\update-bcquality.ps1` (evt. med
`-SubmodulePath <sti>`, hvis submodulet ligger et andet sted).
