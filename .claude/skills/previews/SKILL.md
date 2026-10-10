---
name: previews
description: Regenerate the pre-rendered home page previews (assets/preview/) for nkve.dev. Use whenever the top of a project page changes (hero, meta, first section, the .pj-top media grid) or a page linked from the home carousel is added or rebuilt.
---

# Regenerate the home previews

```
python3 tools/make-previews.py
```

It picks up Montserrat from `~/.cache/nkve-fonts` (the session-start hook downloads
it; if the folder is missing, run `bash tools/session-setup.sh`). It renders every
`data-href` page in `index.html` at 500 and 1100 px with the title, meta, back button,
`#arm-anim-container` and section menu hidden, and rewrites `assets/preview/*.jpg`
and `previews.json`. Image URLs carry a content hash, so nothing needs bumping.

Then:

1. Look at the pages you changed: crop the first ~1300 px of
   `assets/preview/<page>-500.jpg` and read it. Video areas are blank rectangles in
   the stills, which is expected (home.js plays the videos over them).
2. If a preview starts with text or an empty box, the page needs real media at the
   top (a `.pj-top` grid). See the `project-page` skill.
3. Commit the changed `assets/preview/` files with the page change.
