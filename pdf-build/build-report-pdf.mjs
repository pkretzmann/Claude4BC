// ============================================================
//  c4bc · build-report-pdf
//  Render ONE self-contained HTML report (e.g. produced by
//  /al-code-review) into a single branded PDF: an optional cover
//  page + the rendered report + page numbers stamped in the footer.
//
//  Unlike build-pdf.mjs (which walks a .website portal's NAV array
//  across locale folders), this takes a single HTML file and is
//  document-oriented — ideal for an executive code-review report.
//
//  Brand colours are read from the HTML's own inlined :root block,
//  the title from its <title>. Rendering: headless Chromium
//  (Playwright, honours @media print). Cover + page numbers: pdf-lib.
//
//  Usage:
//    node build-report-pdf.mjs --html "<path/to/report.html>" \
//         [--out "<path/to/report.pdf>"] [--no-cover] \
//         [--title "…"] [--subtitle "…"] [--badge "…"] \
//         [--date "…"] [--logo "<path/to/logo.svg>"]
// ============================================================

import { chromium } from 'playwright';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { pathToFileURL } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// ---- Arguments ---------------------------------------------
function parseArgs(argv) {
  const a = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith('--')) { a[k.slice(2)] = (argv[i + 1] && !argv[i + 1].startsWith('--')) ? argv[++i] : true; }
  }
  return a;
}
const ARGS = parseArgs(process.argv);

const PAGE = { format: 'A4', margin: { top: '16mm', bottom: '18mm', left: '15mm', right: '15mm' } };
const FALLBACK_BRAND = { dark: '#1B2A41', mid: '#324A6D', light: '#5C7CA8', pale: '#E8EDF4' };

const esc = (s) => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// ---- Read brand colours from the report's inlined :root ----
function readBrandFromHtml(html) {
  const pick = (name, fb) => (html.match(new RegExp('--brand-' + name + '\\s*:\\s*(#[0-9a-fA-F]{3,8})')) || [])[1] || fb;
  return {
    dark: pick('dark', FALLBACK_BRAND.dark),
    mid: pick('mid', FALLBACK_BRAND.mid),
    light: pick('light', FALLBACK_BRAND.light),
    pale: pick('pale', FALLBACK_BRAND.pale),
  };
}
const readTitle = (html) => (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.trim() || '';

// ---- Cover page HTML ---------------------------------------
function coverHtml({ brand, logoUri, title, subtitle, badge, dateStr }) {
  return `<!doctype html><html><head><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>@page{size:A4;margin:0}html,body{margin:0;height:100%;font-family:'Inter',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .cover{height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;
    background:linear-gradient(135deg,${brand.dark} 0%,${brand.mid} 60%,${brand.light} 100%);color:#fff;padding:0 48px;position:relative}
  .logo{width:92px;height:92px;margin-bottom:30px}
  h1{font-size:40px;font-weight:700;letter-spacing:-1px;margin:0 0 14px;max-width:18ch}
  .sub{font-size:18px;font-weight:300;opacity:.9;margin:0 0 34px;max-width:40ch}
  .badge{border:1px solid rgba(255,255,255,.45);border-radius:24px;padding:7px 22px;font-size:12.5px;letter-spacing:.6px;text-transform:uppercase;font-weight:600}
  .date{position:absolute;bottom:44px;font-size:13px;opacity:.85}</style></head>
  <body><div class="cover">
    ${logoUri ? `<img class="logo" src="${logoUri}" alt="">` : ''}
    <h1>${esc(title)}</h1>
    ${subtitle ? `<p class="sub">${esc(subtitle)}</p>` : ''}
    ${badge ? `<span class="badge">${esc(badge)}</span>` : ''}
    <div class="date">${esc(dateStr)}</div>
  </div></body></html>`;
}

// ---- Render HTML (string or {url}) → PDF buffer ------------
async function renderToPdf(page, src, { isContent = false } = {}) {
  if (typeof src === 'object' && src.url) await page.goto(src.url, { waitUntil: 'networkidle', timeout: 60000 });
  else await page.setContent(src, { waitUntil: 'networkidle', timeout: 60000 });
  await page.emulateMedia({ media: 'print' });
  try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch {}
  return await page.pdf({ format: PAGE.format, printBackground: true, margin: isContent ? PAGE.margin : undefined });
}

async function main() {
  if (!ARGS.html) throw new Error('Angiv rapport-HTML med --html "<sti>".');
  const htmlPath = path.resolve(ARGS.html);
  const html = await readFile(htmlPath, 'utf8');
  const brand = readBrandFromHtml(html);
  const title = ARGS.title || readTitle(html) || 'Code Review';
  const withCover = ARGS['no-cover'] !== true;

  // Optional logo → data-URI (file:// is blocked under setContent)
  let logoUri = '';
  if (ARGS.logo) {
    try { logoUri = 'data:image/svg+xml;base64,' + Buffer.from(await readFile(path.resolve(ARGS.logo))).toString('base64'); } catch {}
  }

  const dateStr = ARGS.date || new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const outPath = ARGS.out ? path.resolve(ARGS.out) : htmlPath.replace(/\.html?$/i, '.pdf');

  console.log(`Report:  ${htmlPath}`);
  console.log(`Brand:   ${brand.dark} / ${brand.mid} / ${brand.light}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Cover (optional)
  let coverBuf = null, coverPages = 0;
  if (withCover) {
    coverBuf = await renderToPdf(page, coverHtml({
      brand, logoUri, title,
      subtitle: ARGS.subtitle || 'Technical Code Review',
      badge: ARGS.badge || 'Confidential',
      dateStr,
    }));
    coverPages = (await PDFDocument.load(coverBuf)).getPageCount();
  }

  // Report body (rendered from file:// so any relative assets resolve)
  const bodyBuf = await renderToPdf(page, { url: pathToFileURL(htmlPath).href }, { isContent: true });
  await browser.close();

  // Merge
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);
  const append = async (buf) => { const s = await PDFDocument.load(buf); (await out.copyPages(s, s.getPageIndices())).forEach(p => out.addPage(p)); };
  if (coverBuf) await append(coverBuf);
  await append(bodyBuf);

  // Page numbers on every page except the cover
  const pages = out.getPages();
  for (let i = coverPages; i < pages.length; i++) {
    const { width } = pages[i].getSize();
    const label = `${i + 1} / ${pages.length}`;
    const w = font.widthOfTextAtSize(label, 8.5);
    pages[i].drawText(label, { x: width / 2 - w / 2, y: 14, size: 8.5, font, color: rgb(0.4, 0.4, 0.4) });
  }
  out.setTitle(title);
  out.setProducer('c4bc build-report-pdf (Playwright + pdf-lib)');

  await writeFile(outPath, await out.save());
  console.log(`  ✓ ${outPath}  (${pages.length} sider)`);
}

main().catch(err => { console.error('FEJL:', err.message); process.exit(1); });
