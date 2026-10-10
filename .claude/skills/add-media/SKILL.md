---
name: add-media
description: Make web copies of photos, videos or PDF figures for nkve.dev (assets/web/), including files from the claude.ai Project or uploads. Use before putting any new image or video on a page.
---

# Add media

Never link originals (`assets/GenAutoVids/`, `old-media/`, uploads). Make a web copy.

**Where to get the source file**

- claude.ai Project files (for example `BrailleVideo.mp4`, `ArmYtVideo.mp4`): use the
  Projects tool, `project_read` with the file's name, which saves it locally.
- Files Nikhil attached: by name, from the conversation's uploads folder.
- PDF figures: `pdfimages -png -p -f N -l N file.pdf out/m`. Pick by size (tiny ones
  are masks). Flatten transparent PNGs onto white before saving as JPG.

**Video** (iPhone HEVC `.mov` won't play in Chrome, so always re-encode):

```
ffmpeg -i in.mov -an -vf scale=960:-2 -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart assets/web/NAME.mp4
ffmpeg -ss 0.5 -i assets/web/NAME.mp4 -frames:v 1 -q:v 4 assets/web/NAME.jpg
```

Trim with `-ss START -t LENGTH` before `-i`. For a loop, cut at a point where the
first and last frames match.

If the video will sit near the top of a project page (inside the home preview), also
make `assets/web/sm/NAME.mp4`. On phones home.js always swaps `assets/web/X.mp4` for
`assets/web/sm/X.mp4` in the preview, so a missing copy means a frozen poster there.
Make it the same way with `scale=540:-2 -crf 30` (about a third of the bitrate).

**Photo**: longest side ≤1400 px, JPG quality ~85, into `assets/web/img/NAME.jpg`.

```
python3 -c "from PIL import Image; im=Image.open('in.png').convert('RGB'); im.thumbnail((1400,1400)); im.save('assets/web/img/NAME.jpg', quality=85, optimize=True, progressive=True)"
```

**On the page**

- Videos: `<video data-autoplay data-src="../assets/web/NAME.mp4" poster="../assets/web/NAME.jpg" aria-label="…"></video>`
  inside a `.pj-tile` with `--ar` set to the real aspect ratio
  (`ffprobe -v error -show_entries stream=width,height -of csv=p=0 FILE`).
- Animations on black use `mix-blend-mode: lighten`.
- Every image gets real alt text describing what's in it; `data-zoom` for photos
  worth enlarging.

Check the result with the `check-site` skill (posters stand in for videos there).
