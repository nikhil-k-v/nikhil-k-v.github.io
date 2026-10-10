---
name: ship
description: Commit and push a finished change to nkve.dev (master is live) safely: rebase on other sessions' work, bump cache versions, final checks, then report to Nikhil. Use at the end of every change.
---

# Ship a change

1. **Rebase first:** `git pull --rebase origin master`. Other sessions push to this
   repo, sometimes at the same time. Resolve conflicts by keeping both sides' intent,
   and never force-push.
2. **Cache versions:** for every shared CSS/JS/SVG/MP4 you changed that's linked with
   `?v=N`, bump N on every page that links it:
   `grep -rn "FILE?v=" --include=*.html .`
3. **Previews:** if the top of any project page changed, run the `previews` skill.
4. **Checks:** run the `check-site` skill on what you touched (both sizes). If
   anything moves, run the `record` skill and send the clip.
5. **CLAUDE.md:** update it if you added a file, component, tool, convention or open
   question the next session needs to know about.
6. **Commit:** a plain message saying what changed, then the attribution lines from
   the session's system reminder. Run `git status` first; don't commit
   `__pycache__`, scratch files or originals.
7. **Push:** `git pull --rebase origin master && git push origin HEAD:master`. The
   site is live about a minute later.
8. **Report:** what changed, briefly, plus every assumption and anything you
   couldn't verify. Don't recap the steps.
