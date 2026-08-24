/* Programs carousel — scroll-snap track driven by two arrow buttons.
   No dependencies. The track is natively scrollable/swipeable; the buttons
   are a convenience layer, so JS failing degrades to a normal scroller. */
(function () {
  'use strict';

  var track = document.getElementById('program-track');
  if (!track) return;

  var prev = document.querySelector('[data-carousel-prev]');
  var next = document.querySelector('[data-carousel-next]');
  if (!prev || !next) return;

  /* Distance of one card + its gap, measured from the live layout so it
     stays correct across the responsive breakpoints. */
  function step() {
    var cards = track.children;
    if (cards.length < 2) return track.clientWidth;
    return Math.round(cards[1].getBoundingClientRect().left -
                      cards[0].getBoundingClientRect().left);
  }

  function maxScroll() {
    return track.scrollWidth - track.clientWidth;
  }

  function sync() {
    var x = Math.round(track.scrollLeft);
    var max = Math.round(maxScroll());
    prev.disabled = x <= 1;
    next.disabled = x >= max - 1 || max <= 0;
  }

  prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
  next.addEventListener('click', function () { track.scrollBy({ left:  step(), behavior: 'smooth' }); });

  /* Arrow keys when the track itself has focus. */
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left:  step(), behavior: 'smooth' }); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); track.scrollBy({ left: -step(), behavior: 'smooth' }); }
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
})();
