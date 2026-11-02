/* Concept 2, motion policy, scroll-snap carousels, locations tabs,
   scroll reveal and parallax. */

/* ── motion policy ───────────────────────────────────────────────────
   One decision, made once, published as <html data-motion="on|off">, and
   read by both this file and the stylesheet. Nothing else may test
   prefers-reduced-motion on its own, a single switch is the only way the
   marquee, the reveals, the parallax and the hover transitions can agree.

   "off" is not "no feedback": the stylesheet still runs colour, border and
   shadow transitions under it, because an instant snap reads as a broken
   control rather than as a considered accessibility choice. What "off"
   removes is travel, the marquee, the parallax, the reveal slide and the
   hover lift.

   ?motion=on / ?motion=off overrides the OS setting for the length of the
   visit. Reviewers are often on machines with Windows' "Animation effects"
   switched off, which is a global reduced-motion signal to every browser, 
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
  } catch (e) { /* no URLSearchParams, or storage blocked, fall through */ }

  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.setAttribute('data-motion',
    forced ? forced : (reduce ? 'off' : 'on'));
})();

/* ── current page in the nav ─────────────────────────────────────────
   One header partial serves every page, so aria-current cannot be written
   into the markup. Each nav link is matched on its top-level section:
   programs/infant-care.html and the rest of programs/ light "Programs". */
(function () {
  'use strict';

  function section(path) {
    var parts = path.split('/').filter(Boolean);
    var last = (parts.pop() || 'index').replace(/\.html$/, '');
    /* a page one level down belongs to the folder above it */
    return parts.length ? parts[parts.length - 1] : last;
  }

  var here = section(window.location.pathname);

  /* the file name alone, for the exact match inside a dropdown */
  function page(path) {
    return (path.split('/').pop() || 'index.html').replace(/[?#].*$/, '') || 'index.html';
  }
  var herePage = page(window.location.pathname);

  /* Top-level items mark the section they belong to. That is a visual
     state, not aria-current: the section link is usually not the page
     you are actually on, and saying otherwise would mislead a screen
     reader. Only an exact page match gets aria-current="page", so at
     most one link in the header ever claims it. */
  Array.prototype.forEach.call(
    document.querySelectorAll('.c2-nav__item > a'),
    function (link) {
      var href = link.getAttribute('href') || '';
      if (/^(https?:|mailto:|tel:|#)/.test(href)) return;
      /* "Programs" points at the homepage's programs section, but it is the
         section of the program pages, not of the homepage */
      var sec = /#programs$/.test(href) ? 'programs' : section(href.replace(/^(\.\.\/)+/, ''));
      if (sec === here) {
        link.classList.add('is-section');
      }
    }
  );

  Array.prototype.forEach.call(
    document.querySelectorAll('.c2-nav__item > a, .c2-nav__drop a, .c2-menu__panel a'),
    function (link) {
      var href = link.getAttribute('href') || '';
      if (/^(https?:|mailto:|tel:)/.test(href) || href.indexOf('#') > -1) return;
      if (page(href) === herePage) link.setAttribute('aria-current', 'page');
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

  var announce = document.querySelector('.c2-announce');

  function publishHeight() {
    root.style.setProperty('--c2-header-h', Math.round(header.offsetHeight) + 'px');

    /* what is actually on screen when the page opens: the announcement
       bar, which scrolls away, plus the header, which does not. The hero
       sizes itself against this so it ends exactly at the fold. */
    var chrome = header.offsetHeight + (announce ? announce.offsetHeight : 0);
    root.style.setProperty('--c2-chrome-h', Math.round(chrome) + 'px');
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
     off the scroll event, no rAF queue to keep in sync */
  window.addEventListener('scroll', sync, { passive: true });

  window.addEventListener('resize', function () {
    publishHeight();
    /* the header is sticky, so once it is stuck its own rect is useless for
       re-measuring the trigger, add back how far the page has scrolled */
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
   starts working, no other change.

   Autoplay only ever happens muted (every browser blocks it otherwise) and
   never under data-motion="off"; in both cases the control below still
   starts it by hand, and a pause by hand is remembered, the observer will
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
    /* a blocked autoplay rejects rather than throwing, the poster stays,
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

  /* The buttons are looked up inside `scope`, the review tabs carry one
     carousel each, so a page-wide lookup would wire every pair of arrows
     to the first track. */
  function wire(track, prevSel, nextSel, scope) {
    if (typeof track === 'string') track = document.getElementById(track);
    if (!track) return;

    var prev = (scope || document).querySelector(prevSel);
    var next = (scope || document).querySelector(nextSel);
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
  Array.prototype.forEach.call(document.querySelectorAll('.c2-says__carousel'), function (box) {
    wire(box.querySelector('.c2-quotes'), '[data-c2-quotes-prev]', '[data-c2-quotes-next]', box);
  });
  wire('c2-gallery','[data-c2-gallery-prev]','[data-c2-gallery-next]');
  /* enrichment cards past six slide, three at a time */
  Array.prototype.forEach.call(document.querySelectorAll('.pg-ien__slider'), function (box) {
    wire(box.querySelector('.pg-ien__grid'), '[data-pg-ien-prev]', '[data-pg-ien-next]', box);
  });
  /* one location's review cards on the program pages */
  Array.prototype.forEach.call(document.querySelectorAll('.pg-rv'), function (box) {
    wire(box.querySelector('.pg-rv__track'), '[data-pg-rv-prev]', '[data-pg-rv-next]', box);
  });
  /* program cards: a slider on a phone, a grid above that (where the
     arrows are hidden and simply sit disabled) */
  Array.prototype.forEach.call(document.querySelectorAll('.sx-pcards'), function (track) {
    wire(track, '[data-c2-pcards-prev]', '[data-c2-pcards-next]', track.parentElement);
  });
})();

/* ── program age selector ────────────────────────────────────────────
   On a phone the program cards are a slider; this row of ages sits above
   it. Tapping an age scrolls the slider to that program's card, and as
   the slider moves the highlight follows whichever card is in view, so
   the row also says where you are. On wider screens it is hidden. */
(function () {
  'use strict';

  Array.prototype.forEach.call(document.querySelectorAll('[data-c2-agepick]'), function (pick) {
    var track = document.getElementById(pick.getAttribute('data-c2-agepick'));
    if (!track) return;
    var buttons = Array.prototype.slice.call(pick.querySelectorAll('button'));
    var cards = Array.prototype.slice.call(track.children);
    if (buttons.length !== cards.length) return;

    function edge() { return parseFloat(getComputedStyle(track).paddingLeft) || 0; }

    function mark(i) {
      buttons.forEach(function (b, n) { b.setAttribute('aria-pressed', n === i ? 'true' : 'false'); });
    }

    buttons.forEach(function (b, i) {
      b.addEventListener('click', function () {
        var delta = cards[i].getBoundingClientRect().left - track.getBoundingClientRect().left - edge();
        track.scrollBy({ left: delta, behavior: 'smooth' });
        mark(i);
      });
    });

    /* the card whose left edge is nearest the slider's start is the current one */
    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var start = track.getBoundingClientRect().left + edge(), best = 0, dist = Infinity;
        cards.forEach(function (c, n) {
          var d = Math.abs(c.getBoundingClientRect().left - start);
          if (d < dist) { dist = d; best = n; }
        });
        mark(best);
        ticking = false;
      });
    }, { passive: true });
  });
})();

/* ── tab groups ──────────────────────────────────────────────────────
   Every [data-c2-tablist] on the page is wired independently, the three
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

    /* data-c2-tab-today opens the tab for the current weekday, the menu
       should show a parent what their child is eating today, not Monday.
       Saturday and Sunday fall back to Monday. */
    var initial = 0;
    if (list.hasAttribute('data-c2-tab-today')) {
      var weekday = new Date().getDay() - 1;          /* Mon 0 … Fri 4 */
      if (weekday >= 0 && weekday < tabs.length) initial = weekday;
    }

    /* <main data-c2-loc="3rd"> opens the locations on that program's own
       building (the tab ids are c2-tab-16th, -3rd, -71). */
    var main = document.querySelector('main[data-c2-loc]');
    if (main && list.closest('#locations')) {
      var mine = tabs.map(function (t) { return t.id; }).indexOf('c2-tab-' + main.getAttribute('data-c2-loc'));
      if (mine !== -1) initial = mine;
    }
    select(initial);
  }
})();

/* ── motion: reveal on scroll + parallax ─────────────────────────────
   Positions are measured once into document space, then every scroll frame is
   pure arithmetic, no layout reads while scrolling.

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
       already revealed, a tab switch shows content, never a blank box */
    ['.c2-loc__media',                    'c2-reveal--zoom', 0],
    ['.c2-loc__card',                     '',                120],
    ['.c2-says__title',                   '',                0],
    ['.c2-quote__card, .c2-quote__media', '',                90],
    ['.c2-join__left > *',                '',                90],
    ['.c2-join__right > *',               '',                90],
    ['.sx-footer__top > *',               '',                70],
    ['.sx-footer__grid > *',              '',                70],

    /* Subpage section archetypes (sections.css). Registered in this list
       rather than given their own module, so every page on the site fades,
       waits and staggers identically, and so a single motion switch still
       turns all of it off. */
    ['.sx-mast__inner > *',               '',                80],
    ['.sx-mast__card > *',                '',                80],
    ['.sx-head > *',                      '',                80],
    ['.sx-ledger__row',                   '',                50],
    ['.sx-step',                          '',                90],
    ['.sx-tile',                          'c2-reveal--zoom', 80],
    ['.sx-bleedband__panel > *',          'c2-reveal--left', 80],
    ['.sx-duo__list li',                  '',                50],
    ['.sx-word__body > *',                '',                80],
    ['.sx-qa details',                    '',                40],
    ['.sx-callout__inner > *',            '',                90],
    ['.sx-hour',                          '',                70],
    ['.sx-panel',                         '',                90],
    ['.sx-quote__body > *',               'c2-reveal--left', 90],
    ['.sx-checklist li',                  '',                45],
    ['.sx-overlap__media',                'c2-reveal--zoom', 0],
    ['.sx-overlap__card',                 '',                120],
    ['.sx-board__day',                    '',                70],
    ['.sx-where__side',                   '',                100],
    ['.sx-doc__body > h2',                '',                60],
    ['.sx-mo',                            'c2-reveal--zoom', 70],
    ['.sx-pair__aside > *',               'c2-reveal--left', 80],
    ['.sx-commit',                        '',                60],
    ['.sx-stat2',                         '',                50],
    ['.sx-strand',                        '',                50],
    ['.sx-flow > li',                     '',                90],
    ['.sx-steps6__head > *',              'c2-reveal--left', 80],
    ['.sx-stepcard',                      '',                70],
    ['.sx-hub__head > *',                 '',                80],
    ['.sx-hub__figure',                   'c2-reveal--zoom', 0],
    ['.sx-hub__col--l .sx-fact',          'c2-reveal--left', 90],
    ['.sx-hub__col--r .sx-fact',          'c2-reveal--right',90],
    ['.sx-pcards > li',                   '',                90],

    /* The program-page components (pg-*) and the homepage's rebuilt why-us
       and meals sections, added 2026-10-31: their headings faded in through
       .sx-head but the cards beneath simply appeared. Clickable cards are
       revealed through their wrapper (the li), because the reveal's own
       transition would otherwise replace their hover transitions; the
       tilted Brightwheel phone is left out, the reveal would flatten it. */
    ['.pg-ihero__inner > *',              '',                80],
    ['.pg-ifeats__card > li',             '',                70],
    ['.pg-reach3 > li',                   '',                90],
    ['.c2-shell > .pg-ihead',             '',                0],
    ['.pg-tiles > li',                    '',                80],
    ['.pg-duo__body > *',                 '',                80],
    ['.pg-duo__photo',                    'c2-reveal--zoom', 0],
    ['.pg-ifeed__photo',                  'c2-reveal--zoom', 0],
    ['.pg-ifeed__body > :not(.pg-ifeed__cards)', '',         80],
    ['.pg-ifeed__cards > li',             '',                70],
    ['.pg-ifeed__band',                   '',                0],
    ['.pg-ffbw__body > :not(.pg-ffbw__feats)', '',           80],
    ['.pg-ffbw__feats > li',              '',                70],
    ['.pg-pack',                          '',                120],
    ['.pg-step3',                         '',                110],
    ['.pg-rates',                         '',                0],
    ['.pg-feepair',                       '',                0],
    ['.pg-aidcard',                       '',                120],
    ['.pg-msg__card',                     '',                0],
    ['.pg-msg__photo',                    'c2-reveal--zoom', 0],
    ['.pg-loc3',                          '',                100],
    ['.pg-enrolled',                      '',                0],
    ['.pg-tl__card',                      '',                60],
    ['.pg-tour',                          '',                100],
    ['.pg-iabout__text > *',              '',                80],
    ['.pg-iabout__collage figure',        'c2-reveal--zoom', 90],
    ['.pg-istages__list > li',            '',                70],
    ['.pg-blob',                          'c2-reveal--zoom', 0],
    ['.pg-tlist > li',                    '',                80],
    ['.pg-sched',                         '',                0],
    ['.pg-ien',                           '',                70],
    ['.pg-path__step',                    '',                90],
    ['.pg-rv__tabs, .pg-rv__score',       '',                60],
    ['.pg-rv__card',                      '',                70],
    ['.ca-why__media',                    'c2-reveal--zoom', 0],
    ['.ca-why__body > :not(.ca-why__list)', '',              80],
    ['.ca-why__row',                      '',                70],
    ['.ca-meals__photo',                  'c2-reveal--zoom', 0],
    ['.ca-meals__tile',                   '',                70],
    ['.ca-meals__card',                   '',                70],
    ['.ca-meals__needs-head',             '',                0]
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
    ['.c2-quote__media img',          24],
    ['.sx-mast--photo .sx-mast__bg img', 30],
    ['.sx-bleedband__bg img',         34],
    ['.sx-quote__bg img',             26]
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


/* ── ribbon marquee ──────────────────────────────────────────────────
   The ribbon loops by translating its track -50%, which is seamless
   only while half the track is at least as wide as the band it runs
   in. The markup ships two copies of the fact list; on any window
   wider than about 850px half of that is narrower than the band, so
   the ribbon runs out of words before it wraps and the tail of the
   loop is empty.

   The number of copies is therefore not a markup decision, it is a
   function of the window. Each track remembers the groups it was
   authored with and is topped up to an even count big enough that half
   of them still covers the band, and it is re-measured when the window
   changes. Every group in a band carries the same words, so any even
   count loops cleanly.

   With no JS the ribbon behaves exactly as it does today: it still
   scrolls, it just shows the gap. Nothing here can strand content.
   ================================================================= */
(function () {
  var tracks = [].slice.call(document.querySelectorAll('.c2-ribbon__track'));
  if (!tracks.length) return;

  tracks.forEach(function (t) {
    t._seed = [].slice.call(t.children).map(function (n) { return n.cloneNode(true); });
  });

  function fit() {
    tracks.forEach(function (t) {
      var seed = t._seed;
      if (!seed || !seed.length) return;
      var band = t.parentElement;
      var need = band.getBoundingClientRect().width;
      if (!need) return;

      /* rebuild from the authored groups each time, so a window that
         narrows again is not left carrying a wider one's copies */
      while (t.firstChild) t.removeChild(t.firstChild);
      seed.forEach(function (n) { t.appendChild(n.cloneNode(true)); });

      var one = t.children[0].getBoundingClientRect().width;
      if (!one) return;

      /* half the track must cover the band: (copies / 2) * one >= need */
      var copies = Math.ceil((2 * need) / one);
      if (copies % 2) copies++;
      if (copies < seed.length) copies = seed.length;
      if (copies > 64) copies = 64;          /* nothing sane needs more */

      for (var i = 0; t.children.length < copies; i++) {
        t.appendChild(seed[i % seed.length].cloneNode(true));
      }
    });
  }

  var timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(fit, 150);
  });

  fit();
  /* the display face lands late and every group gets wider with it */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener('load', fit);
})();


/* ── video lightbox ──────────────────────────────────────────────────
   Every tour film on the site opens in the same overlay rather than in
   place or, worse, by navigating away to a bare .mp4 in the browser's
   own player, which is what the two "Watch the rooms" links used to do,
   and which loses the page.

   One <dialog>, built on first use and reused after that. <dialog> is
   doing real work here: showModal gives the backdrop, the focus trap,
   the inert page behind, and Escape, none of which is worth
   hand-rolling.

   Anything with data-c2-video opens it. On a link the href stays a real
   link to the file, so with scripting off the film is still reachable, 
   this only intercepts the click when it can do better.

   The source is set on open and cleared on close: a <video> left with a
   src keeps buffering, and three of these on one page would have the
   browser pulling several megabytes nobody asked for. */
(function () {
  'use strict';

  var triggers = document.querySelectorAll('[data-c2-video]');
  if (!triggers.length || !window.HTMLDialogElement) return;

  var dialog, video, opener;

  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'c2-lightbox';

    var frame = document.createElement('div');
    frame.className = 'c2-lightbox__frame';

    video = document.createElement('video');
    video.className = 'c2-lightbox__video';
    video.controls = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.preload = 'metadata';

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'c2-lightbox__close';
    close.setAttribute('aria-label', 'Close the video');
    close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2.4" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M6 6l12 12M18 6L6 18"/></svg>';
    close.addEventListener('click', function () { dialog.close(); });

    frame.appendChild(video);
    frame.appendChild(close);
    dialog.appendChild(frame);
    document.body.appendChild(dialog);

    /* the backdrop is the dialog's own box: a click that lands on it
       rather than on the frame inside is a click outside the video */
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', function () {
      video.pause();
      video.removeAttribute('src');
      video.load();                       /* stop the download, not just the playback */
      if (opener && document.contains(opener)) opener.focus();
      opener = null;
    });
  }

  function open(src, poster, from) {
    if (!dialog) build();
    opener = from;
    video.src = src;
    if (poster) video.poster = poster; else video.removeAttribute('poster');
    dialog.showModal();
    var playing = video.play();
    if (playing && playing.catch) playing.catch(function () { /* the controls are there */ });
  }

  Array.prototype.forEach.call(triggers, function (el) {
    el.addEventListener('click', function (e) {
      var src = el.getAttribute('data-c2-video');
      if (!src) return;
      e.preventDefault();
      open(src, el.getAttribute('data-c2-poster'), el);
    });
  });
})();



/* ── analytics events ────────────────────────────────────────────────
   Named events for Google Tag Manager to pick up, so the container
   needs one GA4 event tag and no click-matching rules of its own:

     generate_lead     a form was sent        (form_name)
     book_tour_click   a Calendly link        (link_text)
     phone_click       a tel: link
     email_click       a mailto: link

   Without the GTM snippet this only fills an array nobody reads. */
function track(event, params) {
  window.dataLayer = window.dataLayer || [];
  var o = { event: event };
  for (var k in params) o[k] = params[k];
  window.dataLayer.push(o);
}
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href]');
  if (!a) return;
  var href = a.getAttribute('href');
  var text = (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (/^https:\/\/calendly\.com\//.test(href)) track('book_tour_click', { link_text: text });
  else if (/^tel:/.test(href)) track('phone_click', { link_text: text });
  else if (/^mailto:/.test(href)) track('email_click', { link_text: text });
});

/* ── forms ───────────────────────────────────────────────────────────
   The forms post to /api/inquiry on their own, and that works with
   scripting off: the endpoint redirects back with ?sent=1 and the
   block below reads it. This only improves on that, submit in place,
   keep what was typed if something goes wrong, and never navigate away
   from a half-written message.

   novalidate is on the form so the browser's own bubbles do not fire;
   checkValidity() still runs here, so required and type="email" are
   still enforced, and reportValidity() shows the same messages at the
   same fields. */
(function () {
  'use strict';

  var forms = document.querySelectorAll('.pg-form[action]');
  if (!forms.length) return;

  var SAID = {
    ok:     'Thank you. Your message is on its way, and our team will be in touch by email.',
    config: 'The form is not connected yet. Please call (800) 620-4221 or email customerservice@cuddleavenue.org.',
    fields: 'Please fill in the highlighted fields.',
    send:   'Your message could not be sent. Please check your details and try again, or call (800) 620-4221.',
    net:    'That did not reach us. Please check your connection and try again, or call (800) 620-4221.',
  };

  /* a form that has already been answered once should not be re-posted
     by a refresh, so clear the query the no-script path leaves behind */
  (function () {
    var m = /[?&]sent=([01])/.exec(location.search);
    if (!m) return;
    var form = document.querySelector('.pg-form[action]');
    if (form) show(form, m[1] === '1' ? 'ok' : 'send', m[1] === '1');
    if (form && m[1] === '1') track('generate_lead', { form_name: form.getAttribute('name') || 'website' });
    history.replaceState(null, '', location.pathname + location.hash);
  })();

  /* The relay mails what it is given, under the names it is given. Our
     fields are called parent-name and child-age because that is what
     they are to us and to a browser's autofill, but in an inbox they
     read as machine names, and the relay's own template only lays out
     the three it knows: name, email, message. So the payload is
     rebuilt on the way out.

     The honeypot and the internal form-name do not travel: one is a
     trap and the other is already in the subject line.

     Still a FormData, because multipart is the one encoding that
     crosses to the relay without a preflight. */
  var LABELS = {
    'parent-name':  'name',
    'email':        'email',
    'message':      'message',
    'phone':        'Phone',
    'topic':        'About',
    'child-name':   'Child',
    'child-age':    'Child’s age',
    'child-dob':    'Date of birth',
    'program':      'Program',
    'location':     'Location',
    'schedule':     'Schedule',
    'start-date':   'Preferred start',
    'availability': 'Availability',
    'assistance':   'Assistance',
  };
  var SKIP = { 'company': 1, 'form-name': 1 };

  function relayBody(fields) {
    var out = new FormData();
    /* the relay's own keys first, so its template finds them */
    ['access_key', 'subject', 'from_name'].forEach(function (k) {
      if (fields.get(k)) out.append(k, fields.get(k));
    });
    fields.forEach(function (value, key) {
      if (SKIP[key] || key === 'access_key' || key === 'subject' || key === 'from_name') return;
      if (!String(value).trim()) return;
      out.append(LABELS[key] || key, value);
    });
    /* replying from the inbox should answer the parent */
    if (fields.get('email')) out.append('replyto', fields.get('email'));
    return out;
  }

  function show(form, key, ok, busy) {
    var el = form.querySelector('.pg-form__status');
    if (!el) return;
    el.hidden = false;
    el.className = 'pg-form__status pg-form__status--' +
      (busy ? 'busy' : ok ? 'ok' : 'bad');
    el.textContent = busy ? 'Sending…' : (SAID[key] || SAID.send);
    if (ok && !busy) thanks(form);
  }
  /* Sent: the form gives way to a clear thank-you, with a way back. */
  function thanks(form) {
    var panel = form.querySelector('.pg-form__thanks');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'pg-form__thanks';
      panel.setAttribute('role', 'status');
      panel.innerHTML = '<span class="pg-form__thanks-ico" aria-hidden="true"><svg><use href="#i-check"/></svg></span>' +
        '<h3>Thank you, we have your message</h3>' +
        '<p>Our team will be in touch by email. If it is urgent, call <a href="tel:+18006204221">(800) 620-4221</a>.</p>' +
        '<button class="c2-btn c2-btn--outline" type="button">Send another message</button>';
      panel.querySelector('button').addEventListener('click', function () {
        form.classList.remove('is-sent');
        var st = form.querySelector('.pg-form__status'); if (st) st.hidden = true;
      });
      form.appendChild(panel);
    }
    form.classList.add('is-sent');
    panel.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  Array.prototype.forEach.call(forms, function (form) {
    form.addEventListener('submit', function (e) {
      /* the field checks below (window.CAFormCheck) mark each problem in
         red and focus the first; the browser's own bubbles are the fallback */
      var ok = window.CAFormCheck ? window.CAFormCheck(form) : form.checkValidity();
      if (!ok) {
        e.preventDefault();
        if (!window.CAFormCheck) form.reportValidity();
        show(form, 'fields', false);
        return;
      }
      e.preventDefault();

      var button = form.querySelector('.pg-form__submit');
      if (button && button.getAttribute('aria-disabled') === 'true') return;
      if (button) button.setAttribute('aria-disabled', 'true');
      show(form, null, false, true);

      /* Two targets, and each refuses what the other needs.

         Ours runs on a serverless runtime that parses JSON and
         urlencoded but not multipart, so FormData is out, it arrives
         as nothing and every field reads undefined.

         Web3Forms is the mirror image. It refuses urlencoded, and JSON
         sets a content-type that is not CORS-safelisted, so the browser
         sends a preflight first, which Web3Forms answers 403 with no
         allow headers, and the POST never happens. multipart is
         safelisted, needs no preflight, and is accepted. So FormData,
         with no Content-Type of our own: the browser writes it, boundary
         and all.

         Both of these were found by watching a real submission fail. */
      var relay = form.dataset.relay === 'web3forms';
      var fields = new FormData(form);
      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: relay ? relayBody(fields) : new URLSearchParams(fields),
      })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (d) {
          /* our endpoint answers {ok}, Web3Forms answers {success} */
          if (d && (d.ok || d.success)) {
            track('generate_lead', { form_name: form.getAttribute('name') || 'website' });
            show(form, 'ok', true);
            form.reset();
          } else {
            var bad = window.CAFormCheck && !window.CAFormCheck(form);
            show(form, bad ? 'fields' : (d && d.error) === 'config' ? 'config' : 'send', false);
          }
        })
        .catch(function () { show(form, 'net', false); })
        .then(function () { if (button) button.removeAttribute('aria-disabled'); });
    });
  });
})();

/* ── sticky tour bar (phones) ────────────────────────────────────────
   Shows once the hero's own buttons have scrolled out of view and goes
   away once the closing card is reached (and stays away in the footer),
   so it lives only between the hero and the call to action. Fixed to the
   viewport, so it never moves the page. */
(function () {
  'use strict';
  var bar = document.querySelector('[data-c2-stickycta]');
  if (!bar) return;
  var hero = document.querySelector('.sx-mast__actions, .c2-hero__actions');
  var close = document.querySelector('.c2-join');
  var ticking = false;

  /* Read positions on every scroll rather than waiting for visibility
     changes: a jump straight from the footer back up the page never
     crosses the closing card, so an observer would not report it. */
  function sync() {
    ticking = false;
    var heroGone = hero ? hero.getBoundingClientRect().bottom < 0 : true;
    var reached = close ? close.getBoundingClientRect().top < window.innerHeight : false;
    var on = heroGone && !reached;
    bar.classList.toggle('is-on', on);
    if (on) bar.hidden = false;
  }
  function queue() { if (!ticking) { ticking = true; requestAnimationFrame(sync); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  sync();
})();

/* ── typical day: equal step heights for the sticky stack ────────────
   Each step must be exactly as tall as the tallest, or a taller step
   underneath would show below a shorter one stacked on top of it. Only
   on wide screens, where the steps stick. */
(function () {
  'use strict';
  var lists = document.querySelectorAll('.pg-dayline .pg-tl');
  if (!lists.length) return;
  var mq = window.matchMedia('(min-width: 901px)');
  function size() {
    Array.prototype.forEach.call(lists, function (ol) {
      ol.style.removeProperty('--step-h');
      if (!mq.matches) return;
      var max = 0;
      Array.prototype.forEach.call(ol.children, function (li) { max = Math.max(max, li.offsetHeight); });
      ol.style.setProperty('--step-h', max + 'px');
    });
  }
  size();
  window.addEventListener('resize', size);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);
})();

/* ── the shared form: select this page's "How can we help?" option ── */
(function () {
  'use strict';
  Array.prototype.forEach.call(document.querySelectorAll('.pg-form[data-topic]'), function (form) {
    var want = form.getAttribute('data-topic'), sel = form.querySelector('select[name="topic"]');
    if (!sel || !want) return;
    Array.prototype.forEach.call(sel.options, function (o) {
      if (o.text.replace(/\s+/g, ' ').trim() === want.replace('&amp;', '&')) sel.value = o.value;
    });
  });
})();

/* ── tour form: "Schedule a tour" on a location card pre-fills the location ── */
(function () {
  'use strict';
  var want = new URLSearchParams(location.search).get('location');
  var sel = document.querySelector('.pg-form select[name="location"]');
  if (!want || !sel) return;
  var map = { '16th-street': '69 16th Street', '71-16th-street': '71 16th Street', '3rd-avenue': '591 3rd Avenue' };
  if (!map[want]) return;
  sel.value = map[want];
  var more = sel.closest('details'); if (more) more.open = true;
})();

/* ── the shared form: on "Schedule a tour", the tour fields come forward ──
   Same fields everywhere; when the topic is a tour, preferred location and
   preferred tour day/time move out of "Add more details" to sit with the
   main fields, and go back when the topic changes. */
(function () {
  'use strict';
  Array.prototype.forEach.call(document.querySelectorAll('.pg-form'), function (form) {
    var topic = form.querySelector('select[name="topic"]');
    var more = form.querySelector('.pg-form__more');
    var when = form.querySelector('[name="availability"]');
    var where = form.querySelector('[name="location"]');
    if (!topic || !more || !when || !where) return;
    var rowWhen = when.closest('.pg-form__row'), gridWhere = where.closest('.pg-form__grid');
    var homeWhen = rowWhen.parentNode, homeWhere = gridWhere.parentNode;
    var markWhen = document.createComment('when'), markWhere = document.createComment('where');
    homeWhen.insertBefore(markWhen, rowWhen); homeWhere.insertBefore(markWhere, gridWhere);
    function sync() {
      var tour = /tour/i.test(topic.value);
      if (tour) { more.parentNode.insertBefore(gridWhere, more); more.parentNode.insertBefore(rowWhen, more); }
      else { markWhere.parentNode.insertBefore(gridWhere, markWhere); markWhen.parentNode.insertBefore(rowWhen, markWhen); }
    }
    topic.addEventListener('change', sync);
    setTimeout(sync, 0);   /* after the page's topic has been selected */
  });
})();

/* ── cards that fold on a phone (For families) ──
   Open on a computer, where the summary is just the card's heading and a
   click on it does nothing. On a phone each card starts closed and opens
   on a tap. Without JavaScript every card stays open. */
(function () {
  'use strict';
  var folds = document.querySelectorAll('[data-c2-fold]');
  if (!folds.length || !window.matchMedia) return;
  var phone = window.matchMedia('(max-width: 760px)');
  function sync() { Array.prototype.forEach.call(folds, function (d) { d.open = !phone.matches; }); }
  Array.prototype.forEach.call(folds, function (d) {
    d.querySelector('summary').addEventListener('click', function (e) { if (!phone.matches) e.preventDefault(); });
  });
  if (phone.addEventListener) phone.addEventListener('change', sync); else phone.addListener(sync);
  sync();
})();

/* ── FAQ search: filter the questions as you type ──
   Matches the question and its answer; a category with no match hides,
   and a line offers the contact page when nothing matches at all. */
(function () {
  'use strict';
  var input = document.querySelector('[data-c2-faq-search]');
  if (!input) return;
  var groups = document.querySelectorAll('.pg-faq__group');
  var none = document.querySelector('[data-c2-faq-none]');
  input.addEventListener('input', function () {
    var q = input.value.trim().toLowerCase(), any = false;
    Array.prototype.forEach.call(groups, function (g) {
      var shown = 0;
      Array.prototype.forEach.call(g.querySelectorAll('details'), function (d) {
        var hit = !q || d.textContent.toLowerCase().indexOf(q) > -1;
        d.hidden = !hit;
        if (q) d.open = hit;
        if (hit) shown++;
      });
      g.hidden = shown === 0;
      if (shown) any = true;
    });
    if (none) none.hidden = any;
  });
})();

/* ── Contact: the map of the three locations ──
   Leaflet and the map tiles load only when the map comes into view. Each
   location is a labelled teal pin; a pin opens its address with
   directions, and choosing a location tab above highlights its pin.
   Scroll-wheel zoom is off so the page scrolls past it normally. */
(function () {
  'use strict';
  var box = document.querySelector('[data-c2-findmap]');
  var dataEl = document.getElementById('find-data');
  if (!box || !dataEl) return;
  var LOCS = JSON.parse(dataEl.textContent);
  var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';
  var started = false, markers = [];
  function load() {
    if (started) return; started = true;
    var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = CDN + 'leaflet.min.css';
    document.head.appendChild(css);
    var js = document.createElement('script'); js.src = CDN + 'leaflet.min.js'; js.onload = build;
    document.head.appendChild(js);
  }
  function highlight(i) {
    markers.forEach(function (m, j) { var el = m.getElement(); if (el) el.classList.toggle('is-active', j === i); });
  }
  function build() {
    var L = window.L; if (!L) return;
    var map = L.map(box, { scrollWheelZoom: false, zoomControl: true, attributionControl: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    markers = LOCS.map(function (loc, i) {
      var w = loc.short.length * 9 + 30, h = 40;
      var icon = L.divIcon({
        className: 'pg-pin pg-pin--' + loc.side,
        html: '<span>' + loc.short + '</span>',
        iconSize: [w, h + 10],
        /* left/right: the label sits above the point, to one side;
           below: under the point, to the left, pointing up at it */
        iconAnchor: loc.side === 'right' ? [0, h + 10] : loc.side === 'below' ? [w, 0] : [w, h + 10],
        popupAnchor: [loc.side === 'right' ? w / 2 : -w / 2, loc.side === 'below' ? 4 : -(h + 6)]
      });
      var m = L.marker([loc.lat, loc.lng], { icon: icon, title: loc.name, riseOnHover: true }).addTo(map);
      m.bindPopup('<b>' + loc.name + '</b><br>Brooklyn, NY 11215<br><a href="' + loc.dir + '" target="_blank" rel="noopener">Get directions</a>');
      m.on('click', function () { highlight(i); });
      return m;
    });
    map.fitBounds(L.featureGroup(markers).getBounds().pad(1.2), { maxZoom: 18 });
    var sel = document.querySelector('.c2-loc [role="tab"][aria-selected="true"]');
    sync(sel);
  }
  function sync(tab) {
    if (!tab || !markers.length) return;
    var id = tab.getAttribute('aria-controls');
    LOCS.forEach(function (loc, i) { if (loc.tab === id) highlight(i); });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.c2-loc [role="tab"]'), function (tab) {
    tab.addEventListener('click', function () { sync(tab); });
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); load(); } }, { rootMargin: '300px' });
    io.observe(box);
  } else load();
})();

/* ── form fields: each takes only what belongs in it ──
   Name: no digits or symbols. Email: no spaces, and a real address
   shape. Phone: digits only, shaped as (917) 555-0123 while typing; a
   leading 1 or +1 is dropped. A problem shows as a red outline with a
   short message under the field: on leaving a filled field, and on
   submit for everything (the first problem gets the focus). Once a field
   is marked, it clears itself as soon as it is right. */
(function () {
  'use strict';
  var MSG = {
    name:  { empty: 'Please enter your name.', bad: 'Please use letters only.' },
    email: { empty: 'Please enter your email address.', bad: 'Please enter a valid email, like jane@example.com.' },
    phone: { empty: 'Please enter your phone number.', bad: 'Please enter a 10-digit phone number.' },
    message: { empty: 'Please write us a short message.' }
  };
  var digits = function (s) { return s.replace(/\D/g, ''); };
  function phoneDigits(v) {
    /* a US area code never starts with 1, so a leading 1 is the country code */
    return digits(v).replace(/^1/, '').slice(0, 10);
  }
  function phoneShape(d) {
    if (!d) return '';
    if (d.length <= 3) return '(' + d;
    if (d.length <= 6) return '(' + d.slice(0, 3) + ') ' + d.slice(3);
    return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
  }
  function problem(input) {
    var kind = input.dataset.c2Check, v = input.value.trim();
    if (!v) return input.required ? MSG[kind].empty : '';
    if (kind === 'name' && /[0-9@#$%^&*_=+<>{}\[\]\\|\/~`!?;:"]/.test(v)) return MSG.name.bad;
    if (kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return MSG.email.bad;
    if (kind === 'phone' && digits(v).replace(/^1(?=\d{10}$)/, '').length !== 10) return MSG.phone.bad;
    return '';
  }
  function mark(input, msg) {
    var row = input.closest('.pg-form__row'); if (!row) return;
    var id = input.id + '-err', err = document.getElementById(id);
    if (msg) {
      if (!err) {
        err = document.createElement('p');
        err.className = 'pg-form__err'; err.id = id;
        row.appendChild(err);
      }
      err.textContent = msg;
      row.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', id);
    } else {
      if (err) err.remove();
      row.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  }
  var check = function (input) { var m = problem(input); mark(input, m); return !m; };

  Array.prototype.forEach.call(document.querySelectorAll('.pg-form [data-c2-check]'), function (input) {
    var kind = input.dataset.c2Check;
    input.addEventListener('input', function () {
      if (kind === 'phone') input.value = phoneShape(phoneDigits(input.value));
      if (kind === 'email') input.value = input.value.replace(/\s+/g, '');
      if (kind === 'name') input.value = input.value.replace(/[0-9]/g, '');
      if (input.getAttribute('aria-invalid') === 'true') check(input);
      /* every field right again: the "fill in the highlighted fields" line goes */
      var form = input.closest('.pg-form'), st = form && form.querySelector('.pg-form__status--bad');
      if (st && !form.querySelector('.is-invalid')) st.hidden = true;
    });
    input.addEventListener('blur', function () { if (input.value.trim()) check(input); });
  });

  window.CAFormCheck = function (form) {
    var first = null;
    Array.prototype.forEach.call(form.querySelectorAll('[data-c2-check]'), function (input) {
      if (!check(input) && !first) first = input;
    });
    if (first) first.focus();
    return !first;
  };
})();

/* ── review cards: a long review folds to seven lines with "Read more" ── */
(function () {
  'use strict';
  Array.prototype.forEach.call(document.querySelectorAll('.pg-rv__text'), function (p) {
    if (p.scrollHeight <= p.clientHeight + 2) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'pg-rv__more'; b.textContent = 'Read more';
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', function () {
      var card = p.closest('.pg-rv__card'), open = card.classList.toggle('is-open');
      b.textContent = open ? 'Show less' : 'Read more';
      b.setAttribute('aria-expanded', String(open));
    });
    p.insertAdjacentElement('afterend', b);
  });
})();

/* ── the daily schedule on a phone: Morning and Afternoon as two tabs ──
   On a wide screen the two halves sit side by side; below 860px only the
   chosen half shows, so the card is half as tall. */
(function () {
  'use strict';
  Array.prototype.forEach.call(document.querySelectorAll('.pg-sched'), function (card, n) {
    var cols = card.querySelectorAll('.pg-sched__col');
    if (cols.length !== 2) return;
    var tabs = document.createElement('div');
    tabs.className = 'c2-tabs pg-sched__tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Part of the day');
    var buttons = Array.prototype.map.call(cols, function (col, i) {
      var id = 'pg-sched-' + n + '-' + i;
      col.id = id;
      col.setAttribute('role', 'tabpanel');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'c2-tab'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', id);
      b.textContent = (col.querySelector('.pg-sched__part') || {}).textContent || (i ? 'Afternoon' : 'Morning');
      b.addEventListener('click', function () { pick(i); });
      tabs.appendChild(b);
      return b;
    });
    function pick(i) {
      buttons.forEach(function (b, j) { b.setAttribute('aria-selected', String(i === j)); });
      Array.prototype.forEach.call(cols, function (c, j) { c.classList.toggle('is-off', i !== j); });
    }
    /* afternoon first once it is past noon */
    pick(new Date().getHours() >= 12 ? 1 : 0);
    card.querySelector('.pg-sched__cols').before(tabs);
  });
})();
