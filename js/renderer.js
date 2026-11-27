/* Kubernetes Visual — js/renderer.js
   Motor de desenho: blocos, slabs, setas, pacotes, câmera e layout sem sobreposição.
   Script clássico (não módulo): as declarações de topo são compartilhadas entre os arquivos js/*.js,
   que precisam ser carregados nesta ordem: geometry → content → renderer → ui. */
/* ---------- renderer ---------- */
const sv=$('#sv'),bg=$('#bg'),fg=$('#fg'),lk=$('#lk'),pk=$('#pk'),live=new Map();
const RM=matchMedia('(prefers-reduced-motion: reduce)');
let ENTER=0,cur=null,paused=false,sortT,lineT,lastScene=null,vb=null,vbAnim=0;
const depth=e=>e.t==='block'?(e.x+e.y+(e.z||0)/40):-999;
function camFor(sc){let b=[1e9,1e9,-1e9,-1e9];sc.e.forEach(e=>{const q=bounds(e);b=[Math.min(b[0],q[0]),Math.min(b[1],q[1]),Math.max(b[2],q[2]),Math.max(b[3],q[3])]});
 const pad=16,cw=sv.clientWidth||900,ch=sv.clientHeight||520,A=cw/ch,overlay=getComputedStyle($('.ovl')).position==='absolute';
 let x=b[0]-pad,y=b[1]-pad,w=b[2]-b[0]+pad*2,h=b[3]-b[1]+pad*2;
 if(overlay){const top=h*.15,bot=h*.03;y-=top;h+=top+bot}
 const minW=cw<600?340:560;if(w<minW){x-=(minW-w)/2;w=minW}
 if(w/h<A){const nw=h*A;x-=(nw-w)/2;w=nw}else{const nh=w/A;y-=(nh-h)/2;h=nh}
 return[x,y,w,h]}
function setVB(v){vb=v;const w=$('#svw');if(w.scrollWidth>w.clientWidth&&!w._u){w.scrollLeft=(w.scrollWidth-w.clientWidth)/2}sv.setAttribute('viewBox',v.map(f1).join(' '));const g=$('#gridr');g.setAttribute('x',v[0]-v[2]);g.setAttribute('y',v[1]-v[3]);g.setAttribute('width',v[2]*3);g.setAttribute('height',v[3]*3)}
function moveCam(t,instant){cancelAnimationFrame(vbAnim);if(!vb||instant||RM.matches){setVB(t);return}const s=vb.slice(),t0=performance.now(),D=850;
 const tick=n=>{let k=Math.min(1,(n-t0)/D);k=k<.5?4*k*k*k:1-((-2*k+2)**3)/2;setVB(s.map((v,i)=>v+(t[i]-v)*k));if(k<1)vbAnim=requestAnimationFrame(tick)};vbAnim=requestAnimationFrame(tick)}
function fitSizes(list){const bl=list.filter(e=>e.t==='block');if(bl.length<2)return;
 const box=(e,k)=>{const[x,y]=P(e.x,e.y),a=e.s*k*UX,b=e.s*k*UY,z=e.z||0;return[x-a,y-z-b-e.h*k,x+a,y-z+b]};
 const worst=k=>{let w=0;for(let i=0;i<bl.length;i++)for(let j=i+1;j<bl.length;j++){const p=box(bl[i],k),q=box(bl[j],k),ox=Math.min(p[2],q[2])-Math.max(p[0],q[0]),oy=Math.min(p[3],q[3])-Math.max(p[1],q[1]);if(ox>0&&oy>0){const ar=Math.min((p[2]-p[0])*(p[3]-p[1]),(q[2]-q[0])*(q[3]-q[1]));w=Math.max(w,ox*oy/ar)}}return w};
 let k=1;while(k>.6&&worst(k)>.08)k-=.04;if(k<1)bl.forEach(e=>{e.s*=k;e.h*=k})}
function deconflict(list){const blocks=list.filter(e=>e.t==='block'),placed=[];
 const body=e=>{const[x,y]=P(e.x,e.y),a=e.s*UX,b=e.s*UY,z=e.z||0;return[x-a,y-z-b-e.h,x+a,y-z+b]};
 blocks.filter(e=>e.b||e.m!=null).sort((p,q)=>depth(q)-depth(p)).forEach(e=>{const[x,y]=P(e.x,e.y),a=e.s*UX,b=e.s*UY,z=e.z||0,bw=e.b?e.b[0].length*7.8+20:0,top=y-z-b-e.h;
  const rs=[];if(e.b)rs.push([x-bw/2-3,top-29,x+bw/2+3,top-5]);if(e.m!=null){const mx=x+a*.55+MW/2-10,my=y-z-e.h-b*.55;rs.push([mx-MW/2-2,my-12,mx+MW/2+2,my+12])}
  const r0=[Math.min(...rs.map(q=>q[0])),Math.min(...rs.map(q=>q[1])),Math.max(...rs.map(q=>q[2])),Math.max(...rs.map(q=>q[3]))];
  const obs=placed.concat(blocks.filter(o=>o!==e&&depth(o)>depth(e)).map(body));let off=0,r=r0;
  for(let k=0;k<12;k++){const hit=obs.find(p=>r[0]<p[2]&&r[2]>p[0]&&r[1]<p[3]&&r[3]>p[1]);if(!hit)break;const d=r[3]-hit[1]+4;if(off+d>90)break;off+=d;r=[r[0],r[1]-d,r[2],r[3]-d]}
  e._bo=off;placed.push(r)})}
function paint(sc,fresh){(sc.dead||[]).forEach(id=>{const e=sc.e.find(x=>x.id===id);if(e)e.st='dead'});fitSizes(sc.e);deconflict(sc.e);
 if(fresh){live.forEach(g=>g.remove());live.clear();[...bg.querySelectorAll(':scope>g.ent'),...fg.querySelectorAll(':scope>g.ent')].forEach(g=>g.remove())}else{const keep=new Set(live.values());[...bg.querySelectorAll(':scope>g.ent'),...fg.querySelectorAll(':scope>g.ent')].forEach(g=>{if(!keep.has(g))g.remove()})}
 moveCam(camFor(sc),fresh);
 const seen=new Set(),by={};
 const anim=!RM.matches,order=sc.e.filter(e=>!live.has(e.id)).sort((a,b)=>(a.t==='slab'?-1e3:0)+depth(a)-((b.t==='slab'?-1e3:0)+depth(b))),gap=Math.min(55,700/Math.max(1,order.length));
 const dly={};order.forEach((e,i)=>dly[e.id]=fresh?i*gap:i*35+120);ENTER=fresh?order.length*gap+650:0;
 sc.e.forEach(e=>{by[e.id]=e;seen.add(e.id);let g=live.get(e.id);const isNew=!g;const[x,y]=P(e.x,e.y),ty=y-(e.z||0);
  if(!g){g=document.createElementNS(NS,'g');g.setAttribute('class','ent');g.style.transition='none';g.style.opacity=0;g.style.transform=`translate(${f1(x)}px,${f1(ty-(anim?(fresh?90:44):0))}px)`;(e.t==='slab'?bg:fg).appendChild(g);live.set(e.id,g)}
  g._gone=0;g.dataset.k=depth(e);const sig=JSON.stringify({...e,x:0,y:0,z:0});
  if(g.dataset.sig!==sig){g.innerHTML=R[e.t](e);g.dataset.sig=sig}
  if(isNew){g.getBoundingClientRect();if(anim){g.classList.add('drop');g.style.transition='';g.style.transitionDelay=dly[e.id]+'ms';clearTimeout(g._dt);g._dt=setTimeout(()=>{g.classList.remove('drop');g.style.transitionDelay=''},dly[e.id]+900)}else g.style.transition=''}
  g.style.transform=`translate(${f1(x)}px,${f1(ty)}px)`;
  requestAnimationFrame(()=>{g.style.opacity=1})});
 live.forEach((g,id)=>{if(!seen.has(id)&&!g._gone){g._gone=1;g.style.opacity=0;setTimeout(()=>{if(g._gone){g.remove();live.delete(id)}},480)}});
 const sortNow=()=>[...fg.children].sort((a,b)=>a.dataset.k-b.dataset.k).forEach((g,i)=>{if(fg.children[i]!==g)fg.appendChild(g)});
 clearTimeout(sortT);if(fresh)sortNow();else sortT=setTimeout(sortNow,900);
 lastScene={sc,by};lk.style.opacity=0;pk.style.opacity=0;clearTimeout(lineT);lineT=setTimeout(drawLinks,fresh?Math.min(ENTER,1500):650);
 const kinds=new Set((sc.f||[]).map(f=>f[3]||'req'));
 $('#leg').innerHTML=['req','heavy','hc','bad'].filter(k=>kinds.has(k)).map(k=>`<span><i class="${k}"></i>${U_('leg_'+k)}</span>`).join('')}
const HEX=e=>{const[x,y]=P(e.x,e.y),a=e.s*UX,b=e.s*UY,Y=y-(e.z||0),H=e.h;return[[x,Y-b-H],[x+a,Y-H],[x+a,Y],[x,Y+b],[x-a,Y],[x-a,Y-H]]};
const INP=(p,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[xi,yi]=poly[i],[xj,yj]=poly[j];if(((yi>p[1])!==(yj>p[1]))&&(p[0]<(xj-xi)*(p[1]-yi)/(yj-yi)+xi))c=!c}return c};
function hitsOf(d,ex,bl){const m=d.match(/M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)/).slice(1).map(Number);let n=0;bl.forEach(e=>{if(ex.has(e.id))return;const poly=HEX(e);for(let t=.08;t<.93;t+=.06){if(INP([m[0]+(m[2]-m[0])*t,m[1]+(m[3]-m[1])*t],poly)){n++;break}}});return n}
function hostOf(e,sl){if(e.t!=='block'||!(e.z>0))return null;const[x,y]=P(e.x,e.y),p=[x,y-e.z];return sl.find(s=>INP(p,shape(s).poly))||null}
function route(p,q,by,sc){const bl=sc.e.filter(e=>e.t==='block'),sl=sc.e.filter(e=>e.t==='slab'),A=by[p],B=by[q];
 const ex=(...ids)=>{const s=new Set(ids);bl.forEach(e=>{ids.forEach(id=>{const h=by[id];if(h&&h.t==='slab'&&hostOf(e,sl)===h)s.add(e.id)})});return s};
 let d=link(A,B);if(!hitsOf(d,ex(p,q),bl))return[p,q,d];
 const hA=hostOf(A,sl),hB=hostOf(B,sl),opts=[];if(hB)opts.push([p,hB.id]);if(hA)opts.push([hA.id,q]);if(hA&&hB&&hA!==hB)opts.push([hA.id,hB.id]);
 for(const[x,y]of opts){if(x===y)continue;const d2=link(by[x],by[y]);if(!hitsOf(d2,ex(x,y),bl))return[x,y,d2]}return[p,q,d]}
function drawLinks(){if(!lastScene)return;const{sc,by}=lastScene;let a='',b='';const seenL=new Set();
 (sc.l||[]).forEach(([p,q,dd])=>{if(!by[p]||!by[q])return;const[x,y,d]=route(p,q,by,sc);if(seenL.has(x+'>'+y))return;seenL.add(x+'>'+y);a+=`<path d="${d}" class="lnk ${dd||''}" ${dd?'':'marker-end="url(#arw)"'}/>`});
 (sc.f||[]).forEach(([p,q,n,k])=>{if(!by[p]||!by[q])return;k=k||'';const[x,y,d]=route(p,q,by,sc),key=x+'>'+y+k;if(seenL.has(key))return;seenL.add(key);a+=`<path d="${d}" class="lnk ${k}" ${k==='hc'?'':'marker-end="url(#arw)"'}/>`;
  if(RM.matches)return;const dur=k==='heavy'?2.6:k==='hc'?1.4:1.7;
  for(let i=0;i<n;i++){const shape=k==='heavy'?`<rect x="-5.5" y="-5.5" width="11" height="11" rx="2" class="pk"/>`:k==='bad'?`<circle r="6" class="pk bad"/><path d="M-2.5-2.5l5 5M2.5-2.5l-5 5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`:k==='hc'?`<circle r="6" class="pk hc"/>`:`<circle r="5.5" class="pk"/>`;
   b+=`<g>${shape}<animateMotion dur="${dur}s" begin="-${f1(i*dur/n+Math.random()*.3)}s" repeatCount="indefinite" path="${d}"/></g>`}});
 lk.innerHTML=a;pk.innerHTML=b;lk.style.opacity=1;pk.style.opacity=0;
 if(!RM.matches){lk.querySelectorAll('path.lnk:not(.d):not(.hc)').forEach((p,i)=>{const L=p.getTotalLength();p.style.strokeDasharray=L;p.style.strokeDashoffset=L;p.style.transition=`stroke-dashoffset .55s cubic-bezier(.4,0,.2,1) ${i*70}ms`;p.getBoundingClientRect();p.style.strokeDashoffset=0});const n=lk.querySelectorAll('path').length;setTimeout(()=>{pk.style.opacity=1},Math.min(1200,n*70+420))}else pk.style.opacity=1;if(paused)sv.pauseAnimations()}
