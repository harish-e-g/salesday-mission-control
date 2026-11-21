'use strict';
// Builds the static, public demo for GitHub Pages into docs/: the page, a snapshot of the synthetic demo state, and nothing else.
// The page detects that there is no server and animates the snapshot (a simulated live feed). No real data is ever read.
const fs = require('fs'), path = require('path');
process.argv.push('--demo');
const root = path.join(__dirname, '..');
const { state } = require(path.join(root, 'server.js'));
const out = path.join(root, 'docs'); fs.mkdirSync(out, { recursive: true });
const snap = state(); snap.liveVersion = '1.0.0';
fs.writeFileSync(path.join(out, 'demo-state.json'), JSON.stringify(snap));
for (const f of ['index.html', 'theme.js', 'widgets.js', 'widgets.css', 'themes.html']) fs.copyFileSync(path.join(root, 'public', f), path.join(out, f));
fs.mkdirSync(path.join(out, 'brand'), { recursive: true });
fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'public', 'fonts'))) fs.copyFileSync(path.join(root, 'public', 'fonts', f), path.join(out, 'fonts', f));
for (const f of fs.readdirSync(path.join(root, 'public', 'brand'))) fs.copyFileSync(path.join(root, 'public', 'brand', f), path.join(out, 'brand', f));
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('pages built:', fs.readdirSync(out).join(', '));
