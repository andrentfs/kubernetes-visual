// Confere os dados de certificação contra o currículo oficial da CNCF (v1.37).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSite } from '../tools/load.mjs';

const { CERTS, CERTS_META, CERTTXT } = loadSite(['data/certs.js']);

// Pesos e quantidade de competências por domínio, como nos PDFs v1.37 de CKA, CKAD e CKS.
const OFFICIAL = {
  cka: { storage: [10, 3], trouble: [30, 5], work: [15, 5], arch: [25, 8], net: [20, 6] },
  ckad: { design: [20, 4], deploy: [20, 4], obs: [15, 5], env: [25, 8], net: [20, 3] },
  cks: { setup: [15, 5], harden: [15, 4], system: [10, 4], micro: [20, 4], supply: [20, 4], runtime: [20, 5] },
};

for (const exam of ['cka', 'ckad', 'cks']) {
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

test('competências não cobertas apontam para uma lição planejada com nome nos dois idiomas', () => {
  for (const exam of ['cka', 'ckad', 'cks']) for (const dom of Object.keys(CERTS[exam].comp))
    for (const [id, , st, plan] of CERTS[exam].comp[dom]) if (st !== 'full') {
      assert.ok(plan, `${exam}.${id} sem plano`);
      for (const lang of ['pt', 'en']) assert.ok(CERTTXT[lang].plan[plan], `${lang}.plan.${plan}`);
    }
});

test('toda lição citada nos mapas de cobertura existe no curso', () => {
  const { LESSON_ORDER } = loadSite(['data/scenes.js']);
  for (const exam of ['cka', 'ckad', 'cks']) for (const dom of Object.keys(CERTS[exam].comp))
    for (const [id, les] of CERTS[exam].comp[dom]) for (const l of les)
      assert.ok(LESSON_ORDER.includes(l), `${exam}.${id}: lição ${l} não existe`);
});

test('CKS: as 26 competências estão cobertas por lições', () => {
  const all = Object.values(CERTS.cks.comp).flat();
  assert.equal(all.length, 26);
  assert.deepEqual(all.filter(([, les, st]) => st !== 'full' || !les.length).map(([id]) => id), []);
});

// Regressão (relato de 28/11/2026): em lições com dica de uma prova só (cluster, nodefail, módulo 06),
// as abas da caixa “Na prova” ficavam presas nessa prova.
test('CERTS_TAB: clique numa aba sempre vale; sem clique, abre na única prova com dica', () => {
  const { CERTS_TAB } = loadSite(['data/certs.js']);
  const T = { t: ['x'] };
  assert.equal(CERTS_TAB({ cka: T }, 'ckad', false), 'cka', 'cluster/nodefail: abre na CKA');
  assert.equal(CERTS_TAB({ cka: T }, 'ckad', true), 'ckad', 'cluster/nodefail: clique em CKAD mostra CKAD');
  assert.equal(CERTS_TAB({ cka: T }, 'cks', true), 'cks');
  assert.equal(CERTS_TAB({ cks: T }, 'cka', false), 'cks', 'módulo 06: abre na CKS');
  assert.equal(CERTS_TAB({ cks: T }, 'cka', true), 'cka', 'módulo 06: clique em CKA mostra CKA (sem dicas)');
  assert.equal(CERTS_TAB({ cka: T, ckad: T }, 'cks', false), 'cks', 'várias provas: respeita a escolha salva');
  assert.equal(CERTS_TAB({ cka: T, ckad: T, cks: T }, 'ckad', false), 'ckad');
  assert.equal(CERTS_TAB({}, 'cka', false), null, 'sem dicas: sem caixa');
});

test('dicas de prova: módulo 06 tem CKS; a revisão (tudo) tem as três; PT e EN iguais', () => {
  const w = loadSite(['data/scenes.js', 'i18n/labels.js', 'i18n/pt.js', 'i18n/en.js']);
  const S = w.buildScenes(new Proxy({}, { get: () => () => [0, 0] }));
  for (const id of w.LESSON_ORDER) {
    const has = l => ['exam', 'examD', 'examS'].filter(k => w.TXT[l].les[id][k]?.t?.length).join();
    assert.equal(has('pt'), has('en'), `${id}: mesmas provas em PT e EN`);
    if (S[id].mod === 5) assert.ok(w.TXT.pt.les[id].examS?.t?.length, `${id}: dica CKS`);
  }
  for (const k of ['exam', 'examD', 'examS']) assert.ok(w.TXT.pt.les.tudo[k]?.t?.length, `tudo.${k}`);
});
