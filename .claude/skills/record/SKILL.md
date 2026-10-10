---
name: record
description: Make a short screen recording (MP4) of a page on nkve.dev to show Nikhil an animation or transition, such as the loading screen, the home preview dissolve or the jump into a project page. Use whenever a change affects motion.
---

# Record a page

```
SITE_CHECK_OUT=<scratchpad>/check python3 tools/site-check.py record index.html --seconds 9
SITE_CHECK_OUT=<scratchpad>/check python3 tools/site-check.py record index.html --seconds 10 --click .preview-open --at 6
SITE_CHECK_OUT=<scratchpad>/check python3 tools/site-check.py record pages/braille.html --size desktop --seconds 5
```

It records from the first frame with the loading screen on and prints the MP4's
path (H.264, plays anywhere). `--click SELECTOR --at S` clicks something S seconds
after load. On the home page, `.preview-open` opens the selected project on phones
and `.box.active .see-more` does it on desktop.

## Before sending

1. Check it yourself: tile frames with
   `ffmpeg -i X.mp4 -vf "fps=4,scale=120:-1,tile=10x4" -frames:v 1 tile.png` and read
   the tile. Make sure the part you changed is actually in the clip.
2. Send the MP4 with SendUserFile and one line saying what to watch for.

Card and page videos show posters only (no H.264 in Playwright's Chromium). Fonts
are real Montserrat. Timing is real time, but a busy sandbox can drop frames, so
judge smoothness on a real device.
