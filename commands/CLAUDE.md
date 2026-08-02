# commands/ — authoring conventions

Rules for writing and editing the slash commands in this folder. They load in consuming projects as the plugin `c4bc` with namespace `/c4bc:<name>`.

## File shape

- One command per `.md` file; the file name (without `.md`) is the command name.
- Naming: `website-*` for documentation-site commands, `al-*` for AL/BC commands. Kebab-case.
- YAML frontmatter with `description` (one line, shown in the slash-command list) and `argument-hint` when the command takes arguments. Reference arguments in the body via `$ARGUMENTS`.

## Referencing plugin assets

Never use paths relative to the consuming project to reach files in this repo — always use `${CLAUDE_PLUGIN_ROOT}`, e.g. `${CLAUDE_PLUGIN_ROOT}/html-guide/styles-default.css`. The submodule lives at `.claude/skills/c4bc` in consuming projects (older projects may use `claude4bc`), but only `${CLAUDE_PLUGIN_ROOT}` is guaranteed.

## Content rules

- Commands must be **project-agnostic**: discover paths (`.website/`, app folders, git root) at runtime; never hardcode a specific customer or repo.
- Prefer **idempotent** behavior: re-running a command must not duplicate or destroy user content (see `website-update-index.md` NAV:START/NAV:END markers for the pattern).
- Language: existing commands are mixed Danish/English — keep each file internally consistent with its current language. New commands: Danish body is fine (they are user-facing for a Danish audience), but keep command names, frontmatter, and technical terms in English.
- When a command produces output for end users, honor the shared CLAUDE.md rules (English captions/tooltips in AL, æ/ø/å in Danish prose).

## After adding or renaming a command

Update `Readme.md` (both the content tree and the Commands section) and, if user-facing, `docs/Sådan anvendes Claude4BC.html`.
