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
  const st = await getJson(process.env.MC_URL || 'http://127.0.0.1:4378/api/state'), team = st.team;
  if (!team || team.mode !== 'live') throw new Error('The poster is drawn from LIVE data: run the server with teamSource "claude-code".');
  const qr = await QR.toDataURL(REPO + '?utm_source=linkedin', { margin: 1, width: 400, color: { dark: '#14201B', light: '#FFFFFF' } });
  const stamp = new Date(st.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const order = { working: 0, waiting: 1, idle: 2, resting: 3 };
  const sess = team.sessions.slice().sort((a, b) => order[a.status] - order[b.status] || b.since - a.since).slice(0, 3);
  const kids = sess.flatMap((x) => x.kids.map((k) => ({ ...k, parent: x.id }))).sort((a, b) => order[a.status] - order[b.status] || b.since - a.since).slice(0, 5);
  const sw = team.counts.sessionsWorking, aw = team.counts.agentsWorking;
  const html = `<!doctype html><meta charset="utf-8"><style>${fonts}
*{box-sizing:border-box}html,body{margin:0}body{width:1080px;height:1350px;overflow:hidden;position:relative;font-family:Quicksand,sans-serif;color:#14201B;background:linear-gradient(170deg,#FFFFFF 0%,#EEF8F4 55%,#F6F1FF 100%)}
.blob{position:absolute;border-radius:50%;filter:blur(70px);opacity:.55}.b1{width:560px;height:560px;left:-160px;top:380px;background:#BDF0DE}.b2{width:520px;height:520px;right:-140px;top:120px;background:#E3D6FF}.b3{width:460px;height:460px;right:40px;bottom:120px;background:#FFE1CF}
.top{position:absolute;left:72px;right:72px;top:62px;display:flex;justify-content:space-between;align-items:center}.top img.w{height:40px}.top img.p{height:30px}
h1{position:absolute;left:72px;right:72px;top:150px;margin:0;font-family:"Codec Pro",Quicksand,sans-serif;font-weight:400;font-size:104px;line-height:1.0;letter-spacing:-.02em}h1 em{font-style:normal;background:linear-gradient(90deg,#7B4DFF,#1FA58C);-webkit-background-clip:text;color:transparent}
.sub{position:absolute;left:72px;top:392px;font-size:34px;font-weight:500;color:#44564E;display:flex;align-items:center;gap:14px}.live{display:inline-flex;align-items:center;gap:10px;background:#E3F7EE;color:#176B45;border-radius:999px;padding:6px 18px;font-size:26px;font-weight:600}.chip{display:inline-flex;align-items:center;background:#fff;border:2px solid #DFE7E2;color:#14201B;border-radius:999px;padding:6px 18px;font-size:26px;font-weight:600}.chip.v{border-color:#B79CFF;color:#5b36d6}.live i{width:12px;height:12px;border-radius:50%;background:#1FA58C;display:block}
svg{position:absolute;left:0;top:470px;width:1080px;height:700px}
.foot{position:absolute;left:72px;right:72px;bottom:62px;display:flex;justify-content:space-between;align-items:center}
.free{display:inline-flex;align-items:center;gap:14px;background:#14201B;color:#fff;font-size:34px;font-weight:600;border-radius:999px;padding:18px 36px}.free i{width:16px;height:16px;border-radius:50%;background:#7FE0B0;display:block}
.qr{display:flex;align-items:center;gap:18px;font-size:22px;color:#44564E;font-weight:600;text-align:right;line-height:1.3}.qr img{width:128px;height:128px;border-radius:16px;border:1px solid #DFE7E2;padding:8px;background:#fff}</style>
<div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div>
<div class="top"><img class="w" src="${u(R + '/public/brand/salesday-wordmark-primary.svg')}"><img class="p" src="${u(R + '/public/brand/partner-logo.png')}" alt="Channel partner logo"></div>
<h1>AI agents,<br>run by <em>agentic AI.</em></h1><div class="sub"><span class="live"><i></i>Live · ${stamp}</span><span class="chip v">${sw} agentic AI working</span><span class="chip">${aw} AI agents working</span></div>
<svg id="art" viewBox="0 0 1080 700"></svg>
<div class="foot"><span class="free"><i></i>Free and open source</span><div class="qr"><span>Scan to use it<br>github.com/harish-e-g</span><img src="${qr}"></div></div>
<script src="${u(R + '/public/flow.js')}"></script>
<script>
const DATA=${JSON.stringify({ sess: sess.map((x) => ({ id: x.id, name: x.name, status: x.status })), kids: kids.map((k) => ({ id: k.id, name: k.name, role: k.role, status: k.status, parent: k.parent })), sw, aw, owner: team.owner.name })};
const NS='http://www.w3.org/2000/svg';const sv=(t,a,p)=>{const n=document.createElementNS(NS,t);for(const k in a)n.setAttribute(k,a[k]);if(p)p.append(n);return n};
FL.init({sv,T:()=>({}),dark:()=>false});
const svg=document.getElementById('art');const C={g:'#1FA58C',a:'#E2B100',v:'#7B4DFF',n:'#9AA8A0',p:'#8A63D2',h:'#14201B'};const col={working:C.g,waiting:C.a,idle:C.n,resting:C.p};const word={working:'Working',waiting:'Needs you',idle:'Idle',resting:'Resting'};
const defs=sv('defs',{},svg);const glow=sv('filter',{id:'gl',x:'-50%',y:'-50%',width:'200%',height:'200%'},defs);sv('feGaussianBlur',{stdDeviation:6},glow);
function avatar(id,x,y,r,ring,shirt,o){o=o||{};const g=sv('g',{transform:'translate('+x+' '+y+')'},svg);
 if(o.halo){sv('circle',{r:r+16,fill:ring,opacity:.22,filter:'url(#gl)'},g);sv('circle',{r:r+11,fill:'none',stroke:ring,'stroke-width':3,opacity:.5},g)}
 sv('circle',{r:r+5,fill:'#fff',stroke:ring,'stroke-width':o.dim?5:8,opacity:o.dim?.8:1},g);const cp=sv('clipPath',{id:'c'+id},g);sv('circle',{r},cp);const h=sv('g',{'clip-path':'url(#c'+id+')',opacity:o.dim?.55:1},g);FL.face(sv('g',{},h),id,shirt,r);
 if(o.badge){const b=sv('g',{transform:'translate('+(r*.78)+' '+(r*.78)+')'},g);sv('circle',{r:17,fill:o.bf||C.h},b);const t=sv('text',{y:6.5,'text-anchor':'middle','font-size':o.badge.length>2?13:17,'font-weight':700,fill:'#fff'},b);t.textContent=o.badge}}
const label=(x,y,t,sz,w,fill,an)=>{const e=sv('text',{x,y,'font-size':sz,'font-weight':w,fill,'text-anchor':an||'middle'},svg);e.textContent=t};
const spread=(n,w,pad)=>Array.from({length:n},(_,i)=>n===1?w/2:pad+i*((w-2*pad)/(n-1)));
const sx=spread(DATA.sess.length,1080,200),kx=spread(DATA.kids.length,1080,108),y0=70,y1=270,y2=560,bus=468;
const path=(pts,color,w,dash,o)=>{const p=sv('path',{d:'M'+pts.map((q)=>q.join(' ')).join('L'),fill:'none',stroke:color,'stroke-width':w,'stroke-linecap':'round','stroke-linejoin':'round',opacity:o==null?1:o},svg);if(dash)p.setAttribute('stroke-dasharray',dash)};
const beat=(pts,c)=>{let len=0;const seg=[];for(let i=0;i<pts.length-1;i++){const l=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);seg.push(l);len+=l}[.3,.65,.9].forEach((t,k)=>{let d=len*t,i=0;while(i<seg.length-1&&d>seg[i]){d-=seg[i];i++}const u=seg[i]?d/seg[i]:0,x=pts[i][0]+(pts[i+1][0]-pts[i][0])*u,y=pts[i][1]+(pts[i+1][1]-pts[i][1])*u;sv('circle',{cx:x,cy:y,r:13,fill:c,opacity:.28,filter:'url(#gl)'},svg);sv('circle',{cx:x,cy:y,r:8-k,fill:c},svg)})};
const link=(pts,st)=>{const c=col[st];path(pts,c,st==='working'?6:st==='idle'?3:5,st==='waiting'?'12 10':st==='resting'?'2 12':null,st==='idle'?.5:1);if(st==='working')beat(pts,c)};
/* human to sessions */
DATA.sess.forEach((s,i)=>{const x=sx[i],midY=148;link([[540,y0+56],[540,midY],[x,midY],[x,y1-92]],s.status)});
/* sessions to their agents */
DATA.kids.forEach((k,i)=>{const pi=DATA.sess.findIndex((s)=>s.id===k.parent),px=sx[pi],x=kx[i];link([[px,y1+162],[px,bus],[x,bus],[x,y2-68]],k.status)});
avatar('human',540,y0,50,C.a,'#F2D27A',{badge:'YOU',bf:C.a});label(612,66,DATA.owner,34,700,C.h,'start');label(612,98,'the human decides',24,500,'#44564E','start');
DATA.sess.forEach((s,i)=>{avatar(s.id,sx[i],y1,76,col[s.status],'#B79CFF',{halo:s.status==='working',dim:s.status==='idle'||s.status==='resting',badge:'AI',bf:C.v});label(sx[i],y1+112,s.name,32,700,C.h);label(sx[i],y1+146,word[s.status],26,600,s.status==='idle'?'#6B7C74':col[s.status])});
label(540,y1-110<200?250:y1-110,'',1,400,'#fff');
DATA.kids.forEach((k,i)=>{avatar(k.id,kx[i],y2,56,col[k.status],'#7FE0B0',{dim:k.status==='idle'||k.status==='resting',badge:'AI'});label(kx[i],y2+92,k.name,30,700,C.h);label(kx[i],y2+126,word[k.status],24,600,k.status==='idle'?'#6B7C74':col[k.status])});
if(!DATA.kids.length)label(540,y2+10,'No AI agent is running at this moment',30,600,'#6B7C74');
label(sx.length?20:20,y1-8,'',1,400,'#fff');
const chip=(x,y,t,c)=>{label(x,y,t,28,700,c,'middle')};
label(180,y1+190,'',1,400,'#fff');
</script>`;
  const f = path.join(OUT, '_poster.html'); fs.writeFileSync(f, html);
  const b = await pw.chromium.launch(), p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  await p.goto(u(f)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(OUT, 'AI-agents-agentic-AI-poster-1080x1350.jpg'), type: 'jpeg', quality: 94 });
  await p.screenshot({ path: path.join(OUT, 'AI-agents-agentic-AI-poster-1080x1350.png') });
  await b.close(); fs.unlinkSync(f); console.log('poster done from live data at', stamp);
})();
