'use strict';
// Reads the REAL Claude Code activity on this machine and turns it into the AI agent team view. No invented data.
//   agentic AI = a Claude Code session (one transcript file in ~/.claude/projects/<project>/<session>.jsonl)
//   AI agent   = a sub-agent that a session started (one output file in <tmp>/claude-<uid>/<project>/<session>/tasks/a....output)
// Working = the transcript changed in the last two minutes. A session whose last reply ended its turn is waiting on you.
const fs = require('fs'), os = require('os'), path = require('path');
const NAMES = ['Oliver', 'Emma', 'Henry', 'Grace', 'Edward', 'Olivia', 'James', 'Charlotte', 'William', 'Amelia', 'Thomas', 'Alice', 'George', 'Lucy', 'Samuel', 'Hannah', 'Arthur', 'Eleanor', 'Daniel', 'Chloe', 'Jack', 'Sophie', 'Harry', 'Ruby', 'Leo', 'Isla', 'Max', 'Ella', 'Noah', 'Freya', 'Oscar', 'Mia', 'Frank', 'Ivy', 'Louis', 'Rose'];
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const WORK_MS = 120 * 1000;           // changed in the last 2 minutes: working
const SESSION_WINDOW = 24 * 3600e3;   // sessions touched in the last 24 hours
const AGENT_WINDOW = 24 * 3600e3;     // sub-agents touched in the last 24 hours
const MAX_MASTERS = 3, MAX_KIDS = 10;
function readEdge(file, bytes, fromEnd) {
  const st = fs.statSync(file), len = Math.min(bytes, st.size), buf = Buffer.alloc(len), fd = fs.openSync(file, 'r');
  try { fs.readSync(fd, buf, 0, len, fromEnd ? st.size - len : 0); } finally { fs.closeSync(fd); } return buf.toString('utf8');
}
function lastTurn(file) {                       // the last user or assistant record, skipping bookkeeping lines
  const lines = readEdge(file, 262144, true).split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) { try { const d = JSON.parse(lines[i]); if (d.type === 'assistant' || d.type === 'user') return d; } catch { /* partial line */ } }
  return null;
}
function firstPrompt(file) {                    // the brief a sub-agent was given: first user text
  const lines = readEdge(file, 65536, false).split('\n').filter(Boolean);
  for (const l of lines) { try { const d = JSON.parse(l); if (d.type !== 'user') continue; const c = d.message && d.message.content; const t = typeof c === 'string' ? c : Array.isArray(c) ? c.filter((x) => x.type === 'text').map((x) => x.text).join(' ') : ''; if (t.trim()) return t.replace(/\s+/g, ' ').trim(); } catch { /* skip */ } }
  return '';
}
const endedTurn = (d) => !!(d && d.type === 'assistant' && d.message && d.message.stop_reason === 'end_turn');
function designation(brief) {
  let s = brief.replace(/^(?:read[- ]only|research|task)[:\s]*/i, '').replace(/^you are (?:the |an? )?/i, '').replace(/^goal:\s*/i, '');
  s = s.split(/[.:;\n]|\s-\s/)[0].trim(); s = s.replace(/\bfor (?:the )?salesday.*$/i, '').replace(/\s+/g, ' ').trim();
  if (!s) return 'Sub-agent'; s = s.charAt(0).toUpperCase() + s.slice(1); return s.length > 34 ? s.slice(0, 33).trim() + '…' : s;
}
function projectLabel(dir, cfg) { if (cfg && cfg.project) return cfg.project; const t = dir.replace(/^-+/, '').split('-'); return t.slice(-2).join(' '); }
function liveTeam(cfg, now) {
  now = now || Date.now(); const home = os.homedir(), root = path.join(home, '.claude', 'projects'), tmpRoot = path.join('/private/tmp', 'claude-' + (process.getuid ? process.getuid() : 501));
  const used = new Set(), nameOf = (id) => { let i = hash(id) % NAMES.length; for (let k = 0; k < NAMES.length; k++) { const n = NAMES[(i + k) % NAMES.length]; if (!used.has(n)) { used.add(n); return n; } } return NAMES[i]; };
  const sessions = [];
  let dirs = []; try { dirs = fs.readdirSync(root); } catch { /* none */ }
  for (const dir of dirs) {
    let files = []; try { files = fs.readdirSync(path.join(root, dir)).filter((f) => /^[0-9a-f-]{36}\.jsonl$/.test(f)); } catch { continue; }
    for (const f of files) { const p = path.join(root, dir, f); let st; try { st = fs.statSync(p); } catch { continue; } if (now - st.mtimeMs > SESSION_WINDOW) continue; sessions.push({ id: f.slice(0, -6), dir, file: p, mtime: st.mtimeMs, birth: st.birthtimeMs || st.ctimeMs }); }
  }
  sessions.sort((a, b) => b.mtime - a.mtime);
  const cand = sessions.slice(0, 12), agents = [];
  for (const s of cand) {
    const age = now - s.mtime, last = lastTurn(s.file), waiting = endedTurn(last);
    s.status = !waiting && age < WORK_MS ? 'working' : waiting && age < 30 * 60e3 ? 'waiting' : age < 3 * 3600e3 ? 'idle' : 'resting';
    s.since = s.status === 'working' ? Math.max(s.birth, now - Math.min(age + 60e3, 6 * 3600e3)) : s.mtime;
    s.name = nameOf(s.id); s.label = projectLabel(s.dir, cfg); s.kids = [];
    /* sub-agents of this session: <project>/<session>/subagents/agent-<id>.meta.json (description, finished) beside agent-<id>.jsonl (the work) */
    const sd = path.join(root, s.dir, s.id, 'subagents'); let metas = []; try { metas = fs.readdirSync(sd).filter((f) => /^agent-[0-9a-f]+\.meta\.json$/.test(f)); } catch { /* none */ }
    for (const f of metas) {
      const id = f.slice(6, -10), jf = path.join(sd, 'agent-' + id + '.jsonl'); let st, meta = {}; try { st = fs.statSync(jf); meta = JSON.parse(fs.readFileSync(path.join(sd, f), 'utf8')); } catch { continue; }
      const a2 = now - st.mtimeMs; if (a2 > AGENT_WINDOW) continue;
      const fin = meta.finished === true, status = fin ? 'resting' : a2 < WORK_MS ? 'working' : a2 < 900e3 ? 'idle' : 'resting';
      const desc = String(meta.description || 'Sub-agent').replace(/\s+/g, ' ').trim();
      s.kids.push({ id, name: nameOf(id), role: desc, status, since: status === 'working' ? Math.max(st.birthtimeMs || st.ctimeMs, now - 6 * 3600e3) : st.mtimeMs, task: cfg && cfg.teamShowTasks ? desc : '', done: fin || a2 >= 900e3, type: meta.agentType || '' });
    }
    s.kids.sort((a, b) => (a.status === 'working' ? 0 : 1) - (b.status === 'working' ? 0 : 1) || b.since - a.since);
    s.hidden = Math.max(0, s.kids.length - MAX_KIDS); s.kids = s.kids.slice(0, MAX_KIDS);
  }
  const live = (x) => x.status === 'working' || x.kids.length > 0;
  const top = cand.filter(live).sort((a, b) => (b.kids.filter((k) => k.status === 'working').length - a.kids.filter((k) => k.status === 'working').length) || (b.status === 'working') - (a.status === 'working') || b.kids.length - a.kids.length).slice(0, MAX_MASTERS);
  top.forEach((s, i) => { s.name = i === 0 ? 'Master' : 'Master ' + (i + 1); });
  const others = cand.filter((x) => !top.includes(x));
  const flat = [], depts = [];
  top.forEach((s) => { depts.push({ id: s.id, name: 'Session · ' + s.label, color: ['a1', 'a3', 'a4', 'a2', 'a5'][depts.length % 5] }); flat.push({ id: s.id, name: s.name, role: 'Agentic AI orchestrator', dept: s.id, icon: 'compass', status: s.status, since: s.since, next: null, task: s.status === 'working' ? 'Running now' : s.status === 'waiting' ? 'Finished its turn and is waiting for you' : '', needsYou: s.status === 'waiting', load: s.kids.filter((k) => k.status === 'working').length, tasks: [], nextNote: '' });
    s.kids.forEach((k) => flat.push({ id: k.id, name: k.name, role: k.role, dept: s.id, icon: 'bolt', status: k.status === 'resting' && k.done ? 'resting' : k.status, since: k.since, next: null, task: k.task, needsYou: false, load: k.status === 'working' ? 1 : 0, tasks: [], nextNote: k.done ? 'Finished its job' : '' })); });
  const kidsAll = top.flatMap((s) => s.kids), c = (arr, st) => arr.filter((x) => x.status === st).length;
  return {
    at: now, mode: 'live', source: 'Claude Code sessions and sub-agents on this machine', lead: null, owner: { name: (cfg && cfg.owner) || 'Owner', role: 'Owner and approver' },
    departments: depts, agents: flat, sessions: top.map((s) => ({ id: s.id, name: s.name, role: 'Agentic AI orchestrator', label: s.label, status: s.status, since: s.since, kids: s.kids, hidden: s.hidden || 0 })), others: others.length, othersWorking: others.filter((x) => x.status === 'working').length,
    counts: { total: flat.length, working: c(flat, 'working'), waiting: c(flat, 'waiting'), idle: c(flat, 'idle'), resting: c(flat, 'resting'), tasks: c(kidsAll, 'working'), waitingOnYou: c(top, 'waiting'), sessionsWorking: c(cand, 'working'), agentsWorking: c(kidsAll, 'working'), agentsToday: top.reduce((n, x) => n + x.kids.length + (x.hidden || 0), 0), agentsAllTime: liveStats(now).agentsAllTime, agentsLast24h: liveStats(now).agentsLast24h, peakParallel: liveStats(now).peakParallel, masters: liveStats(now).masters },
    actionsToday: 0, log: kidsAll.filter((k) => k.done).sort((a, b) => b.since - a.since).slice(0, 6).map((k) => ({ at: k.since, who: k.name, text: 'finished: ' + k.role })).concat(top.filter((x) => x.status === 'waiting').map((x) => ({ at: x.since, who: x.name, text: 'finished its turn and is waiting for you' }))).sort((a, b) => b.at - a.at).slice(0, 8),
  };
}

/* Honest totals for marketing: every sub-agent that any session of this machine ever started, and the most that were ACTIVE in the same 3 minutes
   (an agent counts in a 3 minute slot only if it wrote at least one record in it, so resumed or parked agents are not counted as running). */
let STATS = { at: 0, v: null };
function liveStats(now) {
  now = now || Date.now(); if (STATS.v && now - STATS.at < 600000) return STATS.v;
  const root = path.join(os.homedir(), '.claude', 'projects'), slots = new Map(), mt = []; let total = 0, day = 0, masters = 0; let dirs = []; try { dirs = fs.readdirSync(root); } catch { /* none */ }
  const TS = /"timestamp":"(\d{4}-\d\d-\d\dT\d\d:\d\d)/g;
  for (const dir of dirs) { let ss = []; try { ss = fs.readdirSync(path.join(root, dir), { withFileTypes: true }).filter((d) => d.isDirectory()); } catch { continue; }
    for (const d of ss) { const sd = path.join(root, dir, d.name, 'subagents'); let fl = []; try { fl = fs.readdirSync(sd).filter((f) => /^agent-[0-9a-f]+\.jsonl$/.test(f)); } catch { continue; }
      if (fl.length) masters++;
      for (const f of fl) { const p = path.join(sd, f); let st, txt; try { st = fs.statSync(p); txt = fs.readFileSync(p, 'utf8'); } catch { continue; } total++; mt.push(st.mtimeMs); if (now - st.mtimeMs < 864e5) day++;
        const mine = new Set(); let m; TS.lastIndex = 0; while ((m = TS.exec(txt))) { const t = Date.parse(m[1] + ':00Z'); if (Number.isFinite(t)) mine.add(Math.floor(t / 180000)); }
        for (const k of mine) slots.set(k, (slots.get(k) || 0) + 1); } } }
  let peak = 0, peakAt = 0; for (const [k, n] of slots) if (n > peak) { peak = n; peakAt = k * 180000; }
  STATS = { at: now, v: { agentsAllTime: total, agentsLast24h: day, peakParallel: peak, peakAt, masters, mtimes: mt.sort((a, b) => b - a) } }; return STATS.v;
}

/* Every sub-agent job of the last 24 hours across all sessions, plus how many sessions are working right now. Used to give the departmental roster live states. */
function allJobs(now) {
  now = now || Date.now(); const root = path.join(os.homedir(), '.claude', 'projects'), jobs = []; let sessionsWorking = 0; let dirs = []; try { dirs = fs.readdirSync(root); } catch { /* none */ }
  for (const dir of dirs) { let ss = []; try { ss = fs.readdirSync(path.join(root, dir), { withFileTypes: true }); } catch { continue; }
    for (const d of ss) {
      if (d.isFile() && /^[0-9a-f-]{36}\.jsonl$/.test(d.name)) { try { const st = fs.statSync(path.join(root, dir, d.name)); if (now - st.mtimeMs < WORK_MS && !endedTurn(lastTurn(path.join(root, dir, d.name)))) sessionsWorking++; } catch { /* skip */ } }
      if (!d.isDirectory()) continue; const sd = path.join(root, dir, d.name, 'subagents'); let metas = []; try { metas = fs.readdirSync(sd).filter((f) => /^agent-[0-9a-f]+\.meta\.json$/.test(f)); } catch { continue; }
      for (const f of metas) { const id = f.slice(6, -10); let st, meta = {}; try { st = fs.statSync(path.join(sd, 'agent-' + id + '.jsonl')); meta = JSON.parse(fs.readFileSync(path.join(sd, f), 'utf8')); } catch { continue; }
        const a2 = now - st.mtimeMs; if (a2 > AGENT_WINDOW) continue;
        const working = meta.finished !== true && a2 < WORK_MS; jobs.push({ id, desc: String(meta.description || '').replace(/\s+/g, ' ').trim(), working, finished: meta.finished === true, at: st.mtimeMs, start: st.birthtimeMs || st.ctimeMs }); } } }
  return { jobs, sessionsWorking };
}
module.exports = { liveTeam, liveStats, allJobs };

