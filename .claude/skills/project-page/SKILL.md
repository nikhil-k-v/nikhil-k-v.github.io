---
name: project-page
description: Build a new project page or rebuild an old-style one (controller, liq, sumo, propellers) for nkve.dev in the current navy write-up style, from Nikhil's source material. Use for "rebuild/redo/add more to the X page" requests.
---

# Build or rebuild a project page

## 1. Gather the material first

- Read what's on the current page and any page that covers the same project (for
  example `desmos.html` and `6dof.html` overlap with `cycloid.html`). Don't contradict
  them.
- Source files are in the claude.ai Project: `MIT_Maker_Documentation.pdf`,
  `Portfolio.pdf`, `BrailleVideo.mp4`, `ArmYtVideo.mp4`. Read them with the Projects
  tool (`project_read`) or from the conversation's uploads. Extract text with
  `pdftotext -layout`, and figures with `pdfimages -png -p` (then `add-media`).
- Check CLAUDE.md "Unconfirmed" before reusing any number.
- If the sources contradict each other or a claim would be new, ask Nikhil instead
  of picking one.

## 2. Structure

Copy `pages/cycloid.html` as the template:

1. `<script src="../loader.js?v=N" data-mode="page">` right after `<body>` (current N:
   `grep -rho 'loader.js?v=[0-9]*' pages | head -1`).
2. `#arm-anim-container` hero with `.page-title` and the card's animation from
   `assets/anim/` (the same one the home card uses, see `index.html`).
3. `.project-meta` strip: Timeframe / Overview / Affiliation / Status.
4. `.pj-top` grid: real photos and `data-autoplay` videos. The home preview starts
   here, so no text and no iframes in it.
5. `.ga-nav` with one link per section, then `<div class="ga-night">` with
   `section.ga-sec[data-open]` blocks and `h2.ga-h2 > span`.
6. Scripts at the end: `genauto-nav.js`, `genauto-layout.js`, `project.js`,
   `../blend.js`. Include the modal div if any image has `data-zoom`.

Components (all in `pages/project.css`): `.pj-grid` with `--cols` and `.pj-tile`
with `--ar`, `.pj-split` (`.fig-wide`), `.pj-video` (YouTube, use
youtube-nocookie.com), `.pj-embed`, `.pf-table`, `.pj-white` for black-ink sketches,
`<pre class="pj-code">`, `.ga-math` for variables. Add new CSS at the end of
`project.css` and bump its `?v=` on every page that links it.

## 3. Writing

Nikhil's voice: plain, first person, specific, short. Snip and lightly tighten his
own wording from the PDFs instead of paraphrasing into something smoother. No hype,
no "not just X but Y", no tidy triplets, no summary or stat boxes. Past tense for
things that were true in 2023 ("I was working on…").

## 4. Finish

1. Look up any outside fact (prices, companies) before it goes on the page, and
   compute every number.
2. Run the `check-site` skill on both sizes, then the `previews` skill.
3. Run the `ship` skill. In the report, list anything you assumed or couldn't
   verify, and add those items to CLAUDE.md "Unconfirmed".
