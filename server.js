'use strict';
/**
 * Mission Control: a local, read-only dashboard for a software build run with an AI assistant.
 * Zero dependencies. It reads files and asks the operating system; it never writes, never calls out except to the optional live-version URL, and listens on 127.0.0.1 only.
 *
 *   node server.js                 uses mission.config.json when present, else the demo data in ./demo
 *   node server.js --demo          always the synthetic demo data (safe for screenshots)
 *   PORT=4378 node server.js
 *
 * One JSON file per work item ("row") lives in a folder; each row says who holds the ball and what state it is in:
 *   { "id": "R12", "ball": "AI" | "You", "pri": "critical|high|medium|low", "status": "C|I|P|B|N", "req": "...", "fin": "...", "est": "20 min" }
 *   status: C completed, I in progress, P pending (waiting on a check), B blocked, N not started
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const HERE = __dirname;
const DEMO = process.argv.includes('--demo');
const PORT = Number(process.env.PORT) || 4378;
const cfgPath = path.join(HERE, 'mission.config.json');
const cfg = DEMO || !fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(path.join(HERE, 'mission.config.example.json'), 'utf8')) : JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const home = (p) => String(p || '').replace(/^~(?=\/|$)/, os.homedir());
const ROWS = path.resolve(HERE, home(cfg.rowsDir || './demo/rows'));
const AI = cfg.ballLabels && cfg.ballLabels.ai ? cfg.ballLabels.ai : 'AI';
const YOU = cfg.ballLabels && cfg.ballLabels.you ? cfg.ballLabels.you : 'You';
const AI_KEYS = ['me', 'ai', 'claude', 'assistant'];

const sh = (c, ms = 4000) => { try { return execSync(c, { encoding: 'utf8', timeout: ms, stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const clip = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);

// ── rows ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function loadRows() {
  let files = [];
  try { files = fs.readdirSync(ROWS).filter((f) => /^[A-Za-z]*\d+\.json$/.test(f)); } catch { /* none */ }
  return files.map((f) => {
    const r = readJson(path.join(ROWS, f), null); if (!r) return null;
    let m = 0; try { m = fs.statSync(path.join(ROWS, f)).mtimeMs; } catch { /* ignore */ }
    const court = AI_KEYS.includes(String(r.ball || '').toLowerCase()) ? 'ai' : 'you';
    return { id: String(r.id || f.replace(/[.]json$/, '')), court, pri: String(r.pri || 'medium').toLowerCase(), st: String(r.status || 'N').toUpperCase(), req: clip(r.req, 170), fin: clip(r.fin, 110), est: clip(r.est, 24), at: m };
  }).filter(Boolean);
}
const num = (r) => Number(String(r.id).replace(/\D/g, '')) || 0;
const PRI = { critical: 0, high: 1, medium: 2, low: 3 };
const byUrgency = (a, b) => (PRI[a.pri] ?? 2) - (PRI[b.pri] ?? 2) || num(b) - num(a);

// ── work in progress: git lanes ───────────────────────────────────────────────────────────────────────────────────────────────────────
function lanes() {
  if (cfg.staticLanes) return cfg.staticLanes;   // demo mode: made-up lanes
  return (cfg.lanes || []).map((l) => {
    const d = path.resolve(HERE, home(l.path)); const base = l.base || 'origin/main';
    const exists = fs.existsSync(d);
    return { name: l.name, commits: exists ? Number(sh(`git -C "${d}" rev-list --count ${base}..HEAD`) || 0) : 0, editing: exists ? Number(sh(`git -C "${d}" status --short | wc -l`) || 0) : 0, last: exists ? sh(`git -C "${d}" log -1 --format=%cr`) : '', recent: exists ? sh(`git -C "${d}" log -3 --format=%s ${base}..HEAD`).split('\n').filter(Boolean).map((x) => clip(x, 84)) : [] };
  });
}

// ── the current release: gate state and a tentative finish time ───────────────────────────────────────────────────────────────────────
function gate() {
  if (cfg.staticGate) { const s0 = cfg.staticGate, started = Date.now() - (s0.startedMinutesAgo || 0) * 60000, avg = s0.averageMinutes || 35; return { state: s0.state || 'running', label: s0.label || '', startedAt: started, expectedAt: started + avg * 60000, elapsedMin: s0.startedMinutesAgo || 0, averageMinutes: avg, lines: [] }; }
  const g = cfg.gate; if (!g || !g.statusGlob) return null;
  const dir = path.dirname(g.statusGlob), re = new RegExp('^' + path.basename(g.statusGlob).replace(/[.]/g, '[.]').replace(/\*/g, '.*') + '$');
  let files = []; try { files = fs.readdirSync(home(dir)).filter((f) => re.test(f)).map((f) => ({ f, s: fs.statSync(path.join(home(dir), f)) })).sort((a, b) => b.s.mtimeMs - a.s.mtimeMs); } catch { /* none */ }
  if (!files.length) return { state: 'idle' };
  const newest = files[0]; const txt = (() => { try { return fs.readFileSync(path.join(home(dir), newest.f), 'utf8'); } catch { return ''; } })();
  const started = newest.s.birthtimeMs || newest.s.ctimeMs; const avg = Number(g.averageMinutes) || 35;
  const done = /DONE_OK/.test(txt), failed = /DONE_FAIL/.test(txt);
  const label = (newest.f.match(/(\d+)/) || [])[1] || '';
  return { state: done ? 'passed' : failed ? 'failed' : 'running', label, startedAt: started, expectedAt: started + avg * 60000, elapsedMin: Math.round((Date.now() - started) / 60000), averageMinutes: avg, lines: txt.split('\n').filter(Boolean).slice(-2) };
}

// ── releases from a changelog ──────────────────────────────────────────────────────────────────────────────────────────────────────────
function releases() {
  if (cfg.staticReleases) return cfg.staticReleases.map((r) => ({ ...r, date: /^TODAY-(\d+)$/.test(r.date) ? new Date(Date.now() - Number(r.date.slice(6)) * 86400000).toISOString().slice(0, 10) : r.date }));
  let text = '';
  if (cfg.changelogGit) text = sh(`git -C "${path.resolve(HERE, home(cfg.changelogGit.repo))}" show ${cfg.changelogGit.ref || 'origin/main'}:${cfg.changelogGit.path || 'CHANGELOG.md'}`, 8000);
  else if (cfg.changelog) { try { text = fs.readFileSync(path.resolve(HERE, home(cfg.changelog)), 'utf8'); } catch { /* none */ } }
  const out = []; let cur = null;
  for (const line of text.split('\n')) {
    const m = line.match(/^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})/);
    if (m) { cur = { v: m[1], date: m[2], items: [] }; out.push(cur); if (out.length > 40) break; }
    else if (cur && /^- \*\*/.test(line) && cur.items.length < 2) cur.items.push(clip(line.replace(/^- \*\*/, '').replace(/\*\*.*/, '').replace(/[.]$/, ''), 90));
  }
  return out;
}

// ── the machine ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function machine() {
  if (cfg.staticMachine) return cfg.staticMachine;   // demo mode: made-up numbers
  const total = os.totalmem(), free = os.freemem(); let used = total - free;
  if (process.platform === 'darwin') {
    const vm = sh('vm_stat'); const page = Number((vm.match(/page size of (\d+)/) || [])[1]) || 16384; const g = (k) => Number((vm.match(new RegExp(k + ':\\s+(\\d+)')) || [])[1]) || 0;
    const avail = (g('Pages free') + g('Pages inactive') + g('Pages speculative')) * page; if (avail) used = total - avail;
  }
  const swap = sh('sysctl -n vm.swapusage'); const sw = (k) => Number((swap.match(new RegExp(k + ' = ([0-9.]+)M')) || [])[1]) || 0;
  const disk = sh("df -k / | tail -1").split(/\s+/); const dTotal = Number(disk[1]) * 1024 || 0, dFree = Number(disk[3]) * 1024 || 0;
  const cores = os.cpus().length; const l1 = os.loadavg()[0];
  const swapTotal = sw('total'), swapUsed = sw('used'), swapFree = sw('free');
  const level = (swapTotal > 500 && swapFree < 150) ? 'critical' : (swapUsed > 1500 || l1 > cores * 1.5) ? 'watch' : 'ok';
  return { cores, load1: +l1.toFixed(2), load5: +os.loadavg()[1].toFixed(2), memTotal: total, memUsed: used, swapTotal, swapUsed, swapFree, diskTotal: dTotal, diskFree: dFree, level, uptimeH: Math.round(os.uptime() / 3600) };
}

// ── the live product version (optional) ────────────────────────────────────────────────────────────────────────────────────────────────
let live = { v: null, at: 0 };
function fetchLive() {
  if (!cfg.liveUrl || Date.now() - live.at < 30000) return; live.at = Date.now();
  const lib = cfg.liveUrl.startsWith('https') ? https : http;
  const req = lib.get(cfg.liveUrl, { timeout: 4000 }, (res) => { let b = ''; res.on('data', (c) => { b += c; }); res.on('end', () => { try { live.v = JSON.parse(b).version || null; } catch { live.v = null; } }); });
  req.on('error', () => { live.v = null; }); req.on('timeout', () => req.destroy());
}

// a light read for the moving graphs: the machine and the row counts, polled every two seconds
function liveSample() {
  const rows = loadRows(); const open = rows.filter((r) => r.st !== 'C');
  return { at: Date.now(), machine: machine(), open: open.length, done: rows.length - open.length, progressing: rows.filter((r) => r.st === 'I').length };
}

const liveHistory = [];   // the last three minutes of light samples, so a page that opens shows a full graph at once
function sampleLoop() { liveHistory.push(liveSample()); while (liveHistory.length > 95) liveHistory.shift(); }

function state() {
  fetchLive();
  const rows = loadRows(); const open = rows.filter((r) => r.st !== 'C');
  const cnt = (f) => rows.filter(f).length; const S = (court, st) => cnt((r) => r.court === court && r.st === st);
  const by = (court) => open.filter((r) => r.court === court).sort(byUrgency);
  const day = 24 * 3600 * 1000;
  const agents = readJson(path.resolve(HERE, home(cfg.agentsFile || './demo/agents.json')), { running: 0, peers: 0, note: '' });
  return {
    at: Date.now(), project: cfg.project || 'Project', owner: cfg.owner || '', labels: { ai: AI, you: YOU }, liveVersion: live.v || (DEMO ? '1.0.0' : null),
    totals: { rows: rows.length, open: open.length, done: cnt((r) => r.st === 'C') },
    status: { I: cnt((r) => r.st === 'I'), P: cnt((r) => r.st === 'P'), B: cnt((r) => r.st === 'B'), N: cnt((r) => r.st === 'N'), C: cnt((r) => r.st === 'C') },
    courts: { ai: { I: S('ai', 'I'), P: S('ai', 'P'), B: S('ai', 'B'), N: S('ai', 'N') }, you: { I: S('you', 'I'), P: S('you', 'P'), B: S('you', 'B'), N: S('you', 'N') } },
    critical: open.filter((r) => r.pri === 'critical').sort(byUrgency).slice(0, 8), high: cnt((r) => r.st !== 'C' && r.pri === 'high'), criticalCount: cnt((r) => r.st !== 'C' && r.pri === 'critical'), openDots: open.map((r) => ({ st: r.st, crit: r.pri === 'critical' })),
    todoAi: by('ai').slice(0, 9), todoYou: by('you').slice(0, 9),
    progressing: open.filter((r) => r.st === 'I').sort(byUrgency).slice(0, 8), queue: open.filter((r) => r.st === 'N' || r.st === 'P').sort(byUrgency).slice(0, 8),
    neverTouched: open.filter((r) => r.st === 'N').sort(byUrgency).slice(0, 8), neverTouchedCount: cnt((r) => r.st === 'N'),
    recent: rows.filter((r) => Date.now() - r.at < day).sort((a, b) => b.at - a.at).slice(0, 8).map((r) => ({ ...r, ago: Math.round((Date.now() - r.at) / 60000) })),
    hours: Array.from({ length: 24 }, (_, i) => { const to = Date.now() - (23 - i) * 3600000, from = to - 3600000; return { h: new Date(to).getHours(), n: cnt((r) => r.at >= from && r.at < to) }; }),
    week: Array.from({ length: 7 }, (_, i) => { const d0 = new Date(); d0.setHours(0, 0, 0, 0); const from = d0.getTime() - (6 - i) * day; return { d: new Date(from).toLocaleDateString('en', { weekday: 'short' }), n: cnt((r) => r.at >= from && r.at < from + day) }; }),
    lanes: lanes(), gate: gate(), releases: releases().slice(0, 8), releasesThisWeek: releases().filter((r) => Date.now() - Date.parse(r.date) < 7 * day).length, agents, machine: machine(),
  };
}

const PAGE = () => fs.readFileSync(path.join(HERE, 'public', 'index.html'), 'utf8');
const server = http.createServer((q, s) => {
  if (q.method !== 'GET') { s.statusCode = 405; return s.end(); }
  if (q.url.startsWith('/api/live?history')) { s.setHeader('content-type', 'application/json'); s.setHeader('cache-control', 'no-store'); return s.end(JSON.stringify({ history: liveHistory })); }
  if (q.url.startsWith('/api/live')) { s.setHeader('content-type', 'application/json'); s.setHeader('cache-control', 'no-store'); return s.end(JSON.stringify(liveSample())); }
  if (q.url.startsWith('/api/state')) { s.setHeader('content-type', 'application/json'); s.setHeader('cache-control', 'no-store'); return s.end(JSON.stringify(state())); }
  const url = q.url.split('?')[0], TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.woff2': 'font/woff2' };
  const asset = url === '/demo-state.json' ? path.join(HERE, 'docs', 'demo-state.json') : /^\/(theme\.js|widgets\.js|widgets\.css|themes\.html|brand\/[\w.-]+\.svg|fonts\/[\w.-]+\.woff2)$/.test(url) ? path.join(HERE, 'public', url.slice(1)) : null;
  if (asset && fs.existsSync(asset)) { s.setHeader('content-type', TYPES[path.extname(asset)] || 'application/octet-stream'); s.setHeader('cache-control', 'no-store'); return s.end(fs.readFileSync(asset)); }
  s.setHeader('content-type', 'text/html; charset=utf-8'); s.setHeader('cache-control', 'no-store'); s.end(PAGE());
});
if (require.main === module) server.listen(PORT, '127.0.0.1', () => { sampleLoop(); setInterval(sampleLoop, 2000); console.log(`Mission Control on http://127.0.0.1:${PORT} (${DEMO || !fs.existsSync(cfgPath) ? 'demo data' : 'your data'})`); });
module.exports = { state };
