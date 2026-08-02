# html-guide/ — design system rules

Shared design system for the documentation sites (`.website/`) that the `website-*` commands generate in consuming projects.

## Canonical files — edit with care

- `portal.html` — the canonical portal template. `website-update-index` copies it to `.website/index.html` in consuming projects and afterwards only rewrites the section between the `NAV:START`/`NAV:END` markers. Never remove or rename those markers; structural changes here affect every future portal.
- `styles-default.css` — the full, neutral-brand fallback stylesheet. Projects get their own `.website/styles.css` seeded from this file (via `website-create-css`), so changes here only reach **new** projects. Keep every CSS custom property in `:root` — the brand-color commands rewrite that block.
- `script.js` — standard JS (scroll-reveal etc.) inlined verbatim into generated pages; must stay dependency-free and work from `file://`.
- `serve.py` — no-cache local preview server, copied into `.website/` by `website-init`. Plain Python stdlib only.
- `themes/` — theme catalog (classic, minimal, editorial, bold, landing, review). `website-theme` materializes a theme into a project's `.website/`. Each theme has its own README; see `themes/README.md` for the catalog contract before adding a theme.

## Conventions

- Generated pages must be **self-contained**: CSS and JS inlined, no CDN links, working offline.
- Keep HTML/CSS/JS compatible with being string-templated by commands — avoid constructs the commands' regex/marker logic would break on (markers, `:root` block, NAV list structure).
- Preview locally via `.claude/launch.json` (port 8771) or `python serve.py`.
