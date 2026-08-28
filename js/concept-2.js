/* Concept 2 — motion policy, scroll-snap carousels, locations tabs,
   scroll reveal and parallax. */

/* ── motion policy ───────────────────────────────────────────────────
   One decision, made once, published as <html data-motion="on|off">, and
   read by both this file and the stylesheet. Nothing else may test
   prefers-reduced-motion on its own — a single switch is the only way the
   marquee, the reveals, the parallax and the hover transitions can agree.

   "off" is not "no feedback": the stylesheet still runs colour, border and
   shadow transitions under it, because an instant snap reads as a broken
   control rather than as a considered accessibility choice. What "off"
   removes is travel — the marquee, the parallax, the reveal slide and the
   hover lift.

   ?motion=on / ?motion=off overrides the OS setting for the length of the
   visit. Reviewers are often on machines with Windows' "Animation effects"
   switched off — which is a global reduced-motion signal to every browser —
   and would otherwise report the site as broken. The override is also how
   this gets tested from a headless browser, which always reports reduce. */
(function () {
  'use strict';

  var forced = null;
  try {
    var q = new URLSearchParams(window.location.search).get('motion');
    if (q === 'on' || q === 'off') forced = q;
    if (forced) sessionStorage.setItem('c2-motion', forced);
    else forced = sessionStorage.getItem('c2-motion');
  } catch (e) { /* no URLSearchParams, or storage blocked — fall through */ }

  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.setAttribute('data-motion',
    forced ? forced : (reduce ? 'off' : 'on'));
})();

/* ── current page in the nav ─────────────────────────────────────────
   One header partial serves every page, so aria-current cannot be written
   into the markup. Each nav link is matched on its top-level section:
   programs/infant-care.html and programs.html both light "Programs". */
(function () {
  'use strict';

  function section(path) {
    var parts = path.split('/').filter(Boolean);
    var last = (parts.pop() || 'index').replace(/\.html$/, '');
    /* a page one level down belongs to the folder above it */
    return parts.length ? parts[parts.length - 1] : last;
  }

  var here = section(window.location.pathname);

  Array.prototype.forEach.call(
    document.querySelectorAll('.c2-nav a, .c2-menu__panel a'),
    function (link) {
      var href = link.getAttribute('href') || '';
      if (/^(https?:|mailto:|tel:|#)/.test(href)) return;
      if (section(href.replace(/^(\.\.\/)+/, '')) === here) {
        link.setAttribute('aria-current', 'page');
      }
    }
  );
})();

/* ── sticky header ───────────────────────────────────────────────────
   The header sticks in CSS; this only publishes its measured height as
   --c2-header-h, which scroll-padding-top uses so an in-page jump never
   lands a heading underneath the bar, and toggles .is-stuck once the
   announcement bar has scrolled away. */
(function () {
  'use strict';

  var header = document.querySelector('.c2-header');
  if (!header) return;

  var root = document.documentElement;

  function publishHeight() {
    root.style.setProperty('--c2-header-h', Math.round(header.offsetHeight) + 'px');
  }

  /* the trigger is the header's own distance from the top of the document,
     which is exactly the height of whatever sits above it */
  var trigger = header.getBoundingClientRect().top + window.pageYOffset;

  var stuck = false;
  function sync() {
    var on = window.pageYOffset > trigger + 4;
    if (on === stuck) return;
    stuck = on;
    header.classList.toggle('is-stuck', on);
  }

  /* sync reads one already-cached scroll offset and toggles a class only
     when the state actually changes, so it is cheap enough to run straight
     off the scroll event — no rAF queue to keep in sync */
  window.addEventListener('scroll', sync, { passive: true });

  window.addEventListener('resize', function () {
    publishHeight();
    /* the header is sticky, so once it is stuck its own rect is useless for
       re-measuring the trigger — add back how far the page has scrolled */
    if (!stuck) trigger = header.getBoundingClientRect().top + window.pageYOffset;
  });

  if ('ResizeObserver' in window) new ResizeObserver(publishHeight).observe(header);
  publishHeight();
  sync();
})();

/* ── tour video ──────────────────────────────────────────────────────
   The band plays its virtual tour when it scrolls into view and pauses it
   again on the way out, so nothing decodes off-screen.

   The <video> is built here rather than in the markup because there is no
   file yet: the section names one in data-c2-tour-video, and with that
   attribute empty this module does nothing at all and the band keeps the
   photograph it has always had. Drop the file in, name it, and autoplay
   starts working — no other change.

   Autoplay only ever happens muted (every browser blocks it otherwise) and
   never under data-motion="off"; in both cases the control below still
   starts it by hand, and a pause by hand is remembered — the observer will
   not restart what a person deliberately stopped. */
(function () {
  'use strict';

  var band = document.querySelector('[data-c2-tour-video]');
  if (!band) return;

  var src = band.getAttribute('data-c2-tour-video');
  if (!src) return;

  var media = band.querySelector('.c2-cta__media');
  var still = media && media.querySelector('img');
  if (!media) return;

  var video = document.createElement('video');
  video.className = 'c2-cta__video-el';
  video.src = src;
  video.muted = true;              /* property, not attribute: Safari reads this one */
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  if (still) video.poster = still.currentSrc || still.src;
  /* decorative here: the same tour is offered as a real link beside it */
  video.setAttribute('aria-hidden', 'true');
  video.tabIndex = -1;
  media.appendChild(video);

  var ICON = {
    play:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5h3.2v13H8zM12.8 5.5H16v13h-3.2z"/></svg>'
  };

  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'c2-cta__toggle';
  band.querySelector('.c2-cta__card').appendChild(toggle);

  var userPaused = false;

  function paint() {
    var playing = !video.paused && !video.ended;
    toggle.innerHTML = (playing ? ICON.pause : ICON.play) +
      '<span>' + (playing ? 'Pause tour' : 'Play tour') + '</span>';
    toggle.setAttribute('aria-label',
      playing ? 'Pause the center tour video' : 'Play the center tour video');
    video.classList.toggle('is-playing', playing);
  }

  function start() {
    var p = video.play();
    /* a blocked autoplay rejects rather than throwing — the poster stays,
       and the control is left saying "Play tour" */
    if (p && p.catch) p.catch(function () { paint(); });
  }

  toggle.addEventListener('click', function () {
    if (video.paused) { userPaused = false; start(); }
    else { userPaused = true; video.pause(); }
  });

  video.addEventListener('play',  paint);
  video.addEventListener('pause', paint);
  paint();

  var autoplayAllowed = document.documentElement.getAttribute('data-motion') === 'on';

  if (!('IntersectionObserver' in window)) {
    if (autoplayAllowed) start();
    return;
  }

  new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        if (autoplayAllowed && !userPaused) start();
      } else if (!video.paused) {
        video.pause();
      }
    });
  }, { threshold: 0.35 }).observe(band);
})();

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

/* ── tab groups ──────────────────────────────────────────────────────
   Every [data-c2-tablist] on the page is wired independently — the three
   Brooklyn locations, and the five days of the week on the menu.

   Hiding the inactive panels is JS's job, not the markup's: with no JS
   every location and every day stays on the page in full instead of
   becoming unreachable. */
(function () {
  'use strict';

  Array.prototype.forEach.call(document.querySelectorAll('[data-c2-tablist]'), wire);

  function wire(list) {
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

    /* data-c2-tab-today opens the tab for the current weekday — the menu
       should show a parent what their child is eating today, not Monday.
       Saturday and Sunday fall back to Monday. */
    var initial = 0;
    if (list.hasAttribute('data-c2-tab-today')) {
      var weekday = new Date().getDay() - 1;          /* Mon 0 … Fri 4 */
      if (weekday >= 0 && weekday < tabs.length) initial = weekday;
    }
    select(initial);
  }
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

  /* the single motion switch set at the top of this file */
  if (document.documentElement.getAttribute('data-motion') !== 'on') return;

  /* [selector, variant, stagger step ms] */
  var REVEAL = [
    ['.c2-hero__title',                   'c2-reveal--left', 0],
    ['.c2-hero__aside > *',               '',                90],
    ['.c2-hero__cards .c2-card',          'c2-reveal--zoom', 110],
    ['.c2-head--center > *',              '',                80],
    ['.c2-prog',                          '',                110],
    ['.c2-sec__actions',                  '',                0],
    ['.c2-cta__card',                     'c2-reveal--zoom', 0],
    ['.ca-welcome__body > *',             '',                80],
    ['.ca-welcome__media',                'c2-reveal--zoom', 0],
    ['.ca-why__item',                     '',                70],
    ['.ca-safety__media',                 'c2-reveal--zoom', 0],
    /* the list is skipped here and its rows are staggered instead, so a row
       never fades inside an element that is itself still fading */
    ['.ca-safety__body > :not(.ca-safety__list)', '',         70],
    ['.ca-safety__list li',               '',                40],
    ['.c2-curric__head > *',              '',                80],
    ['.c2-ccard',                         '',                90],
    ['.c2-curric__actions',               '',                0],
    ['.ca-meals__head > *',               '',                80],
    ['.ca-meals__word',                   '',                70],
    ['.ca-meals__list li',                '',                40],
    ['.c2-loc__head > *',                 '',                80],
    /* panels 2 and 3 start hidden, so they measure at top 0 and arrive
       already revealed — a tab switch shows content, never a blank box */
    ['.c2-loc__media',                    'c2-reveal--zoom', 0],
    ['.c2-loc__card',                     '',                120],
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
    ['.ca-welcome__media img',        30],
    ['.ca-safety__media img',         26],
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
