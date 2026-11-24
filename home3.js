/* =====================================================================
   HOME 3 (prototype, index3.html) — halftone card animations.
   Loaded after home.js, which still runs the carousel unchanged.

   Each card gets a canvas (halftone.js) that draws its animation as dots.
   The bar at the bottom left switches between a few behaviours:

     open   closed cards are dots; the open card turns sharp, cell by cell
     lens   the same, plus a sharp patch under the pointer on closed cards
     far    cards get coarser the further they are from the open one
     dots   everything stays dots; sharp patches drift over the open card

   The dot settings come from the lab (halftone-lab.html) through
   localStorage, and are picked up live when they change in another tab.
   ===================================================================== */
(function () {
  'use strict';

  var HT = window.NVHalftone;
  var track = document.querySelector('.track');
  if (!HT || !track) return;

  var MODES = [
    { id: 'open', name: 'Open sharp' },
    { id: 'lens', name: 'Pointer lens' },
    { id: 'far',  name: 'By distance' },
    { id: 'dots', name: 'All dots' }
  ];
  var MODE_KEY = 'nv-halftone-mode';

  function modeOk(id) { return MODES.some(function (m) { return m.id === id; }); }
  var mode = (/[?&]p=([a-z]+)/.exec(location.search) || [])[1];
  if (!modeOk(mode)) { try { mode = localStorage.getItem(MODE_KEY); } catch (_) {} }
  if (!modeOk(mode)) mode = 'open';

  var S = HT.load();
  function reload() { S = HT.load(); }
  window.addEventListener('storage', function (e) { if (!e.key || e.key === HT.KEY) reload(); });
  window.addEventListener('pageshow', reload);
  window.addEventListener('focus', reload);

  var boxes = Array.prototype.slice.call(track.querySelectorAll('.box'));
  var cards = [];
  boxes.forEach(function (box) {
    var v = box.querySelector('video.anims');
    if (!v) return;
    var cv = document.createElement('canvas');
    cv.className = 'ht';
    cv.setAttribute('aria-hidden', 'true');
    v.parentNode.insertBefore(cv, v.nextSibling);
    var f = HT.filterOf(v.getAttribute('style'));
    var c = {
      box: box, v: v, cv: cv, ht: HT.create(cv), poster: null,
      filter: f.filter, bright: f.bright, contrast: f.contrast,
      p: box.classList.contains('active') ? 1 : 0,     // how far the sharp picture has taken over
      lens: 0, lx: 0, ly: 0, tx: 0, ty: 0,
      coarse: 1, blobs: 0,
      seen: true, last: 0, drawn: false
    };
    if (v.poster) {
      var im = new Image();
      im.onload = function () { c.poster = im; };
      im.src = v.poster;
    }
    cards.push(c);
  });
  if (!cards.length) return;

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        for (var i = 0; i < cards.length; i++) if (cards[i].box === e.target) cards[i].seen = e.isIntersecting;
      });
    }, { root: track, rootMargin: '0px 100px 0px 100px' });
    cards.forEach(function (c) { io.observe(c.box); });
  }

  /* pointer, for the lens */
  var hover = null;
  track.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var box = e.target.closest ? e.target.closest('.box') : null;
    hover = null;
    for (var i = 0; i < cards.length; i++) if (cards[i].box === box) hover = cards[i];
    if (!hover) return;
    var r = box.getBoundingClientRect();
    hover.tx = e.clientX - r.left - box.clientLeft;
    hover.ty = e.clientY - r.top - box.clientTop;
    if (hover.lens < 0.02) { hover.lx = hover.tx; hover.ly = hover.ty; }
  });
  track.addEventListener('pointerleave', function () { hover = null; });

  function ease(t) { return t * t * (3 - 2 * t); }
  function step(cur, to, rate, dt) {                 // straight-line move toward a target
    var d = to - cur, m = rate * dt;
    return Math.abs(d) <= m ? to : cur + (d > 0 ? m : -m);
  }

  var prev = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.1, (now - prev) / 1000 || 0);
    prev = now;
    var t = now / 1000;
    var gap = 1000 / S.fps;

    var active = -1;
    for (var i = 0; i < cards.length; i++) if (cards[i].box.classList.contains('active')) active = i;

    for (i = 0; i < cards.length; i++) {
      var c = cards[i], on = i === active;

      var pT = on && mode !== 'dots' ? 1 : 0;
      var lensT = mode === 'lens' && c === hover && !on ? 1 : 0;
      var coarseT = mode === 'far' && active > -1 ? 1 + 0.5 * Math.min(4, Math.abs(i - active)) : 1;
      var blobsT = mode === 'dots' && on ? 1 : 0;

      var was = c.p + c.lens + c.coarse + c.blobs;
      c.p = step(c.p, pT, pT ? 1 / 0.9 : 1 / 0.6, dt);
      c.blobs = step(c.blobs, blobsT, 1 / 0.8, dt);
      c.lens += (lensT - c.lens) * Math.min(1, dt * 9);
      if (c.lens < 0.005 && !lensT) c.lens = 0;
      c.lx += (c.tx - c.lx) * Math.min(1, dt * 14);
      c.ly += (c.ty - c.ly) * Math.min(1, dt * 14);
      c.coarse += (coarseT - c.coarse) * Math.min(1, dt * 5);
      if (Math.abs(coarseT - c.coarse) < 0.01) c.coarse = coarseT;
      var moving = was !== c.p + c.lens + c.coarse + c.blobs || c.lens > 0;

      if (!c.seen) continue;
      var w = c.box.clientWidth, h = c.box.clientHeight;
      if (!w || !h) continue;
      var resized = c.ht.size(w, h);
      if (!resized && !moving && c.drawn && now - c.last < gap) continue;

      var v = c.v;
      var src = v.readyState >= 2 && v.videoWidth ? v : c.poster;
      if (!src) continue;
      var vr = v.getBoundingClientRect(), br = c.box.getBoundingClientRect();
      if (!vr.width || !vr.height) continue;
      c.ht.draw(src, {
        x: vr.left - br.left - c.box.clientLeft,
        y: vr.top - br.top - c.box.clientTop,
        w: vr.width, h: vr.height
      }, S, {
        crisp: ease(c.p),
        lens: c.lens ? { x: c.lx, y: c.ly, r: Math.min(w, h) * 0.3, s: c.lens } : null,
        blobs: c.blobs,
        coarse: c.coarse,
        filter: c.filter, bright: c.bright, contrast: c.contrast
      }, t);
      c.last = now;
      c.drawn = true;
    }
  }
  requestAnimationFrame(loop);

  /* the bar */
  var bar = document.createElement('div');
  bar.className = 'ht-bar';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Halftone prototype');
  var tag = document.createElement('span');
  tag.textContent = 'HALFTONE';
  bar.appendChild(tag);
  var buttons = MODES.map(function (m) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = m.name;
    b.addEventListener('click', function () { setMode(m.id); });
    bar.appendChild(b);
    return b;
  });
  var lab = document.createElement('a');
  lab.href = 'halftone-lab.html';
  lab.textContent = 'Lab';
  bar.appendChild(lab);
  document.body.appendChild(bar);

  function setMode(id) {
    mode = id;
    try { localStorage.setItem(MODE_KEY, id); } catch (_) {}
    MODES.forEach(function (m, i) { buttons[i].setAttribute('aria-pressed', m.id === id ? 'true' : 'false'); });
  }
  setMode(mode);
})();
