# FCTC hub site — replace the Framer apex with a code-owned hub

**Status:** LIVE — U1–U4 complete (fctc.fun cut over to Vercel 2026-06-10, parity 11/11); U5 mostly done (firewall on all 3 projects, worker marked bypassed). Remaining: delete the `fctc2025-proxy` worker + zone route after the cutover soaks, then cancel the Framer subscription.
**Repo:** `cpdis/fctc-site` (this folder; repo not created yet)
**Implements at:** `fctc.fun` (apex)

## Why

The FCTC web estate is growing a page a week and the apex is the only piece
that isn't code: a Framer one-pager (subscription, un-versioned, no shared
nav). The apps already live behind path prefixes on separate Vercel projects:

| Path | Project | Notes |
| --- | --- | --- |
| `/` | Framer | manifesto, weekly runs, WhatsApp/Strava links |
| `/dashboard` | `cpdis/fctc2025` → fctc2025.cpd.dev | also owns root `/assets`, `/data`, `/fctc_logo.jpeg`, `/coffee.svg` |
| `/2025wrapped` | same project, served from `/wrapped` | path renamed in the router |
| `/cup` | `cpdis/fctc-cup-2026` | self-contained under `/cup/` (vite base) |

Routing today is a Cloudflare Worker (`fctc2025-proxy`, catch-all on
`fctc.fun/*`; source versioned at `fctc-cup-2026/scripts/fctc-proxy-worker.js`).
The Framer page links to none of the apps.

**Goals:** code-owned apex, kill the Framer dependency, shared navigation to
every FCTC property, one obvious home for the domain's routing table and brand
tokens, room to add pages without rework.

**Non-goals (v1):** migrating the dashboard or cup into this repo (they stay
separate deployables); CMS; blog.

## Key decisions

1. **Routing moves from the Worker into the hub's `vercel.json`** (external
   rewrites). The hub project owns `fctc.fun`; unknown paths render the hub
   (or its 404). Rationale: the routing table lives in a repo next to the site
   it fronts, one mental model (Vercel), no Worker to babysit. The Worker
   stays deployed-but-bypassed during cutover as instant rollback, then dies.

   ```jsonc
   // vercel.json (hub) — the domain map
   "rewrites": [
     { "source": "/dashboard", "destination": "https://fctc2025.cpd.dev/" },
     { "source": "/dashboard/:path*", "destination": "https://fctc2025.cpd.dev/:path*" },
     { "source": "/2025wrapped", "destination": "https://fctc2025.cpd.dev/wrapped" },
     { "source": "/2025wrapped/:path*", "destination": "https://fctc2025.cpd.dev/wrapped/:path*" },
     { "source": "/cup", "destination": "https://fctc-cup-2026.vercel.app/cup" },
     { "source": "/cup/:path*", "destination": "https://fctc-cup-2026.vercel.app/cup/:path*" },
     // dashboard's root-namespace assets (until it's rebased onto /dashboard/):
     { "source": "/assets/:path*", "destination": "https://fctc2025.cpd.dev/assets/:path*" },
     { "source": "/data/:path*", "destination": "https://fctc2025.cpd.dev/data/:path*" },
     { "source": "/fctc_logo.jpeg", "destination": "https://fctc2025.cpd.dev/fctc_logo.jpeg" },
     { "source": "/coffee.svg", "destination": "https://fctc2025.cpd.dev/coffee.svg" }
   ]
   ```

   Constraints this imposes on the hub itself:
   - The hub must NOT emit anything under `/assets` or `/data` (Astro uses
     `/_astro/`, which is why it's the recommended stack; if Vite, set
     `build.assetsDir` to something else). Vercel serves the filesystem
     before rewrites, so any hub file at a rewritten path shadows the
     dashboard's — treat `/assets`, `/data`, `/fctc_logo.jpeg`, `/coffee.svg`
     as reserved.
   - Follow-up (separate, optional): rebase the dashboard onto `/dashboard/`
     the way the cup was (vite `base` + its own rewrites), then delete the
     four root-namespace rules forever.

2. **Stack: Astro**, static output. It's a content site: zero JS by default,
   content collections fit the growing page list (events, traditions, wrapped
   archive), and `/_astro/` sidesteps the reserved-path problem. No framework
   runtime to ship for a manifesto page. (Alternative considered: vanilla
   Vite like the cup — fine too, but Astro's content collections earn their
   keep the moment a second page appears.)

3. **DNS: grey-cloud (DNS-only) CNAME to Vercel** once the Worker retires —
   Vercel's recommended setup behind Cloudflare, simplest TLS chain. Bot
   protection moves to the Vercel Firewall (enable Bot Protection + AI bot
   blocking on the hub project AND the other two — past incident). If we ever
   want Cloudflare features back at the edge, re-orange-cloud and the Worker
   pattern still works.

4. **The hub is the brand-token home.** One CSS token sheet (colors incl. the
   Cup gold `#ffd23f`, fonts, light/dark) documented for reuse. Open design
   question for the implementing session: the dashboard uses Bricolage
   Grotesque + DM Sans, the cup uses Space Grotesk + JetBrains Mono — pick
   the canonical pairing, then drift the apps toward it over time.

## v1 scope

One excellent landing page plus the plumbing:

- **Hero / manifesto** — reuse the existing copy (it's good: "We warm up
  together. We drink coffee at the end together. In between, you can run as
  fast, slow, or mental as you want. Amen scoundrels."), the
  `FILAMENT COFFEE • COLD BREW • RUN` marquee as a design element.
- **Weekly runs** — Wed Herdsman Lake 0545 (Filament Coffee) with the
  week-by-week rotation list; Fri il Lido 0630 (beach/suburbs seasonal);
  Strava event links (club 1156647, events 1434762 / 1434766).
- **Traditions** — ANZAC marathon, Avon Valley, 7 halfs in 7 days, birthday
  half marathons.
- **Live / apps nav** — cards or a nav strip to `/dashboard`, `/cup`,
  `/2025wrapped`; designed so adding next year's pages is appending an entry.
- **Links** — WhatsApp group, Strava club.
- **Chrome** — light/dark (match the cup's pattern: saved choice > OS pref,
  no-flash inline script, theme-color sync), OG/social meta, favicon, 404
  page (the hub now owns every unmatched path on the domain).

## Units of work

- **U1 — Scaffold + tokens.** Astro project, brand token sheet, fonts,
  light/dark plumbing, repo + Vercel project (`fctc-site`), preview deploys.
- **U2 — Landing page.** All v1 content sections, distinctive design pass
  (the manifesto voice is the personality; avoid generic-landing-page look),
  mobile-first, 404.
- **U3 — Routing table + parity matrix.** `vercel.json` rewrites above; a
  `scripts/check-routes.sh` curl matrix asserting every existing URL
  (`/dashboard`, `/dashboard/x`, `/2025wrapped`, `/2025wrapped/ada`, `/cup`,
  `/cup/replay.json`, `/assets/*`, `/data/*`) returns the same content via
  the hub's preview URL as via fctc.fun today. Run it against the preview
  domain BEFORE any DNS change.
- **U4 — Cutover.** Archive the Framer site (full-page screenshots + copy
  dump). Add `fctc.fun` to the hub Vercel project; flip Cloudflare DNS
  (apex + www) to Vercel, grey-cloud; re-run the parity matrix against
  fctc.fun; watch for a day; then delete the Worker route and the Framer
  subscription. Rollback = point DNS back at Framer (orange-cloud), Worker
  resumes routing.
- **U5 — Post.** Vercel Firewall bot protection on all three projects,
  README runbook (how to add a page/app to the domain), update
  `fctc-cup-2026/scripts/fctc-proxy-worker.js` header to say it's retired,
  CLAUDE-md-able notes for future agents.

## Risks / gotchas

- **Reserved root paths** (`/assets`, `/data`, logo, coffee.svg) — hub must
  not collide; parity matrix catches it.
- **`/2025wrapped` path mapping** — it's a rename (`/wrapped` upstream), easy
  to get subtly wrong for client-side-routed subpaths; test
  `/2025wrapped/:member` specifically.
- **DNS cutover** — drop the apex TTL ahead of time; do it at a quiet hour
  (everything is static, real risk is minutes not hours).
- **Framer content** — archive before cancelling; the Strava event links and
  WhatsApp invite URL live only there today.
- **SPA fallbacks** — the dashboard's `vercel.json` rewrites everything to
  its index; proxied deep links must still work through external rewrites
  (parity matrix).

## Cloudflare access (set up 2026-06-10 — read this, it has teeth)

- `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` are exported in
  `~/.bashrc`. The token is **account-owned** (`cfat…` prefix): verify it via
  `/accounts/$CLOUDFLARE_ACCOUNT_ID/tokens/verify`, NOT `/user/tokens/verify`
  (the latter returns "Invalid API Token" for account-owned tokens).
- Scopes: **Zone:Read + DNS:Edit + Workers Routes:Edit on all zones**.
  Verified working: zone listing (fctc.fun, cpd.dev, colindismuke.com,
  password.coffee) and DNS reads. fctc.fun zone id:
  `19631f5ad40d99e1b28750ef435c211c`.
- **Gotcha:** the token has NO Workers Scripts permission, and wrangler
  prefers `CLOUDFLARE_API_TOKEN` over its OAuth login. Deploying the proxy
  worker therefore needs `env -u CLOUDFLARE_API_TOKEN npx wrangler deploy …`
  (falls back to the OAuth session, which has Workers Scripts account-wide)
  — unless the token has since been edited to add
  Account → Workers Scripts → Edit.
- Current DNS (pre-cutover): apex = two proxied A records to Framer
  (35.71.142.77, 52.223.52.2); `www` = proxied CNAME to `sites.framer.app`;
  there's also a `_domainconnect` CNAME (Squarespace registrar artifact —
  leave it). **The cutover must flip BOTH apex and www** (answers former
  open question 4: www exists and should 308 to the apex via Vercel's
  redirect-to-apex domain setting).

## Open questions (decide before/with U2)

1. Astro vs vanilla Vite — recommendation is Astro, veto welcome.
2. Canonical brand fonts: Bricolage Grotesque + DM Sans (dashboard) vs
   Space Grotesk + JetBrains Mono (cup)?
3. Analytics on the hub (Vercel Analytics? nothing?).
4. Anything on the Framer site not captured in the content inventory above
   (it was scraped, not eyeballed — check the live page for imagery worth
   keeping).
