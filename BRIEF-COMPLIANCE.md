# The site vs. the client brief

Checked against **Complete Website Structure, Content & Developer Guide** (client `.docx`) — the HOME section, all five section trees, and the global HEADER, FOOTER, PROGRAM-PAGE and BUTTON RULE sections.

What follows is what matches the brief, what is deliberately different, and what is blocked on the client.

---

## Pages

The brief specifies 24 pages. The site ships **19**, because five of the brief's subpages are
sections instead — a deliberate difference, argued below. **All nineteen are written.** No route
is a placeholder, no internal link 404s, and no in-page anchor points at an id that does not
exist.

| | |
|---|---|
| **Home** | `/` |
| **About** | `about` (story · philosophy · mission · educators · why families choose us · family partnership) · `about/health-and-safety` |
| **Programs** | `programs` · `infant-care` · `toddler-care` · `2k` · `nyc-3k` · `summer-camp` |
| **Admissions** | `admissions` (six steps + enrollment inquiry) · `admissions/schedule-a-tour` · `admissions/tuition-financial-assistance` |
| **For families** | `for-families` (Brightwheel · what to bring · forms · pickup · routines · calendar) · `meals-nutrition-breastfeeding` · `faq` |
| **Contact** | `contact` |
| **Legal** | `privacy-policy` · `terms` — both **drafts pending legal review**. The accessibility page was removed on request. |

### Five subpages became sections

The brief models About, Admissions and For Families as hubs with subpages. Five of those
subpages have no search demand of their own, and a page that exists only to be a menu item makes
a parent click twice for one answer. They are now anchored sections:

| Brief subpage | Now |
|---|---|
| 2A Our Story | `about#story` |
| 2B Why Families Choose Us | `about#why` |
| 2D Family Partnership | `about#partnership` |
| 4A Enrollment (steps + inquiry form) | `admissions#inquire` |
| 5B Parent Resources | `for-families#brightwheel` and the sections after it |

Every link that pointed at those five URLs now points at the section, so no content and no
internal link was lost.

**What deliberately stayed a separate page**, against the same test: `about/health-and-safety`
("licensed daycare brooklyn" is a real query, and `research/keyword-strategy.md` targets it),
`admissions/tuition-financial-assistance` ("how much does daycare cost in brooklyn" is the
strongest informational query in the whole strategy), `admissions/schedule-a-tour` (the
conversion destination every CTA points at), `for-families/meals-nutrition-breastfeeding`
("organic meals daycare brooklyn" — a genuine differentiator), `for-families/faq` (earns
`FAQPage` schema), and all five program pages (the priority cluster).

**URLs** follow the brief's hierarchy rather than the flat keyword URLs proposed in
`research/keyword-strategy.md`. Keyword-in-URL is a weak signal; titles and H1s carry the
keywords, and the hierarchy earns breadcrumb sitelinks. Short vanity URLs (`/tuition`, `/tour`)
can be added as redirects for ads and print without changing the structure.

Every program page answers the brief's PROGRAM-PAGE RULE in the same order — a typical day, the
curriculum, meals, naps, communication, safety, the room, and the three CTAs that close it.

The build still generates a placeholder page for any route that is linked but not yet written.
Nothing triggers it today; it exists so that adding a link before its page can never produce a
404.

### What each new page still needs from the school

| Page | Missing |
|---|---|
| `programs/toddler-care` | Photo gallery of the toddler room; its own tour film |
| `programs/2k` | Photo gallery; tour film (the 2K tour folder in the drop was empty) |
| `programs/nyc-3k` | Photo gallery; tour film; **the MySchools listing, program code and application deadlines** |
| `programs/summer-camp` | **Ages, hours and dates** — none supplied anywhere; photos; tour film |
| `admissions/tuition-financial-assistance` | **Whether to publish a starting rate** (recommended — see the page) |
| `for-families` | Illness/exclusion policy, school calendar, parent handbook, what the school supplies vs. what families bring |
| `privacy-policy` · `terms` | Legal entity name, postal address, retention periods, governing law — **and a lawyer's review** |

**New open item — the booking system.** The brief routes SCHEDULE A TOUR to "the actual tour
booking system", and none was supplied. `admissions/schedule-a-tour` therefore carries a real
form that posts through Netlify Forms; the contact page carries a second one. Before launch,
both need **Forms enabled on the Netlify site and a notification address set**, or a family can
submit a tour request that reaches nobody. If the school already uses a booking tool, the form
block is meant to be replaced by its embed.

## Section-by-section (homepage)

| Brief section | Status |
|---|---|
| Hero — "A Loving Place to Learn, Grow & Belong" + 3 CTAs | ✅ headline, supporting text and all three CTAs |
| Welcome to Cuddle Avenue Academy (philosophy) + OUR STORY | ✅ new section, brief's own copy |
| Explore Our Programs — 5 cards | ✅ Infant · Toddler · 2K · NYC 3-K · Summer Camp |
| NYC 3-K: FREE, 8:40–3:00, extension 7:30–6:00 for a fee | ✅ all three facts on the card, no click needed |
| Why Families Choose Us — ~8 benefits + CTA | ✅ the brief's eight, in its order |
| Enrichment — icons/photos + "varies by age" + CTA | ✅ 5 photo cards + all 15 activities, now named in the section lead rather than in a chip band |
| Health & Safety — 11 practices + CTA | ✅ all 11, in a slate band after the benefit grid |
| Meals & Nutrition — Fresh/Homemade/Organic/Nut-Free + 6 points | ✅ the four words as the panel's own row of tiles + all 6 (see wording and photography notes below) |
| Our Brooklyn Locations — 3 cards, each with name, photo, address, programs, hours + 3 CTAs | ⚠️ one tab per location, 2 complete, 3rd is a marked placeholder |
| Family Testimonials | ✅ 3 real named 5★ reviews (2 more available) |
| Final CTA — "Come Experience Cuddle Avenue Academy" | ✅ both CTAs |
| Header nav — HOME/ABOUT US/PROGRAMS/ADMISSIONS/FOR FAMILIES/CONTACT US + SCHEDULE A TOUR | ✅ |
| Footer — Programs / Family Resources / Admissions / Contact + social + legal | ✅ |
| Button rule — no vague "LEARN MORE" | ✅ every "Learn more" removed; CTAs name the action |
| Support Google & AI discovery — real text, not images | ✅ plus `ChildCare` JSON-LD |

---

## Blocked on the client — must be settled before launch

1. **The third location.** The brief says three Brooklyn locations. Only two addresses are
   confirmed anywhere in the project (69 16th Street and 591 3rd Avenue, one block apart,
   per `research/content-inventory.md`). The third card is a visible placeholder holding no
   invented address, phone or hours. Either send the details, or drop the tab — in which
   case the "three locations" line in the hero ribbon and footer must change too.

2. **Which location runs which program.** 2K, NYC 3-K and Summer Camp are not on the current
   live site at all, so no program-to-location mapping exists. Each location card marks its
   program list `(confirm)`.

3. **The main phone number.** The page uses **(917) 960-5618** — the number on the school's
   business card and storefront glass. `research/content-inventory.md` also records a
   toll-free **(800) 620-4221** from the old site, and recommends against it. Confirm which
   is the main line.

4. **Summer Camp ages and hours.** The brief lists the program but not its ages or hours.
   Marked "to be confirmed" on the card.

5. **"Nut-Free".** The brief says *Nut-Free*. `research/content-inventory.md` records that the
   school is **not a certified nut-free facility** but permits no nuts or nut products on
   site. The page states the practice, not a certification: "No nuts or nut products are
   permitted on site." Do not strengthen this without confirming the certification.

6. **The virtual-tour videos — two of the promised set have arrived.** The general center
   tour now plays in the band, and the infant & toddler tour is cut and waiting for its
   program page (`assets/video/tour-infant-toddler.mp4`). What is still missing: a tour for
   **2K**, **NYC 3-K** and **Summer Camp** — those three folders in the drop are empty — and
   confirmation of **which location** each existing video was filmed in, since the brief asks
   for one per location and both films open on a street entrance.

7b. **Twelve photographs cannot be sharpened — they need new source files.**
   Two thirds of the site's photographs were shipping smaller than the space they fill, so
   the browser was enlarging them: a 640px plate stretched across 2880 device pixels reads
   as soft, and that is what it was. Twenty-five have been re-cut from the originals at up
   to 2400px, with a srcset so a phone does not pay for a desktop's pixels.

   The other twelve are already at their source resolution. There is no larger version of
   them in the repository, in its history, or on disk — they have been 640x800 or 800x800
   since the first upload, and the 93 interior stills are empty rooms, so none of them is a
   source for a photograph with children in it:

   | Ships at | Needs |
   |---|---|
   | `program-infant`, `program-toddler`, `program-preschool`, `program-playroom` — 640×800 | 2400px |
   | `review-craft`, `review-explore`, `review-holiday` — 800×800 | 1600px |
   | `story-table`, `story-playroom` — 900×620 · `story-gardening` — 760×1000 | 1800px |
   | `og-cuddle-avenue` — 1200×630 | 2400px |

   Every one of these shows children, and the 93 interior stills are empty rooms — every
   one checked, not taken on trust — so none of them is a source for any of these. The shoot
   the brief keeps asking for would replace them all anyway. Until then they are the sharpest
   the supplied files allow.

   The two tour posters were on this list and are not any more: they are frames of the two
   tour films, and both films have a source far larger than the 720p copy the site serves —
   `final.mov` at 3840×2160 and the infant tour at 1920×1080. The posters were cut again from
   those, at the frame they already showed. They are 2400×1350 and 1920×1080 now.

   Worth knowing for later: those same sources mean **both tour videos could be re-encoded at
   1080p**. The lightbox draws them up to 1100px wide, so the 720p copies are being enlarged
   there too. Not done here, because it roughly doubles what a visitor downloads to watch
   one, and that is a call worth making deliberately rather than as a side effect of fixing
   the photographs.

7a. **Stock photography — a deliberate exception to the brief.** The brief says to *"use real
   Cuddle Avenue Academy photography rather than generic stock photography whenever
   possible."* Two enrichment cards now break that rule, because **STEM** and **Creative
   activities** are two of the brief's own fifteen enrichment experiences and no real
   photograph of either exists:

   | On the page | Adobe Stock ID | Replace with |
   |---|---|---|
   | `stock-stem.jpg` / `.webp` | 529112232 | a real STEM activity at the shoot |
   | `stock-creative.jpg` / `.webp` | 448815197 | a real art or making session |

   **The homepage hero is now a third, and a larger exception than either.** It is
   AdobeStock_260198254 — two adults on the floor with two toddlers and a xylophone, with
   the child who was walking through the background cropped out — and it runs on the
   homepage, About and Programs. It is not filenamed `stock-*`, because it kept the name of
   the photograph it replaced, so nothing in the filename says it is not this school. Its
   alt text does the work instead: it describes children at an activity and does not place
   them at Cuddle Avenue, where the previous alt said "at Cuddle Avenue Academy in Brooklyn"
   of a photograph that had been taken there.

   **And a fourth: the welcome section.** `welcome-paint` is AdobeStock_620023397 — a child
   holding up paint-covered hands — cut square with the face centred, on the homepage only.
   It did not replace `story-table`, which is still on About twice and For families once; it
   is a new file, so those three keep the photograph they had.

   **And a fifth: 3-K.** `program-3k` is AdobeStock_1680895093 — a circle of children with
   their hands stacked — cut square from the exact centre of the frame. It takes the four
   places `review-craft` was standing in for 3-K: the programme card, the readiness section
   and promise band on the 3-K page, and the 3-K block on Admissions. The reviews carousel
   on the homepage keeps `review-craft`, because that one is about reviews, not 3-K.

   This one at least replaces an acknowledged gap rather than a real photograph: the card
   carried a PHOTO GAP note saying no 3-K photograph existed and this was "the closest real
   one". The note now says stock, and points here.

   **And a sixth, which is the same file twice.** `program-toddler` is now
   AdobeStock_529112232 — two children swirling colour through trays — cut portrait. That is
   the photograph `stock-stem` already uses, and both land on the homepage: the programme
   cards and the enrichment carousel are on the same page. **The same picture appears twice
   there.** Worth changing one of them; `stock-stem` is the easier of the two to move, and
   several of the nine unused stock images would serve a STEM card.

   This is the case 7a warns about — "a stock child standing in for a 3-K classroom or a
   location is a claim about this school that the photograph cannot support" — and the
   homepage hero is the most prominent place on the site to make it. It was asked for
   deliberately and the real photograph it replaced was 1600px against the 2400 it needed,
   so there was a reason. **It should still be the first thing swapped out when the shoot
   happens.**

   Both `stock-stem` and `stock-creative` are filenamed `stock-*` so they cannot be mistaken for
   the school's own library, and
   their alt text describes children at an activity without claiming they are Cuddle Avenue
   children in a Cuddle Avenue room. Eleven licensed stock images were supplied; the other
   nine are unused, several of them visibly AI-generated (a world map that is not a map, a
   hand-painted portrait in Midjourney colours). **Recommendation: keep stock to these two
   illustrative cards.** A stock child standing in for a 3-K classroom or a location is a
   claim about this school that the photograph cannot support.

7. **Photography.** The brief asks for real Cuddle Avenue photography per program and per
   location. The meals gap is closed — the school's fifteen menu cards now carry that
   section. The August drop also added 93 interior stills, every one of them an **empty
   room**: no children, no teachers, no mealtime, no kitchen. They are usable for locations
   and classrooms, but only once someone says **which building each was taken in** — nothing
   in the files records it, and the site would otherwise be guessing. Still missing outright:
   a 3-K classroom, a Summer Camp photo, the kitchen, and children or teachers in any of it.
   `research/content-inventory.md` already recommends a half-day shoot; these belong on the
   shot list. Several existing photos also carry the school's own white-heart face redactions,
   so photo releases are needed before any un-redacted image is published.

---

## Deliberate differences from the brief

- **CTA casing.** The brief writes CTAs in capitals (`SCHEDULE A TOUR`). The wording is kept
  verbatim; the casing follows the design system's sentence case. Say the word if you want
  literal caps.

- **Link destinations.** Phase 1 ships the homepage only, so every CTA whose brief destination
  is a subpage points at the matching homepage section instead and carries the eventual path
  in a `data-target` attribute. When the subpages land, swap `href` for `data-target` and
  drop the attribute. The full map is commented at the top of `index.html`.

- **Section order.** The brief runs Why Families Choose Us → Enrichment → Health & Safety →
  Meals. Health & Safety now sits directly after the benefit grid instead, because
  "Health & safety-focused environment" is one of those eight benefits and the band is that
  benefit opened up — and because the brief's order put four pale, text-led sections in a row.
  Everything else keeps the brief's sequence.

- **A tour band that the brief does not itemise** sits between Enrichment and Meals & Nutrition.
  It serves two of the brief's own stated goals — *SHOW THE REAL EXPERIENCE* (the tour videos)
  and *GENERATE TOURS* — and is where the page's "Schedule a tour" buttons currently land.

- **The fifteen enrichment activities** are named in the section's opening sentence rather than
  in a separate band of pill-shaped chips, which read as filler under the photo cards. They are
  still real crawlable text, which is what the brief's Google/AI discovery goal asks for.

- **Meals & Nutrition carries no photograph.** There is no picture of a meal, a plate or the
  kitchen in the library; the image that used to sit there was the playroom, captioned in its
  alt text as a mealtime. The section is typographic until a real kitchen photo exists.

- **Locations are tabs, not three side-by-side cards.** One tab per location, each opening a
  full-width photograph with the detail card resting on it — the layout from the earlier
  review build, now carrying the address, programs, hours and three CTAs the brief asks for.

- **Enrichment heading** does not state a count. The brief claims "16+ enrichment experiences"
  as a benefit while its enrichment list names 15 activities; the benefit keeps the brief's
  "16+" wording, and the section heading avoids asserting a number the list contradicts.

- **Privacy Policy / Terms** are linked in the footer (the brief also listed Accessibility; that page was removed on request),
  and both pages exist as drafts pending legal review.

---

## Deploy notes

- Live review URL: **https://cuddle-avenue-review.netlify.app** (Netlify project
  `cuddle-avenue-review`).
- `netlify-build.sh` referenced three HTML files (`concept-2-v2.html`, `concept-2.html`,
  `index.html`) that are not in this repo, so it would have failed on the first build from
  GitHub with `set -euo pipefail`. It now publishes `index.html` and guards against a client
  `.docx` reaching `dist/`.
- The page is `noindex, nofollow` in both the meta tag and `_headers` while it is a review
  deploy. **Remove both to go live.**
