---
description: Opdatér BCQuality-submodulet (.claude/bcquality) til nyeste version fra github.com/microsoft/BCQuality, vis hvad der er ændret i vidensbasen, og commit den nye pointer
argument-hint: "(valgfrit) submodule-sti — standard .claude/bcquality"
---

# al-bcquality-update — Opdatér BCQuality-vidensbasen

Træk nyeste version af **BCQuality**-submodulet og gør ændringerne synlige, så man
ved hvilke guardrails/skills der er kommet til eller ændret siden sidst.

> ⚠️ **Kør autonomt.** Stil ingen spørgsmål undervejs. Kommandoen kører i
> **værtsprojektet**.

`$ARGUMENTS` = valgfri submodule-sti. Standard: `.claude/bcquality`.

## Fremgangsmåde

1. **Validér:** stien skal være et registreret submodule (optræder i `.gitmodules`).
   Er den ikke det → henvis til `/c4bc:al-bcquality-init` og stop.

2. **Notér nuværende version:** `git -C <sti> rev-parse --short HEAD`.

3. **Opdatér:**
   ```
   git submodule update --remote --init <sti>
   ```
   Samme SHA bagefter → rapportér "allerede nyeste version" og stop (uden commit).

4. **Vis hvad der er ændret** (det egentlige formål med kommandoen):
   - `git -C <sti> log --oneline <gammel>..<ny>` — commit-listen.
   - `git -C <sti> diff --stat <gammel>..<ny>` — hvilke knowledge-/skills-filer der
     er tilføjet/ændret, grupperet pr. lag (`microsoft/`, `community/`, `custom/`).
   - Opsummer i 3–6 punkter på dansk, hvad ændringerne betyder for review/analyse
     (fx "ny guardrail om X", "skill Y omdøbt").

5. **Commit** den nye submodule-pointer i værtsprojektet med beskeden
   `Update BCQuality (<gammel>..<ny>)` — medmindre brugeren har bedt om at lade
   være. Push aldrig uden aftale.

6. **Rapportér:** gammel → ny SHA, opsummeringen fra trin 4, og om pointeren blev
   committet. Udskriv til sidst: `<promise>COMPLETE</promise>`
