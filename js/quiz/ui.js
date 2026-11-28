/* Kubernetes Visual — js/quiz/ui.js
   Simulados KCNA e KCSA (#quiz, #quiz/kcna, #quiz/kcsa). Carregado sob demanda pela aba “Simulados”,
   junto com data/quiz/*.js. Desenha dentro de #cert (mesma área das páginas das provas).
   Script clássico: usa $, esc, U_, LANG, CT e setView de content.js/ui.js.

   Formato da prova real (docs.linuxfoundation.org): 60 questões de múltipla escolha, 90 min, 75% para passar.
   Este simulado tem 30 questões (metade), 45 min e a mesma nota de corte, com as questões distribuídas
   pelos pesos oficiais de cada domínio. Ordem das questões e das alternativas muda a cada tentativa. */
(function () {
  const REAL = { n: 60, min: 90, pass: 75, src: 'https://docs.linuxfoundation.org/tc-docs/certification/important-instructions-mc' };
  const PASS = 75, KEY = id => 'k8s-quiz-' + id, BEST = 'k8s-quiz-best';
  let A = null, timer = 0, confirming = false;
  const DB = () => window.K8SQUIZ || {};
  const T = (k, m = {}) => U_(k).replace(/\{(\w+)\}/g, (_, x) => m[x] ?? '');
  const L_ = o => o[LANG] || o.pt;
  const fmt = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const load = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const save = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const C = () => $('#cert');

  /** Nova tentativa: ordem das questões e das alternativas embaralhada; tempo conta a partir de agora. */
  function start(id) {
    const Q = DB()[id];
    A = { id, order: shuffle(Q.q.map((_, i) => i)), opts: Q.q.map(q => shuffle(q.pt.o.map((_, i) => i))), ans: {}, mark: {}, i: 0, t0: Date.now(), end: Date.now() + Q.minutes * 60000, done: false };
    save(KEY(id), A);
  }
  function grade(a) {
    const Q = DB()[a.id], dom = {};
    Q.domains.forEach(d => { dom[d.id] = { c: 0, n: 0 }; });
    let c = 0;
    Q.q.forEach((q, qi) => { dom[q.d].n++; if (a.ans[qi] === q.ok) { c++; dom[q.d].c++; } });
    return { c, n: Q.q.length, p: Math.round(c / Q.q.length * 100), dom };
  }
  function finish() {
    if (!A || A.done) return;
    A.done = true; A.t1 = Math.min(Date.now(), A.end); save(KEY(A.id), A);
    const r = grade(A), best = load(BEST) || {};
    if (!best[A.id] || r.p > best[A.id]) { best[A.id] = r.p; save(BEST, best); }
    clearInterval(timer); confirming = false; render();
  }

  /* ---------- telas ---------- */
  function landing() {
    const best = load(BEST) || {};
    C().innerHTML = `<section class="qz"><header class="qzh"><h1>${esc(U_('qzT'))}</h1><p class="lede">${esc(U_('qzLede'))}</p></header>
<div class="qzcards">${['kcna', 'kcsa'].map(id => { const Q = DB()[id], open = load(KEY(id)); return `<article class="card qzc">
 <h2>${Q.name}</h2><p>${esc(U_(id === 'kcna' ? 'qzKcna' : 'qzKcsa'))}</p>
 <dl><dt>${esc(U_('qzReal'))}</dt><dd>${esc(T('qzFmt', { n: REAL.n, m: REAL.min, p: REAL.pass }))}</dd>
 <dt>${esc(U_('qzOurs'))}</dt><dd>${esc(T('qzFmt', { n: Q.q.length, m: Q.minutes, p: PASS }))}</dd></dl>
 <ul class="qzdom">${Q.domains.map(d => `<li><span>${esc(L_(d))}</span><b>${d.w}%</b></li>`).join('')}</ul>
 ${best[id] != null ? `<p class="qzbest">${esc(T('qzBest', { s: best[id] }))}</p>` : ''}
 <div class="qzact"><button type="button" class="pop go" data-start="${id}">${esc(U_('qzStart'))}</button>${open && !open.done && open.end > Date.now() ? `<a class="lk" href="#quiz/${id}">${esc(U_('qzResume'))}</a>` : ''}</div>
 <p class="note"><a href="${Q.source}" target="_blank" rel="noopener">${esc(U_('qzSrcCur'))}</a> · <a href="${REAL.src}" target="_blank" rel="noopener">${esc(U_('qzSrcFmt'))}</a></p>
</article>`; }).join('')}</div>
<p class="note qznote">${esc(U_('qzNote'))}</p></section>`;
    document.title = `${U_('qzT')} · Kubernetes Visual`;
  }

  function runner() {
    const Q = DB()[A.id], qi = A.order[A.i], q = Q.q[qi], t = L_(q), d = Q.domains.find(x => x.id === q.d);
    const left = (A.end - Date.now()) / 1000, un = Q.q.length - Object.keys(A.ans).length;
    C().innerHTML = `<section class="qz run"><header class="qzbar"><b>${Q.name}</b><span>${esc(T('qzQ', { i: A.i + 1, n: Q.q.length }))}</span>
 <span class="qzt" id="qzt" role="timer" aria-label="${esc(U_('qzTime'))}">◷ ${fmt(left)}</span><button type="button" class="pop" data-a="finish">${esc(U_('qzFinish'))}</button></header>
${confirming ? `<div class="qzconf" role="alertdialog" aria-live="assertive"><p>${esc(T('qzConfirm', { u: un }))}</p><button type="button" class="pop go" data-a="finish-yes">${esc(U_('qzFinish'))}</button><button type="button" class="pop" data-a="finish-no">${esc(U_('qzKeep'))}</button></div>` : ''}
<article class="card qzq"><p class="qzdomt">${esc(L_(d))}</p><h2 id="qzp" tabindex="-1">${esc(t.q)}</h2>
 <div class="qzo" role="radiogroup" aria-labelledby="qzp">${A.opts[qi].map((oi, k) => `<button type="button" role="radio" aria-checked="${A.ans[qi] === oi}" data-o="${oi}"><i>${'ABCD'[k]}</i><span>${esc(t.o[oi])}</span></button>`).join('')}</div>
 <div class="qznav"><button type="button" class="pop" data-a="prev" ${A.i ? '' : 'disabled'}>← ${esc(U_('qzPrev'))}</button>
 <label class="qzmk"><input type="checkbox" data-a="mark" ${A.mark[qi] ? 'checked' : ''}> ${esc(U_('qzMark'))}</label>
 <button type="button" class="pop go" data-a="next">${A.i < Q.q.length - 1 ? esc(U_('qzNext')) + ' →' : esc(U_('qzFinish'))}</button></div></article>
<nav class="qzgrid" aria-label="${esc(U_('qzGrid'))}">${A.order.map((x, k) => `<button type="button" data-g="${k}" class="${A.ans[x] != null ? 'an' : ''} ${A.mark[x] ? 'mk' : ''}" ${k === A.i ? 'aria-current="true"' : ''} aria-label="${k + 1}">${k + 1}</button>`).join('')}</nav>
<p class="note">${esc(U_('qzKeys'))}</p></section>`;
  }

  function result(showReview) {
    const Q = DB()[A.id], r = grade(A), ok = r.p >= PASS;
    C().innerHTML = `<section class="qz res"><header class="qzh"><h1>${Q.name} · ${r.p}%</h1>
 <p class="qzv ${ok ? 'ok' : 'bad'}">${esc(U_(ok ? 'qzPass' : 'qzFail'))}</p>
 <p>${esc(T('qzScore', { c: r.c, n: r.n, p: r.p }))} · ${esc(T('qzUsed', { t: fmt((A.t1 - A.t0) / 1000) }))}</p></header>
<article class="card"><h2>${esc(U_('qzByDom'))}</h2><ul class="qzbars">${Q.domains.map(d => { const x = r.dom[d.id], p = x.n ? Math.round(x.c / x.n * 100) : 0; return `<li><span>${esc(L_(d))} <small>${esc(T('qzDomW', { w: d.w }))}</small></span><b>${x.c}/${x.n}</b><i style="--p:${p}%" class="${p >= PASS ? 'ok' : 'bad'}"></i></li>`; }).join('')}</ul>
 <div class="qzact"><button type="button" class="pop" data-a="review">${esc(U_('qzReview'))}</button><button type="button" class="pop go" data-start="${A.id}">${esc(U_('qzRetry'))}</button><a class="lk" href="#quiz">${esc(U_('qzBack'))}</a></div></article>
${showReview ? `<ol class="qzrev">${A.order.map(qi => { const q = Q.q[qi], t = L_(q), a = A.ans[qi], hit = a === q.ok; return `<li class="${hit ? 'ok' : 'bad'}"><p class="qzdomt">${esc(L_(Q.domains.find(x => x.id === q.d)))}</p><h3>${esc(t.q)}</h3>
 <p><b>${esc(U_('qzYour'))}:</b> ${a == null ? `<em>${esc(U_('qzBlank'))}</em>` : esc(t.o[a])} ${hit ? '✓' : '✗'}</p>${hit ? '' : `<p><b>${esc(U_('qzRight'))}:</b> ${esc(t.o[q.ok])}</p>`}
 <p class="qzexp">${esc(t.e)}</p>${q.ref ? `<p><a href="${q.ref}" target="_blank" rel="noopener">${esc(U_('qzDoc'))} ↗</a></p>` : ''}</li>`; }).join('')}</ol>` : ''}</section>`;
  }

  function render(review) {
    if (!A) return landing();
    if (A.done) return result(review);
    if (Date.now() >= A.end) return finish();
    runner();
  }
  function tick() {
    if (!A || A.done) return clearInterval(timer);
    const left = (A.end - Date.now()) / 1000, el = $('#qzt');
    if (left <= 0) { finish(); return; }
    if (el) { el.textContent = '◷ ' + fmt(left); el.classList.toggle('low', left < 300); }
  }

  const QUIZ = {
    active: false,
    open(sub) {
      QUIZ.active = true; clearInterval(timer); confirming = false;
      if (!sub || !DB()[sub]) { A = null; landing(); return; }
      const saved = load(KEY(sub));
      A = saved && saved.order && saved.order.length === DB()[sub].q.length ? saved : null;
      if (!A) start(sub);
      document.title = `${DB()[sub].name} · ${U_('qzT')} · Kubernetes Visual`;
      render(); if (!A.done) timer = setInterval(tick, 1000);
    },
    close() { QUIZ.active = false; clearInterval(timer); confirming = false; },
    key(e) {
      if (!QUIZ.active || !A || A.done || e.target.closest('input,textarea,select')) return false;
      const Q = DB()[A.id], qi = A.order[A.i], k = e.key.toLowerCase(), n = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k);
      if (n >= 0 && n < A.opts[qi].length) { A.ans[qi] = A.opts[qi][n]; save(KEY(A.id), A); runner(); return true; }
      if (e.key === 'ArrowRight' && A.i < Q.q.length - 1) { A.i++; save(KEY(A.id), A); runner(); return true; }
      if (e.key === 'ArrowLeft' && A.i > 0) { A.i--; save(KEY(A.id), A); runner(); return true; }
      return false;
    },
  };

  C().addEventListener('click', e => {
    if (!QUIZ.active) return;
    const b = e.target.closest('button,[data-a]'); if (!b) return;
    if (b.dataset.start) { start(b.dataset.start); location.hash === '#quiz/' + b.dataset.start ? QUIZ.open(b.dataset.start) : (location.hash = 'quiz/' + b.dataset.start); return; }
    if (!A) return;
    const Q = DB()[A.id], qi = A.order[A.i], a = b.dataset.a;
    if (b.dataset.o != null) { A.ans[qi] = +b.dataset.o; }
    else if (b.dataset.g != null) { A.i = +b.dataset.g; }
    else if (a === 'prev' && A.i > 0) A.i--;
    else if (a === 'next') { if (A.i < Q.q.length - 1) A.i++; else confirming = true; }
    else if (a === 'finish') { const un = Q.q.length - Object.keys(A.ans).length; if (un) confirming = true; else return finish(); }
    else if (a === 'finish-yes') return finish();
    else if (a === 'finish-no') confirming = false;
    else if (a === 'review') return result(true);
    else if (a === 'mark') return;
    else return;
    save(KEY(A.id), A); runner();
    if (b.dataset.g != null || a === 'prev' || a === 'next') $('#qzp')?.focus?.();
  });
  C().addEventListener('change', e => {
    if (!QUIZ.active || !A || e.target.dataset.a !== 'mark') return;
    const qi = A.order[A.i]; A.mark[qi] = e.target.checked; save(KEY(A.id), A); runner();
  });

  window.QUIZ = QUIZ;
})();
