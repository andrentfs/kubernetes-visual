// SEO e preview para redes sociais (LinkedIn usa Open Graph).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT } from '../tools/load.mjs';

const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
const meta = (attr, name) => html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]+)"`))?.[1];

test('meta description, Open Graph e Twitter Card presentes', () => {
  assert.ok(meta('name', 'description')?.length > 50);
  for (const p of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type']) assert.ok(meta('property', p), p);
  assert.equal(meta('name', 'twitter:card'), 'summary_large_image');
});

test('imagem de preview existe e tem o tamanho declarado (1200×630)', () => {
  const url = meta('property', 'og:image');
  const file = resolve(ROOT, url.replace(/^https:\/\/[^/]+\/kubernetes-visual\//, ''));
  assert.ok(existsSync(file), file);
  const b = readFileSync(file);
  assert.equal(b.readUInt32BE(16), 1200);
  assert.equal(b.readUInt32BE(20), 630);
  assert.ok(statSync(file).size < 5 * 1024 * 1024, 'LinkedIn aceita até 5 MB');
});

test('JSON-LD é válido e do tipo Course', () => {
  const j = JSON.parse(html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/)[1]);
  assert.equal(j['@type'], 'Course');
  assert.equal(j.isAccessibleForFree, true);
});

test('robots.txt aponta para o sitemap, que é XML válido', () => {
  const robots = readFileSync(resolve(ROOT, 'robots.txt'), 'utf8');
  const url = robots.match(/Sitemap: (\S+)/)[1];
  assert.match(url, /sitemap\.xml$/);
  assert.match(readFileSync(resolve(ROOT, 'sitemap.xml'), 'utf8'), /<urlset[\s\S]*<loc>https:\/\/andrentfs\.github\.io\/kubernetes-visual\/<\/loc>/);
});
