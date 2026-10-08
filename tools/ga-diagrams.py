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
    """rim centre-line of a wheel of size s, as a closed list of points (y down)"""
    pts = []
    N = 160
    for i in range(N):
        t = 2 * math.pi * i / N
        ct, st = math.cos(t), math.sin(t)
        if kind == 'round':
            x, y = s * ct, s * st
        elif kind == 'oval':
            x, y = 1.14 * s * ct, 0.9 * s * st
        elif kind == 'square':
            e = 4.0
            x = s * 0.98 * math.copysign(abs(ct) ** (2 / e), ct)
            y = s * 0.92 * math.copysign(abs(st) ** (2 / e), st)
        elif kind == 'flat':
            x, y = 1.03 * s * ct, 1.03 * s * st
            if y > 0.66 * s:                       # flat bottom
                y = 0.66 * s + (y - 0.66 * s) * 0.08
        pts.append((c[0] + x, c[1] + y))
    return pts


def offset(pts, dist):
    """shift a closed polygon along its normals (positive = outward for CCW-on-screen)"""
    n = len(pts)
    out = []
    for i in range(n):
        a, b = pts[i - 1], pts[(i + 1) % n]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        out.append((pts[i][0] + dy / L * dist, pts[i][1] - dx / L * dist))
    return out


def wheel(kind, c, s, rim=None):
    """a filled steering wheel: grey rim, three spokes, hub"""
    rim = rim or max(5.0, s * 0.16)
    mid = outline(kind, c, s)
    outer, inner = offset(mid, -rim / 2), offset(mid, rim / 2)
    # make sure "outer" is the larger one
    if sum(math.hypot(p[0] - c[0], p[1] - c[1]) for p in outer) < sum(math.hypot(p[0] - c[0], p[1] - c[1]) for p in inner):
        outer, inner = inner, outer
    sw = 1.3 + s * 0.012
    body = []
    # spokes (under the rim): left, right, bottom
    hub = s * 0.3
    for ang in (math.pi, 0.0, math.pi / 2):
        ux, uy = math.cos(ang), math.sin(ang)
        vx, vy = -uy, ux
        hit = ray_hit(mid, c, ang)
        far = math.hypot(hit[0] - c[0], hit[1] - c[1])
        wn, wf = s * 0.17, s * 0.24 if ang != math.pi / 2 else s * 0.13
        if ang == math.pi / 2:
            wn = s * 0.12
        q = [(c[0] + ux * hub * 0.6 + vx * wn, c[1] + uy * hub * 0.6 + vy * wn),
             (c[0] + ux * far + vx * wf, c[1] + uy * far + vy * wf),
             (c[0] + ux * far - vx * wf, c[1] + uy * far - vy * wf),
             (c[0] + ux * hub * 0.6 - vx * wn, c[1] + uy * hub * 0.6 - vy * wn)]
        dense = []
        for i in range(4):
            a, b = q[i], q[(i + 1) % 4]
            for t in range(10):
                dense.append((a[0] + (b[0] - a[0]) * t / 10, a[1] + (b[1] - a[1]) * t / 10))
        body.append(path(d(wobble(dense, 0.4, True), True), fill=RIM, width=sw))
    # rim as a ring (even-odd)
    ring = d(wobble(outer, 0.5, True), True) + ' ' + d(wobble(inner[::-1], 0.5, True), True)
    body.append('<path d="%s" fill="%s" fill-rule="evenodd" stroke="%s" stroke-width="%.1f" stroke-linejoin="round"/>' % (ring, RIM, INK, sw * 1.15))
    # a darker band on the inside of the top of the rim, like the page's other sketches
    band = [p for p in offset(mid, rim * 0.18) if p[1] < c[1] - s * 0.35]
    if len(band) > 4:
        body.append(path(d(wobble(band, 0.4)), stroke=RIM_DARK, width=rim * 0.35))
    # hub
    body.append(circle(c, hub, fill=RIM, width=sw))
    body.append(circle(c, hub * 0.55, fill=RIM_DARK, stroke=INK, width=sw * 0.5))
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
    cells = [('oval', (70, 66)), ('square', (205, 66)), ('flat', (137, 182))]
    for kind, c in cells:
        s = 46.0
        b, mid = wheel(kind, c, s)
        body += b
        body += arms(mid, c, s, arc_span=1.15, big=False)
    return svg(275, 246, body,
               'The same coupling on an oval wheel, a squarish wheel and a flat-bottomed wheel: in each, the lower clamps '
               'stop where their arcs cross the rim.')


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
    """The clamp's draw latch, drawn as the four-bar it is:
         ground  O-C : the fixed jaw (hatched), carrying the handle pivot O and the hinge C
         crank   O-A : the handle
         coupler A-B : the hook (red)
         rocker  C-B : the moving jaw, which swings shut around the rim
       Shut is solid, open is dashed."""
    R0, rr = (122.0, 128.0), 25.0                 # rim cross-section
    O, C = (90.0, 82.0), (124.0, 170.0)
    B = (151.0, 92.0)                             # hook's catch on the moving jaw (shut)
    a = 21.0
    ang_ob = math.atan2(B[1] - O[1], B[0] - O[0])
    th_shut = ang_ob - math.radians(9)            # just past the line O-B
    A = (O[0] + a * math.cos(th_shut), O[1] + a * math.sin(th_shut))
    b = math.hypot(B[0] - A[0], B[1] - A[1])
    cc = math.hypot(B[0] - C[0], B[1] - C[1])
    th_open = th_shut - math.radians(64)
    A_o = (O[0] + a * math.cos(th_open), O[1] + a * math.sin(th_open))
    B_o = circ_meet(A_o, b, C, cc, B)
    jaw_turn = math.atan2(B_o[1] - C[1], B_o[0] - C[0]) - math.atan2(B[1] - C[1], B[0] - C[0])

    body = ['<defs><pattern id="h4" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">'
            '<line x1="0" y1="0" x2="0" y2="6" stroke="%s" stroke-width="1.1" stroke-opacity="0.7"/></pattern></defs>' % INK]

    # fixed jaw: a hatched C around the left of the rim, from the handle pivot down to the hinge
    inner = arc_pts(R0, rr + 3, math.radians(-118), math.radians(-262), 26)
    outer = arc_pts(R0, rr + 17, math.radians(-262), math.radians(-118), 26)
    shape = [O] + outer[::-1][:0] + inner + [C] + outer
    fixed = [O, (O[0] - 2, O[1] + 6)] + inner + [(C[0] - 4, C[1] + 2), C, (C[0] - 12, C[1] + 4)] + outer[1:] + [(O[0] - 10, O[1] - 2)]
    body.append(path(d(wobble(fixed, 0.45, True), True), fill='url(#h4)', width=2.3))

    # the moving jaw (rocker): a claw from the hinge round the right of the rim to the catch
    def claw(turn):
        pts = [C]
        for k in range(1, 22):
            t = k / 22
            ang = math.radians(100 - 205 * t)
            r = rr + 5 + 6 * math.sin(math.pi * t)
            pts.append((R0[0] + r * math.cos(ang), R0[1] + r * math.sin(ang)))
        pts.append(B)
        return [rot(p, C, turn) for p in pts]

    def link(p, q, color, width, dashed):
        st = ' stroke-dasharray="6 5" opacity="0.5"' if dashed else ''
        return path(line(p, q, amp=0.35), stroke=color, width=width, extra=st)

    def handle_tip(th):
        return (O[0] + 88 * math.cos(th), O[1] + 88 * math.sin(th))

    # rim
    body.append(circle(R0, rr, fill=RIM, width=2.2))

    # open (dashed)
    body.append(path(d(wobble(claw(jaw_turn), 0.4)), stroke=ARM, width=6.5, extra=' stroke-dasharray="6 5" opacity="0.45"'))
    body.append(link(A_o, B_o, RED, 3.2, True))
    body.append(link(O, handle_tip(th_open), ARM, 6.5, True))

    # shut (solid)
    body.append(path(d(wobble(claw(0.0), 0.4)), stroke=ARM, width=6.5))
    body.append(link(A, B, RED, 3.4, False))
    body.append(link(O, handle_tip(th_shut), ARM, 6.5, False))

    # the handle's swing
    arc = arc_pts(O, 70, th_open + 0.14, th_shut - 0.1, 30)
    body.append(path(d(wobble(arc, 0.5)), stroke=RED, width=2.2))
    end = arc[-1]
    body.append(arrowhead(end, math.atan2(end[1] - arc[-4][1], end[0] - arc[-4][0]), 8, RED))

    for P in (O, C, A, B):
        body.append('<circle cx="%.1f" cy="%.1f" r="4.2" fill="#ffffff" stroke="%s" stroke-width="2"/>' % (P[0], P[1], INK))
    return svg(162, 210, body, x0=44, y0=-18, label=
               'The clamp as a four-bar linkage: the fixed jaw (hatched), the handle, the hook (red) and the moving jaw. '
               'Pulling the handle down draws the hook in and swings the moving jaw shut around the rim. Open is dashed.')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name, fn in [('clamp-fourbar.svg', clamp_fourbar), ('shape-solution.svg', shape_arms), ('shape-examples.svg', shape_examples)]:
        with open(os.path.join(OUT, name), 'w') as f:
            f.write(fn())
        print('wrote', name)
