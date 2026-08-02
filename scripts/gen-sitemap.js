/* ═══════════════════════════════════════════════════════════
   gen-sitemap.js — bygger sitemap.xml fra katalogtreet.

   Kjør fra repo-rota:  node scripts/gen-sitemap.js

   Bakgrunn: den håndskrevne sitemap.xml hadde 80 oppføringer der 63 var
   frosne språkkopier, mens 52 av de 69 ekte sidene manglet. lastmod sto
   på 2026-04-20 for 71 av dem. Denne fila leser treet i stedet, og henter
   lastmod fra `git log -1 --format=%cs` per fil.

   De frosne språkkopiene (ar/ en/ fr/ …) holdes UTE med vilje: hver dekker
   7 av 69 sider, resten 404-er, og de er merket noindex.
   ═══════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://hverdagsverktoy.com';
const FROZEN = ['ar', 'en', 'fr', 'lt', 'pl', 'so', 'ti', 'uk', 'zh'];
const SKIP = [
  '.git', '.claude', '_arkiv', '_incoming', '_dev', 'node_modules',
  'hv_oppdatert_design', 'prerender', 'audit', 'research', 'split_skill',
  'content', 'scripts', 'icons', 'fonts', 'shared', 'mac-to-pc'
].concat(FROZEN);

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP.includes(e.name) || e.name.startsWith('.')) continue;
      walk(path.join(dir, e.name), out);
    } else if (e.name === 'index.html') {
      const rel = path.relative(ROOT, dir).split(path.sep).filter(Boolean).join('/');
      out.push(rel ? '/' + rel + '/' : '/');
    }
  }
  return out;
}

function lastmod(urlPath) {
  const file = path.join(urlPath.replace(/^\//, ''), 'index.html').split(path.sep).join('/');
  try {
    const d = execFileSync('git', ['log', '-1', '--format=%cs', '--', file],
      { cwd: ROOT, encoding: 'utf8' }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  } catch (e) { /* ikke i git ennå */ }
  return new Date(fs.statSync(path.join(ROOT, file)).mtime).toISOString().slice(0, 10);
}

function priority(u) {
  if (u === '/') return '1.0';
  if (u === '/om/' || u === '/personvern/') return '0.3';
  return u.split('/').filter(Boolean).length === 1 ? '0.8' : '0.7';
}

const pages = walk(ROOT, []).sort((a, b) =>
  a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b, 'nb'));

const body = pages.map(u =>
  '  <url>\n' +
  '    <loc>' + ORIGIN + u + '</loc>\n' +
  '    <lastmod>' + lastmod(u) + '</lastmod>\n' +
  '    <changefreq>monthly</changefreq>\n' +
  '    <priority>' + priority(u) + '</priority>\n' +
  '  </url>'
).join('\n');

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<!-- Generert av scripts/gen-sitemap.js — ikke rediger for hånd. -->\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  body + '\n</urlset>\n';

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
console.log('sitemap.xml skrevet: ' + pages.length + ' sider (frosne språkkopier utelatt).');
