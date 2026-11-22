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
    if (n.kind === 'owner') return n.count ? n.count + ' waiting on you' : 'Nothing waiting on you';
    if (n.kind === 'lead') return 'Working · ' + cd(now - (n.since || now));
    const x = n.a; if (x.status === 'working') return 'Working · ' + cd(now - (x.since || now));
    if (x.status === 'waiting') return 'Needs you · ' + cd(now - (x.since || now));
    if (!x.since && x.status !== 'working') return 'Idle · no job in 24 h';
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
  /* The master is the agentic AI, so it is drawn as a robot, never as a person. */
  function robot(g, id, color, r) {
    const sv = C.sv, T = C.T(), f = sv('g', { transform: `scale(${r / 28})` }, g), dark = C.dark();
    sv('circle', { r: 28, fill: color, opacity: .22 }, f);
    sv('line', { x1: 0, y1: -14, x2: 0, y2: -22, stroke: color, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, f); sv('circle', { cx: 0, cy: -24, r: 3.2, fill: '#2fe0a8' }, f);
    sv('rect', { x: -19, y: -7, width: 4.5, height: 10, rx: 2, fill: color }, f); sv('rect', { x: 14.5, y: -7, width: 4.5, height: 10, rx: 2, fill: color }, f);
    sv('rect', { x: -15, y: 12, width: 30, height: 16, rx: 7, fill: color }, f); sv('circle', { cx: 0, cy: 20, r: 2.8, fill: '#2fe0a8' }, f);
    sv('rect', { x: -14.5, y: -15, width: 29, height: 26, rx: 8, fill: color }, f);
    sv('rect', { x: -10.5, y: -10.5, width: 21, height: 15, rx: 5, fill: '#1b1340' }, f);
    sv('circle', { cx: -4.5, cy: -3, r: 2.7, fill: '#8fffd6' }, f); sv('circle', { cx: 4.5, cy: -3, r: 2.7, fill: '#8fffd6' }, f); sv('path', { d: 'M-4 3.2h8', stroke: '#8fffd6', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, f);
  }
  /* The owner is the MASTER: a crown emblem, never a human face. */
  function crown(g, r) {
    const sv = C.sv, T = C.T(), f = sv('g', { transform: `scale(${r / 28})` }, g);
    sv('circle', { r: 28, fill: T.a2, opacity: .28 }, f); sv('path', { d: 'M-15 10L-18 -8l9 7 9-13 9 13 9-7-3 18z', fill: T.a2 }, f); sv('rect', { x: -15, y: 12, width: 30, height: 5, rx: 2.5, fill: T.a2 }, f);
    [[-18, -8], [0, -14], [18, -8]].forEach(([x, y]) => sv('circle', { cx: x, cy: y, r: 3, fill: '#fff' }, f)); sv('circle', { cx: 0, cy: 3, r: 2.6, fill: '#fff', opacity: .9 }, f);
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
    const g = sv('g', { transform: `translate(${x},${y})`, class: 'fcard', 'data-id': n.id, tabindex: 0, role: 'button', 'aria-label': n.name + ', ' + n.role + ', ' + n.dept + ', ' + (n.kind === 'owner' ? 'master, the owner' : (n.kind === 'lead' || n.kind === 'session') ? 'agentic AI' : 'AI agent') }, svg);
    const base = dark ? '#10241e' : '#ffffff';
    sv('rect', { width: CW, height: CH, rx: 16, fill: base }, g);
    sv('rect', { width: CW, height: CH, rx: 16, fill: st === 'idle' ? T.ink3 : tone, opacity: st === 'idle' ? .06 : .11 }, g);
    const edge = sv('rect', { width: CW, height: CH, rx: 16, fill: 'none', stroke: st === 'idle' ? T.ink3 : st === 'working' ? dc : tone, 'stroke-width': st === 'waiting' ? 2.8 : st === 'working' ? 2 : 1.5, opacity: st === 'idle' ? .55 : 1 }, g);
    if (st === 'waiting') edge.setAttribute('class', 'glowAmber');
    sv('rect', { x: 0, y: 16, width: 5, height: CH - 32, rx: 2.5, fill: st === 'idle' ? T.ink3 : dc, opacity: st === 'idle' ? .5 : 1 }, g);
    if (st === 'working') { const p = sv('circle', { cx: 44, cy: CH / 2, r: 30, class: 'ring', fill: 'none', stroke: tone, 'stroke-width': 2 }, g); p.style.animationDelay = (Math.random() * 2) + 's'; }
    sv('circle', { cx: 44, cy: CH / 2, r: 30, fill: 'none', stroke: tone, 'stroke-width': st === 'working' ? 4 : 2.6, opacity: st === 'idle' ? .6 : 1 }, g);
    const cid = 'fc_' + n.id + '_' + Math.round(x) + '_' + Math.round(y), cp = sv('clipPath', { id: cid }, g); sv('circle', { cx: 44, cy: CH / 2, r: 26 }, cp);
    const holder = sv('g', { 'clip-path': `url(#${cid})`, opacity: st === 'idle' ? .5 : st === 'resting' ? .62 : 1 }, g), inner = sv('g', { transform: `translate(44 ${CH / 2})` }, holder); if (n.kind === 'owner') crown(inner, 26); else if (n.kind === 'session' || n.kind === 'lead') robot(inner, n.id, dc, 26); else face(inner, n.id, dc, 26);
    if (st === 'resting') { sv('circle', { cx: 66, cy: 20, r: 9, fill: T.a3 }, g); sv('path', { d: 'M66.8 15.5a5 5 0 105 6a4 4 0 01-5-6z', fill: '#fff' }, g); }
    const lines = [[n.name, 15, 600, T.ink, 17], [n.role, 12, 500, T.ink2, 25], [n.dept, 11, 600, st === 'idle' ? T.ink3 : dc, 26], [stat(n, now), 11.5, 600, tone, 26]];
    let ty = 23; for (const [t, fs, fw, fill, m] of lines) { const e = sv('text', { x: 84, y: ty, 'font-size': fs, 'font-weight': fw, fill }, g); e.textContent = fit(t, m); ty += 18; }
    /* The pill sits on the top border, so it never touches a word. */
    const human = n.kind === 'owner', lead = n.kind === 'lead' || n.kind === 'session', label = human ? 'MASTER' : lead ? 'AGENTIC AI' : 'AI AGENT', pw = human ? 76 : lead ? 88 : 74;
    sv('rect', { x: CW - pw - 12, y: -9, width: pw, height: 18, rx: 9, class: 'aip', fill: human ? T.a2 : lead ? T.a3 : (dark ? T.a1 : '#14201B') }, g);
    const pt = sv('text', { x: CW - pw / 2 - 12, y: 3.6, 'text-anchor': 'middle', 'font-size': 9.5, 'font-weight': 600, 'letter-spacing': '.06em', fill: human ? (T.onA2 || '#1B2210') : lead ? '#ffffff' : (dark ? '#06241c' : '#ffffff') }, g); pt.textContent = label;
    return g;
  }
  /* Layered pipeline with department blocks: MASTER (owner) | AGENTIC AI (Oliver) | AI AGENTS by department: head, then specialists along the row.
     Each department sits in its own colour band with its name, so the structure reads at a glance. Every connector has its own channel; no line touches a word. */
  function layered(svg, m, now, hooks) {
    const sv = C.sv, T = C.T(), P = 34, gap = 108, xs = [0, 1, 2, 3].map((i) => P + i * (CW + gap)), W = xs[3] + CW + P, pitch = CH + GY, top = P + 104;
    let y = top; const blocks = m.groups.map((g) => { const rows = Math.max(1, g.nodes.length - 1), h = rows * pitch - GY, b = { g, y, h, rows }; y += h + 74; return b; });
    const bot = y - 74 + 18, H = bot + P + 10; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
    const band = (x, yy, w, h, color, o, line) => { sv('rect', { x, y: yy, width: w, height: h, rx: 22, fill: color, opacity: o }, svg); sv('rect', { x, y: yy, width: w, height: h, rx: 22, fill: 'none', stroke: color, 'stroke-width': line || 1.4, opacity: .5 }, svg); };
    band(xs[1] - 18, P - 14, xs[1] === xs[1] ? CW + 36 : 0, bot - (P - 14) + 10, T.a3, .06);
    const lab = (t, sub, x, yy, color) => { const a = sv('text', { x, y: yy, 'font-size': 15, 'font-weight': 600, 'letter-spacing': '.1em', fill: color }, svg); a.textContent = t; const b = sv('text', { x, y: yy + 20, 'font-size': 13, fill: T.ink2 }, svg); b.textContent = sub; };
    lab('MASTER', 'decides and approves', xs[0], P + 12, T.a2); lab('AGENTIC AI', 'plans, delegates, verifies', xs[1], P + 12, T.a3); lab('AI AGENTS', 'by department: head, then specialists', xs[2], P + 12, T.a1);
    blocks.forEach((b) => { const c = b.g.nodes[0].color; band(xs[2] - 16, b.y - 36, xs[3] + CW + 16 - (xs[2] - 16), b.h + 36 + 18, c, .08);
      const t = sv('text', { x: xs[2] + 6, y: b.y - 14, 'font-size': 13, 'font-weight': 600, 'letter-spacing': '.1em', fill: c }, svg); t.textContent = b.g.d.name.toUpperCase() + '  ·  ' + b.g.nodes.length + (b.g.nodes.length === 1 ? ' AGENT' : ' AGENTS'); });
    const my = (top + bot - 18) / 2 - CH / 2 - 8, trunk = xs[1] + CW + gap / 2, oy = my, links = [], nodes = [];
    links.push({ id: m.lead ? '__lead' : '__owner', g: link(svg, [[xs[0] + CW, my + CH / 2], [xs[1], my + CH / 2]], T.a2, m.wait ? 'waiting' : 'idle'), chain: ['__owner', '__lead'] });
    blocks.forEach((b) => { const h = b.g.nodes[0], hy = b.y; links.push({ id: h.id, g: link(svg, [[xs[1] + CW, my + CH / 2], [trunk, my + CH / 2], [trunk, hy + CH / 2], [xs[2], hy + CH / 2]], h.color, h.a.status), chain: ['__owner', '__lead', h.id] });
      const bx = xs[2] + CW + gap / 2 - 10; b.g.nodes.slice(1).forEach((s, k) => { const sy = b.y + k * pitch; links.push({ id: s.id, g: link(svg, [[xs[2] + CW, hy + CH / 2], [bx, hy + CH / 2], [bx, sy + CH / 2], [xs[3], sy + CH / 2]], s.color, s.a.status), chain: ['__owner', '__lead', h.id, s.id] }); }); });
    nodes.push({ n: m.owner, g: card(svg, m.owner, xs[0], my, now) }); if (m.lead) nodes.push({ n: m.lead, g: card(svg, m.lead, xs[1], my, now) });
    blocks.forEach((b) => { nodes.push({ n: b.g.nodes[0], g: card(svg, b.g.nodes[0], xs[2], b.y, now) }); b.g.nodes.slice(1).forEach((s, k) => nodes.push({ n: s, g: card(svg, s, xs[3], b.y + k * pitch, now) })); });
    if (hooks) hooks(nodes, links); return { W, H, nodes, links };
  }
  /* Compact lane layout for one screen: MASTER and Oliver stacked on the left, one lane per department on the right, three single lines per card.
     Everything is drawn in one fixed box so the page scales it to fit the screen with no scrolling. Connectors end on the lane edge, never across text. */
  const CWC = 240, CHC = 64;
  function cardC(svg, n, x, y, now) {
    const sv = C.sv, T = C.T(), dark = C.dark(), st = (n.kind === 'agent' || n.kind === 'session') ? n.a.status : n.kind === 'lead' ? 'working' : 'owner', dc = n.color;
    const tone = st === 'working' ? T.a1 : st === 'waiting' ? T.a2 : st === 'resting' ? T.a3 : st === 'owner' ? T.a2 : T.ink3;
    const g = sv('g', { transform: `translate(${x},${y})`, class: 'fcard', 'data-id': n.id, tabindex: 0, role: 'button', 'aria-label': n.name + ', ' + n.role + ', ' + n.dept }, svg);
    sv('rect', { width: CWC, height: CHC, rx: 14, fill: dark ? '#10241e' : '#ffffff' }, g);
    sv('rect', { width: CWC, height: CHC, rx: 14, fill: st === 'idle' ? T.ink3 : tone, opacity: st === 'idle' ? .06 : .11 }, g);
    const edge = sv('rect', { width: CWC, height: CHC, rx: 14, fill: 'none', stroke: st === 'idle' ? T.ink3 : st === 'working' ? dc : tone, 'stroke-width': st === 'waiting' ? 2.6 : st === 'working' ? 2 : 1.4, opacity: st === 'idle' ? .55 : 1 }, g); if (st === 'waiting') edge.setAttribute('class', 'glowAmber');
    sv('rect', { x: 0, y: 12, width: 4, height: CHC - 24, rx: 2, fill: st === 'idle' ? T.ink3 : dc, opacity: st === 'idle' ? .5 : 1 }, g);
    if (st === 'working') { const p = sv('circle', { cx: 36, cy: CHC / 2, r: 24, class: 'ring', fill: 'none', stroke: tone, 'stroke-width': 2 }, g); p.style.animationDelay = (Math.random() * 2) + 's'; }
    sv('circle', { cx: 36, cy: CHC / 2, r: 24, fill: 'none', stroke: tone, 'stroke-width': st === 'working' ? 3.4 : 2.2, opacity: st === 'idle' ? .6 : 1 }, g);
    const cid = 'fk_' + n.id + '_' + Math.round(x) + '_' + Math.round(y), cp = sv('clipPath', { id: cid }, g); sv('circle', { cx: 36, cy: CHC / 2, r: 21 }, cp);
    const holder = sv('g', { 'clip-path': `url(#${cid})`, opacity: st === 'idle' ? .5 : st === 'resting' ? .62 : 1 }, g), inner = sv('g', { transform: `translate(36 ${CHC / 2})` }, holder);
    if (n.kind === 'owner') crown(inner, 21); else if (n.kind === 'session' || n.kind === 'lead') robot(inner, n.id, dc, 21); else face(inner, n.id, dc, 21);
    if (st === 'resting') { sv('circle', { cx: 52, cy: 14, r: 7, fill: T.a3 }, g); sv('path', { d: 'M52.6 10.4a4 4 0 103.8 4.8a3.2 3.2 0 01-3.8-4.8z', fill: '#fff' }, g); }
    const lines = [[n.name, 14, 600, T.ink, 16], [n.role, 11.5, 500, T.ink2, 24], [stat(n, now), 11, 600, tone, 28]]; let ty = 21;
    for (const [t, fs, fw, fill, m] of lines) { const e = sv('text', { x: 70, y: ty, 'font-size': fs, 'font-weight': fw, fill }, g); e.textContent = fit(t, m); ty += 17; }
    const human = n.kind === 'owner', lead = n.kind === 'lead' || n.kind === 'session', label = human ? 'MASTER' : lead ? 'AGENTIC AI' : 'AI AGENT', pw = human ? 62 : lead ? 74 : 62;
    sv('rect', { x: CWC - pw - 10, y: -8, width: pw, height: 16, rx: 8, class: 'aip', fill: human ? T.a2 : lead ? T.a3 : (dark ? T.a1 : '#14201B') }, g);
    const pt = sv('text', { x: CWC - pw / 2 - 10, y: 3, 'text-anchor': 'middle', 'font-size': 8.5, 'font-weight': 700, 'letter-spacing': '.06em', fill: human ? (T.onA2 || '#1B2210') : lead ? '#ffffff' : (dark ? '#06241c' : '#ffffff') }, g); pt.textContent = label;
    return g;
  }
  const wrapWords = (s, n) => { const out = []; let cur = ''; for (const w of String(s).split(/\s+/)) { if ((cur + ' ' + w).trim().length > n && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out; };
  function compact(svg, m, now, hooks) {
    const sv = C.sv, T = C.T(), P = 16, leftW = 236, gap = 34, titleW = 150, laneH = CHC + 16, pitch = laneH + 8, rows = m.groups.length;
    const trunk = P + leftW + 34, laneX = trunk + 34, headX = laneX + titleW + 12, maxN = Math.max(1, ...m.groups.map((g) => g.nodes.length)), laneW = titleW + 12 + maxN * CWC + (maxN - 1) * gap + 16;
    const top = P + 24, W = laneX + laneW + P, H = top + rows * pitch - 8 + P;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.removeAttribute('width'); svg.removeAttribute('height');
    const lab = (t, x, y, color) => { const a = sv('text', { x, y, 'font-size': 12, 'font-weight': 600, 'letter-spacing': '.1em', fill: color }, svg); a.textContent = t; };
    lab('MASTER AND AGENTIC AI', P, P + 6, T.a3); lab('AI AGENTS BY DEPARTMENT', laneX, P + 6, T.a1);
    const midY = top + (rows * pitch - 8) / 2, my = midY - CHC - 22, oy = midY + 22, links = [], nodes = [];
    links.push({ id: '__lead', g: link(svg, [[P + leftW / 2, my + CHC], [P + leftW / 2, oy]], T.a2, m.wait ? 'waiting' : 'idle'), chain: ['__owner', '__lead'], down: true });
    m.groups.forEach((g, i) => {
      const y = top + i * pitch, c = g.nodes[0].color; sv('rect', { x: laneX, y, width: laneW, height: laneH, rx: 18, fill: c, opacity: .08 }, svg); sv('rect', { x: laneX, y, width: laneW, height: laneH, rx: 18, fill: 'none', stroke: c, 'stroke-width': 1.3, opacity: .5 }, svg);
      const tl = wrapWords(g.d.name.toUpperCase(), 17).slice(0, 2); tl.forEach((t, k) => { const e = sv('text', { x: laneX + 14, y: y + 26 + k * 15, 'font-size': 12, 'font-weight': 600, 'letter-spacing': '.04em', fill: c }, svg); e.textContent = t; });
      const ce = sv('text', { x: laneX + 14, y: y + 26 + tl.length * 15 + 4, 'font-size': 11, 'font-weight': 500, fill: T.ink3 }, svg); ce.textContent = g.nodes.length + (g.nodes.length === 1 ? ' agent' : ' agents');
      const cy = y + laneH / 2, h = g.nodes[0];
      links.push({ id: h.id, g: link(svg, [[P + leftW, oy + CHC / 2], [trunk, oy + CHC / 2], [trunk, cy], [laneX, cy]], h.color, h.a.status), chain: ['__owner', '__lead', h.id] });
      g.nodes.slice(1).forEach((s, k) => { const x0 = headX + k * (CWC + gap) + CWC; links.push({ id: s.id, g: link(svg, [[x0, cy], [x0 + gap, cy]], s.color, s.a.status), chain: ['__owner', '__lead', h.id, s.id] }); });
    });
    nodes.push({ n: m.owner, g: cardC(svg, m.owner, P, my, now) }); if (m.lead) nodes.push({ n: m.lead, g: cardC(svg, m.lead, P, oy, now) });
    m.groups.forEach((g, i) => { const y = top + i * pitch + 8; g.nodes.forEach((n, k) => nodes.push({ n, g: cardC(svg, n, headX + k * (CWC + gap), y, now) })); });
    if (hooks) hooks(nodes, links); return { W, H, nodes, links };
  }
  /* Live mode: HUMAN | AGENTIC AI sessions | AI AGENTS (the sub-agents each session started). Real data only. */
  function sessions(svg, m, now, hooks) {
    const sv = C.sv, T = C.T(), P = 34, gap = 120, xs = [0, 1, 2].map((i) => P + i * (CW + gap)), W = xs[2] + CW + P, pitch = CH + GY, top = P + 96;
    let y = top; const blocks = m.sessions.map((s) => { const n = Math.max(1, s.kids.length), h = n * pitch - GY + (s.hidden ? 30 : 0), b = { s, y, h }; y += h + 46; return b; });
    const bot = Math.max(y - 46, top + CH), H = bot + P + 40; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
    const band = (x, yy, w, h, color) => { sv('rect', { x, y: yy, width: w, height: h, rx: 24, fill: color, opacity: .07 }, svg); sv('rect', { x, y: yy, width: w, height: h, rx: 24, fill: 'none', stroke: color, 'stroke-width': 1.4, opacity: .55 }, svg); };
    band(xs[1] - 16, P - 8, CW + 32, bot - P + 30, T.a3); band(xs[2] - 16, P - 8, CW + 32, bot - P + 30, T.a1);
    const lab = (t, sub, x, yy, color) => { const a = sv('text', { x, y: yy, 'font-size': 15, 'font-weight': 600, 'letter-spacing': '.1em', fill: color }, svg); a.textContent = t; const b = sv('text', { x, y: yy + 20, 'font-size': 13, fill: T.ink2 }, svg); b.textContent = sub; };
    lab('MASTER', 'decides and approves', xs[0], P + 12, T.a2); lab('AGENTIC AI', 'sessions that plan and delegate', xs[1], P + 12, T.a3); lab('AI AGENTS', 'sub-agents each session started', xs[2], P + 12, T.a1);
    const mid = (top + bot) / 2 - CH / 2, trunk = xs[0] + CW + gap / 2, links = [], nodes = [];
    blocks.forEach((b) => { const sy = b.y + (b.h - (b.s.hidden ? 30 : 0) - CH) / 2; b.sy = sy; links.push({ id: b.s.node.id, g: link(svg, [[xs[0] + CW, mid + CH / 2], [trunk, mid + CH / 2], [trunk, sy + CH / 2], [xs[1], sy + CH / 2]], T.a3, b.s.node.a.status), chain: ['__owner', b.s.node.id] });
      const bx = xs[1] + CW + gap / 2; b.s.kids.forEach((k, i) => { const ky = b.y + i * pitch; links.push({ id: k.id, g: link(svg, [[xs[1] + CW, sy + CH / 2], [bx, sy + CH / 2], [bx, ky + CH / 2], [xs[2], ky + CH / 2]], T.a1, k.a.status), chain: ['__owner', b.s.node.id, k.id] }); }); });
    nodes.push({ n: m.owner, g: card(svg, m.owner, xs[0], mid, now) });
    blocks.forEach((b) => { nodes.push({ n: b.s.node, g: card(svg, b.s.node, xs[1], b.sy, now) }); b.s.kids.forEach((k, i) => nodes.push({ n: k, g: card(svg, k, xs[2], b.y + i * pitch, now) })); if (b.s.hidden) { const t = sv('text', { x: xs[2] + 8, y: b.y + b.s.kids.length * pitch - GY + 26, 'font-size': 14, 'font-weight': 600, fill: T.ink3 }, svg); t.textContent = '+ ' + b.s.hidden + ' more AI agents today'; } });
    if (m.others) { const t = sv('text', { x: xs[1] + 8, y: bot + 24, 'font-size': 14, 'font-weight': 600, fill: T.ink3 }, svg); t.textContent = '+ ' + m.others + ' other sessions, no AI agents'; }
    if (!blocks.length) { const e = sv('text', { x: W / 2, y: top + 60, 'text-anchor': 'middle', 'font-size': 20, fill: T.ink3 }, svg); e.textContent = 'No Claude Code session has been active in the last 6 hours.'; }
    if (hooks) hooks(nodes, links); return { W, H, nodes, links };
  }
  return { init: (ctx) => { C = ctx; }, layered, compact, sessions, card, face, robot, BEATS, CW, CH };
})();
