#!/usr/bin/env python3
"""
Sketch diagrams for the motion platform page (pages/platform.html), drawn
inline so they can use the page's handwriting font (Caveat, from Google Fonts).

    python3 tools/platform-diagrams.py

Rewrites everything between <!-- sketch:NAME --> and <!-- /sketch:NAME -->
in pages/platform.html. Only white and the site's accent (#ff6b81) are used,
every line gets the same small wobble, and the only words are crank, rod,
slider and platform (plus the variables).
"""
import math, os, random, re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PAGE = os.path.join(ROOT, 'pages', 'platform.html')

INK = '#f0f0f0'
SOFT = 'rgba(240,240,240,0.55)'
ACC = '#ff6b81'
FONT = "Caveat, 'Patrick Hand', cursive"
AMP = 0.9           # the one wobble everything gets

rng = random.Random(3)


def wob(pts, amp=AMP):
    """sideways wobble along a polyline: two slow waves, fixed amplitude"""
    n = len(pts)
    ph1, ph2 = rng.uniform(0, 6.28), rng.uniform(0, 6.28)
    out = []
    s = 0.0
    for i, (x, y) in enumerate(pts):
        a, b = pts[max(0, i - 1)], pts[min(n - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        if i:
            s += math.hypot(x - pts[i - 1][0], y - pts[i - 1][1])
        w = amp * (0.65 * math.sin(s * 0.045 + ph1) + 0.35 * math.sin(s * 0.11 + ph2))
        out.append((x - dy / L * w, y + dx / L * w))
    return out


def seg(a, b, step=4.0):
    n = max(2, int(math.hypot(b[0] - a[0], b[1] - a[1]) / step))
    return [(a[0] + (b[0] - a[0]) * t / n, a[1] + (b[1] - a[1]) * t / n) for t in range(n + 1)]


def arc(c, r, a0, a1, n=40):
    return [(c[0] + r * math.cos(a0 + (a1 - a0) * t / n), c[1] + r * math.sin(a0 + (a1 - a0) * t / n)) for t in range(n + 1)]


def d(pts, closed=False):
    return 'M' + ' L'.join('%.1f %.1f' % p for p in pts) + (' Z' if closed else '')


def path(pts, color=INK, w=2.0, fill='none', closed=False, amp=AMP, extra=''):
    return '<path d="%s" fill="%s" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round"%s/>' % (
        d(wob(pts, amp), closed), fill, color, w, extra)


def line(a, b, **k):
    return path(seg(a, b), **k)


def poly(corners, **k):
    pts = []
    for i in range(len(corners)):
        pts += seg(corners[i], corners[(i + 1) % len(corners)])[:-1]
    return path(pts, closed=True, **k)


def head(tip, ang, color=INK, size=9, w=2.0):
    p1 = (tip[0] + size * math.cos(ang + 2.6), tip[1] + size * math.sin(ang + 2.6))
    p2 = (tip[0] + size * math.cos(ang - 2.6), tip[1] + size * math.sin(ang - 2.6))
    return '<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round"/>' % (
        d([p1, tip, p2]), color, w)


def arrow(a, b, color=INK, w=2.0, both=False, amp=AMP, size=9):
    pts = wob(seg(a, b), amp)
    out = ['<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round"/>' % (d(pts), color, w)]
    out.append(head(pts[-1], math.atan2(b[1] - a[1], b[0] - a[0]), color, size, w))
    if both:
        out.append(head(pts[0], math.atan2(a[1] - b[1], a[0] - b[0]), color, size, w))
    return out


def text(x, y, s, size=25, color='rgba(240,240,240,0.8)', anchor='middle', italic=False):
    st = ' style="font-family:STIX Two Text, Georgia, serif;font-style:italic"' if italic else ' style="font-family:Caveat, cursive"'
    return '<text x="%.1f" y="%.1f" font-size="%s" fill="%s" text-anchor="%s"%s>%s</text>' % (x, y, size, color, anchor, st, s)


def hatch(x0, x1, y, color=SOFT):
    out = [line((x0, y), (x1, y), color=color, w=1.8)]
    x = x0 + 6
    while x < x1:
        out.append(line((x, y), (x - 9, y + 11), color=color, w=1.2, amp=0.3))
        x += 13
    return out


def svg(w, h, body, label, cls='pf-sketch'):
    return ('<svg class="%s" viewBox="0 0 %d %d" role="img" aria-label="%s">\n%s\n</svg>' % (cls, w, h, label, '\n'.join(body)))


# ------------------------------------------------------------------ the linkage

def crank_slider():
    P = (300.0, 128.0)            # platform pivot
    tilt = math.radians(-7)
    body = []
    # platform
    half = 225
    u = (math.cos(tilt), math.sin(tilt))
    n = (-u[1], u[0])
    a = (P[0] - u[0] * half, P[1] - u[1] * half)
    b = (P[0] + u[0] * (half + 10), P[1] + u[1] * (half + 10))
    body.append(poly([(a[0] - n[0] * 5, a[1] - n[1] * 5), (b[0] - n[0] * 5, b[1] - n[1] * 5),
                      (b[0] + n[0] * 7, b[1] + n[1] * 7), (a[0] + n[0] * 7, a[1] + n[1] * 7)], color=INK, w=2.0))
    body.append(text(a[0] + 46, a[1] - 18, 'platform'))
    # pivot support
    body.append(poly([P, (P[0] + 52, P[1] + 40), (P[0] + 18, P[1] + 40)], color=SOFT, w=1.6))
    body += hatch(P[0] + 4, P[0] + 70, P[1] + 40)
    # crank, fixed to the platform
    th = math.radians(118)        # crank angle from the platform direction
    L1 = 104
    C = (P[0] + L1 * math.cos(tilt + th), P[1] + L1 * math.sin(tilt + th))
    body.append(line(P, C, color=INK, w=4.2))
    body.append(text((P[0] + C[0]) / 2 - 46, (P[1] + C[1]) / 2 + 8, 'crank'))
    # slider on its rail
    y_rail = 330.0
    S = (452.0, y_rail - 16)
    body.append(line(C, S, color=INK, w=2.6))
    body.append(text((C[0] + S[0]) / 2 + 16, (C[1] + S[1]) / 2 - 12, 'rod'))
    body.append(poly([(S[0] - 32, y_rail - 30), (S[0] + 32, y_rail - 30), (S[0] + 32, y_rail), (S[0] - 32, y_rail)], color=INK, w=2.0))
    body.append(text(S[0], y_rail + 34, 'slider'))
    body += hatch(150, 620, y_rail + 2)
    # joints
    for J in (P, C, S):
        body.append('<circle cx="%.1f" cy="%.1f" r="5" fill="#051220" stroke="%s" stroke-width="2"/>' % (J[0], J[1], INK))
    # theta between the platform line and the crank
    body.append(path(arc(P, 34, tilt + math.radians(180), tilt + th, 24)[::-1], color=ACC, w=1.6))
    body.append(text(P[0] - 52, P[1] + 30, 'θ', size=19, color=ACC, italic=True))
    # force on the slider
    body += arrow((S[0] + 42, S[1]), (S[0] + 112, S[1]), color=ACC, w=2.4, amp=0.45)
    body.append(text(S[0] + 122, S[1] - 12, 'F', size=21, color=ACC, italic=True))
    # torque at the platform
    tq = arc(P, 58, math.radians(-30), math.radians(-128), 26)
    body.append(path(tq, color=ACC, w=2.0))
    body.append(head(tq[-1], math.atan2(tq[-1][1] - tq[-3][1], tq[-1][0] - tq[-3][0]), ACC, 9, 2.0))
    body.append(text(P[0] + 52, P[1] - 50, 'τ', size=21, color=ACC, italic=True))
    # x along the rail, e from the pivot down to the slider's line
    body += arrow((200, y_rail + 54), (S[0], y_rail + 54), color=SOFT, w=1.4, both=True, size=7)
    body.append(text((200 + S[0]) / 2, y_rail + 48, 'x', size=19, italic=True))
    body += arrow((620, P[1]), (620, S[1]), color=SOFT, w=1.4, both=True, size=7)
    body.append(line((P[0] + 40, P[1]), (612, P[1]), color=SOFT, w=1.0, amp=0.4, extra=' stroke-dasharray="3 6"'))
    body.append(text(636, (P[1] + S[1]) / 2 + 6, 'e', size=19, italic=True, anchor='start'))
    return svg(680, 410, body,
               'Offset crank-slider: the slider is pushed along its rail with force F, a rod connects it to a crank fixed under the '
               'platform at angle θ, the slider runs a distance e below the platform pivot, and the platform turns with torque τ.')


# ------------------------------------------------------------------ simulation sketches

def torque_from_slope():
    """x(θ) flattening out, and τ = F dx/dθ falling with it, against a required line"""
    body = []
    x0, y0, w, h = 40, 18, 230, 120
    # top: travel
    body.append(line((x0, y0 + h), (x0 + w, y0 + h), color=SOFT, w=1.4))
    body.append(line((x0, y0 + h), (x0, y0), color=SOFT, w=1.4))
    curve = [(x0 + w * t, y0 + h - h * 0.92 * math.sin(t * math.pi / 2 * 0.98)) for t in [i / 40 for i in range(41)]]
    body.append(path(curve, color=INK, w=2.2))
    body.append(text(x0 - 12, y0 + 10, 'x', size=18, italic=True))
    # tangent at two points
    for t, col in ((0.18, ACC), (0.85, ACC)):
        X = x0 + w * t
        Y = y0 + h - h * 0.92 * math.sin(t * math.pi / 2 * 0.98)
        sl = -h * 0.92 * math.cos(t * math.pi / 2 * 0.98) * (math.pi / 2 * 0.98) / w
        body.append(line((X - 34, Y - sl * 34), (X + 34, Y + sl * 34), color=col, w=1.6, amp=0.4))
    # bottom: torque
    y1 = y0 + h + 34
    body.append(line((x0, y1 + h), (x0 + w, y1 + h), color=SOFT, w=1.4))
    body.append(line((x0, y1 + h), (x0, y1), color=SOFT, w=1.4))
    tcurve = [(x0 + w * t, y1 + h - h * 0.9 * math.cos(t * math.pi / 2 * 0.98)) for t in [i / 40 for i in range(41)]]
    body.append(path(tcurve, color=INK, w=2.2))
    body.append(line((x0, y1 + h * 0.62), (x0 + w, y1 + h * 0.62), color=ACC, w=1.4, amp=0.4, extra=' stroke-dasharray="6 5"'))
    body.append(text(x0 - 12, y1 + 12, 'τ', size=18, italic=True))
    body.append(text(x0 + w + 8, y1 + h + 6, 'θ', size=18, italic=True, anchor='start'))
    body.append(text(x0 + w + 8, y0 + h + 6, 'θ', size=18, italic=True, anchor='start'))
    return svg(300, 2 * h + 66, body,
               'Two small plots against θ: the slider travel x flattens out, its slope (two tangent lines) gets shallower, and the '
               'torque τ falls with it, below a dashed required line near the end of the range.', cls='pf-sketch small')


def dead_center():
    """rod and crank in a straight line: pushing the slider can't turn the crank"""
    body = []
    yc = 70.0                                   # pivot height = slider's line, so dead center is easy to show
    for k, ox in enumerate((14.0, 178.0)):
        P = (ox + 22, yc)
        ang = math.radians(-62) if k == 0 else 0.0
        C = (P[0] + 38 * math.cos(ang), P[1] + 38 * math.sin(ang))
        L2 = 62.0
        S = (C[0] + math.sqrt(L2 ** 2 - (yc - C[1]) ** 2), yc)
        body += hatch(S[0] - 26, S[0] + 30, yc + 12)
        body.append(poly([P, (P[0] + 12, P[1] + 20), (P[0] - 12, P[1] + 20)], color=SOFT, w=1.4))
        body += hatch(P[0] - 18, P[0] + 18, P[1] + 20)
        body.append(line(P, C, color=INK, w=3.4))
        body.append(line(C, S, color=INK if k == 0 else ACC, w=2.2))
        body.append(poly([(S[0] - 14, S[1] - 11), (S[0] + 14, S[1] - 11), (S[0] + 14, S[1] + 11), (S[0] - 14, S[1] + 11)], color=INK, w=1.6))
        for J in (P, C, S):
            body.append('<circle cx="%.1f" cy="%.1f" r="3.6" fill="#051220" stroke="%s" stroke-width="1.6"/>' % (J[0], J[1], INK))
        body += arrow((S[0] + 50, S[1]), (S[0] + 20, S[1]), color=ACC, w=1.8, amp=0.4, size=7)
        if k == 0:                              # the crank turns
            a = arc(P, 22, math.radians(-120), math.radians(-160), 12)
            body.append(path(a, color=ACC, w=1.4, amp=0.3))
            body.append(head(a[-1], math.atan2(a[-1][1] - a[-3][1], a[-1][0] - a[-3][0]), ACC, 6, 1.4))
    return svg(352, 112, body,
               'Left: crank and rod at an angle, so pushing the slider turns the crank. Right: dead center, rod and crank in one '
               'straight line through the pivot, so the push turns nothing.', cls='pf-sketch small')


def inject(html, name, markup):
    pat = re.compile(r'(<!-- sketch:%s -->)(.*?)(<!-- /sketch:%s -->)' % (name, name), re.S)
    if not pat.search(html):
        raise SystemExit('marker sketch:%s not found in platform.html' % name)
    return pat.sub(lambda m: m.group(1) + '\n' + markup + '\n' + m.group(3), html)


if __name__ == '__main__':
    html = open(PAGE, encoding='utf-8').read()
    html = inject(html, 'linkage', crank_slider())
    html = inject(html, 'slope', torque_from_slope())
    html = inject(html, 'deadcenter', dead_center())
    open(PAGE, 'w', encoding='utf-8').write(html)
    print('updated', PAGE)
