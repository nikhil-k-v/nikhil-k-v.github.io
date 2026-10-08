/* cycloid-sim.js — the disc running inside its pins, drawn from the same
   equations as the generator:
     x(t) = R cos t − S cos(t − b) − E cos(Nt)
     y(t) = −R sin t + S sin(t − b) + E sin(Nt)
     b(t) = −atan( sin((1−N)t) / (R/(EN) − cos((1−N)t)) )
   The input crank turns the disc centre around the pin-ring centre at radius
   E; for every N−1 turns of the crank the disc turns once the other way. */

(function () {
  'use strict';
  var root = document.getElementById('cyc-sim');
  if (!root) return;

  var canvas = root.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var nIn = root.querySelector('[data-k="n"]');
  var qIn = root.querySelector('[data-k="q"]');
  var nOut = root.querySelector('[data-o="n"]');
  var qOut = root.querySelector('[data-o="q"]');
  var inOut = root.querySelector('[data-o="in"]');
  var outOut = root.querySelector('[data-o="out"]');
  var ratioOut = root.querySelector('[data-o="ratio"]');
  var btn = root.querySelector('button');

  var INK = '#f0f0f0', SOFT = 'rgba(240,240,240,0.35)', ACC = '#ff6b81', BLUE = '#8fc3f5';
  var DISC = 'rgba(143,195,245,0.10)';
  var R = 1, N, E, S, prof = [];
  var phi = 0;                 // input crank angle (rad)
  var running = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true, last = 0;

  function build() {
    N = parseInt(nIn.value, 10);
    var q = parseFloat(qIn.value);
    E = q * R / N;
    S = 0.3 * Math.PI * R / N;           // pins sized to their spacing
    var K = 1400, b, t;
    prof = new Float32Array(K * 2);
    for (var i = 0; i < K; i++) {
      t = (i / K) * 2 * Math.PI;
      b = -Math.atan(Math.sin((1 - N) * t) / ((R / (E * N)) - Math.cos((1 - N) * t)));
      prof[i * 2] = R * Math.cos(t) - S * Math.cos(t - b) - E * Math.cos(N * t);
      prof[i * 2 + 1] = -R * Math.sin(t) + S * Math.sin(t - b) + E * Math.sin(N * t);
    }
    nOut.textContent = N;
    qOut.textContent = q.toFixed(2);
    ratioOut.textContent = (N - 1) + ' : 1';
    phi = 0;
    draw();
  }

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(w * dpr);
    draw();
  }

  function draw() {
    var W = canvas.width, k = W / 2 / (R + 0.32), cx = W / 2, cy = W / 2;
    var lw = W / 420;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, W);

    // pin ring centred at (−E, 0), as in the generator; shift so it sits centred
    var c = -phi / (N - 1);                       // disc rotation
    var m = E * Math.cos(c * (N - 1)), m2 = -E * Math.sin(c * (N - 1));
    function X(x) { return cx + (x + E) * k; }
    function Y(y) { return cy - y * k; }

    // pins
    ctx.lineWidth = lw * 1.4;
    ctx.strokeStyle = SOFT;
    for (var a = 1; a <= N; a++) {
      var th = 2 * Math.PI * a / N;
      ctx.beginPath();
      ctx.arc(X(-R * Math.cos(th) - E), Y(-R * Math.sin(th)), S * k, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // disc
    var cc = Math.cos(c), ss = Math.sin(c);
    ctx.beginPath();
    for (var i = 0; i < prof.length; i += 2) {
      var f = prof[i], g = prof[i + 1];
      var x = f * cc - g * ss + m - E, y = f * ss + g * cc + m2;
      if (i === 0) ctx.moveTo(X(x), Y(y)); else ctx.lineTo(X(x), Y(y));
    }
    ctx.closePath();
    ctx.fillStyle = DISC;
    ctx.fill();
    ctx.lineWidth = lw * 2;
    ctx.strokeStyle = INK;
    ctx.stroke();

    // disc centre and a mark fixed to the disc (shows the slow output)
    var dx = m - E, dy = m2;
    var mx = dx + 0.62 * R * Math.cos(c + Math.PI / 2), my = dy + 0.62 * R * Math.sin(c + Math.PI / 2);
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = lw * 2.2;
    ctx.beginPath(); ctx.moveTo(X(dx), Y(dy)); ctx.lineTo(X(mx), Y(my)); ctx.stroke();
    ctx.fillStyle = BLUE;
    ctx.beginPath(); ctx.arc(X(mx), Y(my), lw * 4, 0, 2 * Math.PI); ctx.fill();

    // input crank: ring centre to disc centre
    ctx.strokeStyle = ACC;
    ctx.lineWidth = lw * 3;
    ctx.beginPath(); ctx.moveTo(X(-E), Y(0)); ctx.lineTo(X(dx), Y(dy)); ctx.stroke();
    ctx.fillStyle = ACC;
    ctx.beginPath(); ctx.arc(X(-E), Y(0), lw * 4, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(X(dx), Y(dy), lw * 3, 0, 2 * Math.PI); ctx.fill();

    var turnsIn = phi / (2 * Math.PI);
    inOut.textContent = turnsIn.toFixed(1);
    outOut.textContent = (turnsIn / (N - 1)).toFixed(3);
  }

  function tick(now) {
    requestAnimationFrame(tick);
    var dt = Math.min(now - last, 50); last = now;
    if (!running || !visible) return;
    phi += dt * 0.0026;                 // a little under half a turn per second
    draw();
  }

  btn.addEventListener('click', function () {
    running = !running;
    btn.textContent = running ? 'Pause' : 'Play';
    btn.setAttribute('aria-pressed', running ? 'false' : 'true');
  });
  btn.textContent = running ? 'Pause' : 'Play';
  nIn.addEventListener('input', build);
  qIn.addEventListener('input', build);
  window.addEventListener('resize', size);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0.05 }).observe(canvas);
  }

  build();
  size();
  requestAnimationFrame(function (t) { last = t; tick(t); });
})();
