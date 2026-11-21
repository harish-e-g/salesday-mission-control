/* SalesDay Mission Control: KPI widgets. Plain DOM and SVG, colours come only from CSS variables (see theme.js). */
const wEl = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e };
const SVGNS = 'http://www.w3.org/2000/svg';

/* concentric progress rings, outermost first: parts = [{v: 0..1, color: 'var(--a1)'}] */
function ring(parts) {
  const svg = document.createElementNS(SVGNS, 'svg'); svg.setAttribute('viewBox', '0 0 200 200');
  parts.forEach((p, i) => {
    const r = 90 - i * 17, len = 2 * Math.PI * r;
    for (const [col, frac] of [['var(--track)', 1], [p.color, Math.max(.012, Math.min(1, p.v))]]) {
      const c = document.createElementNS(SVGNS, 'circle');
      for (const [k, v] of [['cx', 100], ['cy', 100], ['r', r], ['fill', 'none'], ['stroke-width', 11], ['stroke-linecap', 'round'], ['stroke-dasharray', `${len * frac} ${len}`]]) c.setAttribute(k, v);
      c.style.stroke = col; svg.appendChild(c);
    }
  });
  return svg;
}

/* mood faces: 'happy' | 'calm' | 'worried' | 'angry' | 'none' (outline, for days that have not happened) */
const FACE_COLOR = { happy: 'var(--a1)', calm: 'var(--a3)', worried: 'var(--a2)', angry: 'var(--a4)' };
const FACE_LABEL = { happy: 'busy day', calm: 'steady day', worried: 'slow day', angry: 'quiet day', none: 'not yet' };
function faceSvg(kind, size) {
  const s = size || 40, f = 'var(--face)';
  const parts = {
    happy: `<path d="M12 21q4-6 8 0M28 21q4-6 8 0" fill="none" stroke="${f}" stroke-width="2.6" stroke-linecap="round"/><path d="M13 28q11 14 22 0z" fill="${f}"/><path d="M19 34q5 4 10 0" fill="none" stroke="var(--a4)" stroke-width="3" stroke-linecap="round"/>`,
    calm: `<circle cx="16" cy="21" r="5.2" fill="#fff"/><circle cx="32" cy="21" r="5.2" fill="#fff"/><circle cx="16" cy="21.5" r="2.6" fill="${f}"/><circle cx="32" cy="21.5" r="2.6" fill="${f}"/><path d="M17 33h14" stroke="${f}" stroke-width="2.6" stroke-linecap="round"/>`,
    worried: `<circle cx="16" cy="22" r="2.6" fill="${f}"/><circle cx="32" cy="22" r="2.6" fill="${f}"/><path d="M11 15l8-2M37 15l-8-2" stroke="${f}" stroke-width="2.2" stroke-linecap="round"/><path d="M17 34q7-6 14 0" fill="none" stroke="${f}" stroke-width="2.6" stroke-linecap="round"/>`,
    angry: `<path d="M10 16l11 4M38 16l-11 4" stroke="${f}" stroke-width="3" stroke-linecap="round"/><circle cx="17" cy="25" r="2.8" fill="${f}"/><circle cx="31" cy="25" r="2.8" fill="${f}"/><path d="M16 36q8-7 16 0" fill="none" stroke="${f}" stroke-width="3" stroke-linecap="round"/>`,
    none: `<circle cx="17" cy="21" r="2" fill="currentColor"/><circle cx="31" cy="21" r="2" fill="currentColor"/><path d="M15 29q9 9 18 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
  };
  const k = parts[kind] ? kind : 'none';
  const base = k === 'none' ? `<circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="2"/>` : `<circle cx="24" cy="24" r="22" fill="${FACE_COLOR[k]}"/>`;
  const wrap = wEl('span', 'face'); wrap.style.width = wrap.style.height = s + 'px';
  wrap.innerHTML = `<svg viewBox="0 0 48 48" width="${s}" height="${s}" role="img" aria-label="${FACE_LABEL[k]}">${base}${parts[k]}</svg>`;
  return wrap;
}
function ratio(v, max, min) { return max > min ? (v - min) / (max - min) : .5 }
function moodOf(v, max, min) { const r = ratio(v, max, min || 0); return r >= .75 ? 'happy' : r >= .45 ? 'calm' : r >= .2 ? 'worried' : 'angry' }

/* 1. dot matrix: one dot per open item, lit by status. items = [{kind: 'critical'|'progress'|'pending'|'todo'}] */
const DOT_COLOR = { critical: 'var(--a5)', progress: 'var(--a2)', pending: 'var(--a3)', todo: 'var(--a4)' };
function dotMatrix(node, { title, value, total, items, cols }) {
  { const k = JSON.stringify(arguments[1]); if (node.__k === k) return; node.__k = k; }
  node.replaceChildren();
  const head = wEl('div', 'wHead'); head.append(wEl('span', 'wIcon', '◈'), wEl('span', null, title)); node.append(head);
  const big = wEl('div', 'wBig'); big.append(document.createTextNode(String(value)), wEl('small', null, '/' + total)); node.append(big);
  const g = wEl('div', 'dotGrid'); g.style.setProperty('--cols', cols || 6);
  const order = ['progress', 'pending', 'todo'];
  items.slice().sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind)).slice(0, 96).forEach((it) => { const d = wEl('i', 'dotLit'); d.style.background = DOT_COLOR[it.kind]; d.title = it.kind + (it.crit ? ', critical' : ''); if (it.crit) d.classList.add('crit'); g.append(d) });
  const n = Math.max(0, Math.ceil(items.length / (cols || 6)) * (cols || 6) - items.length); for (let i = 0; i < n; i++) g.append(wEl('i', 'dotOff'));
  node.append(g);
  const lg = wEl('div', 'dotLegend'); for (const [k, t] of [['progress', 'progressing'], ['pending', 'pending'], ['todo', 'not started']]) { const s = wEl('span'); const dt = wEl('i', 'dotLit sm'); dt.style.background = DOT_COLOR[k]; s.append(dt, document.createTextNode(' ' + t)); lg.append(s) } { const s = wEl('span'); s.append(wEl('i', 'dotLit sm crit'), document.createTextNode(' ring = critical')); lg.append(s) }
  node.append(lg);
}

/* 2. week strip: calendar week Sun..Sat with a face per day that has happened. days = [{label, date, v|null, today}] */
function dayStrip(node, { days, max, min }) {
  { const k = JSON.stringify(arguments[1]); if (node.__k === k) return; node.__k = k; }
  node.replaceChildren(); const row = wEl('div', 'dayStrip');
  days.forEach((d) => {
    const c = wEl('div', 'dayCell' + (d.today ? ' today' : '')); c.append(wEl('span', 'dl', d.label), wEl('b', null, String(d.date)));
    const f = wEl('div', 'dayFace'); f.append(faceSvg(d.v == null ? 'none' : moodOf(d.v, max, min), 34)); if (d.v != null) f.title = d.v + ' rows updated'; row.append(c); const fw = wEl('div', 'dayFaceWrap'); fw.append(f); c.append(fw);
  });
  node.append(row);
}

/* 3. dot plot with a selectable column, like a health overview. points = [{label, v}] */
function dotPlot(node, { title, unit, points, sel, onPick }) {
  { const k = JSON.stringify(arguments[1]); if (node.__k === k) return; node.__k = k; }
  node.replaceChildren(); let cur = sel == null ? points.length - 1 : sel; const mx = Math.max(1, ...points.map((p) => p.v));
  const head = wEl('div', 'wHead'); head.append(wEl('span', 'wIcon', '⌕'), wEl('span', null, title)); node.append(head);
  const big = wEl('div', 'wBig'); const num = document.createTextNode(''); const un = wEl('small', null, ' ' + unit); big.append(num, un); node.append(big);
  const plot = wEl('div', 'dotPlot'); node.append(plot);
  const cols = points.map((p, i) => {
    const c = wEl('button', 'dpCol'); c.type = 'button'; c.setAttribute('aria-label', p.label + ': ' + p.v + ' ' + unit);
    const line = wEl('span', 'dpLine'), dot = wEl('span', 'dpDot'), tag = wEl('span', 'dpTag', String(p.v)), lab = wEl('span', 'dpLab', p.label);
    dot.style.bottom = (8 + p.v / mx * 62) + '%'; tag.style.bottom = dot.style.bottom; c.append(line, dot, tag, lab); c.onclick = () => pick(i); plot.append(c); return c;
  });
  function pick(i) { cur = i; if (onPick) onPick(i); num.nodeValue = String(points[i].v); cols.forEach((c, k) => c.classList.toggle('sel', k === i)) }
  pick(cur);
}

/* 4. mood tracker: a face per period on a dashed line, height = how busy it was. ranges = {Week: [...], '24 h': [...]}, each [{label, v}] */
function moodTracker(node, { ranges, start, onRange }) {
  { const k = JSON.stringify(arguments[1]); if (node.__k === k) return; node.__k = k; }
  node.replaceChildren(); const keys = Object.keys(ranges); let cur = start || keys[0];
  const head = wEl('div', 'wHead split'); head.append(wEl('span', null, 'Mood tracker'));
  const sel = wEl('div', 'seg'); keys.forEach((k) => { const b = wEl('button', null, k); b.type = 'button'; b.onclick = () => { cur = k; if (onRange) onRange(k); draw() }; sel.append(b) }); head.append(sel); node.append(head);
  const body = wEl('div', 'moodBody'); node.append(body);
  function draw() {
    [...sel.children].forEach((b) => b.setAttribute('aria-pressed', b.textContent === cur)); body.replaceChildren();
    const pts = ranges[cur], mx = Math.max(1, ...pts.map((p) => p.v)), mn = Math.min(...pts.map((p) => p.v));
    pts.forEach((p) => { const col = wEl('div', 'moodCol'); const f = wEl('div', 'moodFace'); f.style.top = (6 + (1 - ratio(p.v, mx, mn)) * 56) + '%'; f.append(faceSvg(moodOf(p.v, mx, mn), 36)); f.title = p.v + ' rows updated'; col.append(f, wEl('span', 'moodLine'), wEl('span', 'moodLab', p.label)); body.append(col) });
  }
  draw();
}

/* small smooth area chart for previews. vals = numbers, drawn in the theme's colour */
function sparkArea(canvas, vals, color) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), w = canvas.clientWidth, h = canvas.clientHeight; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const x = canvas.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
  const mx = Math.max(1, ...vals), P = vals.map((v, i) => ({ x: 6 + (w - 12) * i / (vals.length - 1), y: 8 + (h - 22) * (1 - v / mx) }));
  const path = new Path2D(); P.forEach((p, i) => { if (!i) path.moveTo(p.x, p.y); else { const q = P[i - 1], m = (q.x + p.x) / 2; path.bezierCurveTo(m, q.y, m, p.y, p.x, p.y) } });
  const area = new Path2D(path); area.lineTo(P.at(-1).x, h - 6); area.lineTo(P[0].x, h - 6); area.closePath();
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, color + '66'); g.addColorStop(1, color + '00'); x.fillStyle = g; x.fill(area);
  x.strokeStyle = color; x.lineWidth = 2.4; x.lineJoin = 'round'; x.stroke(path); x.fillStyle = color; x.beginPath(); x.arc(P.at(-1).x, P.at(-1).y, 4, 0, 7); x.fill();
}

/* derive every widget's data from one mission-control state object */
function widgetData(s, now) {
  const today = now ? new Date(now) : new Date(), dow = today.getDay(), dayMs = 864e5;
  const byLabel = {}; (s.week || []).forEach((w) => { byLabel[w.d] = w.n });
  const wk = Array.from({ length: 7 }, (_, i) => { const dt = new Date(today.getTime() + (i - dow) * dayMs), lab = dt.toLocaleDateString('en', { weekday: 'short' }); return { label: lab, date: dt.getDate(), v: i <= dow ? (byLabel[lab] ?? 0) : null, today: i === dow, md: String(dt.getDate()).padStart(2, '0') + '/' + String(dt.getMonth() + 1).padStart(2, '0') } });
  const past = wk.filter((d) => d.v != null), max = Math.max(1, ...(s.week || []).map((w) => w.n));
  const hours = s.hours || [], two = []; for (let i = 0; i + 1 < hours.length; i += 2) two.push({ label: String(hours[i].h).padStart(2, '0') + 'h', v: hours[i].n + hours[i + 1].n });
  const S = s.status || {};
  const kindOf = (st) => (st === 'I' ? 'progress' : st === 'N' ? 'todo' : 'pending');
  const items = (s.openDots && s.openDots.length ? s.openDots.map((r) => ({ kind: kindOf(r.st), crit: r.crit })) : [].concat(Array(S.I || 0).fill({ kind: 'progress' }), Array(Math.max(0, (S.P || 0) + (S.B || 0))).fill({ kind: 'pending' }), Array(S.N || 0).fill({ kind: 'todo' })));
  return { wk, max, min: Math.min(...past.map((d) => d.v), max), week: past.map((d) => ({ label: d.md, v: d.v })), weekDots: (s.week || []).map((w) => ({ label: w.d, v: w.n })), hours: two.slice(-12), items, done: s.totals.done, rows: s.totals.rows, open: s.totals.open };
}
