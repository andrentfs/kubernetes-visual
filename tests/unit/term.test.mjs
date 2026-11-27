// Testes unitários do terminal simulado (term.js), sem navegador.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSite } from '../tools/load.mjs';

const { K8STERM } = loadSite(['js/term/lessons.js', 'js/term/files.js', 'js/term/engine.js']);

// Cena mínima: 3 nodes e pods apoiados neles (host = id do slab).
const slab = (id, lb, st) => ({ t: 'slab', id, lb, st });
const pod = (id, lb, host, b, st) => ({ t: 'block', pod: 1, id, lb, host, b, st });
const hostOf = (e, slabs) => slabs.find(s => s.id === e.host);
const nodes = [slab('n0', 'node-1'), slab('n1', 'node-2'), slab('n2', 'node-3')];

function load(entities, { lesson = 'pods', step = 6, lang = 'pt' } = {}) {
  return K8STERM._load({ lesson, step, lang, hostOf, sc: { e: [...nodes, ...entities] } });
}
const run = cmd => K8STERM._exec(cmd);

test('get pods lista pods com nomes de Deployment e status Running', () => {
  load([pod('a0', 'api', 'n0'), pod('a1', 'api', 'n1'), pod('a2', 'api', 'n2')]);
  const out = run('kubectl get pods').txt.split('\n');
  assert.match(out[0], /^NAME\s+READY\s+STATUS\s+RESTARTS\s+AGE$/);
  assert.equal(out.length, 4);
  for (const l of out.slice(1)) assert.match(l, /^api-[a-z0-9]{9}-[a-z0-9]{5}\s+1\/1\s+Running\s+0\s/);
});

test('nomes são determinísticos entre cargas', () => {
  load([pod('a0', 'api', 'n0')]);
  const a = run('kubectl get pods -o name').txt;
  load([pod('a0', 'api', 'n0')]);
  assert.equal(run('kubectl get pods -o name').txt, a);
});

test('alias k, nome curto po e -o wide mostram o node', () => {
  load([pod('a0', 'api', 'n1')]);
  const t = run('k get po -o wide').txt;
  assert.match(t, /NODE/);
  assert.match(t, /node-2/);
});

test('flags antes do verbo (kubectl -n kube-system get pods)', () => {
  load([]);
  assert.match(run('kubectl -n kube-system get pods').txt, /coredns-/);
});

test('CrashLoopBackOff vem do diagrama e aparece no describe', () => {
  load([pod('a0', 'api', 'n0', ['CrashLoopBackOff', 'bad'], 'dead')]);
  const name = run('kubectl get pods -o name').txt.replace('pod/', '');
  assert.match(run('kubectl get pods').txt, /CrashLoopBackOff/);
  assert.match(run(`kubectl describe pod ${name}`).txt, /Back-off restarting failed container/);
});

test('pipes: grep -v e head', () => {
  load([pod('a0', 'api', 'n0'), pod('b0', 'db', 'n1', ['ImagePullBackOff', 'bad'], 'pend')]);
  const t = run('kubectl get pods | grep -v Running').txt;
  assert.match(t, /ImagePullBackOff/);
  assert.doesNotMatch(t, /\bRunning\b/);
  assert.equal(run('kubectl get pods | head -1').txt.split('\n').length, 1);
});

test('recurso inexistente devolve NotFound', () => {
  load([]);
  const r = run('kubectl get pod nao-existe');
  assert.equal(r.err, 1);
  assert.match(r.txt, /Error from server \(NotFound\): pods "nao-existe" not found/);
});

test('comando desconhecido avisa que é simulado', () => {
  load([]);
  const r = run('foo');
  assert.match(r.txt, /bash: foo: command not found/);
  assert.match(r.txt, /simulado/);
});

test('Secret: jsonpath + base64 -d revela o valor', () => {
  load([{ t: 'block', id: 'se', lb: 'Secret' }], { lesson: 'config', step: 4 });
  assert.equal(run("kubectl get secret db-cred -o jsonpath='{.data.password}' | base64 -d").txt, 's3nh4');
});

test('cat de arquivo é somente leitura (PT e EN)', () => {
  load([], { lang: 'pt' });
  const pt = run('cat deployment.yaml');
  assert.match(pt.txt, /kind: Deployment/);
  assert.match(pt.note, /Somente leitura/);
  load([], { lang: 'en' });
  assert.match(run('cat deployment.yaml').note, /Read-only/);
  assert.match(run('vim deployment.yaml').note, /read-only/);
});

test('dry-run gera YAML de Deployment', () => {
  load([]);
  const t = run('kubectl create deployment web --image=nginx --replicas=2 --dry-run=client -o yaml').txt;
  assert.match(t, /kind: Deployment/);
  assert.match(t, /replicas: 2/);
});
