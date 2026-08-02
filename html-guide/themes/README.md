# html-guide — temaer (themes)

Dette katalog er **kilden** til de visuelle temaer, som `/website-theme` og
`/website-create-css` kan anvende på et projekt. Et tema er et komplet *skin* (og
evt. en struktur-variant) der implementerer **samme class-kontrakt** som
`/website-build` udsender — princippet er CSS Zen Garden: samme HTML, forskellige
udseender.

> Temaerne her er **katalog/kilde**. Når et tema vælges, **materialiseres** det ind i
> projektets `.website/` (kopieres), så hvert projekt er selvstændigt og portabelt.

## Mappe-layout pr. tema

```
themes/<navn>/
├── styles.css        # KRÆVET. Fuldt side-stylesheet (BRAND-blok + tokens + komponenter).
│                     #   Inlines ordret af /website-build i hver side.
├── portal.html       # VALGFRI. Kun når temaet ændrer portalens STRUKTUR
│                     #   (fx top-nav i stedet for sidebar). Mangler den, bruges
│                     #   den delte html-guide/portal.html (re-farvet via brand-vars).
└── theme.json        # KRÆVET. Metadata: name, label, description, structure,
                      #   preview, brandDefaults (6 farver).
```

`portal.script.js` kan tilføjes, hvis et struktur-tema har behov for et separat
portal-script — men de fleste temaer lægger portal-JS direkte i deres `portal.html`.
Side-scriptet (`html-guide/script.js`) er **delt** og inlines uændret af `/website-build`.

## Class-kontrakt (skal holdes i ALLE temaers styles.css)

Alle temaer skal style nøjagtigt de klasser `/website-build` udsender — uændrede navne:

`header`/`.header-badge`/`.header-pills`/`.pill`, `.container`, `nav.toc`,
`.section`/`.section-header`/`.section-icon`, `h2`–`h4`, `.steps`/`.sub-steps`,
`.note`, `.info-box`, `<table>`/`thead`/`tbody`/`.num`, `.badge-ok`/`.status-tag`/`.type-tag`/`.day-tag`,
`dl.tech`, `<details>`/`<summary>`, `.flowchart`/`.fc-node`(`.start`/`.decision`/`.action`/`.end`)/`.fc-arrow`,
`.sysflow*`, `code`/`pre`, og de JS-injicerede `.toc a.active`/`.copy-btn`/`.expand-all-btn`/`.to-top-btn`/`.reading-progress`/`.doc-search`/`mark.search-hit`/`.js-fx .section`.

**Kritisk step-regel (alle temaer):** brug **aldrig** `display:flex` på selve `<li>` i
`.steps`/`.sub-steps` (det kollapser et flerlinjet trin til ét ord pr. linje). Brug
blok-flow + en absolut-placeret nummer-/pile-markør, og scop reglerne med
child-combinator (`.steps > li`, ikke `.steps li`), så nestede `.sub-steps` ikke arver markøren.

Alle struktur-temaers `portal.html` skal bevare markørerne `BRAND:START/END`,
`NAV:START/END`, `LOCALES:START/END` og pladsholderne `{{SITE_TITLE}}` (×3) og
`{{SITE_BADGE}}`, så `/website-update-index` kan udfylde dem uændret.

## Temaer

| Navn | Type | Look |
|---|---|---|
| `classic` | sidebar | Blå gradient-header, hvide afrundede kort. Baseline (≡ styles-default.css). |
| `minimal` | sidebar | Monokrom, tæt, hårfine streger, flad lille header (Stripe/Linear-docs). |
| `editorial` | sidebar | Serif display-overskrifter, papir-baggrund, smal læsespalte (magasin). |
| `bold` | sidebar | Gradient-hero, runde knapper, store kort m. skygge, høj kontrast. |
| `landing` | top-nav | **Struktur-variant**: hero-forside + vandret top-nav + iframe (egen portal.html). |
| `review` | sidebar | Navy + guld ledelses-look til **kode-review-rapporter** (`/al-code-review`): exec-summary, verdict-banner, RAG-status-dashboard (scorecards + KPI-fliser) og full-bleed/breakout-billeder. |

Tilføj et nyt tema ved at oprette `themes/<navn>/` med `styles.css` + `theme.json`
(og `portal.html` hvis strukturen afviger). Det dukker automatisk op i `/website-theme`.
