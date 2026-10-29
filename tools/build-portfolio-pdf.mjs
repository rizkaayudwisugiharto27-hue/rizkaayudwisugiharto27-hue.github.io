// Builds assets/Portfolio-Rizka-Ayu-Dwi-Sugiharto.pdf from index.html using its @media print styles.
// Usage (needs Node.js + Playwright):  node tools/build-portfolio-pdf.mjs
// Afterwards bump the ?v= number on the Portfolio PDF links in index.html.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'assets', 'Portfolio-Rizka-Ayu-Dwi-Sugiharto.pdf');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'networkidle' });
// Load lazy images and show all animated content before printing
await page.evaluate(async () => {
  document.querySelectorAll('img[loading="lazy"]').forEach(img => (img.loading = 'eager'));
  await Promise.all([...document.images].map(img => img.complete ? null : new Promise(r => { img.onload = img.onerror = r; })));
  window.dispatchEvent(new Event('beforeprint'));
});
await page.emulateMedia({ media: 'print' });
await page.waitForTimeout(500);
await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true, scale: 0.8 });
await browser.close();
console.log('Saved', out);
