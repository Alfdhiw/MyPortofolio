import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { root } from './serve.mjs';

// These are deliberately labelled reconstructions with demo data, not evidence
// of historical screens or a working registration backend. No network is needed.
const scenes = ['dashboard', 'registration'];
const candidates = [process.env.BROWSER_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean);
let browser;
for (const candidate of candidates) { try { await access(candidate); browser = candidate; break; } catch {} }
if (!browser) throw new Error('Set BROWSER_PATH to an installed Chrome/Edge executable.');
const profile = await mkdtemp(join(tmpdir(), 'simone-preview-'));
const destination = join(root, 'dist/img/portfolio');
await mkdir(destination, { recursive: true });
const run = promisify(execFile);
for (const scene of scenes) {
  const source = join(root, 'assets/previews/simone', `${scene}.html`);
  await access(source);
  const output = join(destination, `simone-${scene}-concept.png`);
  await run(browser, [
    '--headless=new', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--window-size=1440,900',
    '--virtual-time-budget=1000', `--user-data-dir=${profile}`,
    `--screenshot=${output}`, pathToFileURL(source).href
  ], { windowsHide: true, timeout: 30000, maxBuffer: 1024 * 1024 });
  const bytes = await readFile(output);
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
  assert.equal(bytes.readUInt32BE(16), 1440); assert.equal(bytes.readUInt32BE(20), 900);
  console.log(`Rendered ${output} (1440 × 900; reconstructed interface, demo data).`);
}
