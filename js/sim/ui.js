/* Kubernetes Visual — js/sim/ui.js (S2)
   Tela do simulador “quando um node cai” (#sim/nodefail). Usa o motor (js/sim/engine.js),
   o modelo (js/sim/nodefail.js) e o mesmo renderizador das lições (paint).
   Carregado sob demanda por ui.js na primeira vez que alguém abre o simulador.
   Script clássico: usa as funções globais de geometry.js, content.js, renderer.js e ui.js. */
(function () {
  const NF = window.K8SSIM_NODEFAIL;
  const SPEEDS = [0.5, 1, 2, 5, 10];
  const SLOTS = [1, 4, 2, 5, 0, 3];
  let sim = null, off = null, raf = 0, last = 0, lastT = -1, cfg = null;

  const fmt = t => { t = Math.round(t); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
  const msg = e => U_('simF_' + e.k).replace(/\{(\w)\}/g, (_, k) => e.a[k] ?? '');

  function scene(s, t) {
    const st = NF.stats(s), recent = k => s.hl[k] != null && t - s.hl[k] < 4;
    const e = [...cp(['api', ...(recent('ctrl') ? ['ctrl'] : []), ...(recent('sched') ? ['sched'] : [])], at(22, -20))];
    const f = [];
    s.nodes.forEach((n, i) => {
      e.push(node(i, { lb: n.name + (n.ready ? '' : ' · NotReady'), st: n.up ? '' : 'down' }));
      if (n.up) f.push(['n' + i, 'api', 1, 'hc']);
    });
    s.nodes.forEach((n, i) => {
      s.pods.filter(p => p.node === i).forEach((p, k) => {
        const failing = p.ready && !p.term && !n.up;
        const stc = p.term ? 'dead' : p.phase !== 'Running' ? 'pend' : (p.ready && p.sched && t - p.sched < s.cfg.start + 8) ? 'new' : 'ok';
        const b = p.term ? ['Terminating', 'bad'] : p.phase !== 'Running' ? [p.phase] : !p.ready ? ['Ready: False', 'bad'] : failing ? ['timeout', 'bad'] : null;
        e.push(pod('p_' + p.name, i, SLOTS[k % 6], stc, p.name, { ic: p.app === 'db' ? 'db' : 'pod', b }));
        if (p.app === 'api' && p.ready && !p.term && p.phase === 'Running') f.push(['sv', 'p_' + p.name, 1, failing ? 'bad' : undefined]);
      });
    });
    const pend = s.pods.filter(p => p.node === null);
    if (pend.length) e.push(blk('pq', ...at(-6, -14), 'blue', 'Pending', { s: 1.9, h: 28, ic: 'pod', b: [pend.map(p => p.name).join(', '), 'bad'] }));
    e.push(SV(`EndpointSlice: ${st.eps}`, ...at(4, -9)), users(6, ...at(-10, -8)));
    f.push(['u', 'sv', 2, st.failing ? 'bad' : undefined]);
    return { e, f };
  }

  function render(snap) {
    const s = snap.state, t = snap.t, st = NF.stats(s);
    $('#mets').innerHTML = [[U_('simClock'), fmt(t)], [U_('simNodes'), `${st.ready}/3`, st.ready < 3 ? 'bad' : ''], [U_('simEps'), `${st.eps}/3` + (st.failing ? ` · ${st.failing} ✗` : ''), st.failing || st.eps < 3 ? 'bad' : 'ok'], [U_('simTerm'), String(st.term), st.term ? 'bad' : '']]
      .map(([lb, v, c]) => `<div class="met ${c || ''}"><small>${esc(lb)}</small><b>${esc(v)}</b></div>`).join('');
    $('#trkn').textContent = `${fmt(t)} / ${fmt(sim.cfg.until)}`;
    const r = $('#simr'); if (r && document.activeElement !== r) r.value = t;
    $('#simclk').textContent = U_('simReal').replace('{t}', fmt(t)).replace('{r}', fmt(t / snap.speed)).replace('{x}', String(snap.speed).replace('.', LANG === 'pt' ? ',' : '.'));
    $('#simplay').innerHTML = snap.playing ? '⏸' : '▶'; $('#simplay').setAttribute('aria-label', U_(snap.playing ? 'pause' : 'simPlay'));
    s.nodes.forEach((n, i) => { const b = $(`#simn button[data-n="${i}"]`); b.textContent = U_(n.up ? 'simDown' : 'simUp').replace('{n}', n.name); b.classList.toggle('on', !n.up); });
    const feed = s.feed.slice(-8).reverse();
    $('#simf').innerHTML = feed.length ? feed.map(e => `<li><b>${fmt(e.t)}</b> ${esc(msg(e))}</li>`).join('') : `<li class="empty">${esc(U_('simEmpty'))}</li>`;
    $('#cap').innerHTML = feed.length ? `<small>${fmt(feed[0].t)}</small>${esc(msg(feed[0]))}` : esc(U_('simEmpty'));
    if (t !== lastT) { paint(scene(s, t), lastT < 0); lastT = t; }
  }

  function loop(ts) { if (!sim) return; if (last) sim.advance(Math.min(250, ts - last)); last = ts; raf = requestAnimationFrame(loop); }

  function build() {
    if (off) off();
    sim = NF.create(cfg || undefined); sim.setSpeed(10); lastT = -1;
    off = sim.on(render);
    $('#dots').innerHTML = `<input type="range" id="simr" min="0" max="${sim.cfg.until}" step="1" value="0" aria-label="${esc(U_('simClock'))}">`;
    const c = sim.cfg;
    $('#step').innerHTML = `<div class="sh"><span>${esc(U_('simTag'))}</span><span class="kind conceito">${esc(TX().kinds.conceito)}</span></div>
<h2>${esc(U_('simT'))}</h2><p>${esc(U_('simIntro'))}</p>
<div class="simc" role="group" aria-label="${esc(U_('simT'))}">
 <button type="button" class="ib" data-a="restart" aria-label="${esc(U_('simRestart'))}" title="${esc(U_('simRestart'))}">⏮</button>
 <button type="button" class="ib" data-a="back" aria-label="${esc(U_('simBack1'))}" title="${esc(U_('simBack1'))}">◀</button>
 <button type="button" class="ib" id="simplay" data-a="play">▶</button>
 <button type="button" class="ib" data-a="fwd" aria-label="${esc(U_('simFwd1'))}" title="${esc(U_('simFwd1'))}">▶|</button>
 <button type="button" class="ib" data-a="next" aria-label="${esc(U_('simNext'))}" title="${esc(U_('simNext'))}">⏭</button>
 <label>${esc(U_('simSpeed'))} <select id="simsp">${SPEEDS.map(x => `<option value="${x}"${x === 10 ? ' selected' : ''}>${String(x).replace('.', LANG === 'pt' ? ',' : '.')}×</option>`).join('')}</select></label>
</div>
<p class="simclk" id="simclk" aria-live="off"></p>
<div class="simn" id="simn">${NF.NODES.map((n, i) => `<button type="button" class="pop" data-n="${i}"></button>`).join('')}</div>
<details class="simcfg"><summary>${esc(U_('simCfg'))}</summary>
 <label>node-monitor-grace-period (s) <input type="number" min="10" max="600" step="5" data-k="grace" value="${c.grace}"></label>
 <label>tolerationSeconds (s) <input type="number" min="0" max="900" step="10" data-k="tol" value="${c.tol}"></label>
 <label>${esc(U_('simStart'))} (s) <input type="number" min="1" max="120" step="1" data-k="start" value="${c.start}"></label>
 <p class="note">${esc(U_('simCfgNote'))}</p></details>
<h3>${esc(U_('simFeed'))}</h3><ol class="simf" id="simf" aria-live="polite"></ol>
<p><a href="#nodefail-1">← ${esc(U_('simBackLesson'))}</a></p>`;
    render(sim.get());
  }

  function act(a) {
    if (!sim) return;
    if (a === 'play') sim.toggle();
    else if (a === 'back') sim.stepBack();
    else if (a === 'fwd') sim.stepForward();
    else if (a === 'restart') sim.restart();
    else if (a === 'next') { const n = sim.nextEventAt(); const s = sim.get().state, t = sim.get().t, c = s.cfg; const cands = [n];
      s.nodes.forEach(nd => { if (nd.ready && !nd.up) cands.push(nd.beat + c.grace + 1); if (!nd.ready && nd.since != null) cands.push(nd.since + c.tol); });
      s.pods.forEach(p => { if (p.phase === 'ContainerCreating') cands.push(p.sched + c.start); });
      const nx = cands.filter(x => x != null && x > t).sort((x, y) => x - y)[0]; if (nx != null) sim.seek(nx); }
  }

  const SIMUI = {
    active: false,
    open(id) {
      if (id !== 'nodefail') { location.hash = 'nodefail-1'; return; }
      SIMUI.active = true; document.body.classList.add('simmode');
      const les = L.find(l => l.id === 'nodefail');
      $('#crumb').innerHTML = `0${les.mod + 1}. ${esc(TX().mods[les.mod])} <span style="margin:0 6px">/</span> <b>${esc(les.title)}</b>`;
      $('#title').textContent = U_('simT'); $('#lede').textContent = U_('simLede');
      $('#chips').innerHTML = `<span class="chip a">◷ ${esc(U_('simChipTime'))}</span><span class="chip b">▶ ${esc(U_('simTag'))}</span>`;
      $('#learn').innerHTML = U_('simGoals').split('|').map(g => `<li><i></i>${esc(g)}</li>`).join('');
      $('#exam').hidden = true;
      if (window.K8STERM) K8STERM.step({ lesson: 'sim', step: 0, title: '', cmd: null, sc: { e: [] }, lang: LANG, hostOf });
      document.title = `${U_('simT')} · Kubernetes Visual`;
      build(); applyUI(); last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    },
    close() { SIMUI.active = false; document.body.classList.remove('simmode'); cancelAnimationFrame(raf); if (off) off(); sim = null; off = null; },
    key(e) {
      if (!SIMUI.active) return false;
      if (e.key === 'ArrowRight') act('fwd'); else if (e.key === 'ArrowLeft') act('back');
      else if (e.key === ' ' && !e.target.closest('button,select,input')) { e.preventDefault(); act('play'); }
      else return false;
      return true;
    },
    sim: () => sim,
  };

  $('#step').addEventListener('click', e => {
    if (!SIMUI.active) return;
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.a) act(b.dataset.a);
    else if (b.dataset.n != null) { const i = +b.dataset.n; sim.get().state.nodes[i].up ? sim.down(i) : sim.up(i); if (!sim.get().playing) sim.play(); }
  });
  $('#step').addEventListener('change', e => {
    if (!SIMUI.active) return;
    if (e.target.id === 'simsp') sim.setSpeed(+e.target.value);
    else if (e.target.dataset.k) { cfg = Object.assign({}, sim.cfg, { [e.target.dataset.k]: +e.target.value }); build(); }
  });
  $('#dots').addEventListener('input', e => { if (SIMUI.active && e.target.id === 'simr') { sim.pause(); sim.seek(+e.target.value); } });

  window.SIMUI = SIMUI;
})();
