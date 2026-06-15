#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build_pages.py — wrap Claude-authored bodies into standalone html-guide pages.

Used by the /html-guide command's MULTI-PAGE mode (one HTML per topic, written into
a .website language folder for /update-website to stitch into a portal).

This helper does ONLY the mechanical wrapping that is identical on every page:
  * inline the chosen stylesheet (.website/styles.css, else sibling styles-default.css)
    and the sibling script.js — VERBATIM, so the canonical CSS/JS never drift,
  * build each page's `<nav class="toc">` from its `.section` headers,
  * compute the relative favicon path from the page's depth under .website/,
  * write each page to .website/<locale>/<group>/<file>.

The actual content — curating, translating, splitting source markdown into per-page
bodies — is authored by Claude, NOT by this script. Claude writes each page body
(just the `.section` cards) plus a small JSON manifest, then runs:

    python build_pages.py <manifest.json>

Manifest format (JSON, UTF-8):
{
  "website":      "<abs path to the .website folder>",   // required
  "locale":       "da-DK",                                // required; pages go under <website>/<locale>/
  "footer":       "<inner HTML of <footer>>",            // optional
  "lang":         "da",                                   // optional, default "da"  (<html lang>)
  "motion":       true,                                   // optional, default true; sets <body class="fx"> (scroll-reveal)
  "title_suffix": " · My Product",                       // optional, appended to <title>
  "pages": [
    {
      "group":    "2. Opsætning",        // subfolder under <locale>; "" → directly in <locale>
      "file":     "1-foo.html",          // output filename
      "title":    "Foo",                 // <h1> + <title>
      "badge":    "Opsætning",           // header badge (optional, defaults to group/locale)
      "subtitle": "Kort beskrivelse.",   // header <p> (optional)
      "pills":    ["A", "B"],            // header pills (optional)
      "body":     "<div class=\"section\" id=\"x\">…</div>",   // inline body, OR
      "body_file":"bodies/foo.html"      // path to a file holding the body (relative to manifest, or abs)
    }
  ]
}

Provide EITHER "body" or "body_file" per page (body_file is recommended for large
content to avoid JSON escaping). The body is the inner markup that goes inside
`<div class="container">` after the TOC — typically a series of
`<div class="section" id="…"><div class="section-header"><div class="section-icon">…</div>
<h2>…</h2></div> … </div>` cards. The per-page TOC is derived from those h2 headers.
"""
import json
import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

FONTS = (
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />\n'
    '  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />'
)

DEFAULT_FOOTER = "<strong>Dokumentation</strong>"

SKELETON = """<!DOCTYPE html>
<html lang="@@LANG@@">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>@@TITLE@@@@TITLE_SUFFIX@@</title>
@@FAVICON@@
  @@FONTS@@
  <style>
@@CSS@@
  </style>
</head>
<body@@BODYCLASS@@>
  <header>
    @@BADGE@@
    <h1>@@H1@@</h1>
    @@SUBTITLE@@
    @@PILLS@@
  </header>
  <div class="container">
    <nav class="toc">
      <h2>@@TOC_TITLE@@</h2>
      <ol>
@@TOC@@
      </ol>
    </nav>
@@BODY@@
  </div>
  <footer>@@FOOTER@@</footer>
  <script>
@@JS@@
  </script>
</body>
</html>
"""

# Matches a section card header so we can build the per-page table of contents.
SECTION_RE = re.compile(
    r'<div class="section" id="([^"]+)">\s*<div class="section-header">\s*'
    r'<div class="section-icon">[^<]*</div>\s*<h2>(.*?)</h2>',
    re.S,
)


def read_text(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def resolve_css(website):
    project = os.path.join(website, "styles.css")
    if os.path.isfile(project):
        return read_text(project)
    fallback = os.path.join(SCRIPT_DIR, "styles-default.css")
    return read_text(fallback)


def build_toc(body, toc_title):
    items = []
    for m in SECTION_RE.finditer(body):
        anchor = m.group(1)
        label = re.sub(r"<[^>]+>", "", m.group(2)).strip()
        items.append('        <li><a href="#%s">%s</a></li>' % (anchor, label))
    return "\n".join(items)


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: python build_pages.py <manifest.json>")
    manifest_path = os.path.abspath(sys.argv[1])
    manifest_dir = os.path.dirname(manifest_path)
    cfg = json.loads(read_text(manifest_path))

    website = os.path.abspath(cfg["website"])
    locale = cfg["locale"]
    lang = cfg.get("lang", "da")
    title_suffix = cfg.get("title_suffix", "")
    footer = cfg.get("footer", DEFAULT_FOOTER)
    toc_title = cfg.get("toc_title", "På denne side")
    # Motion (animated diagrams need only CSS; scroll-reveal needs <body class="fx">).
    bodyclass = ' class="fx"' if cfg.get("motion", True) else ""

    css = resolve_css(website)
    js = read_text(os.path.join(SCRIPT_DIR, "script.js"))
    has_favicon = os.path.isfile(os.path.join(website, "favicon.svg"))

    locale_dir = os.path.join(website, locale)
    written = []

    for page in cfg["pages"]:
        group = page.get("group", "")
        fname = page["file"]
        title = page["title"]
        badge = page.get("badge", group or locale)
        subtitle = page.get("subtitle", "")
        pills = page.get("pills", [])

        if "body" in page:
            body = page["body"]
        else:
            bf = page["body_file"]
            if not os.path.isabs(bf):
                bf = os.path.join(manifest_dir, bf)
            body = read_text(bf)

        # depth from page to .website/: <locale>/<group>/file -> 2, <locale>/file -> 1
        depth = 2 if group else 1
        favicon = ""
        if has_favicon:
            favicon = '  <link rel="icon" type="image/svg+xml" href="%sfavicon.svg" />' % ("../" * depth)

        badge_html = '<div class="header-badge">%s</div>' % badge if badge else ""
        subtitle_html = "<p>%s</p>" % subtitle if subtitle else ""
        pills_html = ""
        if pills:
            pills_html = '<div class="header-pills">%s</div>' % "".join(
                '<span class="pill">%s</span>' % p for p in pills
            )

        html = (
            SKELETON
            .replace("@@LANG@@", lang)
            .replace("@@BODYCLASS@@", bodyclass)
            .replace("@@TITLE@@", title)
            .replace("@@TITLE_SUFFIX@@", title_suffix)
            .replace("@@FAVICON@@", favicon)
            .replace("@@FONTS@@", FONTS)
            .replace("@@CSS@@", css)
            .replace("@@BADGE@@", badge_html)
            .replace("@@H1@@", title)
            .replace("@@SUBTITLE@@", subtitle_html)
            .replace("@@PILLS@@", pills_html)
            .replace("@@TOC_TITLE@@", toc_title)
            .replace("@@TOC@@", build_toc(body, toc_title))
            .replace("@@BODY@@", body.strip("\n"))
            .replace("@@FOOTER@@", footer)
            .replace("@@JS@@", js)
        )

        out_dir = os.path.join(locale_dir, group) if group else locale_dir
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, fname)
        with open(out_path, "w", encoding="utf-8") as fh:
            fh.write(html)
        rel = os.path.join(group, fname) if group else fname
        written.append(rel)
        print("wrote", os.path.join(locale, rel))

    print("\n%d page(s) written to %s" % (len(written), locale_dir))
    if not has_favicon:
        print("note: %s/favicon.svg not found — <link rel=icon> omitted (run /init-website)" % website)


if __name__ == "__main__":
    main()
