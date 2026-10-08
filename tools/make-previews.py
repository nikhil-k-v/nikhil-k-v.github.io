#!/usr/bin/env python3
"""
Pre-renders the home page's split-view previews.

For every project page linked from the carousel this takes a picture of the
top of the page (as it looks inside the preview pane: no title, no meta strip,
no back button or section menu) at a phone width and a tablet width, and
records where the page's videos sit so the home page can play them on top.

Run from the repo root after changing the top of a project page:

    python3 tools/make-previews.py

Needs Playwright (Python) and Chromium, plus ffmpeg for video stills.
Writes assets/preview/*.jpg and assets/preview/previews.json.
"""
import json, os, re, subprocess, sys, threading, functools, http.server, socketserver, hashlib
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'assets', 'preview')
PORT = 8799
BASE = 'http://localhost:%d/' % PORT
CHROME = os.environ.get('CHROME', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
FONT_DIR = os.environ.get('PREVIEW_FONTS', '')   # folder with Montserrat.ttf (Typekit is unreachable offline)

# viewport the page is laid out at, and how much of it is kept
VARIANTS = [
    {'w': 500, 'vh': 640, 'out': 800},     # phones   (the pane lays the page out ~480-550 px wide)
    {'w': 1100, 'vh': 900, 'out': 1400},    # tablets  (~980-1300 px wide)
]
SCREENS = 2                    # keep two screens' worth, for panes taller than the layout

HIDE_CSS = '''
html, body { overflow: hidden !important; scrollbar-width: none !important; }
::-webkit-scrollbar { display: none !important; }
#back-to-home, .ga-nav, .project-meta, .page-title { display: none !important; }
video { visibility: hidden !important; }
iframe { visibility: hidden !important; }
.pj-video { position: relative; background: #0b2135 !important; }
.pj-video::after { content: ""; position: absolute; left: 50%; top: 50%; width: 64px; height: 44px; margin: -22px 0 0 -32px;
  border-radius: 12px; background: rgba(240, 240, 240, 0.9)
  url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 44'%3E%3Cpath d='M26 13l17 9-17 9z' fill='%23051220'/%3E%3C/svg%3E") center / 100% 100% no-repeat; }
'''

def pages():
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    return re.findall(r'data-href="([^"]+)"', html)

def site_path(url):
    """absolute localhost URL → path relative to the site root"""
    return urlparse(url).path.lstrip('/')

def versioned(rel):
    """rel?v=<content hash>, so phones never keep showing an old picture"""
    with open(os.path.join(ROOT, rel), 'rb') as f:
        return rel + '?v=' + hashlib.md5(f.read()).hexdigest()[:8]

def still_for(video_path):
    """first frame of a video, for videos without a poster"""
    name = re.sub(r'[^a-zA-Z0-9]+', '-', os.path.splitext(video_path)[0]).strip('-') + '.jpg'
    out = os.path.join(OUT, 'stills', name)
    if not os.path.exists(out):
        os.makedirs(os.path.dirname(out), exist_ok=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '0.3', '-i', os.path.join(ROOT, video_path),
                        '-frames:v', '1', '-vf', 'scale=min(960\\,iw):-2', '-q:v', '5', out], check=True)
    return os.path.relpath(out, ROOT)

MEDIA_JS = '''
(maxH) => {
  const out = [];
  const vw = document.documentElement.clientWidth;
  for (const v of document.querySelectorAll('video')) {
    const r = v.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.top >= maxH || r.bottom <= 0) continue;
    const cs = getComputedStyle(v);
    if (cs.display === 'none') continue;
    let op = 1;
    for (let a = v; a && a.nodeType === 1; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity);
    if (op <= 0.01) continue;
    let clip = [0, 0, vw, maxH];
    for (let p = v.parentElement; p && p !== document.body; p = p.parentElement) {
      const pcs = getComputedStyle(p);
      if (pcs.overflowX !== 'visible' || pcs.overflowY !== 'visible') {
        const c = p.getBoundingClientRect();
        clip = [Math.max(0, c.left), Math.max(0, c.top), Math.min(vw, c.right) - Math.max(0, c.left), Math.min(maxH, c.bottom) - Math.max(0, c.top)];
        break;
      }
    }
    if (clip[2] <= 0 || clip[3] <= 0) continue;
    const s = v.querySelector('source');
    const src = v.getAttribute('src') || (s && s.getAttribute('src')) || v.getAttribute('data-src');
    if (!src) continue;
    out.push({
      src: new URL(src, location.href).href,
      poster: v.getAttribute('poster') ? new URL(v.getAttribute('poster'), location.href).href : null,
      r: [r.left, r.top, r.width, r.height].map(x => Math.round(x * 10) / 10),
      clip: clip.map(x => Math.round(x * 10) / 10),
      fit: cs.objectFit,
      pos: cs.objectPosition,
      blend: cs.mixBlendMode,
      filter: cs.filter,
      op: Math.round(op * 100) / 100
    });
  }
  return out;
}
'''

READY_JS = '''
async (maxH) => {
  await document.fonts.ready;
  const imgs = [...document.images].filter(i => i.getBoundingClientRect().top < maxH);
  await Promise.all(imgs.map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 4000); })));
  const edge = document.querySelector('.ga-paper') ? document.querySelector('.ga-edge') : null;
  for (let t = 0; edge && !edge.style.width && t < 40; t++) await new Promise(r => setTimeout(r, 50));
  await new Promise(r => setTimeout(r, 300));
}
'''

def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
        def handle(self):
            try: super().handle()
            except (BrokenPipeError, ConnectionResetError): pass
    handler = functools.partial(Quiet, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.ThreadingTCPServer(('127.0.0.1', PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd

def main():
    os.makedirs(OUT, exist_ok=True)
    httpd = serve()
    manifest = {}
    font_css = ''
    if FONT_DIR:
        font_css = ('@font-face{font-family:"montserrat";src:url("/__font/Montserrat.ttf");font-weight:100 900;font-style:normal}'
                    '@font-face{font-family:"montserrat";src:url("/__font/Montserrat-Italic.ttf");font-weight:100 900;font-style:italic}')

    def route(r):
        url = r.request.url
        if 'use.typekit.net' in url and url.endswith('.css'):
            return r.fulfill(status=200, content_type='text/css', body=font_css)
        if '/__font/' in url and FONT_DIR:
            return r.fulfill(status=200, content_type='font/ttf', path=os.path.join(FONT_DIR, url.rsplit('/', 1)[1]))
        if re.search(r'\\.(mp4|webm|mov)(\\?|$)', url):
            return r.abort()
        if not url.startswith(BASE) and not url.startswith('data:'):
            return r.abort()
        return r.continue_()

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME)
        for href in pages():
            name = os.path.splitext(os.path.basename(href))[0]
            entry = {}
            for v in VARIANTS:
                ctx = browser.new_context(viewport={'width': v['w'], 'height': v['vh']}, device_scale_factor=2)
                ctx.route('**/*', route)
                ctx.add_init_script("document.documentElement.classList.add('is-preview');")
                page = ctx.new_page()
                page.goto(BASE + href, wait_until='load')
                page.add_style_tag(content=HIDE_CSS)
                page.wait_for_timeout(150)
                vh = v['vh']
                full_h = page.evaluate('document.documentElement.scrollHeight')
                h = min(vh * SCREENS, full_h)
                # the page is laid out at the pane's height (heroes are sized
                # in vh), so anything below the first screen is scrolled into
                # view and stitched on, rather than enlarging the viewport
                parts = []
                for y in range(0, h, vh):
                    page.evaluate('y => window.scrollTo(0, y)', y)
                    page.evaluate(READY_JS, vh)
                    sy = page.evaluate('window.scrollY')
                    part = os.path.join(OUT, '_part%d.png' % len(parts))
                    page.screenshot(path=part, clip={'x': 0, 'y': 0, 'width': v['w'], 'height': vh})
                    parts.append((sy, part))
                page.evaluate('window.scrollTo(0, 0)')
                page.wait_for_timeout(100)
                media = page.evaluate(MEDIA_JS, h)
                img = os.path.join(OUT, '%s-%d.jpg' % (name, v['w']))
                sheet = Image.new('RGB', (v['w'] * 2, h * 2), (5, 18, 32))
                for sy, part in parts:
                    im = Image.open(part).convert('RGB')
                    sheet.paste(im, (0, sy * 2))
                    os.remove(part)
                k = v['out'] / v['w']
                sheet = sheet.resize((round(v['w'] * k), round(h * k)), Image.LANCZOS)
                sheet.save(img, quality=78, optimize=True, progressive=True)
                for m in media:
                    m['src'] = site_path(m['src'])
                    m['poster'] = versioned(site_path(m['poster']) if m['poster'] else still_for(m['src']))
                entry[str(v['w'])] = {'img': versioned(os.path.relpath(img, ROOT)), 'w': v['w'], 'h': h, 'media': media}
                ctx.close()
                print(name, v['w'], h, len(media), 'videos')
            manifest[href] = entry
        browser.close()
    httpd.shutdown()
    with open(os.path.join(OUT, 'previews.json'), 'w') as f:
        json.dump(manifest, f, separators=(',', ':'))

if __name__ == '__main__':
    main()
