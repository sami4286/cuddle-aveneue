# Homepage vs. the client brief

Checked against **Complete Website Structure, Content & Developer Guide** (client `.docx`, section *1. HOME*, plus the global HEADER, FOOTER and BUTTON RULE sections).

The homepage was rebuilt to the brief's section order and CTA wording. What follows is what matches, what is deliberately different, and what is blocked on the client.

---

## Pages

The brief specifies 24 pages. The site ships **19**, because five of the brief's subpages are
sections instead — a deliberate difference, argued below. **Nine are built**, including every
destination in the main navigation.

| Built | Still to build |
|---|---|
| `/` homepage | `programs/toddler-care` · `programs/2k` · `programs/nyc-3k` · `programs/summer-camp` |
| `about` | `admissions/tuition-financial-assistance` |
| `about/health-and-safety` | `for-families/meals-nutrition-breastfeeding` · `for-families/faq` |
| `programs` | `privacy-policy` · `accessibility` · `terms` |
| `programs/infant-care` | |
| `admissions` · `admissions/schedule-a-tour` | |
| `for-families` · `contact` | |

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

`programs/infant-care` is the pattern for the other four program pages: the brief's
PROGRAM-PAGE RULE answered in order — the day, the curriculum, feeding, sleep, communication,
safety, the room, the tour video, and the three CTAs that close it.

The fifteen unwritten routes are **not dead links**. The build generates a placeholder page for
each one — full header and footer, an honest line about the page not being written yet, a phone
number and a tour button. They are generated, never committed, and each disappears the moment a
real page takes its place. A reviewer clicking anything in the footer today lands somewhere
sensible rather than on a 404.

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

7a. **Stock photography — a deliberate exception to the brief.** The brief says to *"use real
   Cuddle Avenue Academy photography rather than generic stock photography whenever
   possible."* Two enrichment cards now break that rule, because **STEM** and **Creative
   activities** are two of the brief's own fifteen enrichment experiences and no real
   photograph of either exists:

   | On the page | Adobe Stock ID | Replace with |
   |---|---|---|
   | `stock-stem.jpg` / `.webp` | 529112232 | a real STEM activity at the shoot |
   | `stock-creative.jpg` / `.webp` | 448815197 | a real art or making session |

   Both are filenamed `stock-*` so they cannot be mistaken for the school's own library, and
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

- **Privacy Policy / Accessibility / Terms** are linked in the footer as the brief requires,
  but the pages do not exist yet. They must exist before launch.

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
