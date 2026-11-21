'use strict';
// Composes the LinkedIn post-2 mockups from two live screenshots (/tmp/desk.png, /tmp/phone.png): a portrait hero and the 1200x627 link-preview card.
const fs = require('fs'), path = require('path'), os = require('os');
const pw = require(path.join(os.homedir(), 'dev/salesday-rel1359/node_modules/playwright'));
const QR = require(path.join(os.homedir(), 'dev/salesday-rel1359/node_modules/qrcode'));
const LINK = 'https://mission-control-production-f6bba4c5.up.railway.app/?utm_source=linkedin';
const R = path.join(__dirname, '..'), OUT = path.join(__dirname, 'images');
const u = (p) => 'file://' + p;
const fonts = `@font-face{font-family:Quicksand;font-weight:400 700;src:url(${u(R + '/public/fonts/quicksand-latin.woff2')}) format('woff2')}@font-face{font-family:"Codec Pro";font-weight:400;src:url(${u(R + '/public/fonts/codec-pro-regular.woff2')}) format('woff2')}`;
const bg = `radial-gradient(1100px 700px at 8% -6%,rgba(86,160,125,.34),transparent 62%),radial-gradient(800px 640px at 105% 8%,rgba(168,230,216,.12),transparent 60%),linear-gradient(165deg,#0F1B14,#070D0A 64%)`;
const wm = u(R + '/public/brand/salesday-wordmark-reversed.svg');
const laptop = (w, src) => `<div style="width:${w}px;filter:drop-shadow(0 40px 60px rgba(0,0,0,.55))"><div style="background:#1b1f1d;border-radius:22px 22px 8px 8px;padding:${w * .014}px ${w * .014}px ${w * .02}px"><div style="border-radius:10px;overflow:hidden;line-height:0"><img src="${src}" style="width:100%;display:block"></div></div><div style="height:${w * .026}px;margin:0 -${w * .03}px;background:linear-gradient(#c9ceca,#8f9692);border-radius:0 0 18px 18px"></div></div>`;
const phone = (w, src) => `<div style="width:${w}px;background:#111;border-radius:${w * .15}px;padding:${w * .035}px;filter:drop-shadow(0 30px 50px rgba(0,0,0,.6));box-shadow:0 0 0 2px #2a2f2c inset"><div style="border-radius:${w * .12}px;overflow:hidden;line-height:0"><img src="${src}" style="width:100%;display:block"></div></div>`;
const base = `${fonts}*{box-sizing:border-box}html,body{margin:0}body{font-family:Quicksand,"Avenir Next",sans-serif;color:#EAF3EE;background:${bg};overflow:hidden;position:relative}h1{margin:0;font-family:"Codec Pro",Quicksand,sans-serif;font-weight:400;letter-spacing:-.01em;line-height:1.04}.pill{white-space:nowrap;display:inline-block;padding:16px 30px;border-radius:999px;background:#E8E28C;color:#1B2210;font-weight:600;font-size:30px}.live{display:inline-flex;align-items:center;gap:10px;font-size:24px;color:#A8E6D8;font-weight:600;letter-spacing:.12em;text-transform:uppercase}.live i{width:14px;height:14px;border-radius:50%;background:#7FE0B0;box-shadow:0 0 0 6px rgba(127,224,176,.25)}`;
const load = async (page, html) => { const f = path.join(OUT, '_tmp.html'); fs.writeFileSync(f, '<!doctype html><meta charset="utf-8">' + html); await page.goto('file://' + f); };
(async () => {
  const qrSvg = (await QR.toString(LINK, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#0F1B14', light: '#FFFFFF' } })).replace('<svg ', '<svg style="width:100%;height:100%;display:block" ');
  await QR.toFile(path.join(OUT, 'qr-mission-control-1200.png'), LINK, { width: 1200, margin: 3, errorCorrectionLevel: 'M', color: { dark: '#0F1B14', light: '#FFFFFF' } });
  const b = await pw.chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  await load(p, `<style>${base}body{width:1080px;height:1350px;padding:76px 80px}</style>
  <img src="${wm}" style="height:44px;display:block"><div class="live" style="margin-top:46px"><i></i>Live right now</div>
  <h1 style="font-size:92px;margin-top:20px">Watch an AI team build a product. Live.</h1>
  <div style="position:absolute;left:60px;top:430px">${laptop(860, u('/tmp/desk.png'))}</div>
  <div style="position:absolute;right:56px;top:520px">${phone(250, u('/tmp/phone.png'))}</div>
  <div style="position:absolute;left:80px;bottom:70px;right:80px;display:flex;align-items:center;gap:34px"><div style="width:220px;height:220px;flex:none;background:#fff;border-radius:28px;padding:16px;box-shadow:0 20px 40px rgba(0,0,0,.45)">${qrSvg}</div><div><div style="font-family:'Codec Pro',Quicksand,sans-serif;font-size:50px;line-height:1.05">Scan to open it live</div><div style="margin-top:12px;font-size:21px;line-height:1.35;color:#A9BDB2;font-weight:500">mission-control-production-<br>f6bba4c5.up.railway.app</div></div></div></div>`);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(OUT, 'post2-hero-1080x1350.jpg'), type: 'jpeg', quality: 93 });
  const q = await b.newPage({ viewport: { width: 1200, height: 627 }, deviceScaleFactor: 2 });
  await load(q, `<style>${base}body{width:1200px;height:627px;padding:56px 64px}</style>
  <img src="${wm}" style="height:38px;display:block"><div class="live" style="margin-top:34px;font-size:20px"><i style="width:11px;height:11px"></i>Live now</div>
  <h1 style="font-size:64px;margin-top:14px;width:520px">An AI team at work. Live.</h1>
  <p style="font-size:26px;color:#A9BDB2;font-weight:500;width:470px;margin:20px 0 0">Who is working, whose turn it is, what is blocked and when the release lands.</p>
  <div style="position:absolute;right:-70px;top:96px">${laptop(700, u('/tmp/desk.png'))}</div>
  <div style="position:absolute;right:46px;top:300px">${phone(150, u('/tmp/phone.png'))}</div>`);
  await q.evaluate(() => document.fonts.ready); await q.waitForTimeout(500);
  await q.screenshot({ path: path.join(OUT, 'post2-link-card-1200x627.jpg'), type: 'jpeg', quality: 93 });
  fs.copyFileSync(path.join(OUT, 'post2-link-card-1200x627.jpg'), path.join(R, 'public', 'og-image.jpg'));
  await b.close(); console.log(fs.readdirSync(OUT).join('\n'));
})();
