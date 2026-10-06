/* paper-edges.js
   Breaks up the top and bottom edges of the white write-up sheet (.ga-paper)
   into horizontal navy scanlines, so the sheet dissolves into the page instead
   of ending in a hard line. The sheet spans the full page width, so the sides
   are left plain.

   - Each line's thickness follows how far it is into the band, so lines are
     thin out in the navy and merge into solid white near the content.
   - The band's inner edge is pushed around by smooth value noise ("curvy
     bumps"), so every edge has its own uneven outline.
   - Each line also fades in opacity toward the navy (see FADE below).

   Only the two edge strips are drawn (on canvases over the white sheet), so
   they stay small even on a very tall page. */

(function () {
  var SETTINGS = {
    desktop: { spacing: 11, band: 77, waviness: 0.65, gap: 24 },
    mobile:  { spacing: 6,  band: 48, waviness: 0.88, gap: 10 }
  };

  /* How each line's opacity fades out toward the navy.
     mode:       'stepped' = opacity drops in four flat steps
                 'strokes' = opacity also drifts along each line, so strokes fade in and out
                 'none'    = every line fully white (thickness-only fade)
     curve:      1 = even fade across the band, >1 keeps outer lines dim for longer
     minOpacity: opacity of the outermost line
     flicker:    how far opacity drifts along a line ('strokes' only) */
  var FADE = { mode: 'stepped', curve: 1.1, minOpacity: 0.02, flicker: 0 };

  var NAVY_RGB = [5, 18, 32];   /* --dark-primary, #051220 */
  var SEED = 7;

  /* deterministic value noise, so the edges keep their shape between redraws */
  function hash(x, y) {
    var h = (x * 374761393 + y * 668265263 + SEED * 2246822519) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function valueNoise(x, scale, s) {
    var i = Math.floor(x / scale), u = smooth(x / scale - i);
    var a = hash(i, s), b = hash(i + 1, s);
    return a + (b - a) * u;
  }
  /* long swells plus smaller bumps, centred on 0 (range about -0.5..0.5) */
  function bumps(x, s) {
    return 0.7 * valueNoise(x, 90, s) + 0.3 * valueNoise(x, 24, s + 99) - 0.5;
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function offsets(n, seed, amp) {
    var o = new Float32Array(n);
    for (var i = 0; i < n; i++) o[i] = bumps(i, seed) * amp;
    return o;
  }

  function build(paper, strips) {
    var W = paper.clientWidth, H = paper.clientHeight;
    if (!W || !H) return;

    var mobile = window.innerWidth <= 1000;
    var cfg = mobile ? SETTINGS.mobile : SETTINGS.desktop;
    var P = cfg.spacing;

    /* room above/below the content, from the sheet's padding */
    var cs = getComputedStyle(paper);
    var padTop = parseFloat(cs.paddingTop), padBottom = parseFloat(cs.paddingBottom);

    var band = cfg.band, amp = band * 1.1 * cfg.waviness;

    /* where each band starts, so that its deepest bump still ends before the content */
    var y0t = Math.max(0, padTop    - (band + 0.5 * amp) - cfg.gap);
    var y0b = Math.max(0, padBottom - (band + 0.5 * amp) - cfg.gap);

    var oT = offsets(W, 37, amp), oB = offsets(W, 53, amp);

    function fade(t) {
      return FADE.minOpacity + (1 - FADE.minOpacity) * Math.pow(t, FADE.curve);
    }

    /* opacity of white at this pixel: 1 = sheet, 0 = navy page */
    function alphaAt(x, y) {
      var yr = H - 1 - y;
      var aT = y - y0t + oT[x], aB = yr - y0b + oB[x];
      var top = aT < aB;
      var b = top ? aT : aB;
      if (b <= 0) return 0;
      if (b >= band + P) return 1;

      var local = top ? y : yr, start = top ? y0t : y0b, off = top ? oT[x] : oB[x];
      var k = Math.floor(local / P);
      var t = clamp01((k * P + P / 2 - start + off) / band);   /* set per line, at its centre */
      if (t >= 0.999) return 1;
      if ((local % P) >= t * P) return 0;                      /* gap between lines */

      var o = fade(t);
      if (FADE.mode === 'stepped') {
        o = Math.ceil(o * 4) / 4;
      } else if (FADE.mode === 'strokes') {
        var lineSeed = (k * 7919 + (top ? 2 : 3) * 104729) % 9973;
        o *= 1 - FADE.flicker * (1 - valueNoise(x, 40, lineSeed));
      } else if (FADE.mode === 'none') {
        o = 1;
      }
      return o;
    }

    var topH = Math.min(H, Math.ceil(y0t + band + 0.5 * amp + P + 2));
    var botH = Math.min(H, Math.ceil(y0b + band + 0.5 * amp + P + 2));

    paint(strips.top,    W, topH, 0, 0,        alphaAt);
    paint(strips.bottom, W, botH, 0, H - botH, alphaAt);
  }

  /* draws navy-to-white mixes; fully white pixels stay transparent so the sheet shows through */
  function paint(canvas, w, h, ox, oy, alphaAt) {
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    var img = ctx.createImageData(w, h);
    var d = img.data;
    var r = NAVY_RGB[0], g = NAVY_RGB[1], b = NAVY_RGB[2];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var a = alphaAt(x + ox, y + oy);
        if (a >= 1) continue;
        var i = (y * w + x) * 4;
        d[i]     = r + (255 - r) * a;
        d[i + 1] = g + (255 - g) * a;
        d[i + 2] = b + (255 - b) * a;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function init() {
    var paper = document.querySelector('.ga-paper');
    if (!paper) return;

    var strips = {};
    ['top', 'bottom'].forEach(function (side) {
      var c = document.createElement('canvas');
      c.className = 'ga-edge ' + side;
      c.setAttribute('aria-hidden', 'true');
      paper.insertBefore(c, paper.firstChild);
      strips[side] = c;
    });

    var timer = null, lastW = 0, lastH = 0, lastMobile = null;
    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var w = paper.clientWidth, h = paper.clientHeight, m = window.innerWidth <= 1000;
        if (w === lastW && h === lastH && m === lastMobile) return;
        lastW = w; lastH = h; lastMobile = m;
        build(paper, strips);
      }, 120);
    }

    schedule();
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(paper);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
