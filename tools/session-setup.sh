#!/bin/bash
# Run at the start of every Claude Code session (SessionStart hook in
# .claude/settings.json). Gets the sandbox ready for this repo and prints a
# one-line status, which ends up in Claude's context. Never fails the session.
cd "$(dirname "$0")/.." || exit 0
msgs=()

# shapely: tools/ga-diagrams.py
python3 -c "import shapely" 2>/dev/null || pip install -q --break-system-packages shapely >/dev/null 2>&1 || msgs+=("shapely install failed")

# Montserrat for tools/make-previews.py and tools/site-check.py (Typekit is blocked)
FONTS="${PREVIEW_FONTS:-$HOME/.cache/nkve-fonts}"
mkdir -p "$FONTS"
for f in Montserrat Montserrat-Italic; do
  if [ ! -s "$FONTS/$f.ttf" ]; then
    curl -sfL -m 60 -o "$FONTS/$f.ttf" "https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/$f%5Bwght%5D.ttf" || msgs+=("could not download $f.ttf")
  fi
done

# Playwright's Chromium ships with the cloud image; don't run playwright install
python3 -c "import playwright" 2>/dev/null || msgs+=("python playwright missing: pip install --break-system-packages playwright")
command -v ffmpeg >/dev/null || msgs+=("ffmpeg missing")

# what other sessions pushed since this clone was made
git fetch -q origin master 2>/dev/null && behind=$(git rev-list --count HEAD..origin/master 2>/dev/null)

status="nkve.dev setup: fonts in $FONTS"
[ -n "$behind" ] && [ "$behind" != "0" ] && status="$status; $behind new commit(s) on origin/master, pull --rebase before editing"
[ ${#msgs[@]} -gt 0 ] && status="$status; problems: ${msgs[*]}"
echo "$status. Tools: tools/site-check.py (shots/overflow/record), tools/make-previews.py. Skills in .claude/skills."
exit 0
