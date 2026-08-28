# Cuddle Avenue — Website Revamp (Phase 1)

Redesign concept and SEO foundation for **Cuddle Avenue Academy**, a Montessori daycare and preschool in Gowanus, Brooklyn.

This phase delivers a client-facing homepage concept plus the research that drives the full rebuild.

---

## View it

Open `index.html` in any browser. No build step, no server, no dependencies.

```
start index.html          # Windows
open index.html           # macOS
```

---

## What's here

```
├─ index.html                      Homepage, built to the client brief
├─ BRIEF-COMPLIANCE.md             Brief vs. page, and what is blocked on the client
├─ css/
│  ├─ concept-2.css                Layout, type, sections, responsive rules
│  ├─ concept-2-v2.css             Brand palette — colour tokens only
│  ├─ home.css                     The sections the brief adds to the homepage
│  ├─ tokens.css                   Concept 1 palette (unused by index.html)
│  └─ main.css                     Concept 1 sections (unused by index.html)
├─ js/
│  ├─ concept-2.js                 Carousels, reveals, parallax
│  └─ carousel.js                  Concept 1 carousel (unused by index.html)
├─ assets/
│  ├─ img/                         Optimized WebP + JPG
│  │  └─ _source/                  Original downloads, untouched
│  ├─ logo/                        Bear logo, raster + hand-traced SVG
│  └─ fonts/                       Self-hosted variable WOFF2
├─ netlify.toml, netlify-build.sh  Allow-listed dist/ assembly
└─ research/
   ├─ content-inventory.md         Every usable line of copy, by topic
   ├─ seo-audit.md                 15 findings, prioritised, with fixes
   └─ keyword-strategy.md          Clusters, URL map, schema, calendar
```

`css/tokens.css`, `css/main.css` and `js/carousel.js` belong to the earlier cream/marigold
concept. Nothing on the current homepage loads them; they are kept only for reference.

---

## The homepage

Built to the section order in the client brief (*Complete Website Structure, Content &
Developer Guide*, section **1. HOME**), with Health & safety moved up — see
BRIEF-COMPLIANCE.md:

1. **Hero** — "A loving place to learn, grow & belong", with the brief's three CTAs
2. **Welcome** — the philosophy paragraphs, and *Our story*
3. **Explore our programs** — Infant · Toddler · 2K · **free NYC 3-K** · Summer Camp
4. **Why families choose us** — the brief's eight benefits
5. **Health & safety** — the brief's eleven practices, on a slate band
6. **Enrichment** — photo carousel plus all fifteen activities as crawlable text
7. **Tour band** — the virtual tour and the strongest *Schedule a tour* CTA
8. **Meals & nutrition** — fresh · homemade · organic · nut-free, on a warm panel
9. **Our Brooklyn locations** — one tab per location (the third awaits client detail)
10. **Family testimonials** — real named 5★ reviews
11. **Final CTA** — "Come experience Cuddle Avenue Academy"

Read **[BRIEF-COMPLIANCE.md](BRIEF-COMPLIANCE.md)** before touching the copy. It maps each
brief section to what shipped, and lists the seven items still blocked on the client —
the third location, the program-to-location mapping, the main phone number, Summer Camp
ages and hours, the nut-free wording, the tour videos, and the photo shoot.

### Design tokens

The brand palette lives in `css/concept-2-v2.css`, sampled from the school's own logo
artwork. `css/concept-2.css` holds the layout and the fallback green palette.

| Token | Value | Use |
|---|---|---|
| `--c2-bar` | `#34434A` | Announcement bar, final CTA card — the logo's ground |
| `--c2-green` | `#2E7E7F` | Buttons, active states — the teal heart, deepened to clear AA |
| `--c2-green-ink` | `#1F6B6C` | Text-size links, which need more contrast than a fill |
| `--c2-lime` | `#FAAAB3` | Swooshes, eyebrow dashes, stars — the pink hearts |
| `--c2-panel` | `#EAF3F6` | Enrichment panel |
| `--c2-muted` | `#606F77` | Body copy |

**Type:** Nunito Sans — self-hosted variable WOFF2, no external requests.

### Built correct from the start

One `<h1>`, semantic landmarks, alt text on every image, `og:image`, self-hosted fonts, WebP
with JPG fallback, explicit `width`/`height` to prevent layout shift, keyboard-accessible
carousels, `prefers-reduced-motion` respected, and a `ChildCare` JSON-LD graph carrying the
programs, hours and both **confirmed** locations. The unconfirmed third location is
deliberately absent from the structured data so the markup stays truthful.

Verified: no horizontal overflow at 500 / 768 / 1024 / 1440 px (`scrollWidth == clientWidth`
at each); every internal anchor resolves to an element that exists; tags balanced; the
Netlify build assembles `dist/` without publishing anything excluded.

### Building the site

Pages live in `src/`, not at the repo root. Each one is a `<main>` plus a few markers:

```html
<!--@var TITLE: Infant Care in Brooklyn | Cuddle Avenue Academy-->
<!--@var DESC: …-->
<!--@include head--> <!--@include announce--> <!--@include header-->
<main id="main"> … </main>
<!--@include footer--> <!--@include scripts-->
```

`tools/assemble.sh` pastes the partials from `src/_partials/`, substitutes the `@var`s and a
computed `{{ROOT}}` (so a partial's `{{ROOT}}css/…` is right at every depth), and writes the
finished HTML to `dist/`. Shared page furniture — header, footer, announcement bar, the five
program cards, the locations tabs — exists once. An unfilled `{{PLACEHOLDER}}` fails the build
rather than shipping an empty `<title>`.

```bash
bash netlify-build.sh      # assemble + copy assets → dist/, then report unbuilt links
```

**Preview from `dist/`,** not from the repo root: `dist/index.html`. The root no longer holds a
built page. The build also prints every internal link whose page does not exist yet, which is
the running to-do list while pages land in tranches.

### Header and tour video

The header is `position: sticky` and stays with the reader; the announcement bar above it
scrolls away, and the header takes a shadow only once it has. `js/concept-2.js` publishes the
measured header height as `--c2-header-h`, which `scroll-padding-top` uses so no in-page jump
lands a heading underneath the bar. (`body` uses `overflow-x: clip` rather than `hidden` —
`hidden` makes the body a scroll container, which silently breaks sticky positioning.)

The tour band plays its virtual tour when it scrolls into view and pauses it on the way out,
muted and looping, with a pause control on the band. The file it plays is named in
`data-c2-tour-video`; with that attribute empty the module builds nothing and the band keeps
its photograph.

### Media pipeline

The client's originals arrive as camera files — HEIC stills and multi-hundred-megabyte `.mov`
walkthroughs — in `assets/Pictures & Video_s/`, `assets/Programs/` and `assets/Menu Pictures/`.
All three are gitignored and none is ever published: only the derivatives below are.

Everything is produced with ffmpeg (`winget install Gyan.FFmpeg`):

```bash
# menu cards → web stills, flat in assets/img/ (the build copies maxdepth 1 only)
ffmpeg -i "Monday Lunch.png" -vf scale=1100:-2 -frames:v 1 -update 1 -q:v 4  assets/img/menu-mon-lunch.jpg
ffmpeg -i "Monday Lunch.png" -vf scale=1100:-2 -frames:v 1 -update 1 -c:v libwebp -quality 80 assets/img/menu-mon-lunch.webp

# tour video → a silent 720p cut for the autoplaying band, and a full 1080p cut with sound
ffmpeg -i final.mov -an -vf "scale=1280:-2,fps=30" -c:v libx264 -crf 26 -preset slow \
       -pix_fmt yuv420p -movflags +faststart assets/video/center-tour-loop.mp4
ffmpeg -i final.mov     -vf "scale=1920:-2,fps=30" -c:v libx264 -crf 23 -preset slow \
       -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart assets/video/center-tour.mp4
```

HEIC needs `-frames:v 1 -update 1` and no `-vf`: an iPhone HEIC is tiled, ffmpeg stitches the
tiles with an internal filtergraph, and a simple filter cannot be attached to that. Scale in a
second pass if you need to.

`netlify-build.sh` publishes only the videos a page actually references — quoted, so a filename
named in an HTML comment does not count — which keeps the unused cuts off the CDN.

### Motion

`js/concept-2.js` makes one decision and publishes it as `<html data-motion="on|off">`. The
stylesheet and the reveal/parallax code both read that attribute, so the hero marquee, the
scroll reveals, the parallax and the hover lift can never disagree with each other.

`off` still transitions colour, border and shadow — reduced motion means no travel, not no
feedback. What it drops is the marquee, the parallax, the reveal slide and the 2px hover lift.

**`?motion=on` forces motion on for the visit** (`?motion=off` forces it off; the choice is
kept in `sessionStorage`). Worth knowing during review: Windows' *Settings → Accessibility →
Visual effects → Animation effects*, when off, is a reduced-motion signal to every browser on
that machine — the site will sit still on it, correctly, until that switch or `?motion=on`
says otherwise.

The page is `noindex, nofollow` in both the meta tag and `_headers` while it is a review
deploy — **remove both to go live.**

---

## Why the current site needs this

From `research/seo-audit.md` — the three that matter most:

1. **The live homepage is an empty splash gate.** 371 characters, no `<h1>`, no meta description, no canonical, no structured data. The domain's strongest URL ranks for nothing.
2. **`robots.txt` blocks every image on the site** via `Disallow: /wp-content/`. No image search, no rich-result thumbnails.
3. **No local structured data anywhere.** Two licensed Brooklyn locations and 47 five-star reviews, invisible to local results.

Also live today: placeholder copy on the About page reading *"These dummy texts are for display only to show content."*

---

## Open questions for the client

1. **Is the Playroom still operating?** Every recent review and directory listing describes only the daycare. This changes the homepage and the whole IA. *Built Academy-first in the meantime.*
2. **Local phone number** — replace the 800 number with a 718/347 line?
3. **Original logo vector** — is there an AI/SVG file, or do we keep the hand-trace?
4. **Ayna's story and surname** — the About page is generic Montessori boilerplate today. Her real story is the strongest differentiator available and a genuine E-E-A-T signal.
5. **Photography** — 10 usable photos won't carry a full site. Budget a half-day shoot.
6. **Fact conflicts** — class sizes (12 vs 15), whether care is genuinely 7 days, and payment methods all contradict across pages. See `content-inventory.md`.

---

## Next

| Phase | Work |
|---|---|
| **1. Unblock** | Real homepage · fix `robots.txt` · remove placeholder copy · LocalBusiness schema · claim both Google Business Profiles |
| **2. Money pages** | Program pages · `/tuition` · `/locations` · `/tour` · 301s from `/child-care-*` |
| **3. Authority** | Blog cadence · founder story · review programme · local links |
| **4. Expand** | Playroom section, if confirmed active |

---

## Notes on assets

Photography and copy are Cuddle Avenue Academy's own, sourced from `cuddleavenue.org` for this concept. The ~140 theme images on the old site are stock licensed to that theme and are **not** reused here. Several photos carry the school's own white-heart face redactions — get written photo releases before publishing anything un-redacted.
