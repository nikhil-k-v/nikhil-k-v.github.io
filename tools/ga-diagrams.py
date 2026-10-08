#!/usr/bin/env python3
"""
Hand-drawn style SVG diagrams for the steering robot page (pages/genauto.html).

    python3 tools/ga-diagrams.py

Writes into assets/GenAutoVids/slides/:
  clamp-fourbar.svg   the clamp's draw latch as a plain four-bar, open (dashed) and shut
  shape-solution.svg  the wheel coupling's two lower arms on a round wheel: they pivot
                      below the wheel's centre, so the arc each clamp sweeps is not
                      concentric with the rim and crosses it at exactly one point
  shape-examples.svg  the same arms on an oval, a squarish and a flat-bottomed wheel

Lines get a small deterministic wobble so they read as sketched.
"""
import math, os, random

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'assets', 'GenAutoVids', 'slides')

INK = '#1e1e1e'
RIM = '#7b7c7e'      # same grey as the wheel sketches on the page
RIM_DARK = '#3d434b'
RED = '#df3130'
ARM = '#2c2f33'

rng = random.Random(7)


def wobble(pts, amp=0.7, closed=False):
    """nudge each point sideways by a slow random wave"""
    n = len(pts)
    p1, p2, f1, f2 = rng.uniform(0, 6.3), rng.uniform(0, 6.3), rng.uniform(0.05, 0.09), rng.uniform(0.15, 0.25)
    out = []
    for i, (x, y) in enumerate(pts):
        a = pts[(i - 1) % n] if (closed or i > 0) else pts[i]
        b = pts[(i + 1) % n] if (closed or i < n - 1) else pts[i]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        w = amp * (0.7 * math.sin(i * f1 * 6 + p1) + 0.3 * math.sin(i * f2 * 6 + p2))
        out.append((x + nx * w, y + ny * w))
    return out


def d(pts, closed=False):
    s = 'M' + ' L'.join('%.1f %.1f' % p for p in pts)
    return s + (' Z' if closed else '')


def line(a, b, n=None, amp=0.6):
    n = n or max(8, int(math.hypot(b[0] - a[0], b[1] - a[1]) / 3))
    pts = [(a[0] + (b[0] - a[0]) * t / n, a[1] + (b[1] - a[1]) * t / n) for t in range(n + 1)]
    return d(wobble(pts, amp))


def arc_pts(c, r, a0, a1, n=60):
    return [(c[0] + r * math.cos(a0 + (a1 - a0) * t / n), c[1] + r * math.sin(a0 + (a1 - a0) * t / n)) for t in range(n + 1)]


def circle(c, r, **kw):
    pts = arc_pts(c, r, 0, 2 * math.pi, max(24, int(r * 1.6)))[:-1]
    return path(d(wobble(pts, kw.pop('amp', 0.5), True), True), **kw)


def path(dd, stroke=INK, width=2.4, fill='none', extra=''):
    return '<path d="%s" fill="%s" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round"%s/>' % (dd, fill, stroke, width, extra)


def arrowhead(tip, ang, size=7, color=INK, width=2.2):
    a1, a2 = ang + math.radians(150), ang - math.radians(150)
    p1 = (tip[0] + size * math.cos(a1), tip[1] + size * math.sin(a1))
    p2 = (tip[0] + size * math.cos(a2), tip[1] + size * math.sin(a2))
    return path(d([p1, tip, p2]), stroke=color, width=width)


def svg(w, h, body, label, x0=0, y0=0):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%d %d %d %d" width="%d" height="%d" role="img" aria-label="%s">\n'
            '<rect x="%d" y="%d" width="%d" height="%d" fill="#ffffff"/>\n%s\n</svg>\n') % (x0, y0, w, h, w * 2, h * 2, label, x0, y0, w, h, '\n'.join(body))


# ---------------------------------------------------------------- steering wheels

def outline(kind, c, s):
    """outer edge of a steering wheel of size s, as a closed list of points (y down)"""
    pts = []
    N = 180
    for i in range(N):
        t = 2 * math.pi * i / N
        x, y = s * math.cos(t), s * math.sin(t)
        if kind == 'flat':                      # flat bottom (a "D")
            if y > 0.7 * s:
                y = 0.7 * s + (y - 0.7 * s) * 0.06
        elif kind == 'flattb':                  # flat top and bottom
            x *= 1.04
            if y > 0.74 * s:
                y = 0.74 * s + (y - 0.74 * s) * 0.06
            if y < -0.78 * s:
                y = -0.78 * s + (y + 0.78 * s) * 0.06
        elif kind == 'small':
            x, y = 0.82 * x, 0.82 * y
        pts.append((c[0] + x, c[1] + y))
    return pts


def wheel(kind, c, s):
    """a steering wheel as one block of grey inside its outline"""
    mid = outline(kind, c, s)
    sw = 1.4 + s * 0.012
    body = [path(d(wobble(mid, 0.45, True), True), fill=RIM, width=sw * 1.2)]
    return body, mid


def ray_hit(mid, c, ang):
    """where a ray from c at angle ang crosses the rim centre-line"""
    best = None
    ux, uy = math.cos(ang), math.sin(ang)
    for i in range(len(mid)):
        a, b = mid[i], mid[(i + 1) % len(mid)]
        # solve c + t u = a + s (b - a)
        ex, ey = b[0] - a[0], b[1] - a[1]
        den = ux * ey - uy * ex
        if abs(den) < 1e-9:
            continue
        t = ((a[0] - c[0]) * ey - (a[1] - c[1]) * ex) / den
        s = ((a[0] - c[0]) * uy - (a[1] - c[1]) * ux) / den
        if t > 0 and 0 <= s <= 1 and (best is None or t < best):
            best = t
    return (c[0] + ux * best, c[1] + uy * best)


def inside(poly, p):
    x, y = p
    res = False
    for i in range(len(poly)):
        (x1, y1), (x2, y2) = poly[i - 1], poly[i]
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
            res = not res
    return res


def arms(mid, c, s, side_scale=1.0, arc_span=0.95, big=True):
    """top arm + two geared lower arms. The lower arms pivot below the centre;
    each clamp sweeps an arc about its own pivot and stops where that arc
    meets the rim."""
    # pivots just below the centre, either side of it; arm length set so the
    # clamps meet a round rim about 42 degrees below horizontal
    g, dy = 0.10 * s, 0.45 * s
    T = (-s * math.cos(math.radians(38)), s * math.sin(math.radians(38)))
    L = math.hypot(T[0] + g, T[1] - dy)
    body = []
    w_arm = 6.4 if big else 3.2
    dot = 5.5 if big else 3.0
    top = ray_hit(mid, c, -math.pi / 2)
    tips = []
    for sign in (-1, 1):
        P = (c[0] + sign * g, c[1] + dy)
        # swing the clamp from pointing sideways down towards the bottom
        # until it leaves the wheel: that is where its arc meets the rim
        start = math.pi if sign < 0 else 0.0
        hit = None
        prev_in = inside(mid, (P[0] + L * math.cos(start), P[1] + L * math.sin(start)))
        for k in range(1, 721):
            phi = start + sign * math.radians(k * 0.25)
            q = (P[0] + L * math.cos(phi), P[1] + L * math.sin(phi))
            now_in = inside(mid, q)
            if now_in != prev_in:
                hit = phi
                break
            prev_in = now_in
        if hit is None:
            hit = start + sign * math.radians(45)
        # the arc it sweeps (red), longer than needed on both sides of the hit
        a0, a1 = hit - arc_span * 0.8, hit + arc_span * 0.8
        body.append(path(d(wobble(arc_pts(P, L, a0, a1, 60), 0.7)), stroke=RED, width=3.2 if big else 1.8, extra=' opacity="0.9"'))
        tip = (P[0] + L * math.cos(hit), P[1] + L * math.sin(hit))
        tips.append((P, tip))
    # top arm (to the top clamp)
    body.append(path(line(c, top, amp=0.3), stroke=ARM, width=w_arm))
    for P, tip in tips:
        body.append(path(line(P, tip, amp=0.3), stroke=ARM, width=w_arm))
    # meshed gears at the two pivots
    for P, _ in tips:
        r = g * 0.92
        teeth = []
        for k in range(14):
            a = 2 * math.pi * k / 14
            teeth.append(path(d([(P[0] + r * math.cos(a), P[1] + r * math.sin(a)),
                                 (P[0] + (r + (2.0 if big else 1.0)) * math.cos(a), P[1] + (r + (2.0 if big else 1.0)) * math.sin(a))]),
                              stroke=ARM, width=1.5 if big else 0.8))
        body.extend(teeth)
        body.append(circle(P, r, fill=RIM_DARK, stroke=ARM, width=1.4 if big else 0.8))
        body.append('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#ffffff"/>' % (P[0], P[1], 1.4 if big else 0.8))
    for _, tip in tips:
        body.append('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s" stroke="%s" stroke-width="1.1"/>' % (tip[0], tip[1], dot, RED, INK))
    body.append('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s" stroke="%s" stroke-width="1.1"/>' % (top[0], top[1], dot, RED, INK))
    # wheel centre
    body.append('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="none" stroke="%s" stroke-width="1.2" stroke-dasharray="2 2"/>' % (c[0], c[1], 3.5 if big else 2, INK))
    return body


def shape_arms():
    c, s = (120.0, 122.0), 86.0
    body, mid = wheel('round', c, s)
    body += arms(mid, c, s, arc_span=1.1)
    return svg(240, 236, body,
               'A round steering wheel with the coupling on it: a top arm up to the top clamp, and two geared lower arms '
               'that pivot below the centre. Each lower clamp sweeps a red arc about its own pivot, which is not '
               'concentric with the rim, so it crosses the rim at one point.')


def shape_examples():
    body = []
    cells = [('flat', (70, 66)), ('flattb', (205, 66)), ('small', (137, 182))]
    for kind, c in cells:
        s = 46.0
        b, mid = wheel(kind, c, s)
        body += b
        body += arms(mid, c, s, arc_span=1.15, big=False)
    return svg(275, 246, body,
               'The same coupling on a flat-bottomed wheel, a wheel flat on top and bottom, and a smaller round wheel: in each, '
               'the lower clamps stop where their arcs cross the rim.')


# ---------------------------------------------------------------- the clamp's four-bar

def rot(p, c, a):
    x, y = p[0] - c[0], p[1] - c[1]
    return (c[0] + x * math.cos(a) - y * math.sin(a), c[1] + x * math.sin(a) + y * math.cos(a))


def circ_meet(A, rA, C, rC, near):
    """intersection of two circles closest to `near`"""
    dx, dy = C[0] - A[0], C[1] - A[1]
    D = math.hypot(dx, dy)
    x = (rA * rA - rC * rC + D * D) / (2 * D)
    h = math.sqrt(max(0.0, rA * rA - x * x))
    mx, my = A[0] + x * dx / D, A[1] + x * dy / D
    c1 = (mx - h * dy / D, my + h * dx / D)
    c2 = (mx + h * dy / D, my - h * dx / D)
    return min((c1, c2), key=lambda q: math.hypot(q[0] - near[0], q[1] - near[1]))


def clamp_fourbar():
    """A toggle clamp as a plain four-bar: ground (hatched), handle, link, clamp arm.
       Pushing the handle over drives the link just past its line with the handle
       pivot, which locks the arm down."""
    body = ['<defs><pattern id="h4" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">'
            '<line x1="0" y1="0" x2="0" y2="6" stroke="%s" stroke-width="1.1" stroke-opacity="0.7"/></pattern></defs>' % INK]
    G = 150.0                                   # ground line
    O = (52.0, 112.0)                           # clamp arm pivot
    Q = (132.0, 134.0)                          # handle pivot, below the arm
    T = (222.0, 112.0)                          # clamp arm tip
    B = (86.0, 112.0)                           # where the link meets the arm
    th = math.radians(-112)                     # handle direction (up and back)
    H = (Q[0] + 60 * math.cos(th), Q[1] + 60 * math.sin(th))      # link pin on the handle
    grip = (Q[0] + 104 * math.cos(th + 0.08), Q[1] + 104 * math.sin(th + 0.08))
    # ground and the two pivot supports
    body.append(path(d(wobble([(28, G), (238, G)], 0.3)), width=2.2))
    body.append(path(d(wobble([(28, G), (238, G), (238, G + 10), (28, G + 10)], 0.3, True), True), fill='url(#h4)', stroke='none', width=0))
    for P in (O, Q):
        body.append(path(d(wobble([P, (P[0] + 13, G), (P[0] - 13, G)], 0.3, True), True), width=1.8, fill='#ffffff'))
    # links
    body.append(path(line(O, T, amp=0.35), stroke=ARM, width=7))                  # clamp arm
    body.append(path(line((T[0] - 4, T[1]), (T[0] - 4, T[1] + 22), amp=0.2), stroke=ARM, width=7))   # pad
    body.append(path(line(Q, grip, amp=0.35), stroke=ARM, width=7))               # handle
    body.append(path(line(H, B, amp=0.3), stroke=RED, width=4))                   # link
    for P in (O, Q, H, B):
        body.append('<circle cx="%.1f" cy="%.1f" r="4.4" fill="#ffffff" stroke="%s" stroke-width="2"/>' % (P[0], P[1], INK))
    # which way the handle goes
    a = arc_pts(Q, 88, th + 0.28, th + 0.75, 20)
    body.append(path(d(wobble(a, 0.4)), stroke=RED, width=2.2))
    body.append(arrowhead(a[-1], math.atan2(a[-1][1] - a[-3][1], a[-1][0] - a[-3][0]), 8, RED))
    return svg(250, 182, body, x0=6, y0=0, label=
               'A toggle clamp drawn as a four-bar linkage: the hatched ground with two pivots, the handle, a short link (red) '
               'and the clamp arm. Pushing the handle over drives the link past center and locks the arm down.')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name, fn in [('clamp-fourbar.svg', clamp_fourbar), ('shape-solution.svg', shape_arms), ('shape-examples.svg', shape_examples)]:
        with open(os.path.join(OUT, name), 'w') as f:
            f.write(fn())
        print('wrote', name)
