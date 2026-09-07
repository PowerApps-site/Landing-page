#!/usr/bin/env node
/**
 * Scaffold a new app section from templates/APP_SLUG.
 *
 *   node scripts/new-app.mjs <slug> "<App Name>" "<Tagline>"
 *
 * Creates <slug>/index.html, <slug>/privacy/index.html and <slug>/terms/index.html
 * with the {{PLACEHOLDERS}} filled in, then reminds you what still needs editing.
 */
import { readdir, readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const [slug, name, tagline] = process.argv.slice(2);

if (!slug || !name) {
  console.error('Usage: node scripts/new-app.mjs <slug> "<App Name>" "<Tagline>"');
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error(`Invalid slug "${slug}" — use lowercase letters, digits and dashes only.`);
  process.exit(1);
}

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const src = path.join(root, 'templates', 'APP_SLUG');
const dest = path.join(root, slug);

if (existsSync(dest)) {
  console.error(`Refusing to overwrite: ${slug}/ already exists.`);
  process.exit(1);
}

const today = new Date().toLocaleDateString('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric',
});

const vars = {
  APP_SLUG: slug,
  APP_NAME: name,
  APP_TAGLINE: tagline || 'A focused iOS utility',
  APP_DESCRIPTION_SHORT: `${name} — ${tagline || 'a focused iOS utility'}. Free, offline, no accounts and no tracking.`,
  APP_DESCRIPTION: `TODO: one or two sentences describing what ${name} does and why someone would open it.`,
  APP_STORE_URL: 'https://apps.apple.com/app/id0000000000',
  EFFECTIVE_DATE: today,
  SCREEN_TITLE: name,
  SCREEN_HINT: 'TODO: short in-app hint',
  CHIP_1: 'Free',
  TAG_1: 'TODO tag',
  TAG_2: 'TODO tag',
  HOW_HEADLINE: 'How it works',
  STEP_1_TITLE: 'TODO step one', STEP_1_TEXT: 'TODO',
  STEP_2_TITLE: 'TODO step two', STEP_2_TEXT: 'TODO',
  STEP_3_TITLE: 'TODO step three', STEP_3_TEXT: 'TODO',
  FEATURE_1_TITLE: 'TODO feature', FEATURE_1_TEXT: 'TODO',
  FEATURE_2_TITLE: 'TODO feature', FEATURE_2_TEXT: 'TODO',
  SAFE_USE_INTRO: `TODO: how ${name} should be used responsibly.`,
  SAFE_USE_1: 'TODO', SAFE_USE_2: 'TODO', SAFE_USE_3: 'TODO',
  SAFE_USE_WARNING: `TODO: what ${name} explicitly does not promise.`,
};

const fill = (text) =>
  text.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match);

async function copyTree(from, to) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from)) {
    const f = path.join(from, entry);
    const t = path.join(to, entry);
    if ((await stat(f)).isDirectory()) {
      await copyTree(f, t);
    } else {
      await writeFile(t, fill(await readFile(f, 'utf8')));
    }
  }
}

await copyTree(src, dest);

console.log(`\n  Created ${slug}/ (index, privacy, terms)\n`);
console.log('  Still to do:');
console.log(`    1. Replace every TODO in ${slug}/index.html and ${slug}/terms/index.html`);
console.log(`    2. Set the real App Store URL (search for id0000000000)`);
console.log(`    3. Add an icon at assets/img/${slug}.svg`);
console.log(`    4. Add a card for ${name} to the #apps grid in index.html`);
console.log(`    5. Add the three new URLs to sitemap.xml\n`);
