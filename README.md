# PowerApps — site

Static marketing site for the PowerApps iOS apps, plus the per-app legal pages
that the App Store requires.

No build step, no dependencies. Plain HTML, one CSS file, one JS file.

## URL structure

| URL | File |
| --- | --- |
| `/` | `index.html` — landing page, app grid |
| `/clearway/` | `clearway/index.html` — app page |
| `/clearway/privacy/` | `clearway/privacy/index.html` |
| `/clearway/terms/` | `clearway/terms/index.html` |
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

- **App Store links** — both apps now carry their real Apple IDs
  (`id6809809538` for JustCleaner, `id6809789001` for ClearWay). Each URL only
  resolves once that app is published; until then the button 404s.
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

A third trap surfaced writing the ClearWay pages, and it is not covered by a
`TODO`. The template's sections 08 and 09 are written on the premise that the app
transmits nothing — true of a speaker cleaner, false of anything that talks to a
network. ClearWay's whole purpose is to send DNS queries to a third-party
resolver, so "no data is transmitted off the device" had to go, and sections 02
and 05 now say plainly which operator sees the lookups. **If the next app makes
any network request at all, those two sections are wrong by default and no
placeholder will tell you.**

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

## Cache busting

`assets/css/main.css` and `assets/js/main.js` never change name, and the server
sends `Cache-Control: max-age=600`. Without help, that means a returning visitor
spends ten minutes after every deploy with the **new HTML and the old
stylesheet**. That is not a flicker: it shipped the hero carousel as two stacked
phone screens spilling out of the mockup, because the markup for the slides had
arrived and the rules that overlap them had not.

```bash
node scripts/stamp-assets.mjs          # rewrite /assets/… URLs with a content hash
node scripts/stamp-assets.mjs --check  # exit 1 if any stamp is stale
```

The deploy workflow runs it too, so forgetting it locally cannot break
production. It is idempotent, it leaves `{{APP_SLUG}}` placeholders alone, and an
asset whose bytes did not change keeps its hash and stays cached.

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
- The hero phone is a carousel. Each app is a `[data-phone-slide]` inside
  `[data-phone-carousel]`, with one `[data-phone-dot]` button per slide; the
  slides share a grid cell and cross-fade, so the phone never changes height.
  Adding an app means adding a slide and a dot — the script counts them. It does
  not auto-advance under `prefers-reduced-motion`, since an unattended slideshow
  is the kind of movement that setting exists to stop, and it stops entirely
  while the tab is in the background.
- Everything collapses to a static, fully readable page under
  `prefers-reduced-motion: reduce`, and the legal pages have their own print
  stylesheet.
