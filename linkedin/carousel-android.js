'use strict';
// Builds the Android carousel: a cover, the ten screens (already 1080x1350 posts) and a closing slide, as one PDF plus the cover and closing JPEGs.
const fs = require('fs'), path = require('path'), os = require('os');
const pw = require(path.join(os.homedir(), 'dev/salesday-rel1359/node_modules/playwright'));
const R = path.join(__dirname, '..'), PH = path.join(os.homedir(), 'dev/_ops-scripts/mobile/export'), OUT = path.join(__dirname, 'ready', 'POST-A-android-carousel');
fs.mkdirSync(OUT, { recursive: true });
const u = (p) => 'file://' + p;
const fonts = `@font-face{font-family:Quicksand;font-weight:400 700;src:url(${u(R + '/public/fonts/quicksand-latin.woff2')}) format('woff2')}@font-face{font-family:"Codec Pro";font-weight:400;src:url(${u(R + '/public/fonts/codec-pro-regular.woff2')}) format('woff2')}`;
const bg = `radial-gradient(1100px 700px at 8% -6%,rgba(86,160,125,.34),transparent 62%),radial-gradient(800px 640px at 105% 8%,rgba(168,230,216,.12),transparent 60%),linear-gradient(165deg,#0F1B14,#070D0A 64%)`;
const wm = u(R + '/public/brand/salesday-wordmark-reversed.svg');
const names = ['01-today', '02-signin', '03-contact-card', '04-call-outcome', '05-offline-outbox', '06-notifications', '07-meetings', '08-card-capture', '09-voice-note', '10-widget-dark'];
const files = fs.readdirSync(PH).filter((f) => /^post-\d\d-.*\.jpg$/.test(f)).sort();
const css = `${fonts}@page{size:1080px 1350px;margin:0}*{box-sizing:border-box}html,body{margin:0;background:#070D0A}.s{position:relative;width:1080px;height:1350px;overflow:hidden;page-break-after:always;break-after:page;font-family:Quicksand,"Avenir Next",sans-serif;color:#EAF3EE;padding:76px 80px;display:flex;flex-direction:column;background:${bg}}
.top{display:flex;justify-content:space-between;align-items:center;height:56px;flex:none}.top img{height:44px}.top span{font-size:24px;color:#A9BDB2;letter-spacing:.04em}
.k{font-size:26px;letter-spacing:.14em;text-transform:uppercase;color:#A8E6D8;font-weight:600}h1{margin:16px 0 0;font-family:"Codec Pro",Quicksand,sans-serif;font-weight:400;font-size:98px;line-height:1.03;letter-spacing:-.015em}p{margin:20px 0 0;font-size:34px;color:#A9BDB2;font-weight:500;max-width:820px}
.mid{flex:1;display:flex;align-items:center;justify-content:center;gap:26px;min-height:0}.mid img{height:640px;display:block}.foot{flex:none;height:50px;display:flex;justify-content:space-between;align-items:center;font-size:26px;color:#6E8578;font-weight:500}.sw{color:#E8E28C;font-weight:600}
.img{padding:0;display:block}.img img{width:1080px;height:1350px;display:block}`;
const cover = `<section class="s" id="cover"><div class="top"><img src="${wm}"><span>1 / 12</span></div><div style="margin-top:46px"><div class="k">SalesDay for Android</div><h1>The first ten screens.</h1><p>Designed around one sales rep's day, before a single line of code.</p></div><div class="mid"><img src="${u(PH + '/_phones/01-today.png')}" style="height:600px"><img src="${u(PH + '/_phones/02-signin.png')}" style="height:600px"><img src="${u(PH + '/_phones/03-contact-card.png')}" style="height:600px"></div><div class="foot"><span>Design preview, not a release</span><span class="sw">Swipe &rarr;</span></div></section>`;
const mids = files.map((f) => `<section class="s img"><img src="${u(PH + '/' + f)}"></section>`).join('');
const end = `<section class="s" id="end"><div class="top"><img src="${wm}"><span>12 / 12</span></div><div style="flex:1;display:flex;flex-direction:column;justify-content:center"><div class="k">Your turn</div><h1>Which screen would you open first?</h1><p>One thing a sales app must do well on a phone: tell me in the comments.</p><p style="margin-top:44px;color:#EAF3EE;font-weight:600">Follow for the build, one release at a time.</p></div><div class="foot"><span>SalesDay for Android</span><span class="sw">Design preview</span></div></section>`;
(async () => {
  const b = await pw.chromium.launch();
  const tmp = path.join(OUT, '_tmp.html'); fs.writeFileSync(tmp, `<!doctype html><meta charset="utf-8"><style>${css}</style>${cover}${mids}${end}`);
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200);
  for (const id of ['cover', 'end']) await (await p.$('#' + id)).screenshot({ path: path.join(OUT, id === 'cover' ? 'slide-01-cover.jpg' : 'slide-12-closing.jpg'), type: 'jpeg', quality: 93 });
  await p.pdf({ path: path.join(OUT, 'SalesDay-Android-carousel.pdf'), width: '1080px', height: '1350px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  fs.rmSync(tmp); await b.close(); console.log(fs.readdirSync(OUT).join('\n'));
})();
