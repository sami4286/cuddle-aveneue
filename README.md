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
├─ index.html                      Homepage concept — 4 sections
├─ css/
│  ├─ tokens.css                   Palette, type scale, radii, @font-face
│  └─ main.css                     Section styles + responsive rules
├─ js/carousel.js                  Programs carousel (vanilla, ~50 lines)
├─ assets/
│  ├─ img/                         Optimized WebP + JPG (770 KB total)
│  │  └─ _source/                  Original downloads, untouched
│  ├─ logo/cuddle-avenue.svg       Bear logo redrawn in the new palette
│  └─ fonts/                       Self-hosted variable WOFF2
└─ research/
   ├─ content-inventory.md         Every usable line of copy, by topic
   ├─ seo-audit.md                 15 findings, prioritised, with fixes
   └─ keyword-strategy.md          Clusters, URL map, schema, calendar
```

---

## The homepage concept

Four sections, built to the approved reference design:

1. **Hero** — real classroom photography, keyword-bearing H1, tour CTA
2. **Trust bar** — 5.0★/47 reviews · licensing · organic meals · hours
3. **Our story** — founder narrative with the tall + two-wide photo grid
4. **Programs** — beige panel, four-card scroll-snap carousel

### Design tokens

| Token | Value | Use |
|---|---|---|
| `--cream` | `#FDF5E6` | Page ground |
| `--beige` | `#EAE2CB` | Programs panel |
| `--green` | `#2F5D50` | Headings and body |
| `--marigold` | `#F2C14E` | Accent word, highlights |
| `--lavender` | `#A78BFA` | Primary CTA |
| `--ink` | `#1B1B3A` | Card titles |

**Type:** Grandstander (display) · Nunito Sans (body) — both self-hosted variable WOFF2, no external requests.

### Built correct from the start

Even as a pitch piece: one `<h1>`, semantic landmarks, alt text on every image, `og:image`, self-hosted fonts, WebP with JPG fallback, explicit `width`/`height` to prevent layout shift, keyboard-accessible carousel, `prefers-reduced-motion` respected, and a validating two-location `ChildCare` + `LocalBusiness` + `AggregateRating` JSON-LD graph.

Verified: no horizontal overflow at 375 / 768 / 1440 px; all images load; JSON-LD parses.

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
