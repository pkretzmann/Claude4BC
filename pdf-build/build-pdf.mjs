// ============================================================
//  c4bc · build-pdf
//  Genererer EN samlet PDF-brugervejledning pr. sprog ud af HTML-siderne
//  i et .website-dokumentationssite — forside + indholdsfortegnelse (med
//  sidetal) + alle indholdssider i samme kapitelrækkefølge som portalen
//  (læst fra NAV-arrayet i <sprog>/index.html).
//
//  Projekt-agnostisk: brandfarver læses fra .website/styles.css, titlen fra
//  portalens <title>, og logoet fra .website/favicon.svg. Virker for alle
//  sprogmapper (da-DK, en-US, …) der har et NAV-array.
//
//  Rendering: headless Chromium (Playwright, honorerer @media print).
//  Fletning + sidetal: pdf-lib.
//
//  Brug:
//    node build-pdf.mjs --website "<sti til .website>" [--locale da-DK] \
//         [--title "…"] [--subtitle "…"] [--date "…"] [--output "Navn.pdf"]
//
//  Uden --locale bygges ALLE sprogmapper der har et NAV-array.
//  Output pr. sprog: <.website>/<sprog>/<output>  (default lokaliseret navn)
// ============================================================

import { chromium } from 'playwright';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { pathToFileURL } from 'node:url';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

// ---- Argumenter --------------------------------------------
function parseArgs(argv) {
  const a = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith('--')) { a[k.slice(2)] = (argv[i + 1] && !argv[i + 1].startsWith('--')) ? argv[++i] : true; }
  }
  return a;
}
const ARGS = parseArgs(process.argv);

// ---- Sprog-tekster -----------------------------------------
const I18N = {
  'da-DK': { toc: 'Indholdsfortegnelse', guide: 'Brugervejledning', generated: 'Genereret', badge: 'Komplet dokumentation', out: 'Brugervejledning.pdf' },
  'en-US': { toc: 'Table of Contents', guide: 'User Guide', generated: 'Generated', badge: 'Complete documentation', out: 'User Guide.pdf' },
};
const tr = (loc) => I18N[loc] || { ...I18N['en-US'] };

const PAGE = { format: 'A4', margin: { top: '16mm', bottom: '18mm', left: '15mm', right: '15mm' } };
const FALLBACK_BRAND = { dark: '#1F3A5B', mid: '#28608F', light: '#4A9AC8', pale: '#E6EEF5' };

const esc = (s) => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// ---- Find .website -----------------------------------------
async function findWebsite() {
  if (ARGS.website) return path.resolve(ARGS.website);
  // Søg opad fra cwd efter en .website-mappe.
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const cand = path.join(dir, '.website');
    try { if ((await stat(cand)).isDirectory()) return cand; } catch {}
    const up = path.dirname(dir);
    if (up === dir) break; dir = up;
  }
  throw new Error('Kunne ikke finde en .website-mappe. Angiv den med --website "<sti>".');
}

// ---- Brandfarver fra styles.css ----------------------------
async function readBrand(website) {
  try {
    const css = await readFile(path.join(website, 'styles.css'), 'utf8');
    const pick = (name, fb) => (css.match(new RegExp('--brand-' + name + '\\s*:\\s*(#[0-9a-fA-F]{3,8})')) || [])[1] || fb;
    return { dark: pick('dark', FALLBACK_BRAND.dark), mid: pick('mid', FALLBACK_BRAND.mid), light: pick('light', FALLBACK_BRAND.light), pale: pick('pale', FALLBACK_BRAND.pale) };
  } catch { return { ...FALLBACK_BRAND }; }
}

// ---- NAV-array fra <locale>/index.html ---------------------
async function readNav(indexPath) {
  let html;
  try { html = await readFile(indexPath, 'utf8'); } catch { return null; }
  const m = html.match(/const\s+NAV\s*=\s*(\[[\s\S]*?\n\]);/);
  if (!m) return null;
  return Function(`"use strict"; return (${m[1]});`)();
}
async function readPortalTitle(indexPath) {
  try { const html = await readFile(indexPath, 'utf8'); return (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.trim() || ''; } catch { return ''; }
}

// ---- HTML: forside + TOC -----------------------------------
function coverHtml({ brand, faviconUri, title, subtitle, badge, generated, dateStr }) {
  return `<!doctype html><html><head><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>@page{size:A4;margin:0}html,body{margin:0;height:100%;font-family:'Inter',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .cover{height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;
    background:linear-gradient(135deg,${brand.dark} 0%,${brand.mid} 60%,${brand.light} 100%);color:#fff;padding:0 40px}
  .logo{width:96px;height:96px;margin-bottom:28px}h1{font-size:42px;font-weight:700;letter-spacing:-1px;margin:0 0 12px}
  .sub{font-size:19px;font-weight:300;opacity:.9;margin:0 0 32px}
  .badge{border:1px solid rgba(255,255,255,.4);border-radius:24px;padding:7px 20px;font-size:13px;letter-spacing:.5px;text-transform:uppercase;font-weight:500}
  .date{position:absolute;bottom:40px;font-size:13px;opacity:.8}</style></head>
  <body><div class="cover">
    ${faviconUri ? `<img class="logo" src="${faviconUri}" alt="">` : ''}
    <h1>${esc(title)}</h1>
    <p class="sub">${esc(subtitle)}</p>
    <span class="badge">${esc(badge)}</span>
    <div class="date">${esc(generated)} ${esc(dateStr)}</div>
  </div></body></html>`;
}

function tocHtml({ brand, heading, nav, pageNumbers }) {
  let rows = '', i = 0;
  for (const g of nav) {
    rows += `<div class="grp">${esc(g.group)}</div>`;
    for (const it of g.items) {
      rows += `<div class="row"><span class="t">${esc(it.title)}</span><span class="dots"></span><span class="pg">${pageNumbers ? pageNumbers[i] : ''}</span></div>`;
      i++;
    }
  }
  return `<!doctype html><html><head><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>@page{size:A4;margin:18mm 16mm}body{font-family:'Inter',sans-serif;color:#1A2A38;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  h1{font-size:26px;color:${brand.dark};border-bottom:3px solid ${brand.pale};padding-bottom:12px;margin:0 0 24px}
  .grp{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:${brand.mid};margin:22px 0 8px}
  .row{display:flex;align-items:baseline;font-size:14.5px;margin:6px 0}.t{white-space:nowrap}
  .dots{flex:1;border-bottom:1px dotted #b9bfc5;margin:0 6px;transform:translateY(-3px)}
  .pg{font-variant-numeric:tabular-nums;color:${brand.dark};font-weight:600}</style></head>
  <body><h1>${esc(heading)}</h1>${rows}</body></html>`;
}

// ---- Render HTML(streng/fil) → PDF-buffer ------------------
async function renderToPdf(page, src, { isContent = false, baseDir } = {}) {
  if (typeof src === 'object' && src.url) await page.goto(src.url, { waitUntil: 'networkidle', timeout: 60000 });
  else await page.setContent(src, { waitUntil: 'networkidle', timeout: 60000 });
  await page.emulateMedia({ media: 'print' });
  try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch {}
  return await page.pdf({ format: PAGE.format, printBackground: true, margin: isContent ? PAGE.margin : undefined });
}

// ---- Byg PDF for ét sprog ----------------------------------
async function buildLocale(page, { website, locale, brand, faviconUri, dateStr }) {
  const localeDir = path.join(website, locale);
  const indexPath = path.join(localeDir, 'index.html');
  const nav = await readNav(indexPath);
  if (!nav) { console.log(`  (springer ${locale} over — intet NAV-array)`); return null; }

  const T = tr(locale);
  const suite = (await readPortalTitle(indexPath)) || locale;
  const outName = ARGS.output || T.out;
  const flat = [];
  nav.forEach(g => g.items.forEach(it => flat.push({ ...it, group: g.group })));
  console.log(`Sprog ${locale}: "${suite}" — ${nav.length} kapitler, ${flat.length} sider.`);

  // Forside
  const coverBuf = await renderToPdf(page, coverHtml({
    brand, faviconUri,
    title: ARGS.title || suite,
    subtitle: ARGS.subtitle || `${T.guide} · ${suite}`,
    badge: T.badge, generated: T.generated, dateStr,
  }));
  const coverPages = (await PDFDocument.load(coverBuf)).getPageCount();

  // Indholdssider
  const content = [];
  for (const item of flat) {
    const url = pathToFileURL(path.join(localeDir, item.path)).href;
    const buf = await renderToPdf(page, { url }, { isContent: true });
    content.push({ ...item, buf, count: (await PDFDocument.load(buf)).getPageCount() });
  }

  // TOC — to-pas så sidetal stabiliserer sig
  let tocPages = 1, tocBuf;
  for (let pass = 0; pass < 4; pass++) {
    let abs = coverPages + tocPages + 1;
    const nums = content.map(c => { const n = abs; abs += c.count; return n; });
    tocBuf = await renderToPdf(page, tocHtml({ brand, heading: T.toc, nav, pageNumbers: nums }));
    const tp = (await PDFDocument.load(tocBuf)).getPageCount();
    if (tp === tocPages) break; tocPages = tp;
  }

  // Flet
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);
  const append = async (buf) => { const s = await PDFDocument.load(buf); (await out.copyPages(s, s.getPageIndices())).forEach(p => out.addPage(p)); };
  await append(coverBuf); await append(tocBuf);
  for (const c of content) await append(c.buf);

  // Sidetal (alle undtagen forsiden)
  const pages = out.getPages();
  for (let i = 1; i < pages.length; i++) {
    const { width } = pages[i].getSize();
    const label = `${i + 1} / ${pages.length}`;
    const w = font.widthOfTextAtSize(label, 8.5);
    pages[i].drawText(label, { x: width / 2 - w / 2, y: 14, size: 8.5, font, color: rgb(0.4, 0.4, 0.4) });
  }
  out.setTitle(`${suite} — ${T.guide}`);
  out.setProducer('c4bc build-pdf (Playwright + pdf-lib)');

  const outPath = path.join(localeDir, outName);
  await writeFile(outPath, await out.save());
  console.log(`  ✓ ${outPath}  (${pages.length} sider)`);
  return outPath;
}

// ---- main --------------------------------------------------
async function main() {
  const website = await findWebsite();
  const brand = await readBrand(website);

  // Favicon → data-URI (file:// blokeres under setContent)
  let faviconUri = '';
  try { faviconUri = 'data:image/svg+xml;base64,' + Buffer.from(await readFile(path.join(website, 'favicon.svg'))).toString('base64'); } catch {}

  // Hvilke sprog?
  let locales;
  if (ARGS.locale) locales = [ARGS.locale];
  else {
    locales = [];
    for (const name of await readdir(website)) {
      if (!/^[a-z]{2}-[A-Z]{2}$/.test(name)) continue;
      try { if ((await stat(path.join(website, name))).isDirectory()) locales.push(name); } catch {}
    }
  }
  if (!locales.length) throw new Error('Ingen sprogmapper (fx da-DK) fundet i ' + website);

  // Dato (lokaliseret, fra dags dato — kan overstyres med --date)
  const fmtLoc = ARGS.locale || locales[0] || 'en-US';
  const dateStr = ARGS.date || new Intl.DateTimeFormat(fmtLoc, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  console.log(`.website: ${website}`);
  console.log(`Brandfarver: ${brand.dark} / ${brand.mid} / ${brand.light}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const made = [];
  for (const loc of locales) {
    const p = await buildLocale(page, { website, locale: loc, brand, faviconUri, dateStr });
    if (p) made.push(p);
  }
  await browser.close();

  if (!made.length) throw new Error('Ingen PDF blev dannet (ingen sprogmapper med NAV-array).');
  console.log(`\n✓ Færdig — ${made.length} PDF(er) dannet.`);
}

main().catch(err => { console.error('FEJL:', err.message); process.exit(1); });
