#!/usr/bin/env node
/* ════════════════════ BUILD OPTIMISER ════════════════════
   Runs last in netlify-build.sh, on the finished dist/.

   1. Stylesheets. The head links five files, each render-blocking. Here
      they are joined in the order the head lists them, stripped of
      comments and spare whitespace, and written as one file whose name
      carries a hash of its contents, css/site.<hash>.css. The name
      changes whenever the CSS does, so the host can tell browsers to keep
      it for a year (vercel.json) without anyone ever seeing a stale one.
      The source files in css/ stay as they are, readable and commented.

   2. The script gets the same treatment: js/concept-2.<hash>.js.

   3. Developer comments are taken out of the published HTML (the source
      keeps them), along with the blank lines they leave.

   4. FAQ structured data. Every page with a question list (.sx-qa) gets a
      FAQPage block built from the questions and answers on that page, so
      search engines and AI answers read exactly what a parent reads.

   No dependencies, Node's own crypto and fs only.
   ========================================================= */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIST = process.argv[2] || 'dist';
const pages = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith('.html')) pages.push(p);
  }
})(DIST);

const hash = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);

/* ── 1. CSS ── */
function minifyCss(css) {
  // strings pass through untouched; everything else loses comments and
  // collapses its whitespace. Spaces around + - : are kept, calc() and
  // descendant selectors depend on them.
  const parts = css.split(/("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/);
  return parts.map((p, i) => {
    if (i % 2) return p;
    return p
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{};,>])\s*/g, '$1')
      .replace(/;}/g, '}');
  }).join('').trim();
}

const index = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const order = [...index.matchAll(/<link rel="stylesheet" href="css\/([\w.-]+\.css)">/g)].map(m => m[1]);
if (!order.length) throw new Error('optimize: no stylesheets found in index.html');
const bundle = minifyCss(order.map(f => fs.readFileSync(path.join(DIST, 'css', f), 'utf8')).join('\n'));
const cssName = `site.${hash(bundle)}.css`;
fs.writeFileSync(path.join(DIST, 'css', cssName), bundle);

/* ── 2. JS ── */
const jsSrc = fs.readFileSync(path.join(DIST, 'js', 'concept-2.js'), 'utf8');
const jsName = `concept-2.${hash(jsSrc)}.js`;
fs.writeFileSync(path.join(DIST, 'js', jsName), jsSrc);

/* ── 4. FAQ data ── */
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', middot: '·', rarr: '→' };
const text = h => h.replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n))
  .replace(/&#x([\da-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&(\w+);/g, (m, n) => ENT[n] ?? m)
  .replace(/\s+/g, ' ').trim();

function faq(html) {
  const out = [];
  for (const block of html.split('<div class="sx-qa">').slice(1)) {
    const end = block.indexOf('</div>\n    </div>');
    const qa = end > 0 ? block.slice(0, end) : block;
    for (const d of qa.split('<details').slice(1)) {
      const q = /<summary>[\s\S]*?<span class="sx-qa__n">[^<]*<\/span>\s*<span>([\s\S]*?)<\/span>/.exec(d);
      const a = /<div class="sx-qa__body">([\s\S]*?)<\/div>\s*<\/details>/.exec(d + '</details>');
      if (q && a) out.push({ '@type': 'Question', name: text(q[1]), acceptedAnswer: { '@type': 'Answer', text: text(a[1]) } });
    }
  }
  return out;
}

let faqs = 0;
for (const p of pages) {
  let s = fs.readFileSync(p, 'utf8');
  const rel = path.relative(path.dirname(p), DIST).replace(/\\/g, '/');
  const pre = rel ? rel + '/' : '';

  let first = true;
  s = s.replace(/<link rel="stylesheet" href="((?:\.\.\/)*)css\/([\w.-]+\.css)">\n?/g, (m, up, f) => {
    if (!order.includes(f)) return m;
    if (!first) return '';
    first = false;
    return `<link rel="stylesheet" href="${up}css/${cssName}">\n`;
  });
  // the head's notes about the separate sheets no longer describe anything
  s = s.replace(/<!-- colour tokens only, loaded after the base sheet\. No layout overrides\. -->\n/, '')
       .replace(/<!-- the sections the client brief adds, homepage and subpages alike -->\n/, '');
  s = s.replace(/src="((?:\.\.\/)*)js\/concept-2\.js"/g, `src="$1js/${jsName}"`);

  // 3. comments, after making sure no script contains one
  for (const sc of s.match(/<script[\s\S]*?<\/script>/g) || []) {
    if (sc.includes('<!--')) throw new Error('optimize: comment inside a script in ' + p);
  }
  s = s.replace(/<!--[\s\S]*?-->/g, '').replace(/\n[ \t]*(?=\n)/g, '').replace(/\n{2,}/g, '\n');

  const items = faq(s);
  if (items.length) {
    const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items }, null, 1)
      .replace(/</g, '\\u003c');
    s = s.replace('</body>', `<script type="application/ld+json">\n${ld}\n</script>\n</body>`);
    faqs++;
  }
  fs.writeFileSync(p, s);
}

console.log(`optimize: ${order.length} stylesheets -> css/${cssName} (${Math.round(bundle.length / 1024)} KB), js/${jsName}, FAQ data on ${faqs} pages`);
