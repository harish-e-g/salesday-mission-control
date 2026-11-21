'use strict';
// GitHub Pages only forwards to the live, hosted mission control. No demo data is published there.
const fs = require('fs'), path = require('path');
const live = process.env.MC_LIVE_URL || 'https://mission-control-production-f6bba4c5.up.railway.app';
const out = path.join(__dirname, '..', 'docs'); fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f !== 'screenshot.png' && f !== 'screenshot-phone.png') fs.rmSync(path.join(out, f), { recursive: true, force: true });
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SalesDay Mission Control</title><meta http-equiv="refresh" content="0; url=${live}"><link rel="canonical" href="${live}"></head><body style="font-family:system-ui;padding:24px"><p>SalesDay Mission Control is live at <a href="${live}">${live}</a>.</p></body></html>`);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('pages built (redirect to ' + live + ')');
