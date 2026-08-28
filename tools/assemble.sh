#!/usr/bin/env bash
# Assemble src/**/*.html into dist/, expanding partials and page variables.
#
# There is no framework here and no npm — this is a couple of dozen static
# pages that share one header, one footer and one <head>, and the whole
# templating need is "paste this file in, substitute a few strings". That is
# about fifty lines of bash, runs identically on this machine and on Netlify,
# and adds no dependency that can rot.
#
# A page looks like:
#
#     <!--@var title: Infant Care in Brooklyn | Cuddle Avenue Academy-->
#     <!--@var desc: Licensed infant care from six weeks...-->
#     <!--@include head-->
#     <!--@include header-->
#     <main id="main"> ... </main>
#     <!--@include footer-->
#     <!--@include scripts-->
#
# Rules:
#   @var lines are read, then stripped from the output.
#   @include NAME pastes src/_partials/NAME.html.
#   {{KEY}} is replaced by the page's @var of that name, everywhere,
#     including inside the partials.
#   {{ROOT}} is computed from the page's own depth, so a partial can write
#     {{ROOT}}css/concept-2.css and be correct at every level of the tree.
#   A {{KEY}} left unfilled fails the build: a silently empty <title> or a
#     half-written canonical URL is worse than a build that stops.
set -euo pipefail

SRC=${1:-src}
OUT=${2:-dist}
PARTIALS="$SRC/_partials"

unfilled=$(mktemp)
trap 'rm -f "$unfilled"' EXIT

find "$SRC" -name '*.html' -not -path "$PARTIALS/*" | sort | while read -r page; do
  rel=${page#"$SRC"/}
  depth=$(awk -F/ '{print NF-1}' <<< "$rel")
  root=""
  for ((i = 0; i < depth; i++)); do root+="../"; done

  mkdir -p "$OUT/$(dirname "$rel")"
  target="$OUT/$rel"

  # ---- one sed script carrying this page's variables ------------------
  subst=$(mktemp)
  printf 's|{{ROOT}}|%s|g\n' "$root" > "$subst"
  grep -o '<!--@var [^:]*:[^>]*-->' "$page" 2>/dev/null | while read -r decl; do
    key=${decl#<!--@var }; key=${key%%:*}
    val=${decl#*: }; val=${val%-->}
    # sed's replacement side is not literal: \ escapes, & repeats the match,
    # and | is our delimiter. Order matters — backslashes first.
    val=${val//\\/\\\\}
    val=${val//&/\\&}
    val=${val//|/\\|}
    printf 's|{{%s}}|%s|g\n' "$key" "$val"
  done >> "$subst"

  # ---- paste the partials, drop the @var lines ------------------------
  # Repeated until no marker is left: a partial may include another one
  # (the placeholder page is nothing but includes). Five passes is far more
  # nesting than this site will ever have, and stops a cycle dead.
  expand() {
  awk -v partials="$PARTIALS" '
    function paste(name,   line, path, got) {
      path = partials "/" name ".html"
      got = 0
      while ((getline line < path) > 0) { print line; got = 1 }
      close(path)
      if (!got) {
        printf("MISSING PARTIAL: %s\n", path) > "/dev/stderr"
        exit 3
      }
    }
    /^[[:space:]]*<!--@var /  { next }
    /<!--@include [a-z-]+-->/ {
      match($0, /<!--@include [a-z-]+-->/)
      paste(substr($0, RSTART + 13, RLENGTH - 16))
      next
    }
    { print }
  ' "$1"
  }

  cp "$page" "$target"
  for _ in 1 2 3 4 5; do
    grep -q '<!--@include ' "$target" || break
    expand "$target" > "$target.tmp" && mv "$target.tmp" "$target"
  done
  sed -i -f "$subst" "$target"
  rm -f "$subst"

  # ---- report any placeholder the page forgot to declare --------------
  if left=$(grep -o '{{[A-Za-z_]*}}' "$target" | sort -u | tr '\n' ' '); then
    [ -n "$left" ] && echo "$rel: $left" >> "$unfilled"
  fi
done

if [ -s "$unfilled" ]; then
  echo "ERROR: unfilled placeholders" >&2
  cat "$unfilled" >&2
  exit 4
fi

echo "pages: $(find "$OUT" -name '*.html' | wc -l | tr -d ' ')"
