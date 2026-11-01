// Deploy build: index.html stays a single file for editing; this splits its big
// stylesheet and main script into content-hashed files that phones cache for good,
// so an update only re-downloads the parts that actually changed.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT = 'dist';
const COPY = ['reports.js', 'sw.js', 'manifest.webmanifest', 'icons'];

let esbuild = null;
try { esbuild = require('esbuild'); } catch (e) { console.warn('esbuild not installed, skipping minify'); }

const minify = (code, loader) => {
  if (!esbuild) return code;
  return esbuild.transformSync(code, { loader, minify: true, legalComments: 'none' }).code;
};
const hash = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);

let html = fs.readFileSync('index.html', 'utf8');

// The one big <style> block
const styleRe = /<style>([\s\S]*?)<\/style>/;
const css = minify(html.match(styleRe)[1], 'css');
const cssName = `app.${hash(css)}.css`;
html = html.replace(styleRe, () => `<link rel="stylesheet" href="/${cssName}">`);

// The largest plain <script> block (the app itself); small ones stay inline
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const main = scripts.reduce((a, b) => (b[1].length > a[1].length ? b : a));
const js = minify(main[1], 'js');
const jsName = `app.${hash(js)}.js`;
html = html.slice(0, main.index) + `<script src="/${jsName}"></script>` + html.slice(main.index + main[0].length);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
fs.writeFileSync(path.join(OUT, 'index.html'), html);
fs.writeFileSync(path.join(OUT, cssName), css);
fs.writeFileSync(path.join(OUT, jsName), js);
for (const f of COPY) fs.cpSync(f, path.join(OUT, f), { recursive: true });

console.log(`index.html ${html.length}  ${cssName} ${css.length}  ${jsName} ${js.length}`);
