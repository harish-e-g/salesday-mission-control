'use strict';
// Builds the "agent team" view from a roster file and the live rows.
// The roster says who exists (name, role, department, icon) and what each one is doing (status, since, next).
// Times may be an ISO string or a relative form: "-25m" (25 minutes ago), "+2h" (in two hours).
const UNIT = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 };
function when(v, now) {
  if (v == null || v === '') return null;
  const m = /^([+-])(\d+(?:\.\d+)?)([smhd])$/.exec(String(v).trim());
  if (m) return now + (m[1] === '-' ? -1 : 1) * Number(m[2]) * UNIT[m[3]];
  const t = Date.parse(v); return Number.isFinite(t) ? t : null;
}
const STATUS = ['working', 'waiting', 'idle', 'resting'];

function buildTeam(def, rows, now) {
  if (!def || !Array.isArray(def.agents)) return null;
  now = now || Date.now();
  const byId = new Map((rows || []).map((r) => [r.id, r]));
  const depts = (def.departments || []).map((d) => ({ id: d.id, name: d.name, color: d.color || 'a1' }));
  const deptIds = new Set(depts.map((d) => d.id));
  const agents = def.agents.filter((a) => a && a.id && a.name).map((a) => {
    const status = STATUS.includes(a.status) ? a.status : 'idle';
    const tasks = (a.tags || []).map((id) => byId.get(id)).filter((r) => r && r.st !== 'C')
      .map((r) => ({ id: r.id, st: r.st, pri: r.pri, req: r.req })).slice(0, 6);
    const extra = Number(a.extraLoad) || 0;
    return {
      id: a.id, name: a.name, role: a.role || '', dept: deptIds.has(a.dept) ? a.dept : (depts[0] && depts[0].id) || '', icon: a.icon || 'bolt',
      status, task: a.task || '', note: a.note || '', needsYou: !!a.needsYou || status === 'waiting',
      since: when(a.since, now), next: when(a.next, now), nextNote: a.nextNote || '',
      load: tasks.length + extra, tasks,
    };
  });
  const count = (s) => agents.filter((a) => a.status === s).length;
  const lead = def.lead ? { id: def.lead.id || 'lead', name: def.lead.name || 'Lead', role: def.lead.role || 'Lead orchestrator', icon: def.lead.icon || 'compass', task: def.lead.task || '', since: when(def.lead.since, now) } : null;
  const day = 864e5;
  return {
    at: now, lead, owner: def.owner || { name: 'You', role: 'Approver' }, departments: depts, agents,
    counts: { total: agents.length + (lead ? 1 : 0), working: count('working') + (lead ? 1 : 0), waiting: count('waiting'), idle: count('idle'), resting: count('resting'), tasks: agents.reduce((n, a) => n + a.load, 0), waitingOnYou: agents.filter((a) => a.needsYou).length },
    actionsToday: (rows || []).filter((r) => now - r.at < day).length,
    log: (def.log || []).map((l) => ({ at: when(l.at, now), who: l.who, text: l.text })).filter((l) => l.at).sort((a, b) => b.at - a.at).slice(0, 8),
  };
}

/* The departmental roster with LIVE states. A job (sub-agent run) belongs to the first agent whose `match` pattern fits its description.
   working = a matched job is running now; waiting = an open row tagged to the agent is on the owner's side; otherwise idle (recent) or resting (older); no job today = idle with no time. */
function buildLiveRoster(def, rows, jobs, sessionsWorking, now, showTasks) {
  now = now || Date.now();
  const team = buildTeam(def, rows, now); if (!team) return null;
  const byAgent = new Map(team.agents.map((a) => [a.id, []]));
  const pats = (def.agents || []).map((a) => [a.id, new RegExp(a.match || '^$', 'i')]);
  let unmapped = 0; for (const j of jobs) { const hit = pats.find(([, re]) => re.test(j.desc)); if (hit) byAgent.get(hit[0]).push(j); else unmapped++; }
  const youOpen = (a) => (a.tags || []).map((id) => (rows || []).find((r) => r.id === id)).filter((r) => r && r.st !== 'C' && r.court === 'you');
  const defById = new Map((def.agents || []).map((a) => [a.id, a]));
  for (const a of team.agents) {
    const js = byAgent.get(a.id), running = js.filter((j) => j.working), last = js.slice().sort((x, y) => y.at - x.at)[0], mine = youOpen(defById.get(a.id) || {});
    a.jobs = js.length; a.load = js.length + a.tasks.length; a.needsYou = mine.length > 0;
    if (running.length) { a.status = 'working'; a.since = Math.min(...running.map((j) => j.start)); a.task = ''; }
    else if (mine.length) { a.status = 'waiting'; a.since = last ? last.at : null; }
    else if (last) { a.status = now - last.at < 3 * 3600e3 ? 'idle' : 'resting'; a.since = last.at; }
    else { a.status = 'idle'; a.since = null; }
  }
  const c = (st) => team.agents.filter((a) => a.status === st).length, lw = sessionsWorking > 0;
  team.lead = Object.assign({}, team.lead, { status: lw ? 'working' : 'idle' }); if (!lw) team.lead.since = team.lead.since || null;
  team.log = jobs.slice().sort((x, y) => y.at - x.at).slice(0, 8).map((j) => { const hit = pats.find(([, re]) => re.test(j.desc)), a = hit && team.agents.find((x) => x.id === hit[0]); return { at: j.at, who: a ? a.name : (team.lead && team.lead.name) || 'Oliver', text: (j.working ? 'is working' : 'finished a job') + (showTasks && j.desc ? ': ' + j.desc : '') }; });
  team.mode = 'roster-live'; team.source = 'Departmental roster with live states from Claude Code sub-agents and the R-list';
  team.counts = { total: team.agents.length + 1, working: c('working') + (lw ? 1 : 0), waiting: c('waiting'), idle: c('idle'), resting: c('resting'), tasks: team.agents.reduce((n, a) => n + a.load, 0), waitingOnYou: team.agents.filter((a) => a.needsYou).length, sessionsWorking, agentsWorking: jobs.filter((j) => j.working).length, jobsToday: jobs.length, unmapped };
  return team;
}
module.exports = { buildTeam, buildLiveRoster, when };
