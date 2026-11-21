'use strict';
// Publishes a masked snapshot of this machine's mission-control state to the hosted copy, so a public URL shows live data.
// Reads mission.config.json (git-ignored): { "publish": { "url": "https://...", "maskTerms": ["..."] } }. The shared secret lives in
// ~/.config/salesday-mission-control/token (mode 600) or the MC_INGEST_TOKEN variable, never in the repo.
const fs = require('fs'), os = require('os'), path = require('path');
const { state, liveSample, cfg } = require(path.join(__dirname, '..', 'server.js'));
const { makeMasker, maskDeep } = require(path.join(__dirname, '..', 'lib', 'redact.js'));
const pub = cfg.publish || {};
const url = (process.env.MC_PUBLISH_URL || pub.url || '').replace(/\/$/, '');
const tokenFile = path.join(os.homedir(), '.config', 'salesday-mission-control', 'token');
const token = process.env.MC_INGEST_TOKEN || (fs.existsSync(tokenFile) ? fs.readFileSync(tokenFile, 'utf8').trim() : '');
if (!url || !token) { console.error('Set publish.url in mission.config.json and put the token in ' + tokenFile); process.exit(1); }
const mask = makeMasker(pub.maskTerms || []);
let n = 0, fails = 0;
async function push() {
  try {
    const body = { live: liveSample() };
    if (n % 3 === 0) { const s = maskDeep(state(), mask); s.owner = ''; body.state = s; }
    n++;
    const r = await fetch(url + '/ingest', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    if (fails) console.log(new Date().toISOString(), 'publishing again'); fails = 0;
  } catch (e) { if (fails++ % 30 === 0) console.error(new Date().toISOString(), 'publish failed:', e.message); }
}
console.log('publishing to', url, 'every 2 s (state every 6 s)');
push(); setInterval(push, 2000);
