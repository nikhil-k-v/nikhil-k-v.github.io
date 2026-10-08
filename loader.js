/* loader.js — the loading screen, drawn entirely in one canvas so it can
   dither in and out cleanly.

     home pages   <script src="loader.js">                     (data-mode="home")
       "LOADING" unscrambles under a turning cycloidal disc, then the screen
       breaks up into an ordered dither that sweeps from the top down,
       uncovering the page.
     project pages  <script src="../loader.js" data-mode="page"> right after <body>
       A shorter version: the disc and text dither in from the bottom, then the
       whole screen dithers out, also from the bottom.

   When the screen is gone it sets window.__nvLoaded and fires 'nv:loaded'
   (the home page waits for that before starting its preview). Skipped inside
   the preview renderer (html.is-preview). */
(function () {
  'use strict';
  var root = document.documentElement;
  if (root.classList.contains('is-preview')) { window.__nvLoaded = true; return; }

  var script = document.currentScript;
  var mode = (script && script.getAttribute('data-mode')) || 'home';
  var page = mode === 'page';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // timings (ms from start)
  var T = page
    ? { inDur: 260, scramble: 520, out: 780, outDur: 900, dir: 'up' }
    : { inDur: 0, scramble: 1150, out: 1450, outDur: 1400, dir: 'down' };
  if (reduced) T = { inDur: 0, scramble: 0, out: page ? 200 : 400, outDur: 0, dir: T.dir };

  window.__nvLoading = true;
  var old = document.getElementById('loader');
  if (old) old.style.display = 'none';

  var NAVY = '#051220', INK = '#f0f0f0';
  var B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var CELL = 4, BAND = 0.4;

  var cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:10000;pointer-events:none;display:block;';
  var x = cv.getContext('2d');
  var content = document.createElement('canvas'), cx = content.getContext('2d');
  var inMask = document.createElement('canvas'), inX = inMask.getContext('2d');
  var outMask = document.createElement('canvas'), outX = outMask.getContext('2d');
  var W, H, dpr, cols, rows, inImg, outImg;

  function size() {
    W = window.innerWidth; H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = content.width = Math.round(W * dpr);
    cv.height = content.height = Math.round(H * dpr);
    cols = Math.ceil(W / CELL); rows = Math.ceil(H / CELL);
    inMask.width = outMask.width = cols; inMask.height = outMask.height = rows;
    inImg = inX.createImageData(cols, rows); outImg = outX.createImageData(cols, rows);
  }
  size();
  window.addEventListener('resize', size);
  root.appendChild(cv);
  // cover the page straight away, before anything else paints
  x.fillStyle = NAVY; x.fillRect(0, 0, cv.width, cv.height);

  // ---------- the disc: 12 pins, an 11-lobe disc on its eccentric ----------
  var N = 12, R = 1, E = 0.055, S = 0.13, prof = [];
  for (var i = 0; i < 600; i++) {
    var t = (i / 600) * 2 * Math.PI;
    var b = -Math.atan(Math.sin((1 - N) * t) / ((R / (E * N)) - Math.cos((1 - N) * t)));
    prof.push(R * Math.cos(t) - S * Math.cos(t - b) - E * Math.cos(N * t),
              -R * Math.sin(t) + S * Math.sin(t - b) + E * Math.sin(N * t));
  }
  function disc(c, cxp, cyp, sizePx, now) {
    var k = sizePx / 2 / (R + S + 0.06), lw = sizePx / 260;
    var phi = now * 0.0042, rot = -phi / (N - 1);
    var ox = E * Math.cos(phi), oy = E * Math.sin(phi);
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

  // ---------- "LOADING", resolving out of random characters ----------
  var WORD = 'LOADING', GLYPHS = '!@#$%^&*()_+?><:{}[]', shown = '', lastTick = -1;
  function word(ms) {
    var tick = Math.floor(ms / 45);
    if (tick === lastTick) return shown;
    lastTick = tick;
    var fixed = T.scramble ? Math.min(WORD.length, Math.floor(ms / T.scramble * (WORD.length + 1))) : WORD.length;
    var s = WORD.substring(0, fixed);
    for (var q = fixed; q < WORD.length; q++) s += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
    return (shown = s);
  }

  function drawContent(now, ms) {
    var small = W <= 700;
    var d = page ? (small ? Math.min(W * 0.42, 200) : Math.max(100, Math.min(W, H) * 0.17))
                 : (small ? Math.min(W * 0.62, 300) : Math.max(120, Math.min(W, H) * 0.25));
    var fs = page ? (small ? 14 : 22) : (small ? 18 : 32);
    var gap = fs * 0.9, total = d + gap + fs;
    var top = (H - total) / 2;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.clearRect(0, 0, W, H);
    disc(cx, W / 2, top + d / 2, d, now);
    cx.font = '600 ' + fs + 'px montserrat, Montserrat, "Helvetica Neue", Arial, sans-serif';
    if ('letterSpacing' in cx) cx.letterSpacing = (small ? 0.12 : 0.06) * fs + 'px';
    cx.fillStyle = INK; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.fillText(word(ms), W / 2, top + d + gap + fs / 2);
  }

  // cells switch over in Bayer order as a band sweeps across the screen
  function mask(img, p, dir, invert) {
    var front = p * (1 + BAND), dta = img.data;
    for (var r = 0; r < rows; r++) {
      var rr = dir === 'down' ? r / rows : 1 - r / rows;
      var lvl = (front - rr) / BAND;
      lvl = lvl < 0 ? 0 : lvl > 1 ? 1 : lvl;
      for (var c = 0; c < cols; c++) {
        var on = B4[((r & 3) << 2) | (c & 3)] < lvl * 16;
        dta[(r * cols + c) * 4 + 3] = (on !== invert) ? 255 : 0;
      }
    }
  }

  var t0 = performance.now(), raf = 0;
  function frame(now) {
    var ms = now - t0;
    var pin = T.inDur ? Math.min(1, ms / T.inDur) : 1;
    var pout = ms < T.out ? 0 : T.outDur ? Math.min(1, (ms - T.out) / T.outDur) : 1;

    drawContent(now, ms);
    if (pin < 1) {                                   // content appears cell by cell
      mask(inImg, pin, 'up', false);
      inX.putImageData(inImg, 0, 0);
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.globalCompositeOperation = 'destination-in';
      cx.imageSmoothingEnabled = false;
      cx.drawImage(inMask, 0, 0, cols * CELL * dpr, rows * CELL * dpr);
      cx.globalCompositeOperation = 'source-over';
    }

    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'source-over';
    x.fillStyle = NAVY; x.fillRect(0, 0, cv.width, cv.height);
    x.drawImage(content, 0, 0);
    if (pout > 0) {                                  // the whole screen goes, cell by cell
      mask(outImg, pout, T.dir, false);
      outX.putImageData(outImg, 0, 0);
      x.globalCompositeOperation = 'destination-out';
      x.imageSmoothingEnabled = false;
      x.drawImage(outMask, 0, 0, cols * CELL * dpr, rows * CELL * dpr);
      x.globalCompositeOperation = 'source-over';
    }

    if (pout >= 1) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }

  function finish() {
    cancelAnimationFrame(raf);
    if (cv.parentNode) cv.parentNode.removeChild(cv);
    window.removeEventListener('resize', size);
    window.__nvLoading = false;
    window.__nvLoaded = true;
    try { window.dispatchEvent(new Event('nv:loaded')); } catch (_) {}
  }

  raf = requestAnimationFrame(frame);
  // coming back through the back/forward cache: no loader
  window.addEventListener('pageshow', function (e) { if (e.persisted) finish(); });
})();
