'use strict';
// Writes synthetic demo rows (a made-up product, no real data) into demo/rows and demo/agents.json.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'rows'); fs.mkdirSync(dir, { recursive: true });
const items = [
  ['critical','AI','I','Charts must open the exact deals behind every bar','Drill-down links built for 6 of 9 charts'],
  ['critical','AI','I','Totals and their parts must add up to the rupee','One money formatter written, tests in progress'],
  ['critical','You','P','Check push alerts on the phone after installing the app','Waiting for your test'],
  ['critical','AI','P','Notices must open the exact card, even when signed out','Live, waiting for your check in the mail client'],
  ['high','You','P','Decide the cloud gate runner','Needs a login on your machine'],
  ['high','AI','I','Wide screens use the full width on every page','Mail pages done, admin pages next'],
  ['high','AI','N','Resume the sequencing power lane','Queued after the current release'],
  ['high','You','N','Review the new bulk actions with real accounts','Not started'],
  ['high','AI','B','Provider key for enrichment','Blocked on the vendor plan'],
  ['medium','AI','I','Saved views for lists','Built, in the release gate'],
  ['medium','AI','P','Duplicate warning when creating records','Built, pending your look'],
  ['medium','You','P','Pick names for three sidebar items','Your call'],
  ['medium','AI','N','Weekly digest e-mail design','Not started'],
  ['medium','AI','N','Export dashboards to PDF','Not started'],
  ['low','AI','N','Dark theme for the print view','Never touched'],
  ['low','You','N','Approve the new onboarding copy','Never touched'],
  ['low','AI','N','Keyboard shortcuts sheet','Never touched'],
];
let n = 100; const now = Date.now();
items.forEach(([pri, ball, status, req, fin], i) => { n += 1; fs.writeFileSync(path.join(dir, `R${n}.json`), JSON.stringify({ id: 'R' + n, ball, pri, status, req, fin, est: ['10 min','1 day','2 hours'][i % 3] }, null, 2)); fs.utimesSync(path.join(dir, `R${n}.json`), new Date(now - (i % 6 === 0 ? 20 : i * 9000) * 60000), new Date(now - (i % 6 === 0 ? 20 : i * 9000) * 60000)); });
for (let i = 0; i < 60; i += 1) { n += 1; const f = path.join(dir, `R${n}.json`); fs.writeFileSync(f, JSON.stringify({ id: 'R' + n, ball: i % 4 ? 'AI' : 'You', pri: ['low','medium','high'][i % 3], status: 'C', req: 'Completed item ' + (i + 1), fin: 'Shipped' }, null, 2)); const t = new Date(now - (i % 7) * 86400000 - (i * 3600000) % 80000000); fs.utimesSync(f, t, t); }
fs.writeFileSync(path.join(__dirname, 'agents.json'), JSON.stringify({ running: 5, peers: 2, note: 'Sample data. Five sub-agents are building in parallel; two cloud sessions are idle.' }, null, 2));
console.log('demo rows written:', n - 100);
