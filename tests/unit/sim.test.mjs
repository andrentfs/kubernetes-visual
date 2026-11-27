// Motor de simulação (ADR-004): relógio, velocidade, pausa, passo a passo e volta no tempo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSite } from '../tools/load.mjs';

const { K8SSIM } = loadSite(['js/sim/engine.js']);
// O motor roda num contexto vm separado: normaliza para comparar com objetos deste contexto.
const P = v => JSON.parse(JSON.stringify(v));

// Modelo pequeno de “node cai” com os tempos usados na lição nodefail (padrões da v1.37):
// Lease renovado a cada 10 s, node-monitor-grace-period de 50 s, tolerância de 300 s para despejo.
const nodeDown = () => K8SSIM.create({
  init: { node: 'Ready', lastBeat: 0, pods: ['api-a'], log: [] },
  until: 400,
  events: [
    { at: 0, id: 'node-off', apply: s => { s.off = true; } },
    { at: 50, id: 'not-ready', apply: s => { s.node = 'NotReady'; s.taint = 'unreachable:NoExecute'; } },
    { at: 350, id: 'evict', apply: s => { s.pods = []; s.replaced = ['api-b']; } },
  ],
  tick: (s, t) => { if (!s.off && t % 10 === 0) s.lastBeat = t; },
});

test('começa parado em t=0 com o estado inicial', () => {
  const g = nodeDown().get();
  assert.equal(g.t, 0); assert.equal(g.playing, false); assert.equal(g.state.node, 'Ready'); assert.deepEqual(P(g.log), []);
});

test('o relógio só anda tocando, e anda na velocidade escolhida', () => {
  const sim = nodeDown();
  sim.advance(5000); assert.equal(sim.get().t, 0, 'pausado não anda');
  sim.play(); sim.advance(5000); assert.equal(sim.get().t, 5);
  sim.setSpeed(10); sim.advance(5000); assert.equal(sim.get().t, 55);
  assert.equal(sim.get().state.node, 'NotReady');
  sim.setSpeed(0.5); sim.advance(4000); assert.equal(sim.get().t, 57);
});

test('frações de tempo real se acumulam (quadros de 16 ms a 1×)', () => {
  const sim = nodeDown(); sim.play();
  for (let i = 0; i < 125; i++) sim.advance(16);   // 2,0 s
  assert.equal(sim.get().t, 2);
});

test('velocidade fica entre 0,5× e 10×', () => {
  const sim = nodeDown();
  assert.equal(sim.setSpeed(100).speed, 10);
  assert.equal(sim.setSpeed(0.01).speed, 0.5);
});

test('eventos disparam no instante exato e ficam no histórico', () => {
  const sim = nodeDown();
  sim.seek(49); assert.equal(sim.get().state.node, 'Ready');
  sim.seek(50); assert.equal(sim.get().state.node, 'NotReady');
  assert.deepEqual(P(sim.get().log.map(e => [e.t, e.id])), [[1, 'node-off'], [50, 'not-ready']]);
  assert.equal(sim.nextEventAt(), 350);
});

test('voltar no tempo reproduz exatamente o mesmo estado (inclusive no meio de pontos de restauração)', () => {
  const sim = nodeDown(), seen = new Map();
  for (let t = 0; t <= 400; t++) { sim.seek(t); seen.set(t, sim.get()); }
  for (const t of [399, 350, 349, 123, 50, 49, 11, 10, 9, 1, 0]) {
    sim.seek(t);
    assert.deepEqual(sim.get().state, seen.get(t).state, `estado em t=${t}`);
    assert.deepEqual(sim.get().log, seen.get(t).log, `histórico em t=${t}`);
  }
  sim.seek(200); sim.stepBack(); assert.deepEqual(sim.get().state, seen.get(199).state);
  sim.stepForward(); sim.stepForward(); assert.deepEqual(sim.get().state, seen.get(201).state);
});

test('passo a passo pausa a simulação', () => {
  const sim = nodeDown(); sim.play();
  assert.equal(sim.stepForward().playing, false);
  assert.equal(sim.get().t, 1);
  assert.equal(sim.stepBack().t, 0);
  assert.equal(sim.stepBack().t, 0, 'não vai antes de 0');
});

test('para sozinha no fim e não passa do limite', () => {
  const sim = nodeDown(); sim.setSpeed(10); sim.play();
  sim.advance(60000);
  const g = sim.get();
  assert.equal(g.t, 400); assert.equal(g.done, true); assert.equal(g.playing, false);
  assert.deepEqual(P(g.state.replaced), ['api-b']);
  assert.equal(sim.play().playing, false, 'no fim, play não liga');
});

test('reiniciar volta ao estado inicial; o snapshot entregue é imutável e não afeta a simulação', () => {
  const sim = nodeDown(); sim.seek(360);
  const g = sim.get();
  assert.throws(() => { g.state.node = 'x'; });
  assert.equal(sim.get().state.node, 'NotReady');
  assert.equal(sim.restart().state.node, 'Ready');
  assert.deepEqual(P(sim.get().log), []);
});

test('ouvintes recebem cada mudança e podem sair', () => {
  const sim = nodeDown(), got = [];
  const off = sim.on(s => got.push(s.t));
  sim.seek(3); sim.stepForward(); off(); sim.stepForward();
  assert.deepEqual(got, [3, 4]);
});

test('dt diferente de 1 e eventos com mesmo instante na ordem declarada', () => {
  const sim = K8SSIM.create({ init: { a: [] }, dt: 5, until: 20, events: [{ at: 10, id: 'x', apply: s => { s.a.push('x'); } }, { at: 10, id: 'y', apply: s => { s.a.push('y'); } }] });
  sim.seek(10); assert.deepEqual(P(sim.get().state.a), ['x', 'y']);
  sim.seek(7); assert.equal(sim.get().t, 5, 'arredonda para o tick mais próximo');
});

test('mesma definição, mesma linha do tempo (determinismo)', () => {
  const a = nodeDown(), b = nodeDown();
  a.setSpeed(3); a.play(); for (let i = 0; i < 50; i++) a.advance(37);
  b.seek(a.get().t);
  assert.deepEqual(a.get().state, b.get().state);
});

test('definição inválida falha com mensagem clara', () => {
  assert.throws(() => K8SSIM.create({}), /init é obrigatório/);
  assert.throws(() => K8SSIM.create({ init: {}, events: [{ id: 'z' }] }), /evento sem "at" válido \(z\)/);
});

test('ação do usuário no meio da simulação vale no próximo passo e cria um novo futuro ao voltar no tempo', () => {
  const mk = () => K8SSIM.create({ init: { up: true, log: [] }, until: 100, tick: (s, t) => { s.log.push(s.up ? 1 : 0); } });
  const sim = mk();
  sim.seek(10);
  sim.act({ id: 'down', apply: s => { s.up = false; } });   // vale em t=11
  sim.seek(20);
  assert.equal(sim.get().state.up, false);
  assert.deepEqual(P(sim.get().log.map(e => [e.t, e.id])), [[11, 'down']]);
  sim.seek(30); sim.act({ id: 'up', apply: s => { s.up = true; } });   // t=31
  sim.seek(40); assert.equal(sim.get().state.up, true);
  // volta para t=15 e age de novo: as ações do usuário depois de t=16 (inclusive o "up" em 31) somem
  sim.seek(15); sim.act({ id: 'up2', apply: s => { s.up = true; } });
  sim.seek(40);
  assert.deepEqual(P(sim.get().log.map(e => e.id)), ['down', 'up2']);
  assert.equal(P(sim.get().state.log).slice(10, 16).join(''), '000001');
  // reproduz exatamente: outra simulação com as mesmas ações dá o mesmo estado
  const b = mk(); b.seek(10); b.act({ id: 'down', apply: s => { s.up = false; } }); b.seek(15); b.act({ id: 'up2', apply: s => { s.up = true; } }); b.seek(40);
  assert.deepEqual(P(b.get().state), P(sim.get().state));
  assert.throws(() => sim.act({ at: 5, apply: () => {} }), /só vale para o futuro/);
});

test('duas ações no mesmo instante se somam', () => {
  const sim = K8SSIM.create({ init: { a: [] }, until: 10 });
  sim.act({ id: 'x', apply: s => { s.a.push('x'); } });
  sim.act({ id: 'y', apply: s => { s.a.push('y'); } });
  sim.seek(1);
  assert.deepEqual(P(sim.get().state.a), ['x', 'y']);
});
