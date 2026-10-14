// Render index.html frame by frame with headless Edge (CDP), write PNGs.
// Usage: node capture.mjs <outDir> [fps=30] [times=comma list, optional]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const [, , outDir, fpsArg, timesArg] = process.argv;
const fps = +(fpsArg || 30);
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const page = pathToFileURL(path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), 'index.html')).href + '?capture=1';
mkdirSync(outDir, { recursive: true });
const port = 9333;
const prof = path.join(outDir, '.profile');
const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`,
  '--window-size=1920,1080', '--hide-scrollbars', '--force-device-scale-factor=1', 'about:blank'], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); } }
const tgt = targets.find(t => t.type === 'page');
const ws = new WebSocket(tgt.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send('Page.enable');
await send('Page.navigate', { url: page });
for (let i = 0; i < 100; i++) { const r = await send('Runtime.evaluate', { expression: 'window.__ready===true', returnByValue: true }); if (r.result?.result?.value) break; await sleep(150); }

const times = timesArg ? timesArg.split(',').map(Number) : Array.from({ length: Math.round(15 * fps) }, (_, i) => i / fps);
for (let i = 0; i < times.length; i++) {
  await send('Runtime.evaluate', { expression: `render(${times[i]})` });
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 1 } });
  writeFileSync(path.join(outDir, `f${String(i).padStart(4, '0')}.png`), Buffer.from(shot.result.data, 'base64'));
  if (i % 50 === 0) console.log(`frame ${i}/${times.length}`);
}
ws.close(); edge.kill();
console.log('done');
