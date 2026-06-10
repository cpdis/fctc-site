# Handoff: FCTC "The Poster" Homepage Redesign

## Overview

A full redesign of the fctc.fun landing page for Filament Coffee Track Club
(Perth, WA) in a big-type poster/brutalist direction: pink promoted to the
hero color, the gold marquee + sock-stripe motif retained, condensed Anton
display type, pink-duotone photography, and a layer of scroll/hover motion.
Light and dark themes are both fully designed.

This replaces the current homepage built in `fctc-site` (Astro). The site's
section structure mostly carries over, with these content changes decided
during design review:

- Nav label "2025 Wrapped" → **"Wrapped"**
- **"The Apps" section removed entirely** (nav/footer links to the apps remain)
- Traditions updated to: Anzac Day Marathon, Christmas Marathon, Aaron's
  Birthday Beer Run, Birthday Halfs
- Friday schedule rows relabeled **Summer / Winter**, plus a new **MSBB** row
  (Mount Street Breakfast Bar, CBD)
- Wednesday 5th-week session is now **"Surprise?" in rainbow letters**

## About the Design Files

The files in this bundle are **design references created in HTML** — a
working prototype showing the intended look and behavior, not production
code to copy directly. The task is to **recreate this design in the existing
`fctc-site` Astro codebase**, using its established patterns: Astro
components, `astro:assets` `<Image>` optimization, the `tokens.css` →
`global.css` token pipeline, the existing no-flash theme script in
`Base.astro`, and the `vercel.json` routing (which is unaffected).

Open `FCTC Site — The Poster.html` in a browser to see the live reference
(it needs network access for Google Fonts). The React/Babel block at the
bottom of the HTML is prototype-review tooling ("Tweaks panel") — **do not
port it**. Everything else is the design.

## Fidelity

**High-fidelity.** Colors, typography, spacing, copy, and motion are final.
Recreate pixel-perfectly. `designs/poster.css` is the styling source of
truth — values below are summaries; when in doubt, read the CSS.

## Screens / Views

One page (the homepage), eight bands top to bottom:

### 1. Header
- Flex bar: logo left, nav right. Padding `16px clamp(20px, 4vw, 48px)`.
  Bottom border `2px solid var(--line)`, then the 8px sock-stripe divider.
- **Logo**: 26px line-art coffee cup SVG (stroke `currentColor`, 2px,
  round caps; two steam-wisp paths stroked `var(--pink)`) + "FCTC" in Anton
  25px, no space between FC and TC; "TC" colored `var(--pink)`. The steam
  wisps loop: fade in while rising ~4.5px, fade out (2.8s ease-in-out,
  second wisp delayed 1.4s). Exact SVG paths are in the HTML.
- Nav links: Dashboard, Cup, Wrapped → `/dashboard`, `/cup`, `/2025wrapped`
  (prototype uses `#`). Space Mono 13.5px, uppercase, letter-spacing 0.1em.
  Hover: pink + 2px underline, offset 5px.
- Theme toggle: ☀/☾ button, 2px solid border, square. Hover: translate
  (-2px,-2px) + `3px 3px 0 var(--pink)` shadow.

### 2. Hero
- Three stacked Anton lines, `clamp(58px, 10.5vw, 152px)`, line-height 0.92:
  "FILAMENT" (ink) / "COFFEE" (pink) / "TRACK CLUB" (outlined: transparent
  fill, `-webkit-text-stroke: 2.5px var(--ink)`; 1.5px under 900px wide).
- On load each line rises from below inside an `overflow: hidden` clip
  (0.7s `cubic-bezier(0.2, 0.8, 0.2, 1)`, staggered 0 / 0.1s / 0.2s).
- Meta row between 2px top/bottom rules: three Space Mono items —
  "**Perth WA** — Est. on a Wednesday", "**Wed 0530** Herdsman Lake",
  "**Fri 0600** il Lido, Cottesloe". Bold spans are pink. Stacks vertically
  under 900px.
- CTAs: "Join the WhatsApp" (gold solid) + "Strava Club" (outline). Space
  Mono bold 15px uppercase, 2px border, padding 15px 28px, **square
  corners**. Hover: translate(-3px,-3px) + `5px 5px 0 var(--pink)`;
  active snaps back. Links: WhatsApp invite + Strava club (URLs in HTML).
- Photo strip: 3 equal columns, 2px rules between and above, height
  `clamp(220px, 24vw, 300px)`. Outer two are pink duotone, center one
  full color. Stacks to one column under 900px.

### 3. Gold marquee
"FILAMENT COFFEE • COLD BREW • RUN •" repeating. Gold bg, espresso text,
2px espresso borders, Space Mono bold 14px, letter-spacing 0.2em. Two
identical spans, track animates `translateX(-50%)` over `--marquee-dur`
(36s), pauses on hover.

### 4. Manifesto (full-bleed pink)
- Background `var(--pink)` in **both themes**, text `var(--crema)`,
  padding-block `clamp(64px, 8vw, 96px)`.
- Creed in Anton, `clamp(40px, 5.6vw, 76px)`, **line-height 1.05** (looser
  than other display type so comma descenders don't collide), max-width
  12em: "We warm up together. We drink coffee together. In between, run as
  fast, slow, or MENTAL as you WANT." — "MENTAL" outlined (2px crema
  stroke, shakes ±2.5° for 0.45s on hover), "WANT." gold.
- "★ AMEN SCOUNDRELS ★" stamp: Space Mono bold 15.5px, 2.5px crema border,
  padding 10px 20px, rotated -2°. On scroll into view it "stamps in":
  scale 2.2 + 6° → 1 + -2°, 0.5s `cubic-bezier(0.2, 1.5, 0.4, 1)`.
- Foot paragraph 17px, color `#f6d7de`, max-width 36em.

### 5. The Weekly Runs
- Kicker: Anton h2 `clamp(44px, 5vw, 64px)` + Space Mono aside
  "Two starts. Zero alarms snoozed." (color `--ink-soft`).
- Two-column grid inside a 2px border, 2px rule between columns (one
  column under 900px). Each card: duotone photo (260px tall, 2px rule
  below) then 28px-padded body.
- Card head: Anton day name `clamp(42px, 4vw, 56px)` + gold "bib" tag
  (Space Mono bold 13.5px, 2px espresso border, espresso text, rotated
  +1.5°; flips to -1.5° on card hover with a springy transition).
  Bibs: "0530 · Herdsman Lake" / "0600 · il Lido".
- Schedule list: 2px top rule; rows `grid: 64px 1fr`, 1px `--ink-soft`
  bottom rules, 16.5px text; week label Space Mono bold 13.5px pink
  uppercase. Rows nudge `padding-left: 6px` on hover.
  - **Wednesday**: 1st Intervals · 2nd Herdy's + Monger 12km Cruise ·
    3rd Intervals · 4th 8km Community Cruise · 5th **"Surprise?"** with
    each letter colored from the rainbow cycle (see Design Tokens; bold,
    letters wave upward sequentially on row hover, 45ms stagger).
  - **Friday**: Summer "7–10km on the soft sand when the sand is warm" ·
    Winter "10km through the suburbs when it's cold" · MSBB "Some Fridays
    we start at Mount Street Breakfast Bar in the CBD".
- "STRAVA EVENT ↗" link: Space Mono bold 14px uppercase, 2px pink
  underline-border; links to the Strava group events (URLs in HTML).
- Body copy: Wed "Something for everyone. Easy some weeks, intervals and
  tempo others — everything at your own pace, all welcome." Fri "Beach
  during the summer, suburbs in the winter — and sometimes the CBD."

### 6. The Traditions
- Same kicker pattern; aside "When it's not Wednesday or Friday".
- Four rows, `grid: 200px 1.1fr 1.2fr`, 2px top rules (+ bottom on last),
  padding-block 26px. Numerals 01–04 in Anton 96px, transparent fill with
  2px pink stroke; fill solid pink on row hover. Row also indents 14px on
  hover. Name in Anton 30px uppercase; blurb 17px `--ink-soft`.
  Under 900px: single column, numerals 56px.
- Content: 01 Anzac Day Marathon "A marathon on Anzac Day, because a dawn
  service deserves a dawn effort." · 02 Christmas Marathon "The culmination
  of a year's training — capped off with the Christmas party and a White
  Elephant." · 03 Aaron's Birthday Beer Run "What better way to celebrate
  than a half marathon with a few beers along the way?" · 04 Birthday Halfs
  "If it's your birthday, we run a half marathon in your honor."

### 7. Reverse marquee
Same construction as #3 but `animation-direction: reverse`, text
"AMEN SCOUNDRELS • SEE YOU AT 0530 •". Bridges traditions → footer.

### 8. Footer
Background `--foot-bg` (espresso; near-black `#120d0a` in dark theme),
crema text. Flex row (column under 900px): "FCTC — PERTH, WA" · centered
nav (Dashboard, Cup, Wrapped, WhatsApp, Strava; hover gold) ·
"AMEN SCOUNDRELS." Side labels `#b3a08f`.

## Interactions & Behavior

- **Theme**: `data-theme="light" | "dark"` on `<html>`; saved choice beats
  OS preference via a no-flash inline script — reuse the existing
  `Base.astro` mechanism and `theme` localStorage key as-is.
- **Duotone photos**: img `grayscale(1) contrast(1.1)` + an overlay
  (`position: absolute; inset: 0`) filled `var(--duo-tint)` with
  `mix-blend-mode: multiply`. On hover the img desaturation and overlay
  opacity transition out (0.45s) and the img scales to 1.03 — photo
  "blooms" to full color. `.plain` variant skips the treatment.
- **Scroll reveals**: elements marked `data-rv` start `opacity: 0;
  translate: 0 26px` and transition in (0.65s) via a one-shot
  IntersectionObserver (threshold 0.18). Traditions rows stagger via
  `transition-delay` 0 / 0.08 / 0.16 / 0.24s. The stamp uses the same
  observer to trigger its stamp-in animation.
- **Progressive enhancement**: ALL entrance animation is gated on a
  `js-anim` class added to `<html>` by JS only when
  `prefers-reduced-motion: no-preference`. Base CSS state is fully
  visible — no-JS, print, and reduced-motion users see everything.
  A `prefers-reduced-motion: reduce` block also zeroes all animation/
  transition durations globally.
- Hover details: nav underlines, button/toggle translate+hard-shadow,
  marquees pause, bib flip, schedule-row nudge, rainbow wave, numeral
  fill, MENTAL shake, logo steam loops continuously.
- Optional (prototype "Tweaks", default values shown): `--duo-tint`
  defaults to pink; `data-motion="calm"` slows the marquee to 55s and
  disables the wiggle effects. Ship the defaults; the calm flag is only
  worth porting if you want a site-wide "less motion" setting.

## State Management

Static site. Only state: theme choice (localStorage, exists already) and
the one-shot IntersectionObserver. No data fetching.

## Design Tokens

Extends the existing `src/styles/tokens.css`. Brand constants unchanged:

- Gold `#ffd23f` · Ember `#ff7a30` · Flame `#e8442c` · Pink `#d75b77` ·
  Seafoam `#9ed1af` · Espresso `#1c1410` · Crema `#faf4e6`
  (note: crema here is `#faf4e6`, slightly deeper than the old `#faf5ea`)
- Stripe gradient: gold/ember/flame in equal thirds (unchanged)

Theme tokens:

| Token | Light | Dark |
| --- | --- | --- |
| `--bg` | crema | espresso |
| `--ink` | espresso | crema |
| `--ink-soft` | `#5c4f43` | `#b3a08f` |
| `--line` (rules/borders) | espresso | crema |
| `--foot-bg` | espresso | `#120d0a` |
| `--duo-tint` | pink | pink |

Rainbow letters (contrast-tuned per theme):

| | rb1 | rb2 | rb3 | rb4 | rb5 |
| --- | --- | --- | --- | --- | --- |
| Light | `#e8442c` | `#f06d1f` | `#c79311` | `#43996a` | `#d75b77` |
| Dark | `#ff6a4f` | `#ff9a5c` | `#ffd23f` | `#9ed1af` | `#e98ba2` |

Typography (replaces Bricolage/DM Sans/JetBrains Mono on this page —
decide whether to drift the whole token sheet or scope to the hub):

- **Display**: Anton 400, uppercase, line-height 0.92 (creed: 1.05),
  letter-spacing 0.005em
- **Body**: Archivo 400/500/700, **18px base**, line-height 1.6
- **Labels**: Space Mono 400/700, 13–15.5px, uppercase, letter-spacing
  0.08–0.2em
- Fonts loaded from Google Fonts in the prototype; in Astro use
  `@fontsource/anton`, `@fontsource/archivo`, `@fontsource/space-mono`.

Spacing/structure: max-width 1240px wrap with `clamp(20px, 4vw, 48px)`
inline padding; section padding-block `clamp(56px, 7vw, 88px)`; **border
radius 0 everywhere**; no soft shadows — only hard offset shadows
(`5px 5px 0`) on hover; rules are 2px ink (1px `--ink-soft` for schedule
sub-rules); stripe 8px. Single breakpoint at 900px (plus 620px for
nav-link collapse / stacked CTAs).

## Assets

- Photos (already in the repo at `src/assets/photos/`): `wednesday-crew.jpg`
  (hero strip + Wed card), `club-singlet.jpg` (hero strip center, full
  color), `breakfast-il-lido.jpg` (hero strip + Fri card). Copies included
  in `photos/` so the prototype renders. Use Astro `<Image>` with
  responsive widths as the current site does.
- Coffee-cup logo SVG: inline in the HTML header — copy the paths verbatim.
- No other imagery. `filament-sign.jpg`, `run-mental.jpg`, `sock-game.jpg`
  are no longer used on the homepage.

## Files

- `FCTC Site — The Poster.html` — the full design reference (markup,
  content, motion JS). Ignore the React/Babel "Tweaks panel" block at the
  end of the file.
- `designs/poster.css` — complete stylesheet; the source of truth for all
  values.
- `photos/` — the three photos used, for standalone preview.
