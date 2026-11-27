// Simulador “quando um node cai” (S2): linha do tempo com os padrões da v1.37 e regras do Kubernetes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSite } from '../tools/load.mjs';

const { K8SSIM_NODEFAIL: NF } = loadSite(['js/sim/engine.js', 'js/sim/nodefail.js']);
const P = v => JSON.parse(JSON.stringify(v));
const at = (sim, t) => { sim.seek(t); return P(sim.get().state); };
const when = (sim, k, extra = () => true) => P(sim.get().state.feed).filter(e => e.k === k && extra(e)).map(e => e.t);
const pod = (s, name) => s.pods.find(p => p.name === name);

// Cenário da lição: node-3 cai em t=11 (ação em t=10 vale no próximo segundo).
function scenario(cfg) { const sim = NF.create(cfg); sim.seek(10); sim.down(2); return sim; }

test('padrões da v1.37: Lease 10 s, grace 50 s, tolerância 300 s', () => {
  assert.deepEqual(P(NF.DEFAULTS), { lease: 10, grace: 50, tol: 300, start: 5, until: 900 });
});

test('antes de virar NotReady, os pods do node caído continuam no EndpointSlice (requisições falham)', () => {
  const sim = scenario();
  const s = at(sim, 30);
  assert.equal(s.nodes[2].ready, true);
  assert.deepEqual(P(NF.stats(s)), { ready: 3, eps: 3, failing: 1, term: 0 });
});

test('NotReady quando o Lease passa de 50 s sem renovação; pods saem do EndpointSlice', () => {
  const sim = scenario();
  // último Lease em t=10; 61 − 10 > 50
  assert.equal(at(sim, 60).nodes[2].ready, true);
  const s = at(sim, 61);
  assert.equal(s.nodes[2].ready, false);
  assert.deepEqual(P(NF.stats(s)), { ready: 2, eps: 2, failing: 0, term: 0 });
});

test('despejo 300 s depois; ReplicaSet recria na hora, StatefulSet espera; nenhum pod muda de node', () => {
  const sim = scenario();
  assert.equal(pod(at(sim, 360), 'api-3').term, false);
  const s = at(sim, 361);
  assert.equal(pod(s, 'api-3').term, true);
  assert.equal(pod(s, 'db-0').term, true);
  assert.equal(pod(s, 'api-4').node, 0, 'scheduler escolhe o node Ready com menos pods (empate → node-1)');
  assert.equal(pod(s, 'api-4').phase, 'ContainerCreating');
  assert.equal(s.pods.filter(p => p.app === 'db').length, 1, 'StatefulSet não cria outro db-0');
  const s2 = at(sim, 366);
  assert.equal(pod(s2, 'api-4').phase, 'Running');
  assert.deepEqual(P(NF.stats(s2)), { ready: 2, eps: 3, failing: 0, term: 2 });
  assert.deepEqual(when(sim, 'stuck'), [361]);
});

test('o node volta: Ready, kubelet confirma a remoção, db-0 é recriado e os pods recriados ficam onde nasceram', () => {
  const sim = scenario();
  sim.seek(399); sim.up(2);                 // t=400
  const s = at(sim, 400);
  assert.equal(s.nodes[2].ready, true);
  assert.equal(pod(s, 'api-3'), undefined);
  assert.equal(pod(s, 'db-0').phase, 'ContainerCreating');
  assert.equal(pod(s, 'db-0').node, 2, 'node-3 é o que tem menos pods');
  assert.equal(pod(s, 'api-4').node, 0, 'api-4 não volta para o node-3');
  const homes = new Map();
  for (let t = 0; t <= 900; t += 7) for (const p of at(sim, t).pods) if (p.node !== null) {
    if (homes.has(p.name + p.node) || !homes.has(p.name)) homes.set(p.name, p.node);
    assert.equal(homes.get(p.name), p.node, `${p.name} mudou de node em t=${t}`);
  }
});

test('voltar antes do religamento e não religar: o futuro muda (o religamento some)', () => {
  const sim = scenario();
  sim.seek(399); sim.up(2);
  sim.seek(200); sim.seek(500);
  assert.equal(sim.get().state.nodes[2].ready, true);
  sim.seek(300); sim.down(0);                // nova ação em 301 apaga o religamento em 400
  const s = at(sim, 500);
  assert.equal(s.nodes[2].ready, false);
  assert.equal(s.nodes[0].ready, false);
});

test('tempos configuráveis: grace 40 s e tolerância 60 s', () => {
  const sim = scenario({ grace: 40, tol: 60 });
  assert.deepEqual(when(sim.seek(200) && sim, 'notready'), [51]);
  assert.deepEqual(when(sim, 'evict', e => e.a.p === 'api-3'), [111]);
});

test('sem nenhum node Ready, o pod novo fica Pending', () => {
  const sim = NF.create(); sim.seek(1); sim.down(0); sim.down(1); sim.down(2);
  const s = at(sim, 400);
  assert.equal(NF.stats(s).ready, 0);
  assert.ok(s.pods.some(p => p.phase === 'Pending' && p.node === null));
});
