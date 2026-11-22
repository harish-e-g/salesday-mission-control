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
module.exports = { buildTeam, when };
