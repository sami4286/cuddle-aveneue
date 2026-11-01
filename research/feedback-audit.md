# Ayna feedback audit

Reviewed 29 September 2026 against `Feedback.docx`, all six embedded design references, and the current local source. This is an assessment, not an implementation. Linked Google Drive photographs/folders have been identified but their contents and access have not been verified.

## Verdict

All requested interface and design changes are technically feasible using the existing static HTML/CSS/JavaScript architecture. This is a substantial site-wide design and editorial revision across 16 content pages, with shared footer, location, program, form, and mobile components. It does not require a framework migration.

Most layout and copy work can begin with the material supplied. Complete publication of prices, location details, policies, new photographs, and videos depends on Ayna's remaining inputs. The feedback explicitly supersedes older brief requirements where it changes copy or hierarchy.

## Page-by-page assessment

| Page / area | Requested work | Feasibility and dependencies |
|---|---|---|
| Home | New hero with one primary tour CTA; 4–5-photo desktop gallery; single horizontal moving text line; supplied Welcome copy; more varied program cards; shorter benefits and safety summaries; visual enrichment; location tours; simpler meals; more reviews; new closing CTA/footer. | Feasible. Implement the reference compositions as responsive HTML/CSS with actual text, not flattened screenshots. Gallery and cards need different mobile layouts. New imagery, three location films, and additional reviews remain content dependencies. |
| About | Preserve overall design; revise words/photos later; match updated benefits and locations; improve mobile sizing and text length. | Feasible, relatively limited page-specific redesign. Depends on later copy/photos. |
| All Programs | Warmer hero; age-led cards; Infant → Toddler → 2K → 3-K progression; seasonal camp separate; three locations with program availability; compact shared benefits; mobile swiping or age selector. | Feasible. Final age boundaries and location/program mapping must be consistent throughout the site. Age selector is an alternative, not a requirement to build alongside swiping. |
| Infant Care | Preserve hero; visual development sections; individualized routine; improved imagery; compact mobile facts; expandable FAQs. | Feasible; some accordions already exist. Supplied infant age range conflicts with the existing 18-month language. Feeding copy and new photos are pending. |
| Toddler Care | Visual independence and promise sections; better potty-learning presentation; timeline; curriculum/enrichment cards; expandable tour questions. | Feasible. Updated potty wording and photos are pending; new age range affects more than the cards. |
| 2K | More visual work cycle, promise, curriculum and enrichment; short meals section; timeline; prominent 2K → 3-K transition; expandable questions. | Feasible. Explain progression without implying guaranteed 3-K admission unless the school supplies that wording. Needs classroom images. |
| NYC 3-K | Emphasize free 8:40am–3:00pm day; distinguish paid extended care; visual readiness and curriculum; noticeable Teaching Strategies GOLD; simple enrollment; timeline and FAQs. | Feasible. Final enrollment information and photos are pending. Keep the transition to Pre-K consistent with the supplied program-card copy. |
| Summer Camp | More lively hero/copy; visual activities and water/outdoor play; stronger weekly themes; compact meals; clear practical facts and inquiry CTA. | Feasible. Feedback supplies ages 2–5; dates, hours, weekly themes, availability and photos still need input. Remove the current “invent” wording. |
| Admissions | Shorter hero; six-step numbered timeline; retain important inquiry fields; professional copy; no same-day promise; enrollment checklist; separate 3-K section. | Feasible. Mobile form improvements and confirmation states must be tested against the actual deployed mail route. |
| Schedule a Tour | Warmer hero; five visual visit points; prominent booking form; all three locations; preferred day/time; available videos only; flexible appointment wording. | Feasible. A request form is already available; a live appointment calendar would require the school's scheduling service if wanted. Location videos must be identified and supplied. |
| Tuition | Publish actual rates by program and schedule; emphasize free 3-K; visual inclusions and assistance; professional inquiry copy; expandable mobile prices. | Feasible. Cannot populate the final pricing sections until current rates and schedules are supplied. No wide mobile pricing table is needed. |
| For Families | Parent Resource Center; quick links; visual Brightwheel; age-specific first-day lists; forms/resources; explicit pickup policy; separate routines; handbook/calendar access. | Feasible. Needs final lists, actual downloadable files, and policy wording. Supplied pickup instructions include advance notification, full name, age 18+, and photo ID. |
| Health & Safety | Short introduction; visual trained-staff, building and emergency sections; QR check-in/out; updated pickup; simple food/allergies; infant safety; stronger illness and outdoor information. | Feasible. MAT/medication, illness and current outdoor practices await the client's review. Mobile expandable categories fit the current architecture. |
| Meals | Four main messages; retain weekly menu; easier updates; concise allergy/feeding sections; individualized infant schedules; visual solids; food photos; quick links and mobile tabs. | Feasible. Weekday tabs and a shared menu partial already exist. Developer-managed updates are straightforward; independent staff editing would need a separate editing workflow or CMS. Feeding/medication wording needs final input. |
| FAQ | Professional headings; short categorized answers; category buttons; expandable questions; optional search; update all location, policy, tuition and tour answers. | Feasible. The main FAQ already uses native details/summary accordions. Client-side search is feasible without a backend. Keep structured-data answers synchronized with visible copy. |
| Contact | Three clear contact actions; concise facts; compact Brightwheel box; simplified form with six subjects; three matching location cards; directions; optional map; shorter ending. | Feasible. Third-location imagery, hours, programs and accurate map/review destinations are still required. Mobile tabs or swiping can reuse the location component. |
| Site-wide | Consistent typography, buttons, color, spacing, cards and photography; more professional tone; less repetition; mobile-specific organization and sticky tour access. | Feasible. Build the shared design patterns first, then apply them across pages. Verify sticky controls do not cover content or form controls on small screens. |

## Existing work that can be reused

- Shared page chrome and components: `src/_partials/header.html`, `footer.html`, `locations.html`, `program-cards.html`, `weekly-menu.html`, and `cta-join.html`.
- Native accordions already appear on the FAQ and multiple program/resource pages. The remaining work is coverage, content, presentation, and mobile behavior.
- The weekly menu already uses Monday–Friday tabs and one shared partial. Its design can change without duplicating menu content across pages.
- Carousels, location tabs, motion preferences, and form status messages already have implementation in `js/concept-2.js`.
- Welcome copy is already real HTML; retain that property when adopting the visual examples.
- The review builder currently handles one selected review source and a curated fallback. Three location-specific sources require extending its configuration/data model, not simply adding one more carousel card.

## Content conflicts and decisions

1. **Age bands:** New cards say infant birth–12 months and toddler 12–24 months. Current infant metadata, page copy, FAQ, and location descriptions say six weeks–18 months, while toddler starts at 18 months. The feedback also still refers to the section “What the First 18 Months Are For.” Resolve the intended ranges once and update all occurrences together.
2. **Third location:** The address 71 16th Street is now supplied. Photos, programs, operating hours, tour film, directions destination, and separate Google review URL are still needed. Updating the shared card alone will not cover form options, FAQ answers, structured data, and “both buildings” copy.
3. **3-K potty policy:** The feedback requests a fully potty-trained requirement. It needs one final school-approved wording that is applied consistently to the program, family resources, admissions guidance where relevant, and FAQ. This audit does not verify the policy against external requirements.
4. **Visual examples versus supplied text:** The example hero still shows two buttons and the old headline, whereas the written instructions request one main button and supply new copy. Follow the written instructions for content and hierarchy. The program reference is much brighter and more playful than the sage/cream examples; adapt shapes and layout to one consistent palette/type system.
5. **Claims inside example artwork:** The meals examples include CACFP approval and specific infant-solids rules. Treat those as reference-image content until Ayna confirms they are intended website facts; her text explicitly says feeding details will be updated later.
6. **Review accuracy:** Add three clearly labeled Google review links. Show separate verified ratings/counts, or omit numbers until verified; do not duplicate the current single count across three addresses. More carousel quotes need authentic source material. Automated freshness needs configured data access and rebuilds.
7. **Menu editing:** “Easy to update” is achievable with centralized content; editing directly by school staff is a separate scope choice. The current site has no content-management interface.
8. **Optional ideas:** The age selector, FAQ search, alternate tray design, and all-location map are suggested alternatives/enhancements. They are feasible, but do not all have to be implemented to satisfy the required direction.

## Remaining inputs

- Final program-to-location mapping, third-location hours and photographs.
- Current tuition by program/schedule and any approved fee/assistance explanations.
- Three location tour films, labeled with the correct addresses.
- Final infant/toddler age boundaries; camp dates/hours/themes.
- Updated first-day lists, handbook, calendar, and any resource/form downloads.
- Final feeding, medication/MAT, illness, outdoor, and potty-policy wording.
- Program/enrichment/classroom imagery and access to the linked Drive files/folders.
- Google review destinations for all three locations and verified review data or an agreed manual maintenance process.

## Suggested implementation sequence

1. Establish shared typography, color, buttons, cards, spacing, and responsive components using the homepage as the design reference.
2. Implement homepage hierarchy, copy, gallery, cards, meals, locations, reviews, and closing CTA.
3. Apply the shared patterns to the program overview and five program pages, then admissions/tour/tuition/contact.
4. Update family resources, safety, meals, FAQ, and the limited About changes; sweep metadata, structured data and forms for old ages, two-location references and response promises.
5. Insert final client content and assets, then test every page at multiple phone, tablet and desktop widths. Check touch/keyboard operation, reduced motion, image cropping, video loading, form validation/error/success states, and actual form delivery through an explicitly authorized test.
6. Present the local result for review. No deployment of feedback changes without the user's explicit approval.

## Scope and limits of this audit

Reviewed the document text, embedded examples, and relevant source components. No requested website edits have been implemented. Linked Drive assets have not been downloaded, Google review figures have not been independently verified, and this audit does not claim completed browser/device testing of the proposed redesign.
