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

1. Replace every `TODO` in the generated pages.
2. Set the real App Store URL (search for `id0000000000`).
3. Add an icon at `assets/img/myapp.svg` (64×64 viewBox, rounded square).
4. Add a card for the app to the `#apps` grid in `index.html`.
5. Add the three new URLs to `sitemap.xml`.

## Placeholders to replace before going live

- **App Store link** — `justcleaner/index.html` still points at
  `https://apps.apple.com/app/id0000000000`.
- **Effective dates** in the legal pages (`1 September 2026`).
- **Governing law** in `justcleaner/terms/index.html` §12 currently names the
  State of California and the federal laws of the United States. Change the
  state if you would rather be governed by another one.

## Support email

Contact links point at `azizmizamov@yandex.com`. The address is stored
**reversed** in `data-mail` attributes as light spam protection, and
`assets/js/main.js` un-reverses it into a `mailto:` link at runtime.

To change it, reverse the new address and update every `data-mail` value:

```bash
node -e 'console.log([..."you@example.com"].reverse().join(""))'
```

> The privacy policy and terms are a solid, App-Store-ready starting point, but
> they are not legal advice. Read them, make sure every statement is actually
> true of your build (no analytics SDK, no permissions, no IAP), and have a
> lawyer look them over if the app grows.

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
