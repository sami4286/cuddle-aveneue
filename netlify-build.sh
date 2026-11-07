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
# file to src/, there is nothing to register here.
bash tools/assemble.sh src dist

# Retired pages, kept in backup/pages/ and never published: About us and
# the all-programs overview (hidden 2026-10-18), and the For Families FAQ,
# Health & safety and Meals pages, whose content now lives on the one For
# Families page (2026-10-29), and the Schedule a tour page (2026-11-01;
# every tour button books on Calendly). The site is twelve pages, nothing else.
# Nothing may link to them, or the placeholder step below would quietly
# generate a page for the link. To bring one back, see backup/pages/README.md.
if grep -rlE 'href="[^"]*(about|programs|programs/2k|admissions/schedule-a-tour|for-families/(faq|health-and-safety|meals-nutrition-breastfeeding))[.]html' dist --include='*.html' | grep -q .; then
  echo "ERROR: a published page links to a retired page:" >&2
  grep -rnoE 'href="[^"]*(about|programs|programs/2k|admissions/schedule-a-tour|for-families/(faq|health-and-safety|meals-nutrition-breastfeeding))[.]html[^"]*"' dist --include='*.html' >&2
  exit 1
fi

# stylesheets and scripts
cp -r css js dist/

# fonts and logo artwork
cp -r assets/fonts assets/logo dist/assets/

# documents families can open, e.g. the parent handbook PDF
if [ -d assets/docs ]; then mkdir -p dist/assets/docs && cp assets/docs/*.pdf dist/assets/docs/; fi

# optimised imagery only, maxdepth 1 leaves assets/img/_source/ behind
find assets/img -maxdepth 1 -type f -exec cp {} dist/assets/img/ \;

# Web-encoded video, and only the cuts a page actually references, the
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

# ── where the forms post ────────────────────────────────────────────
# Two ways of sending, and the build picks between them from the
# environment so the choice is made once, here, rather than in four
# pages.
#
#   RESEND_API_KEY set        the forms post to our own /api/inquiry and
#                             the key never leaves the server. Needs the
#                             sending domain verified, which is DNS.
#
#   WEB3FORMS_ACCESS_KEY set  the forms post straight to Web3Forms. Its
#                             free tier refuses server-side calls, "use
#                             our API in client side", so the endpoint
#                             has to be the browser's, and the key has to
#                             travel in the page. That is Web3Forms' own
#                             design: the key only routes mail to the one
#                             address it was registered with.
#
#   neither                   left pointing at /api/inquiry, which
#                             answers 503 and tells the visitor to call.
#
# The key is substituted in here rather than committed, so it lives in
# the host's settings and not in the repository.
if [ -z "${RESEND_API_KEY:-}" ] && [ -n "${WEB3FORMS_ACCESS_KEY:-}" ]; then
  forms=0
  while IFS= read -r page; do
    perl -pi -e 's{action="(?:\.\./)*api/inquiry"}{action="https://api.web3forms.com/submit" data-relay="web3forms"}g' "$page"
    perl -pi -e 's{\{\{WEB3FORMS_KEY\}\}}{'"$WEB3FORMS_ACCESS_KEY"'}g' "$page"
    forms=$((forms + 1))
  done < <(grep -rl 'name="access_key"' dist --include='*.html')
  echo "forms: posting to Web3Forms ($forms pages)"
else
  # No client-side key to place, so the placeholder must not ship. The
  # field is emptied rather than left reading {{WEB3FORMS_KEY}}.
  while IFS= read -r page; do
    perl -pi -e 's{\{\{WEB3FORMS_KEY\}\}}{}g' "$page"
  done < <(grep -rl '{{WEB3FORMS_KEY}}' dist --include='*.html' || true)
  echo "forms: posting to /api/inquiry"
fi

# ── live parent reviews ──────────────────────────────────────────────
# Pulls the Google listing's reviews into the carousel and the rating into
# every footer. With no key set it prints a line and changes nothing, so
# the curated quotes in src/index.html ship, which is the state until the
# client provisions a Places API key.
node tools/fetch-reviews.js dist

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
    programs/2-k.html)        name="2-K Program" ;;
    programs/nyc-3k.html)     name="NYC 3-K for All" ;;
    admissions/tuition-financial-assistance.html) name="Tuition &amp; financial assistance" ;;
  esac
  {
    printf '<!--@var TITLE: %s | Cuddle Avenue Academy-->\n' "$name"
    printf '<!--@var DESC: This page of the Cuddle Avenue Academy site is still being written. Call (917) 960-5618 or schedule a tour in the meantime.-->\n'
    printf '<!--@var OGTITLE: %s | Cuddle Avenue Academy-->\n' "$name"
    printf '<!--@var OGDESC: Still being written. Call us or book a tour in the meantime.-->\n'
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

# ── speed and search data ────────────────────────────────────────
# Last, on the finished pages: one hashed, minified stylesheet instead of
# five, a hashed script name, and FAQ structured data. See the header of
# tools/optimize.js.
node tools/optimize.js dist
