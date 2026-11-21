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
fs.copyFileSync(path.join(root, 'public', 'index.html'), path.join(out, 'index.html'));
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('pages built:', fs.readdirSync(out).join(', '));
