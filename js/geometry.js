/* Kubernetes Visual — js/geometry.js
   Geometria isométrica, cores, ícones e helpers de cena (compartilhados com scenes.js).
   Script clássico (não módulo): as declarações de topo são compartilhadas entre os arquivos js/*.js,
   que precisam ser carregados nesta ordem: geometry → content → renderer → ui. */
const NS='http://www.w3.org/2000/svg',$=s=>document.querySelector(s);
/* ---------- isometric geometry ---------- */
const U=27,UX=U*.866,UY=U*.5,P=(x,y)=>[(x-y)*UX,(x+y)*UY];
const COL={blue:['#e3eefb','#cfe1f6','#bcd3ef','#a6c3e8'],green:['#e4f3d9','#d1e9c2','#c3e1b2','#afd59a'],orange:['#fee8d0','#fcd4ad','#f9c697','#f2b07a'],yellow:['#fff4d8','#fee7b0','#fbd98a','#f4c865'],violet:['#f0e8fa','#e2d6f4','#d2c2ed','#bfaae3'],grey:['#eeeae3','#e1dbd1','#d0c8bb','#c1b7a8'],red:['#f9dcd8','#f1c3bd','#e6aaa3','#d9928a'],paper:['#fffaf3','#f7efe4','#eee4d6','#e1d6c5']};
$('#defs').innerHTML=Object.entries(COL).map(([k,c])=>`<linearGradient id="g-${k}-t" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient><linearGradient id="g-${k}-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[2]}"/><stop offset="1" stop-color="${c[3]}"/></linearGradient>`).join('')+
`<filter id="blur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5"/></filter><filter id="blurL" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="14"/></filter>
<pattern id="iso" width="${2*UX}" height="${2*UY}" patternUnits="userSpaceOnUse"><path d="M0 ${UY}L${UX} 0L${2*UX} ${UY}L${UX} ${2*UY}Z" fill="none" stroke="var(--grid)" stroke-width="1"/></pattern>
<marker id="arw" viewBox="0 0 12 10" refX="11" refY="5" markerWidth="11" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0.5L12 5L0 9.5z" class="arw"/></marker>`;
const f1=v=>+v.toFixed(1);
function rp(a,r){const n=a.length;let d='';for(let i=0;i<n;i++){const p0=a[(i-1+n)%n],p1=a[i],p2=a[(i+1)%n],l1=Math.hypot(p0[0]-p1[0],p0[1]-p1[1]),l2=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]),r1=Math.min(r,l1/2.2),r2=Math.min(r,l2/2.2),A=[p1[0]+(p0[0]-p1[0])/l1*r1,p1[1]+(p0[1]-p1[1])/l1*r1],B=[p1[0]+(p2[0]-p1[0])/l2*r2,p1[1]+(p2[1]-p1[1])/l2*r2];d+=`${i?'L':'M'}${f1(A[0])} ${f1(A[1])}Q${f1(p1[0])} ${f1(p1[1])} ${f1(B[0])} ${f1(B[1])}`}return d+'Z'}
const pl=a=>a.map(p=>f1(p[0])+','+f1(p[1])).join(' ');
const pill=(x,y,t,tone='')=>{const w=t.length*7.8+20;return `<g class="pill ${tone}" transform="translate(${f1(x)},${f1(y)})"><rect x="${-w/2}" y="-12" width="${w}" height="24" rx="12"/><text y="4.6">${t}</text></g>`};
const MW=86,meter=(x,y,v)=>{const w=MW,hot=v>=80;return `<g class="pill mtr ${hot?'hot':''}" transform="translate(${f1(x)},${f1(y)})"><rect x="${-w/2}" y="-11" width="${w}" height="22" rx="11"/><rect class="tr" x="${-w/2+9}" y="-3.5" width="30" height="7" rx="3.5"/><rect class="fl" x="${-w/2+9}" y="-3.5" width="${f1(30*Math.min(v,100)/100)}" height="7" rx="3.5"/><text x="${w/2-9}" y="4.3" style="text-anchor:end">${v}%</text></g>`};
/* flat icons drawn on block tops, ~22px */
const IC={
srv:'<rect x="-11" y="-10" width="22" height="8.5" rx="2.2"/><rect x="-11" y="1.5" width="22" height="8.5" rx="2.2"/><path d="M-6.5 -5.75h.01M-6.5 5.75h.01" stroke-width="3"/><path d="M1 -5.75h5.5M1 5.75h5.5"/>',
pod:'<path d="M0 -11 10 -5.5v11L0 11l-10-5.5v-11Z"/><path d="M-10 -5.5 0 0l10-5.5M0 0v11"/>',
box:'<rect x="-10" y="-9" width="20" height="18" rx="2.5"/><path d="M-10 -3h20M-4 2h8"/>',
svc:'<circle cx="-7" cy="0" r="3.2"/><circle cx="8" cy="-8" r="3"/><circle cx="8" cy="0" r="3"/><circle cx="8" cy="8" r="3"/><path d="M-3.8 0H5M-4.5-1.8 5-6.5M-4.5 1.8 5 6.5"/>',
web:'<circle r="10"/><path d="M-10 0h20M0 -10c-5 5-5 15 0 20M0 -10c5 5 5 15 0 20"/>',
api:'<path d="M-4 -9c-4 0-4 2-4 5s-3 4-3 4 3 1 3 4 0 5 4 5M4 -9c4 0 4 2 4 5s3 4 3 4-3 1-3 4 0 5-4 5"/>',
db:'<ellipse cx="0" cy="-6" rx="9" ry="3.5"/><path d="M-9 -6v12c0 2 4 3.5 9 3.5s9-1.5 9-3.5V-6M-9 0c0 2 4 3.5 9 3.5S9 2 9 0"/>',
cal:'<rect x="-10" y="-8" width="20" height="17" rx="2.5"/><path d="M-10 -3h20M-5 -11v5M5 -11v5M-4 3h2M2 3h2"/>',
loop:'<path d="M8 -4a9 9 0 1 0 1 7"/><path d="M9 -10v6H3"/>',
term:'<rect x="-11" y="-9" width="22" height="18" rx="2.5"/><path d="M-6 -3l4 3-4 3M1 4h5"/>',
gauge:'<path d="M-10 5a10 10 0 1 1 20 0"/><path d="M0 5 5 -3"/>',
globe:'<circle r="10"/><path d="M-10 0h20M0 -10c-5 5-5 15 0 20M0 -10c5 5 5 15 0 20"/>',
log:'<path d="M-8 -9h12l4 4v14H-8Z"/><path d="M-4 -2h8M-4 3h8"/>',
user:'<circle cy="-4" r="4.5"/><path d="M-9 9c0-5 4-8 9-8s9 3 9 8"/>',
lock:'<rect x="-8" y="-2" width="16" height="12" rx="2"/><path d="M-5 -2v-4a5 5 0 0 1 10 0v4"/>',
link:'<path d="M-2 5-5 8a4 4 0 0 1-6-6l3-3M2-5l3-3a4 4 0 0 1 6 6l-3 3M-4 4l8-8"/>',
shield:'<path d="M0 -11 9 -7v6c0 6-4 10-9 12-5-2-9-6-9-12v-6Z"/><path d="m-4 0 3 3 5-6"/>'};
function lab(e,a,b,h,cls){const n=[...String(e.lb)].length,k=b/a;for(let fs=e.s<2.1?13.5:15;fs>=9.5;fs-=.5){const w=n*fs*.61,cap=fs*.72,top=b-h+3,bot=b-(w/2)*k-3;if(bot-top>=cap){return `<text x="0" y="${f1((top+bot)/2+cap/2)}" class="${cls}" style="font-size:${fs}px">${e.lb}</text>`}}return pill(0,b+20,e.lb)}
const R={
block(e){const a=e.s*UX,b=e.s*UY,h=e.h,hot=e.m>=80&&e.st!=='dead',c=e.st==='dead'?'grey':hot?'red':e.c,r=Math.min(10,a*.18);
 const top=[[0,-b-h],[a,-h],[0,b-h],[-a,-h]],Rr=[[0,b-h],[a,-h],[a,0],[0,b]],out=[[0,-b-h],[a,-h],[a,0],[0,b],[-a,0],[-a,-h]];
 let s='';
 if(hot)s+=`<ellipse cx="0" cy="${f1(-h/2)}" rx="${f1(a*1.1)}" ry="${f1(b+h*.6)}" class="glow" filter="url(#blurL)"/>`;
 if(e.st==='hi')s+=`<path d="${rp([[0,-b-9],[a+16,0],[0,b+9],[-a-16,0]],8)}" class="ring"/>`;
 if(e.st==='pend'){s+=`<path d="${rp(out,r)}" class="ghost"/><polyline points="${pl([[-a+3,-h+2],[0,b-h],[a-3,-h+2]])}" class="ghost" style="fill:none"/>`+lab(e,a,b,h,'gt')}
 else{s+=`<path d="${rp([[0,-b+6],[a+4,8],[0,b+12],[-a-4,8]],r)}" class="bsh" filter="url(#blur)"/><path d="${rp(out,r)}" fill="url(#g-${c}-s)"/><path d="${rp(Rr,r*.5)}" fill="#3a2a14" opacity=".07"/><path d="${rp(top,r)}" fill="url(#g-${c}-t)"/><polyline points="${pl([[-a+r,-h+2.5],[0,b-h+2.5],[a-r,-h+2.5]])}" class="hl"/><path d="M0 ${f1(b-h+2)}V${f1(b-2)}" stroke="#211e1b" stroke-opacity=".18" stroke-width="1.5"/><path d="${rp(out,r)}" class="ol"/><polyline points="${pl([[-a+r*.6,-h+r*.3],[0,b-h],[a-r*.6,-h+r*.3]])}" class="ol"/>`;
  if(e.st==='dead'){const k=Math.min(a*.3,12);s+=`<path d="M${-k} ${f1(-h-k*.6)}L${k} ${f1(-h+k*.6)}M${k} ${f1(-h-k*.6)}L${-k} ${f1(-h+k*.6)}" stroke="#c0392b" stroke-width="3.5" stroke-linecap="round"/>`}
  else if(e.ic)s+=`<g class="ic" transform="translate(0,${f1(-h)}) scale(${f1(Math.min(1,e.s/2))})">${IC[e.ic]}</g>`;
  s+=lab(e,a,b,h,'bt')}
 let y=-b-h-17-(e._bo||0);if(e._bo>6)s+=`<path d="M0 ${f1(-b-h-3)}V${f1(y+12)}" stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="2 3"/>`;if(e.m!=null){s+=meter(a*.55+MW/2-10,-h-b*.55-(e._bo||0),e.m)}
 if(e.b)s+=pill(0,y,e.b[0],e.b[1]||'');
 return s},
slab(e){const t=e.th,c=[[0,0],[e.w*UX,e.w*UY],[(e.w-e.d)*UX,(e.w+e.d)*UY],[-e.d*UX,e.d*UY]],T=c.map(p=>[p[0],p[1]-t]),r=10;
 const down=e.st==='down',paper=(e.c==='paper'&&!down),fT=paper?'class="slT"':`fill="url(#g-${down?'red':e.c}-t)"`,fS=paper?'class="slS"':`fill="url(#g-${down?'red':e.c}-s)"`;
 const sil=[T[0],T[1],c[1],c[2],c[3],T[3]];
 let s=`<path d="${rp(c.map(p=>[p[0],p[1]+8]),r)}" class="bsh" filter="url(#blur)"/><path d="${rp(sil,r)}" ${fS}/><path d="${rp([T[2],T[1],c[1],c[2]],r*.5)}" fill="#3a2a14" opacity=".06"/><path d="${rp(T,r)}" ${fT}/>`;
 if(e.st==='new'||e.st==='hi')s+=`<path d="${rp(T,r)}" fill="none" stroke="var(--green3)" stroke-width="3.5"/>`;
 s+=`<path d="${rp(sil,r)}" class="sol"/><polyline points="${pl([[T[3][0]+r*.7,T[3][1]+r*.35],T[2],[T[1][0]-r*.7,T[1][1]+r*.35]])}" class="sol" stroke-linejoin="round"/>`;
 if(e.people){let f='';const n=e.people,cols=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols),pal=['#a6c3e8','#afd59a','#f2b07a','#bfaae3','#f4c865'],list=[];
  for(let i=0;i<n;i++){const cx=(i%cols+.5)*e.w/cols,cy=(Math.floor(i/cols)+.5)*e.d/rows;list.push([cx,cy,pal[(i*7)%5]])}
  list.sort((p,q)=>(p[0]+p[1])-(q[0]+q[1])).forEach(([cx,cy,col],pi)=>{const[px,py]=P(cx,cy),y=py-t;f+=`<g class="pp" style="animation-delay:${350+pi*70}ms"><rect x="${f1(px-6)}" y="${f1(y-19)}" width="12" height="17" rx="6" fill="${col}" stroke="#211e1b" stroke-width="1.6"/><circle cx="${f1(px)}" cy="${f1(y-25)}" r="5.3" fill="${col}" stroke="#211e1b" stroke-width="1.6"/></g>`});s+=f}
 if(e.lb){const m=e.lr?[(c[2][0]+c[1][0])/2+10,(c[2][1]+c[1][1])/2+22]:[(c[3][0]+c[2][0])/2-8,(c[3][1]+c[2][1])/2+22];s+=pill(m[0],m[1],down?e.lb+' · '+tl('down'):e.lb,down?'bad':e.st==='new'?'ok':'')}
 return s}
};
function bounds(e){const[x,y]=P(e.x,e.y),z=e.z||0;
 if(e.t==='block'){const a=e.s*UX,b=e.s*UY,lw=e.b?e.b[0].length*7.8+20:0;return[x-Math.max(a+18,lw/2+6),y-z-b-e.h-(e.b?34:12)-(e._bo||0),x+Math.max(a+18,lw/2+6,e.m!=null?a*.55+MW:0),y-z+b+14]}
 const c=[[0,0],[e.w*UX,e.w*UY],[(e.w-e.d)*UX,(e.w+e.d)*UY],[-e.d*UX,e.d*UY]];
 return[x+Math.min(...c.map(p=>p[0]))-(e.lb?60:10),y-z-e.th-(e.people?34:6),x+Math.max(...c.map(p=>p[0]))+10,y-z+Math.max(...c.map(p=>p[1]))+(e.lb?40:12)]}
function shape(e){const[x,y]=P(e.x,e.y),z=e.z||0;
 if(e.t==='block'){const a=e.s*UX,b=e.s*UY,Y=y-z;return{c:[x,Y],poly:[[x,Y-b],[x+a,Y],[x,Y+b],[x-a,Y]]}}
 const c=[[0,0],[e.w*UX,e.w*UY],[(e.w-e.d)*UX,(e.w+e.d)*UY],[-e.d*UX,e.d*UY]].map(p=>[x+p[0],y-z-e.th+p[1]]);
 return{c:[(c[0][0]+c[2][0])/2,(c[0][1]+c[2][1])/2],poly:c}}
function exitT(S,ux,uy){let best=0;const[cx,cy]=S.c,p=S.poly;for(let i=0;i<p.length;i++){const[x1,y1]=p[i],[x2,y2]=p[(i+1)%p.length],ex=x2-x1,ey=y2-y1,den=ux*ey-uy*ex;if(Math.abs(den)<1e-9)continue;const t=((x1-cx)*ey-(y1-cy)*ex)/den,u=((x1-cx)*uy-(y1-cy)*ux)/den;if(t>0&&u>=-1e-6&&u<=1+1e-6)best=Math.max(best,t)}return best}
function link(a,b){const A=shape(a),B=shape(b),dx=B.c[0]-A.c[0],dy=B.c[1]-A.c[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,
 ta=Math.min(exitT(A,ux,uy)+7,L*.42),tb=Math.min(exitT(B,-ux,-uy)+7,L*.42);
 return`M${f1(A.c[0]+ux*ta)} ${f1(A.c[1]+uy*ta)}L${f1(B.c[0]-ux*tb)} ${f1(B.c[1]-uy*tb)}`}

/* ---------- scene helpers ---------- */
const K=7.6,N=[[0,0],[K,-K],[2*K,-2*K]],SL=[[1.4,1.3],[4.3,1.3],[7.2,1.3],[1.4,3.9],[4.3,3.9],[7.2,3.9]];
const node=(i,o={})=>({id:o.id||'n'+i,t:'slab',x:N[i][0],y:N[i][1],w:8.6,d:5.2,th:12,c:o.c||'paper',lb:o.lb||('node-'+(i+1)),st:o.st||''});
const at=(a,b)=>[(a+b)/2,(b-a)/2];
const nodes=(o={},n=3)=>[0,1,2].slice(0,n).map(i=>node(i,o[i]));
const PC={plain:'paper',ok:'blue',new:'green',v2:'violet',dead:'grey',other:'grey',cont:'orange',pend:'blue',web:'yellow'};
const pod=(id,i,k,st='ok',lb='api',o={})=>({id,t:'block',x:N[i][0]+SL[k][0],y:N[i][1]+SL[k][1],z:o.z??12,s:1.6,h:27,c:PC[st],st:st==='dead'||st==='pend'?st:'',lb,ic:o.ic||(st==='cont'?'box':st==='other'?'box':'pod'),b:o.b,m:o.m,pod:1});
const blk=(id,x,y,c,lb,o={})=>({id,t:'block',x,y,z:o.z||0,s:o.s||2.6,h:o.h||40,c,lb,ic:o.ic,st:o.st||'',b:o.b,m:o.m});
const CPB=[['api','API server','api'],['etcd','etcd','db'],['sched','scheduler','cal'],['ctrl','controller','loop']];
const CPO=[[2.7,2.7],[2.7,-2.7],[-2.7,2.7],[-2.7,-2.7]];
const cp=(hi=[],c=at(16.9,-16))=>[{id:'cp',t:'slab',x:c[0]-5.3,y:c[1]-5.3,w:10.6,d:10.6,th:12,c:'violet',lb:'control plane',lr:1},...CPB.map(([id,lb,ic],i)=>blk(id,c[0]+CPO[i][0],c[1]+CPO[i][1],hi.includes(id)?'violet':'paper',lb,{z:12,s:1.9,h:38,ic,st:hi.includes(id)?'hi':''}))];
const users=(n=9,cx=at(28,-20)[0],cy=at(28,-20)[1],lb)=>({id:'u',t:'slab',x:cx-2,y:cy-2,w:4,d:4,th:10,c:'paper',people:Math.min(n,9),lb:lb||tl('users')});
const kub=b=>blk('kc',...at(3,-10),'orange','kubectl',{s:2.3,h:36,ic:'term',b:b?[b]:null});
const SV=(b,x=at(16.9,-6.1)[0],y=at(16.9,-6.1)[1],m)=>blk('sv',x,y,'orange','Service',{ic:'svc',b:b?[b]:null,m});
const ING=(x=at(16.9,-18)[0],y=at(16.9,-18)[1])=>blk('ing',x,y,'yellow','Ingress',{ic:'globe',b:['loja.com']});
