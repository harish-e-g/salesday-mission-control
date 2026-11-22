'use strict';
// One clean LinkedIn poster: AI agents, run by agentic AI. Bright, minimal text. Output: linkedin/ready/POST-C-ai-agent-team/
const fs = require('fs'), path = require('path'), os = require('os');
const pw = require(path.join(os.homedir(), 'dev/salesday-rel1359/node_modules/playwright'));
const QR = require(path.join(os.homedir(), 'dev/salesday-rel1359/node_modules/qrcode'));
const R = path.join(__dirname, '..'), OUT = path.join(__dirname, 'ready', 'POST-C-ai-agent-team');
fs.mkdirSync(OUT, { recursive: true });
const REPO = 'https://github.com/harish-e-g/salesday-mission-control', u = (p) => 'file://' + p;
const fonts = `@font-face{font-family:Quicksand;font-weight:400 700;src:url(${u(R + '/public/fonts/quicksand-latin.woff2')}) format('woff2')}@font-face{font-family:"Codec Pro";font-weight:400;src:url(${u(R + '/public/fonts/codec-pro-regular.woff2')}) format('woff2')}`;
const http = require('http');
const getJson = (url) => new Promise((res, rej) => http.get(url, (r) => { let b = ''; r.on('data', (c) => { b += c; }); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } }); }).on('error', rej));
(async () => {
  const base = process.env.MC_URL || 'http://127.0.0.1:4378', st = await getJson(base + '/api/stats'), team = (await getJson(base + '/api/state')).team;
  if (!st || !st.agentsAllTime) throw new Error('The poster is drawn from LIVE data: run the server with teamSource "claude-code".');
  const N = st.agentsAllTime, P = st.peakParallel, now = Date.now(), M = st.masters;
  const qr = await QR.toDataURL(REPO + '?utm_source=linkedin', { margin: 1, width: 400, color: { dark: '#101828', light: '#FFFFFF' } });
  const stamp = new Date(now).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const ages = st.mtimes.map((t) => (now - t < 864e5 ? 0 : now - t < 7 * 864e5 ? 1 : 2));
  const html = `<!doctype html><meta charset="utf-8"><style>${fonts}
*{box-sizing:border-box}html,body{margin:0}body{width:1080px;height:1350px;overflow:hidden;position:relative;font-family:Quicksand,sans-serif;color:#101828;background:#FBFAF7}
.g{position:absolute;border-radius:50%;filter:blur(90px)}.g1{width:760px;height:760px;left:-260px;top:-240px;background:#E9E2FF;opacity:.9}.g2{width:700px;height:700px;right:-240px;bottom:-200px;background:#D9F5EA;opacity:.9}
.top{position:absolute;left:84px;right:84px;top:64px;display:flex;justify-content:space-between;align-items:center}.top img.w{height:38px}.top img.p{height:28px;opacity:.95}
.eyebrow{position:absolute;left:84px;top:176px;font-size:21px;font-weight:600;letter-spacing:.24em;color:#1FA58C}.eyebrow b{color:#6D4AFF;font-weight:600}
h1{position:absolute;left:84px;right:40px;top:206px;margin:0;font-family:"Codec Pro",Quicksand,sans-serif;font-weight:400;font-size:176px;line-height:1.25;letter-spacing:-.03em;color:#101828}h1 em{font-style:normal;display:inline-block;padding:0 .08em .16em 0;background:linear-gradient(90deg,#6D4AFF 0%,#2A7FD8 55%,#1FA58C 100%);-webkit-background-clip:text;color:transparent}.big{position:absolute;left:84px;right:60px;top:452px;font-size:38px;white-space:nowrap;line-height:1.25;font-weight:500;color:#101828}.big b{font-weight:700}
.sub{position:absolute;left:84px;right:84px;top:516px;font-size:28px;line-height:1.4;font-weight:500;color:#5B6B7A}.sub b{color:#101828;font-weight:600}
svg{position:absolute;left:0;top:560px;width:1080px;height:600px}
.note{position:absolute;left:84px;right:60px;top:1150px;font-size:17px;white-space:nowrap;color:#8A97A5;font-weight:500;letter-spacing:.02em}
.foot{position:absolute;left:84px;right:84px;bottom:54px;display:flex;justify-content:space-between;align-items:center}
.free{display:inline-flex;align-items:center;gap:14px;border:2px solid #101828;color:#101828;font-size:30px;font-weight:600;border-radius:999px;padding:16px 34px;background:rgba(255,255,255,.7)}.free i{width:14px;height:14px;border-radius:50%;background:#1FA58C;display:block}
.qr{display:flex;align-items:center;gap:18px;font-size:21px;color:#5B6B7A;font-weight:600;text-align:right;line-height:1.35}.qr img{width:118px;height:118px;border-radius:16px;border:1px solid #E5E3DC;padding:7px;background:#fff}</style>
<div class="g g1"></div><div class="g g2"></div>
<div class="top"><img class="w" src="${u(R + '/public/brand/salesday-wordmark-primary.svg')}"><img class="p" src="${u(R + '/public/brand/partner-logo.png')}" alt="Channel partner logo"></div>
<div class="eyebrow"><b>AI AGENTS</b>  ·  LIVE FROM OUR BUILD</div>
<h1><em>Agentic AI.</em></h1>
<div class="big"><b>${N} AI agents</b> · up to ${P} working at once</div>
<div class="sub">One orchestrator that plans, delegates and verifies.</div>
<svg id="art" viewBox="0 0 1080 600"></svg>
<div class="note">Real numbers from our own build · ${stamp} · one square = one AI agent</div>
<div class="foot"><span class="free"><i></i>Free and open source</span><div class="qr"><span>Scan to use it<br>github.com/harish-e-g</span><img src="${qr}"></div></div>
<script src="${u(R + '/public/flow.js')}"></script>
<script>
const NS='http://www.w3.org/2000/svg';const sv=(t,a,p)=>{const n=document.createElementNS(NS,t);for(const k in a)n.setAttribute(k,a[k]);if(p)p.append(n);return n};
FL.init({sv,T:()=>({}),dark:()=>false});
const AGES=${JSON.stringify(ages)};const N=AGES.length;
const svg=document.getElementById('art');const defs=sv('defs',{},svg);const gl=sv('filter',{id:'gl',x:'-80%',y:'-80%',width:'260%',height:'260%'},defs);sv('feGaussianBlur',{stdDeviation:5},gl);
const lg=sv('linearGradient',{id:'lg',x1:0,y1:0,x2:0,y2:1},defs);sv('stop',{offset:'0',stop_color:'#6D4AFF'},lg);
/* master */
const mx=540,my=92,mr=64;const halo=sv('circle',{cx:mx,cy:my,r:mr+26,fill:'#6D4AFF',opacity:.16,filter:'url(#gl)'},svg);
sv('circle',{cx:mx,cy:my,r:mr+12,fill:'none',stroke:'#6D4AFF','stroke-width':1.6,opacity:.35},svg);sv('circle',{cx:mx,cy:my,r:mr+6,fill:'#fff',stroke:'#6D4AFF','stroke-width':4},svg);
const cp=sv('clipPath',{id:'cm'},svg);sv('circle',{cx:mx,cy:my,r:mr},cp);const h=sv('g',{'clip-path':'url(#cm)'},svg);const inner=sv('g',{transform:'translate('+mx+' '+my+')'},h);FL.robot(inner,'master','#7B5CFF',mr);
const bd=sv('g',{transform:'translate('+mx+' '+(my+mr+6)+')'},svg);sv('rect',{x:-66,y:-14,width:132,height:28,rx:14,fill:'#6D4AFF'},bd);const bt=sv('text',{y:6,'text-anchor':'middle','font-size':15,'font-weight':700,fill:'#fff','letter-spacing':'.14em'},bd);bt.textContent='AGENTIC AI';
/* trunk and fan: thin elegant lines */
const fy=246;sv('path',{d:'M'+mx+' '+(my+mr+22)+'V'+fy,stroke:'#6D4AFF','stroke-width':2.2,fill:'none',opacity:.6,'stroke-linecap':'round'},svg);
/* the dot field: one dot = one AI agent, newest first */
const cols=Math.ceil(Math.sqrt(N*3.3)),rows=Math.ceil(N/cols),sp=Math.min(21,880/cols),w=(cols-1)*sp,x0=540-w/2,y0=fy+36;
sv('path',{d:'M'+(x0)+' '+(y0-18)+'H'+(x0+w),stroke:'#6D4AFF','stroke-width':1.4,fill:'none',opacity:.4,'stroke-linecap':'round'},svg);sv('path',{d:'M'+mx+' '+fy+'V'+(y0-18),stroke:'#6D4AFF','stroke-width':2.2,fill:'none',opacity:.6},svg);
const C0={0:'#1FA58C',1:'#7B5CFF',2:'#C8BBF7'};
for(let i=0;i<N;i++){const r=Math.floor(i/cols),c=i%cols,x=x0+c*sp,y=y0+r*sp,a=AGES[i],z=a===0?10.5:a===1?9:7.5;
 if(a===0)sv('rect',{x:x-z/2-2,y:y-z/2-2,width:z+4,height:z+4,rx:5,fill:C0[0],opacity:.35,filter:'url(#gl)'},svg);
 sv('rect',{x:x-z/2,y:y-z/2,width:z,height:z,rx:z*.32,fill:C0[a]},svg)}
</script>`;
  const f = path.join(OUT, '_poster.html'); fs.writeFileSync(f, html);
  const b = await pw.chromium.launch(), p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  await p.goto(u(f)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(OUT, 'AI-agents-agentic-AI-poster-1080x1350.jpg'), type: 'jpeg', quality: 95 });
  await p.screenshot({ path: path.join(OUT, 'AI-agents-agentic-AI-poster-1080x1350.png') });
  await b.close(); fs.unlinkSync(f); console.log('poster done:', N, 'AI agents, peak', P, 'in parallel,', M, 'sessions with agents');
})();
