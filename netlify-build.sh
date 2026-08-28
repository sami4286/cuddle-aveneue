#!/usr/bin/env bash
# Assemble dist/ with only what the site actually serves.
#
# The repo root deliberately is NOT the publish directory. It also holds
# material that must never reach a public URL:
#
#   Cuddle Avenue Assets/  1.5 GB of client originals, including
#                          "For Ayna.docx" and the internal developer guide
#   research/              internal SEO audit and keyword strategy
#   assets/img/_source/    unoptimised photo originals
#
# Everything below is an explicit allow-list, so adding a new folder to the
# repo can never silently publish it.
set -euo pipefail

rm -rf dist
mkdir -p dist/assets/img

# Pages. Every page lives in src/ as a body plus a handful of @include
# markers; tools/assemble.sh pastes in the shared head, header and footer
# and writes the finished HTML into dist/. Adding a page means adding a
# file to src/ — there is nothing to register here.
bash tools/assemble.sh src dist

# stylesheets and scripts
cp -r css js dist/

# fonts and logo artwork
cp -r assets/fonts assets/logo dist/assets/

# optimised imagery only — maxdepth 1 leaves assets/img/_source/ behind
find assets/img -maxdepth 1 -type f -exec cp {} dist/assets/img/ \;

# Web-encoded video, and only the cuts a page actually references — the
# infant/toddler tour is cut and waiting for its program page, and there is
# no reason to push 45 MB of it to the CDN until that page exists. The camera
# originals in assets/Pictures & Video_s/ and assets/Programs/ (633 MB of
# .mov) must never be published at all.
if [ -d assets/video ]; then
  mkdir -p dist/assets/video
  for video in assets/video/*.mp4; do
    [ -e "$video" ] || continue
    # quoted, so a filename merely named in an HTML comment does not count
    if grep -rqF -e "\"assets/video/$(basename "$video")\"" -e "\"{{ROOT}}assets/video/$(basename "$video")\"" src/; then
      cp "$video" dist/assets/video/
    else
      echo "skipped (unreferenced): $video"
    fi
  done
fi

# crawler directives
cp robots.txt _headers dist/

echo "--- dist assembled ---"
find dist -type f | wc -l | xargs echo "files:"
du -sh dist | cut -f1 | xargs echo "size:"
# fail loudly rather than publish something excluded
for excluded in "dist/Cuddle Avenue Assets" "dist/research" "dist/assets/img/_source" \
                "dist/assets/Pictures & Video_s" "dist/assets/Programs" "dist/assets/Menu Pictures"; do
  if [ -d "$excluded" ]; then
    echo "ERROR: excluded directory reached dist/ -> $excluded" >&2
    exit 1
  fi
done
if find dist -name '*.docx' -print -quit | grep -q .; then
  echo "ERROR: a client brief (.docx) reached dist/" >&2
  exit 1
fi

# ── Placeholder pages ────────────────────────────────────────────────
# Pages land in tranches, and the header and footer link to all of them
# from day one. A visitor following one of those links should meet a page
# that says "not written yet, here is a phone number", never a 404.
#
# The placeholders are generated, not committed: the moment a real
# src/<route> exists, that route stops being generated. Nothing to clean
# up by hand, and no stub can ever shadow a real page.

missing=$(for f in $(find dist -name '*.html'); do
  d=$(dirname "$f")
  grep -oE 'href="[^"#]*\.html[^"]*"' "$f" | sed -E 's/href="//; s/"$//; s/[?#].*//' |
    grep -v '^http' | while read -r l; do
      [ -f "$d/$l" ] || echo "${l#../}"
    done
done | sort -u)

made=""
for route in $missing; do
  [ -f "src/$route" ] && continue
  mkdir -p "src/$(dirname "$route")"
  name=$(basename "$route" .html | tr '-' ' ' |
         awk '{ print toupper(substr($0,1,1)) substr($0,2) }')
  # the handful of names a filename cannot spell correctly
  case "$route" in
    programs/2k.html)         name="2K program" ;;
    programs/nyc-3k.html)     name="NYC 3-K for All" ;;
    for-families/faq.html)    name="Frequently asked questions" ;;
    admissions/tuition-financial-assistance.html) name="Tuition &amp; financial assistance" ;;
    for-families/meals-nutrition-breastfeeding.html) name="Meals, nutrition &amp; breastfeeding support" ;;
  esac
  {
    printf '<!--@var TITLE: %s | Cuddle Avenue Academy-->\n' "$name"
    printf '<!--@var DESC: This page of the Cuddle Avenue Academy site is still being written. Call (917) 960-5618 or schedule a tour in the meantime.-->\n'
    printf '<!--@var OGTITLE: %s | Cuddle Avenue Academy-->\n' "$name"
    printf '<!--@var OGDESC: Still being written &mdash; call us or book a tour in the meantime.-->\n'
    printf '<!--@var PAGENAME: %s-->\n' "$name"
    printf '<!--@include stub-->\n'
  } > "src/$route"
  made="$made src/$route"
done

if [ -n "$made" ]; then
  bash tools/assemble.sh src dist > /dev/null
  rm -f $made
  find src -type d -empty -delete
  echo "--- placeholders generated for pages not written yet: ---"
  for route in $missing; do echo "  $route"; done
fi
