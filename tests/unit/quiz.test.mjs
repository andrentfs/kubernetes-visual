// Simulados KCNA e KCSA: estrutura das questões, distribuição pelos pesos oficiais e paridade PT/EN.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadSite, ROOT } from '../tools/load.mjs';
import { build, FILE } from '../../scripts/gen-quiz-refs.mjs';

const { K8SQUIZ } = loadSite(['data/quiz/kcna.js', 'data/quiz/kcsa.js']);
// Pesos dos currículos oficiais (cncf/curriculum, commit f5ab45e, 28/11/2026).
const OFFICIAL = {
  kcna: { fund: 44, orch: 28, deliv: 16, arch: 12 },
  kcsa: { over: 14, comp: 22, fund: 22, threat: 16, plat: 16, comply: 10 },
};
// Quantas questões cada domínio deve ter: maior resto sobre o total.
const share = (w, n) => {
  const raw = Object.entries(w).map(([k, v]) => [k, v * n / 100]);
  const out = Object.fromEntries(raw.map(([k, v]) => [k, Math.floor(v)]));
  let left = n - Object.values(out).reduce((a, b) => a + b, 0);
  for (const [k] of raw.sort((a, b) => (b[1] % 1) - (a[1] % 1))) { if (!left) break; out[k]++; left--; }
  return out;
};

for (const id of ['kcna', 'kcsa']) {
  const Q = K8SQUIZ[id];
  test(`${id}: domínios e pesos iguais ao currículo oficial`, () => {
    assert.deepEqual(Object.fromEntries(Q.domains.map(d => [d.id, d.w])), OFFICIAL[id]);
  });
  test(`${id}: questões distribuídas pelos pesos (maior resto)`, () => {
    const got = {}; for (const q of Q.q) got[q.d] = (got[q.d] || 0) + 1;
    assert.deepEqual(got, share(OFFICIAL[id], Q.q.length));
  });
  test(`${id}: cada questão tem PT e EN completos, 4 alternativas distintas, resposta válida e explicação`, () => {
    const ids = new Set();
    for (const q of Q.q) {
      assert.ok(!ids.has(q.id), `id repetido ${q.id}`); ids.add(q.id);
      assert.ok(OFFICIAL[id][q.d] != null, `${q.id}: domínio`);
      assert.ok(Number.isInteger(q.ok) && q.ok >= 0 && q.ok < 4, `${q.id}: ok`);
      assert.ok(q.ref === null || /^https:\/\/\S+$/.test(q.ref), `${q.id}: ref`);
      for (const l of ['pt', 'en']) {
        const t = q[l];
        assert.ok(t.q.length > 15 && t.e.length > 40, `${q.id}.${l}: texto`);
        assert.equal(t.o.length, 4, `${q.id}.${l}: 4 alternativas`);
        assert.equal(new Set(t.o).size, 4, `${q.id}.${l}: alternativas distintas`);
      }
    }
  });
  test(`${id}: a resposta certa não fica concentrada numa posição`, () => {
    const pos = [0, 0, 0, 0]; Q.q.forEach(q => pos[q.ok]++);
    assert.ok(Math.max(...pos) - Math.min(...pos) <= 2, pos.join('/'));
  });
}

test(`${FILE} lista todos os links das questões (o CI verifica cada um)`, () => {
  assert.equal(readFileSync(resolve(ROOT, FILE), 'utf8'), build());
});
