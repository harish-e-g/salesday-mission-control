/* SalesDay Mission Control: colour schemes. Every scheme is a set of CSS variables; widgets and canvases read them, nothing is hard-coded. */
const THEMES = {
  forest: { name: 'Forest Glass', note: 'Dark green glass, mint and butter accents (the current look)', mode: 'dark',
    bg0: '#070D0A', bg1: '#0F1B14', glow1: 'rgba(86,160,125,.28)', glow2: 'rgba(168,230,216,.10)', ink: '#EAF3EE', ink2: '#A9BDB2', ink3: '#7C9488',
    card1: 'rgba(255,255,255,.085)', card2: 'rgba(255,255,255,.02)', tint1: 'rgba(94,168,140,.42)', tint2: 'rgba(40,86,66,.30)', line: 'rgba(255,255,255,.10)', track: 'rgba(255,255,255,.07)',
    a1: '#A8E6D8', a2: '#E8E28C', a3: '#E6B8F5', a4: '#F4A06B', a5: '#F08A8A', onA2: '#1B2210', face: '#1F1F1F', shadow: 'rgba(0,0,0,.8)' },
  cobalt: { name: 'Midnight Cobalt', note: 'Deep navy glass, ice blue and amber (close to the SalesDay product blue)', mode: 'dark',
    bg0: '#050A18', bg1: '#0C1733', glow1: 'rgba(72,112,255,.30)', glow2: 'rgba(143,211,255,.10)', ink: '#EAF0FF', ink2: '#A9B6D6', ink3: '#7A89AE',
    card1: 'rgba(255,255,255,.085)', card2: 'rgba(255,255,255,.02)', tint1: 'rgba(70,110,230,.46)', tint2: 'rgba(30,50,130,.34)', line: 'rgba(255,255,255,.11)', track: 'rgba(255,255,255,.07)',
    a1: '#8FD3FF', a2: '#FFD66B', a3: '#B7A6FF', a4: '#FF9C6E', a5: '#FF7C94', onA2: '#231B05', face: '#1B1F2E', shadow: 'rgba(0,0,0,.8)' },
  graphite: { name: 'Graphite Lime', note: 'Near-black graphite, one electric lime accent, quiet everything else', mode: 'dark',
    bg0: '#08090A', bg1: '#15181A', glow1: 'rgba(200,245,96,.12)', glow2: 'rgba(142,227,239,.07)', ink: '#F1F3EC', ink2: '#AEB4A6', ink3: '#7F8576',
    card1: 'rgba(255,255,255,.07)', card2: 'rgba(255,255,255,.015)', tint1: 'rgba(200,245,96,.20)', tint2: 'rgba(120,150,40,.14)', line: 'rgba(255,255,255,.10)', track: 'rgba(255,255,255,.07)',
    a1: '#C8F560', a2: '#8EE3EF', a3: '#D9C2FF', a4: '#FFB36B', a5: '#FF8A8A', onA2: '#06191C', face: '#1A1D12', shadow: 'rgba(0,0,0,.85)' },
  aubergine: { name: 'Aubergine Dusk', note: 'Deep plum glass, rose and peach, warm and friendly', mode: 'dark',
    bg0: '#0F0818', bg1: '#25123B', glow1: 'rgba(200,90,200,.28)', glow2: 'rgba(255,184,217,.10)', ink: '#F7EEFA', ink2: '#C4B2CF', ink3: '#97839F',
    card1: 'rgba(255,255,255,.085)', card2: 'rgba(255,255,255,.02)', tint1: 'rgba(190,100,200,.42)', tint2: 'rgba(90,40,120,.34)', line: 'rgba(255,255,255,.11)', track: 'rgba(255,255,255,.07)',
    a1: '#FFB8D9', a2: '#FFE08A', a3: '#B9C4FF', a4: '#FF9F7A', a5: '#FF8FA3', onA2: '#2A2005', face: '#2A1630', shadow: 'rgba(0,0,0,.8)' },
  porcelain: { name: 'Porcelain Teal', note: 'Light paper with deep teal and coral; dark ink on light surfaces', mode: 'light',
    bg0: '#E6ECE8', bg1: '#F5F3EE', glow1: 'rgba(31,165,140,.16)', glow2: 'rgba(228,112,58,.08)', ink: '#14201B', ink2: '#44564E', ink3: '#6B7C74',
    card1: 'rgba(255,255,255,.92)', card2: 'rgba(255,255,255,.62)', tint1: 'rgba(31,165,140,.22)', tint2: 'rgba(31,165,140,.08)', line: 'rgba(20,32,27,.10)', track: 'rgba(20,32,27,.08)',
    a1: '#1FA58C', a2: '#E2B100', a3: '#8A63D2', a4: '#E4703A', a5: '#D9534F', onA2: '#2B2100', face: '#1F1F1F', shadow: 'rgba(30,50,40,.22)' },
};
function themeVars(t) { return Object.entries(t).filter(([k]) => k !== 'name' && k !== 'note' && k !== 'mode').map(([k, v]) => `--${k}:${v}`).join(';'); }
function applyTheme(key, node) {
  const t = THEMES[key] || THEMES.forest, root = node || document.documentElement;
  root.setAttribute('style', themeVars(t)); root.setAttribute('data-mode', t.mode); if (!node) document.documentElement.style.colorScheme = t.mode;
  return t;
}
function themeColor(node, v) { return getComputedStyle(node).getPropertyValue('--' + v).trim(); }
