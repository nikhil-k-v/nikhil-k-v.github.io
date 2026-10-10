---
name: check-site
description: Screenshot pages of nkve.dev at phone (390x844) and desktop (1440x900) size and check for sideways scrolling. Use after any change to a page, stylesheet or script, before pushing.
---

# Check the site

`tools/site-check.py` serves the repo, swaps Typekit for a local Montserrat, blocks
other off-site requests, skips the loading screen and opens collapsed sections.

```
SITE_CHECK_OUT=<scratchpad>/check python3 tools/site-check.py shots pages/cycloid.html index.html
SITE_CHECK_OUT=<scratchpad>/check python3 tools/site-check.py overflow
```

- `shots` prints scrollWidth per page and size and exits 1 if a phone shot scrolls
  sideways. Options: `--sizes phone`, `--viewport-only` (just the first screen),
  `--loader` (keep the loading screen), `--wait MS`.
- `overflow` loads every `.html` page at 390 px. `blog.html`, `pages/dynamicGif.html`
  and `pages/platformGif.html` are unlinked leftovers and always fail; ignore them.

## Looking at the shots

Full-page shots are thousands of pixels tall. Crop or split them with PIL before
reading them, e.g. three slices per phone page, two per desktop page, each resized
to about 1000 px. Look at what you changed on both sizes. Check that:

- captions aren't clipped (the old `page-styles.css` makes every `figcaption`
  absolute and `nowrap`),
- white panels, tables and code blocks fit the column,
- arrows between stacked columns point down on phones.

Videos show only their posters (Playwright's Chromium has no H.264). Iframes
(YouTube, CodePen) come out black. Both are expected.

For anything that moves (loading screen, preview dissolve, transitions), use the
`record` skill instead. Stills can't show it.
