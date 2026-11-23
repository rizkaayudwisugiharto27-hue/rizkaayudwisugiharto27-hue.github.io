// Builds assets/CV-Rizka-Ayu-Dwi-Sugiharto.pdf from tools/cv.html. Run: node tools/build-cv.mjs
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('file://' + path.join(dir, 'cv.html'));
await p.pdf({ path: path.join(dir, '..', 'assets', 'CV-Rizka-Ayu-Dwi-Sugiharto.pdf'), format: 'A4', preferCSSPageSize: true, printBackground: true });
await b.close();
console.log('Saved CV');
