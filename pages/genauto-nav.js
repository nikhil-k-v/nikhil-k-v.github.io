/* genauto-nav.js
   Section navigation on the left edge of the page.
   - Hidden until you scroll or move the mouse, then fades out again after a
     short pause (it stays open while hovered or focused).
   - Never shows while you're still up in the hero, above the write-up.
   - Highlights the section currently in view. */

(function () {
  var nav = document.querySelector('.ga-nav');
  if (!nav) return;

  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var sections = links
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);
  var firstSection = sections[0];

  var HIDE_AFTER = 1600;   /* ms of no scrolling / mouse movement */
  var hideTimer = null;

  function pastHero() {
    if (!firstSection) return true;
    return firstSection.getBoundingClientRect().top < window.innerHeight * 0.6;
  }

  function show() {
    if (!pastHero()) { nav.classList.remove('is-visible'); return; }
    nav.classList.add('is-visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      if (!nav.matches(':hover') && !nav.contains(document.activeElement)) {
        nav.classList.remove('is-visible');
      }
    }, HIDE_AFTER);
  }

  window.addEventListener('scroll', show, { passive: true });
  window.addEventListener('mousemove', show, { passive: true });
  nav.addEventListener('mouseleave', show);
  nav.addEventListener('focusout', show);

  /* current section */
  function setCurrent(id) {
    links.forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  function updateCurrent() {
    var line = window.innerHeight * 0.35, current = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= line) current = sections[i];
    }
    if (current) setCurrent(current.id);
  }
  window.addEventListener('scroll', updateCurrent, { passive: true });
  window.addEventListener('resize', updateCurrent);
  updateCurrent();

  /* smooth jump (instant if the visitor prefers reduced motion) */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.getElementById(a.getAttribute('href').slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', a.getAttribute('href'));
    });
  });
})();
