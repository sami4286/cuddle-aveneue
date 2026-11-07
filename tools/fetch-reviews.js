#!/usr/bin/env node
/* Build the homepage reviews section: one tab per location, each with its
 * own carousel of Google reviews and its own "Read all reviews" link.
 *
 * Why build time and not the browser: a client-side fetch would leave the
 * carousel empty on first paint, then shove the page around as it filled.
 * CLS is 0.000 site-wide and worth keeping. Fetching here costs the visitor
 * nothing, no extra request, no third-party script, no key in the HTML.
 *
 * The trade is freshness: reviews change when the site rebuilds. A weekly
 * Vercel deploy hook covers that.
 *
 * ── Locations ────────────────────────────────────────────────────────
 * content/reviews.json lists the locations, in tab order, each with its
 * Google listing link, the names of the environment variables that hold
 * its live source, and curated fallback reviews. Adding a fourth building
 * is an entry in that file and nothing else.
 *
 * ── Sources, per location ────────────────────────────────────────────
 * Each location is filled from the best live source configured for it;
 * the shared credential is one variable, the per-location id another
 * (named in that location's "live" block).
 *
 *   featurable  All reviews, free, JSON. The client signs in with Google
 *               and connects each listing as its own widget.
 *               FEATURABLE_API_KEY + one widget id per location
 *
 *   gbp         All reviews, straight from Google. Needs the client to
 *               OAuth as the listing owner AND Google to approve API
 *               access, which takes weeks.
 *               GBP_ACCESS_TOKEN + one location path per location
 *
 *   places      Capped at FIVE reviews per listing by Google, no paging.
 *               GOOGLE_PLACES_API_KEY + one place id per location
 *
 *   curated     The location's "reviews" in content/reviews.json. Always
 *               available, so a tab is never blank because a call failed.
 *
 * For the primary location the older single-listing variable names
 * (FEATURABLE_WIDGET_ID, GBP_LOCATION, GOOGLE_PLACE_ID) still work.
 *
 * ── Two modes ────────────────────────────────────────────────────────
 *   node tools/fetch-reviews.js dist    build: live where configured, else
 *                                       curated; rewrites dist/index.html
 *                                       (and every page that includes the
 *                                       reviews partial) and the footer
 *                                       rating site-wide
 *   node tools/fetch-reviews.js --src   curated only, into src/_partials/reviews.html,
 *                                       so the source page carries the same
 *                                       markup and works if the build step
 *                                       never runs. Run it after editing
 *                                       content/reviews.json.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SRC_MODE = process.argv[2] === '--src';
const DIST = SRC_MODE ? null : (process.argv[2] || 'dist');
/* src: the shared partial, which keeps the assembler's placeholder.
 * dist: every built page that carries the section, each with the path
 * back to the site root that its own folder depth needs. */
const SRC_PARTIAL = 'src/_partials/reviews.html';
let ROOT = '{{ROOT}}';

/* Google returns reviews in whatever order it likes, and one of them can be
 * a bare "Great!". A quote card has a lead line and a body, so a review has
 * to carry enough prose to fill one. Short ones still count toward the
 * rating; they just are not shown. */
const MIN_CHARS = 120;
const MIN_RATING = 5;
const MAX_CARDS = 10;

/* The photographs are ours, reviews arrive without any. Each location names
 * its own set in content/reviews.json; these three are the fallback for one
 * that does not. */
const PHOTOS = [
  { file: 'review-explore',
    alt: 'Two toddlers lean over a low wooden shelf together, exploring the blocks stored inside it.' },
  { file: 'review-craft',
    alt: 'Three children around a table assembling paper dolls, one of them laughing.' },
  { file: 'review-holiday',
    alt: 'Three children laughing and reaching up to hang paper hearts on a branch arrangement.' },
];

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.25l-5.81 3.05 1.11-6.47-4.7-4.58 6.5-.95z"/></svg>';

const env = name => (name && process.env[name]) || '';

/* ── sources ─────────────────────────────────────────────────────────
 * Each takes a location and returns { rating, count, allUrl, reviews }
 * with reviews as [{name, text, rating, url, google: true}]. */

async function fromFeaturable(loc, id) {
  const r = await fetch(`https://api.featurable.com/v1/widgets/${encodeURIComponent(id)}`,
    { headers: { 'X-API-Key': env('FEATURABLE_API_KEY') } });
  if (!r.ok) throw new Error('featurable HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const d = await r.json();
  const w = d.widget || d;
  const sum = w.gbpLocationSummary || {};
  return {
    rating: sum.rating,
    count: sum.reviewsCount,
    allUrl: sum.url || loc.allUrl,
    reviews: (w.reviews || []).map(v => ({
      name: (v.author && v.author.name) || 'A parent',
      text: v.text || '',
      rating: (v.rating && v.rating.value) || 5,
      url: v.url || loc.allUrl,
      google: true,
    })),
  };
}

async function fromGbp(loc, id) {
  /* The location name is the full resource path, e.g. accounts/1/locations/2. */
  const out = [];
  let token = '';
  do {
    const u = `https://mybusiness.googleapis.com/v4/${id}/reviews` +
              `?pageSize=50${token ? '&pageToken=' + token : ''}`;
    const r = await fetch(u, { headers: { Authorization: 'Bearer ' + env('GBP_ACCESS_TOKEN') } });
    if (!r.ok) throw new Error('gbp HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200));
    const d = await r.json();
    for (const v of d.reviews || []) {
      out.push({
        name: (v.reviewer && v.reviewer.displayName) || 'A parent',
        text: v.comment || '',
        rating: { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }[v.starRating] || 0,
        url: loc.allUrl,
        google: true,
      });
    }
    token = d.nextPageToken || '';
    /* Enough to fill the slider many times over; no need to walk hundreds. */
    if (out.length >= 200) break;
  } while (token);
  const rated = out.filter(v => v.rating);
  return {
    rating: rated.length ? rated.reduce((a, v) => a + v.rating, 0) / rated.length : undefined,
    count: out.length,
    allUrl: loc.allUrl,
    reviews: out,
  };
}

async function fromPlaces(loc, id) {
  const r = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`,
    { headers: {
      'X-Goog-Api-Key': env('GOOGLE_PLACES_API_KEY'),
      'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews',
    } });
  if (!r.ok) throw new Error('places HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const d = await r.json();
  return {
    rating: d.rating,
    count: d.userRatingCount,
    allUrl: d.googleMapsUri || loc.allUrl,
    reviews: (d.reviews || []).map(v => ({
      name: v.authorAttribution.displayName,
      text: (v.text && v.text.text) || '',
      rating: v.rating,
      url: v.googleMapsUri || loc.allUrl,
      google: true,
    })),
  };
}

/* Which live source a location has, and the id to call it with. The shared
 * credential has to be set too, or the per-location id is no use. */
const LEGACY = { featurable: 'FEATURABLE_WIDGET_ID', gbp: 'GBP_LOCATION', places: 'GOOGLE_PLACE_ID' };
const SHARED = { featurable: 'FEATURABLE_API_KEY', gbp: 'GBP_ACCESS_TOKEN', places: 'GOOGLE_PLACES_API_KEY' };
const FETCH = { featurable: fromFeaturable, gbp: fromGbp, places: fromPlaces };

function liveSource(loc) {
  const want = process.env.REVIEWS_SOURCE;
  const order = want && want !== 'curated' ? [want] : want === 'curated' ? [] : ['featurable', 'gbp', 'places'];
  for (const s of order) {
    if (!FETCH[s] || !env(SHARED[s])) continue;
    const id = env((loc.live || {})[s]) || (loc.primary ? env(LEGACY[s]) : '');
    if (id) return { source: s, id };
  }
  return null;
}

/* ── rendering ───────────────────────────────────────────────────── */

const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Straight quotes and three dots read as sloppy beside the rest of the
 * site, which is set in proper typography throughout. */
const typo = s => esc(s)
  .replace(/\.\.\./g, '&hellip;')
  .replace(/(\w)'(\w)/g, '$1&rsquo;$2')
  .replace(/&quot;([^&]*)&quot;/g, '&ldquo;$1&rdquo;');

const initials = name => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

/* First sentence becomes the lead, the rest the body, the shape the card
 * was designed around. A one-sentence review gets a lead alone. */
function split(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const m = clean.match(/^(.{40,200}?[.!?])\s+(.*)$/s);
  return m ? { lead: m[1], body: m[2] } : { lead: clean, body: '' };
}

const I = n => ' '.repeat(n);

function card(v, i, photos) {
  const set = photos && photos.length ? photos : PHOTOS;
  const photo = set[i % set.length];
  const { lead, body } = split(v.text);
  const stars = Array.from({ length: Math.round(v.rating) }, () => I(20) + STAR).join('\n');

  /* "Review on Google" is a claim, so it is only made for a review that
   * really came from Google, live, or curated and marked source: google. */
  const where = v.google && v.url
    ? `<a class="c2-quote__where" href="${esc(v.url)}" target="_blank" rel="noopener">Review on Google</a>`
    : `<span class="c2-quote__where">Parent</span>`;

  return `${I(12)}<li class="c2-quote">
${I(14)}<blockquote class="c2-quote__card">
${I(16)}<div>
${I(18)}<p class="c2-quote__lead">&ldquo;${typo(lead)}&rdquo;</p>
${body ? `${I(18)}<p>${typo(body)}</p>\n` : ''}${I(16)}</div>
${I(16)}<footer class="c2-quote__foot">
${I(18)}<div class="c2-quote__who">
${I(20)}<span class="c2-quote__avatar" aria-hidden="true">${esc(initials(v.name))}</span>
${I(20)}<span>
${I(22)}<cite class="c2-quote__name">${esc(v.name)}</cite>
${I(22)}${where}
${I(20)}</span>
${I(18)}</div>
${I(18)}<p class="c2-quote__stars" role="img" aria-label="Rated ${Math.round(v.rating)} out of 5">
${stars}
${I(18)}</p>
${I(16)}</footer>
${I(14)}</blockquote>
${I(14)}<figure class="c2-quote__media">
${I(16)}<picture>
${I(18)}<source type="image/webp" srcset="${ROOT}assets/img/${photo.file}.webp">
${I(18)}<img src="${ROOT}assets/img/${photo.file}.jpg" width="800" height="800" loading="lazy" decoding="async"
${I(18)}     alt="${esc(photo.alt)}">
${I(16)}</picture>
${I(14)}</figure>
${I(12)}</li>`;
}

const ARROW_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
const ARROW_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function panel(loc, data, first) {
  const id = 'c2-quotes-' + loc.id;
  const n = data.reviews.length;
  const all = data.allUrl
    ? `${I(8)}<p class="c2-says__more">
${I(10)}<a class="c2-btn c2-btn--outline c2-says__all" href="${esc(data.allUrl)}"
${I(12)} target="_blank" rel="noopener">Read all ${esc(loc.name)} reviews on Google</a>
${I(8)}</p>\n`
    : '';

  /* The headline figure: live when there is a live response, otherwise
   * the listing's own figure as typed in from Google (reviews.json). */
  const fig = typeof data.rating === 'number' && data.count ? data : (loc.listing || {});
  const score = typeof fig.rating === 'number' && fig.count
    ? `${I(8)}<p class="c2-says__score">${STAR}<strong>${Number(fig.rating).toFixed(1)}</strong> from ${fig.count} Google reviews</p>\n`
    : '';

  let body;
  if (n) {
    body = `${I(8)}<div class="c2-says__carousel">
${I(10)}<ul class="c2-quotes" id="${id}" tabindex="0" role="list" aria-label="Reviews of ${esc(loc.name)}, scrollable">
${data.reviews.map((v, i) => card(v, i, loc.photos)).join('\n')}
${I(10)}</ul>
${n > 1 ? `${I(10)}<div class="c2-says__nav">
${I(12)}<button class="c2-says__prev" type="button" data-c2-quotes-prev aria-label="Show the previous review" aria-controls="${id}">
${I(14)}${ARROW_L}
${I(12)}</button>
${I(12)}<button class="c2-says__next" type="button" data-c2-quotes-next aria-label="Show the next review" aria-controls="${id}">
${I(14)}${ARROW_R}
${I(12)}</button>
${I(10)}</div>\n` : ''}${I(8)}</div>\n`;
  } else {
    /* No reviews to show yet: say so plainly rather than leave a hole. */
    body = `${I(8)}<div class="c2-says__empty">
${I(10)}<p class="c2-says__empty-title">${data.allUrl ? 'Reviews for this location are on Google' : 'Our newest location'}</p>
${I(10)}<p>${data.allUrl
      ? `Our ${esc(loc.name)} building has its own Google listing. Read what families there have to say below.`
      : `${esc(loc.name)} is our newest location. Read what families say about our other locations.`}</p>
${I(8)}</div>\n`;
  }

  return `${I(6)}<div class="c2-says__panel" id="c2-says-panel-${loc.id}" role="tabpanel" aria-labelledby="c2-says-tab-${loc.id}">
${score}${body}${all}${I(6)}</div>`;
}

/* The short label for a phone, where three full addresses will not fit
 * on one row: "591 3rd Ave", "69 16th St". */
const abbr = name => name.replace(/ Avenue$/, ' Ave').replace(/ Street$/, ' St');

function section(results) {
  const tabs = results.map(({ loc }, i) =>
    `${I(8)}<button class="c2-tab" type="button" role="tab"
${I(16)}id="c2-says-tab-${loc.id}" aria-controls="c2-says-panel-${loc.id}" aria-selected="${i ? 'false' : 'true'}"><span class="c2-tab__full">${esc(loc.name)}</span><span class="c2-tab__abbr">${esc(abbr(loc.name))}</span></button>`
  ).join('\n');

  return `${I(6)}<!-- REVIEWS:START, generated by tools/fetch-reviews.js from
${I(11)}content/reviews.json (and live Google data at build time, where
${I(11)}configured). Edit the JSON and run: node tools/fetch-reviews.js --src
${I(11)}Do not hand-edit between the markers; it is overwritten. -->
${I(6)}<div class="c2-tabs c2-says__tabs" role="tablist" aria-label="Reviews by location" data-c2-tablist>
${tabs}
${I(6)}</div>

${results.map(({ loc, data }, i) => panel(loc, data, i === 0)).join('\n\n')}
${I(6)}<!-- REVIEWS:END -->`;
}

/* ── one location's reviews (program pages) ──────────────────────────
 * Compact cards, three to a row, for a single listing: its rating at the
 * top, then the cards in a scrolling row with arrows, then the link to the
 * listing. A page asks for it with
 *   <!-- REVIEWS-ONE:START loc=3rd --> ... <!-- REVIEWS-ONE:END -->
 */
const GOOGLE_G = '<svg class="pg-rv__g" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"/></svg>';

function sectionOne(loc, data) {
  const fig = typeof data.rating === 'number' && data.count ? data : (loc.listing || {});
  const id = 'pg-rv-' + loc.id;
  const stars = n => Array.from({ length: Math.round(n) }, () => STAR).join('');
  const score = typeof fig.rating === 'number' && fig.count
    ? `${I(6)}<p class="pg-rv__score"><strong>${Number(fig.rating).toFixed(1)}</strong><span class="pg-rv__stars" role="img" aria-label="Rated ${Number(fig.rating).toFixed(1)} out of 5">${stars(fig.rating)}</span><span>${fig.count} Google reviews</span>${GOOGLE_G}</p>\n`
    : '';
  const cards = data.reviews.map(v => [
    `${I(10)}<li class="pg-rv__card">`,
    `${I(12)}<div class="pg-rv__top">`,
    `${I(14)}<span class="c2-quote__avatar" aria-hidden="true">${esc(initials(v.name))}</span>`,
    `${I(14)}<span class="pg-rv__who"><cite>${esc(v.name)}</cite>${v.when ? `<span>${esc(v.when)}</span>` : ''}</span>`,
    `${I(14)}${GOOGLE_G}`,
    `${I(12)}</div>`,
    `${I(12)}<p class="pg-rv__stars" role="img" aria-label="Rated ${Math.round(v.rating)} out of 5">${stars(v.rating)}</p>`,
    `${I(12)}<p class="pg-rv__text">${typo(v.text.replace(/\s+/g, ' ').trim())}</p>`,
    `${I(10)}</li>`,
  ].join('\n')).join('\n');
  const leave = loc.reviewUrl
    ? `\n${I(8)}<a class="c2-btn c2-btn--outline" href="${esc(loc.reviewUrl)}" target="_blank" rel="noopener">Leave us a review</a>`
    : '';
  return [
    `${I(6)}<!-- REVIEWS-ONE:START loc=${loc.id}, generated by tools/fetch-reviews.js from`,
    `${I(11)}content/reviews.json. Edit the JSON and run: node tools/fetch-reviews.js --src -->`,
    `${score}${I(6)}<div class="pg-rv${data.reviews.length <= 3 ? ' pg-rv--few' : ''}">`,
    `${I(8)}<ul class="pg-rv__track" id="${id}" tabindex="0" role="list" aria-label="Reviews of ${esc(loc.name)}, scrollable">`,
    cards,
    `${I(8)}</ul>`,
    `${I(8)}<div class="pg-rv__nav">`,
    `${I(10)}<button type="button" data-pg-rv-prev aria-label="Show earlier reviews" aria-controls="${id}">${ARROW_L}</button>`,
    `${I(10)}<button type="button" data-pg-rv-next aria-label="Show more reviews" aria-controls="${id}">${ARROW_R}</button>`,
    `${I(8)}</div>`,
    `${I(6)}</div>`,
    `${I(6)}<p class="pg-rv__actions">`,
    `${I(8)}<a class="c2-btn c2-btn--green" href="${esc(data.allUrl || loc.allUrl)}" target="_blank" rel="noopener">Read more reviews on Google</a>${leave}`,
    `${I(6)}</p>`,
    `${I(6)}<!-- REVIEWS-ONE:END -->`,
  ].join('\n');
}

/* ── every location's reviews, in the program-page design ───────────
 * The general pages (For Families, Admissions, Tuition, Contact) cover all
 * three buildings, so they carry the same compact cards behind a tab per
 * listing, in content/reviews.json order (the first is open). Asked for with
 *   <!-- REVIEWS-ONE:START loc=all --> ... <!-- REVIEWS-ONE:END -->
 */
function sectionAll(results) {
  const tabs = results.map(({ loc }, i) =>
    `${I(8)}<button class="c2-tab" type="button" role="tab" id="pg-rv-tab-${loc.id}" aria-controls="pg-rv-panel-${loc.id}" aria-selected="${i ? 'false' : 'true'}"><span class="c2-tab__full">${esc(loc.name)}</span><span class="c2-tab__abbr">${esc(abbr(loc.name))}</span></button>`
  ).join('\n');
  /* each panel is the single-location section without its markers */
  const panels = results.map(({ loc, data }) => [
    `${I(6)}<div class="pg-rv__panel" id="pg-rv-panel-${loc.id}" role="tabpanel" aria-labelledby="pg-rv-tab-${loc.id}">`,
    sectionOne(loc, data).split('\n').slice(2, -1).join('\n'),
    `${I(6)}</div>`,
  ].join('\n')).join('\n');
  return [
    `${I(6)}<!-- REVIEWS-ONE:START loc=all, generated by tools/fetch-reviews.js from`,
    `${I(11)}content/reviews.json. Edit the JSON and run: node tools/fetch-reviews.js --src -->`,
    `${I(6)}<div class="c2-tabs pg-rv__tabs" role="tablist" aria-label="Reviews by location" data-c2-tablist>`,
    tabs,
    `${I(6)}</div>`,
    panels,
    `${I(6)}<!-- REVIEWS-ONE:END -->`,
  ].join('\n');
}


/* ── the footer rating ───────────────────────────────────────────── */

function pages(root) {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push(p);
    }
  })(root);
  return out;
}

/* The footer line on every page, and the schema that mirrors it: every
 * location's listing together, weighted by review count. */
function writeRating(rating, count) {
  const shown = (Math.round(Number(rating) * 10) / 10).toFixed(1);
  let touched = 0;
  for (const p of pages(DIST)) {
    const s = fs.readFileSync(p, 'utf8');
    let out = s.replace(
      /(aria-label=")[\d.]+ from \d+ Google reviews, read them/,
      `$1${shown} from ${count} Google reviews, read them`);
    out = out.replace(/(\n\s*)[\d.]+ <span>from \d+ Google reviews<\/span>/,
      `$1${shown} <span>from ${count} Google reviews</span>`);

    /* aggregateRating is only legitimate because the same two numbers are
     * printed in the footer of the very page carrying the markup. It comes
     * from the live response and is never hand-typed.
     *
     * Replaced when already present, inserted only when not, so a second
     * run over the same dist cannot duplicate it. */
    const agg = `"aggregateRating": { "@type": "AggregateRating", "ratingValue": "${shown}", "reviewCount": "${count}", "bestRating": "5" },`;
    if (/"aggregateRating":\s*\{[^}]*\},/.test(out))
      out = out.replace(/"aggregateRating":\s*\{[^}]*\},/, agg);
    else
      out = out.replace(/("email": "[^"]*",)/, m => `${m}\n  ${agg}`);

    if (out !== s) { fs.writeFileSync(p, out); touched++; }
  }
  return touched;
}

/* ── main ───────────────────────────────────────────────────────── */

const showable = list => list
  .filter(v => v.rating >= MIN_RATING)
  .filter(v => v.text && v.text.trim().length >= MIN_CHARS);

async function resolve(loc) {
  const curated = (loc.reviews || []).map(v => ({
    ...v, google: v.source === 'google', url: v.url || loc.allUrl,
  }));
  const fallback = { allUrl: loc.allUrl, reviews: curated.slice(0, MAX_CARDS), source: 'curated' };

  const live = SRC_MODE ? null : liveSource(loc);
  if (!live) return fallback;

  try {
    const d = await FETCH[live.source](loc, live.id);
    const usable = showable(d.reviews);
    /* A live source that returns few long reviews (Places caps at five) is
     * topped up from the curated ones rather than left thin. */
    const seen = new Set(usable.map(v => v.name.toLowerCase()));
    const reviews = usable.concat(curated.filter(v => !seen.has(v.name.toLowerCase()))).slice(0, MAX_CARDS);
    console.log(`reviews: ${loc.name}: ${live.source}, ${d.reviews.length} fetched, ${usable.length} long enough to show` +
                (d.count ? ` (${d.count} ratings, ${d.rating} average)` : ''));
    return { ...d, reviews, source: live.source };
  } catch (e) {
    /* A failed call must not fail the build or blank the tab. */
    console.log(`reviews: ${loc.name}: ${live.source} failed (${e.message}), using curated`);
    return fallback;
  }
}

(async () => {
  const cfg = JSON.parse(fs.readFileSync('content/reviews.json', 'utf8'));
  const results = [];
  for (const loc of cfg.locations) results.push({ loc, data: await resolve(loc) });

  const targets = SRC_MODE
    ? [{ file: SRC_PARTIAL, root: '{{ROOT}}' }]
    : pages(DIST).filter(f => fs.readFileSync(f, 'utf8').includes('<!-- REVIEWS:START'))
        .map(f => ({ file: f, root: '../'.repeat(path.relative(DIST, f).split(path.sep).length - 1) }));
  if (!targets.length) { console.log('reviews: no page carries the REVIEWS markers, nothing replaced'); return; }

  for (const t of targets) {
    ROOT = t.root;
    const html = fs.readFileSync(t.file, 'utf8');
    const start = html.indexOf('<!-- REVIEWS:START');
    const endTag = '<!-- REVIEWS:END -->';
    const end = html.indexOf(endTag);
    if (start < 0 || end < 0) { console.log('reviews: markers incomplete in ' + t.file); continue; }
    const open = html.lastIndexOf('\n', start) + 1;
    fs.writeFileSync(t.file, html.slice(0, open) + section(results) + html.slice(end + endTag.length));
    console.log('reviews: written into ' + path.relative('.', t.file));
  }

  /* single-location sections, in src (program pages) or dist */
  const onePages = SRC_MODE ? pages('src').filter(p => !p.includes('_partials')) : pages(DIST);
  for (const p of onePages) {
    let html = fs.readFileSync(p, 'utf8');
    if (!html.includes('<!-- REVIEWS-ONE:START')) continue;
    html = html.replace(/[ \t]*<!-- REVIEWS-ONE:START loc=([\w-]+)[\s\S]*?<!-- REVIEWS-ONE:END -->/g, (m, id) => {
      if (id === 'all') return sectionAll(results);
      const r = results.find(x => x.loc.id === id);
      if (!r) { console.log('reviews: unknown location ' + id + ' in ' + p); return m; }
      return sectionOne(r.loc, r.data);
    });
    fs.writeFileSync(p, html);
    console.log('reviews: single-location section written into ' + path.relative('.', p));
  }

  for (const { loc, data } of results)
    console.log(`reviews: ${loc.name}: ${data.reviews.length} cards (${data.source})`);

  /* The footer figure covers every location. It is rewritten from live data
   * only when every location has a live rating; otherwise the footer keeps
   * the combined figure typed into src/_partials/footer.html. */
  const allLive = results.every(r => typeof r.data.rating === 'number' && r.data.count);
  if (!SRC_MODE && allLive) {
    const count = results.reduce((n, r) => n + r.data.count, 0);
    const rating = results.reduce((n, r) => n + r.data.rating * r.data.count, 0) / count;
    console.log('reviews: rating written into ' + writeRating(rating, count) + ' pages');
  }
})();
