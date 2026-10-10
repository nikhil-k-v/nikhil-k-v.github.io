#!/usr/bin/env python3
"""
Look at the site the way a visitor would, from the sandbox.

Serves the repo locally and drives Playwright's Chromium with Montserrat
substituted for Typekit (which the sandbox can't reach) and every other
off-site request blocked.

    python3 tools/site-check.py shots pages/cycloid.html index.html
        Screenshots at phone (390x844, dpr 2) and desktop (1440x900). Full page by
        default; collapsed sections are opened first and the loading screen is
        skipped. Prints scrollWidth and page errors, exits 1 if a page scrolls
        sideways on the phone.
        --sizes phone,desktop   --viewport-only   --out DIR   --loader (keep it)

    python3 tools/site-check.py overflow
        Every .html page at 390 px: lists any that scroll sideways.

    python3 tools/site-check.py record index.html --seconds 8
        Screen recording (MP4, ready to send) with the loading screen on.
        --size phone|desktop   --click SELECTOR --at SECONDS   --out DIR

Output goes to $SITE_CHECK_OUT or /tmp/nkve-check. Fonts come from
$PREVIEW_FONTS or ~/.cache/nkve-fonts (downloaded from GitHub on first use).
Videos (.mp4) don't decode in Playwright's Chromium, so they show posters.
"""
import argparse, functools, glob, http.server, os, re, shutil, socketserver, subprocess, sys, threading, time, urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.environ.get('SITE_CHECK_OUT', '/tmp/nkve-check')
FONT_DIR = os.environ.get('PREVIEW_FONTS') or os.path.expanduser('~/.cache/nkve-fonts')
FONT_URLS = {
    'Montserrat.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf',
    'Montserrat-Italic.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat-Italic%5Bwght%5D.ttf',
}
SIZES = {
    'phone': dict(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True),
    'desktop': dict(viewport={'width': 1440, 'height': 900}, device_scale_factor=1),
}
FONT_CSS = ('@font-face{font-family:"montserrat";src:url("/__font/Montserrat.ttf");font-weight:100 900}'
            '@font-face{font-family:"montserrat";src:url("/__font/Montserrat-Italic.ttf");font-weight:100 900;font-style:italic}')


def ensure_fonts():
    os.makedirs(FONT_DIR, exist_ok=True)
    for name, url in FONT_URLS.items():
        path = os.path.join(FONT_DIR, name)
        if not os.path.exists(path) or os.path.getsize(path) < 10000:
            try:
                urllib.request.urlretrieve(url, path)
            except Exception as e:
                print('could not download %s (%s); pages will use a fallback font' % (name, e), file=sys.stderr)
    return FONT_DIR


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
        def handle(self):
            try: super().handle()
            except Exception: pass
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return 'http://127.0.0.1:%d/' % httpd.server_address[1]


def make_context(browser, base, size, **extra):
    ctx = browser.new_context(**SIZES[size], **extra)
    def route(r):
        url = r.request.url
        if '/__font/' in url:
            path = os.path.join(FONT_DIR, url.rsplit('/', 1)[1])
            if os.path.exists(path):
                return r.fulfill(status=200, content_type='font/ttf', path=path)
            return r.abort()
        if 'typekit' in url:
            return r.fulfill(status=200, content_type='text/css', body=FONT_CSS)
        if 'gsap' in url:
            return r.fulfill(status=200, content_type='text/javascript', body='')
        if not url.startswith(base) and not url.startswith('data:'):
            return r.abort()
        return r.continue_()
    ctx.route('**/*', route)
    return ctx


OPEN_ALL = """() => {
  document.querySelectorAll('.is-collapsed').forEach(s => s.classList.remove('is-collapsed'));
  document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager');
  window.dispatchEvent(new Event('resize'));
}"""


def rel(p):
    p = p.lstrip('./')
    return p if p.endswith('.html') else p + '.html'


def cmd_shots(a):
    from playwright.sync_api import sync_playwright
    ensure_fonts(); base = serve(); os.makedirs(a.out, exist_ok=True)
    bad = False
    with sync_playwright() as p:
        b = p.chromium.launch()
        for page_path in a.pages:
            for size in a.sizes.split(','):
                ctx = make_context(b, base, size); pg = ctx.new_page()
                errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
                if not a.loader:
                    pg.add_init_script('window.__nvPreview = true;')
                pg.goto(base + rel(page_path), wait_until='load')
                pg.wait_for_timeout(a.wait)
                if not a.viewport_only:
                    pg.evaluate(OPEN_ALL); pg.wait_for_timeout(1200)
                sw, vw, h = pg.evaluate('[document.documentElement.scrollWidth, innerWidth, document.documentElement.scrollHeight]')
                name = re.sub(r'[^a-zA-Z0-9]+', '-', rel(page_path)[:-5]).strip('-') or 'index'
                out = os.path.join(a.out, '%s_%s.png' % (name, size))
                pg.screenshot(path=out, full_page=not a.viewport_only)
                flag = '' if sw <= vw else '  <-- scrolls sideways'
                if size == 'phone' and sw > vw: bad = True
                print('%-28s %-7s scrollWidth %d/%d  height %d  %s%s' % (rel(page_path), size, sw, vw, h, out, flag))
                for e in errs: print('    page error:', e)
                ctx.close()
        b.close()
    print('Full-page shots are tall: crop them (PIL) before viewing.' if not a.viewport_only else '')
    sys.exit(1 if bad else 0)


def cmd_overflow(a):
    from playwright.sync_api import sync_playwright
    ensure_fonts(); base = serve()
    pages = sorted(glob.glob(os.path.join(ROOT, '*.html')) + glob.glob(os.path.join(ROOT, 'pages', '*.html')))
    bad = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = make_context(b, base, 'phone'); ctx.add_init_script('window.__nvPreview = true;')
        pg = ctx.new_page()
        for f in pages:
            r = os.path.relpath(f, ROOT)
            try:
                pg.goto(base + r, wait_until='load'); pg.wait_for_timeout(500)
                pg.evaluate(OPEN_ALL); pg.wait_for_timeout(500)
                sw = pg.evaluate('document.documentElement.scrollWidth')
            except Exception as e:
                print('%-28s error %s' % (r, e)); continue
            print('%-28s %d%s' % (r, sw, '  <-- scrolls sideways' if sw > 390 else ''))
            if sw > 390: bad.append(r)
        b.close()
    sys.exit(1 if bad else 0)


def cmd_record(a):
    from playwright.sync_api import sync_playwright
    ensure_fonts(); base = serve()
    tmp = os.path.join(a.out, '_rec'); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
    vp = SIZES[a.size]['viewport']
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = make_context(b, base, a.size, record_video_dir=tmp, record_video_size=vp)
        pg = ctx.new_page()
        t0 = time.time()
        pg.goto(base + rel(a.page), wait_until='commit')
        if a.click:
            pg.wait_for_timeout(int(a.at * 1000))
            pg.click(a.click)
        pg.wait_for_timeout(int(max(0.5, a.seconds - (time.time() - t0)) * 1000))
        ctx.close(); b.close()
    webm = glob.glob(os.path.join(tmp, '*.webm'))[0]
    name = re.sub(r'[^a-zA-Z0-9]+', '-', rel(a.page)[:-5]).strip('-')
    out = os.path.join(a.out, '%s_%s.mp4' % (name, a.size))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                    '-crf', '23', '-movflags', '+faststart', out], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    print(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest='cmd', required=True)
    s = sp.add_parser('shots'); s.add_argument('pages', nargs='+')
    s.add_argument('--sizes', default='phone,desktop'); s.add_argument('--viewport-only', action='store_true')
    s.add_argument('--loader', action='store_true', help='keep the loading screen'); s.add_argument('--wait', type=int, default=1500)
    s.add_argument('--out', default=OUT); s.set_defaults(fn=cmd_shots)
    o = sp.add_parser('overflow'); o.set_defaults(fn=cmd_overflow)
    r = sp.add_parser('record'); r.add_argument('page'); r.add_argument('--seconds', type=float, default=8)
    r.add_argument('--size', default='phone', choices=list(SIZES)); r.add_argument('--click')
    r.add_argument('--at', type=float, default=5.0, help='seconds after load to click'); r.add_argument('--out', default=OUT)
    r.set_defaults(fn=cmd_record)
    a = ap.parse_args(); a.fn(a)


if __name__ == '__main__':
    main()
