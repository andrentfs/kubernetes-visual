/* Kubernetes Visual — js/sim/engine.js (ADR-004)
   Motor de simulação único: relógio com velocidade, pausa, passo a passo e volta no tempo.
   Sem DOM e sem relógio próprio: quem usa injeta o tempo real (advance(ms)), o que deixa tudo
   determinístico e testável. Script clássico; expõe window.K8SSIM.

   Modelo
   - O tempo da simulação anda em passos inteiros de `dt` segundos (tick).
   - A cada tick: 1) aplica os eventos agendados para aquele instante, na ordem em que foram
     declarados; 2) roda `tick(state, t)`, se houver. As duas funções recebem uma CÓPIA do estado
     e devolvem o novo estado (ou alteram a cópia e não devolvem nada).
   - Pontos de restauração a cada `every` ticks. Voltar no tempo = restaurar o ponto anterior e
     reaplicar os ticks; como tudo é determinístico, o estado é exatamente o mesmo da primeira vez.

   Uso
     const sim = K8SSIM.create({ init, events:[{at:50, id:'notready', apply:s=>{…}}], tick:(s,t)=>{…}, dt:1, until:400 });
     sim.play(); sim.advance(16);   // chamado pelo requestAnimationFrame com o tempo real decorrido
     sim.pause(); sim.stepBack(); sim.seek(120); sim.setSpeed(10); sim.restart();
     sim.on(snapshot => desenhar(snapshot));   // { t, state, speed, playing, log, done }
*/
(function (root) {
  'use strict';
  var MIN_SPEED = 0.5, MAX_SPEED = 10;

  function clone(v) {
    if (typeof structuredClone === 'function') return structuredClone(v);
    return JSON.parse(JSON.stringify(v));
  }
  function freeze(v) {
    if (v && typeof v === 'object' && !Object.isFrozen(v)) {
      Object.freeze(v);
      Object.keys(v).forEach(function (k) { freeze(v[k]); });
    }
    return v;
  }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }

  function create(def) {
    if (!def || def.init === undefined) throw new Error('K8SSIM.create: init é obrigatório');
    var dt = def.dt || 1, until = def.until == null ? Infinity : def.until, every = def.every || 10;
    var tickFn = def.tick || null;
    var events = (def.events || []).map(function (e, i) {
      if (typeof e.at !== 'number' || e.at < 0) throw new Error('K8SSIM: evento sem "at" válido (' + (e.id || i) + ')');
      return { at: e.at, id: e.id || ('e' + i), apply: e.apply, order: i };
    }).sort(function (a, b) { return a.at - b.at || a.order - b.order; });

    var init = clone(def.init);
    var n = 0, state = clone(init), log = [], checkpoints = { 0: { state: clone(init), log: [] } };
    var speed = 1, playing = false, acc = 0, listeners = [];

    function maxTicks() { return until === Infinity ? Infinity : Math.floor(until / dt + 1e-9); }
    // Eventos com at=0 são aplicados no primeiro tick (t=dt); o estado em t=0 é sempre `init`.
    function eventsFor(k) {
      var t0 = (k - 1) * dt, t1 = k * dt;
      return events.filter(function (e) { return (k === 1 ? e.at >= 0 : e.at > t0 + 1e-9) && e.at <= t1 + 1e-9; });
    }
    function applyTick() {
      var k = n + 1, t = k * dt, s = clone(state), fired = eventsFor(k), entries = [];
      fired.forEach(function (e) { var r = e.apply ? e.apply(s, t) : undefined; if (r !== undefined) s = r; entries.push({ t: t, id: e.id }); });
      if (tickFn) { var r2 = tickFn(s, t); if (r2 !== undefined) s = r2; }
      state = s; n = k; log = log.concat(entries);
      if (n % every === 0) checkpoints[n] = { state: clone(state), log: log.slice() };
    }
    function goTo(k) {
      k = clamp(Math.round(k), 0, maxTicks());
      if (k === n) return;
      if (k < n) {
        var c = Math.floor(k / every) * every;
        while (!checkpoints[c]) c -= every;
        state = clone(checkpoints[c].state); log = checkpoints[c].log.slice(); n = c;
      }
      while (n < k) applyTick();
    }
    function snapshot() {
      return freeze({ t: +(n * dt).toFixed(6), tick: n, state: clone(state), speed: speed, playing: playing, log: log.slice(), done: n >= maxTicks() });
    }
    function emit() { var s = snapshot(); listeners.slice().forEach(function (f) { f(s); }); return s; }

    var api = {
      /** Avança o relógio pelo tempo real decorrido (ms). Só anda se estiver tocando. */
      advance: function (ms) {
        if (!playing || !(ms > 0)) return snapshot();
        acc += (ms / 1000) * speed;
        var steps = Math.floor(acc / dt + 1e-9);
        if (steps > 0) { acc -= steps * dt; goTo(n + steps); }
        if (n >= maxTicks()) { playing = false; acc = 0; }
        return emit();
      },
      play: function () { if (n < maxTicks()) playing = true; return emit(); },
      pause: function () { playing = false; acc = 0; return emit(); },
      toggle: function () { return playing ? api.pause() : api.play(); },
      setSpeed: function (x) { speed = clamp(+x || 1, MIN_SPEED, MAX_SPEED); return emit(); },
      stepForward: function () { playing = false; acc = 0; goTo(n + 1); return emit(); },
      stepBack: function () { playing = false; acc = 0; goTo(n - 1); return emit(); },
      /** Vai para o instante t (segundos da simulação), para frente ou para trás. */
      seek: function (t) { acc = 0; goTo(t / dt); if (n >= maxTicks()) playing = false; return emit(); },
      restart: function () { playing = false; acc = 0; goTo(0); return emit(); },
      on: function (fn) { listeners.push(fn); return function off() { listeners = listeners.filter(function (f) { return f !== fn; }); }; },
      get: snapshot,
      /** Próximo evento depois do instante atual (para “pular até o próximo acontecimento”). */
      nextEventAt: function () { var t = n * dt; var e = events.find(function (x) { return x.at > t + 1e-9 && x.at <= until; }); return e ? e.at : null; },
      events: function () { return events.map(function (e) { return { at: e.at, id: e.id }; }); },
    };
    return api;
  }

  root.K8SSIM = { create: create, MIN_SPEED: MIN_SPEED, MAX_SPEED: MAX_SPEED };
})(typeof window !== 'undefined' ? window : globalThis);
