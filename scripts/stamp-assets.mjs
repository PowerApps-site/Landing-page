#!/usr/bin/env node
/**
 * Append a content hash to every /assets/ URL in the HTML, so a changed asset
 * gets a changed URL.
 *
 *   node scripts/stamp-assets.mjs          # rewrite the HTML in place
 *   node scripts/stamp-assets.mjs --check  # exit 1 if anything would change
 *
 * Why this exists. The CSS and JS filenames never change, and the server sends
 * `Cache-Control: max-age=600`. So for ten minutes after a deploy a returning
 * visitor gets the *new* HTML against the *old* stylesheet — which is not a
 * cosmetic flicker: it shipped the hero carousel as two stacked phone screens
 * overflowing the mockup, because the markup for slides had arrived and the
 * rules that overlap them had not.
 *
 * Stamping the URL with a hash of the file's own bytes makes the pair atomic. A
 * visitor either has both old files or both new ones, never one of each. Unchanged
 * assets keep their hash and stay cached.
 *
 * Run by the deploy workflow, so it cannot be forgotten. Running it locally is
 * harmless and makes `git diff` show what the deploy will publish.
 */
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const check = process.argv.includes('--check');

/** Every .html file in the repo, minus the ones that are not pages. */
async function htmlFiles(dir = root, out = []) {
  for (const entry of await readdir(dir)) {
    if (entry === '.git' || entry === 'node_modules' || entry === 'scripts') continue;
    const full = path.join(dir, entry);
    if ((await stat(full)).isDirectory()) await htmlFiles(full, out);
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

const hashes = new Map();
async function hashOf(assetPath) {
  if (hashes.has(assetPath)) return hashes.get(assetPath);
  const file = path.join(root, assetPath.replace(/^\//, ''));
  let short = null;
  try {
    short = createHash('sha256').update(await readFile(file)).digest('hex').slice(0, 8);
  } catch {
    // A template still holding {{APP_SLUG}} has no file behind it; leave it alone.
    short = null;
  }
  hashes.set(assetPath, short);
  return short;
}

// Matches /assets/... in href or src, with or without an existing ?v= stamp.
const REF = /((?:href|src)=")(\/assets\/[^"?]+)(\?v=[^"]*)?(")/g;

let changed = [];
for (const file of await htmlFiles()) {
  const before = await readFile(file, 'utf8');
  const parts = [];
  let last = 0;
  for (const m of before.matchAll(REF)) {
    const hash = await hashOf(m[2]);
    parts.push(before.slice(last, m.index));
    parts.push(hash ? `${m[1]}${m[2]}?v=${hash}${m[4]}` : m[0]);
    last = m.index + m[0].length;
  }
  parts.push(before.slice(last));
  const after = parts.join('');
  if (after === before) continue;
  changed.push(path.relative(root, file));
  if (!check) await writeFile(file, after);
}

if (check) {
  if (changed.length) {
    console.error('Asset stamps are stale in:\n  ' + changed.join('\n  '));
    console.error('\nRun: node scripts/stamp-assets.mjs');
    process.exit(1);
  }
  console.log('Asset stamps are current.');
} else {
  console.log(changed.length ? `Stamped ${changed.length} file(s):\n  ` + changed.join('\n  ')
                             : 'Nothing to stamp — every asset URL is already current.');
}
