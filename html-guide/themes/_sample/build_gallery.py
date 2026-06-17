#!/usr/bin/env python3
"""Build a theme gallery: render the shared _sample/body.html under every theme.

Each theme in html-guide/themes/<name>/ (with a styles.css + theme.json) is rendered
into a standalone page that inlines that theme's styles.css verbatim plus the shared
html-guide/script.js — exactly the way /website-build assembles a page. An index.html
lets you flip between the themes in an iframe to compare them side by side.

Usage:
    python build_gallery.py [output_dir]

Default output_dir: <repo-root>/.theme-gallery  (a throwaway folder, safe to delete).
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent          # html-guide/themes/_sample
THEMES_DIR = HERE.parent                          # html-guide/themes
HTML_GUIDE = THEMES_DIR.parent                    # html-guide
SCRIPT_JS = HTML_GUIDE / "script.js"
BODY_HTML = HERE / "body.html"

FONT_LINKS = (
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />\n'
    '<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />'
)

PAGE = """<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{title}</title>
{fonts}
<style>
{css}
</style>
</head>
<body class="fx">
{body}
<script>
{js}
</script>
</body>
</html>
"""


def discover_themes():
    themes = []
    for d in sorted(THEMES_DIR.iterdir()):
        if not d.is_dir() or d.name.startswith("_"):
            continue
        meta = d / "theme.json"
        css = d / "styles.css"
        if not (meta.exists() and css.exists()):
            continue
        info = json.loads(meta.read_text(encoding="utf-8"))
        info["_dir"] = d
        themes.append(info)
    return themes


def build():
    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else (HTML_GUIDE.parent / ".theme-gallery")
    out_dir.mkdir(parents=True, exist_ok=True)

    body = BODY_HTML.read_text(encoding="utf-8")
    js = SCRIPT_JS.read_text(encoding="utf-8")
    themes = discover_themes()
    if not themes:
        print("No themes found.")
        return

    for t in themes:
        css = (t["_dir"] / "styles.css").read_text(encoding="utf-8")
        label = t.get("label", t["name"])
        page = PAGE.format(title=f"{label} — tema-demo", fonts=FONT_LINKS, css=css, body=body, js=js)
        (out_dir / f"{t['name']}.html").write_text(page, encoding="utf-8")
        print(f"  wrote {t['name']}.html  ({t.get('structure','?')})")

    write_index(out_dir, themes)
    print(f"\nGallery ready: {out_dir / 'index.html'}")
    print("Serve it with:  python html-guide/serve.py 8770 .theme-gallery")


def write_index(out_dir, themes):
    btns = []
    cards = []
    for i, t in enumerate(themes):
        name = t["name"]
        label = t.get("label", name)
        active = " active" if i == 0 else ""
        btns.append(
            f'<button class="tab{active}" data-src="{name}.html" data-name="{name}" '
            f'data-label="{esc(label)}" data-desc="{esc(t.get("description",""))}" '
            f'data-structure="{esc(t.get("structure",""))}">{esc(label)}</button>'
        )
        cards.append(
            f'<div class="meta-card"><h3>{esc(label)} '
            f'<span class="pill">{esc(t.get("structure",""))}</span></h3>'
            f'<p>{esc(t.get("description",""))}</p></div>'
        )
    first = themes[0]
    index = INDEX.format(
        buttons="\n      ".join(btns),
        cards="\n    ".join(cards),
        first_src=f"{first['name']}.html",
        first_label=esc(first.get("label", first["name"])),
        first_desc=esc(first.get("description", "")),
    )
    (out_dir / "index.html").write_text(index, encoding="utf-8")


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


INDEX = """<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>html-guide — tema-galleri</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  *,*::before,*::after{{box-sizing:border-box;margin:0;padding:0}}
  body{{font-family:'Inter',-apple-system,sans-serif;color:#1A2A38;background:#0E1726;display:flex;flex-direction:column;height:100vh}}
  .bar{{display:flex;align-items:center;gap:14px;padding:12px 20px;background:#0E1726;color:#fff;flex:0 0 auto;flex-wrap:wrap}}
  .bar h1{{font-size:15px;font-weight:800;letter-spacing:.02em;margin-right:8px}}
  .bar h1 span{{color:#5B9BD5}}
  .tabs{{display:flex;gap:6px;flex-wrap:wrap}}
  .tab{{font-family:inherit;font-size:13px;font-weight:600;color:#cdd9e6;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:30px;padding:7px 16px;cursor:pointer;transition:all .12s}}
  .tab:hover{{background:rgba(255,255,255,.16);color:#fff}}
  .tab.active{{background:#fff;color:#0E1726;border-color:#fff}}
  .desc{{font-size:12.5px;color:#9fb2c6;padding:0 20px 10px;background:#0E1726}}
  .desc b{{color:#cdd9e6}}
  .stage{{flex:1;min-height:0;background:#fff;border-top:1px solid rgba(255,255,255,.1)}}
  iframe{{width:100%;height:100%;border:0;display:block}}
</style>
</head>
<body>
  <div class="bar">
    <h1>html-guide · <span>tema-galleri</span></h1>
    <div class="tabs">
      {buttons}
    </div>
  </div>
  <div class="desc" id="desc"><b>{first_label}</b> — {first_desc}</div>
  <div class="stage"><iframe id="frame" src="{first_src}" title="Tema-demo"></iframe></div>
<script>
  var frame = document.getElementById('frame');
  var desc = document.getElementById('desc');
  document.querySelectorAll('.tab').forEach(function (b) {{
    b.addEventListener('click', function () {{
      document.querySelectorAll('.tab').forEach(function (x) {{ x.classList.remove('active'); }});
      b.classList.add('active');
      frame.src = b.dataset.src;
      desc.innerHTML = '<b>' + b.dataset.label + '</b> (' + b.dataset.structure + ') — ' + b.dataset.desc;
    }});
  }});
</script>
</body>
</html>
"""


if __name__ == "__main__":
    build()
