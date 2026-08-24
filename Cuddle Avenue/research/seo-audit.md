# Technical SEO Audit — cuddleavenue.org

**Audited:** 10 August 2026
**Stack:** WordPress · custom theme `cuddleavenueka673` · Yoast SEO · 27 pages · 0 blog posts
**Last content update:** May 2023

The site is not broken. It is *invisible* — and in three specific, fixable ways: the homepage carries no content, the images are blocked from the index, and the local signals that would win Brooklyn searches were never added.

---

## Priority 1 — fix before anything else

### 1. The homepage is an empty splash gate
`https://www.cuddleavenue.org/` renders **371 characters**: a logo and two buttons, "PLAYROOM" and "ACADEMY".

- No `<h1>` · no meta description · no canonical · no structured data · one `<h2>`
- Every visitor pays an extra click before seeing anything
- The domain's highest-authority URL ranks for nothing

**Fix:** replace with a real homepage — one `<h1>` carrying *Montessori daycare* + *Brooklyn*, program summaries, trust signals, testimonials, tour CTA. Keep both business lines reachable from the nav, not behind an interstitial.

**Also:** `/home` duplicates `/`. Pick one, 301 the other.

### 2. `robots.txt` blocks every image on the site
```
Disallow: /wp-content/
Disallow: /wp-content/uploads/
```
Both photo directories sit under `/wp-content/`. Consequences: no Google Images traffic, no image thumbnails in local results, and rich results that reference blocked images may be suppressed.

**Fix:** remove both `Disallow` lines. Nothing there needs hiding — `/wp-admin/` is already covered separately.

### 3. No local structured data anywhere
Two licensed Brooklyn locations with 47 five-star reviews and **zero** `LocalBusiness` markup. No address, no geo, no hours, no `aggregateRating`.

**Fix:** `ChildCare` + `LocalBusiness` per location, plus `FAQPage`, `AggregateRating` and `BreadcrumbList`. See `keyword-strategy.md` §6. Implemented and validating in this repo's `index.html`.

### 4. Placeholder text is live on the About page
> "These dummy texts are for display only to show content. In the near future, these text will be replaced with more details and different ways to contact the business."

Parents read About before booking a tour. **Fix:** replace with the founder story (see `content-inventory.md` §8).

### 5. Structured data says "Just another WordPress site"
The default WP tagline is leaking into the `WebSite` schema as the site description.

**Fix:** set a real tagline in Settings → General.

---

## Priority 2 — on-page fundamentals

### 6. Every page shares one meta description
> "Cuddle Avenue Academy is your trusted childcare center in Brooklyn, New York. For more information about us, contact us today."

Identical across all 27 pages. No differentiation, no CTR incentive, a duplicate-content signal.
**Fix:** unique description per page, 140–158 chars, each leading with the page's own value and a reason to click.

### 7. Titles target "New York" instead of Brooklyn
Every title follows `… | Child Care in New York | Cuddle Avenue Academy`. "New York" is a state-and-city-wide term dominated by national aggregators. The searches that convert are *Brooklyn*, *Gowanus*, *Park Slope*, *11215*.
**Fix:** retemplate to `<Page> in Brooklyn, NY | Cuddle Avenue Academy`. Full map in `keyword-strategy.md` §3.

### 8. H1s are generic, duplicated, and sometimes doubled
- Homepage: **no H1 at all**
- About: `We believe your child deserves the best!Eco Friendly, Creative Space For Families`
- Early Learning: `We believe your child deserves the best!Virtual Tour` — **rendered twice on the page**

None contains a keyword. Note also the missing space in `What makesCuddle Avenue Academy different`.
**Fix:** exactly one H1 per page, describing the page in the language parents search.

### 9. ~26% of images have no alt text
21 of 82 images on the Early Learning page alone.
**Fix:** descriptive alt on every content image; `alt=""` on decorative ones.

### 10. No `og:image` on any page
Every share — WhatsApp, Facebook, iMessage, the parent group chats that actually drive daycare referrals — renders as a bare link.
**Fix:** 1200×630 OG image per template. Done here as `assets/img/og-cuddle-avenue.jpg`.

---

## Priority 3 — performance, content, local

### 11. Heavy page weight
15 stylesheets and 23 script tags per page. Poor Core Web Vitals on the mobile connections most parents search from.
**Fix:** consolidate and defer; convert photos to WebP; add width/height to prevent layout shift. *For comparison, the rebuilt homepage in this repo ships 2 stylesheets, 1 deferred script and ~770 KB of WebP imagery.*

### 12. Zero blog content
`post-sitemap.xml` is empty. No top-of-funnel capture whatsoever — and daycare has an unusually rich informational search space (cost, waitlists, tour prep, subsidies, Montessori explainers).
**Fix:** the content calendar in `keyword-strategy.md` §5.

### 13. Toll-free phone number
`1 (800) 620-4221` reads as a call centre, not a neighbourhood daycare, and weakens local relevance. Consistent NAP across the site, both Google Business Profiles and every directory is a direct local ranking factor.
**Fix:** move to a 718/347 number and update every listing.

### 14. Two locations, no location pages
Both are handled as a line in the footer.
**Fix:** one `/locations` page with a section per site, differentiated **by program, not by neighbourhood** — the two addresses are one block apart and neighbourhood-targeted pages would cannibalise each other. Run a separate Google Business Profile per address.

### 15. Facts contradict each other across pages
| Claim | Page A | Page B |
|---|---|---|
| Early Learning class size | 12 children | 15 children (same page's FAQ) |
| Preschool class size | 15 children | 12 children (same page's FAQ) |
| Days open | "Care 7 Days a Week" | Mon–Fri hours only |
| Weekday closing | 6:00 pm | 6:30 pm (Yelp) |
| Payment methods | cash, cheque, card | "No personal checks or cash" (Playroom) |

Contradictions erode parent trust and give AI answer engines no reliable fact to quote.
**Fix:** settle each with the client, then state it once and reuse it everywhere.

---

## Off-site: directories outrank the brand's own site

Yelp, Winnie, Care.com, DaycareAlert, Upwards, Park Slope Parents, brooklynpreschools.com and Wheree all rank for Cuddle Avenue's own name and for the terms it should own. That is a symptom of a thin site, not of aggressive competitors — and it reverses once the pages above exist.

Worth claiming and completing regardless: both Google Business Profiles, Yelp, Care.com, Winnie, Park Slope Parents. The 5.0/47 rating should be visible everywhere.

---

## Summary

| Priority | Items | Effort | Impact |
|---|---|---|---|
| P1 | 1–5 | Medium | Very high — currently blocking indexing and conversion |
| P2 | 6–10 | Low | High — standard on-page wins |
| P3 | 11–15 | Medium/High | High, compounding — performance, content engine, local |

**The single highest-value change is #1.** Everything else compounds on top of having a homepage that exists.
