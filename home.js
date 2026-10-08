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
    var C = 4;              // cell size, css px
    var K = 4;              // sub-pixels per cell edge (1 css px each) → dot sizes 1..3
    var TH = 0.8;           // field value above which a cell becomes a block (kept rare)
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
      if (live) compose();
      sample();
      if (!running) draw(prevNow || performance.now());
    }

    /* Per-cell colour and "ink" amount. Each cell is sampled 3x3 so thin
       things (text strokes, wireframe lines) still register; detail inside
       the cell drives the dot size and flat fills (a big white sheet, a soft
       glow) are toned down, so the page's features carry the picture. */
    var sampCv = document.createElement('canvas'), sampCtx = sampCv.getContext('2d', { willReadFrequently: true });
    function sample() {
      if (!src || !cols) { rgb = lum = null; return; }
      var S = 3, sw = cols * S, sh = rows * S;
      if (sampCv.width !== sw || sampCv.height !== sh) { sampCv.width = sw; sampCv.height = sh; }
      var t = sampCtx;
      t.imageSmoothingEnabled = true;
      t.imageSmoothingQuality = 'high';
      t.fillStyle = 'rgb(' + BG + ')';
      t.fillRect(0, 0, sw, sh);
      t.drawImage(src, 0, 0, W * S / C, H * S / C);
      var d;
      try { d = t.getImageData(0, 0, sw, sh).data; } catch (_) { rgb = lum = null; return; }
      var n = cols * rows;
      if (!rgb || rgb.length !== n * 3) { rgb = new Uint8ClampedArray(n * 3); lum = new Float32Array(n); }

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
    var base = null, live = null, liveAt = 0;
    var work = document.createElement('canvas'), workCtx = work.getContext('2d');
    var LIVE_GAP = 66;      // refresh moving media ~15 times a second

    function compose() {
      var w = Math.round(W * dpr), h = Math.round(H * dpr);
      if (work.width !== w || work.height !== h) { work.width = w; work.height = h; }
      workCtx.globalCompositeOperation = 'source-over';
      workCtx.globalAlpha = 1;
      workCtx.filter = 'none';
      workCtx.fillStyle = 'rgb(' + BG + ')';
      workCtx.fillRect(0, 0, w, h);
      if (base) workCtx.drawImage(base, 0, 0, w, h);
      try { live(workCtx, w, h); } catch (_) {}
      workCtx.filter = 'none';
      workCtx.globalAlpha = 1;
      src = work;
    }

    function setSource(canvasOrNull, m, liveFn) {
      base = canvasOrNull;
      live = liveFn || null;
      mode = m;
      if (live && W) compose(); else src = base;
      sample();
      if (mode === 'content' && !rgb) mode = 'empty';   // tainted or empty source
    }

    function setLive(liveFn) {
      live = liveFn || null;
      if (mode !== 'content') return;
      if (live && W) compose(); else src = base;
      sample();
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

      if (live && mode === 'content' && !busy && now - liveAt >= LIVE_GAP) {
        liveAt = now;
        compose();
        sample();
        if (!rgb) { mode = 'empty'; live = null; }
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
        var by = (cy & 3) << 2;
        for (var cx = 0; cx < cols; cx++) {
          var px = (cx + 0.5) * C;
          var e = Math.min(ey, smoothstep(0, FALL, Math.min(px, W - px)));
          var ci = cy * cols + cx;

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
          var f = (field * 0.78 + centre * 0.18 + 0.06) * gain * e + level;

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
          // the page's brightness sets the dot size everywhere, so it stays
          // readable; blobs swell the dots (and add faint texture in the dark)
          var size = L * (0.62 + 0.5 * q) + 0.1 * q - 0.03;
          var s = Math.floor(size * (K - 1) + bayer);
          if (s <= 0) continue;
          if (s > K - 1) s = K - 1;

          var a = (0.55 + 0.45 * q) * Math.min(1, e * 1.3) * vis;
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
      if (now - last >= (busy ? BUSY_GAP : FPS_GAP) || (tween && !busy)) { last = now; draw(now); }
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
      setBusy: function (b) { busy = !!b; },
      setLive: setLive,
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
    if (/[?&]previewdebug\b/.test(location.search)) window.__previewCache = cache;
    var token = 0;         // invalidates stale work when the user taps quickly
    var current = null;    // box being previewed

    function absUrl(href) { return new URL(href, window.location.href).href; }
    function samePage(a, b) {
      try {
        var A = new URL(a), B = new URL(b);
        return A.origin === B.origin && A.pathname === B.pathname;
      } catch (_) { return false; }
    }

    /* html2canvas has to run inside the project page's own window: its
       document clone resolves relative URLs (stylesheets, images) against
       whichever page called it */
    var h2cSource = null;
    function fetchH2C() {
      if (!h2cSource) {
        h2cSource = fetch(absUrl(H2C_SRC)).then(function (r) {
          if (!r.ok) throw new Error('h2c ' + r.status);
          return r.text();
        });
        h2cSource.catch(function () { h2cSource = null; });
      }
      return h2cSource;
    }

    /* The library is fetched once by this page, then its source is run as an
       inline script inside each project page. Loading it as a separate file
       from inside the frame queued it behind all of that page's videos. */
    function loadH2C(win, doc) {
      if (win.html2canvas) return Promise.resolve(win.html2canvas);
      return fetchH2C().then(function (src) {
        var s = doc.createElement('script');
        s.textContent = src;
        (doc.head || doc.documentElement).appendChild(s);
        if (!win.html2canvas) throw new Error('h2c');
        return win.html2canvas;
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
    function setLive(on) { stage.classList.toggle('is-live', !!on); }

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
    /* A project page starts downloading every video (tens of MB each) and
       every photo as soon as it parses, and that traffic is what made
       snapshots slow. So while the page loads in the hidden frame:
         - every video's source is parked (download aborted) until the
           snapshot is done; then only the videos in the first screen get
           theirs back (see wakeMedia)
         - images below the first screen are dropped for good */
    function starve(doc) {
      var vids = doc.getElementsByTagName('video');
      for (var i = 0; i < vids.length; i++) {
        var v = vids[i];
        if (v.__pv) continue;
        v.__pv = { src: v.getAttribute('src'), sources: [] };
        try {
          v.pause();
          v.removeAttribute('autoplay');
          if (v.__pv.src) v.removeAttribute('src');
          var srcs = v.getElementsByTagName('source');
          for (var j = 0; j < srcs.length; j++) {
            v.__pv.sources.push(srcs[j].getAttribute('src'));
            srcs[j].removeAttribute('src');
          }
          v.load();                     // aborts any download in flight
        } catch (_) {}
      }
      if (doc.readyState === 'loading') return;   // no reliable layout yet
      var vh = doc.documentElement.clientHeight;
      var imgs = doc.images;
      for (var k = 0; k < imgs.length; k++) {
        var im = imgs[k];
        if (im.__pv || im.complete) continue;
        if (im.getBoundingClientRect().top > vh * 1.1) {
          im.__pv = true;
          im.removeAttribute('srcset');
          im.removeAttribute('src');
        }
      }
    }

    /* give the first-screen videos their sources back and start them */
    function wakeMedia(doc) {
      var vh = doc.documentElement.clientHeight;
      var vids = doc.getElementsByTagName('video');
      for (var i = 0; i < vids.length; i++) {
        var v = vids[i], pv = v.__pv;
        var r = v.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= vh) continue;
        try {
          if (pv && !pv.woken) {
            pv.woken = true;
            if (pv.src) v.setAttribute('src', pv.src);
            var srcs = v.getElementsByTagName('source');
            for (var j = 0; j < srcs.length; j++) if (pv.sources[j]) srcs[j].setAttribute('src', pv.sources[j]);
            v.preload = 'auto';
            v.load();
          }
          v.muted = true;
          v.loop = true;
          v.playsInline = true;
          if (v.paused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        } catch (_) {}
      }
    }

    /* Paints the page's first-screen images, GIFs and videos into the
       preview each refresh, at their place on the page, so they load in
       and move. Positions are re-read twice a second in case the page's
       own scripts resize things. */
    var BLENDS = { lighten: 1, screen: 1, multiply: 1, darken: 1, overlay: 1, 'color-dodge': 1, difference: 1 };
    function mediaLayer(doc, my) {
      var items = [], scanned = 0;

      function clipBox(el, win) {
        for (var p = el.parentElement; p && p !== doc.body && p !== doc.documentElement; p = p.parentElement) {
          var cs = win.getComputedStyle(p);
          if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') return p.getBoundingClientRect();
        }
        return null;
      }

      function scan() {
        var win = doc.defaultView;
        if (!win) return;
        var vw = doc.documentElement.clientWidth, vh = doc.documentElement.clientHeight;
        items = [];
        var els = doc.querySelectorAll('img, video');
        for (var i = 0; i < els.length; i++) {
          var el = els[i], r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2 || r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) continue;
          var cs = win.getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          var op = 1;
          for (var a = el; a && a.nodeType === 1; a = a.parentElement) op *= parseFloat(win.getComputedStyle(a).opacity) || 0;
          if (op <= 0.01) continue;
          var c = clipBox(el, win);
          var x0 = Math.max(0, c ? c.left : 0), y0 = Math.max(0, c ? c.top : 0);
          var x1 = Math.min(vw, c ? c.right : vw), y1 = Math.min(vh, c ? c.bottom : vh);
          if (x1 <= x0 || y1 <= y0) continue;
          items.push({
            el: el, r: r, clip: [x0, y0, x1 - x0, y1 - y0],
            fit: cs.objectFit, filter: cs.filter && cs.filter !== 'none' ? cs.filter : 'none', op: op,
            blend: BLENDS[cs.mixBlendMode] ? cs.mixBlendMode : 'source-over'
          });
        }
        scanned = performance.now();
      }

      return function paint(ctx, w) {
        if (my !== token || !doc.defaultView) return;
        if (performance.now() - scanned > 500) scan();
        var k = w / (doc.documentElement.clientWidth || 1);
        for (var i = 0; i < items.length; i++) {
          var it = items[i], el = it.el, nw, nh;
          if (el.tagName === 'VIDEO') {
            if (el.readyState < 2) continue;
            nw = el.videoWidth; nh = el.videoHeight;
          } else {
            if (!el.complete || !el.naturalWidth) continue;
            nw = el.naturalWidth; nh = el.naturalHeight;
          }
          var r = it.r, dx = r.left, dy = r.top, dw = r.width, dh = r.height;
          var sx = 0, sy = 0, sw = nw, sh = nh, sc;
          if (it.fit === 'cover') {
            sc = Math.max(dw / nw, dh / nh); sw = dw / sc; sh = dh / sc; sx = (nw - sw) / 2; sy = (nh - sh) / 2;
          } else if (it.fit === 'contain' || it.fit === 'scale-down') {
            sc = Math.min(dw / nw, dh / nh); dx += (dw - nw * sc) / 2; dy += (dh - nh * sc) / 2; dw = nw * sc; dh = nh * sc;
          }
          ctx.save();
          ctx.beginPath();
          ctx.rect(it.clip[0] * k, it.clip[1] * k, it.clip[2] * k, it.clip[3] * k);
          ctx.clip();
          ctx.globalAlpha = Math.min(1, it.op);
          ctx.filter = it.filter;
          ctx.globalCompositeOperation = it.blend;
          try { ctx.drawImage(el, sx, sy, sw, sh, dx * k, dy * k, dw * k, dh * k); } catch (_) {}
          ctx.restore();
        }
      };
    }

    /* the card's own animation, live, for the moment before the page arrives */
    function cardLayer(box) {
      var el = box.querySelector('.anims');
      if (!el) return null;
      var isVideo = el.tagName === 'VIDEO';
      var zoom = parseFloat(box.getAttribute('data-preview-zoom')) || 2.3;
      return function paint(ctx, w, h) {
        var nw = isVideo ? el.videoWidth : el.naturalWidth, nh = isVideo ? el.videoHeight : el.naturalHeight;
        if (isVideo ? el.readyState < 2 : !el.complete) return;
        if (!nw || !nh) return;
        // most card renders have wide empty margins, so scale up past 'contain'
        var k = Math.min(w / nw, h / nh) * zoom;
        var dw = nw * k, dh = nh * k;
        ctx.globalCompositeOperation = 'lighten';     // black background drops out
        try { ctx.drawImage(el, (w - dw) / 2, (h - dh) / 2, dw, dh); } catch (_) {}
        ctx.globalCompositeOperation = 'source-over';
      };
    }

    /* wait until the page is parsed and styled and the images in its first
       screen have loaded (capped), not for every video further down */
    function waitForPage(url, my) {
      return new Promise(function (resolve, reject) {
        var start = performance.now();
        var interactiveAt = 0;
        (function poll() {
          if (my !== token) { reject(new Error('stale')); return; }
          var doc = null;
          try { doc = frame.contentDocument; } catch (_) { reject(new Error('cross-origin')); return; }
          var here = doc && samePage(doc.location.href, url);
          if (here) starve(doc);
          var ok = here && doc.readyState !== 'loading';
          if (ok) {
            decorate(doc);
            if (!interactiveAt) interactiveAt = performance.now();
            var since = performance.now() - interactiveAt;
            var vh = doc.documentElement.clientHeight;
            var imgsReady = Array.prototype.every.call(doc.images, function (im) {
              return im.complete || im.getBoundingClientRect().top > vh;
            });
            var fontsReady = !doc.fonts || doc.fonts.status === 'loaded';
            // pages that draw part of themselves with JS (the scanline edges on
            // the steering robot page) need that drawn before the snapshot
            var edge = doc.querySelector('.ga-paper') ? doc.querySelector('.ga-edge') : null;
            var drawnReady = !edge || !!edge.style.width;    // set once it has been drawn
            if ((imgsReady && fontsReady && drawnReady && since > 100) || since > 1600) { resolve(doc); return; }
          }
          if (performance.now() - start > 12000) { reject(new Error('timeout')); return; }
          setTimeout(poll, here && doc.readyState === 'loading' ? 15 : 60);
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
        return Promise.resolve().then(function () {
          if (my !== token) throw new Error('stale');
          var size = R.size();
          var vw = doc.documentElement.clientWidth || frame.clientWidth;
          var vh = doc.documentElement.clientHeight || frame.clientHeight;
          var win = frame.contentWindow;
          var els = doc.body.getElementsByTagName('*');
          for (var q = 0; q < els.length; q++) {
            var ecs = win.getComputedStyle(els[q]);
            if (ecs.isolation === 'isolate' && ecs.zIndex === 'auto') {
              els[q].setAttribute('data-pv-iso', ecs.position === 'static' ? 'static' : '');
            }
          }
          win.__snapOpts = {
            backgroundColor: '#051220',
            x: 0, y: 0, scrollX: 0, scrollY: 0,
            width: vw, height: vh,
            windowWidth: vw, windowHeight: vh,
            scale: (size.w * size.dpr) / vw,
            useCORS: true,
            imageTimeout: 1500,
            logging: false,
            // only copy what's in the first screen; the rest of a long page
            // (dozens of videos and photos) is what made this slow
            // media is painted live on top, so leave it out of the still picture
            // (hidden, not removed, so nothing reflows)
            onclone: function (cdoc) {
              var m = cdoc.querySelectorAll('img, video');
              for (var i = 0; i < m.length; i++) m[i].style.visibility = 'hidden';
              // html2canvas ignores "isolation: isolate", so children with a
              // negative z-index (the steering robot page's scanline edges)
              // would be painted behind their parent's background. An explicit
              // z-index gives the same layering in a way it understands.
              var iso = cdoc.querySelectorAll('[data-pv-iso]');
              for (var j = 0; j < iso.length; j++) {
                if (iso[j].getAttribute('data-pv-iso') === 'static') iso[j].style.position = 'relative';
                iso[j].style.zIndex = '0';
              }
            },
            ignoreElements: function (el) {
              var tag = el.tagName;
              if (tag === 'SCRIPT') return true;
              // don't stall on media that hasn't arrived yet
              if (tag === 'IMG' && !(el.complete && el.naturalWidth)) return true;
              if (tag === 'VIDEO' && el.readyState < 2) return true;
              var r = el.getBoundingClientRect();
              return r.top > vh + 10 || (r.bottom < -10 && r.height > 0);
            }
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
    /* snapshots survive reloads of the home page for the rest of the
       browser session (coming back from a project page is instant) */
    var STORE_VER = 'pv4';   // bump when the snapshot format changes
    function storeKey(url) {
      var z = R.size();
      return STORE_VER + ':' + url + ':' + Math.round(z.w * z.dpr) + 'x' + Math.round(z.h * z.dpr);
    }
    function storeSave(url, c) {
      try { sessionStorage.setItem(storeKey(url), c.toDataURL('image/jpeg', 0.82)); } catch (_) {}
    }
    function storeLoad(url) {
      var data = null;
      try { data = sessionStorage.getItem(storeKey(url)); } catch (_) {}
      if (!data) return Promise.resolve(null);
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas');
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          c.getContext('2d').drawImage(img, 0, 0);
          resolve(c);
        };
        img.onerror = function () { resolve(null); };
        img.src = data;
      });
    }

    /* Hand the renderer a still picture plus a live-media painter, swapped
       in under the dissolve. pageLive can arrive later (once the page's
       media is ready), so it's held here and attached whenever it shows up. */
    var pageLive = null, shown = 0;

    function present(box, source, m, my, liveFn) {
      R.cover(function () {
        if (my !== token) return;
        R.setSource(source, m, liveFn !== undefined ? liveFn : pageLive);
        setState(m === 'empty' ? 'static' : 'frame');
        R.reveal(0);
        shown = my;
      });
    }

    function attachLive(doc, my) {
      if (my !== token) return;
      wakeMedia(doc);
      pageLive = mediaLayer(doc, my);
      if (shown === my) R.setLive(pageLive);
    }

    function show(box) {
      fetchH2C();
      var p = projectOf(box);
      var my = ++token;
      current = box;
      pageLive = null;
      shown = 0;
      setLink(p);
      link.classList.remove('nudge');
      R.start();

      R.cover(function () {
        if (my !== token) return;

        // no page of ours to show (coming soon, or hosted on another site):
        // the card's own animation, live. The button still links out.
        if (!p.href) {
          setLive(false);
          navigate('about:blank');
          var card = cardLayer(box);
          present(box, null, card ? 'content' : 'empty', my, card);
          return;
        }

        // project page: the frame always loads it (its media is painted live);
        // the still picture comes from memory, the session cache, or a capture
        var url = absUrl(p.href);
        setLive(false);

        var cached = cache[url];
        if (cached) {
          present(box, cached, 'content', my);
          navigate(url);
          waitForPage(url, my).then(function (doc) { attachLive(doc, my); }, function () {});
          return;
        }

        // straight away: the card's own animation, live, as a placeholder
        var card = cardLayer(box);
        R.setSource(null, card ? 'content' : 'empty', card);
        R.reveal(card ? -0.15 : -0.3);
        setState('loading');

        storeLoad(url).then(function (stored) {
          if (my !== token) return null;
          if (stored) {
            navigate(url);
            waitForPage(url, my).then(function (doc) { attachLive(doc, my); }, function () {});
            return stored;
          }
          R.setBusy(true);
          var idle = function (x) { R.setBusy(false); return x; };
          return capture(url, my).then(idle, function (err) { idle(); throw err; }).then(function (snap) {
            storeSave(url, snap);
            try { attachLive(frame.contentDocument, my); } catch (_) {}
            return snap;
          });
        }).then(function (snap) {
          if (!snap) return;
          cache[url] = snap;
          if (my !== token) return;
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
      pageLive = null;
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
