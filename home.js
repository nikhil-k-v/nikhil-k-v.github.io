/* =====================================================================
   HOME PAGE — carousel + split-screen preview
   Layout breakpoints must match home.css.
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

  var WHEEL_GAIN = 0.4;   // same feel as the old window.scrollBy(deltaY * 0.4)

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
    if (p.href) window.location.href = p.href;
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

    // Desktop / compact: original toggle behaviour.
    if (wasActive) { setActive(null); return; }
    setActive(box);
    if (isCompact()) followActive(box);
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
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var i = boxes.indexOf(box) + (e.key === 'ArrowRight' ? 1 : -1);
        if (boxes[i]) { boxes[i].focus({ preventScroll: false }); }
      }
    });

    var btn = box.querySelector('.see-more');
    if (btn) {
      var linked = !!(p.href || p.external);
      if (!linked) btn.setAttribute('aria-disabled', 'true');
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (linked && box.classList.contains('active')) openProject(box);
      });
    }
  });

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
    var C = 7;              // cell size, css px
    var K = 7;              // sub-pixels per cell edge (1 css px each) → dot sizes 1..6
    var TH = 0.8;           // field value above which a cell becomes a block (kept rare)
    var SPEED = 1.8;        // overall animation speed
    var FPS_GAP = 31;       // ~30 fps is plenty for this and kind to batteries
    var BG = [5, 18, 32];   // --dark-primary: the page colour, so empty page blends in
    var EMPTY_RGB = [52, 92, 132], EMPTY_L = 0.34;
    var BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (var b = 0; b < 16; b++) BAYER4[b] = (BAYER4[b] + 0.5) / 16;

    var ctx = canvas.getContext('2d');
    var dots = document.createElement('canvas'), dctx = dots.getContext('2d');
    var mask = document.createElement('canvas'), mctx = mask.getContext('2d');

    var W = 0, H = 0, dpr = 1, cols = 0, rows = 0, dImg = null, mImg = null;
    var src = null, mode = 'empty', rgb = null, lum = null;
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
      dImg = dctx.createImageData(dots.width, dots.height);
      mImg = mctx.createImageData(cols, rows);
      sample();
      if (!running) draw(prevNow || performance.now());
    }

    /* average colour + brightness of every cell, once per source */
    function sample() {
      rgb = lum = null;
      if (!src || !cols) return;
      var tmp = document.createElement('canvas');
      tmp.width = cols; tmp.height = rows;
      var t = tmp.getContext('2d');
      t.imageSmoothingEnabled = true;
      t.imageSmoothingQuality = 'high';
      t.fillStyle = 'rgb(' + BG + ')';
      t.fillRect(0, 0, cols, rows);
      t.drawImage(src, 0, 0, W / C, H / C);
      var d;
      try { d = t.getImageData(0, 0, cols, rows).data; } catch (_) { return; }
      var n = cols * rows;
      rgb = new Uint8ClampedArray(n * 3);
      lum = new Float32Array(n);
      for (var i = 0; i < n; i++) {
        var r = d[i * 4], g = d[i * 4 + 1], bl = d[i * 4 + 2];
        // lift dark-but-present colour so dots stay visible on the navy
        rgb[i * 3]     = Math.min(255, r * 1.15 + 22);
        rgb[i * 3 + 1] = Math.min(255, g * 1.15 + 22);
        rgb[i * 3 + 2] = Math.min(255, bl * 1.15 + 22);
        var y = (0.2126 * r + 0.7152 * g + 0.0722 * bl) / 255;
        var mx = Math.max(r, g, bl) / 255;
        lum[i] = Math.pow(Math.max(0, Math.max((y - 0.08) / 0.92, (mx - 0.14) * 0.8)), 0.7);
      }
    }

    function setSource(canvasOrNull, m) {
      src = canvasOrNull;
      mode = m;
      sample();
      if (mode === 'content' && !rgb) mode = 'empty';   // tainted or empty source
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

      var vis = level < -1 ? 0 : level > 0 ? 1 : 1 + level;
      var d = dImg.data, m = mImg.data, DW = cols * K;
      d.fill(0);
      m.fill(0);

      // whole pane drifts between "a few solid clumps" and "all dots"
      var breathe = 0.5 + 0.5 * Math.sin(t * 0.31);
      var gain = 0.8 + 0.2 * breathe;
      var FALL = Math.min(52, Math.min(W, H) * 0.16);      // width of the edge drop-off
      var hx = W / 2, hy = H / 2;
      var spin = t * 0.22, twist = 1.6 + 0.9 * Math.sin(t * 0.17);

      for (var cy = 0; cy < rows; cy++) {
        var py = (cy + 0.5) * C;
        var ey = smoothstep(0, FALL, Math.min(py, H - py));
        var by = (cy & 3) << 2;
        for (var cx = 0; cx < cols; cx++) {
          var px = (cx + 0.5) * C;
          var e = Math.min(ey, smoothstep(0, FALL, Math.min(px, W - px)));
          var ci = cy * cols + cx;

          // centred coords, 0 at the middle, ~1 at the sides
          var u = (px - hx) / hx, v = (py - hy) / hy;
          var r = Math.sqrt(u * u + v * v);
          var inner = r < 1 ? 1 - r : 0;
          // swirl: rotate the pattern more the closer it is to the centre
          var ang = spin + twist * inner * inner;
          var ca = Math.cos(ang), sa = Math.sin(ang);
          var su = u * ca - v * sa, sv = u * sa + v * ca;
          var w1 = Math.sin(su * 4.1 + t * 0.9 + 1.3 * Math.sin(sv * 3.2 - t * 0.7));
          var w2 = Math.sin(sv * 5.2 - t * 0.8 + 1.1 * Math.sin(su * 2.6 + t * 0.6));
          var field = 0.5 + 0.28 * w1 + 0.22 * w2;
          field = (field - 0.5) * 1.7 + 0.5;                    // more contrast: fuller clumps, emptier gaps
          field = field < 0 ? 0 : field > 1 ? 1 : field;
          // blobs gather toward the middle; the outer ring stays dotted
          var centre = 1 - smoothstep(0.1, 1.05, r);
          var f = (field * 0.6 + centre * 0.34 + 0.08) * gain * e + level;

          var x0 = cx * K, y0 = cy * K;
          var block = f >= TH && e > 0.55 && r < 0.75;
          var q = f / TH; q = q < 0 ? 0 : q > 1 ? 1 : q;
          var bayer = BAYER4[by | (cx & 3)];

          if (mode === 'mask') {
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

          if (block && mode === 'content') {
            var ba = e > 0.85 ? 1 : e > 0.7 ? 0.72 : 0.45;
            m[ci * 4 + 3] = 255 * ba * vis;
            continue;
          }

          var L, r, g, bl;
          if (mode === 'content') {
            L = lum[ci]; r = rgb[ci * 3]; g = rgb[ci * 3 + 1]; bl = rgb[ci * 3 + 2];
          } else {
            L = EMPTY_L; r = EMPTY_RGB[0]; g = EMPTY_RGB[1]; bl = EMPTY_RGB[2];
            if (block) q = 1;
          }

          // size follows the field first (clumps → empty), brightness second
          var size = Math.pow(q, 1.3) * (0.82 + 0.45 * L) + 0.18 * L - 0.06;
          var s = Math.floor(size * (K - 1) + bayer);
          if (s <= 0) continue;
          if (s > K - 1) s = K - 1;

          var a = (0.45 + 0.55 * q) * Math.min(1, e * 1.3) * vis;
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

      if (mode === 'content' && src) {
        mctx.putImageData(mImg, 0, 0);
        ctx.drawImage(mask, 0, 0, gw, gh);
        ctx.globalCompositeOperation = 'source-in';
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(src, 0, 0, W * dpr, H * dpr);
        ctx.globalCompositeOperation = 'source-over';
        ctx.imageSmoothingEnabled = false;
      }

      dctx.putImageData(dImg, 0, 0);
      ctx.drawImage(dots, 0, 0, gw, gh);
    }

    function loop(now) {
      raf = 0;
      if (!running) return;
      if (now - last >= FPS_GAP || tween) { last = now; draw(now); }
      if (REDUCED_MQ.matches && !tween) { draw(now); return; }   // one still frame
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

    function hold() { tween = null; waiters = []; level = -1; draw(performance.now()); }

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; }
      else { prevNow = performance.now(); kick(); }
    });
    resize();

    return {
      setSource: setSource, cover: cover, reveal: reveal, hold: hold,
      start: start, stop: stop, resize: resize,
      size: function () { return { w: W, h: H, dpr: dpr }; }
    };
  }

  /* ------------------------------------------------------------------
     Split-view preview
     Same-origin project pages load in a hidden iframe, get snapshotted
     once with html2canvas (top of the page, at pane size), and are then
     drawn by the renderer. Snapshots are cached and the iframe is emptied
     afterwards, so the big GIFs don't stay in memory.
     Cross-origin pages (tubaa.dev) can't be snapshotted, so the iframe
     stays live underneath and the renderer runs in 'mask' mode.
     The iframe is navigated with location.replace() so the preview never
     adds entries to the browser's back history.
     ------------------------------------------------------------------ */
  var Preview = (function () {
    var pane = document.getElementById('preview');
    var noop = { show: function () {}, nudge: function () {}, unload: function () {}, resume: function () {} };
    if (!pane) return noop;

    var stage = pane.querySelector('.preview-stage');
    var frame = pane.querySelector('.preview-frame');
    var link = pane.querySelector('.preview-open');
    var ctaEl = pane.querySelector('.preview-cta');
    var R = createRenderer(pane.querySelector('.preview-dither'), stage);

    var H2C_SRC = '/vendor/html2canvas.min.js';
    var PREVIEW_CSS =
      'html,body{overflow:hidden!important;scrollbar-width:none!important}' +
      '::-webkit-scrollbar{display:none!important}' +
      '#back-to-home,.ga-nav{display:none!important}';

    var cache = {};        // url → snapshot canvas
    var token = 0;         // invalidates stale work when the user taps quickly
    var current = null;    // box being previewed

    function absUrl(href) { return new URL(href, window.location.href).href; }
    function samePage(a, b) {
      try {
        var A = new URL(a), B = new URL(b);
        return A.origin === B.origin && A.pathname === B.pathname;
      } catch (_) { return false; }
    }
    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    /* html2canvas has to run inside the project page's own window: its
       document clone resolves relative URLs (stylesheets, images) against
       whichever page called it */
    function loadH2C(win, doc) {
      if (win.html2canvas) return Promise.resolve(win.html2canvas);
      return new Promise(function (resolve, reject) {
        var s = doc.createElement('script');
        s.src = absUrl(H2C_SRC);
        s.onload = function () { win.html2canvas ? resolve(win.html2canvas) : reject(new Error('h2c')); };
        s.onerror = reject;
        (doc.head || doc.documentElement).appendChild(s);
      });
    }

    /* copy into a canvas owned by this page, so the snapshot survives the
       frame being emptied */
    function adopt(c) {
      var out = document.createElement('canvas');
      out.width = c.width; out.height = c.height;
      out.getContext('2d').drawImage(c, 0, 0);
      return out;
    }

    function navigate(url) {
      try { frame.contentWindow.location.replace(url); }
      catch (_) { frame.src = url; }
    }

    function decorate(doc) {
      if (!doc || !doc.documentElement) return;
      doc.documentElement.classList.add('is-preview');
      if (doc.getElementById('__preview_css')) return;
      var s = doc.createElement('style');
      s.id = '__preview_css';
      s.textContent = PREVIEW_CSS;
      (doc.head || doc.documentElement).appendChild(s);
    }

    function setState(s) { pane.setAttribute('data-state', s); }
    function setLive(on) { frame.classList.toggle('is-live', !!on); }

    function setLink(p) {
      link.removeAttribute('target');
      link.removeAttribute('rel');
      link.removeAttribute('aria-disabled');
      if (p.href) {
        link.setAttribute('href', p.href);
        link.setAttribute('aria-label', 'Open ' + p.title);
        ctaEl.textContent = 'VIEW PROJECT';
      } else if (p.external) {
        link.setAttribute('href', p.external);
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener');
        link.setAttribute('aria-label', 'Open ' + p.title + ' in a new tab');
        ctaEl.textContent = 'VISIT ' + new URL(p.external).host.toUpperCase();
      } else {
        link.removeAttribute('href');
        link.setAttribute('aria-disabled', 'true');
        link.setAttribute('aria-label', p.title + ', coming soon');
        ctaEl.textContent = 'COMING SOON';
      }
    }

    /* wait until the page in the frame is parsed and styled, then a little
       longer for the hero image, but never more than ~3s in total */
    function waitForPage(url, my) {
      return new Promise(function (resolve, reject) {
        var start = performance.now();
        var interactiveAt = 0;
        (function poll() {
          if (my !== token) { reject(new Error('stale')); return; }
          var doc = null;
          try { doc = frame.contentDocument; } catch (_) { reject(new Error('cross-origin')); return; }
          var ok = doc && samePage(doc.location.href, url) && doc.readyState !== 'loading';
          if (ok) {
            decorate(doc);
            if (!interactiveAt) interactiveAt = performance.now();
            var since = performance.now() - interactiveAt;
            if (doc.readyState === 'complete' && since > 150) { resolve(doc); return; }
            if (since > 2500) { resolve(doc); return; }
          }
          if (performance.now() - start > 12000) { reject(new Error('timeout')); return; }
          setTimeout(poll, 80);
        })();
      });
    }

    function capture(url, my) {
      navigate(url);
      var doc;
      return waitForPage(url, my).then(function (d) {
        doc = d;
        return loadH2C(frame.contentWindow, doc);
      }).then(function () {
        if (my !== token) throw new Error('stale');
        var fontsReady = doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve();
        return Promise.race([fontsReady, wait(800)]).then(function () {
          if (my !== token) throw new Error('stale');
          var size = R.size();
          var vw = doc.documentElement.clientWidth || frame.clientWidth;
          var vh = doc.documentElement.clientHeight || frame.clientHeight;
          var win = frame.contentWindow;
          win.__snapOpts = {
            backgroundColor: '#051220',
            x: 0, y: 0, scrollX: 0, scrollY: 0,
            width: vw, height: vh,
            windowWidth: vw, windowHeight: vh,
            scale: (size.w * size.dpr) / vw,
            useCORS: true,
            imageTimeout: 3000,
            logging: false
          };
          // started from a script element inside the frame, so the page is
          // the "entry" document and its relative URLs resolve correctly
          var run = doc.createElement('script');
          run.textContent = 'window.__snap = window.html2canvas(document.body, window.__snapOpts);';
          (doc.head || doc.documentElement).appendChild(run);
          if (!win.__snap) throw new Error('h2c');
          return win.__snap.then(adopt);
        });
      });
    }

    /* for projects without a page: the card's own animation on navy */
    function cardSource(box) {
      var img = box.querySelector('img.anims');
      var size = R.size();
      if (!img || !img.complete || !img.naturalWidth || !size.w) return null;
      var c = document.createElement('canvas');
      c.width = Math.round(size.w * size.dpr);
      c.height = Math.round(size.h * size.dpr);
      var x = c.getContext('2d');
      x.fillStyle = '#051220';
      x.fillRect(0, 0, c.width, c.height);
      // the card GIFs have wide empty margins, so scale up past 'contain'
      var k = Math.min(c.width / img.naturalWidth, c.height / img.naturalHeight) * 2.3;
      var w = img.naturalWidth * k, h = img.naturalHeight * k;
      x.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
      return c;
    }

    /* page is ready: swap it in under the dissolve and bring it back */
    function present(box, source, m, my) {
      R.cover(function () {
        if (my !== token) return;
        R.setSource(source, m);
        setState(m === 'empty' ? 'static' : 'frame');
        R.reveal(0);
      });
    }

    function show(box) {
      var p = projectOf(box);
      var my = ++token;
      current = box;
      setLink(p);
      link.classList.remove('nudge');
      R.start();

      R.cover(function () {
        if (my !== token) return;

        // nothing to load
        if (!p.href && !p.external) {
          setLive(false);
          navigate('about:blank');
          var c = cardSource(box);
          present(box, c, c ? 'content' : 'empty', my);
          return;
        }

        // external site: keep it live underneath, dots are holes in a cover
        if (!p.href) {
          R.setSource(null, 'mask');
          setState('loading');
          setLive(true);
          navigate(p.external);
          var done = false;
          var finish = function () {
            if (done || my !== token) return;
            done = true;
            setState('frame');
            R.reveal(0);
          };
          frame.addEventListener('load', function onLoad() {
            var blank = false;
            try { blank = frame.contentWindow.location.href === 'about:blank'; } catch (_) {}
            if (blank) return;
            frame.removeEventListener('load', onLoad);
            setTimeout(finish, 300);
          });
          setTimeout(finish, 6000);
          return;
        }

        // project page: snapshot (or use the cached one)
        var url = absUrl(p.href);
        if (cache[url]) {
          setLive(false);
          present(box, cache[url], 'content', my);
          return;
        }

        setLive(false);
        R.setSource(null, 'empty');
        setState('loading');
        R.reveal(-0.3);                       // faint idle dots while it loads

        capture(url, my).then(function (snap) {
          cache[url] = snap;
          if (my !== token) return;
          navigate('about:blank');            // free the page, keep the picture
          present(box, snap, 'content', my);
        }).catch(function (err) {
          if (my !== token || (err && err.message === 'stale')) return;
          // couldn't draw it: fall back to the live page under the dot mask
          R.cover(function () {
            if (my !== token) return;
            R.setSource(null, 'mask');
            setLive(true);
            setState('frame');
            R.reveal(0);
          });
        });
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
      setLive(false);
      R.stop();
      R.hold();
      navigate('about:blank');
      setState('loading');
    }

    function resume() {
      if (!current) return;
      R.start();
    }

    return { show: show, nudge: nudge, unload: unload, resume: resume };
  })();

  /* ------------------------------------------------------------------
     Layout changes (rotate phone, resize window)
     ------------------------------------------------------------------ */
  function enterLayout() {
    if (isSplit()) {
      var box = activeBox() || boxes[0];
      setActive(box);
      Preview.show(box);
      // centre without animating on first paint
      track.scrollLeft = clamp(box.offsetLeft + box.offsetWidth / 2 - track.clientWidth / 2, 0, maxScroll());
    } else {
      Preview.unload();
    }
    placeHandle(true);
  }

  function onMQChange() { cancelFollow(); enterLayout(); }
  if (SPLIT_MQ.addEventListener) SPLIT_MQ.addEventListener('change', onMQChange);
  else if (SPLIT_MQ.addListener) SPLIT_MQ.addListener(onMQChange);

  // Coming back via the browser back button restores this page from bfcache;
  // make sure the preview is still populated.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && isSplit()) {
      var box = activeBox();
      if (box) Preview.show(box);
    }
  });

  enterLayout();
})();
