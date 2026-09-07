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

// Nothing here may assert a fact about the binary. Every claim about permissions,
// pricing, storage, networking or accessibility is a TODO on purpose: an unfilled
// TODO is visible on the page and caught by the reminder printed below, whereas a
// confident default ships as a lie nobody reads again.
const vars = {
  APP_SLUG: slug,
  APP_NAME: name,
  APP_TAGLINE: tagline || 'A focused iOS utility',
  APP_DESCRIPTION_SHORT: `${name} — ${tagline || 'a focused iOS utility'}. TODO: pricing and privacy claims, only what is true of this build (use 'Free to download' when there is an in-app purchase).`,
  APP_DESCRIPTION: `TODO: one or two sentences describing what ${name} does and why someone would open it.`,
  APP_STORE_URL: 'https://apps.apple.com/app/id0000000000',
  EFFECTIVE_DATE: today,
  MIN_IOS: 'TODO min iOS',
  SCREEN_TITLE: name,
  SCREEN_HINT: 'TODO: short in-app hint',

  // Hero chips and the marquee — each one is a claim. Fill or delete in the HTML.
  CHIP_1: 'TODO pricing chip',
  CHIP_2: 'TODO chip', CHIP_3: 'TODO chip', CHIP_4: 'TODO chip',
  TAG_1: 'TODO tag', TAG_2: 'TODO tag', TAG_3: 'TODO tag',
  TAG_4: 'TODO tag', TAG_5: 'TODO tag', TAG_6: 'TODO tag',

  HOW_HEADLINE: 'How it works',
  STEP_1_TITLE: 'TODO step one', STEP_1_TEXT: 'TODO',
  STEP_2_TITLE: 'TODO step two', STEP_2_TEXT: 'TODO',
  STEP_3_TITLE: 'TODO step three', STEP_3_TEXT: 'TODO',
  FEATURE_1_TITLE: 'TODO feature', FEATURE_1_TEXT: 'TODO',
  FEATURE_2_TITLE: 'TODO feature', FEATURE_2_TEXT: 'TODO',
  FEATURE_3_TITLE: 'TODO feature', FEATURE_3_TEXT: 'TODO',
  FEATURE_4_TITLE: 'TODO feature', FEATURE_4_TEXT: 'TODO',
  FEATURE_5_TITLE: 'TODO feature', FEATURE_5_TEXT: 'TODO',

  // Terms — safe use and the limits the app must admit to.
  SAFE_USE_INTRO: `TODO: how ${name} should be used responsibly.`,
  SAFE_USE_1: 'TODO', SAFE_USE_2: 'TODO', SAFE_USE_3: 'TODO',
  LIMIT_1: `TODO: something ${name} cannot do that a user might assume it can.`,
  LIMIT_2: 'TODO: if a screen shows a measurement, say it is not a calibrated instrument.',
  LIMIT_3: `TODO: if ${name} cannot observe its own result, say so here.`,
  SAFE_USE_WARNING: `TODO: what ${name} explicitly does not promise.`,
  PURCHASES_INTRO: `TODO: does ${name} have an in-app purchase? Say none, or one-time, or subscription — then delete the bullets below that do not apply.`,

  // Privacy — these four must match Info.plist and the App Privacy answers.
  PRIVACY_SUMMARY: `TODO: what ${name} does and does not do with information, in two sentences.`,
  PRIVACY_SENSORS: 'TODO: if this build uses the microphone, camera, location or any other sensor, say exactly what it does with the data and delete the matching line above. If it uses none, delete this sentence.',
  PRIVACY_PERMISSIONS: `TODO: list every NS*UsageDescription key in Info.plist, why ${name} asks for it, and what happens if the user declines. If there are none, say so.`,
  PRIVACY_PURCHASES: `TODO: describe the in-app purchase, or say ${name} has none.`,
  STORED_PREFERENCES: 'TODO: exactly which preferences this build writes.',
  STORED_2_LABEL: 'TODO', STORED_2_TEXT: 'TODO: any other file or record the app writes.',
};

// The values land inside HTML attributes AND inside the JSON-LD string, so a stray
// quote or angle bracket breaks one of the two silently.
for (const [key, value] of Object.entries(vars)) {
  if (/["<>]/.test(value)) {
    console.error(`Value for ${key} contains \" < or > , which breaks HTML attributes or JSON-LD: ${value}`);
    process.exit(1);
  }
}

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
console.log(`    1. Replace every TODO in all THREE pages — privacy/ too, not just index and terms`);
console.log(`    2. Set the real App Store URL (search for id0000000000)`);
console.log(`    3. Add an icon at assets/img/${slug}.svg`);
console.log(`    4. Add a card for ${name} to the #apps grid in index.html`);
console.log(`    5. Add the three new URLs to sitemap.xml`);
console.log('');
console.log('  Then check the claims — these are the ones that ship as lies if you skip them:');
console.log(`    6. ${slug}/privacy/ section 04 must list every NS*UsageDescription key in`);
console.log('       Info.plist, and match the App Privacy answers in App Store Connect');
console.log(`    7. ${slug}/privacy/ sections 02, 05, 08 and 09 assume the app collects nothing,`);
console.log('       links no SDK and talks to no server. Read the AUTHOR comments and edit if not');
console.log(`    8. ${slug}/terms/ section 07 — delete the ONE-TIME or the SUBSCRIPTION bullets`);
console.log(`    9. ${slug}/terms/ section 12 names California. Change it if you are elsewhere`);
console.log(`   10. ${slug}/index.html chips, marquee and meta description — no Free / offline /`);
console.log('       no-tracking / accessibility claim unless the build actually guarantees it\n');
