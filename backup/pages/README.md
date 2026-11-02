# Retired pages

Pages taken off the site, kept here in case they are wanted again. Nothing in
this folder is built or published, and no page on the site links to them.

| Page | Was | Hidden | Moved here |
|---|---|---|---|
| `about.html` | About us: story, philosophy, mission, educators | 2026-10-18 | 2026-10-29 |
| `programs.html` | All five programs on one page | 2026-10-18 | 2026-10-29 |
| `for-families/faq.html` | The full FAQ, 26 questions by topic | 2026-10-29 | 2026-10-29 |
| `for-families/health-and-safety.html` | Health & safety in detail: staff, pickup, building, safe sleep, illness, allergies, outdoors | 2026-10-29 | 2026-10-29 |
| `for-families/meals-nutrition-breastfeeding.html` | Meals, the full weekly menu with photos, allergies, breastfeeding | 2026-10-29 | 2026-10-29 |
| `admissions/schedule-a-tour.html` | Schedule a tour: what you see on a visit, the Calendly booking, the locations, the two virtual tour videos | 2026-11-01 | 2026-11-01 |

About and the programs overview were hidden at Ayna's request; the
"Programs" menu item goes to the homepage's programs section instead. The
three For Families pages were folded into the one For Families page (Ayna's
request), and everything that linked to them now goes to its sections or was
removed. The weekly menu itself is still on the homepage (`_partials/weekly-menu.html`).

A For Families page goes back to `src/for-families/`, and the tour page to
`src/admissions/`, not `src/`. Every "Schedule a tour" button goes straight
to Calendly, so nothing was lost when the tour page went.

## To bring one back

1. Move the file back into `src/` (e.g. `git mv backup/pages/about.html src/about.html`).
2. Remove its name from the retired-page check in `netlify-build.sh`, which
   otherwise stops the build when anything links to it.
3. Add its links back to the header (`src/_partials/header.html`), the footer
   and any pages that should point to it.

The pages use the same partials and `@var` markers as every other page, so
they build as they are, though their copy dates from before 2026-10-18.
