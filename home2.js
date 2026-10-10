/* =====================================================================
   HOME 2 (prototype, index2.html) — carousel + previews
   A fork of home.js. Portrait phones/tablets behave exactly as on the
   home page (split view, preview pane under the strip). On desktop and
   compact layouts the open card holds the preview itself: the card's
   animation and title move into its upper half, its face fades out
   around the middle (home2.css), and a dithered picture of the project
   page plays in the lower half. The preview is a child of the card, so
   it scrolls with the strip. Two preview panes take turns, so the old
   card's preview can dither away while the new one comes in.
   Layout breakpoints must match home.css / home2.css.
   ===================================================================== */
(function () {
  'use strict';

  var track = document.querySelector('.track');
  if (!track) return;

  var boxes = Array.prototype.slice.call(track.querySelectorAll('.box'));
  var scrollbar = document.querySelector('.scrollbar');
  var handle = scrollbar ? scrollbar.querySelector('.handle') : null;

  var SPLIT_MQ = window.matchMedia('(orientation: portrait) and (max-width: 1100px)');
  var COMPACT_MQ = window.matchMedia('(max-width: 1380px), (max-height: 640px)');
  var REDUCED_MQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  var WHEEL_GAIN = 0.4;       // same feel as the old window.scrollBy(deltaY * 0.4)
  var PREVIEW_DELAY = 1500;   // ms into the home loading screen that the preview starts

  function isSplit() { return SPLIT_MQ.matches; }
  function isCompact() { return COMPACT_MQ.matches; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function maxScroll() { return Math.max(0, track.scrollWidth - track.clientWidth); }

  /* ------------------------------------------------------------------
     Project data (from data-* attributes)
     ------------------------------------------------------------------ */
  function projectOf(box) {
    var labels = box.querySelectorAll('.index-label');
    var title = box.querySelector('.s-title');
    return {
      href: box.getAttribute('data-href'),
      external: box.getAttribute('data-external'),
      title: title ? title.textContent.trim() : '',
      index: labels[0] ? labels[0].textContent.trim() : '',
      category: labels[1] ? labels[1].textContent.trim().replace(/^\[|\]$/g, '') : ''
    };
  }

  function openProject(box) {
    var p = projectOf(box);
    if (p.href) { if (window.nvGo) window.nvGo(p.href); else window.location.href = p.href; }
    else if (p.external) window.open(p.external, '_blank', 'noopener');
  }

  /* ------------------------------------------------------------------
     Active state
     ------------------------------------------------------------------ */
  function activeBox() {
    for (var i = 0; i < boxes.length; i++) {
      if (boxes[i].classList.contains('active')) return boxes[i];
    }
    return null;
  }

  function setActive(box) {
    boxes.forEach(function (b) {
      var on = b === box;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function activate(box) {
    var wasActive = box.classList.contains('active');

    if (isSplit()) {
      // In split view a card is a selector only — it never navigates.
      if (wasActive) { Preview.nudge(); return; }
      setActive(box);
      Preview.show(box);
      followActive(box);
      return;
    }

    // Desktop / compact: a second click closes the card again.
    if (wasActive) { setActive(null); InBox.release(box); return; }
    var old = activeBox();
    setActive(box);
    if (old) InBox.release(old);
    InBox.mount(box);
    followActive(box);
  }

  /* ------------------------------------------------------------------
     Keep the expanding card centred while it animates
     ------------------------------------------------------------------ */
  var followRaf = 0;

  function transitionMs(el) {
    var d = getComputedStyle(el).transitionDuration.split(',')[0];
    var n = parseFloat(d) || 0;
    return d.indexOf('ms') > -1 ? n : n * 1000;
  }

  function cancelFollow() {
    if (followRaf) cancelAnimationFrame(followRaf);
    followRaf = 0;
  }

  function followActive(box) {
    cancelFollow();
    var duration = transitionMs(box) + 120;
    var start = performance.now();

    function step(now) {
      var target = clamp(
        box.offsetLeft + box.offsetWidth / 2 - track.clientWidth / 2,
        0, maxScroll()
      );
      var t = Math.min(1, (now - start) / Math.max(duration, 1));
      // eases toward the moving target, lands exactly on it at the end
      var k = REDUCED_MQ.matches ? 1 : 0.14 + 0.86 * t * t * t;
      track.scrollLeft += (target - track.scrollLeft) * k;
      followRaf = t < 1 ? requestAnimationFrame(step) : 0;
    }
    followRaf = requestAnimationFrame(step);
  }

  // Any manual scrolling takes over immediately
  track.addEventListener('touchstart', cancelFollow, { passive: true });
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') cancelFollow();
  });

  /* ------------------------------------------------------------------
     Card wiring
     ------------------------------------------------------------------ */
  boxes.forEach(function (box) {
    box.setAttribute('role', 'button');
    box.setAttribute('tabindex', '0');
    box.setAttribute('aria-pressed', box.classList.contains('active') ? 'true' : 'false');
    var p = projectOf(box);
    box.setAttribute('aria-label', p.title);

    box.addEventListener('click', function () { activate(box); });

    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (box.classList.contains('active') && !isSplit()) openProject(box);
        else activate(box);
      } else if (e.key === 'Escape' && box.classList.contains('active') && !isSplit()) {
        activate(box);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var i = boxes.indexOf(box) + (e.key === 'ArrowRight' ? 1 : -1);
        if (boxes[i]) { boxes[i].focus({ preventScroll: false }); }
      }
    });
  });

  /* ------------------------------------------------------------------
     Card animations further along the strip (data-lazy) only start
     downloading once they come close to the visible part of the track,
     so the first cards get the bandwidth
     ------------------------------------------------------------------ */
  function wake(v) {
    if (!v || v.getAttribute('data-awake')) return;
    v.setAttribute('data-awake', '1');
    v.preload = 'auto';
    v.autoplay = true;
    var pr = v.play();
    if (pr && pr.catch) pr.catch(function () {});
  }
  (function () {
    var lazy = Array.prototype.slice.call(track.querySelectorAll('video[data-lazy]'));
    if (!('IntersectionObserver' in window)) { lazy.forEach(wake); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { wake(e.target); io.unobserve(e.target); }
      });
    }, { root: track, rootMargin: '0px 75% 0px 75%' });
    lazy.forEach(function (v) { io.observe(v); });

    // only the cards in (or next to) view keep decoding; the rest pause,
    // which matters a lot on phones with a dozen clips in the strip
    var all = Array.prototype.slice.call(track.querySelectorAll('video.anims'));
    var vis = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.hasAttribute('data-lazy') || v.getAttribute('data-awake')) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        } else if (!v.paused) v.pause();
      });
    }, { root: track, rootMargin: '0px 25% 0px 25%' });
    all.forEach(function (v) { vis.observe(v); });
  })();

  /* ------------------------------------------------------------------
     Wheel → horizontal scroll (track scrolls itself, never the page)
     ------------------------------------------------------------------ */
  document.addEventListener('wheel', function (e) {
    if (e.ctrlKey) return;  // pinch-zoom on trackpads

    var horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (horizontal && track.contains(e.target)) { cancelFollow(); return; } // native

    var d = horizontal ? e.deltaX : e.deltaY;
    if (e.deltaMode === 1) d *= 16;
    else if (e.deltaMode === 2) d *= track.clientWidth;
    if (!d) return;

    cancelFollow();
    track.scrollLeft += horizontal ? d : d * WHEEL_GAIN;
    e.preventDefault();
  }, { passive: false });

  /* ------------------------------------------------------------------
     Custom scrollbar
     ------------------------------------------------------------------ */
  var dragging = false;
  var dragStartX = 0;
  var dragStartHandle = 0;

  function handleRange() {
    return Math.max(0, scrollbar.clientWidth - handle.offsetWidth);
  }

  function handleXForScroll() {
    var m = maxScroll();
    return m > 0 ? (track.scrollLeft / m) * handleRange() : 0;
  }

  function placeHandle(immediate) {
    if (!handle) return;
    var x = handleXForScroll();
    if (window.gsap) {
      if (immediate) gsap.set(handle, { x: x });
      else gsap.to(handle, { x: x, duration: 0.5, ease: 'power2', overwrite: true });
    } else {
      handle.style.transform = 'translateX(' + x + 'px)';
    }
  }

  if (handle) {
    handle.addEventListener('pointerdown', function (e) {
      dragging = true;
      cancelFollow();
      dragStartX = e.clientX;
      dragStartHandle = handleXForScroll();
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    handle.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var range = handleRange();
      if (!range) return;
      var x = clamp(dragStartHandle + (e.clientX - dragStartX), 0, range);
      track.scrollLeft = (x / range) * maxScroll();
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
    }
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);

    track.addEventListener('scroll', function () { placeHandle(dragging); }, { passive: true });
    window.addEventListener('resize', function () { placeHandle(true); });
  }

  /* ------------------------------------------------------------------
     Dither renderer
     Draws a source image (a snapshot of the project page) as a grid of
     6px cells that is always moving. A slow wave field decides what each
     cell is:
       high  → a solid block: the page itself, crisp, clipped to the cell
       lower → a colour halftone square sized by the page's brightness
               there and by how close the field is to "block"
       low   → nothing
     The field drops off toward the pane's edges, and dot opacity steps
     down with it, so the content dissolves at the border.

     Modes:  'content' — source canvas is drawn (blocks + coloured dots)
             'mask'    — no pixels available (cross-origin page): a live
                         iframe sits underneath and the dots are holes
                         in a navy cover instead
             'empty'   — no page: faint drifting dots only
     level:  0 = normal, -1 = fully dissolved (used to swap sources)
     ------------------------------------------------------------------ */
  function createRenderer(canvas, stage) {
    var C = 4;              // cell size, css px
    var K = 4;              // sub-pixels per cell edge (1 css px each) → dot sizes 1..3
    var TH = 0.9;           // field value above which a cell becomes a block (kept rare)
    var SPEED = 1.8;        // overall animation speed
    // blobs: [x speed, phase, phase2, y speed, phase3, size]
    var BLOBS = [
      [0.23, 0.0, 1.7, 0.19, 2.1, 1.0],
      [0.17, 2.4, 0.3, 0.26, 4.0, 0.85],
      [0.29, 4.1, 2.9, 0.15, 0.7, 0.7],
      [0.13, 1.2, 5.2, 0.21, 3.3, 0.9],
      [0.31, 5.5, 3.8, 0.27, 5.6, 0.6]
    ];
    var FPS_GAP = 31;       // ~30 fps is plenty for this and kind to batteries
    var BUSY_GAP = 125;     // ~8 fps while a snapshot is being taken, to leave it the CPU
    var busy = false;
    var BG = [5, 18, 32];   // --dark-primary: the page colour, so empty page blends in
    var EMPTY_RGB = [52, 92, 132], EMPTY_L = 0.34;
    var BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (var b = 0; b < 16; b++) BAYER4[b] = (BAYER4[b] + 0.5) / 16;

    var ctx = canvas.getContext('2d');
    var dots = document.createElement('canvas'), dctx = dots.getContext('2d');
    var mask = document.createElement('canvas'), mctx = mask.getContext('2d');

    var W = 0, H = 0, dpr = 1, cols = 0, rows = 0, dImg = null, mImg = null;
    // cross-dissolve: cells switch from the previous picture to the new one in
    // this order. Both pictures keep playing their media while it happens.
    var trans = null, order = null;
    var mask2 = document.createElement('canvas'), m2ctx = mask2.getContext('2d'), m2Img = null;
    var blk = document.createElement('canvas'), blkCtx = blk.getContext('2d');

    /* a picture: a still base, optional live media painted over it, and the
       per-cell colour/ink sampled from the result. cur is on screen; prev is
       the one being dissolved away (only meaningful while trans is set) */
    function makeLayer() {
      var cv = document.createElement('canvas');
      return { cv: cv, cx: cv.getContext('2d'), base: null, live: null, mode: 'empty', src: null, rgb: null, lum: null, level: 0 };
    }
    var cur = makeLayer(), prev = makeLayer();
    var level = -1, tween = null, waiters = [];
    var raf = 0, running = false, last = 0, clock = 0, prevNow = 0;

    function smoothstep(a, b, x) {
      var t = (x - a) / (b - a);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      return t * t * (3 - 2 * t);
    }

    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      W = w; H = h;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      cols = Math.ceil(W / C); rows = Math.ceil(H / C);
      dots.width = cols * K; dots.height = rows * K;
      mask.width = cols; mask.height = rows;
      mask2.width = cols; mask2.height = rows;
      dImg = dctx.createImageData(dots.width, dots.height);
      mImg = mctx.createImageData(cols, rows);
      m2Img = m2ctx.createImageData(cols, rows);
      // cells switch from the middle outward, grainy rather than as a ring
      order = new Float32Array(cols * rows);
      for (var oy = 0; oy < rows; oy++) for (var ox = 0; ox < cols; ox++) {
        var hsh = Math.sin(ox * 12.9898 + oy * 78.233) * 43758.5453; hsh -= Math.floor(hsh);
        var ou = (ox + 0.5) / cols - 0.5, ov = (oy + 0.5) / rows - 0.5;
        order[oy * cols + ox] = Math.min(0.999, 0.6 * hsh + 0.55 * Math.sqrt(ou * ou + ov * ov) * 1.4);
      }
      trans = null;
      if (cur.live) compose(cur);
      sample(cur);
      if (!running) draw(prevNow || performance.now());
    }

    /* Per-cell colour and "ink" amount. Each cell is sampled 3x3 so thin
       things (text strokes, wireframe lines) still register; detail inside
       the cell drives the dot size and flat fills (a big white sheet, a soft
       glow) are toned down, so the page's features carry the picture. */
    var sampCv = document.createElement('canvas'), sampCtx = sampCv.getContext('2d', { willReadFrequently: true });
    function sample(L) {
      if (!L.src || !cols) { L.rgb = L.lum = null; return; }
      var S = 3, sw = cols * S, sh = rows * S;
      if (sampCv.width !== sw || sampCv.height !== sh) { sampCv.width = sw; sampCv.height = sh; }
      var t = sampCtx;
      t.imageSmoothingEnabled = true;
      t.imageSmoothingQuality = 'high';
      t.fillStyle = 'rgb(' + BG + ')';
      t.fillRect(0, 0, sw, sh);
      t.drawImage(L.src, 0, 0, W * S / C, H * S / C);
      var d;
      try { d = t.getImageData(0, 0, sw, sh).data; } catch (_) { L.rgb = L.lum = null; return; }
      var n = cols * rows;
      if (!L.rgb || L.rgb.length !== n * 3) { L.rgb = new Uint8ClampedArray(n * 3); L.lum = new Float32Array(n); }
      var rgb = L.rgb, lum = L.lum;

      function bright(r, g, b) {
        var y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        var mx = Math.max(r, g, b) / 255;
        return Math.max(0, Math.max((y - 0.08) / 0.92, (mx - 0.14) * 0.8));
      }

      for (var cy = 0; cy < rows; cy++) {
        for (var cx = 0; cx < cols; cx++) {
          var sum = 0, mx = 0, mn = 1, wr = 0, wg = 0, wb = 0, wsum = 0;
          for (var yy = 0; yy < S; yy++) {
            var row = ((cy * S + yy) * sw + cx * S) * 4;
            for (var xx = 0; xx < S; xx++) {
              var o = row + xx * 4;
              var r = d[o], g = d[o + 1], b = d[o + 2];
              var l = bright(r, g, b);
              sum += l;
              if (l > mx) mx = l;
              if (l < mn) mn = l;
              var w = 0.05 + l;                     // colour leans to the bright part
              wr += r * w; wg += g * w; wb += b * w; wsum += w;
            }
          }
          var avg = sum / (S * S);
          var detail = Math.min(1, (mx - mn) * 2.5);
          // ink: brightness, pulled up toward the peak where there's detail,
          // pushed down where the cell is one flat colour
          var ink = mx * 0.9 * detail + avg * 0.12;
          ink = Math.pow(Math.min(1, ink), 0.75);
          var ci = cy * cols + cx;
          lum[ci] = ink;
          rgb[ci * 3]     = Math.min(255, (wr / wsum) * 1.12 + 20);
          rgb[ci * 3 + 1] = Math.min(255, (wg / wsum) * 1.12 + 20);
          rgb[ci * 3 + 2] = Math.min(255, (wb / wsum) * 1.12 + 20);
        }
      }
    }

    /* base: a still picture of the page (or null for plain navy)
       live: optional fn(ctx, w, h) that paints moving media (videos, GIFs)
             over the base each refresh, so the preview isn't frozen */
    var liveAt = 0;
    var LIVE_GAP = 90;      // refresh moving media ~11 times a second

    function compose(L) {
      var w = Math.round(W * dpr), h = Math.round(H * dpr), x = L.cx;
      if (L.cv.width !== w || L.cv.height !== h) { L.cv.width = w; L.cv.height = h; }
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = 1;
      x.filter = 'none';
      x.fillStyle = 'rgb(' + BG + ')';
      x.fillRect(0, 0, w, h);
      if (L.base) x.drawImage(L.base, 0, 0, w, h);
      try { L.live(x, w, h); } catch (_) {}
      x.filter = 'none';
      x.globalAlpha = 1;
      x.globalCompositeOperation = 'source-over';
      L.src = L.cv;
    }

    function setSource(canvasOrNull, m, liveFn) {
      cur.base = canvasOrNull;
      cur.live = liveFn || null;
      cur.mode = m;
      if (cur.live && W) compose(cur); else cur.src = cur.base;
      sample(cur);
      if (cur.mode === 'content' && !cur.rgb) cur.mode = 'empty';   // tainted or empty source
    }

    function setLive(liveFn) {
      cur.live = liveFn || null;
      if (cur.mode !== 'content') return;
      if (cur.live && W) compose(cur); else cur.src = cur.base;
      sample(cur);
    }

    /* swap to a new picture through a dither dissolve: cell by cell, the old
       picture gives way to the new one. The old picture keeps playing its
       media until its last cell is gone, so nothing freezes mid-dissolve. */
    function crossTo(canvasOrNull, m, liveFn, opts) {
      opts = opts || {};
      var dur = REDUCED_MQ.matches ? 1 : (opts.dur || 900);
      var to = opts.level === undefined ? 0 : opts.level;
      if (level > -0.95 && W && (cur.mode !== 'content' || cur.rgb)) {
        var t = prev; prev = cur; cur = t;            // the old layer keeps its canvas
        prev.level = level;
        if (prev.mode === 'mask') prev.mode = 'empty';
        cur.base = null; cur.live = null; cur.src = null;
        trans = { t0: performance.now(), dur: dur, ease: opts.ease === 'linear' ? function (v) { return v; } : easeInOut };
        tween = null;
        level = to;
        setSource(canvasOrNull, m, liveFn);
        kick();
        if (!running) draw(performance.now() + dur);
      } else {
        trans = null;
        setSource(canvasOrNull, m, liveFn);
        animate(to, dur, easeOut);
      }
    }

    function write(d, DW, x0, y0, s, r, g, bl, a) {
      for (var yy = 0; yy < s; yy++) {
        var idx = ((y0 + yy) * DW + x0) * 4;
        for (var xx = 0; xx < s; xx++, idx += 4) {
          d[idx] = r; d[idx + 1] = g; d[idx + 2] = bl; d[idx + 3] = a;
        }
      }
    }

    function draw(now) {
      if (!dImg || !cols) return;

      if (!REDUCED_MQ.matches) clock += SPEED * Math.min(now - prevNow, 100) / 1000;
      prevNow = now;
      var t = clock;

      if (tween) {
        var k = Math.min(1, (now - tween.t0) / tween.dur);
        level = tween.from + (tween.to - tween.from) * tween.ease(k);
        if (k >= 1) {
          tween = null;
          if (level <= -0.999) { var w = waiters; waiters = []; w.forEach(function (f) { f(); }); }
        }
      }

      if (trans && now - trans.t0 >= trans.dur) { trans = null; prev.live = null; prev.base = null; }

      if (!busy && now - liveAt >= LIVE_GAP) {
        var refreshed = false;
        if (cur.live && cur.mode === 'content') {
          compose(cur); sample(cur); refreshed = true;
          if (!cur.rgb) { cur.mode = 'empty'; cur.live = null; }
        }
        if (trans && prev.live && prev.mode === 'content') {
          compose(prev); sample(prev); refreshed = true;
          if (!prev.rgb) prev.mode = 'empty';
        }
        if (refreshed) liveAt = now;
      }

      var mode = cur.mode, rgb = cur.rgb, lum = cur.lum, src = cur.src;
      var vis = level < -1 ? 0 : level > 0 ? 1 : 1 + level;
      var d = dImg.data, m = mImg.data, m2 = m2Img.data, DW = cols * K;
      d.fill(0);
      m.fill(0);
      var tp = 2, oldVis = 0, oldLevel = 0, old = null;
      if (trans) {
        tp = trans.ease((now - trans.t0) / trans.dur);
        m2.fill(0);
        old = prev;
        oldLevel = old.level;
        oldVis = oldLevel < -1 ? 0 : oldLevel > 0 ? 1 : 1 + oldLevel;
      }

      // whole pane drifts between "a few solid clumps" and "all dots"
      var breathe = 0.5 + 0.5 * Math.sin(t * 0.31);
      var gain = 0.8 + 0.2 * breathe;
      var FALL = Math.min(52, Math.min(W, H) * 0.16);      // width of the edge drop-off
      var hx = W / 2, hy = H / 2;

      // floating blobs: each wanders on two mixed sine paths (reads as noise,
      // never repeats quickly) and breathes its radius in and out
      var R0 = Math.min(W, H) * 0.19;
      var blobs = [];
      for (var bi = 0; bi < BLOBS.length; bi++) {
        var B = BLOBS[bi];
        blobs.push({
          x: hx + hx * (0.5 * Math.sin(t * B[0] + B[1]) + 0.16 * Math.sin(t * B[0] * 2.3 + B[2])),
          y: hy + hy * (0.5 * Math.sin(t * B[3] + B[4]) + 0.16 * Math.sin(t * B[3] * 1.9 + B[1])),
          r2: Math.pow(R0 * B[5] * (0.75 + 0.25 * Math.sin(t * 0.5 + B[2])), 2)
        });
      }

      for (var cy = 0; cy < rows; cy++) {
        var py = (cy + 0.5) * C;
        var ey = smoothstep(0, FALL, Math.min(py, H - py));
        var eb = smoothstep(H * 0.05, H * 0.32, H - py);    // the page fades out well before the bottom
        var by = (cy & 3) << 2;
        for (var cx = 0; cx < cols; cx++) {
          var px = (cx + 0.5) * C;
          var e = Math.min(ey, smoothstep(0, FALL, Math.min(px, W - px)), eb);
          var ci = cy * cols + cx;
          var useOld = tp < 2 && order[ci] >= tp;
          var cm = useOld ? old.mode : mode;
          var cvis = useOld ? oldVis : vis;

          // metaball sum: 1 at a blob's centre, 0.5 at its radius, tails merge
          var sum = 0;
          for (var k = 0; k < blobs.length; k++) {
            var dx = px - blobs[k].x, dy = py - blobs[k].y;
            sum += blobs[k].r2 / (dx * dx + dy * dy + blobs[k].r2);
          }
          var ripple = 0.08 * Math.sin(px * 0.07 + t * 1.1) * Math.sin(py * 0.06 - t * 0.9);
          var field = sum * 0.62 + ripple - 0.08;   // block only where blobs overlap
          field = field < 0 ? 0 : field > 1 ? 1 : field;

          var u = (px - hx) / hx, v = (py - hy) / hy;
          var r = Math.sqrt(u * u + v * v);
          var centre = 1 - smoothstep(0.1, 1.05, r);     // outer ring stays less blocky
          var f = (field * 0.78 + centre * 0.18 + 0.06) * gain * e + (useOld ? oldLevel : level);

          var x0 = cx * K, y0 = cy * K;
          var block = f >= TH && e > 0.55 && r < 0.75;
          var q = f / TH; q = q < 0 ? 0 : q > 1 ? 1 : q;
          var bayer = BAYER4[by | (cx & 3)];

          if (cm === 'mask') {
            if (block) continue;                       // live page shows through
            var hole = Math.floor(q * (K - 1) + bayer - 0.25);
            if (hole < 0) hole = 0;
            if (hole > K - 1) hole = K - 1;
            write(d, DW, x0, y0, K, BG[0], BG[1], BG[2], 255);
            if (hole) {
              var o = (K - hole) >> 1;
              write(d, DW, x0 + o, y0 + o, hole, 0, 0, 0, 0);
            }
            continue;
          }

          if (block && cm === 'content') {
            var ba = e > 0.85 ? 1 : e > 0.7 ? 0.72 : 0.45;
            (useOld ? m2 : m)[ci * 4 + 3] = 255 * ba * cvis;
            continue;
          }

          var L, r, g, bl;
          if (cm === 'content') {
            var A = useOld ? old.rgb : rgb, Lm = useOld ? old.lum : lum;
            L = Lm[ci]; r = A[ci * 3]; g = A[ci * 3 + 1]; bl = A[ci * 3 + 2];
          } else {
            L = EMPTY_L; r = EMPTY_RGB[0]; g = EMPTY_RGB[1]; bl = EMPTY_RGB[2];
            if (block) q = 1;
          }

          // size follows the field first (clumps → empty), brightness second
          // the page's brightness sets the dot size everywhere, so it stays
          // readable; blobs swell the dots (and add faint texture in the dark)
          var size = L * (0.62 + 0.5 * q) + 0.1 * q - 0.03;
          var s = Math.floor(size * (K - 1) + bayer);
          if (s <= 0) continue;
          if (s > K - 1) s = K - 1;

          var a = (0.55 + 0.45 * q) * Math.min(1, e * 1.3) * cvis;
          a = Math.ceil(a * 4) / 4;                   // stepped, like the paper edges
          if (a <= 0) continue;

          var off = (K - s) >> 1;
          write(d, DW, x0 + off, y0 + off, s, r, g, bl, 255 * a);
        }
      }

      var cw = canvas.width, ch = canvas.height;
      var gw = cols * C * dpr, gh = rows * C * dpr;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, cw, ch);
      ctx.imageSmoothingEnabled = false;

      var oldBlocks = tp < 2 && old.mode === 'content' && old.src;
      if (oldBlocks) {
        // old blocks go through a scratch canvas so the new ones can follow
        if (blk.width !== cw || blk.height !== ch) { blk.width = cw; blk.height = ch; }
        m2ctx.putImageData(m2Img, 0, 0);
        blkCtx.globalCompositeOperation = 'source-over';
        blkCtx.clearRect(0, 0, cw, ch);
        blkCtx.imageSmoothingEnabled = false;
        blkCtx.drawImage(mask2, 0, 0, gw, gh);
        blkCtx.globalCompositeOperation = 'source-in';
        blkCtx.imageSmoothingEnabled = true;
        blkCtx.drawImage(old.src, 0, 0, W * dpr, H * dpr);
        blkCtx.globalCompositeOperation = 'source-over';
      }
      if (mode === 'content' && src) {
        mctx.putImageData(mImg, 0, 0);
        ctx.drawImage(mask, 0, 0, gw, gh);
        ctx.globalCompositeOperation = 'source-in';
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(src, 0, 0, W * dpr, H * dpr);
        ctx.globalCompositeOperation = 'source-over';
        ctx.imageSmoothingEnabled = false;
      }
      if (oldBlocks) ctx.drawImage(blk, 0, 0);

      dctx.putImageData(dImg, 0, 0);
      ctx.drawImage(dots, 0, 0, gw, gh);
    }

    function loop(now) {
      raf = 0;
      if (!running) return;
      if (now - last >= (busy ? BUSY_GAP : FPS_GAP) || ((tween || trans) && !busy)) { last = now; draw(now); }
      if (REDUCED_MQ.matches && !tween && !trans) { draw(now); return; }   // one still frame
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true;
      prevNow = performance.now();
      if (!raf) raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
    function kick() { if (running && !raf) raf = requestAnimationFrame(loop); }

    var easeInOut = function (x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
    var easeOut = function (x) { return 1 - Math.pow(1 - x, 3); };

    function animate(to, dur, ease) {
      if (REDUCED_MQ.matches || !running) dur = 1;
      tween = { from: level, to: to, t0: performance.now(), dur: dur, ease: ease };
      kick();
      if (!running) draw(performance.now() + dur);
    }

    /* dissolve everything, then run fn */
    function cover(fn) {
      if (fn) waiters.push(fn);
      if (!tween && level <= -0.999) {
        var w = waiters; waiters = []; w.forEach(function (f) { f(); });
        return;
      }
      if (tween && tween.to <= -1) return;
      animate(-1, 380 * Math.max(0.25, level + 1), easeInOut);
    }

    function reveal(to) {
      animate(to === undefined ? 0 : to, 900, easeOut);
    }

    function hold() { tween = null; trans = null; prev.live = null; waiters = []; level = -1; draw(performance.now()); }

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; }
      else { prevNow = performance.now(); kick(); }
    });
    resize();

    return {
      setBusy: function (b) { busy = !!b; },
      setLive: setLive,
      setSource: setSource, crossTo: crossTo, cover: cover, reveal: reveal, hold: hold,
      start: start, stop: stop, resize: resize,
      size: function () { return { w: W, h: H, dpr: dpr }; }
    };
  }

  /* ------------------------------------------------------------------
     Split-view preview
     Each project page has a pre-rendered picture of its top (made by
     tools/make-previews.py, at a phone and a tablet width) plus a list of
     where its videos sit. The renderer dithers the picture and the videos
     are played here and painted over it, so nothing of the project page
     itself has to load. Projects without a page show their card's
     animation instead.
     ------------------------------------------------------------------ */
  /* opts.inBox: the pane sits in the lower half of an open card on
     desktop. Its loading state is faint drifting dots rather than the
     card's animation (that's already showing just above), it uses the
     widest pre-rendered page and shows its middle (the content column),
     and it's quicker, since the card is opening at the same time. */
  function makePreview(pane, opts) {
    opts = opts || {};
    var noop = { show: function () {}, nudge: function () {}, unload: function () {}, resume: function () {}, cover: function (f) { if (f) f(); }, pause: function () {} };
    if (!pane) return noop;

    var stage = pane.querySelector(opts.inBox ? '.bpv-stage' : '.preview-stage');
    var link = pane.querySelector(opts.inBox ? '.bpv-open' : '.preview-open');
    var ctaEl = pane.querySelector(opts.inBox ? '.bpv-cta' : '.preview-cta');
    var R = createRenderer(pane.querySelector(opts.inBox ? '.bpv-dither' : '.preview-dither'), stage);

    var PS = 0.72;          // how far the page is zoomed out in the pane
    var MIN_LOAD = opts.inBox ? 900 : 1400;    // the loading animation always gets this long
    var DISSOLVE = opts.inBox ? 1700 : 2100;
    var UNSCRAMBLE = opts.inBox ? 1300 : 1600; // VIEW PROJECT settles a little before the dissolve ends
    var TICK = 70;          // ms between scrambled-letter changes
    var CROP_W = 820;       // in-box: page px across, centred (the content column of the 1100 px render)

    var manifest = null;
    var manifestP = fetch('assets/preview/previews.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; })
      .then(function (j) { manifest = j; return j; });

    // videos play in here, under the navy cover, and are copied into the canvas
    var holder = document.createElement('div');
    holder.className = opts.inBox ? 'bpv-media' : 'preview-media';
    holder.setAttribute('aria-hidden', 'true');
    stage.insertBefore(holder, stage.firstChild);

    var token = 0, current = null, cycleTimer = 0, loadTimer = 0;
    var playing = [];
    var images = {};

    function loadImage(url) {
      if (!images[url]) {
        images[url] = new Promise(function (resolve, reject) {
          var im = new Image();
          im.decoding = 'async';
          im.onload = function () { resolve(im); };
          im.onerror = function () { delete images[url]; reject(new Error('img')); };
          im.src = url;
        });
      }
      return images[url];
    }

    function makeVideo(src) {
      var v = document.createElement('video');
      v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
      v.preload = 'auto';
      v.src = src;
      holder.appendChild(v);
      playing.push(v);
      var pr = v.play();
      if (pr && pr.catch) pr.catch(function () {});
      return v;
    }

    function clearMedia() {
      playing.forEach(function (v) {
        try { v.pause(); v.removeAttribute('src'); v.load(); } catch (_) {}
        if (v.parentNode) v.parentNode.removeChild(v);
      });
      playing = [];
    }

    function setState(s) { pane.setAttribute('data-state', s); }

    function setLink(p) {
      link.removeAttribute('target');
      link.removeAttribute('rel');
      link.removeAttribute('aria-disabled');
      if (p.href) {
        link.setAttribute('href', p.href);
        link.setAttribute('aria-label', 'Open ' + p.title);
        label('LOADING');            // becomes VIEW PROJECT when the page is in
      } else if (p.external) {
        link.setAttribute('href', p.external);
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener');
        link.setAttribute('aria-label', 'Open ' + p.title + ' in a new tab');
        label('VISIT ' + new URL(p.external).host.toUpperCase());
      } else {
        link.removeAttribute('href');
        link.setAttribute('aria-disabled', 'true');
        link.setAttribute('aria-label', p.title + ', coming soon');
        label('COMING SOON');
      }
    }

    /* the label in the middle of the pane. With scramble, the new text
       resolves left to right out of random characters. */
    var labelTimer = 0;
    var GLYPHS = '!@#$%^&*()_+?><:{}[]';
    function label(text, ms) {
      clearInterval(labelTimer);
      if (!ms || REDUCED_MQ.matches) { ctaEl.textContent = text; return; }
      var n = text.length, t0 = performance.now();
      // letters settle one after another, the last one exactly at ms;
      // the unsettled ones change every TICK
      var shownTick = -1, shownFixed = -1, tail = '';
      labelTimer = setInterval(function () {
        var el = performance.now() - t0, p = el / ms, tk = Math.floor(el / TICK);
        var fixed = Math.min(n, Math.floor(p * n));
        if (p < 1 && tk === shownTick && fixed === shownFixed) return;
        if (tk !== shownTick || !tail) {              // new random letters only once per tick
          tail = '';
          for (var k = 0; k < n; k++) tail += text.charAt(k) === ' ' ? ' ' : GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        }
        shownTick = tk; shownFixed = fixed;
        ctaEl.textContent = text.substring(0, fixed) + tail.substring(fixed);
        if (p >= 1) { clearInterval(labelTimer); ctaEl.textContent = text; }
      }, 30);
    }

    /* the pre-rendered width closest to how wide the page is in this pane */
    function pickVariant(entry) {
      var want = (stage.clientWidth || 360) / PS, best = null;
      Object.keys(entry).forEach(function (k) {
        var v = entry[k];
        if (opts.inBox) { if (!best || v.w > best.w) best = v; return; }
        if (!best || Math.abs(v.w - want) < Math.abs(best.w - want)) best = v;
      });
      return best;
    }

    /* the part of the page across the pane, in page px: in a card, the
       middle CROP_W of the wide render; otherwise the full width */
    function viewOf(v) {
      var w = opts.inBox ? Math.min(v.w, CROP_W) : v.w;
      return { x: (v.w - w) / 2, w: w };
    }

    /* the picture, cut to the pane's shape (page width across, from the top) */
    function crop(img, v) {
      var c = document.createElement('canvas');
      var view = viewOf(v), s = img.naturalWidth / v.w;
      var cw = Math.round(view.w * s);
      var ch = Math.round(cw * (stage.clientHeight || 1) / (stage.clientWidth || 1));
      c.width = cw; c.height = ch;
      var x = c.getContext('2d');
      x.fillStyle = '#051220';
      x.fillRect(0, 0, cw, ch);
      x.drawImage(img, -Math.round(view.x * s), 0);
      return c;
    }

    var BLENDS = { lighten: 1, screen: 1, multiply: 1, darken: 1, overlay: 1, 'color-dodge': 1, difference: 1 };

    /* paints the page's videos (or their stills, until they play) where
       they sit on the page */
    /* 'assets/anim/steeringAnim-960.mp4' -> 'steeringAnim' */
    function animKey(url) {
      return String(url || '').split('?')[0].split('/').pop().replace(/(-960|-1280)?\.(mp4|webm)$/i, '');
    }

    function pageLayer(v, box) {
      // the page's header animation is the same clip as the card's, so the
      // card's own (already playing) video is drawn there: the loading
      // animation carries straight on into the page instead of restarting
      var cardVid = box && box.querySelector('video.anims');
      var cardKey = cardVid ? animKey(cardVid.currentSrc || cardVid.getAttribute('src')) : null;
      // only the media that's actually inside the pane, and the small phone
      // copies of the clips (the pane shows them a few hundred px wide)
      var view = viewOf(v);
      var shownH = view.w * (stage.clientHeight || 1) / (stage.clientWidth || 1);
      var small = (stage.clientWidth || 0) < 700;
      var items = (v.media || []).filter(function (m) { return m.r[1] < shownH; }).map(function (m) {
        var same = cardKey && animKey(m.src) === cardKey;
        var src = small ? m.src.replace(/^assets\/web\/([^/]+\.mp4)$/, 'assets/web/sm/$1') : m.src;
        var it = { m: m, vid: same ? cardVid : makeVideo(src), still: null };
        if (m.poster) loadImage(m.poster).then(function (im) { it.still = im; }, function () {});
        return it;
      });
      return function paint(ctx, w) {
        var k = w / view.w, ox = view.x;
        for (var i = 0; i < items.length; i++) {
          var it = items[i], m = it.m, el = null, nw, nh;
          if (it.vid.readyState >= 2 && it.vid.videoWidth) { el = it.vid; nw = el.videoWidth; nh = el.videoHeight; }
          else if (it.still) { el = it.still; nw = el.naturalWidth; nh = el.naturalHeight; }
          if (!el || !nw || !nh) continue;
          var dx = m.r[0] - ox, dy = m.r[1], dw = m.r[2], dh = m.r[3];
          var sx = 0, sy = 0, sw = nw, sh = nh, sc;
          if (m.fit === 'cover') {
            sc = Math.max(dw / nw, dh / nh); sw = dw / sc; sh = dh / sc; sx = (nw - sw) / 2; sy = (nh - sh) / 2;
          } else if (m.fit !== 'fill') {      // contain (and the default for video)
            sc = Math.min(dw / nw, dh / nh); dx += (dw - nw * sc) / 2; dy += (dh - nh * sc) / 2; dw = nw * sc; dh = nh * sc;
          }
          ctx.save();
          ctx.beginPath();
          ctx.rect((m.clip[0] - ox) * k, m.clip[1] * k, m.clip[2] * k, m.clip[3] * k);
          ctx.clip();
          ctx.globalAlpha = Math.min(1, m.op);
          if (m.filter && m.filter !== 'none') ctx.filter = m.filter;
          ctx.globalCompositeOperation = BLENDS[m.blend] ? m.blend : 'source-over';
          try { ctx.drawImage(el, sx, sy, sw, sh, dx * k, dy * k, dw * k, dh * k); } catch (_) {}
          ctx.restore();
        }
      };
    }

    /* a card's animation, centred and enlarged (black drops out) */
    function cardLayer(box, el, zoom) {
      el = el || box.querySelector('.anims');
      if (!el) return null;
      var isVideo = el.tagName === 'VIDEO';
      zoom = zoom || parseFloat(box.getAttribute('data-preview-zoom')) || 2.3;
      return function paint(ctx, w, h) {
        var nw = isVideo ? el.videoWidth : el.naturalWidth, nh = isVideo ? el.videoHeight : el.naturalHeight;
        if (isVideo ? el.readyState < 2 : !el.complete) return;
        if (!nw || !nh) return;
        // most card renders have wide empty margins, so scale up past 'contain'
        var k = Math.min(w / nw, h / nh) * zoom;
        var dw = nw * k, dh = nh * k;
        ctx.globalCompositeOperation = 'lighten';
        try { ctx.drawImage(el, (w - dw) / 2, (h - dh) / 2, dw, dh); } catch (_) {}
        ctx.globalCompositeOperation = 'source-over';
      };
    }

    function show(box) {
      var p = projectOf(box);
      var my = ++token;
      current = box;
      clearTimeout(cycleTimer);
      clearTimeout(loadTimer);
      clearMedia();
      setLink(p);
      link.classList.remove('nudge');
      R.start();

      wake(box.querySelector('video[data-lazy]'));
      var card = opts.inBox ? null : cardLayer(box);

      // no page of ours: the card's own animation, live, or a longer clip
      // made just for the preview (TUBAA: both propellers in one loop)
      if (!p.href) {
        setState('static');
        var own = box.getAttribute('data-preview-src');
        if (own) card = cardLayer(box, makeVideo(own));
        R.crossTo(null, card ? 'content' : 'empty', card, { dur: DISSOLVE });
        return;
      }

      // the loading animation (the card's animation, dimmed) plays for a
      // moment, then the page dissolves in over it
      setState('loading');
      R.crossTo(null, card ? 'content' : 'empty', card, { dur: 700, level: card ? -0.15 : (opts.inBox ? -0.45 : -0.3) });
      var t0 = performance.now();

      manifestP.then(function () {
        if (my !== token) return null;
        var entry = manifest && manifest[p.href];
        if (!entry) throw new Error('no preview');
        var v = pickVariant(entry);
        return loadImage(v.img).then(function (img) {
          if (my !== token) return;
          var base = crop(img, v);
          var live = pageLayer(v, box); // videos start now, so they're ready for the reveal
          loadTimer = setTimeout(function () {
            if (my !== token) return;
            setState('frame');
            // the label unscrambles while the page dithers in, done just before it
            label('VIEW PROJECT', UNSCRAMBLE);
            R.crossTo(base, 'content', live, { dur: DISSOLVE, ease: 'linear' });
          }, Math.max(0, MIN_LOAD - (performance.now() - t0)));
        });
      }).catch(function () {
        if (my !== token) return;
        setState('static');
        label('VIEW PROJECT', 600);
        R.reveal(0);
      });
    }

    function nudge() {
      link.classList.remove('nudge');
      void link.offsetWidth;        // restart the animation
      link.classList.add('nudge');
    }

    function unload() {
      token++;
      current = null;
      clearTimeout(cycleTimer);
      clearTimeout(loadTimer);
      clearMedia();
      R.stop();
      R.hold();
      setState('loading');
    }

    var paused = false;
    function resume() {
      if (!current || paused) return;
      R.start();
      playing.forEach(function (v) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); });
    }

    /* off screen (scrolled away along the strip): stop drawing and decoding */
    function pause(off) {
      paused = !!off;
      if (!current) return;
      if (paused) { R.stop(); playing.forEach(function (v) { if (!v.paused) v.pause(); }); }
      else resume();
    }

    /* dither the picture away, then run fn (the pane is then dropped) */
    function cover(fn) {
      token++;
      clearTimeout(cycleTimer);
      clearTimeout(loadTimer);
      R.cover(fn);
    }

    // phones pause background video when the tab is hidden
    document.addEventListener('visibilitychange', function () { if (!document.hidden) resume(); });

    return { show: show, nudge: nudge, unload: unload, resume: resume, pause: pause, cover: cover, box: function () { return current; } };
  }

  var Preview = makePreview(document.getElementById('preview'));

  /* ------------------------------------------------------------------
     Desktop: the preview inside the open card
     Two panes take turns. Opening a card takes a free pane (or the one
     still fading out of the last card, cut short), moves it into the
     card and starts it; closing one dithers its picture away while the
     card shrinks, then puts the pane back.
     ------------------------------------------------------------------ */
  var InBox = (function () {
    var slots = [0, 1].map(function () {
      var el = document.createElement('div');
      el.className = 'bpv';
      el.setAttribute('data-state', 'loading');
      el.innerHTML =
        '<div class="bpv-stage">' +
          '<canvas class="bpv-dither" aria-hidden="true"></canvas>' +
          '<a class="bpv-open" href="#"><span class="bpv-cta">LOADING</span></a>' +
        '</div>';
      var s = { el: el, box: null, leaving: false, timer: 0, P: null };
      s.P = makePreview(el, { inBox: true });
      // the pane is the way into the project; keep the click off the card
      // (which would close it) and go through the loading screen
      el.querySelector('.bpv-open').addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (s.box && !s.leaving && s.box.classList.contains('active')) openProject(s.box);
      });
      el.addEventListener('click', function (e) { e.stopPropagation(); });
      return s;
    });

    // pause the pane while its card is scrolled out of view
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        slots.forEach(function (s) { if (s.el === e.target && !s.leaving) s.P.pause(!e.isIntersecting); });
      });
    }, { root: track, rootMargin: '0px 10% 0px 10%' }) : null;

    function drop(s) {
      clearTimeout(s.timer);
      if (io) io.unobserve(s.el);
      s.P.unload();
      if (s.el.parentNode) s.el.parentNode.removeChild(s.el);
      s.box = null;
      s.leaving = false;
    }

    function slotFor(box) {
      for (var i = 0; i < slots.length; i++) if (slots[i].box === box) return slots[i];
      return null;
    }

    function mount(box, delay) {
      var s = slotFor(box);
      if (s && !s.leaving) return;
      if (s) drop(s);                      // reopened while it was closing: start over
      s = slots.filter(function (x) { return !x.box; })[0] ||
          slots.filter(function (x) { return x.leaving; })[0] || slots[0];
      if (s.box) drop(s);
      s.box = box;
      s.el.setAttribute('data-state', 'loading');
      box.appendChild(s.el);
      if (io) io.observe(s.el);
      s.P.pause(false);
      clearTimeout(s.timer);
      s.timer = setTimeout(function () { if (s.box === box && !s.leaving) s.P.show(box); }, delay || 120);
    }

    function release(box) {
      var s = slotFor(box);
      if (!s || s.leaving) return;
      s.leaving = true;
      clearTimeout(s.timer);
      s.P.cover(function () {
        // let the card finish closing over it before the pane goes
        s.timer = setTimeout(function () { if (s.leaving) drop(s); }, 500);
      });
      // a safety net in case the renderer was paused off screen
      setTimeout(function () { if (s.leaving && s.box === box) drop(s); }, 2500);
    }

    function clear() { slots.forEach(drop); }

    function resume() { slots.forEach(function (s) { if (s.box && !s.leaving) s.P.resume(); }); }

    return { mount: mount, release: release, clear: clear, resume: resume };
  })();

  /* ------------------------------------------------------------------
     Layout changes (rotate phone, resize window)
     ------------------------------------------------------------------ */
  function enterLayout() {
    if (isSplit()) {
      InBox.clear();
      var box = activeBox() || boxes[0];
      setActive(box);
      // on first load the preview starts 1.5 s into the loading screen:
      // late enough that its loading animation is still showing when the
      // screen dithers away, early enough that the page dissolves in soon after
      if (window.__nvLoading && !window.__nvLoaded) {
        var wait = PREVIEW_DELAY - (performance.now() - (window.__nvLoadStart || 0));
        setTimeout(function () { if (isSplit() && activeBox() === box) Preview.show(box); }, Math.max(0, wait));
      } else {
        Preview.show(box);
      }
      // centre without animating on first paint
      track.scrollLeft = clamp(box.offsetLeft + box.offsetWidth / 2 - track.clientWidth / 2, 0, maxScroll());
    } else {
      Preview.unload();
      var open = activeBox();
      if (open) {
        var first = window.__nvLoading && !window.__nvLoaded;
        InBox.mount(open, first ? Math.max(120, PREVIEW_DELAY - (performance.now() - (window.__nvLoadStart || 0))) : 120);
      }
    }
    placeHandle(true);
  }

  function onMQChange() { cancelFollow(); enterLayout(); }
  if (SPLIT_MQ.addEventListener) SPLIT_MQ.addEventListener('change', onMQChange);
  else if (SPLIT_MQ.addListener) SPLIT_MQ.addListener(onMQChange);

  // Coming back via the browser back button restores this page from bfcache;
  // make sure the preview is still populated.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    var box = activeBox();
    if (!box) return;
    if (isSplit()) Preview.show(box);
    else { InBox.clear(); InBox.mount(box); }
  });

  enterLayout();
})();
