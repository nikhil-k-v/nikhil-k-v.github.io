/* blend.js — animations rendered on black (the home cards' .anims and the
   project pages' header .anim) rely on mix-blend-mode: lighten to drop the
   black out. Safari, and every browser on iOS (they all use WebKit), doesn't
   apply blend modes to <video>, so there they show up as black boxes.

   On those browsers each such video is copied frame by frame into a canvas
   that takes the video's place (same class and inline style, so the same
   size and position) and does the blending instead; the video itself is
   hidden but keeps playing. Everywhere else this script does nothing.
   Add ?blendfix to a URL to force it on for testing. */
(function () {
  'use strict';

  var ua = navigator.userAgent;
  var webkitOnly = /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg\/|OPR\/|Android/.test(ua);
  if (!webkitOnly && !/[?&]blendfix\b/.test(location.search)) return;

  var vids = Array.prototype.slice.call(document.querySelectorAll('video.anims, video.anim'));
  if (!vids.length) return;

  var pairs = vids.map(function (v) {
    var cv = document.createElement('canvas');
    cv.className = v.className;
    cv.setAttribute('style', v.getAttribute('style') || '');
    cv.setAttribute('aria-hidden', 'true');
    cv.width = 960;                       // replaced with the clip's own size once known
    cv.height = 540;
    v.parentNode.insertBefore(cv, v.nextSibling);
    v.style.opacity = '0';
    v.style.mixBlendMode = 'normal';
    var p = { v: v, cv: cv, cx: cv.getContext('2d'), seen: true, t: -1 };
    if (v.poster) {
      var im = new Image();
      im.onload = function () { if (p.t < 0) paint(p, im, im.naturalWidth, im.naturalHeight); };
      im.src = v.poster;
    }
    return p;
  });

  function paint(p, el, w, h) {
    if (!w || !h) return;
    if (p.cv.width !== w || p.cv.height !== h) { p.cv.width = w; p.cv.height = h; }
    try { p.cx.drawImage(el, 0, 0, w, h); } catch (_) {}
  }

  function frame(p) {
    var v = p.v;
    if (v.readyState < 2 || !v.videoWidth) return;
    if (v.currentTime === p.t) return;
    p.t = v.currentTime;
    paint(p, v, v.videoWidth, v.videoHeight);
  }

  // only draw the ones on screen
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        for (var i = 0; i < pairs.length; i++) if (pairs[i].cv === e.target) pairs[i].seen = e.isIntersecting;
      });
    }, { rootMargin: '100px' });
    pairs.forEach(function (p) { io.observe(p.cv); });
  }

  (function loop() {
    for (var i = 0; i < pairs.length; i++) if (pairs[i].seen) frame(pairs[i]);
    requestAnimationFrame(loop);
  })();
})();
