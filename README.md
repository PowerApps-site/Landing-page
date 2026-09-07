# PowerApps — site

Static marketing site for the PowerApps iOS apps, plus the per-app legal pages
that the App Store requires.

No build step, no dependencies. Plain HTML, one CSS file, one JS file.

## URL structure

| URL | File |
| --- | --- |
| `/` | `index.html` — landing page, app grid |
| `/justcleaner/` | `justcleaner/index.html` — app page |
| `/justcleaner/privacy/` | `justcleaner/privacy/index.html` |
| `/justcleaner/terms/` | `justcleaner/terms/index.html` |
| any unknown path | `404.html` |

Every app gets its own top-level folder with the same three pages.

## Local preview

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>. Absolute paths (`/assets/...`) mean the site
must be served from a web root — opening `index.html` straight from Finder will
not load the CSS.

## Adding a new app

```bash
node scripts/new-app.mjs myapp "MyApp" "What it does in five words"
```

That scaffolds `myapp/index.html`, `myapp/privacy/index.html` and
`myapp/terms/index.html` from `templates/APP_SLUG/`. The script prints the
remaining manual steps:

1. Replace every `TODO` in all three generated pages — the privacy page too.
2. Set the real App Store URL (search for `id0000000000`).
3. Add an icon at `assets/img/myapp.svg` (64×64 viewBox, rounded square).
4. Add a card for the app to the `#apps` grid in `index.html`.
5. Add the three new URLs to `sitemap.xml`.

…then it prints a second list, for the claims. Do not skip it. Every item there is
a sentence that ships as a lie if you leave the default in place.

## Placeholders to replace before going live

- **App Store link** — `justcleaner/index.html` still points at
  `https://apps.apple.com/app/id0000000000`.
- **Effective dates** in the legal pages (currently `8 September 2026`).
- **Governing law** in `justcleaner/terms/index.html` §13 names the Republic of
  Uzbekistan, where the publisher is established. Change it if that ever moves.
  Keep the second paragraph: it preserves consumers' mandatory local rights, which
  a choice-of-law clause cannot override anyway, and stops the clause reading as
  an unfair term.

## Keeping the legal pages true

The templates carry `<!-- AUTHOR: … -->` comments at every point where the text
asserts something about the binary. They exist because this repo already shipped
the failure once: the JustCleaner pages said the app used no microphone and
described subscription renewal terms, months after the app had gained a
microphone-based sound meter and a one-time non-consumable purchase.

Two rules keep that from happening again.

1. **The template asserts nothing it cannot know.** Anything that varies per
   build — permissions, what is stored, whether there is a purchase, pricing,
   accessibility, minimum iOS — is a `{{PLACEHOLDER}}` filled with a loud `TODO`.
   An unfilled TODO is visible on the page; a wrong default is not.
2. **When the app changes, the pages change in the same commit.** A new
   `NS*UsageDescription` key means privacy §04 and §02 are now wrong. A new
   StoreKit product means terms §07 and privacy §06 are now wrong. Neither will
   fail a build or a test — only this habit catches it.

Before submitting to App Review, read the privacy page next to `Info.plist` and
next to the App Privacy answers in App Store Connect, and make the three agree.

> These pages are a solid, App-Store-ready starting point, but they are not legal
> advice. Have a lawyer look them over if the app grows.

## Support email

Contact links point at `azizmizamov@yandex.com`. The address is stored
**reversed** in `data-mail` attributes as light spam protection, and
`assets/js/main.js` un-reverses it into a `mailto:` link at runtime.

To change it, reverse the new address and update every `data-mail` value:

```bash
node -e 'console.log([..."you@example.com"].reverse().join(""))'
```

## Deploying

### Vercel

```bash
npx vercel --prod
```

`vercel.json` sets clean URLs, trailing slashes, security headers and a
one-year immutable cache on `/assets/*`. Add `powerapps.site` under
**Project → Settings → Domains** and point your DNS at Vercel.

### GitHub Pages

`.github/workflows/deploy.yml` publishes the repo root on every push to `main`.

1. Push the repo to GitHub.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The `CNAME` file already contains `powerapps.site`; set the same value under
   **Settings → Pages → Custom domain** and add these DNS records:

   ```
   A     @    185.199.108.153
   A     @    185.199.109.153
   A     @    185.199.110.153
   A     @    185.199.111.153
   CNAME www  <username>.github.io
   ```

4. Tick **Enforce HTTPS** once the certificate is issued.

`.nojekyll` is present so GitHub Pages serves the files as-is.

> Deploying to only one host? Delete the config for the other —
> `vercel.json` for Pages, or `CNAME` + `.github/workflows/` for Vercel.

## Design notes

- Dark by default, light theme via the toggle, saved in `localStorage`.
  `assets/js/theme-init.js` runs before paint so there is no flash.
- Animations: drifting gradient blobs, staggered scroll reveals
  (`IntersectionObserver`), counter roll-ups, a cursor-tracking spotlight on
  cards, a parallax phone mockup, a marquee, and a reading-progress bar on the
  legal pages.
- Everything collapses to a static, fully readable page under
  `prefers-reduced-motion: reduce`, and the legal pages have their own print
  stylesheet.
