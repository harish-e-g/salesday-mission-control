'use strict';
// Renders carousel/slides.html to one PNG per slide plus a single PDF (LinkedIn carousels are uploaded as a PDF).
// Uses counts-only data from carousel/data.json. Playwright is found next to the SalesDay client or in this repo's node_modules.
const fs = require('fs'), path = require('path'), os = require('os');
const here = __dirname, out = path.join(here, 'out'); fs.mkdirSync(out, { recursive: true });
let pw; for (const p of ['playwright', path.join(os.homedir(), 'dev/salesday-rel1359/node_modules/playwright')]) { try { pw = require(p); break; } catch { /* next */ } }
if (!pw) { console.error('playwright not found'); process.exit(1); }
(async () => {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  const data = JSON.parse(fs.readFileSync(path.join(here, 'data.json'), 'utf8'));
  await page.addInitScript((d) => { window.DATA = d; }, data);
  await page.goto('file://' + path.join(here, 'slides.html'));
  await page.waitForSelector('body[data-ready="1"]'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(600);
  for (let i = 1; i <= 9; i++) await (await page.$('#s' + i)).screenshot({ path: path.join(out, `slide-${String(i).padStart(2, '0')}.png`) });
  await page.pdf({ path: path.join(out, 'SalesDay-Mission-Control-carousel.pdf'), width: '1080px', height: '1350px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await browser.close(); console.log('rendered', fs.readdirSync(out).join(', '));
})();
