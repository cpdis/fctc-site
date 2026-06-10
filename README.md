# fctc-site

The code-owned hub for [fctc.fun](https://fctc.fun) — the Filament Coffee
Track Club's landing page, plus the routing table and brand tokens for every
FCTC property on the domain. Replaces the old Framer apex.

Built with [Astro](https://astro.build), fully static, zero client JS except
the theme toggle.

## Develop

```bash
npm install
npm run dev        # localhost:4321
npm run build      # static output in dist/
npm run preview    # serve dist/ locally
```

## How the domain works

This project owns `fctc.fun`. The landing page is served from here; every
other FCTC app stays its own Vercel project and is proxied in via external
rewrites in [`vercel.json`](vercel.json):

| Path | Goes to |
| --- | --- |
| `/` | this site |
| `/dashboard` | `fctc2025.cpd.dev` (cpdis/fctc2025) |
| `/2025wrapped` | `fctc2025.cpd.dev/wrapped` (path rename) |
| `/cup` | `fctc-cup-2026.vercel.app/cup` |
| `/assets/*`, `/data/*`, `/fctc_logo.jpeg`, `/coffee.svg` | dashboard's root-namespace files (reserved) |

**Adding a page or app to the domain** = one rewrite entry in `vercel.json`
+ one entry in the `APPS` list in `src/layouts/Base.astro` (nav + footer).

**Reserved paths:** the hub must never emit files under `/assets` or `/data`
(Vercel serves the filesystem before rewrites, so a hub file there would
shadow the dashboard's). Astro keeps everything under `/_astro/`, so this is
only a concern for files added to `public/`.

### Route parity check

Before and after any deploy or DNS change, run the parity matrix against a
preview URL (or fctc.fun itself):

```bash
scripts/check-routes.sh https://<deployment-url>
```

It asserts every pre-existing URL (dashboard, wrapped deep links, cup,
reserved root assets) resolves identically through the hub's rewrites.

## Brand tokens

`src/styles/tokens.css` is the canonical token sheet for all FCTC
properties — "The Poster" system from the 2026-06 Claude Design pass
(`docs/plans/design_handoff_poster_redesign/`): espresso/crema base, pink
`#d75b77` as the hero color, Cup gold `#ffd23f`, sock-stripe ember/flame,
seafoam, pink-duotone photography, and Anton (display) + Archivo (body) +
Space Mono (labels). Square corners and hard offset shadows everywhere; no
soft radii. Light/dark via `data-theme` on `<html>` — saved choice beats OS
preference, set by a no-flash inline script in `src/layouts/Base.astro`
(which also gates all entrance motion on `js-anim` + reduced-motion).

## Assets

Full-res photo originals (and a 225MB video) live in `assets/`, which is
gitignored. Shipping copies are downscaled into `src/assets/photos/` and
optimized further by Astro at build time. `public/og.jpg` is the social
card, generated from the club-singlet photo.

## Deploy / cutover

Not yet deployed. The full cutover runbook (Vercel project, DNS flip from
Framer, Worker retirement, firewall) lives in
[`docs/plans/2026-06-10-001-feat-fctc-hub-site-plan.md`](docs/plans/2026-06-10-001-feat-fctc-hub-site-plan.md)
under U4/U5.
