/* project.js — shared by the project write-ups on the navy page.
   - Videos marked data-autoplay only load and play while on screen, so a page
     with a dozen clips doesn't download all of them up front.
   - Images marked data-zoom open in the page's #modal. */

(function () {
  'use strict';

  /* ---------- play videos only while visible ---------- */
  var vids = Array.prototype.slice.call(document.querySelectorAll('video[data-autoplay]'));
  vids.forEach(function (v) {
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.preload = 'none';
  });

  function play(v) {
    if (v.dataset.src && !v.getAttribute('src')) v.src = v.dataset.src;
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  /* start downloading well before a clip scrolls in (about a screen and a
     half ahead), so it's already playing by the time it's on screen */
  function load(v) {
    if (v.dataset.src && !v.getAttribute('src')) { v.preload = 'auto'; v.src = v.dataset.src; }
  }

  if ('IntersectionObserver' in window) {
    // clips in a carousel are clipped sideways by its track, so the carousel
    // as a whole is watched and all of its clips load together
    var ahead = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        if (el.tagName === 'VIDEO') load(el);
        else Array.prototype.forEach.call(el.querySelectorAll('video[data-autoplay]'), load);
        ahead.unobserve(el);
      });
    }, { rootMargin: '150% 0px' });
    var watched = [];
    vids.forEach(function (v) {
      var box = v.closest('.splide') || v;
      if (watched.indexOf(box) < 0) { watched.push(box); ahead.observe(box); }
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) play(e.target);
        else if (!e.target.paused) e.target.pause();
      });
    }, { rootMargin: '200px 0px', threshold: 0.01 });
    vids.forEach(function (v) { io.observe(v); });

    // carousels in loop mode clone their slides after this runs; pick the
    // copies up once everything has mounted
    window.addEventListener('load', function () {
      Array.prototype.forEach.call(document.querySelectorAll('video[data-autoplay]'), function (v) {
        if (vids.indexOf(v) >= 0) return;
        vids.push(v);
        v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', '');
        var box = v.closest('.splide');
        if (box && box.querySelector('video[src]')) load(v);
        io.observe(v);
      });
    });
  } else {
    vids.forEach(play);
  }

  /* ---------- click to zoom ---------- */
  var modal = document.getElementById('modal');
  var modalImg = document.getElementById('modalImage');
  if (!modal || !modalImg) return;

  var fade = 'opacity 0.3s ease, visibility 0s linear 0.3s';
  modal.style.transition = fade;

  function open(src, alt) {
    modalImg.src = src;
    modalImg.alt = alt || '';
    modal.style.transition = 'opacity 0.3s ease, visibility 0s';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
  }
  function close() {
    modal.style.transition = fade;
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
  }

  document.addEventListener('click', function (e) {
    var img = e.target.closest && e.target.closest('img[data-zoom]');
    if (img) { open(img.currentSrc || img.src, img.alt); return; }
    if (e.target === modal || (e.target.classList && e.target.classList.contains('close'))) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.style.visibility === 'visible') close();
  });
})();
