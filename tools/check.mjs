// Syntax-checks every JavaScript file in js/, tools/ and qa/ with `node --check`, so a typo
// anywhere fails fast instead of only when that island loads in the browser.
//
//   node tools/check.mjs        (or: npm run check)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['js', 'tools', 'qa'];

function* files(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'shots') yield* files(p);
    } else if (/\.m?js$/.test(e.name)) {
      yield p;
    }
  }
}

let total = 0, failed = 0;
for (const d of DIRS) {
  for (const f of files(path.join(root, d))) {
    total++;
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (r.status !== 0) {
      failed++;
      console.error(r.stderr.trim());
    }
  }
}
console.log(`${total - failed}/${total} files pass node --check`);
process.exit(failed ? 1 : 0);
