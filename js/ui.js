/* Kubernetes Visual — js/ui.js
   Interface: navegação, passos, busca, progresso, CKA/CKAD, tema, idioma, terminal e inicialização.
   Script clássico (não módulo): as declarações de topo são compartilhadas entre os arquivos js/*.js,
   que precisam ser carregados nesta ordem: geometry → content → renderer → ui. */
/* ---------- UI ---------- */
/* "Na prova" com abas CKA / CKAD; a escolha fica salva em k8s-exam */
let EXSEL=(()=>{try{return localStorage.getItem('k8s-exam')||'cka'}catch(e){return'cka'}})(),EXLES=null,EXPICK=null;
function renderExam(les){EXLES=les;const E=$('#exam');const ex={cka:les.exam,ckad:les.examD,cks:les.examS};const sel=CERTS_TAB(ex,EXSEL,EXPICK===les.id);E.hidden=!sel;if(E.hidden)return;
 const cur=ex[sel];
 E.innerHTML=`<h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/></svg>${U_('examT')}<span class="exseg" role="group" aria-label="${esc(U_('examT'))}">${['cka','ckad','cks'].map(k=>`<button type="button" data-x="${k}" aria-pressed="${k===sel}">${k.toUpperCase()}</button>`).join('')}</span></h3>`+
 (cur?`<ul>${cur.t.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${cur.c?`<div class="exc">${cur.c.map(c=>`<code>${esc(c)}</code>`).join('')}</div>`:''}`:`<p class="exno">${esc(U_('examNo').replace('{e}',sel.toUpperCase()))}${(o=>o.length?' '+esc(U_('examSee').replace('{o}',o.join(', '))):'')(['cka','ckad','cks'].filter(k=>ex[k]).map(k=>k.toUpperCase()))}</p>`)}
$('#exam').addEventListener('click',e=>{const b=e.target.closest('button[data-x]');if(!b)return;EXSEL=b.dataset.x;try{localStorage.setItem('k8s-exam',EXSEL)}catch(_){}if(EXLES){EXPICK=EXLES.id;renderExam(EXLES)}});

function refLine(){const r=window.K8S_REF;if(!r)return'';const d=new Date(r.checked+'T12:00:00').toLocaleDateString(LANG==='pt'?'pt-BR':'en-US',{day:'numeric',month:'short',year:'numeric'});return`<p class="refv">${esc(U_('refVer').replace('{v}',r.version).replace('{d}',d))} <a href="${r.source}" target="_blank" rel="noopener">${esc(U_('refSrc'))}</a></p>`}
/** Recolhe/mostra o menu lateral em telas largas (≥ 1280 px); a escolha fica salva (k8s-side).
    Fechar: alça com seta na borda direita do menu (#sideH). Abrir: botão ☰ do topo (#menu). */
const WIDE=()=>matchMedia('(min-width:1280px)').matches;
function sideLabels(){const col=document.body.classList.contains('sidecol'),h=$('#sideH'),m=$('#menu'),o=$('#railOpen');if(o)o.setAttribute('aria-expanded',String(!col));if(h){h.setAttribute('aria-expanded',String(!col));h.setAttribute('aria-label',U_('sideHide'));h.title=U_('sideHide')+' ( [ )'}if(m&&WIDE()){m.setAttribute('aria-expanded',String(!col));m.setAttribute('aria-label',U_('sideShow'));m.title=U_('sideShow')+' ( [ )'}}
function toggleSide(){closeFly();const col=document.body.classList.toggle('sidecol');try{localStorage.setItem('k8s-side',col?'0':'1')}catch(e){}sideLabels();(col?$('#railOpen'):$('#sideH'))?.focus({preventScroll:true})}
const side=$('#side');
$('#sideH').addEventListener('click',toggleSide);
$('#rail').addEventListener('click',e=>{const b=e.target.closest('.rb');if(!b)return;if(b.id==='railOpen'){toggleSide();return}const mi=+b.dataset.m;FLY===mi?closeFly(true):openFly(mi)});
$('#fly').addEventListener('click',e=>{const b=e.target.closest('.les');if(b){closeFly();go(+b.dataset.i,0);return}const a=e.target.closest('[data-full]');if(a){const mi=+a.dataset.full;openMods.add(mi);toggleSide();buildSide()}});
$('#fly').addEventListener('keydown',e=>{if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;e.preventDefault();e.stopPropagation();const it=[...$('#fly').querySelectorAll('.les')],k=it.indexOf(document.activeElement);it[(k+(e.key==='ArrowDown'?1:-1)+it.length)%it.length].focus()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&FLY>=0){e.stopPropagation();closeFly(true)}},true);
document.addEventListener('pointerdown',e=>{if(FLY>=0&&!e.target.closest('#fly,#rail'))closeFly()});
addEventListener('resize',()=>{if(FLY>=0)closeFly()});
let DONE=new Set();try{DONE=new Set(JSON.parse(localStorage.getItem('k8s-done')||'[]'))}catch(e){}
const openMods=new Set();
const FOLD=c=>`<svg class="fold" viewBox="0 0 20 16"><path d="M1.5 3.2c0-.9.7-1.7 1.7-1.7h4.4l1.8 2h7.4c.9 0 1.7.7 1.7 1.7v8c0 .9-.8 1.7-1.7 1.7H3.2c-1 0-1.7-.8-1.7-1.7Z" fill="${c}" stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
const DOC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 2h8l4 4v16H6Z"/><path d="M14 2v4h4"/></svg>',DOCK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>';
const buildSide=()=>{const li0=cur?cur[0]:-1,mods=TX().mods,cnt=mi=>{const ls=L.filter(l=>l.mod===mi);return[ls.filter(l=>DONE.has(l.id)).length,ls.length]};
 if(cur)openMods.add(L[cur[0]].mod);
 side.innerHTML=`<div class="th">${FOLD('var(--ink)')}${U_('course')}<span>${L.length} ${U_('lessons')}</span></div>`+mods.map((m,mi)=>{const[d,t]=cnt(mi);return`<details data-m="${mi}" ${openMods.has(mi)?'open':''}><summary><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>${FOLD(FOLDC[mi%6])}0${mi+1}. ${esc(m)}<span>${d}/${t}</span></summary><div class="lsl">${L.map((l,li)=>l.mod===mi?`<button class="les ${li===li0?'on':''} ${DONE.has(l.id)?'done':''}" type="button" data-i="${li}" ${li===li0?'aria-current="page"':''}>${DONE.has(l.id)?DOCK:DOC}<span>${esc(l.title)}</span></button>`:'').join('')}</div></details>`}).join('')+
 `<div class="card progc"><div class="ph">${U_('progress')}<span>${DONE.size} / ${L.length}</span></div><div class="pbar"><i style="width:${DONE.size/L.length*100}%"></i></div><ul>${mods.map((m,mi)=>{const[d,t]=cnt(mi);return`<li><b style="--p:${d/t*100}%"></b><em class="pl">${esc(m)}</em><span>${d}/${t}</span></li>`}).join('')}</ul></div>`+refLine()+`<div class="sidecred">${document.querySelector('.bar .credit').outerHTML}</div>`;
 side.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>{const m=+d.dataset.m;d.open?openMods.add(m):openMods.delete(m)}));buildRail(mods,cnt,li0)};
/* ---------- Menu recolhido: coluna de ícones + submenu por módulo ---------- */
const FOLDC=['#7fb0ea','#8cc97a','#f0a868','#e58a7f','#ab95e2','#e3c25a'];
let FLY=-1;
function buildRail(mods,cnt,li0){
 const r=$('#rail');if(!r)return;const curMod=li0>=0?L[li0].mod:-1,R=2*Math.PI*15,pd=DONE.size/L.length;
 r.setAttribute('aria-label',U_('sideShow'));
 r.innerHTML=`<button type="button" class="rb top" id="railOpen" data-tip="${esc(U_('sideShow'))} ( [ )" aria-label="${esc(U_('sideShow'))}" aria-controls="side" aria-expanded="false"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 7 5 5-5 5M13 7l5 5-5 5"/></svg></button><hr>`+
  mods.map((m,mi)=>{const[d,t]=cnt(mi),tip=`0${mi+1}. ${m} · ${d}/${t}`;return`<button type="button" class="rb${mi===curMod?' cur':''}${mi===FLY?' open':''}" data-m="${mi}" data-tip="${esc(tip)}" aria-label="${esc(tip)}" aria-haspopup="true" aria-expanded="${mi===FLY}">${FOLD(FOLDC[mi%6])}<small>0${mi+1}</small>${d===t?'<i class="ok" aria-hidden="true">✓</i>':d?`<i aria-hidden="true">${d}/${t}</i>`:''}</button>`}).join('')+
  `<hr><div class="ring" data-tip="${esc(U_('railProg').replace('{d}',DONE.size).replace('{t}',L.length))}" tabindex="0" role="img" aria-label="${esc(U_('railProg').replace('{d}',DONE.size).replace('{t}',L.length))}"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--line)" stroke-width="4"/><circle cx="18" cy="18" r="15" fill="none" stroke="var(--green3)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(pd*R).toFixed(1)} ${R.toFixed(1)}" transform="rotate(-90 18 18)"/></svg><b>${DONE.size}/${L.length}</b></div>`;
 if(FLY>=0)openFly(FLY,false);
 sideLabels();
}
function openFly(mi,focus=true){
 const f=$('#fly'),b=$(`#rail .rb[data-m="${mi}"]`);if(!f||!b)return;FLY=mi;
 const li0=cur?cur[0]:-1,ls=L.map((l,li)=>[l,li]).filter(([l])=>l.mod===mi),d=ls.filter(([l])=>DONE.has(l.id)).length;
 f.innerHTML=`<div class="fh">${FOLD(FOLDC[mi%6])}<b>0${mi+1}. ${esc(TX().mods[mi])}</b><span>${d}/${ls.length}</span></div><div class="fl" role="menu">`+
  ls.map(([l,li])=>`<button type="button" role="menuitem" class="les ${li===li0?'on':''} ${DONE.has(l.id)?'done':''}" data-i="${li}" ${li===li0?'aria-current="page"':''}>${DONE.has(l.id)?DOCK:DOC}<span>${esc(l.title)}</span></button>`).join('')+
  `</div><div class="ff"><span>${esc(U_('flyEsc'))}</span><button type="button" class="lk" data-full="${mi}">${esc(U_('flyAll'))}</button></div>`;
 f.hidden=false;
 document.querySelectorAll('#rail .rb[data-m]').forEach(x=>{const on=+x.dataset.m===mi;x.classList.toggle('open',on);x.setAttribute('aria-expanded',String(on))});
 const r=b.getBoundingClientRect(),h=f.offsetHeight;f.style.left=`${Math.round(r.right+12)}px`;f.style.top=`${Math.round(Math.max(72,Math.min(r.top-10,innerHeight-h-12)))}px`;
 f.style.setProperty('--ay',`${Math.round(r.top+r.height/2-parseFloat(f.style.top))}px`);
 if(focus)(f.querySelector('.les.on')||f.querySelector('.les')).focus({preventScroll:true});
}
function closeFly(back){const f=$('#fly');if(!f||f.hidden)return;f.hidden=true;const mi=FLY;FLY=-1;document.querySelectorAll('#rail .rb[data-m]').forEach(x=>{x.classList.remove('open');x.setAttribute('aria-expanded','false')});if(back)$(`#rail .rb[data-m="${mi}"]`)?.focus({preventScroll:true})}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const SV_SPARK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>';
const SV_GOOD='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>';
const SV_WARN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>';
const MI={u:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-4 3-6 6.5-6s6.5 2 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2 .5 3.5 2.5 3.5 6"/>',r:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',c:'<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"/>',e:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',s:'<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/>',p:'<path d="M12 2 21 7v10l-9 5-9-5V7Z"/><path d="M3 7l9 5 9-5M12 12v10"/>',t:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',v:'<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',o:'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>'};
const micon=l=>{l=l.toLowerCase();const k=l.includes('usu')?'u':l.includes('req')?'r':l.includes('cpu')?'c':l.includes('erro')||l.includes('fora')?'e':l.includes('node')||l.includes('servid')?'s':l.includes('pod')||l.includes('contain')||l.includes('endpoint')||l.includes('pront')||l.includes('desej')?'p':l.includes('vers')||l.includes('ip')?'v':l.includes('disp')?'t':'o';return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${MI[k]}</svg>`};
function parse(){const m=/^#([a-z]+)-(\d+)$/.exec(location.hash);let li=0,si=0;if(m){const k=L.findIndex(l=>l.id===m[1]);if(k>=0){li=k;si=Math.min(Math.max(+m[2]-1,0),L[k].steps.length-1)}}return[li,si]}
let PEND=null; // posição pedida por go() antes do hashchange chegar (teclas rápidas)
const go=(li,si)=>{PEND=[li,si];location.hash=window._lastLesson=`${L[li].id}-${si+1}`};
const CT=()=>window.CERTTXT[LANG];let VIEW='learn';
let CHK=new Set();try{CHK=new Set(JSON.parse(localStorage.getItem('k8s-chk')||'[]'))}catch(e){}
const lidx=id=>L.findIndex(l=>l.id===id);
function certView(k){const C=window.CERTS[k],T=CT(),X=T[k],cols=['#cfe1f6','#fcd4ad','#d1e9c2','#e2d6f4','#fde3a7','#f6c9cf'];
 const all=C.weights.flatMap(([d])=>C.comp[d].map(c=>k+':'+d+':'+c[0])),done=all.filter(x=>CHK.has(x)).length;
 const cov=C.weights.reduce((a,[d,w])=>{const cs=C.comp[d];return a+w*cs.reduce((s,c)=>s+(c[2]==='full'?1:c[2]==='partial'?.5:0),0)/cs.length},0);
 const plans=[...C.weights].sort((p,q)=>q[1]-p[1]).map(([d,w])=>X.dom[d]+' · '+w+'%');
 const R2=(v,c)=>{const r=44,L2=2*Math.PI*r;return`<svg viewBox="0 0 104 104"><circle cx="52" cy="52" r="${r}" fill="none" stroke="var(--line)" stroke-width="12"/><circle cx="52" cy="52" r="${r}" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(L2*v/100).toFixed(1)} ${L2.toFixed(1)}" transform="rotate(-90 52 52)"/><text x="52" y="58" text-anchor="middle" style="font:800 18px 'JetBrains Mono',monospace;fill:var(--ink)">${Math.round(v)}%</text></svg>`};
 return `<section class="card chero"><div><div class="crumb">${esc(T.tabs[k])}</div><h1>${esc(X.t)}</h1><p>${esc(X.lede)}</p></div>
 <div class="ring2">${R2(cov,'var(--green3)')}<div><b>${esc(T.ui.coverage)}</b><small>${done}/${all.length} ${esc(T.ui.studied)}</small><div class="pbar" style="margin:8px 0 0"><i style="width:${all.length?done/all.length*100:0}%;background:var(--k8s)"></i></div></div></div></section>
 <div class="cgrid"><section class="card csec"><h2>${esc(T.ui.domains)}</h2><div class="wbar">${C.weights.map(([d,w],i)=>`<div class="wrow"><span>${esc(X.dom[d])}</span><i><b style="width:${w/30*100}%;background:${cols[i]}"></b></i><em>${w}%</em></div>`).join('')}</div>
 ${C.weights.map(([d,w],i)=>`<div class="dom"><h3><i class="sw" style="background:${cols[i]}"></i>${esc(X.dom[d])}<span class="pct">${w}% ${esc(T.ui.weight)}</span></h3><ul class="comp">${C.comp[d].map(([c,ls,st,pl])=>{const id=k+':'+d+':'+c;return`<li><input type="checkbox" data-c="${id}" ${CHK.has(id)?'checked':''} aria-label="${esc(T.ui.mark)}"><div>${esc(X.c[c])}<div class="lk">${ls.map(l=>{const i=lidx(l);return i<0?'':`<button type="button" data-go="${i}">${esc(L[i].title)}</button>`}).join('')}${st!=='full'&&pl?`<span>+ ${esc(T.plan[pl])}</span>`:''}</div></div><span class="tag ${st}">${esc(T.st[st])}</span></li>`}).join('')}</ul></div>`).join('')}</section>
 <aside class="cside" style="display:grid;gap:18px"><section class="card csec"><h2>${esc(T.ui.facts)}</h2><dl class="facts">${X.facts.map(([a,b])=>`<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl></section>
 <section class="card csec"><h2>${esc(T.ui.tips)}</h2><div class="tips">${X.tips.map(([a,b])=>`<div class="tip"><b>${esc(a)}</b><p>${esc(b)}</p></div>`).join('')}</div></section>
 <section class="card csec"><h2>${esc(T.ui.roadmap)}</h2><ul class="rm">${plans.map((p,i)=>`<li><i>${i+1}</i>${esc(p)}</li>`).join('')}</ul></section></aside></div><p class="csrc">${esc(T.ui.src.replace('{f}',(window.CERTS_META||{}).files?.[k]||'').replace('{d}',new Date(((window.CERTS_META||{}).checked||'2026-11-27')+'T12:00:00').toLocaleDateString(LANG==='pt'?'pt-BR':'en-US',{day:'numeric',month:'short',year:'numeric'})))} <a href="${(window.CERTS_META||{}).source}" target="_blank" rel="noopener">github.com/cncf/curriculum</a></p>`}
function setView(v){if(v!=='quiz'&&window.QUIZ)QUIZ.close();VIEW=v;document.body.classList.toggle('vcert',v!=='learn');$('#cert').hidden=v==='learn';if(v==='learn')$('#cert').innerHTML='';document.querySelectorAll('#tabs button').forEach(b=>{b.querySelector('span').textContent=CT().tabs[b.dataset.v];b.setAttribute('aria-current',b.dataset.v===v?'page':'false')});if(v!=='learn'&&v!=='quiz'){$('#cert').innerHTML=certView(v);document.title=CT()[v].t;applyUI()}}
/** Simulados KCNA/KCSA: carregados sob demanda na primeira vez que a aba abre. */
function openQuiz(sub){setView('quiz');window.K8S_load(['data/quiz/kcna.js','data/quiz/kcsa.js','js/quiz/ui.js'],()=>{if(VIEW==='quiz'&&window.QUIZ)QUIZ.open(sub)})}
function openSim(id){setView('learn');window.K8S_load(['js/sim/engine.js','js/sim/nodefail.js','js/sim/ui.js'],()=>window.SIMUI&&SIMUI.open(id))}
function show(){PEND=null;const hv=location.hash.slice(1);if(hv==='quiz'||hv.startsWith('quiz/')){if(window.SIMUI&&SIMUI.active){SIMUI.close();cur=null}openQuiz(hv.slice(5));return}if(hv.startsWith('sim/')){openSim(hv.slice(4));return}if(window.SIMUI&&SIMUI.active){SIMUI.close();cur=null}if(hv==='cka'||hv==='ckad'||hv==='cks'){setView(hv);return}if(VIEW!=='learn')cur=null;setView('learn');$('#svw')._u=0;if(/^[a-z]+-\d+$/.test(hv))window._lastLesson=hv;const[li,si]=parse(),les=L[li],st=les.steps[si],fresh=!cur||cur[0]!==li;cur=[li,si];
 if(si===les.steps.length-1&&!DONE.has(les.id)){DONE.add(les.id);try{localStorage.setItem('k8s-done',JSON.stringify([...DONE]))}catch(e){}}buildSide();
 $('#prog').textContent=`${U_('lesson')} ${li+1} ${U_('of')} ${L.length}`;
 const inMod=L.filter(l=>l.mod===les.mod),pos=inMod.indexOf(les)+1;
 $('#crumb').innerHTML=`0${les.mod+1}. ${TX().mods[les.mod]} <span style="margin:0 6px">/</span> <b>${U_('lesson')} ${pos} ${U_('of')} ${inMod.length}</b>`;
 $('#title').textContent=les.title;$('#lede').textContent=les.lede;
 $('#chips').innerHTML=`<span class="chip a">◷ ${les.min} min</span><span class="chip b">▮ ${les.lvl}</span><span class="chip c">☰ ${les.steps.length} ${U_('steps')}</span>`+(les.sim?`<a class="chip sim" href="#sim/${les.sim}">▶ ${U_('simChip')}</a>`:'');
 $('#mets').innerHTML=les.ml.map((lb,i)=>{let v=st.m[i]||'—',t='';if(v[0]==='!'){t='bad';v=v.slice(1)}else if(v[0]==='+'){t='ok';v=v.slice(1)}return`<div class="met ${t}"><small>${micon(lb)}${esc(lb)}</small><b>${esc(v)}</b></div>`}).join('');
 $('#trkn').textContent=`${U_('step')} ${si+1} ${U_('of')} ${les.steps.length}`;
 const dots=$('#dots');dots.innerHTML=les.steps.map((s,i)=>`<div class="dot ${i===si?'on':i<si?'past':''}"><button type="button" data-s="${i}" aria-label="${U_('step')} ${i+1}: ${esc(s.n)}">${i+1}</button><em>${esc(s.n)}</em></div>`).join('');
 requestAnimationFrame(()=>dots.classList.toggle('tight',dots.clientWidth/les.steps.length<62));
 $('#step').innerHTML=`<div class="sh"><span>${U_('step').toUpperCase()} ${si+1} / ${les.steps.length}</span><span class="kind ${st.k}">${TX().kinds[st.k]}</span></div><h2>${esc(st.h)}</h2>${st.p.map(p=>`<p>${esc(p)}</p>`).join('')}`+
  (st.tbl?`<div class="tbl"><table><thead><tr>${st.tbl.h.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${st.tbl.r.map(r=>`<tr>${r.map((c,ci)=>ci?`<td>${esc(c)}</td>`:`<th>${esc(c)}</th>`).join('')}</tr>`).join('')}</tbody></table>${st.tbl.note?`<p class="note">${esc(st.tbl.note)}</p>`:''}</div>`:'')+
  (st.key?`<div class="call">${SV_SPARK}<div><small>${U_('key')}</small>${esc(st.key)}</div></div>`:'')+
  (st.good?`<div class="call good">${SV_GOOD}<div><small>${U_('good')}</small>${esc(st.good)}</div></div>`:'')+
  (st.warn?`<div class="call warn">${SV_WARN}<div><small>${U_('warn')}</small>${esc(st.warn)}</div></div>`:'')+
  (st.chg?`<div class="chg"><small>${U_('changed')}</small><ul>${st.chg.map(([s,t])=>`<li><i class="${s==='+'?'p':s==='-'?'m':'t'}">${s==='~'?'↝':s}</i>${esc(t)}</li>`).join('')}</ul></div>`:'')+
  (st.cmd?`<div class="cmd"><code>${esc(st.cmd)}</code>${window.K8STERM&&K8STERM.has(les.id)?`<button type="button" id="runT" title="${esc(K8STERM.T().run)}">▶</button>`:''}<button type="button" id="copy">${U_('copy')}</button></div>`:'');
 renderExam(les);requestAnimationFrame(fitDia);
 $('#cap').innerHTML=st.c?`<small><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V4M4 4h12l-2 4 2 4H4"/></svg>${U_('inDiagram')}</small>${esc(st.c)}`:'';$('#learn').innerHTML=les.goals.map(([g,at])=>`<li class="${si+1>=at?'ok':''}"><i>${si+1>=at?'✓':''}</i>${esc(g)}</li>`).join('');
 const last=si===les.steps.length-1,end=last&&li===L.length-1,nl=end?U_('end'):last?`${U_('nextLesson')}: ${L[li+1].title}`:`${U_('next')}: ${les.steps[si+1].n}`;
 ['#prev','#prev2'].forEach(q=>$(q).disabled=li===0&&si===0);['#next','#next2'].forEach(q=>$(q).disabled=end);
 $('#nextL').textContent=nl;$('#nextL2').textContent=nl;
 document.title=`${les.title} · Kubernetes Visual`;applyUI();
 paint(st.s(),fresh);
 if(window.K8STERM){const o=LANG;LANG='en';let se;try{se=st.s()}finally{LANG=o}K8STERM.step({lesson:les.id,step:si,title:st.h,cmd:st.cmd,sc:se,lang:LANG,hostOf})}}
function step(d){const[li,si]=PEND||cur;let a=li,b=si+d;if(b>=L[a].steps.length){if(a<L.length-1){a++;b=0}else return}if(b<0){if(a>0){a--;b=L[a].steps.length-1}else return}go(a,b)}
const drawer=o=>{side.classList.toggle('open',o);$('#scrim').classList.toggle('open',o)};
const replay=()=>{const[li,si]=cur;paint(L[li].steps[si].s(),true)};
const togglePause=()=>{paused=!paused;paused?sv.pauseAnimations():sv.unpauseAnimations();$('#pauseI').setAttribute('d',paused?'M7 4l13 8-13 8z':'M9 5v14M15 5v14');applyUI()};
side.addEventListener('click',e=>{const b=e.target.closest('.les');if(b){go(+b.dataset.i,0);drawer(false)}});
$('#menu').addEventListener('click',()=>{if(WIDE()){toggleSide();return}drawer(!side.classList.contains('open'))});
$('#scrim').addEventListener('click',()=>drawer(false));
$('#dots').addEventListener('click',e=>{const b=e.target.closest('button');if(b)go(cur[0],+b.dataset.s)});
['#prev','#prev2'].forEach(q=>$(q).addEventListener('click',()=>step(-1)));['#next','#next2'].forEach(q=>$(q).addEventListener('click',()=>step(1)));
document.addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('input,textarea,select'))return;if(VIEW==='quiz'){if(window.QUIZ&&QUIZ.key(e))e.preventDefault();return}if(VIEW!=='learn')return;if(window.SIMUI&&SIMUI.key(e))return;if(e.key==='['&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&matchMedia('(min-width:1280px)').matches){e.preventDefault();toggleSide();return}if(e.key==='ArrowRight')step(1);else if(e.key==='ArrowLeft')step(-1);else if(e.key==='Escape')drawer(false);else if(e.key==='r'||e.key==='R')replay();else if(e.key===' '&&!e.target.closest('button')){e.preventDefault();togglePause()}});
$('#step').addEventListener('click',e=>{if(e.target.id==='runT'){K8STERM.run($('#step code').textContent);return}if(e.target.id!=='copy')return;const t=$('#step code').textContent;try{navigator.clipboard.writeText(t).then(()=>{e.target.textContent=U_('copied')},()=>{e.target.textContent=U_('copyFail')})}catch(err){e.target.textContent=U_('copyFail')}});
$('#replay').addEventListener('click',replay);$('#pause').addEventListener('click',togglePause);
$('#svw').addEventListener('pointerdown',()=>{$('#svw')._u=1});$('#full').addEventListener('click',()=>{const d=$('#dia');try{(document.fullscreenElement?document.exitFullscreen():d.requestFullscreen())?.catch?.(()=>{})}catch(err){}});
const ro=new ResizeObserver(()=>{if(lastScene)setVB(camFor(lastScene.sc));const d=$('#dots');if(cur&&d)d.classList.toggle('tight',d.clientWidth/L[cur[0]].steps.length<62)});ro.observe(sv);
function applyUI(){document.documentElement.lang=LANG==='pt'?'pt-BR':'en';document.querySelectorAll('[data-t]').forEach(n=>{n.textContent=U_(n.dataset.t)});document.querySelectorAll('[data-ta]').forEach(n=>{n.setAttribute('aria-label',U_(n.dataset.ta));n.title=U_(n.dataset.ta)});document.querySelectorAll('[data-tp]').forEach(n=>{n.placeholder=U_(n.dataset.tp)});
 $('#pauseL').textContent=U_(paused?'resume':'pause');$('#pause').setAttribute('aria-label',U_(paused?'resume':'pause'));$('#langB b').textContent=LANG.toUpperCase();
 document.querySelectorAll('#langM button').forEach(b=>b.setAttribute('aria-checked',b.dataset.l===LANG))}
function setLang(l){if(l===LANG)return;try{localStorage.setItem('k8s-lang',l)}catch(e){}window.K8S_loadLang(l,()=>{if(!window.TXT[l]||!window.TXT[l].les)return;LANG=l;buildL();cur=null;show()})}
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const v=b.dataset.v;if(v==='learn'){location.hash=window._lastLesson||`${L[0].id}-1`}else location.hash=v});
$('#cert').addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g){location.hash=`${L[+g.dataset.go].id}-1`}});
$('#cert').addEventListener('change',e=>{const c=e.target.closest('[data-c]');if(!c)return;c.checked?CHK.add(c.dataset.c):CHK.delete(c.dataset.c);try{localStorage.setItem('k8s-chk',JSON.stringify([...CHK]))}catch(err){}setView(VIEW)});
$('#langB').addEventListener('click',e=>{e.stopPropagation();$('#langM').hidden=!$('#langM').hidden});
$('#langM').addEventListener('click',e=>{const b=e.target.closest('button');if(b){setLang(b.dataset.l);$('#langM').hidden=true}});
document.addEventListener('click',()=>{$('#langM').hidden=true});
const q=$('#q'),sres=$('#sres');
function search(){const t=q.value.trim().toLowerCase();if(!t){sres.hidden=true;return}const out=[];
 L.forEach((l,li)=>{if(l.title.toLowerCase().includes(t))out.push([li,0,l.title,TX().mods[l.mod]]);l.steps.forEach((st,si)=>{if(out.length>=10)return;const hay=[st.h,st.n,...st.p,st.key||'',st.good||'',st.warn||''].join(' ').toLowerCase();if(hay.includes(t))out.push([li,si,st.h,l.title+' · '+U_('step')+' '+(si+1)])})});
 sres.innerHTML=out.length?out.slice(0,10).map(([li,si,a,b])=>`<button type="button" data-li="${li}" data-si="${si}">${esc(a)}<small>${esc(b)}</small></button>`).join(''):`<p>${U_('noResults')}</p>`;sres.hidden=false}
q.addEventListener('input',search);q.addEventListener('focus',search);
sres.addEventListener('mousedown',e=>{const b=e.target.closest('button');if(b){e.preventDefault();go(+b.dataset.li,+b.dataset.si);q.value='';sres.hidden=true;q.blur()}});
q.addEventListener('blur',()=>setTimeout(()=>{sres.hidden=true},150));
q.addEventListener('keydown',e=>{if(e.key==='Escape'){q.value='';sres.hidden=true;q.blur()}if(e.key==='Enter'){const b=sres.querySelector('button');if(b){go(+b.dataset.li,+b.dataset.si);q.value='';sres.hidden=true;q.blur()}}e.stopPropagation()});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();q.focus()}},true);
const MOON='M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',SUN='M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z';
const isDark=()=>{const t=document.documentElement.dataset.k8s;if(t)return t==='dark';const m=getComputedStyle(document.body).backgroundColor.match(/\d+(\.\d+)?/g);if(!m)return false;const[r,g,b]=m.map(Number);return (r*.299+g*.587+b*.114)<128};
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>syncTheme());new MutationObserver(()=>syncTheme()).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','style','class']});
const syncTheme=()=>{$('#themeI').setAttribute('d',isDark()?SUN:MOON);$('#theme').dataset.ta=isDark()?'themeLight':'themeDark';applyUI()};
try{const t=localStorage.getItem('k8s-theme');if(t)document.documentElement.dataset.k8s=t}catch(e){}
$('#theme').addEventListener('click',()=>{const t=isDark()?'light':'dark';document.documentElement.dataset.k8s=t;try{localStorage.setItem('k8s-theme',t)}catch(e){}syncTheme()});
window.K8STERM&&K8STERM.init({hi:ids=>{ids.forEach(id=>{const g=live.get(id);if(!g)return;g.classList.remove('thi');void g.getBBox;requestAnimationFrame(()=>g.classList.add('thi'));clearTimeout(g._thi);g._thi=setTimeout(()=>g.classList.remove('thi'),3300)})}});
window.__dbg={L:()=>L,S,tl};window.__audit=()=>{if(!lastScene)return[];const{sc,by}=lastScene,out=[],bl=sc.e.filter(e=>e.t==='block');
 const hex=e=>{const[x,y]=P(e.x,e.y),a=e.s*UX,b=e.s*UY,Y=y-(e.z||0),H=e.h;return[[x,Y-b-H],[x+a,Y-H],[x+a,Y],[x,Y+b],[x-a,Y],[x-a,Y-H]]};
 const inside=(p,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[xi,yi]=poly[i],[xj,yj]=poly[j];if(((yi>p[1])!==(yj>p[1]))&&(p[0]<(xj-xi)*(p[1]-yi)/(yj-yi)+xi))c=!c}return c};
 [...(sc.l||[]).map(x=>[x[0],x[1]]),...(sc.f||[]).map(x=>[x[0],x[1]])].forEach(([p0,q0])=>{if(!by[p0]||!by[q0])return;const[p,q,dr]=route(p0,q0,by,sc),m=dr.match(/M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)/).slice(1).map(Number),L=Math.hypot(m[2]-m[0],m[3]-m[1]);
  const hits=[];const sl=sc.e.filter(e=>e.t==='slab');bl.forEach(e=>{if(e.id===p||e.id===q)return;if(by[p].t==='slab'&&hostOf(e,sl)===by[p])return;if(by[q].t==='slab'&&hostOf(e,sl)===by[q])return;const poly=hex(e);for(let t=.08;t<.93;t+=.06){if(inside([m[0]+(m[2]-m[0])*t,m[1]+(m[3]-m[1])*t],poly)){hits.push(e.id);break}}});
  if(L<38||hits.length)out.push(p+'→'+q+(L<38?' short:'+Math.round(L):'')+(hits.length?' through:'+hits.join(','):''))});return out};
addEventListener('hashchange',show);
show();syncTheme();

/* ---------- Diagrama cabe na altura da janela + texto do passo na tela cheia (28/11/2026) ---------- */
// Em janelas baixas (ex.: notebook 1280×700) o diagrama encolhe para a lição inteira (título, diagrama e
// legenda) caber sem rolar. Abaixo de 1001 px o layout já é empilhado e rola normalmente.
function fitDia(){const sv=$('#sv');if(!sv)return;if(document.fullscreenElement||VIEW!=='learn'||innerWidth<=1000){sv.style.maxHeight='';return}
 const st=$('.stage'),foot=$('.dfoot'),top=sv.getBoundingClientRect().top+scrollY,pad=parseFloat(getComputedStyle(st).paddingBottom)||16;
 const avail=Math.floor(innerHeight-top-foot.offsetHeight-pad-18);sv.style.maxHeight=Math.max(250,Math.min(avail,innerHeight*.7))+'px'}
let fitQ=0;const fitSoon=()=>{cancelAnimationFrame(fitQ);fitQ=requestAnimationFrame(fitDia)};
addEventListener('resize',fitSoon);if(window.ResizeObserver){const h=$('.head');if(h)new ResizeObserver(fitSoon).observe(h)}
// Tela cheia: o cartão do passo (texto, Voltar/Próximo) vai para um painel ao lado do diagrama e volta ao sair.
// O cartão é movido, não copiado: render, botões e teclado continuam funcionando sem código extra.
function fsLabel(){const d=$('#dia'),t=$('#fsTog');if(!t)return;const off=d.classList.contains('fsno');t.setAttribute('aria-expanded',String(!off));t.querySelector('span').textContent=U_(off?'fsShow':'fsHide');t.title=U_(off?'fsShow':'fsHide')+' (T)'}
document.addEventListener('fullscreenchange',()=>{const d=$('#dia'),card=$('.step'),side=$('#fsside'),panel=$('.panel');if(!d||!card)return;
 if(document.fullscreenElement===d){side.appendChild(card);fsLabel()}else if(card.parentNode===side){panel.prepend(card);d.classList.remove('fsno')}fitSoon()});
$('#fsTog').addEventListener('click',()=>{$('#dia').classList.toggle('fsno');fsLabel()});
document.addEventListener('keydown',e=>{if((e.key==='t'||e.key==='T')&&document.fullscreenElement===$('#dia')&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();$('#fsTog').click()}});
