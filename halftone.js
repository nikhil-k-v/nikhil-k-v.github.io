/* halftone.js — draws a picture (a card animation's video, or its poster) as
   halftone dots in a canvas. Used by the prototype home (index3.html, home3.js)
   and by the tool that tunes it (halftone-lab.html).

   The picture is on black, like the card animations. Each cell of a grid
   becomes one dot: its size follows how much "ink" the cell holds (bright
   detail counts for more than a flat fill, as in the home preview), and its
   colour is the cell's own, or a tint. Cells can also be "crisp": they show
   the picture itself. The canvas is meant to sit on the card with
   mix-blend-mode: lighten, so the black drops out.

   The work is done by one WebGL fragment shader, in one hidden canvas shared
   by every card; each card's own 2D canvas gets a copy. (Doing it on the CPU,
   as the home preview does, means reading video frames back from the GPU:
   10-30 ms a card on a laptop.) Without WebGL the picture is drawn plain.

   Settings live in localStorage under NVHalftone.KEY, so the lab and the
   prototype share them (the prototype follows changes made in another tab). */
(function () {
  'use strict';

  var KEY = 'nv-halftone';

  // every setting: v is the default
  var SCHEMA = {
    cell:      { v: 4,    min: 2,   max: 16,  step: 1,    group: 'Grid',   label: 'Cell size', unit: 'px' },
    grid:      { v: 'square', options: ['square', 'brick'], group: 'Grid', label: 'Layout' },
    shape:     { v: 'square', options: ['square', 'round', 'diamond', 'line', 'cross'], group: 'Dots', label: 'Shape' },
    steps:     { v: 3,    min: 1,   max: 12,  step: 1,    group: 'Dots',   label: 'Dot sizes' },
    min:       { v: 0.25, min: 0,   max: 1,   step: 0.01, group: 'Dots',   label: 'Smallest dot' },
    max:       { v: 0.75, min: 0.1, max: 1,   step: 0.01, group: 'Dots',   label: 'Largest dot' },
    pattern:   { v: 'bayer', options: ['bayer', 'noise', 'none'], group: 'Dots', label: 'Between sizes' },
    gain:      { v: 1.1,  min: 0.3, max: 4,   step: 0.05, group: 'Tone',   label: 'Gain' },
    gamma:     { v: 0.75, min: 0.3, max: 2.5, step: 0.05, group: 'Tone',   label: 'Gamma' },
    detail:    { v: 0.9,  min: 0,   max: 1,   step: 0.01, group: 'Tone',   label: 'Lines over fills' },
    cutoff:    { v: 0.03, min: 0,   max: 0.6, step: 0.01, group: 'Tone',   label: 'Cut-off' },
    color:     { v: 'source', options: ['source', 'tint', 'duo'], group: 'Colour', label: 'Colour' },
    tint:      { v: '#9fc4e8', color: true, group: 'Colour', label: 'Tint' },
    tint2:     { v: '#ff6b81', color: true, group: 'Colour', label: 'Tint, dark end' },
    sat:       { v: 1,    min: 0,   max: 2.5, step: 0.05, group: 'Colour', label: 'Saturation' },
    lift:      { v: 20,   min: 0,   max: 120, step: 1,    group: 'Colour', label: 'Lift' },
    alpha:     { v: 0.9,  min: 0.1, max: 1,   step: 0.01, group: 'Colour', label: 'Opacity' },
    alphaTone: { v: 0.45, min: 0,   max: 1,   step: 0.01, group: 'Colour', label: 'Fade dim dots' },
    fps:       { v: 24,   min: 4,   max: 60,  step: 1,    group: 'Motion', label: 'Frames a second' },
    jitter:    { v: 0,    min: 0,   max: 1,   step: 0.01, group: 'Motion', label: 'Grain' },
    drift:     { v: 0.3,  min: 0,   max: 1,   step: 0.01, group: 'Motion', label: 'Drift' }
  };

  var PRESETS = {
    'Preview':   {},
    'Fine':      { cell: 3, shape: 'round', steps: 3, min: 0.3, max: 0.9, pattern: 'noise', jitter: 0.35, drift: 0.45, alphaTone: 0.6 },
    'Print':     { cell: 8, grid: 'brick', shape: 'round', steps: 10, min: 0.08, max: 1, pattern: 'none', detail: 0.35, gain: 1.6, gamma: 0.6, color: 'tint', tint: '#e9edf2', alpha: 1, alphaTone: 0, drift: 0 },
    'Scanlines': { cell: 5, shape: 'line', steps: 5, min: 0.1, max: 0.8, pattern: 'none', detail: 0.5, gain: 1.5, drift: 0.15 },
    'Blueprint': { cell: 5, shape: 'diamond', steps: 4, min: 0.25, max: 0.9, color: 'tint', tint: '#9fc4e8', alphaTone: 0.6 },
    'Two tone':  { cell: 6, shape: 'round', steps: 6, min: 0.15, max: 0.95, pattern: 'none', detail: 0.4, gain: 1.6, color: 'duo', tint: '#f0f0f0', tint2: '#ff6b81', alphaTone: 0.2 },
    'Coarse':    { cell: 10, shape: 'square', steps: 4, min: 0.2, max: 0.85, detail: 0.6, gain: 1.4 }
  };

  function defaults() {
    var o = {};
    for (var k in SCHEMA) o[k] = SCHEMA[k].v;
    return o;
  }

  // keeps only known settings, in range
  function clean(src) {
    var o = defaults();
    if (!src || typeof src !== 'object') return o;
    for (var k in SCHEMA) {
      var d = SCHEMA[k], v = src[k];
      if (v === undefined || v === null) continue;
      if (d.options) { if (d.options.indexOf(v) > -1) o[k] = v; }
      else if (d.color) { if (/^#[0-9a-f]{6}$/i.test(v)) o[k] = v; }
      else { v = parseFloat(v); if (isFinite(v)) o[k] = Math.max(d.min, Math.min(d.max, v)); }
    }
    return o;
  }

  function load() {
    try { return clean(JSON.parse(localStorage.getItem(KEY))); } catch (_) { return defaults(); }
  }
  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(clean(s))); } catch (_) {}
  }
  function preset(name) { return clean(PRESETS[name] || {}); }

  function hex(c) {
    var n = parseInt(c.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  // the filter in a card video's inline style: css text, plus its brightness() and contrast() as numbers
  function filterOf(style) {
    var f = /(?:^|;)\s*filter\s*:\s*([^;]+)/.exec(style || '');
    var txt = f ? f[1].trim() : 'none';
    function num(name) {
      var m = new RegExp(name + '\\(\\s*([\\d.]+)(%?)\\s*\\)').exec(txt);
      return m ? parseFloat(m[1]) / (m[2] ? 100 : 1) : 1;
    }
    return { filter: txt, bright: num('brightness'), contrast: num('contrast') };
  }

  /* ------------------------------------------------------------------
     The shader. Lengths are in device pixels unless they say css.
     ------------------------------------------------------------------ */
  var VERT = 'attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }';

  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform sampler2D uTex;',
    'uniform vec2 uRes;',          // canvas size
    'uniform vec4 uRect;',         // where the picture sits: x, y, w, h
    'uniform float uP;',           // cell size
    'uniform float uDpr;',
    'uniform float uTime;',
    'uniform float uSeed;',
    'uniform float uShape;',       // 0 square, 1 round, 2 diamond, 3 line, 4 cross
    'uniform float uBrick;',
    'uniform float uSteps;',
    'uniform float uMin;',
    'uniform float uMax;',
    'uniform float uPattern;',     // 0 bayer, 1 noise, 2 none
    'uniform float uGain;',
    'uniform float uGamma;',
    'uniform float uDetail;',
    'uniform float uCutoff;',
    'uniform float uColor;',       // 0 source, 1 tint, 2 duo
    'uniform vec3 uTint;',
    'uniform vec3 uTint2;',
    'uniform float uSat;',
    'uniform float uLift;',
    'uniform float uAlpha;',
    'uniform float uAlphaTone;',
    'uniform float uJitter;',
    'uniform float uDrift;',
    'uniform float uCrisp;',
    'uniform vec4 uLens;',         // x, y, radius (css), strength
    'uniform float uBlobs;',
    'uniform vec3 uBlob[4];',      // x, y, radius squared (css)
    'uniform float uBright;',
    'uniform float uContrast;',

    'float hash(vec2 v) { return fract(sin(dot(v, vec2(12.9898, 78.233))) * 43758.5453); }',
    'float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }',
    'float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }',

    // the picture, with the card\'s own contrast and brightness; black outside it
    'vec3 pic(vec2 p) {',
    '  vec2 uv = (p - uRect.xy) / uRect.zw;',
    '  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec3(0.0);',
    '  vec3 c = texture2D(uTex, uv).rgb;',
    '  c = (c - 0.5) * uContrast + 0.5;',
    '  return clamp(c * uBright, 0.0, 1.0);',
    '}',

    'void main() {',
    '  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);',
    // the grid is anchored on the canvas centre, so dots stay put on the
    // picture while a card grows or shrinks around it
    '  float cxm = floor(uRes.x * 0.5 + 0.5);',
    '  float row = floor(p.y / uP);',
    '  float shift = (uBrick > 0.5 && mod(row, 2.0) > 0.5) ? floor(uP * 0.5) : 0.0;',
    '  float col = floor((p.x - cxm + shift) / uP);',
    '  vec2 origin = vec2(cxm + col * uP - shift, row * uP);',
    '  vec2 f = p - origin;',
    '  vec2 cssC = (origin + 0.5 * uP) / uDpr;',
    '  vec2 halfSize = uRes / uDpr * 0.5;',

    // 3 x 3 samples: average, peak and trough of brightness; colour leans to the bright part
    '  float sum = 0.0; float mx = 0.0; float mn = 1.0; vec3 wc = vec3(0.0); float ws = 0.0;',
    '  for (int j = 0; j < 3; j++) {',
    '    for (int i = 0; i < 3; i++) {',
    '      vec3 c = pic(origin + (vec2(float(i), float(j)) + 0.5) / 3.0 * uP);',
    '      float y = dot(c, vec3(0.2126, 0.7152, 0.0722));',
    '      float mc = max(c.r, max(c.g, c.b));',
    '      float l = max(0.0, max((y - 0.08) / 0.92, (mc - 0.14) * 0.8));',
    '      sum += l; mx = max(mx, l); mn = min(mn, l);',
    '      float w = 0.05 + l; wc += c * w; ws += w;',
    '    }',
    '  }',
    '  float avg = sum / 9.0;',
    '  float edge = mx * 0.9 * min(1.0, (mx - mn) * 2.5) + avg * 0.12;',
    '  float v = pow(min(1.0, mix(avg, edge, uDetail) * uGain), uGamma);',

    // which cells show the picture itself; q swells the dots next to them
    '  float h1 = hash(vec2(col, row));',
    '  float q = 0.0; bool crisp = false;',
    '  if (uCrisp > 0.0) {',
    '    float ord = min(0.999, 0.6 * h1 + 0.55 * length(cssC - halfSize) / length(halfSize) * 1.4);',
    '    if (ord < uCrisp) crisp = true; else q = max(q, 1.0 - min(1.0, (ord - uCrisp) * 4.0));',
    '  }',
    '  if (!crisp && uLens.w > 0.01) {',
    '    vec2 ld = cssC - uLens.xy; float lr2 = uLens.z * uLens.w; lr2 *= lr2;',
    '    float lf = lr2 / (dot(ld, ld) + lr2);',
    '    float wob = 0.06 * sin(cssC.x * 0.09 + uTime * 2.1) * sin(cssC.y * 0.08 - uTime * 1.7);',
    '    if (lf + wob > 0.5) crisp = true; else q = max(q, min(1.0, lf * 2.0));',
    '  }',
    '  if (!crisp && uBlobs > 0.01) {',
    '    float bs = 0.0;',
    '    for (int k = 0; k < 4; k++) { vec2 bd = cssC - uBlob[k].xy; bs += uBlob[k].z / (dot(bd, bd) + uBlob[k].z); }',
    '    float bf = bs * 0.62 - 0.08 + 0.08 * sin(cssC.x * 0.07 + uTime * 2.0) * sin(cssC.y * 0.06 - uTime * 1.6);',
    '    if (bf >= 0.66) crisp = true; else q = max(q, clamp(bf / 0.66, 0.0, 1.0));',
    '  }',
    '  if (crisp) { gl_FragColor = vec4(pic(p), 1.0); return; }',

    '  if (uDrift > 0.0) {',
    '    float n = sin(cssC.x * 0.013 + uTime * 0.5) * sin(cssC.y * 0.011 - uTime * 0.4) + 0.5 * sin(cssC.x * 0.031 - uTime * 0.7 + cssC.y * 0.02);',
    '    v *= 1.0 + uDrift * 0.5 * n;',
    '  }',
    '  v = v * (1.0 + 0.6 * q) + 0.05 * q * q;',
    '  if (v < uCutoff) { gl_FragColor = vec4(0.0); return; }',
    '  v = min(v, 1.0);',

    // dot size: one of uSteps sizes, dithered between neighbours
    '  float thr = uPattern < 0.5 ? bayer4(vec2(mod(col, 4.0), mod(row, 4.0))) + 0.03125 : (uPattern < 1.5 ? 1.0 - h1 : 0.5);',
    '  if (uJitter > 0.0) thr += uJitter * (hash(vec2(col, row) + uSeed * vec2(37.0, 17.0)) - 0.5);',
    '  float level = min(floor(v * uSteps + thr), uSteps);',
    '  if (level < 1.0) { gl_FragColor = vec4(0.0); return; }',
    '  float d = uSteps < 1.5 ? uMax : mix(min(uMin, uMax), uMax, (level - 1.0) / (uSteps - 1.0));',

    // squares, lines and crosses keep to whole pixels so they stay sharp
    '  float cov = 0.0;',
    '  float s = clamp(floor(d * uP + 0.5), 1.0, uP);',
    '  float o = floor((uP - s) * 0.5);',
    '  bool inX = f.x >= o && f.x < o + s;',
    '  bool inY = f.y >= o && f.y < o + s;',
    '  if (uShape < 0.5) { cov = (inX && inY) ? 1.0 : 0.0; }',
    '  else if (uShape < 1.5) { cov = clamp(d * uP * 0.564 - length(f - 0.5 * uP) + 0.5, 0.0, 1.0); }',
    '  else if (uShape < 2.5) { vec2 a = abs(f - 0.5 * uP); cov = clamp((d * uP * 0.707 - a.x - a.y) * 0.707 + 0.5, 0.0, 1.0); }',
    '  else if (uShape < 3.5) { cov = inY ? 1.0 : 0.0; }',
    '  else {',
    '    float t = max(1.0, floor(uP * 0.22 + 0.5)); float to = floor((uP - t) * 0.5);',
    '    bool tx = f.x >= to && f.x < to + t; bool ty = f.y >= to && f.y < to + t;',
    '    cov = ((inX && ty) || (inY && tx)) ? 1.0 : 0.0;',
    '  }',
    '  if (cov <= 0.0) { gl_FragColor = vec4(0.0); return; }',

    '  vec3 col3;',
    '  if (uColor < 0.5) {',
    '    col3 = wc / ws;',
    '    float gy = dot(col3, vec3(0.2126, 0.7152, 0.0722));',
    '    col3 = gy + (col3 - gy) * uSat;',
    '    col3 = col3 * 1.12 + uLift;',
    '  } else if (uColor < 1.5) { col3 = uTint; }',
    '  else { col3 = mix(uTint2, uTint, v); }',
    '  col3 = clamp(col3, 0.0, 1.0);',
    '  float a = cov * uAlpha * (1.0 - uAlphaTone + uAlphaTone * (0.35 + 0.65 * v));',
    '  gl_FragColor = vec4(col3 * a, a);',
    '}'
  ].join('\n');

  var UNIFORMS = ['uTex', 'uRes', 'uRect', 'uP', 'uDpr', 'uTime', 'uSeed', 'uShape', 'uBrick', 'uSteps', 'uMin', 'uMax',
    'uPattern', 'uGain', 'uGamma', 'uDetail', 'uCutoff', 'uColor', 'uTint', 'uTint2', 'uSat', 'uLift', 'uAlpha',
    'uAlphaTone', 'uJitter', 'uDrift', 'uCrisp', 'uLens', 'uBlobs', 'uBlob[0]', 'uBright', 'uContrast'];
  var SHAPES = { square: 0, round: 1, diamond: 2, line: 3, cross: 4 };
  var PATTERNS = { bayer: 0, noise: 1, none: 2 };
  var COLORS = { source: 0, tint: 1, duo: 2 };
  var BLOBS = [[0.23, 0.0, 1.7, 0.19, 2.1, 1.0], [0.17, 2.4, 0.3, 0.26, 4.0, 0.85], [0.29, 4.1, 2.9, 0.15, 0.7, 0.7], [0.13, 1.2, 5.2, 0.21, 3.3, 0.9]];

  /* one WebGL canvas for everything; null = not tried yet, false = unavailable */
  var G = null;
  function shared() {
    if (G !== null) return G;
    try {
      var cv = document.createElement('canvas');
      cv.width = 16; cv.height = 16;
      var opts = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false };
      var gl = cv.getContext('webgl', opts) || cv.getContext('experimental-webgl', opts);
      if (!gl) return (G = false);
      var sh = function (type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      var prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);   // one triangle over the lot
      var at = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(at);
      gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
      gl.disable(gl.BLEND);
      gl.activeTexture(gl.TEXTURE0);
      var u = {};
      UNIFORMS.forEach(function (n) { u[n] = gl.getUniformLocation(prog, n); });
      gl.uniform1i(u.uTex, 0);
      G = { cv: cv, gl: gl, u: u, lost: false };
      cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); if (G) G.lost = true; });
      cv.addEventListener('webglcontextrestored', function () { G = null; });      // set up again on the next draw
    } catch (err) {
      if (window.console) console.warn('halftone: no WebGL, drawing the pictures plain.', err);
      G = false;
    }
    return G;
  }

  function create(canvas) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1;
    var tex = null, texOf = null, texSrc = null, texTime = -1;
    var ms = 0;                         // script time the last draw took
    var blobBuf = new Float32Array(12);

    function size(w, h) {
      var r = Math.min(window.devicePixelRatio || 1, 2);
      var pw = Math.max(1, Math.round(w * r)), ph = Math.max(1, Math.round(h * r));
      if (pw === W && ph === H && r === dpr) return false;
      dpr = r; W = pw; H = ph;
      canvas.width = W; canvas.height = H;
      return true;
    }

    // no WebGL: the picture as it is
    function plain(src, rect, st) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      try {
        if ('filter' in ctx) ctx.filter = st.filter || 'none';
        ctx.drawImage(src, rect.x * dpr, rect.y * dpr, rect.w * dpr, rect.h * dpr);
        if ('filter' in ctx) ctx.filter = 'none';
      } catch (_) {}
    }

    /* src:  a video, image or canvas
       rect: where it sits, in css px relative to the canvas
       S:    settings (load(), preset() …)
       st:   { crisp: 0..1 share of cells showing the picture itself (they switch
                 in a grainy order from the middle outward),
               lens:  { x, y, r, s } a crisp patch around a point (css px), s = 0..1,
               blobs: 0..1 drifting crisp patches, as in the home preview,
               coarse: cell size multiplier,
               filter / bright / contrast: the card's css filter (see filterOf) }
       t:    seconds, drives the drift */
    function draw(src, rect, S, st, t) {
      var t0 = performance.now();
      if (!W || !H || !src) return;
      st = st || {};
      var g = shared();
      if (!g || g.lost) { plain(src, rect, st); ms = performance.now() - t0; return; }
      var gl = g.gl, u = g.u;

      if (g.cv.width < W || g.cv.height < H) {
        g.cv.width = Math.max(g.cv.width, W);
        g.cv.height = Math.max(g.cv.height, H);
      }
      gl.viewport(0, 0, W, H);

      // this card's picture; a new frame is only uploaded when there is one
      if (texOf !== g) {
        tex = gl.createTexture();
        texOf = g; texSrc = null;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      } else gl.bindTexture(gl.TEXTURE_2D, tex);
      var time = src.tagName === 'VIDEO' ? src.currentTime : 0;
      if (texSrc !== src || texTime !== time) {
        try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); }
        catch (_) { plain(src, rect, st); return; }
        texSrc = src; texTime = time;
      }

      var P = Math.max(1, Math.round(S.cell * (st.coarse || 1) * dpr));
      gl.uniform2f(u.uRes, W, H);
      gl.uniform4f(u.uRect, rect.x * dpr, rect.y * dpr, rect.w * dpr, rect.h * dpr);
      gl.uniform1f(u.uP, P);
      gl.uniform1f(u.uDpr, dpr);
      gl.uniform1f(u.uTime, t % 3600);
      gl.uniform1f(u.uSeed, Math.random());
      gl.uniform1f(u.uShape, SHAPES[S.shape] || 0);
      gl.uniform1f(u.uBrick, S.grid === 'brick' ? 1 : 0);
      gl.uniform1f(u.uSteps, Math.round(S.steps));
      gl.uniform1f(u.uMin, S.min);
      gl.uniform1f(u.uMax, S.max);
      gl.uniform1f(u.uPattern, PATTERNS[S.pattern] || 0);
      gl.uniform1f(u.uGain, S.gain);
      gl.uniform1f(u.uGamma, S.gamma);
      gl.uniform1f(u.uDetail, S.detail);
      gl.uniform1f(u.uCutoff, S.cutoff);
      gl.uniform1f(u.uColor, COLORS[S.color] || 0);
      gl.uniform3fv(u.uTint, hex(S.tint));
      gl.uniform3fv(u.uTint2, hex(S.tint2));
      gl.uniform1f(u.uSat, S.sat);
      gl.uniform1f(u.uLift, S.lift / 255);
      gl.uniform1f(u.uAlpha, S.alpha);
      gl.uniform1f(u.uAlphaTone, S.alphaTone);
      gl.uniform1f(u.uJitter, S.jitter);
      gl.uniform1f(u.uDrift, S.drift);
      gl.uniform1f(u.uCrisp, st.crisp || 0);
      var L = st.lens;
      gl.uniform4f(u.uLens, L ? L.x : 0, L ? L.y : 0, L ? L.r : 0, L ? L.s : 0);
      var amt = st.blobs || 0;
      gl.uniform1f(u.uBlobs, amt);
      if (amt > 0.01) {
        var hw = W / dpr / 2, hh = H / dpr / 2, R0 = Math.min(hw, hh) * 0.4 * amt, tt = t * 1.8;
        for (var i = 0; i < 4; i++) {
          var B = BLOBS[i];
          blobBuf[i * 3]     = hw + hw * (0.5 * Math.sin(tt * B[0] + B[1]) + 0.16 * Math.sin(tt * B[0] * 2.3 + B[2]));
          blobBuf[i * 3 + 1] = hh + hh * (0.5 * Math.sin(tt * B[3] + B[4]) + 0.16 * Math.sin(tt * B[3] * 1.9 + B[1]));
          blobBuf[i * 3 + 2] = Math.pow(R0 * B[5] * (0.75 + 0.25 * Math.sin(tt * 0.5 + B[2])), 2);
        }
        gl.uniform3fv(u['uBlob[0]'], blobBuf);
      }
      gl.uniform1f(u.uBright, st.bright || 1);
      gl.uniform1f(u.uContrast, st.contrast || 1);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // the viewport is the bottom-left corner of the shared canvas
      ctx.globalCompositeOperation = 'copy';
      ctx.drawImage(g.cv, 0, g.cv.height - H, W, H, 0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      ms = performance.now() - t0;
    }

    return { size: size, draw: draw, time: function () { return ms; } };
  }

  window.NVHalftone = {
    KEY: KEY, SCHEMA: SCHEMA, PRESETS: PRESETS,
    defaults: defaults, clean: clean, load: load, save: save, preset: preset, create: create, filterOf: filterOf
  };
})();
