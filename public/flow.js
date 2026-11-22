/* SalesDay Mission Control: shared flowchart drawing for the AI agent team (layered pipeline).
   One card size, four single lines, an AI AGENT pill on the border, status colours, right-angle connectors, beats only on live links.
   The page calls FL.init({sv, T: () => theme, col, dark}) once, then FL.layered(...). */
const FL = (function () {
  const CW = 252, CH = 92, GY = 34;
  let C = null;
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => { let s = seed || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000) / 1000; }; };
  const fit = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const hm = (t) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const cd = (ms) => { const m = Math.max(0, Math.round(ms / 60000)); if (m < 1) return '0m'; if (m < 60) return m + 'm'; const h = Math.floor(m / 60); if (h < 24) return h + 'h' + (m % 60 ? (m % 60) + 'm' : ''); return Math.floor(h / 24) + 'd'; };
  const stat = (n, now) => {
    if (n.kind === 'owner') return n.count ? n.count + ' waiting on you' : 'Nothing waiting';
    if (n.kind === 'lead') return 'Working · ' + cd(now - (n.since || now));
    const x = n.a; if (x.status === 'working') return 'Working · ' + cd(now - (x.since || now));
    if (x.status === 'waiting') return 'Needs you · ' + cd(now - (x.since || now));
    const nx = x.next && x.next > now ? (x.next - now < 864e5 ? ' · starts ' + hm(x.next) : ' · starts ' + new Date(x.next).toLocaleDateString('en-GB', { weekday: 'short' })) : '';
    return (x.status === 'idle' ? 'Idle ' : 'Resting ') + cd(now - (x.since || now)) + nx;
  };
  function face(g, id, shirt, r) {
    const R = rng(hash(id)), skins = ['#F1C7A5', '#E0A97C', '#C98B5D', '#9A6440', '#6F4429'], hairs = ['#2B1B12', '#4A2C17', '#161616', '#8B5A2B', '#B9B9B9', '#5A2A6B'];
    const skin = skins[Math.floor(R() * 5)], hair = hairs[Math.floor(R() * 6)], style = Math.floor(R() * 5), glasses = R() > .5, sv = C.sv, f = sv('g', { transform: `scale(${r / 28})` }, g);
    sv('circle', { r: 28, fill: shirt, opacity: .28 }, f); if (style === 2) sv('path', { d: 'M-13 -3a13 13 0 0126 0v15q-13 5-26 0z', fill: hair }, f);
    sv('ellipse', { cx: 0, cy: 25, rx: 19, ry: 13, fill: shirt }, f); sv('rect', { x: -3.5, y: 4, width: 7, height: 7, fill: skin }, f); sv('circle', { cx: 0, cy: -4, r: 11.5, fill: skin }, f);
    if (style === 0) sv('path', { d: 'M-11.8 -6a11.8 11.8 0 0123.6 0q-11.8-8-23.6 0z', fill: hair }, f);
    if (style === 1) { sv('path', { d: 'M-11.8 -6a11.8 11.8 0 0123.6 0q-11.8-8-23.6 0z', fill: hair }, f); sv('circle', { cx: 0, cy: -17.5, r: 4.2, fill: hair }, f); }
    if (style === 2) sv('path', { d: 'M-11.8 -5a11.8 11.8 0 0123.6 0q-6-7-12-5-6-2-11.6 5z', fill: hair }, f);
    if (style === 3) for (let i = 0; i < 7; i++) { const a = Math.PI + i * Math.PI / 6; sv('circle', { cx: Math.cos(a) * 10.5, cy: -4 + Math.sin(a) * 10.5, r: 4.4, fill: hair }, f); }
    if (style === 4) { sv('path', { d: 'M-12 -7a12 12 0 0124 0z', fill: shirt }, f); sv('rect', { x: -13, y: -8, width: 26, height: 3, rx: 1.5, fill: shirt }, f); }
    sv('circle', { cx: -4.2, cy: -4, r: 1.4, fill: '#1d1d1d' }, f); sv('circle', { cx: 4.2, cy: -4, r: 1.4, fill: '#1d1d1d' }, f); sv('path', { d: 'M-3.6 1.2q3.6 3.2 7.2 0', fill: 'none', stroke: '#7a3b2e', 'stroke-width': 1.2, 'stroke-linecap': 'round' }, f);
    if (glasses) { sv('circle', { cx: -4.2, cy: -4, r: 3.7, fill: 'none', stroke: '#222', 'stroke-width': 1 }, f); sv('circle', { cx: 4.2, cy: -4, r: 3.7, fill: 'none', stroke: '#222', 'stroke-width': 1 }, f); sv('path', { d: 'M-0.5 -4h1', stroke: '#222', 'stroke-width': 1 }, f); }
  }
  const rounded = (P, r) => {
    P = P.filter((q, i) => i === 0 || Math.hypot(q[0] - P[i - 1][0], q[1] - P[i - 1][1]) > .5); if (P.length < 3) return `M${P[0][0]} ${P[0][1]}L${P[P.length - 1][0]} ${P[P.length - 1][1]}`;
    let d = `M${P[0][0]} ${P[0][1]}`; for (let i = 1; i < P.length - 1; i++) { const a = P[i - 1], b = P[i], c = P[i + 1], l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]), rr = Math.min(r, l1 / 2, l2 / 2); d += `L${b[0] - (b[0] - a[0]) / l1 * rr} ${b[1] - (b[1] - a[1]) / l1 * rr}Q${b[0]} ${b[1]} ${b[0] + (c[0] - b[0]) / l2 * rr} ${b[1] + (c[1] - b[1]) / l2 * rr}`; }
    return d + `L${P[P.length - 1][0]} ${P[P.length - 1][1]}`;
  };
  const arrow = (svg, x, y, dir, color, o) => { const s = 7, p = dir === 'down' ? `${x - s},${y - s * 1.4} ${x + s},${y - s * 1.4} ${x},${y}` : `${x - s * 1.4},${y - s} ${x - s * 1.4},${y + s} ${x},${y}`; return C.sv('polygon', { points: p, fill: color, opacity: o }, svg); };
  /* style of a link by the state of the agent it leads to. Only a working agent gets beats. */
  function linkStyle(st) {
    const T = C.T();
    if (st === 'working') return { color: null, w: 2.4, o: .95, dash: null, beat: true };
    if (st === 'waiting') return { color: T.a2, w: 2.2, o: .95, dash: '7 6', beat: false };
    if (st === 'resting') return { color: T.a3, w: 1.8, o: .75, dash: '1 6', beat: false };
    return { color: T.ink3, w: 1.4, o: .4, dash: null, beat: false };
  }
  const BEATS = [];
  function link(svg, P, deptColor, st, reg) {
    const s = linkStyle(st), color = s.color || deptColor, g = C.sv('g', {}, svg);
    const p = C.sv('path', { d: rounded(P, 10), fill: 'none', stroke: color, 'stroke-width': s.w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: s.o }, g); if (s.dash) p.setAttribute('stroke-dasharray', s.dash);
    const e = P[P.length - 1]; arrow(g, e[0], e[1], 'right', color, s.o);
    if (s.beat) { for (let q = 0; q < 2; q++) { const c = C.sv('circle', { r: 4, fill: color }, g); let len = 0; const seg = []; for (let i = 0; i < P.length - 1; i++) { const l = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]); seg.push(l); len += l; } const t0 = Math.random();
      BEATS.push((tm) => { const u = (((tm / 2800) + t0 + q * .5) % 1) * len; let d = u, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; } const k = seg[i] ? d / seg[i] : 0; c.setAttribute('cx', P[i][0] + (P[i + 1][0] - P[i][0]) * k); c.setAttribute('cy', P[i][1] + (P[i + 1][1] - P[i][1]) * k); c.setAttribute('opacity', Math.sin(Math.PI * (u / len))); }); } }
    if (reg) reg(g); return g;
  }
  /* The card: same size always. Status decides tint, ring and text colour. */
  function card(svg, n, x, y, now) {
    const sv = C.sv, T = C.T(), dark = C.dark(), st = (n.kind === 'agent' || n.kind === 'session') ? n.a.status : n.kind === 'lead' ? 'working' : 'owner', dc = n.color;
    const tone = st === 'working' ? T.a1 : st === 'waiting' ? T.a2 : st === 'resting' ? T.a3 : st === 'owner' ? T.a2 : T.ink3;
    const g = sv('g', { transform: `translate(${x},${y})`, class: 'fcard', 'data-id': n.id, tabindex: 0, role: 'button', 'aria-label': n.name + ', ' + n.role + ', ' + n.dept + ', ' + (n.kind === 'owner' ? 'human owner' : (n.kind === 'lead' || n.kind === 'session') ? 'agentic AI' : 'AI agent') }, svg);
    const base = dark ? '#10241e' : '#ffffff';
    sv('rect', { width: CW, height: CH, rx: 16, fill: base }, g);
    sv('rect', { width: CW, height: CH, rx: 16, fill: st === 'idle' ? T.ink3 : tone, opacity: st === 'idle' ? .06 : .11 }, g);
    const edge = sv('rect', { width: CW, height: CH, rx: 16, fill: 'none', stroke: st === 'idle' ? T.ink3 : st === 'working' ? dc : tone, 'stroke-width': st === 'waiting' ? 2.8 : st === 'working' ? 2 : 1.5, opacity: st === 'idle' ? .55 : 1 }, g);
    if (st === 'waiting') edge.setAttribute('class', 'glowAmber');
    sv('rect', { x: 0, y: 16, width: 5, height: CH - 32, rx: 2.5, fill: st === 'idle' ? T.ink3 : dc, opacity: st === 'idle' ? .5 : 1 }, g);
    if (st === 'working') { const p = sv('circle', { cx: 44, cy: CH / 2, r: 30, class: 'ring', fill: 'none', stroke: tone, 'stroke-width': 2 }, g); p.style.animationDelay = (Math.random() * 2) + 's'; }
    sv('circle', { cx: 44, cy: CH / 2, r: 30, fill: 'none', stroke: tone, 'stroke-width': st === 'working' ? 4 : 2.6, opacity: st === 'idle' ? .6 : 1 }, g);
    const cid = 'fc_' + n.id + '_' + Math.round(x) + '_' + Math.round(y), cp = sv('clipPath', { id: cid }, g); sv('circle', { cx: 44, cy: CH / 2, r: 26 }, cp);
    const holder = sv('g', { 'clip-path': `url(#${cid})`, opacity: st === 'idle' ? .5 : st === 'resting' ? .62 : 1 }, g), inner = sv('g', { transform: `translate(44 ${CH / 2})` }, holder); face(inner, n.id, dc, 26);
    if (st === 'resting') { sv('circle', { cx: 66, cy: 20, r: 9, fill: T.a3 }, g); sv('path', { d: 'M66.8 15.5a5 5 0 105 6a4 4 0 01-5-6z', fill: '#fff' }, g); }
    const lines = [[n.name, 15, 600, T.ink, 17], [n.role, 12, 500, T.ink2, 25], [n.dept, 11, 600, st === 'idle' ? T.ink3 : dc, 26], [stat(n, now), 11.5, 600, tone, 26]];
    let ty = 23; for (const [t, fs, fw, fill, m] of lines) { const e = sv('text', { x: 84, y: ty, 'font-size': fs, 'font-weight': fw, fill }, g); e.textContent = fit(t, m); ty += 18; }
    /* The pill sits on the top border, so it never touches a word. */
    const human = n.kind === 'owner', lead = n.kind === 'lead' || n.kind === 'session', label = human ? 'HUMAN OWNER' : lead ? 'AGENTIC AI' : 'AI AGENT', pw = human ? 92 : lead ? 88 : 74;
    sv('rect', { x: CW - pw - 12, y: -9, width: pw, height: 18, rx: 9, class: 'aip', fill: human ? T.a2 : lead ? T.a3 : (dark ? T.a1 : '#14201B') }, g);
    const pt = sv('text', { x: CW - pw / 2 - 12, y: 3.6, 'text-anchor': 'middle', 'font-size': 9.5, 'font-weight': 600, 'letter-spacing': '.06em', fill: human ? (T.onA2 || '#1B2210') : lead ? '#ffffff' : (dark ? '#06241c' : '#ffffff') }, g); pt.textContent = label;
    return g;
  }
  /* Layered pipeline: You | Orchestrator | Department heads | Specialists. Each connector has its own channel. */
  function layered(svg, m, now, hooks) {
    const sv = C.sv, T = C.T(), P = 34, gap = 108, xs = [0, 1, 2, 3].map((i) => P + i * (CW + gap)), W = xs[3] + CW + P;
    const heads = m.groups.map((g) => g.nodes[0]), specs = []; m.groups.forEach((g, gi) => g.nodes.slice(1).forEach((n) => specs.push({ n, gi })));
    const pitch = CH + GY, rows = Math.max(heads.length, specs.length), top = P + 96, H = top + rows * pitch + P - GY + 12;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
    /* two nested bands: the agentic AI system (orchestrator plus agents) and, inside it, the AI agents that do the work */
    const band = (x, y, w, h, color, o) => { sv('rect', { x, y, width: w, height: h, rx: 24, fill: color, opacity: o }, svg); sv('rect', { x, y, width: w, height: h, rx: 24, fill: 'none', stroke: color, 'stroke-width': 1.4, opacity: .55 }, svg); };
    const bot = H - P + 18;
    band(xs[1] - 18, P - 14, xs[3] + CW + 32 - (xs[1] - 18), bot - (P - 14), T.a3, .07);
    band(xs[2] - 14, P + 36, xs[3] + CW + 16 - (xs[2] - 14), bot - (P + 36), T.a1, .07);
    const lab = (t, sub, x, y, color) => { const a = sv('text', { x, y, 'font-size': 15, 'font-weight': 600, 'letter-spacing': '.1em', fill: color }, svg); a.textContent = t; const b = sv('text', { x, y: y + 20, 'font-size': 13, fill: T.ink2 }, svg); b.textContent = sub; };
    lab('HUMAN', 'decides and approves', xs[0], P + 12, T.a2);
    lab('AGENTIC AI', 'plans, delegates, remembers, verifies, asks a human', xs[1], P + 12, T.a3);
    lab('AI AGENTS', 'each one does the work of one role', xs[2], P + 62, T.a1);
    const hy = (i) => top + i * pitch, my = top + (rows * pitch - GY) / 2 - CH / 2, trunk = xs[1] + CW + gap / 2;
    const links = [];
    links.push({ id: m.lead ? '__lead' : '__owner', g: link(svg, [[xs[0] + CW, my + CH / 2], [xs[1], my + CH / 2]], T.a2, m.wait ? 'waiting' : 'idle'), chain: ['__owner', '__lead'] });
    heads.forEach((h, i) => links.push({ id: h.id, g: link(svg, [[xs[1] + CW, my + CH / 2], [trunk, my + CH / 2], [trunk, hy(i) + CH / 2], [xs[2], hy(i) + CH / 2]], h.color, h.a.status), chain: ['__owner', '__lead', h.id] }));
    /* every specialist gets its own vertical channel inside the gutter, so no two connectors share a line */
    const gx0 = xs[2] + CW + 16, gx1 = xs[3] - 22, step = specs.length > 1 ? (gx1 - gx0) / (specs.length - 1) : 0;
    specs.forEach((s, i) => { const h = s.gi, bx = specs.length > 1 ? gx0 + i * step : (gx0 + gx1) / 2; links.push({ id: s.n.id, g: link(svg, [[xs[2] + CW, hy(h) + CH / 2], [bx, hy(h) + CH / 2], [bx, hy(i) + CH / 2], [xs[3], hy(i) + CH / 2]], s.n.color, s.n.a.status), chain: ['__owner', '__lead', heads[h].id, s.n.id] }); });
    const nodes = [];
    nodes.push({ n: m.owner, g: card(svg, m.owner, xs[0], my - (m.lead ? 0 : 0), now) });
    if (m.lead) nodes.push({ n: m.lead, g: card(svg, m.lead, xs[1], my, now) });
    heads.forEach((h, i) => nodes.push({ n: h, g: card(svg, h, xs[2], hy(i), now) }));
    specs.forEach((s, i) => nodes.push({ n: s.n, g: card(svg, s.n, xs[3], hy(i), now) }));
    if (hooks) hooks(nodes, links);
    return { W, H, nodes, links };
  }
  /* Live mode: HUMAN | AGENTIC AI sessions | AI AGENTS (the sub-agents each session started). Real data only. */
  function sessions(svg, m, now, hooks) {
    const sv = C.sv, T = C.T(), P = 34, gap = 120, xs = [0, 1, 2].map((i) => P + i * (CW + gap)), W = xs[2] + CW + P, pitch = CH + GY, top = P + 96;
    let y = top; const blocks = m.sessions.map((s) => { const n = Math.max(1, s.kids.length), h = n * pitch - GY, b = { s, y, h }; y += h + 46; return b; });
    const bot = Math.max(y - 46, top + CH), H = bot + P + 18; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
    const band = (x, yy, w, h, color) => { sv('rect', { x, y: yy, width: w, height: h, rx: 24, fill: color, opacity: .07 }, svg); sv('rect', { x, y: yy, width: w, height: h, rx: 24, fill: 'none', stroke: color, 'stroke-width': 1.4, opacity: .55 }, svg); };
    band(xs[1] - 16, P - 8, CW + 32, bot - P + 30, T.a3); band(xs[2] - 16, P - 8, CW + 32, bot - P + 30, T.a1);
    const lab = (t, sub, x, yy, color) => { const a = sv('text', { x, y: yy, 'font-size': 15, 'font-weight': 600, 'letter-spacing': '.1em', fill: color }, svg); a.textContent = t; const b = sv('text', { x, y: yy + 20, 'font-size': 13, fill: T.ink2 }, svg); b.textContent = sub; };
    lab('HUMAN', 'decides and approves', xs[0], P + 12, T.a2); lab('AGENTIC AI', 'sessions that plan and delegate', xs[1], P + 12, T.a3); lab('AI AGENTS', 'sub-agents each session started', xs[2], P + 12, T.a1);
    const mid = (top + bot) / 2 - CH / 2, trunk = xs[0] + CW + gap / 2, links = [], nodes = [];
    blocks.forEach((b) => { const sy = b.y + (b.h - CH) / 2; b.sy = sy; links.push({ id: b.s.node.id, g: link(svg, [[xs[0] + CW, mid + CH / 2], [trunk, mid + CH / 2], [trunk, sy + CH / 2], [xs[1], sy + CH / 2]], T.a3, b.s.node.a.status), chain: ['__owner', b.s.node.id] });
      const bx = xs[1] + CW + gap / 2; b.s.kids.forEach((k, i) => { const ky = b.y + i * pitch; links.push({ id: k.id, g: link(svg, [[xs[1] + CW, sy + CH / 2], [bx, sy + CH / 2], [bx, ky + CH / 2], [xs[2], ky + CH / 2]], T.a1, k.a.status), chain: ['__owner', b.s.node.id, k.id] }); }); });
    nodes.push({ n: m.owner, g: card(svg, m.owner, xs[0], mid, now) });
    blocks.forEach((b) => { nodes.push({ n: b.s.node, g: card(svg, b.s.node, xs[1], b.sy, now) }); b.s.kids.forEach((k, i) => nodes.push({ n: k, g: card(svg, k, xs[2], b.y + i * pitch, now) })); });
    if (!blocks.length) { const e = sv('text', { x: W / 2, y: top + 60, 'text-anchor': 'middle', 'font-size': 20, fill: T.ink3 }, svg); e.textContent = 'No Claude Code session has been active in the last 6 hours.'; }
    if (hooks) hooks(nodes, links); return { W, H, nodes, links };
  }
  return { init: (ctx) => { C = ctx; }, layered, sessions, card, face, BEATS, CW, CH };
})();
