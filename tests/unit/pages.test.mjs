// Páginas estáticas por lição (ADR-005): existem, estão atualizadas e têm os metadados certos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, loadSite } from '../tools/load.mjs';
import { build, BASE } from '../../scripts/gen-lesson-pages.mjs';

const files = build();
const { LESSON_ORDER } = loadSite(['data/scenes.js']);

test('páginas e sitemap no disco estão iguais ao gerador (rode node scripts/gen-lesson-pages.mjs)', () => {
  for (const [p, c] of Object.entries(files)) {
    assert.ok(existsSync(resolve(ROOT, p)), `falta ${p}`);
    assert.equal(readFileSync(resolve(ROOT, p), 'utf8'), c, `${p} desatualizado`);
  }
});

test('uma página por lição em cada idioma, com canonical, hreflang, Open Graph e link para a lição interativa', () => {
  for (const id of LESSON_ORDER) for (const [lang, path, up] of [['pt', `licao/${id}/`, '../../'], ['en', `en/lesson/${id}/`, '../../../']]) {
    const h = files[path + 'index.html'];
    assert.ok(h, `${lang} ${id}`);
    assert.ok(h.includes(`<link rel="canonical" href="${BASE}${path}">`), `${path} canonical`);
    assert.ok(h.includes('hreflang="pt-BR"') && h.includes('hreflang="en"') && h.includes('hreflang="x-default"'), `${path} hreflang`);
    assert.ok(/<meta property="og:title" content="[^"]+">/.test(h) && /<meta name="description" content="[^"]{30,}">/.test(h), `${path} meta`);
    assert.ok(h.includes(`href="${up}?lang=${lang}#${id}-1"`), `${path} link interativo`);
    JSON.parse(h.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
  }
});

test('sitemap lista a raiz e as 2 versões de cada lição', () => {
  const n = (files['sitemap.xml'].match(/<loc>/g) || []).length;
  assert.equal(n, 1 + LESSON_ORDER.length * 2);
});
