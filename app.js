/* Shared by index / gallery / about / blog: loader + gallery modal.
   Home-page carousel logic lives in home.js. */

window.addEventListener('load', function () {
  var modal = document.getElementById('modal');
  var modalImg = document.getElementById('modalImage');
  var imgs = Array.from(document.querySelectorAll('.gallery-img'));
  var span = document.querySelector('.close');

  if (!modal || !modalImg || imgs.length === 0) return;

  function fadeTo(alpha, duration, done) {
    if (window.gsap) {
      gsap.to(modal, { autoAlpha: alpha, duration: duration, onComplete: done });
    } else {
      modal.style.opacity = alpha;
      if (done) done();
    }
  }

  imgs.forEach(function (img) {
    img.addEventListener('click', function () {
      modalImg.src = this.src;
      modal.style.visibility = 'visible';
      fadeTo(1, 1);
    });
  });

  function close() {
    fadeTo(0, 0.5, function () { modal.style.visibility = 'hidden'; });
  }

  if (span) span.addEventListener('click', close);
  window.addEventListener('click', function (event) {
    if (event.target === modal) close();
  });
});

/* loading screen
   A cycloidal disc (drawn from the same equations as the cycloid generator)
   turns above "LOADING" while the text resolves, then the whole screen
   dissolves into the page through an ordered-dither mask. */
(function () {
  var loader = document.getElementById('loader');
  var loaderText = document.getElementById('loaderText');
  if (!loader || !loaderText) return;

  var HOLD = 1600;        // ms the loader stays up
  var SCRAMBLE = 1150;    // ms for LOADING to resolve
  var DISSOLVE = 560;     // ms for the dither-out
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  loader.style.display = 'flex';
  var cv = document.createElement('canvas');
  cv.id = 'loaderAnim';
  cv.setAttribute('aria-hidden', 'true');
  loader.insertBefore(cv, loader.firstChild);
  var stopDisc = cycloidDisc(cv);

  scrambleText(loaderText, 'LOADING', reduced ? 0 : SCRAMBLE);

  setTimeout(function () {
    ditherOut(loader, reduced ? 0 : DISSOLVE, function () {
      loader.style.display = 'none';
      stopDisc();
    });
  }, reduced ? 400 : HOLD);
})();

/* the loader's disc: 12 pins, an 11-lobe disc wobbling on its eccentric */
function cycloidDisc(canvas) {
  var ctx = canvas.getContext('2d');
  var N = 12, R = 1, E = 0.055, S = 0.13, K = 600, prof = [];
  for (var i = 0; i < K; i++) {
    var t = (i / K) * 2 * Math.PI;
    var b = -Math.atan(Math.sin((1 - N) * t) / ((R / (E * N)) - Math.cos((1 - N) * t)));
    prof.push(R * Math.cos(t) - S * Math.cos(t - b) - E * Math.cos(N * t),
              -R * Math.sin(t) + S * Math.sin(t - b) + E * Math.sin(N * t));
  }
  var raf = 0, t0 = performance.now();

  function frame(now) {
    raf = requestAnimationFrame(frame);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth, px = Math.round(w * dpr);
    if (!px) return;
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
    var k = px / 2 / (R + S + 0.06), c = px / 2, lw = px / 260;
    var phi = (now - t0) * 0.0042;                  // input crank angle
    var rot = -phi / (N - 1);                       // the disc turns slowly backwards
    var ox = E * Math.cos(phi), oy = E * Math.sin(phi);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, px, px);

    ctx.lineWidth = lw * 1.3;                       // pins
    ctx.strokeStyle = 'rgba(120, 175, 255, 0.85)';
    for (var a = 0; a < N; a++) {
      var th = 2 * Math.PI * a / N;
      ctx.beginPath();
      ctx.arc(c + R * Math.cos(th) * k, c + R * Math.sin(th) * k, S * k, 0, 2 * Math.PI);
      ctx.stroke();
    }

    var cr = Math.cos(rot), sr = Math.sin(rot);     // disc
    ctx.beginPath();
    for (var j = 0; j < prof.length; j += 2) {
      var x = prof[j] * cr - prof[j + 1] * sr + ox, y = prof[j] * sr + prof[j + 1] * cr + oy;
      if (j === 0) ctx.moveTo(c + x * k, c + y * k); else ctx.lineTo(c + x * k, c + y * k);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 72, 102, 0.9)';
    ctx.fill();
    ctx.lineWidth = lw * 2;
    ctx.strokeStyle = 'rgba(95, 160, 255, 0.95)';
    ctx.stroke();

    ctx.beginPath();                                // output hole and the eccentric in it
    ctx.arc(c + ox * k, c + oy * k, 0.22 * k, 0, 2 * Math.PI);
    ctx.lineWidth = lw * 1.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c, c, (0.22 - E) * k * 0.92, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(95, 145, 255, 0.95)';
    ctx.fill();
  }
  raf = requestAnimationFrame(frame);
  return function () { cancelAnimationFrame(raf); };
}

/* remove an element by stepping an ordered (Bayer 4x4) dither mask from
   full to empty, so it breaks up into a pixel pattern instead of fading */
function ditherOut(el, ms, done) {
  var B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  if (!ms || !('maskImage' in el.style || 'webkitMaskImage' in el.style)) { if (done) done(); return; }
  var CELL = 3, tiles = [], c = document.createElement('canvas');
  c.width = c.height = 4 * CELL;
  var x = c.getContext('2d');
  for (var lvl = 0; lvl <= 16; lvl++) {
    x.clearRect(0, 0, c.width, c.height);
    x.fillStyle = '#000';
    for (var i = 0; i < 16; i++) if (B[i] >= lvl) x.fillRect((i % 4) * CELL, Math.floor(i / 4) * CELL, CELL, CELL);
    tiles.push('url(' + c.toDataURL() + ')');
  }
  var size = (4 * CELL) + 'px ' + (4 * CELL) + 'px';
  el.style.webkitMaskSize = el.style.maskSize = size;
  el.style.webkitMaskRepeat = el.style.maskRepeat = 'repeat';
  var t0 = performance.now();
  (function step(now) {
    var p = Math.min(1, (now - t0) / ms);
    var lvl = Math.min(16, Math.floor(p * p * 17));  // eases in: slow start, quick finish
    el.style.webkitMaskImage = el.style.maskImage = tiles[lvl];
    if (p < 1) requestAnimationFrame(step);
    else if (done) done();
  })(t0);
}

/* random characters that settle into finalText, left to right, over `time` ms */
function scrambleText(targetElement, finalText, time) {
  var randomChars = '!@#$%^&*()_+?><:{}[]';
  var n = finalText.length;
  if (!time) { targetElement.textContent = finalText; return; }
  var t0 = Date.now();
  var timer = setInterval(function () {
    var p = (Date.now() - t0) / time;
    var fixed = Math.min(n, Math.floor(p * (n + 1)));
    var out = finalText.substring(0, fixed);
    for (var i = fixed; i < n; i++) out += randomChars[Math.floor(Math.random() * randomChars.length)];
    targetElement.textContent = out;
    if (fixed >= n) { clearInterval(timer); targetElement.textContent = finalText; }
  }, 45);
}
