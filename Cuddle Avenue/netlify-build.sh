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

# Pages. The URL layout is decided here rather than by renaming source
# files, so local paths and git history stay put:
#
#   concept-2-v2.html -> /                 the current direction, brand palette
#   concept-2.html    -> /concept-2.html   same layout, green palette
#   index.html        -> /concept-1.html   the earlier cream/marigold concept
#
# All three use relative asset paths, so they work unchanged at the root.
cp concept-2-v2.html dist/index.html
cp concept-2.html    dist/concept-2.html
cp index.html        dist/concept-1.html

# stylesheets and scripts
cp -r css js dist/

# fonts and logo artwork
cp -r assets/fonts assets/logo dist/assets/

# optimised imagery only — maxdepth 1 leaves assets/img/_source/ behind
find assets/img -maxdepth 1 -type f -exec cp {} dist/assets/img/ \;

# crawler directives
cp robots.txt _headers dist/

echo "--- dist assembled ---"
find dist -type f | wc -l | xargs echo "files:"
du -sh dist | cut -f1 | xargs echo "size:"
# fail loudly rather than publish something excluded
if [ -d "dist/Cuddle Avenue Assets" ] || [ -d dist/research ] || [ -d dist/assets/img/_source ]; then
  echo "ERROR: an excluded directory reached dist/" >&2
  exit 1
fi
