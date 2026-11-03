// Builds assets/Portfolio-Rizka-Ayu-Dwi-Sugiharto.pdf (full, from index.html @media print)
// and assets/Portfolio-Summary-Rizka-Ayu-Dwi-Sugiharto.pdf (3 pages, from tools/portfolio-summary.html).
// Usage (needs Node.js + Playwright):  node tools/build-portfolio-pdf.mjs
// Afterwards bump the ?v= number on the Portfolio PDF links in index.html.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'assets', 'Portfolio-Rizka-Ayu-Dwi-Sugiharto.pdf');
const LIVE = 'https://rizkaayudwisugiharto27-hue.github.io/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'networkidle' });
// Load lazy images and show all animated content before printing
await page.evaluate(async () => {
  document.querySelectorAll('img[loading="lazy"]').forEach(img => (img.loading = 'eager'));
  await Promise.all([...document.images].map(img => img.complete ? null : new Promise(r => { img.onload = img.onerror = r; })));
  window.dispatchEvent(new Event('beforeprint'));
}, null);
// Point every relative link (CV, live demo, sections) at the live website so they work inside the PDF
await page.evaluate(live => {
  document.querySelectorAll('a[href]').forEach(a => {
    const h = a.getAttribute('href');
    if (!/^(https?:|mailto:|tel:)/.test(h)) a.setAttribute('href', new URL(h, live).href);
  });
}, LIVE);
await page.emulateMedia({ media: 'print' });
await page.waitForTimeout(500);
await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true, scale: 0.8 });
// Short 3-page summary from tools/portfolio-summary.html
const outSummary = path.join(root, 'assets', 'Portfolio-Summary-Rizka-Ayu-Dwi-Sugiharto.pdf');
const sp = await browser.newPage();
await sp.goto(pathToFileURL(path.join(root, 'tools', 'portfolio-summary.html')).href, { waitUntil: 'networkidle' });
await sp.pdf({ path: outSummary, format: 'A4', printBackground: true, preferCSSPageSize: true });
// 1-page CV from tools/cv.html
const outCv = path.join(root, 'assets', 'CV-Rizka-Ayu-Dwi-Sugiharto.pdf');
const cp = await browser.newPage();
await cp.goto(pathToFileURL(path.join(root, 'tools', 'cv.html')).href, { waitUntil: 'networkidle' });
await cp.pdf({ path: outCv, format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log('Saved', out);
console.log('Saved', outCv);
console.log('Saved', outSummary);
