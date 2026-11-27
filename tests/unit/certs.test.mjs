// Confere os dados de certificação contra o currículo oficial da CNCF (v1.37).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSite } from '../tools/load.mjs';

const { CERTS, CERTS_META, CERTTXT } = loadSite(['data/certs.js']);

// Pesos e quantidade de competências por domínio, como em CKA/CKAD_Curriculum_v1.37.pdf.
const OFFICIAL = {
  cka: { storage: [10, 3], trouble: [30, 5], work: [15, 5], arch: [25, 8], net: [20, 6] },
  ckad: { design: [20, 4], deploy: [20, 4], obs: [15, 5], env: [25, 8], net: [20, 3] },
};

for (const exam of ['cka', 'ckad']) {
  test(`${exam}: pesos e competências batem com o currículo oficial`, () => {
    const c = CERTS[exam];
    assert.equal(c.weights.reduce((n, [, w]) => n + w, 0), 100);
    for (const [dom, w] of c.weights) {
      assert.ok(OFFICIAL[exam][dom], `domínio inesperado: ${dom}`);
      assert.equal(w, OFFICIAL[exam][dom][0], `peso de ${dom}`);
      assert.equal(c.comp[dom].length, OFFICIAL[exam][dom][1], `competências de ${dom}`);
    }
  });
  test(`${exam}: toda competência tem texto em PT e EN`, () => {
    for (const lang of ['pt', 'en']) for (const dom of Object.keys(CERTS[exam].comp))
      for (const [id] of CERTS[exam].comp[dom]) assert.ok(CERTTXT[lang][exam].c[id], `${lang}.${exam}.c.${id}`);
  });
}

test('metadados da fonte do currículo estão preenchidos', () => {
  assert.match(CERTS_META.files.cka, /^CKA_Curriculum_v\d+\.\d+\.pdf$/);
  assert.match(CERTS_META.checked, /^\d{4}-\d{2}-\d{2}$/);
});
