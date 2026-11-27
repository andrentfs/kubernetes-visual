/* Kubernetes Visual — js/sim/nodefail.js (S2, usa o motor do ADR-004)
   Modelo do simulador “quando um node cai”: só estado e regras, sem desenho. Expõe window.K8SSIM_NODEFAIL.

   Regras (mesmas da lição nodefail, padrões da v1.37):
   - Cada kubelet ligado renova o Lease do seu node a cada `lease` segundos (10 s).
   - O controlador de ciclo de vida dos nodes marca o node NotReady quando o Lease fica mais de `grace`
     segundos sem renovação (node-monitor-grace-period, 50 s), põe o taint node.kubernetes.io/unreachable
     (NoExecute) e marca os pods dele como não prontos, o que os tira do EndpointSlice.
   - Enquanto o node não é marcado NotReady, os pods dele continuam no EndpointSlice: requisições para eles falham.
   - Depois de `tol` segundos com o taint (tolerationSeconds padrão, 300 s), os pods são despejados e ficam
     Terminating: sem o kubelet, ninguém confirma a remoção.
   - O ReplicaSet não conta pods Terminating e cria outro na hora. O scheduler põe o pod novo no node Ready
     com menos pods. O kubelet daquele node o deixa pronto depois de `start` segundos (exemplo; depende do app).
   - O StatefulSet não cria outro db-0 enquanto o antigo existir.
   - Quando o node volta, o kubelet renova o Lease, o node fica Ready e confirma a remoção dos pods despejados.
     Nenhum pod muda de node: os que foram recriados continuam onde nasceram. */
(function (root) {
  'use strict';
  var DEFAULTS = { lease: 10, grace: 50, tol: 300, start: 5, until: 900 };
  var NODES = ['node-1', 'node-2', 'node-3'];

  function initial(cfg) {
    var P = function (name, app, node) { return { name: name, app: app, node: node, phase: 'Running', ready: true, term: false, sched: 0 }; };
    return {
      cfg: cfg,
      nodes: NODES.map(function (name) { return { name: name, up: true, beat: 0, ready: true, since: null }; }),
      pods: [P('api-1', 'api', 0), P('api-2', 'api', 1), P('api-3', 'api', 2), P('db-0', 'db', 2)],
      seq: 3, feed: [], hl: {}
    };
  }

  function tick(s, t) {
    var c = s.cfg, feed = function (k, a) { s.feed.push({ t: t, k: k, a: a || {} }); };
    var load = function (i) { return s.pods.filter(function (p) { return p.node === i && !p.term; }).length; };

    // 1) kubelets renovam o Lease
    s.nodes.forEach(function (n) { if (n.up && t - n.beat >= c.lease) n.beat = t; });

    // 2) controlador de ciclo de vida dos nodes
    s.nodes.forEach(function (n, i) {
      if (n.ready && t - n.beat > c.grace) {
        n.ready = false; n.since = t; s.hl.ctrl = t;
        s.pods.forEach(function (p) { if (p.node === i) p.ready = false; });
        feed('notready', { n: n.name, g: c.grace });
      } else if (!n.ready && n.up && t - n.beat <= c.grace) {
        n.ready = true; n.since = null;
        var gone = s.pods.filter(function (p) { return p.node === i && p.term; });
        s.pods = s.pods.filter(function (p) { return !(p.node === i && p.term); });
        s.pods.forEach(function (p) { if (p.node === i && p.phase === 'Running') p.ready = true; });
        feed('ready', { n: n.name });
        gone.forEach(function (p) { feed('gone', { p: p.name, n: n.name }); });
      }
    });

    // 3) despejo depois da tolerância ao taint
    s.nodes.forEach(function (n, i) {
      if (!n.ready && t - n.since >= c.tol) s.pods.forEach(function (p) {
        if (p.node === i && !p.term) {
          p.term = true; p.ready = false; s.hl.ctrl = t;
          feed('evict', { p: p.name, s: c.tol });
          if (p.app === 'db') feed('stuck', { p: p.name });
        }
      });
    });

    // 4) ReplicaSet (3 réplicas, não conta Terminating) e StatefulSet (1 réplica, identidade fixa)
    var active = s.pods.filter(function (p) { return p.app === 'api' && !p.term; }).length;
    for (var k = active; k < 3; k++) {
      var name = 'api-' + (++s.seq);
      s.pods.push({ name: name, app: 'api', node: null, phase: 'Pending', ready: false, term: false, sched: null });
      s.hl.ctrl = t; feed('create', { p: name });
    }
    if (!s.pods.some(function (p) { return p.app === 'db'; })) {
      s.pods.push({ name: 'db-0', app: 'db', node: null, phase: 'Pending', ready: false, term: false, sched: null });
      feed('createSts', { p: 'db-0' });
    }

    // 5) scheduler: node Ready (sem taint) com menos pods; empate → o de menor número
    s.pods.forEach(function (p) {
      if (p.node !== null) return;
      var cand = s.nodes.map(function (_, i) { return i; }).filter(function (i) { return s.nodes[i].ready; });
      if (!cand.length) return;
      cand.sort(function (a, b) { return load(a) - load(b) || a - b; });
      p.node = cand[0]; p.phase = 'ContainerCreating'; p.sched = t; s.hl.sched = t;
      feed('sched', { p: p.name, n: s.nodes[p.node].name });
    });

    // 6) kubelet inicia os containers
    s.pods.forEach(function (p) {
      if (p.phase === 'ContainerCreating' && s.nodes[p.node].up && t - p.sched >= c.start) {
        p.phase = 'Running'; p.ready = s.nodes[p.node].ready;
        feed('running', { p: p.name });
      }
    });
  }

  function create(cfg) {
    var c = {}; Object.keys(DEFAULTS).forEach(function (k) { c[k] = cfg && cfg[k] != null ? +cfg[k] : DEFAULTS[k]; });
    var sim = root.K8SSIM.create({ init: initial(c), tick: tick, dt: 1, until: c.until, every: 10 });
    sim.down = function (i) {
      return sim.act({ id: 'down-' + i, apply: function (s, t) { s.nodes[i].up = false; s.feed.push({ t: t, k: 'down', a: { n: s.nodes[i].name } }); } });
    };
    sim.up = function (i) {
      return sim.act({ id: 'up-' + i, apply: function (s, t) { s.nodes[i].up = true; s.nodes[i].beat = t; s.feed.push({ t: t, k: 'up', a: { n: s.nodes[i].name } }); } });
    };
    sim.cfg = c;
    return sim;
  }

  /** Números para o painel: nodes Ready, endpoints prontos, pods Terminating, endpoints que falham. */
  function stats(s) {
    var api = s.pods.filter(function (p) { return p.app === 'api'; });
    var eps = api.filter(function (p) { return p.ready && !p.term && p.phase === 'Running'; });
    return {
      ready: s.nodes.filter(function (n) { return n.ready; }).length,
      eps: eps.length,
      failing: eps.filter(function (p) { return !s.nodes[p.node].up; }).length,
      term: s.pods.filter(function (p) { return p.term; }).length,
    };
  }

  root.K8SSIM_NODEFAIL = { create: create, stats: stats, DEFAULTS: DEFAULTS, NODES: NODES };
})(typeof window !== 'undefined' ? window : globalThis);
