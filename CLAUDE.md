# nkve.dev — Nikhil Vijay's portfolio

Static site on GitHub Pages. Branch `master` is live at https://nkve.dev (see `CNAME`)
a minute or two after a push. No build step, no framework: plain HTML, CSS and JS.
Pushing straight to `master` is the normal workflow for this repo.

## Map

| Path | What it is |
|---|---|
| `index.html`, `home.js`, `home.css` | Home: project carousel. On portrait phones/tablets it's a split view (small carousel on top, dithered live preview of the selected project below). |
| `index2.html`, `home2.js`, `home2.css`, `blend2.js` | Prototype home (not linked, `noindex`). Same as the home page on portrait phones. On desktop/landscape the open card (32vw, 20 % narrower than on index) becomes the top of its page: the animation grows and stays centred as on index but is drawn in front of the preview (its `.anim-wrap` uses the `#anim-key` SVG filter in index2.html: black keyed to transparent plus a soft dark halo, instead of the lighten blend), the card face fades to the page colour around a quarter (`--fc`, an `@property` in home2.css), and a dithered page preview (`.bpv`, also a link) fills the lower part down to the bottom edge, under the title and VIEW PROJECT button, which stay at the bottom as on index. The preview shows the middle 700 px of the 1100 px render (the content column) edge to edge. The preview is a child of the card, so it scrolls with the strip; two panes take turns so the old one can dither away while the new one comes in. `home2.js` is a fork of `home.js`; `blend2.js` is `blend.js` reading the colour from `.card`. Uses the same `assets/preview/` (the 1100 px render, middle 820 px). |
| `about.html`, `about-page.css` | About page. |
| `updates.html` | Gallery: Videos section (lazy-played) then Photos. |
| `pages/*.html` | One page per project. `genauto.html` = steering robot (Gen Auto AI), `platform.html` = motion platform, `6dof.html` = desktop arm, `desmos.html` = cycloid generator, plus `braille`, `cycloid`, `controller`, `liq`, `sumo`. |
| `pages/page-styles.css` | Old global stylesheet every project page loads. Has sharp edges (see Gotchas). |
| `pages/genauto.css` | Components for the write-up style (`.ga-sec`, `.ga-h2/h3`, `.ga-fig`, `.ga-grid`, `.ga-label`, `.ga-calc`, `.ga-nav` …). Steering robot page puts them on a white sheet (`.ga-paper`). |
| `pages/project.css` | Same components on the navy background (`.ga-night`) plus media blocks: `.pj-grid/.pj-tile`, `.pj-split`, `.pj-wide`, `.pj-video`, `.pj-embed`, `.cyc-sim`, plus `.pj-white` (white panel for black-ink sketches), `.pj-code`, `.cy-bom`. Used by platform, 6dof, desmos, cycloid, braille. |
| `pages/genauto-nav.js` | Side section menu. Fades after 900 ms idle; on phones shows only ticks until tapped. |
| `pages/genauto-layout.js` | Sizes `.ga-fit` figure/text pairs; makes sections collapsible on phones (open by default: first section, or any with `data-open`). |
| `pages/project.js` | Lazy-plays `video[data-autoplay][data-src]` in view; `img[data-zoom]` opens the modal. |
| `pages/paper-edges.js` | Draws the scanline edges of the steering robot's white sheet. |
| `pages/toggle-clamp.js`, `pages/cycloid-sim.js` | Small animated diagrams (four-bar toggle clamp; cycloidal disc sim). |
| `assets/anim/` | Card/hero animations rendered on black. Pages use the web copies `X-960.mp4` (≤1100 px screens) and `X-1280.mp4` via `<source media>`, poster `X-960.jpg`; width is pinned to 1920 px in CSS so layout matches the original renders. The TUBAA card keeps its original `tubaa.mp4`; its preview plays `tubaa-preview.mp4`, one seamless loop with both propellers (each trimmed to a blade period, joined with crossfades), about 3.3 s on each. |
| `loader.js` | The loading screen, all in one canvas sized from what it measures (100lvh tall, so it's never stretched and always reaches the bottom). Home pages: `<script src="loader.js">` (dithers out top to bottom; the home preview starts 1.5 s in). Project pages: `<script src="../loader.js" data-mode="page">` right after `<body>` (same screen, a bit shorter, dithers out from the bottom). Clicks on links into `/pages/` (and `window.nvGo(url)`) dither the screen in over the current page first, then navigate; the next page starts covered (sessionStorage `nv-cover`). The dither is fine halftone dots (3 px cells) with grain and a slow drifting noise: one wide gradient spreads across the screen thinning it to about half covered, then the whole pattern fades out, the start side slightly first. Scrambled letters change every 70 ms. Skipped under `html.is-preview` / `window.__nvPreview`. |
| `blend.js` | Safari/iOS only: copies `video.anims` / `video.anim` into a canvas that does the `lighten` blend (WebKit doesn't blend video). `?blendfix` forces it on for testing. |
| `assets/web/` | Web copies of videos (≈960 px wide H.264, faststart) + JPG posters; `assets/web/img/` 1400 px photos; hand-made SVG diagrams. |
| `assets/GenAutoVids/`, `old-media/` | Originals. Large; don't link them from pages — make a web copy. |
| `assets/preview/` | Pre-rendered home previews (generated, see below). |
| `tools/make-previews.py` | Generates `assets/preview/` (image URLs carry `?v=<hash>`). |
| `tools/ga-diagrams.py` | Sketch SVGs for the steering page (clamp four-bar, shape arms). |
| `tools/platform-diagrams.py` | Inline sketches on the platform page, injected between `<!-- sketch:NAME -->` markers (Caveat labels). |

## Home page previews

The split-view preview does **not** load the project page. `tools/make-previews.py`
(Playwright + Chromium) renders the top of each `data-href` page at a phone width
(500 px) and a tablet width (1100 px) with the title, meta strip, back button and
section menu hidden and videos blanked, and writes `assets/preview/previews.json`
listing where each video sits. `home.js` dithers the picture and plays those videos
itself on top. Shows the card animation for ≥1.4 s (label reads LOADING, then unscrambles to
VIEW PROJECT), then a dither dissolve during which both pictures keep playing; the page's
header animation reuses the card's video so it never restarts. The pane is drawn at 90 %
opacity with a radial vignette (CSS mask) down to 50 % at the corners.

**Re-run it whenever the top of a project page changes** (hero, meta, first section):

```
PREVIEW_FONTS=/path/to/folder/with/Montserrat.ttf python3 tools/make-previews.py
```

Typekit is unreachable offline, so pass a folder with Montserrat (Google Fonts'
`Montserrat[wght].ttf` renamed `Montserrat.ttf`) or the pictures use a fallback font.

Cards with no page (TUBAA → tubaa.dev, coming-soon) show their card animation, or
`data-preview-src` if set. The label unscrambles to VIEW PROJECT over 1.6 s, finishing
before the 2.1 s dissolve does.

## Conventions

**Writing (Nikhil's standing preferences)**
- Plain, first-person, specific. It must not read as AI-written: no hype, no
  "not just X but Y", no tidy triplets, no summary boxes.
- No stat/fact boxes or KPI tiles on project pages. Numbers go in sentences, tables
  or equations.
- Keep it concise. Don't invent specs, part names, mechanisms or comparisons — if a
  claim isn't in the existing page or from Nikhil, ask. Verify math numerically.
- External facts (companies, products, prices) get looked up before they go on a page.

**Design**
- Navy background (`--dark-primary` #051220), Montserrat via Typekit, STIX Two Text
  for math (`.ga-math`, italic variables).
- Diagrams: hand-made SVG in a light "sketchbook" style (slightly wobbly lines,
  hatched grounds, red/pink accents), generated by small Python scripts — not stock
  clip-art and not overly polished.
- Every page must work at 390×844 with no horizontal scroll
  (`document.documentElement.scrollWidth === 390`). Arrows between stacked columns
  point down on phones.
- Videos: `muted loop playsinline`, a `poster`, and `data-src` + `data-autoplay`
  on long pages (project.js loads them ~1.5 screens ahead and plays them in view). Animations on black use
  `mix-blend-mode: lighten`.
- New media: make a web copy, e.g.
  `ffmpeg -i in.mov -an -vf scale=960:-2 -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart out.mp4`
  and a poster with `ffmpeg -ss 0.5 -i out.mp4 -frames:v 1 -q:v 4 out.jpg`. iPhone HEVC `.mov` won't play in Chrome.

## Gotchas

- `page-styles.css` sets `overflow-x: hidden` on every element, makes every
  `figcaption` absolutely positioned and `nowrap`, and shrinks `p` with `!important`
  on phones. Components reset these locally; new components usually need to too.
- `genauto.html` sections are collapsed on phones; anything measured on load inside
  them needs a `resize` event after expanding (the layout script dispatches one).
- Splide (carousels) and GSAP load from CDNs.
- A global `figcaption` rule caused 1600 px overflow before — check scrollWidth after
  adding captions.

## Testing locally

```
python3 -m http.server 8765        # from the repo root
```
Then Playwright/Chromium at 390×844 (mobile, dpr 2) and 1440×900. Playwright's
Chromium has no H.264: route `.mp4` requests to VP9 `.webm` copies to see videos
play. Screenshot the sections you touched on both sizes before pushing.
