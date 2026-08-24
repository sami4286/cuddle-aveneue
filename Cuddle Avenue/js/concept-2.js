/* Concept 2 — scroll-snap carousels + locations tabs. */

/* ── carousels ───────────────────────────────────────────────────────
   Each track is a natively scrollable / swipeable scroll-snap flexbox; the
   buttons are only a convenience layer, so if JS never runs the section still
   works as an ordinary horizontal scroller. */
(function () {
  'use strict';

  function wire(trackId, prevSel, nextSel) {
    var track = document.getElementById(trackId);
    if (!track) return;

    var prev = document.querySelector(prevSel);
    var next = document.querySelector(nextSel);
    if (!prev || !next) return;

    /* One slide plus its gap, measured from the live layout so the step stays
       correct across every breakpoint. */
    function step() {
      var slides = track.children;
      if (slides.length < 2) return track.clientWidth;
      return Math.round(slides[1].getBoundingClientRect().left -
                        slides[0].getBoundingClientRect().left);
    }

    function scrollBy(delta) {
      track.scrollBy({ left: delta, behavior: 'smooth' });
    }

    function sync() {
      var x = Math.round(track.scrollLeft);
      var max = Math.round(track.scrollWidth - track.clientWidth);
      prev.disabled = x <= 1;
      next.disabled = x >= max - 1 || max <= 0;
    }

    prev.addEventListener('click', function () { scrollBy(-step()); });
    next.addEventListener('click', function () { scrollBy(step()); });

    /* Arrow keys once the track itself has focus. */
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); scrollBy(step()); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollBy(-step()); }
    });

    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { sync(); ticking = false; });
    }, { passive: true });

    if ('ResizeObserver' in window) new ResizeObserver(sync).observe(track);
    window.addEventListener('resize', sync);

    sync();
  }

  wire('c2-track',  '[data-c2-prev]',        '[data-c2-next]');
  wire('c2-quotes', '[data-c2-quotes-prev]', '[data-c2-quotes-next]');
})();

/* ── locations tabs ──────────────────────────────────────────────────
   Hiding the inactive panels is JS's job, not the markup's: with no JS every
   location stays on the page instead of becoming unreachable. */
(function () {
  'use strict';

  var list = document.querySelector('[data-c2-tablist]');
  if (!list) return;

  var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
  if (!tabs.length) return;

  var panels = tabs.map(function (t) {
    return document.getElementById(t.getAttribute('aria-controls'));
  });
  if (panels.indexOf(null) !== -1) return;

  function select(i, moveFocus) {
    tabs.forEach(function (tab, n) {
      var on = n === i;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      panels[n].hidden = !on;
    });
    if (moveFocus) tabs[i].focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(i); });

    tab.addEventListener('keydown', function (e) {
      var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (e.key === 'Home') { e.preventDefault(); return select(0, true); }
      if (e.key === 'End')  { e.preventDefault(); return select(tabs.length - 1, true); }
      if (!step) return;
      e.preventDefault();
      select((i + step + tabs.length) % tabs.length, true);
    });
  });

  select(0);
})();

/* ── motion: reveal on scroll + parallax ─────────────────────────────
   Positions are measured once into document space, then every scroll frame is
   pure arithmetic — no layout reads while scrolling.

   Reveal is threshold-based rather than IntersectionObserver-based on purpose:
   an anchor jump or a fast flick can carry an element from below the fold to
   above it without IO ever reporting it as intersecting, which would leave it
   stranded at opacity 0. Comparing against a scroll position cannot skip. */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* [selector, variant, stagger step ms] */
  var REVEAL = [
    ['.c2-hero__title',                   'c2-reveal--left', 0],
    ['.c2-hero__aside > *',               '',                90],
    ['.c2-hero__cards .c2-card',          'c2-reveal--zoom', 110],
    ['.c2-head--center > *',              '',                80],
    ['.c2-prog',                          '',                110],
    ['.c2-sec__actions',                  '',                0],
    ['.c2-cta__card',                     'c2-reveal--zoom', 0],
    ['.c2-fac__head, .c2-fac__lead',      '',                80],
    ['.c2-fac__media',                    'c2-reveal--zoom', 0],
    ['.c2-acc',                           '',                70],
    ['.c2-curric__head > *',              '',                80],
    ['.c2-ccard',                         '',                90],
    ['.c2-curric__actions',               '',                0],
    ['.c2-loc__head > *',                 '',                80],
    ['.c2-says__title',                   '',                0],
    ['.c2-quote__card, .c2-quote__media', '',                90],
    ['.c2-join__left > *',                '',                90],
    ['.c2-join__right > *',               '',                90],
    ['.c2-footer__grid > *',              '',                70]
  ];

  /* [selector, peak offset px across a full pass; negative = against scroll] */
  var PARALLAX = [
    ['.c2-swoosh',                   -46],
    ['.c2-join__arcs',               -34],
    ['.c2-hero__cards .c2-card img',  34],
    ['.c2-cta__media img',            46],
    ['.c2-fac__media img',            30],
    ['.c2-loc__media img',            30],
    ['.c2-quote__media img',          24]
  ];

  var reveals = [];
  REVEAL.forEach(function (g) {
    Array.prototype.forEach.call(document.querySelectorAll(g[0]), function (el, i) {
      el.classList.add('c2-reveal');
      if (g[1]) el.classList.add(g[1]);
      if (g[2]) el.style.setProperty('--c2-delay', (i % 4) * g[2] + 'ms');
      reveals.push({ el: el, top: 0, done: false });
    });
  });

  var plx = [];
  PARALLAX.forEach(function (p) {
    Array.prototype.forEach.call(document.querySelectorAll(p[0]), function (el) {
      var isImg = el.tagName === 'IMG';
      el.classList.add(isImg ? 'c2-plx-img' : 'c2-plx');
      plx.push({ el: el, k: p[1], img: isImg, mid: 0, h: 0 });
    });
  });

  if (!reveals.length && !plx.length) return;

  var vh = window.innerHeight;

  function measure() {
    vh = window.innerHeight;
    var y = window.pageYOffset;
    reveals.forEach(function (r) {
      r.top = r.el.getBoundingClientRect().top + y;
    });
    plx.forEach(function (it) {
      var r = it.el.getBoundingClientRect();
      it.h = r.height;
      it.mid = r.top + y + r.height / 2;
    });
    frame();
  }

  function frame() {
    var y = window.pageYOffset;

    /* reveal everything whose top has passed 88% of the viewport, including
       anything already scrolled past */
    var line = y + vh * 0.88;
    for (var i = 0; i < reveals.length; i++) {
      var r = reveals[i];
      if (r.done || r.top > line) continue;
      r.done = true;
      r.el.classList.add('is-in');
    }

    /* parallax */
    var eye = y + vh / 2;
    for (var j = 0; j < plx.length; j++) {
      var it = plx[j];
      var span = vh / 2 + it.h / 2;
      var p = (eye - it.mid) / span;          /* -1 below the fold … +1 above */
      if (p < -1.25 || p > 1.25) continue;
      var off = (p * it.k).toFixed(2);
      it.el.style.transform = it.img
        ? 'translate3d(0,' + off + 'px,0) scale(1.12)'
        : 'translate3d(0,' + off + 'px,0)';
    }
  }

  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { frame(); queued = false; });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);

  /* images settle late and change the page height, so re-measure once loaded */
  measure();
  window.addEventListener('load', measure);
})();
