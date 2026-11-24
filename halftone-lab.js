/* Halftone lab (halftone-lab.html): sliders for every setting halftone.js
   takes, shown live on a closed and an open card. Settings are saved in
   localStorage, where the home prototype (index3.html) reads them. */
(function () {
  'use strict';

  var HT = window.NVHalftone;
  if (!HT) return;

  // the home cards' animations, with the inline styles they have in index.html
  var ANIMS = [
    { name: 'Steering robot',      file: 'steeringAnim',        style: 'left: 44%; top: 52%; max-width: 300%; filter: brightness(1.75);' },
    { name: 'Motion platform',     file: 'platform',            style: 'left: 53%; top: 50%; max-width: 170%; filter: contrast(1.3) brightness(1);' },
    { name: '6DOF desktop arm',    file: 'armanim-compressed',  style: 'left: 50%; top: 50%; max-width: 190%; filter: brightness(1.25);' },
    { name: 'Cuff-link',           file: 'cufflinkanim',        style: 'left: 58%; top: 53%; max-width: 300%; filter: brightness(1.45);' },
    { name: 'Propeller research',  src: 'assets/anim/tubaa.mp4', poster: 'assets/anim/tubaa.jpg', style: 'right: 0%; top: 50%; max-width: 115%;' },
    { name: 'Cycloid generator',   file: 'desmosAnim1',         style: 'left: 56%; top: 49%; max-height: 140%;' },
    { name: 'Braille display',     file: 'BraileAnim',          style: 'left: 56%; max-width: 180%;' },
    { name: 'Cycloidal actuator',  file: 'CycloidAnim',         style: '' },
    { name: '6DOF arm controller', file: 'armcont-compressed',  style: 'left: 56%; top: 50%; max-height: 130%;' },
    { name: 'Liquid piston',       file: 'liq-compressed',      style: 'left: 54%;' },
    { name: 'Sumo controller',     file: 'sumo-anim',           style: 'left: 56%; top: 50%; max-height: 110%;' },
    { name: 'Metal anodizer',      file: 'anodanim',            style: 'left: 54%; top: 49%; max-width: 130%; max-height: 100%;' }
  ];
  var ANIM_KEY = 'nv-halftone-anim';

  var $ = function (id) { return document.getElementById(id); };
  var S = HT.load();
  var stage = $('stage');

  /* ---- the two cards ---- */
  var cards = Array.prototype.map.call(document.querySelectorAll('.lab-card'), function (el) {
    var c = {
      el: el, v: el.querySelector('video'), cv: el.querySelector('canvas'),
      open: el.getAttribute('data-card') === 'open',
      poster: null, filter: 'none', bright: 1, contrast: 1,
      lens: 0, lx: 0, ly: 0, tx: 0, ty: 0, over: false, last: 0
    };
    c.ht = HT.create(c.cv);
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      c.tx = e.clientX - r.left; c.ty = e.clientY - r.top;
      if (!c.over) { c.lx = c.tx; c.ly = c.ty; }
      c.over = true;
    });
    el.addEventListener('pointerleave', function () { c.over = false; });
    return c;
  });

  function setAnim(i) {
    var A = ANIMS[i] || ANIMS[0];
    var small = window.innerWidth <= 1100;
    var src = A.src || 'assets/anim/' + A.file + (small ? '-960.mp4' : '-1280.mp4');
    var poster = A.poster || 'assets/anim/' + A.file + '-960.jpg';
    var f = HT.filterOf(A.style);
    cards.forEach(function (c) {
      c.filter = f.filter; c.bright = f.bright; c.contrast = f.contrast;
      c.poster = null;
      var im = new Image();
      im.onload = function () { c.poster = im; };
      im.src = poster;
      c.v.setAttribute('style', A.style);
      c.v.poster = poster;
      c.v.src = src;
      var p = c.v.play();
      if (p && p.catch) p.catch(function () {});
    });
    try { localStorage.setItem(ANIM_KEY, String(i)); } catch (_) {}
  }

  var animSel = $('anim');
  ANIMS.forEach(function (A, i) {
    var o = document.createElement('option');
    o.value = i; o.textContent = A.name;
    animSel.appendChild(o);
  });
  var startAnim = 1;
  try { var sa = parseInt(localStorage.getItem(ANIM_KEY), 10); if (ANIMS[sa]) startAnim = sa; } catch (_) {}
  animSel.value = startAnim;
  animSel.addEventListener('change', function () { setAnim(parseInt(animSel.value, 10)); });
  setAnim(startAnim);

  /* ---- settings controls, built from the schema ---- */
  var form = $('controls'), inputs = {}, outs = {}, rows = {};
  var groups = {};
  Object.keys(HT.SCHEMA).forEach(function (k) {
    var d = HT.SCHEMA[k];
    var g = groups[d.group];
    if (!g) {
      g = groups[d.group] = document.createElement('fieldset');
      g.className = 'lab-group';
      var lg = document.createElement('legend');
      lg.textContent = d.group;
      g.appendChild(lg);
      form.appendChild(g);
    }
    var row = document.createElement('label');
    row.className = 'lab-row';
    var name = document.createElement('span');
    name.textContent = d.label;
    row.appendChild(name);
    var inp;
    if (d.options) {
      inp = document.createElement('select');
      d.options.forEach(function (op) {
        var o = document.createElement('option');
        o.value = op; o.textContent = op.charAt(0).toUpperCase() + op.slice(1);
        inp.appendChild(o);
      });
    } else {
      inp = document.createElement('input');
      if (d.color) inp.type = 'color';
      else { inp.type = 'range'; inp.min = d.min; inp.max = d.max; inp.step = d.step; }
      var out = document.createElement('output');
      outs[k] = out;
    }
    inp.name = k;
    row.appendChild(inp);
    if (outs[k]) row.appendChild(outs[k]);
    inp.addEventListener('input', function () {
      S[k] = d.options || d.color ? inp.value : parseFloat(inp.value);
      changed();
    });
    inputs[k] = inp; rows[k] = row;
    g.appendChild(row);
  });

  function fmt(k) {
    var d = HT.SCHEMA[k], v = S[k];
    if (d.color) return '';
    if (d.unit) return v + ' ' + d.unit;
    return d.step >= 1 ? String(v) : v.toFixed(2);
  }

  var jsonBox = $('json');
  function show(skipJson) {
    Object.keys(inputs).forEach(function (k) {
      if (inputs[k].value !== String(S[k])) inputs[k].value = S[k];
      if (outs[k]) outs[k].textContent = fmt(k);
    });
    rows.tint.classList.toggle('is-off', S.color === 'source');
    rows.tint2.classList.toggle('is-off', S.color !== 'duo');
    rows.sat.classList.toggle('is-off', S.color !== 'source');
    rows.lift.classList.toggle('is-off', S.color !== 'source');
    rows.pattern.classList.toggle('is-off', S.steps < 1);
    if (!skipJson) jsonBox.value = JSON.stringify(S, null, 1);
  }

  var saveTimer = 0;
  function changed(skipJson) {
    show(skipJson);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { HT.save(S); }, 120);
  }

  var presetBox = $('presets');
  Object.keys(HT.PRESETS).forEach(function (name) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = name;
    b.addEventListener('click', function () { S = HT.preset(name); changed(); });
    presetBox.appendChild(b);
  });

  jsonBox.addEventListener('input', function () {
    try { S = HT.clean(JSON.parse(jsonBox.value)); changed(true); } catch (_) {}
  });
  jsonBox.addEventListener('blur', function () { show(); });
  $('reset').addEventListener('click', function () { S = HT.defaults(); changed(); });
  $('copy').addEventListener('click', function () {
    var btn = this, text = JSON.stringify(S);
    function done() { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 1200); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    else { jsonBox.focus(); jsonBox.select(); try { document.execCommand('copy'); done(); } catch (_) {} }
  });
  // settings changed in another tab
  window.addEventListener('storage', function (e) { if (e.key === HT.KEY) { S = HT.load(); show(); } });

  /* ---- stage tools ---- */
  var crisp = 0, playing = null;
  var crispIn = $('crisp'), crispOut = $('crispOut');
  function setCrisp(v) {
    crisp = v;
    crispIn.value = v;
    crispOut.textContent = Math.round(v * 100) + '%';
  }
  crispIn.addEventListener('input', function () { playing = null; setCrisp(parseFloat(crispIn.value)); });
  $('play').addEventListener('click', function () { playing = { t0: performance.now() }; });

  var patches = $('patches');

  var cmp = $('compare');
  function compare(on) { stage.classList.toggle('is-compare', on); cmp.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  cmp.addEventListener('pointerdown', function (e) { e.preventDefault(); compare(true); });
  ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach(function (n) { cmp.addEventListener(n, function () { compare(false); }); });
  cmp.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); compare(true); } });
  cmp.addEventListener('keyup', function () { compare(false); });

  /* ---- drawing ---- */
  var stat = $('stat'), statAt = 0, prev = 0;
  function ease(t) { return t * t * (3 - 2 * t); }

  function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.1, (now - prev) / 1000 || 0);
    prev = now;

    if (playing) {                       // 0.9 s in, hold, 0.6 s out, as on the prototype
      var e = (now - playing.t0) / 1000;
      if (e < 0.9) setCrisp(e / 0.9);
      else if (e < 1.9) setCrisp(1);
      else if (e < 2.5) setCrisp(1 - (e - 1.9) / 0.6);
      else { setCrisp(0); playing = null; }
    }

    var gap = 1000 / S.fps;
    var kind = patches.value;
    cards.forEach(function (c) {
      var lensT = kind === 'lens' && c.over ? 1 : 0;
      c.lens += (lensT - c.lens) * Math.min(1, dt * 9);
      if (c.lens < 0.005 && !lensT) c.lens = 0;
      c.lx += (c.tx - c.lx) * Math.min(1, dt * 14);
      c.ly += (c.ty - c.ly) * Math.min(1, dt * 14);

      var w = c.el.clientWidth, h = c.el.clientHeight;
      if (!w || !h) return;
      var resized = c.ht.size(w, h);
      if (!resized && !playing && !c.lens && now - c.last < gap) return;
      var v = c.v;
      var src = v.readyState >= 2 && v.videoWidth ? v : c.poster;
      if (!src) return;
      var vr = v.getBoundingClientRect(), br = c.el.getBoundingClientRect();
      if (!vr.width || !vr.height) return;
      c.ht.draw(src, { x: vr.left - br.left, y: vr.top - br.top, w: vr.width, h: vr.height }, S, {
        crisp: c.open ? ease(crisp) : 0,
        lens: c.lens ? { x: c.lx, y: c.ly, r: Math.min(w, h) * 0.3, s: c.lens } : null,
        blobs: kind === 'blobs' ? 1 : 0,
        filter: c.filter, bright: c.bright, contrast: c.contrast
      }, now / 1000);
      c.last = now;
    });

    if (now - statAt > 500) {
      statAt = now;
      var a = cards[0], b = cards[1];
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var cells = function (c) { return Math.round(c.el.clientWidth / S.cell) * Math.round(c.el.clientHeight / S.cell); };
      stat.textContent = 'Script time a frame: ' + a.ht.time().toFixed(1) + ' ms (closed), ' + b.ht.time().toFixed(1) +
        ' ms (open). ' + cells(a) + ' and ' + cells(b) + ' cells, ' + (Math.round(dpr * 100) / 100) + ' device pixels per px.';
    }
  }

  show();
  requestAnimationFrame(loop);
})();
