import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

function version(source, name) {
  const match = source.match(new RegExp(`^const ${name} = '([^']+)';`, 'm'));
  assert.ok(match, `Missing ${name} in app shell`);
  return match[1];
}

function precacheFiles(worker) {
  const list = worker.match(/^const files = (\[[^\n]+\]);$/m);
  assert.ok(list, 'Missing service-worker precache list');
  return JSON.parse(list[1].replaceAll("'", '"')).map(path => path === '.' ? 'pwa/index.html' : `pwa/${path.replace(/^\.\//, '')}`);
}

const bases = process.argv.slice(2);
assert.ok(bases.length, 'Pass at least one base commit to compare');
const workerPath = 'pwa/sw.js';
const worker = readFileSync(workerPath, 'utf8');
const current = version(worker, 'VERSION');
assert.equal(version(readFileSync('pwa/app.js', 'utf8'), 'APP_VERSION'), current,
  'pwa/app.js APP_VERSION must match pwa/sw.js VERSION');

for (const base of new Set(bases)) {
  const previous = git('show', `${base}:${workerPath}`);
  const files = [...new Set([workerPath, ...precacheFiles(previous), ...precacheFiles(worker)])];
  const changed = git('diff', '--name-only', base, '--', ...files).trim();
  assert.ok(!changed || version(previous, 'VERSION') !== current,
    `App shell changed since ${base}. Bump VERSION and APP_VERSION together.\n${changed}`);
}
console.log(`App shell version ${current} verified against ${bases.join(', ')}`);
