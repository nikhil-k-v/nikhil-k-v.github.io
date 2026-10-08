/* toggle-clamp.js
   A small side-view sketch of the over-center (toggle) clamp, animated:
   the handle swings down, the four-bar linkage carries the clamp arm onto
   the rim, and the link passes just over center so the clamp locks.
   Draws into every <svg class="ga-toggle-anim">. Runs only while visible. */

(function () {
  var svgs = document.querySelectorAll('svg.ga-toggle-anim');
  if (!svgs.length) return;

  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#1e1e1e', FILL = '#7b7c7e', RED = '#df3130';

  // linkage (units: px of the sketch, y up)
  var O = [0, 0];          // clamp arm pivot
  var H = [40, -10];       // handle pivot
  var RB = 18, RA = 14;    // arm and handle crank radii
  var PHI_LOCK = 60 * Math.PI / 180;
  var B0 = [RB * Math.cos(PHI_LOCK), RB * Math.sin(PHI_LOCK)];
  var TH_LOCK = Math.atan2(B0[1] - H[1], B0[0] - H[0]);          // H, A, B in line
  var C = Math.hypot(B0[0] - H[0], B0[1] - H[1]) - RA;           // coupler length
  var ARM_LEN = 80, ARM_OFF = 130 * Math.PI / 180;               // tip direction relative to B
  var HANDLE = 62;
  var OPEN = TH_LOCK - 58 * Math.PI / 180, SHUT = TH_LOCK + 8 * Math.PI / 180;

  function X(p) { return (p[0] + 104).toFixed(1); }
  function Y(p) { return (64 - p[1]).toFixed(1); }

  function solve(th) {
    var A = [H[0] + RA * Math.cos(th), H[1] + RA * Math.sin(th)];
    var d = Math.hypot(A[0], A[1]);
    var a = (RB * RB - C * C + d * d) / (2 * d);
    var h = Math.sqrt(Math.max(0, RB * RB - a * a));
    var ux = A[0] / d, uy = A[1] / d;
    var B = [a * ux - h * uy, a * uy + h * ux];
    return { A: A, B: B, phi: Math.atan2(B[1], B[0]) };
  }

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }

  function build(svg) {
    svg.setAttribute('viewBox', '0 0 180 122');
    // the rim, squeezed between the pad and the fixed jaw
    var tipLock = [ARM_LEN * Math.cos(PHI_LOCK + ARM_OFF), ARM_LEN * Math.sin(PHI_LOCK + ARM_OFF)];
    var rim = [tipLock[0], tipLock[1] - 15];
    el('path', { d: 'M' + X([-96, -38.5]) + ' ' + Y([-96, -38.5]) + ' L' + X([-8, -38.5]) + ' ' + Y([-8, -38.5]) + ' L' + X([-8, 6]) + ' ' + Y([-8, 6]) +
      ' L' + X([8, 6]) + ' ' + Y([8, 6]) + ' L' + X([48, -2]) + ' ' + Y([48, -2]) + ' L' + X([48, -48]) + ' ' + Y([48, -48]) + ' L' + X([-96, -48]) + ' ' + Y([-96, -48]) + ' Z',
      fill: FILL, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
    el('circle', { cx: X(rim), cy: Y(rim), r: 9.5, fill: '#cfd4da', stroke: INK, 'stroke-width': 2 }, svg);
    var parts = {
      link: el('line', { stroke: RED, 'stroke-width': 1.4, 'stroke-dasharray': '3 2.5', opacity: 0 }, svg),
      armOut: el('path', { fill: 'none', stroke: INK, 'stroke-width': 9.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg),
      arm: el('path', { fill: 'none', stroke: '#c9ced4', 'stroke-width': 5.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg),
      coupler: el('line', { stroke: INK, 'stroke-width': 4.2, 'stroke-linecap': 'round' }, svg),
      handle: el('line', { stroke: '#2c2f33', 'stroke-width': 6.5, 'stroke-linecap': 'round' }, svg),
      pins: []
    };
    for (var i = 0; i < 4; i++) parts.pins.push(el('circle', { r: 2.4, fill: '#fff', stroke: INK, 'stroke-width': 1.3 }, svg));
    parts.label = el('text', { x: 118, y: 14, 'font-size': 8.5, 'font-weight': 600, 'font-family': 'Montserrat, montserrat, sans-serif', fill: RED, opacity: 0 }, svg);
    parts.label.textContent = 'over center';
    return parts;
  }

  function draw(parts, th) {
    var s = solve(th);
    var tipDir = s.phi + ARM_OFF;
    var tip = [ARM_LEN * Math.cos(tipDir), ARM_LEN * Math.sin(tipDir)];
    var nx = -Math.sin(tipDir), ny = Math.cos(tipDir);
    // arm: a bar from the pivot out to the pad, plus the short lever to B
    var padA = [tip[0] + nx * 6, tip[1] + ny * 6], padB = [tip[0] - nx * 6, tip[1] - ny * 6];
    var d = 'M' + X(s.B) + ' ' + Y(s.B) + ' L' + X(O) + ' ' + Y(O) + ' L' + X(tip) + ' ' + Y(tip) +
            ' M' + X(padA) + ' ' + Y(padA) + ' L' + X(padB) + ' ' + Y(padB);
    parts.armOut.setAttribute('d', d);
    parts.arm.setAttribute('d', d);
    parts.coupler.setAttribute('x1', X(s.A)); parts.coupler.setAttribute('y1', Y(s.A));
    parts.coupler.setAttribute('x2', X(s.B)); parts.coupler.setAttribute('y2', Y(s.B));
    var hEnd = [H[0] + HANDLE * Math.cos(th), H[1] + HANDLE * Math.sin(th)];
    parts.handle.setAttribute('x1', X(H)); parts.handle.setAttribute('y1', Y(H));
    parts.handle.setAttribute('x2', X(hEnd)); parts.handle.setAttribute('y2', Y(hEnd));
    // the H-A-B line, shown as the linkage comes into line
    var near = Math.max(0, 1 - Math.abs(th - TH_LOCK) / (16 * Math.PI / 180));
    parts.link.setAttribute('x1', X(H)); parts.link.setAttribute('y1', Y(H));
    parts.link.setAttribute('x2', X(s.B)); parts.link.setAttribute('y2', Y(s.B));
    parts.link.setAttribute('opacity', (near * 0.95).toFixed(2));
    parts.label.setAttribute('opacity', (th > TH_LOCK - 0.02 ? 1 : near * 0.6).toFixed(2));
    [O, H, s.A, s.B].forEach(function (p, i) { parts.pins[i].setAttribute('cx', X(p)); parts.pins[i].setAttribute('cy', Y(p)); });
  }

  var ease = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PERIOD = 4200;

  function angleAt(t) {
    // close (1.4 s), hold shut, open (1.2 s), hold open
    var u = (t % PERIOD) / PERIOD;
    if (u < 0.33) return OPEN + (SHUT - OPEN) * ease(u / 0.33);
    if (u < 0.6) return SHUT;
    if (u < 0.88) return SHUT + (OPEN - SHUT) * ease((u - 0.6) / 0.28);
    return OPEN;
  }

  Array.prototype.forEach.call(svgs, function (svg) {
    var parts = build(svg);
    draw(parts, reduce ? SHUT : OPEN);
    if (reduce) return;
    var raf = 0, t0 = 0;
    function frame(now) {
      if (!t0) t0 = now;
      draw(parts, angleAt(now - t0));
      raf = requestAnimationFrame(frame);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(frame); }
          else if (raf) { cancelAnimationFrame(raf); raf = 0; }
        });
      }).observe(svg);
    } else {
      raf = requestAnimationFrame(frame);
    }
  });
})();
