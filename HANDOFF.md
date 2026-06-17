# HANDOFF: Web Projects Template Setup

## Context
Peter Kretzmann, Fich & Kretzmann (F&K) — Danish BC partner firm.
Goal: Build a reusable CLAUDE.md template + `web-projects/` structure for Danish customer websites,
modelled after the existing Claude4BC submodule pattern.

## What we decided to build
A `web-projects/` directory (or separate submodule) containing:
- A reusable `CLAUDE.md` template with brand guidelines, tone-of-voice, and SPA/nav conventions
- Per-customer brand kit slots (colors, fonts, tone)
- Danish tone-of-voice defaults
- Existing SPA/iframe + `nav.json` pattern as structural baseline
- GitHub Pages deployment (existing workflows already in place)

## Plugin/MCP stack agreed on
```bash
# Plugins
claude plugin add anthropic/frontend-design
claude plugin add anthropic/feature-dev
claude plugin add anthropic/code-review

# MCP servers
claude mcp add context7 -s user -- npx -y @upstash/context7-mcp@latest
claude mcp add playwright -s user -- npx @playwright/mcp@latest
```

## Inspiration repos to reference
- `claudekit/frontend-design-pro-demo` — 11 design aesthetics, pure HTML/CSS, with master prompts
- `Leonxlnx/taste-skill` — framework-agnostic, motion-first, includes visual style showcase
- `wilwaldon/Claude-Code-Frontend-Design-Toolkit` — CLAUDE.md tricks, MCP configs, Figma integration

## Existing patterns to preserve
- SPA structure with `nav.json` controlling navigation
- GitHub Actions workflows syncing subfolder → mirror repo → GitHub Pages
- Dark theme preference (established on fich-kretzmann.dk)
- All customer-facing content in Danish

## Suggested next steps in Claude Code
1. Review existing F&K site structure as reference baseline
2. Create `web-projects/CLAUDE.md` template with brand kit slots
3. Define folder convention: `web-projects/<customer-slug>/`
4. Hook into existing GitHub Pages deploy workflow

## Notes
- Claude4BC submodule lives at: `EbroFrost Base App/.claude/claude4bc` (GitHub: `pkretzmann/Claude4BC`)
- Same submodule pattern could apply here as `web-projects/` submodule
- F&K website: `fich-kretzmann.dk` (single-page HTML/CSS/JS, dark theme)
