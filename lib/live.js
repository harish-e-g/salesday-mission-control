'use strict';
// Reads the REAL Claude Code activity on this machine and turns it into the AI agent team view. No invented data.
//   agentic AI = a Claude Code session (one transcript file in ~/.claude/projects/<project>/<session>.jsonl)
//   AI agent   = a sub-agent that a session started (one output file in <tmp>/claude-<uid>/<project>/<session>/tasks/a....output)
// Working = the transcript changed in the last two minutes. A session whose last reply ended its turn is waiting on you.
const fs = require('fs'), os = require('os'), path = require('path');
const NAMES = ['Oliver', 'Emma', 'Henry', 'Grace', 'Edward', 'Olivia', 'James', 'Charlotte', 'William', 'Amelia', 'Thomas', 'Alice', 'George', 'Lucy', 'Samuel', 'Hannah', 'Arthur', 'Eleanor', 'Daniel', 'Chloe', 'Jack', 'Sophie', 'Harry', 'Ruby', 'Leo', 'Isla', 'Max', 'Ella', 'Noah', 'Freya', 'Oscar', 'Mia', 'Frank', 'Ivy', 'Louis', 'Rose'];
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const WORK_MS = 120 * 1000;           // changed in the last 2 minutes: working
const SESSION_WINDOW = 6 * 3600e3;    // sessions touched in the last 6 hours
const AGENT_WINDOW = 3 * 3600e3;      // sub-agents touched in the last 3 hours
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
  const top = sessions.slice(0, 8), agents = [];
  for (const s of top) {
    const age = now - s.mtime, last = lastTurn(s.file), waiting = endedTurn(last);
    s.status = !waiting && age < WORK_MS ? 'working' : waiting && age < 30 * 60e3 ? 'waiting' : age < 3 * 3600e3 ? 'idle' : 'resting';
    s.since = s.status === 'working' ? Math.max(s.birth, now - Math.min(age + 60e3, 6 * 3600e3)) : s.mtime;
    s.name = nameOf(s.id); s.label = projectLabel(s.dir, cfg); s.kids = [];
    /* sub-agents of this session */
    const td = path.join(tmpRoot, s.dir, s.id, 'tasks'); let outs = []; try { outs = fs.readdirSync(td).filter((f) => /^a[0-9a-f]{12,20}\.output$/.test(f)); } catch { /* none */ }
    for (const f of outs) {
      const p = path.join(td, f); let st; try { st = fs.statSync(p); } catch { continue; } const a2 = now - st.mtimeMs; if (a2 > AGENT_WINDOW) continue;
      const id = f.slice(0, -7), lt = lastTurn(p), fin = endedTurn(lt); let brief = ''; try { brief = firstPrompt(p); } catch { /* skip */ }
      const status = a2 < WORK_MS && !fin ? 'working' : a2 < 900e3 && !fin ? 'idle' : 'resting';
      s.kids.push({ id, name: nameOf(id), role: designation(brief), status, since: status === 'working' ? Math.max(st.birthtimeMs || st.ctimeMs, now - 6 * 3600e3) : st.mtimeMs, task: cfg && cfg.teamShowTasks ? brief.slice(0, 140) : '', done: fin || a2 >= 900e3 });
    }
    s.kids.sort((a, b) => (a.status === 'working' ? 0 : 1) - (b.status === 'working' ? 0 : 1) || b.since - a.since);
    s.kids = s.kids.slice(0, 9);
  }
  const flat = [], depts = [];
  top.forEach((s) => { depts.push({ id: s.id, name: 'Session · ' + s.label, color: ['a1', 'a3', 'a4', 'a2', 'a5'][depts.length % 5] }); flat.push({ id: s.id, name: s.name, role: 'Agentic AI session', dept: s.id, icon: 'compass', status: s.status, since: s.since, next: null, task: s.status === 'working' ? 'Running now' : s.status === 'waiting' ? 'Finished its turn and is waiting for you' : '', needsYou: s.status === 'waiting', load: s.kids.filter((k) => k.status === 'working').length, tasks: [], nextNote: '' });
    s.kids.forEach((k) => flat.push({ id: k.id, name: k.name, role: k.role, dept: s.id, icon: 'bolt', status: k.status === 'resting' && k.done ? 'resting' : k.status, since: k.since, next: null, task: k.task, needsYou: false, load: k.status === 'working' ? 1 : 0, tasks: [], nextNote: k.done ? 'Finished its job' : '' })); });
  const kidsAll = top.flatMap((s) => s.kids), c = (arr, st) => arr.filter((x) => x.status === st).length;
  return {
    at: now, mode: 'live', source: 'Claude Code sessions and sub-agents on this machine', lead: null, owner: { name: (cfg && cfg.owner) || 'Owner', role: 'Owner and approver' },
    departments: depts, agents: flat, sessions: top.map((s) => ({ id: s.id, name: s.name, role: 'Agentic AI session', label: s.label, status: s.status, since: s.since, kids: s.kids })),
    counts: { total: flat.length, working: c(flat, 'working'), waiting: c(flat, 'waiting'), idle: c(flat, 'idle'), resting: c(flat, 'resting'), tasks: c(kidsAll, 'working'), waitingOnYou: c(top, 'waiting'), sessionsWorking: c(top, 'working'), agentsWorking: c(kidsAll, 'working') },
    actionsToday: 0, log: kidsAll.filter((k) => k.done).sort((a, b) => b.since - a.since).slice(0, 6).map((k) => ({ at: k.since, who: k.name, text: 'finished: ' + k.role })).concat(top.filter((x) => x.status === 'waiting').map((x) => ({ at: x.since, who: x.name, text: 'finished its turn and is waiting for you' }))).sort((a, b) => b.at - a.at).slice(0, 8),
  };
}
module.exports = { liveTeam };
