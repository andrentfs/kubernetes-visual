// Cada lição tem o mesmo número de passos nas cenas e nos textos (PT e EN), e todas as cenas montam.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSite } from '../tools/load.mjs';

const w = loadSite(['data/scenes.js', 'i18n/pt.js', 'i18n/en.js']);
// Helpers simulados: só a estrutura das lições importa aqui, não o desenho.
const H = new Proxy({}, { get: () => () => [0, 0] });
const S = w.buildScenes(H);

test('cenas e textos têm o mesmo número de passos', () => {
  for (const id of w.LESSON_ORDER) for (const lang of ['pt', 'en']) {
    const tx = w.TXT[lang].les[id];
    assert.ok(tx, `${lang}.les.${id}`);
    assert.equal(tx.steps.length, S[id].steps.length, `${lang}.${id}: passos`);
    assert.equal(w.TXT[lang].cap[id].length, S[id].steps.length, `${lang}.${id}: legendas`);
  }
});

test('lições do módulo CKS têm dicas de prova CKS nos dois idiomas', () => {
  for (const id of ['hardening', 'sistema', 'isolamento', 'supply', 'runtime'])
    for (const lang of ['pt', 'en']) assert.ok(w.TXT[lang].les[id].examS?.t?.length, `${lang}.${id}.examS`);
});
