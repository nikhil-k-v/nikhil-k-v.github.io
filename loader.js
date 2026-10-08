/* loader.js — the loading screen, drawn entirely in one canvas so it can
   dither in and out cleanly.

     home pages   <script src="loader.js">                     (data-mode="home")
       "LOADING" unscrambles under a turning cycloidal disc, then the screen
       breaks up into an ordered dither that sweeps from the top down,
       uncovering the page.
     project pages  <script src="../loader.js" data-mode="page"> right after <body>
       The same screen, a little shorter. It dithers out from the bottom.

   Leaving for a project page: a click on a link into /pages/ (or a call to
   window.nvGo(url)) first dithers the screen in from the bottom over the
   current page, then navigates. The next page starts already covered, so
   the two read as one loading screen.

   When the screen is gone it sets window.__nvLoaded and fires 'nv:loaded'.
   window.__nvLoadStart is when it started (performance.now()). Skipped inside
   the preview renderer (html.is-preview or window.__nvPreview). */
(function () {
  'use strict';
  var root = document.documentElement;
  var script = document.currentScript;
  var mode = (script && script.getAttribute('data-mode')) || 'home';
  var page = mode === 'page';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var previewing = root.classList.contains('is-preview') || !!window.__nvPreview;

  var NAVY = '#051220', INK = '#f0f0f0';
  var B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var CELL = 4, BAND = 0.4;
  var WORD = 'LOADING', GLYPHS = '!@#$%^&*()_+?><:{}[]';
  var TICK = 95;                      // ms between scrambled-letter changes
  var LEAVE = 560;                    // ms to cover the page before navigating
  var KEY = 'nv-cover';

  // the screen arrives covered when the previous page dithered it in
  var arrived = null;
  try {
    var raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (raw) { var o = JSON.parse(raw); if (Date.now() - o.t < 8000) arrived = o; }
  } catch (_) {}

  // Montserrat comes from Typekit; ask for it so the canvas text isn't drawn
  // in a fallback font (the text waits for it, briefly)
  var FONT = '"montserrat", Montserrat, "Helvetica Neue", Arial, sans-serif';
  var fontReady = false;
  try {
    if (document.fonts && document.fonts.load) {
      document.fonts.load('600 32px ' + FONT, WORD).then(function () { fontReady = true; }, function () { fontReady = true; });
      setTimeout(function () { fontReady = true; }, arrived ? 250 : 500);
    } else fontReady = true;
  } catch (_) { fontReady = true; }

  // ---------- the disc: 12 pins, an 11-lobe disc on its eccentric ----------
  var N = 12, R = 1, E = 0.055, S = 0.13, prof = [];
  for (var i = 0; i < 720; i++) {
    var t = (i / 720) * 2 * Math.PI;
    var b = -Math.atan(Math.sin((1 - N) * t) / ((R / (E * N)) - Math.cos((1 - N) * t)));
    prof.push(R * Math.cos(t) - S * Math.cos(t - b) - E * Math.cos(N * t),
              -R * Math.sin(t) + S * Math.sin(t - b) + E * Math.sin(N * t));
  }
  function disc(c, cxp, cyp, sizePx, phi) {
    var k = sizePx / 2 / (R + S + 0.06), lw = Math.max(1, sizePx / 260);
    var rot = -phi / (N - 1);
    var ox = E * Math.cos(phi), oy = E * Math.sin(phi);
    c.lineJoin = 'round';
    // a faint glow behind, and the circle the pins sit on
    var g = c.createRadialGradient(cxp, cyp, 0, cxp, cyp, (R + S) * k * 1.25);
    g.addColorStop(0, 'rgba(40, 110, 200, 0.16)'); g.addColorStop(1, 'rgba(40, 110, 200, 0)');
    c.fillStyle = g; c.beginPath(); c.arc(cxp, cyp, (R + S) * k * 1.25, 0, 2 * Math.PI); c.fill();
    c.lineWidth = lw; c.strokeStyle = 'rgba(120, 175, 255, 0.2)';
    c.setLineDash([lw * 3, lw * 4]);
    c.beginPath(); c.arc(cxp, cyp, R * k, 0, 2 * Math.PI); c.stroke();
    c.setLineDash([]);
    c.lineWidth = lw * 1.3; c.strokeStyle = 'rgba(120, 175, 255, 0.85)';
    for (var a = 0; a < N; a++) {
      var th = 2 * Math.PI * a / N;
      c.beginPath(); c.arc(cxp + R * Math.cos(th) * k, cyp + R * Math.sin(th) * k, S * k, 0, 2 * Math.PI); c.stroke();
    }
    var cr = Math.cos(rot), sr = Math.sin(rot);
    c.beginPath();
    for (var j = 0; j < prof.length; j += 2) {
      var px = prof[j] * cr - prof[j + 1] * sr + ox, py = prof[j] * sr + prof[j + 1] * cr + oy;
      if (j === 0) c.moveTo(cxp + px * k, cyp + py * k); else c.lineTo(cxp + px * k, cyp + py * k);
    }
    c.closePath();
    c.fillStyle = 'rgba(0, 72, 102, 0.9)'; c.fill();
    c.lineWidth = lw * 2; c.strokeStyle = 'rgba(95, 160, 255, 0.95)'; c.stroke();
    c.beginPath(); c.arc(cxp + ox * k, cyp + oy * k, 0.22 * k, 0, 2 * Math.PI); c.lineWidth = lw * 1.6; c.stroke();
    c.beginPath(); c.arc(cxp, cyp, (0.22 - E) * k * 0.92, 0, 2 * Math.PI); c.fillStyle = 'rgba(95, 145, 255, 0.95)'; c.fill();
  }

  /* one full-screen canvas.
     o.cover   'solid'  starts as a navy screen (a normal page load)
               'in'     the whole screen dithers in over the page (leaving)
     o.inDur   content dithers in over this long (0: shown at once)
     o.scramble  LOADING resolves over this long (Infinity: never)
     o.out, o.outDur, o.outDir   when and how the screen dithers away
     o.coverDur, o.onCovered    for 'in': how long, and what to do once covered */
  function Screen(o) {
    var cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    // 100lvh: as tall as the screen gets once a phone's toolbar hides, so the
    // bottom is never left uncovered; the drawing is sized from what the
    // canvas actually measures, so it's never stretched
    cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100vh;height:100lvh;z-index:10000;pointer-events:none;display:block;margin:0;padding:0;border:0;';
    var x = cv.getContext('2d');
    var content = document.createElement('canvas'), cx = content.getContext('2d');
    var inMask = document.createElement('canvas'), inX = inMask.getContext('2d');
    var outMask = document.createElement('canvas'), outX = outMask.getContext('2d');
    var W, H, VH, dpr, cp, cols, rows, inImg, outImg;
    var shown = '', lastTick = -1;
    var t0 = performance.now(), raf = 0, done = false, covered = false;
    var spin0 = o.spin0 || Date.now();

    function size() {
      var r = cv.getBoundingClientRect();
      W = r.width || window.innerWidth; H = r.height || window.innerHeight;
      VH = Math.min(H, window.innerHeight || H);          // the part actually on screen
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      cv.width = content.width = Math.round(W * dpr);
      cv.height = content.height = Math.round(H * dpr);
      cp = Math.max(2, Math.round(CELL * dpr));           // dither cell, whole device pixels
      cols = Math.ceil(cv.width / cp); rows = Math.ceil(cv.height / cp);
      inMask.width = outMask.width = cols; inMask.height = outMask.height = rows;
      inImg = inX.createImageData(cols, rows); outImg = outX.createImageData(cols, rows);
    }
    root.appendChild(cv);
    size();
    window.addEventListener('resize', size);
    if (o.cover === 'solid') { x.fillStyle = NAVY; x.fillRect(0, 0, cv.width, cv.height); }

    // letters settle left to right over o.scramble; the rest change every TICK
    function word(ms) {
      var tick = Math.floor(ms / TICK);
      if (tick !== lastTick || !shown) {
        lastTick = tick; shown = '';
        for (var q = 0; q < WORD.length; q++) shown += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
      }
      var fixed = !isFinite(o.scramble) ? 0 : o.scramble > 0 ? Math.min(WORD.length, Math.floor(ms / o.scramble * (WORD.length + 1))) : WORD.length;
      return WORD.substring(0, fixed) + shown.substring(fixed);
    }

    function drawContent(ms) {
      var small = W <= 700;
      var d = small ? Math.min(W * 0.62, 300) : Math.max(120, Math.min(W, VH) * 0.25);
      var fs = small ? 18 : 32;
      var gap = fs * 0.9, total = d + gap + fs;
      var top = (VH - total) / 2;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.clearRect(0, 0, W, H);
      disc(cx, W / 2, top + d / 2, d, (Date.now() - spin0) * 0.0042);
      var w = word(ms);
      if (!fontReady) return;
      cx.font = '600 ' + fs + 'px ' + FONT;
      if ('letterSpacing' in cx) cx.letterSpacing = (small ? 0.12 : 0.06) * fs + 'px';
      cx.fillStyle = INK; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText(w, W / 2, top + d + gap + fs / 2);
    }

    // cells switch over in Bayer order as a band sweeps across the screen
    function mask(img, p, dir) {
      var front = p * (1 + BAND), dta = img.data;
      for (var r = 0; r < rows; r++) {
        var rr = dir === 'down' ? r / rows : 1 - (r + 1) / rows;
        var lvl = (front - rr) / BAND;
        lvl = lvl < 0 ? 0 : lvl > 1 ? 1 : lvl;
        for (var c = 0; c < cols; c++) {
          dta[(r * cols + c) * 4 + 3] = B4[((r & 3) << 2) | (c & 3)] < lvl * 16 ? 255 : 0;
        }
      }
    }
    function applyMask(ctx, img, mcv, mx, op) {
      mx.putImageData(img, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = op;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(mcv, 0, 0, cols * cp, rows * cp);
      ctx.globalCompositeOperation = 'source-over';
    }

    function frame(now) {
      raf = 0;
      if (done) return;
      var ms = now - t0;
      var pin = o.inDur ? Math.min(1, ms / o.inDur) : 1;
      var pcov = o.cover === 'in' ? (o.coverDur ? Math.min(1, ms / o.coverDur) : 1) : 1;
      var pout = !isFinite(o.out) || ms < o.out ? 0 : o.outDur ? Math.min(1, (ms - o.out) / o.outDur) : 1;

      drawContent(ms);
      if (pin < 1) { mask(inImg, pin, 'up'); applyMask(cx, inImg, inMask, inX, 'destination-in'); }

      x.setTransform(1, 0, 0, 1, 0, 0);
      x.globalCompositeOperation = 'source-over';
      x.clearRect(0, 0, cv.width, cv.height);
      x.fillStyle = NAVY; x.fillRect(0, 0, cv.width, cv.height);
      x.drawImage(content, 0, 0);
      if (pcov < 1) { mask(inImg, pcov, 'up'); applyMask(x, inImg, inMask, inX, 'destination-in'); }
      if (pout > 0) { mask(outImg, pout, o.outDir); applyMask(x, outImg, outMask, outX, 'destination-out'); }

      if (pcov >= 1 && !covered) { covered = true; if (o.onCovered) o.onCovered(); }
      if (pout >= 1) { finish(); return; }
      if (!document.hidden) raf = requestAnimationFrame(frame);
    }

    function finish() {
      if (done) return;
      done = true;
      if (raf) cancelAnimationFrame(raf);
      if (cv.parentNode) cv.parentNode.removeChild(cv);
      window.removeEventListener('resize', size);
      document.removeEventListener('visibilitychange', wakeUp);
      if (o.onDone) o.onDone();
    }
    // a hidden tab gets no animation frames; carry on when it's back
    function wakeUp() { if (!document.hidden && !done && !raf) raf = requestAnimationFrame(frame); }
    document.addEventListener('visibilitychange', wakeUp);

    raf = requestAnimationFrame(frame);
    return { finish: finish, start: t0 };
  }

  // ---------- the loading screen for this page ----------
  window.__nvLoadStart = performance.now();
  if (previewing) { window.__nvLoaded = true; }
  else {
    var T;
    if (reduced) T = { cover: 'solid', inDur: 0, scramble: 0, out: page ? 250 : 400, outDur: 0, outDir: 'up' };
    else if (page) T = arrived
      ? { cover: 'solid', inDur: 0, scramble: 1050, out: 1350, outDur: 1100, outDir: 'up' }
      : { cover: 'solid', inDur: 380, scramble: 1150, out: 1450, outDur: 1100, outDir: 'up' };
    else T = { cover: 'solid', inDur: 0, scramble: 1150, out: 1450, outDur: 1400, outDir: 'down' };
    if (arrived) T.spin0 = arrived.s;

    window.__nvLoading = true;
    var old = document.getElementById('loader');
    if (old) old.style.display = 'none';

    var screen = Screen(Object.assign(T, {
      onDone: function () {
        window.__nvLoading = false;
        window.__nvLoaded = true;
        try { window.dispatchEvent(new Event('nv:loaded')); } catch (_) {}
      }
    }));
    // coming back through the back/forward cache: no loader
    window.addEventListener('pageshow', function (e) { if (e.persisted) screen.finish(); });
  }

  // ---------- leaving for a project page ----------
  var leaving = null;
  function go(url) {
    if (leaving) return;
    if (reduced || previewing) { location.href = url; return; }
    var spin0 = Date.now();
    leaving = Screen({
      cover: 'in', coverDur: LEAVE, inDur: 0, scramble: Infinity, out: Infinity, spin0: spin0,
      onCovered: function () {
        try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), s: spin0 })); } catch (_) {}
        location.href = url;
      }
    });
    // if the tab is hidden the animation can't run; don't hold the click up
    if (document.hidden) location.href = url;
  }
  window.nvGo = go;

  function intoProject(a) {
    if (!a || !a.href || a.target && a.target !== '_self' || a.hasAttribute('download')) return false;
    var u;
    try { u = new URL(a.href, location.href); } catch (_) { return false; }
    if (u.origin !== location.origin || !/\/pages\/[^/]+\.html$/i.test(u.pathname)) return false;
    return u.pathname !== location.pathname;                  // not an anchor on this page
  }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!intoProject(a)) return;
    e.preventDefault();
    go(a.href);
  });

  // back to this page from the cache after leaving: take the cover off
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && leaving) { leaving.finish(); leaving = null; }
  });
})();
