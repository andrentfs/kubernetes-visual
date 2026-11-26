/* Scene structure: language-neutral. Text lives in pt.js / en.js, keyed by lesson id and step index. */
window.buildScenes=function(H){
const{node,nodes,pod,blk,cp,users,kub,SV,ING,at,tl}=H;
const cpb=(hi,bad={},c)=>{const a=cp(hi,c);a.forEach(e=>{if(bad[e.id]){Object.assign(e,bad[e.id])}});return a};
const UR=at(-3,-13);
const srv3=(st={})=>[0,1,2].map(i=>node(i,{id:'v'+i,lb:tl('server')+'-'+(i+1),st:st[i]}));
const nd3=(st={})=>[0,1,2].map(i=>node(i,{id:'v'+i,st:st[i]}));
const bigNode=()=>({id:'bn',t:'slab',x:0,y:-1,w:13,d:9,th:12,c:'paper',lb:'node-2'});
const podSlab=(id,c,lb,st)=>({id,t:'slab',x:2.5,y:1,w:8.5,d:5.5,z:12,th:10,c,lb,st,lr:1});
const vol=(id,c)=>({id,t:'slab',x:3.3,y:4.9,w:6.9,d:1.1,z:22,th:5,c,lb:''});
const hpa=(st,b)=>blk('hpa',...at(-5,-6.1),'violet','HPA',{ic:'gauge',st,b:b?[b]:null});
const SVE=(b,m)=>SV(b,...at(9.3,-6.1),m);
const UE=n=>users(n,...at(9.3,-19));
const others=()=>[3,4,5].flatMap(k=>[pod('o0'+k,0,k,'other',tl('other')),pod('o1'+k,1,k,'other',tl('other'))]);
const UR6=()=>users(6,...at(16.9,-20));
const CF={api:(id,n,o={})=>pod(id,n,1,o.st||'ok','api',{b:o.b}),cm:v=>blk('cm',...at(4,-13),'yellow','ConfigMap',{s:2.1,h:30,ic:'log',b:v?[v,'ok']:null}),sec:b=>blk('sec',...at(18,-13),'yellow','Secret',{s:2.1,h:30,ic:'lock',b:b?[b]:null})};
const ST={PV:at(26,-6),PVC:at(9,-14),SC:at(25,-17),pv:(b,dyn,t)=>blk('pv',...ST.PV,dyn?'green':'blue','PV',{s:2.2,h:34,ic:'db',b:[b,t||'']}),pvc:b=>blk('pvc',...ST.PVC,'yellow','PVC',{s:2,h:28,ic:'link',b:[b,b==='Pending'?'':'ok']}),sc:b=>blk('sc',...ST.SC,'violet','StorageClass',{s:2.2,h:30,ic:'gauge',b:b?[b]:null})};
const SC={s:()=>blk('sch',...at(17,-16),'violet','scheduler',{s:2.1,h:32,ic:'cal'})};
const KA={n:(o={})=>[node(0,{lb:'controlplane'+(o[0]?' · '+o[0]:''),c:'violet'}),node(1,{lb:'worker-1'+(o[1]&&o[1]!=='new'?' · '+o[1]:''),st:o[1]==='new'?'new':'',c:o[1]==='drain'?'grey':undefined}),node(2,{lb:'worker-2',st:o[2]==='new'?'new':''})],
cp:(up,hi)=>[pod('ke',0,0,hi==='etcd'?'new':'v2','etcd',{ic:'db'}),pod('ka',0,2,'v2','apiserver',{ic:'api'}),pod('ks',0,3,'v2','sched',{ic:'cal'}),pod('kc2',0,5,'v2','ctrl-mgr',{ic:'loop'})]};
const KB=b=>blk('kc',...at(9.3,-15),'orange','kubectl',{s:2.1,h:32,ic:'term',b:b?[b]:null});
const RB={API:at(17,-15),
base:(o={})=>{const r=[node(0,{id:'ns1',lb:'ns: loja'}),node(2,{id:'ns2',lb:'ns: financeiro'}),blk('apis',...RB.API,'violet','API server',{ic:'shield'}),
 pod('l0',0,0,o.sa?'new':'ok','api',o.sa?{b:['sa: loja-api','ok']}:{}),pod('l1',0,2,'web','secret',{ic:'lock'}),
 pod('f0',2,0,o.f0||'ok','api'),pod('f1',2,2,o.f1||'web','secret',{ic:'lock'})];
 if(o.role)r.push(pod('role',0,4,'v2','Role',{ic:'log',b:['get, list pods']}));
 if(o.rb)r.push(pod('rb',0,5,'new','Binding',{ic:'link'}));
 if(o.rbv)r.push(pod('rbv',0,4,'new','Binding',{ic:'link',b:['view @ loja']}));
 if(o.rbv2)r.push(pod('rbv2',2,4,'new','Binding',{ic:'link',b:['view @ financeiro']}));
 return r},
ana:b=>blk('ana',...at(-9,-20),'orange','ana',{s:1.9,h:30,ic:'user',b:b?[b,b==='cluster-admin'?'bad':'']:null}),
ci:b=>blk('ci',...at(-9,-2),'orange','ci-bot',{s:1.9,h:30,ic:'term',b:b?[b]:null}),
gates:()=>[blk('g1',...at(-1,-24),'paper',tl('authn'),{s:1.8,h:28,ic:'user',b:[tl('who')]}),blk('g2',...at(5.5,-21),'paper','RBAC',{s:1.8,h:28,ic:'lock',b:[tl('may')]}),blk('g3',...at(12,-18),'paper','admission',{s:1.8,h:28,ic:'shield',b:[tl('rules')]})]};
return {
intro:{min:9,lvl:'beg',mod:0,steps:[
{k:'contexto',s:()=>({e:[node(1,{id:'v0',lb:tl('server')}),users(4,...at(4,2)),pod('a0',1,1,'plain',tl('store'),{ic:'srv'})],f:[['u','a0',2]]})},
{k:'problema',s:()=>({e:[node(1,{id:'v0',lb:tl('server')}),users(4,...at(4,2)),pod('a0',1,1,'plain',tl('store'),{ic:'srv',b:[tl('version'),'bad']}),pod('a1',1,4,'plain','db',{ic:'db'})],f:[['u','a0',2],['a0','a1',2,'bad']]})},
{k:'solucao',cmd:'docker run -d -p 80:8080 loja/app:1.0',s:()=>({e:[node(1,{id:'v0',lb:tl('server')}),users(4,...at(4,2)),pod('a0',1,1,'cont',tl('store'),{b:['loja/app:1.0']}),pod('a1',1,4,'cont','db',{ic:'db'})],f:[['u','a0',2],['a0','a1',1]]})},
{k:'conceito',s:()=>({e:[node(1,{id:'v0',lb:tl('server')}),users(4,...at(4,2)),pod('w',1,0,'cont','web',{ic:'web'}),pod('a0',1,2,'cont','api'),pod('a1',1,3,'cont','db',{ic:'db'}),pod('q',1,5,'cont',tl('queue'))],f:[['u','w',2],['w','a0',1],['a0','a1',1],['a0','q',1]]})},
{k:'problema',s:()=>({e:[node(1,{id:'v0',lb:tl('server')}),users(9,...at(4,2)),pod('w',1,0,'cont','web',{ic:'web',m:92}),pod('a0',1,2,'cont','api',{m:97}),pod('a1',1,3,'cont','db',{ic:'db'}),pod('q',1,5,'cont',tl('queue'))],f:[['u','w',4,'heavy'],['w','a0',2,'heavy'],['a0','a1',1],['u','w',1,'bad']]})},
{k:'problema',s:()=>({e:[node(1,{id:'v0',lb:tl('server'),st:'down'}),users(9,...at(4,2)),pod('w',1,0,'dead','web'),pod('a0',1,2,'dead','api'),pod('a1',1,3,'dead','db'),pod('q',1,5,'dead',tl('queue'))],f:[['u','w',4,'bad']]})},
{k:'solucao',s:()=>({e:[...srv3(),users(9,...UR),pod('w',0,1,'cont','web',{ic:'web',m:45}),pod('a0',0,4,'cont','api'),pod('w2',1,1,'cont','web',{ic:'web',m:44}),pod('a2',1,4,'cont','api'),pod('a1',2,1,'cont','db',{ic:'db'}),pod('q',2,4,'cont',tl('queue'))],f:[['u','w2',2],['u','w',2]]})},
{k:'problema',s:()=>({e:[...srv3({0:'down'}),users(9,...UR),pod('w',0,1,'dead','web'),pod('a0',0,4,'dead','api'),pod('w2',1,1,'cont','web',{ic:'web',m:88,b:[tl('whoRestarts')]}),pod('a2',1,4,'cont','api',{b:[tl('whereRun')]}),pod('a1',2,1,'cont','db',{ic:'db',b:[tl('howUpdate')]}),pod('q',2,4,'cont',tl('queue'))],f:[['u','w2',3,'heavy'],['u','w',2,'bad']]})},
{k:'conceito',s:()=>({e:[...cp(),...nd3(),users(9,...UR),pod('w',0,1,'cont','web',{ic:'web'}),pod('a0',0,4,'cont','api'),pod('w2',1,1,'cont','web',{ic:'web'}),pod('a2',1,4,'cont','api'),pod('a1',2,1,'cont','db',{ic:'db'}),pod('q',2,4,'cont',tl('queue'))],l:[['cp','v0','d'],['cp','v1','d'],['cp','v2','d']],f:[['u','w2',2],['u','w',2]]})},
{k:'conceito',cmd:'kubectl apply -f loja.yaml',s:()=>({e:[...cpb(['ctrl'],{ctrl:{b:[tl('want2web'),'ok']}}),...nd3(),users(9,...UR),pod('w',0,1,'ok','web',{ic:'web'}),pod('a0',0,4),pod('w2',1,1,'ok','web',{ic:'web'}),pod('a2',1,4),pod('a1',2,1,'ok','db',{ic:'db'}),pod('q',2,4,'ok',tl('queue'))],l:[['ctrl','w','d'],['ctrl','w2','d']],f:[['u','w2',2],['u','w',2]]})},
{k:'resumo',s:()=>({e:[...cp(['api','etcd','sched','ctrl']),...nd3({0:'hi',1:'hi',2:'hi'}),users(9,...UR),pod('w',0,1,'ok','web',{ic:'web'}),pod('a0',0,4),pod('w2',1,1,'ok','web',{ic:'web'}),pod('a2',1,4),pod('a1',2,1,'ok','db',{ic:'db'}),pod('q',2,4,'ok',tl('queue'))],f:[['u','w2',2],['u','w',2]]})}
]},
cluster:{min:10,lvl:'beg',mod:0,steps:[
{k:'conceito',cmd:'kubectl get nodes',s:()=>({e:[...nodes(),pod('p0',0,1,'ok','web',{ic:'web'}),pod('p1',1,1),pod('p2',2,1,'ok','db',{ic:'db'})]})},
{k:'conceito',s:()=>({e:[...cp(),...nodes(),pod('p0',0,1,'ok','web',{ic:'web'}),pod('p1',1,1),pod('p2',2,1,'ok','db',{ic:'db'})],l:[['cp','n0','d'],['cp','n1','d'],['cp','n2','d']]})},
{k:'conceito',cmd:'kubectl get pods',s:()=>({e:[kub(),...cp(['api'])],f:[['kc','api',3]]})},
{k:'conceito',s:()=>({e:[kub(),...cpb(['api','etcd'],{etcd:{b:[tl('saved'),'ok']}})],f:[['kc','api',1],['api','etcd',3]]})},
{k:'conceito',cmd:'kubectl get pods -o wide',s:()=>({e:[...cp(['sched']),...nodes({1:{st:'hi'}}),pod('p1',1,1),pod('p0',0,1,'ok','web',{ic:'web'}),pod('p2',2,1,'ok','db',{ic:'db'}),pod('p3',1,3,'new','api',{b:[tl('score'),'ok']})],l:[['sched','p3']]})},
{k:'conceito',s:()=>({e:[...cpb(['ctrl'],{ctrl:{b:[tl('want4'),'ok']}}),...nodes(),pod('p1',1,1),pod('p0',0,1,'ok','web',{ic:'web'}),pod('p2',2,1,'ok','db',{ic:'db'}),pod('p3',1,3),pod('p4',0,3,'new'),pod('p5',2,3,'new')],l:[['ctrl','p4','d'],['ctrl','p5','d']]})},
{k:'conceito',cmd:'kubectl describe node node-1',s:()=>({e:[...cp(['api']),...nodes({0:{st:'hi'},1:{st:'hi'},2:{st:'hi'}}),pod('p0',0,1,'ok','web',{ic:'web'}),pod('p1',1,1),pod('p2',2,1,'ok','db',{ic:'db'}),pod('k0',0,3,'other','kubelet',{ic:'srv'}),pod('k1',1,3,'other','kubelet',{ic:'srv'}),pod('k2',2,3,'other','kubelet',{ic:'srv'})],f:[['k0','api',1],['k1','api',1],['k2','api',1],['k0','p0',2,'hc'],['k1','p1',2,'hc'],['k2','p2',2,'hc']]})},
{k:'conceito',s:()=>({e:[...nodes(),blk('reg',...at(16.9,-13),'yellow','registry',{ic:'box',b:['loja/api:1.0']}),pod('p0',0,1,'pend','api',{b:[tl('pulling')]}),pod('p1',1,1,'pend','api',{b:[tl('pulling')]}),pod('p2',2,1,'new','api')],f:[['reg','p0',2,'heavy'],['reg','p1',2,'heavy']]})},
{k:'conceito',s:()=>({e:[...nodes(),pod('w0',0,1,'web','web',{ic:'web',b:['10.1.0.3']}),pod('a0',1,1,'ok','api',{b:['10.1.1.4']}),pod('a1',2,3,'ok','api',{b:['10.1.2.7']}),pod('d0',1,3,'ok','db',{ic:'db'})],f:[['w0','a0',2],['w0','a1',2],['a0','d0',1],['a1','d0',1]]})},
{k:'tradeoff',s:()=>({e:[kub(),...cpb([],{api:{st:'dead',b:[tl('down'),'bad']}}),...nodes(),pod('w0',0,1,'web','web',{ic:'web'}),pod('a0',1,1),pod('a1',2,1)],f:[['kc','api',2,'bad'],['w0','a0',1],['w0','a1',1]]})},
{k:'resumo',s:()=>({e:[...cp(['api','etcd','sched','ctrl']),...nodes({0:{st:'hi'},1:{st:'hi'},2:{st:'hi'}}),pod('w0',0,1,'web','web',{ic:'web'}),pod('a0',1,1),pod('a1',2,1),pod('k0',0,3,'other','kubelet',{ic:'srv'}),pod('k1',1,3,'other','kubelet',{ic:'srv'}),pod('k2',2,3,'other','kubelet',{ic:'srv'})],l:[['api','k0'],['api','k1'],['api','k2']]})}
]},
pods:{min:11,lvl:'beg',mod:1,steps:[
{k:'conceito',cmd:'kubectl run api --image=loja/api:1.0',s:()=>({e:[bigNode(),podSlab('pd','blue','pod · 10.1.0.12'),blk('ca',5,3,'orange','api',{z:22,s:2.2,h:34,ic:'box'})]})},
{k:'conceito',s:()=>({e:[bigNode(),podSlab('pd','blue','pod · 10.1.0.12'),vol('vol','yellow'),blk('ca',5,3,'orange','api',{z:22,s:2.2,h:34,ic:'box'}),blk('cl',8.4,3,'violet','log',{z:22,s:2.2,h:34,ic:'log',b:['sidecar']})],f:[['ca','cl',2]]})},
{k:'conceito',s:()=>({e:[...nodes({},2),pod('pw0',0,0,'web','web',{ic:'web',b:['× 3']}),pod('pw1',0,2,'web','web',{ic:'web'}),pod('pw2',0,4,'web','web',{ic:'web'}),pod('pdb',1,1,'ok','db',{ic:'db',b:['× 1']})],f:[['pw1','pdb',1],['pw2','pdb',1]]})},
{k:'problema',cmd:'kubectl get pods',s:()=>({e:[bigNode(),podSlab('pd','red','pod · Failed'),vol('vol','grey'),blk('ca',5,3,'orange','api',{z:22,s:2.2,h:34,st:'dead'}),blk('cl',8.4,3,'violet','log',{z:22,s:2.2,h:34,st:'dead'})]})},
{k:'conceito',s:()=>({e:[bigNode(),podSlab('pd2','green','pod · 10.1.0.47','new'),vol('vol2','yellow'),blk('ca2',5,3,'orange','api',{z:22,s:2.2,h:34,ic:'box'}),blk('cl2',8.4,3,'violet','log',{z:22,s:2.2,h:34,ic:'log'})],f:[['ca2','cl2',2]]})},
{k:'solucao',cmd:'kubectl apply -f deployment.yaml',s:()=>({e:[kub('replicas: 3'),...cp(['api','etcd'])],f:[['kc','api',2],['api','etcd',1]]})},
{k:'conceito',s:()=>({e:[...cp(['sched']),...nodes(),pod('a0',0,1,'new'),pod('a1',1,1,'new'),pod('a2',2,1,'new')],l:[['sched','a0','d'],['sched','a1','d'],['sched','a2','d']]})},
{k:'problema',cmd:'kubectl get deploy api',s:()=>({e:[...cp(['ctrl']),...nodes(),pod('a0',0,1),pod('a1',1,1,'dead','api',{b:['OOMKilled','bad']}),pod('a2',2,1)],l:[['ctrl','a1','d']]})},
{k:'solucao',s:()=>({e:[...cp(['ctrl','sched']),...nodes(),pod('a0',0,1),pod('a3',1,4,'new'),pod('a2',2,1)],l:[['sched','a3','d']]})},
{k:'problema',s:()=>({e:[...cp(['ctrl']),...nodes({2:{st:'down'}}),pod('a0',0,1),pod('a3',1,4),pod('a2',2,1,'dead')],f:[['n2','ctrl',2,'bad']]})},
{k:'solucao',cmd:'kubectl get pods -o wide',s:()=>({e:[...cp(['ctrl','sched']),...nodes({2:{st:'down'}}),pod('a0',0,1),pod('a3',1,4),pod('a4',0,4,'new')],l:[['sched','a4','d']]})},
{k:'resumo',s:()=>({e:[...cp(['ctrl']),...nodes(),pod('a0',0,1),pod('a3',1,4),pod('a4',0,4)]})}
]},
service:{min:11,lvl:'beg',mod:1,steps:[
{k:'contexto',s:()=>({e:[...nodes(),pod('w0',0,1,'web','web',{ic:'web'}),pod('b0',1,1),pod('b1',2,1),pod('b2',1,3)],f:[['w0','b0',1],['w0','b1',1],['w0','b2',1]]})},
{k:'problema',s:()=>({e:[...nodes(),pod('w0',0,1,'web','web',{ic:'web',b:['→ 10.1.2.7 ?']}),pod('b0',1,1),pod('b1',2,1,'dead','api',{b:['10.1.2.7','bad']}),pod('b2',1,3),pod('b3',2,3,'new','api',{b:['10.1.2.9','ok']})],f:[['w0','b1',3,'bad']]})},
{k:'solucao',cmd:'kubectl expose deployment api --port=80',s:()=>({e:[...nodes(),SV('api'),pod('w0',0,1,'web','web',{ic:'web'}),pod('b0',1,1),pod('b2',1,3),pod('b3',2,3)],l:[['w0','sv'],['sv','b0'],['sv','b2'],['sv','b3']]})},
{k:'conceito',s:()=>({e:[...nodes(),SV('app=api'),pod('w0',0,1,'web','web',{ic:'web',b:['app=web']}),pod('b0',1,1,'ok','api',{b:['app=api','ok']}),pod('b2',1,3,'ok','api',{b:['app=api','ok']}),pod('b3',2,3,'ok','api',{b:['app=api','ok']})],l:[['sv','b0','d'],['sv','b2','d'],['sv','b3','d']]})},
{k:'conceito',s:()=>({e:[...nodes(),SV('api'),pod('w0',0,1,'web','web',{ic:'web'}),pod('b0',1,1,'ok','api',{m:34}),pod('b2',1,3,'ok','api',{m:33}),pod('b3',2,3,'ok','api',{m:35})],f:[['w0','sv',3],['sv','b0',1],['sv','b2',1],['sv','b3',1]]})},
{k:'problema',s:()=>({e:[...nodes(),SV('api'),pod('w0',0,1,'web','web',{ic:'web'}),pod('b0',1,1,'ok','api',{m:34}),pod('b2',1,3,'ok','api',{b:[tl('probeFail'),'bad']}),pod('b3',2,3,'ok','api',{m:35}),pod('k1',1,5,'other','kubelet',{ic:'srv'})],f:[['w0','sv',3],['sv','b0',1],['sv','b3',1],['sv','b2',1,'bad'],['k1','b2',2,'hc']]})},
{k:'solucao',cmd:'kubectl get endpoints api',s:()=>({e:[...nodes(),SV('api'),pod('w0',0,1,'web','web',{ic:'web'}),pod('b0',1,1,'ok','api',{m:50}),pod('b2',1,3,'dead','api',{b:[tl('outOfList'),'bad']}),pod('b3',2,3,'ok','api',{m:51}),pod('k1',1,5,'other','kubelet',{ic:'srv'})],f:[['w0','sv',3],['sv','b0',2],['sv','b3',2],['k1','b2',2,'hc']]})},
{k:'problema',s:()=>({e:[...nodes(),users(9),SV(tl('internal')),pod('w0',0,1,'web','web',{ic:'web'}),pod('b0',1,1),pod('b2',1,3,'new'),pod('b3',2,3)],f:[['u','sv',3,'bad']]})},
{k:'solucao',cmd:'kubectl get ingress',s:()=>({e:[...nodes(),users(9),ING(),SV('api'),pod('w0',0,1,'web','web',{ic:'web'}),pod('b0',1,1),pod('b2',1,3),pod('b3',2,3)],f:[['u','ing',3],['ing','sv',2],['sv','b0',1],['sv','b2',1],['sv','b3',1]]})},
{k:'conceito',s:()=>({e:[...nodes(),users(9,...at(24,-24)),blk('ing',...at(9.3,-18),'yellow','Ingress',{ic:'globe',b:['https://loja.com']}),blk('ws',...at(1.7,-6.1),'orange','Service',{ic:'svc',b:['/']}),SV('/api'),pod('w0',0,1,'web','web',{ic:'web'}),pod('w1',0,3,'web','web',{ic:'web'}),pod('b0',1,1),pod('b2',1,3),pod('b3',2,3)],f:[['u','ing',3],['ing','ws',1],['ing','sv',2],['ws','w0',1],['ws','w1',1],['sv','b0',1],['sv','b2',1],['sv','b3',1]]})},
{k:'resumo',s:()=>({e:[...nodes(),users(9,...at(24,-24)),blk('ing',...at(9.3,-18),'yellow','Ingress',{ic:'globe',b:['https://loja.com']}),blk('ws',...at(1.7,-6.1),'orange','Service',{ic:'svc',b:['/']}),SV('/api'),pod('w0',0,1,'web','web',{ic:'web'}),pod('w1',0,3,'web','web',{ic:'web'}),pod('b0',1,1),pod('b2',1,3),pod('b3',2,3)],f:[['u','ing',3],['ing','ws',1],['ing','sv',2],['ws','w0',1],['ws','w1',1],['sv','b0',1],['sv','b2',1],['sv','b3',1]]})}
]},
escala:{min:12,lvl:'int',mod:2,steps:[
{k:'contexto',s:()=>({e:[...nodes({},2),UE(4),hpa(),SVE(),pod('e0',0,1,'ok','api',{m:30}),pod('e1',1,1,'ok','api',{m:31})],f:[['u','sv',1],['sv','e0',1],['sv','e1',1]]})},
{k:'problema',s:()=>({e:[...nodes({},2),UE(9),hpa(),SVE(),pod('e0',0,1,'ok','api',{m:95}),pod('e1',1,1,'ok','api',{m:94})],f:[['u','sv',4],['sv','e0',3,'heavy'],['sv','e1',3,'heavy'],['sv','e0',1,'bad']]})},
{k:'tradeoff',s:()=>({e:[...nodes({},2),UE(9),hpa(),SVE(),pod('e0',0,1,'pend','api',{b:[tl('restarting'),'bad']}),pod('e1',1,1,'ok','api',{m:99,b:['2 → 4 CPU']})],f:[['u','sv',4],['sv','e1',4,'heavy'],['sv','e1',1,'bad']]})},
{k:'solucao',cmd:'kubectl scale deployment api --replicas=4',s:()=>({e:[...nodes({},2),UE(9),hpa(),SVE(),pod('e0',0,1,'ok','api',{m:50}),pod('e1',1,1,'ok','api',{m:49}),pod('e2',0,0,'new','api'),pod('e3',1,0,'new','api')],f:[['u','sv',4],['sv','e0',2,'heavy'],['sv','e1',2,'heavy'],['sv','e2',2,'heavy'],['sv','e3',2,'heavy']]})},
{k:'conceito',s:()=>({e:[...nodes({},2),UE(9),hpa(),SVE(),pod('e0',0,1,'ok','api',{m:50,b:['request: 0.5 CPU']}),pod('e1',1,1,'ok','api',{m:49}),pod('e2',0,0,'ok','api'),pod('e3',1,0,'ok','api')],f:[['u','sv',3],['sv','e0',1],['sv','e1',1],['sv','e2',1],['sv','e3',1]]})},
{k:'solucao',cmd:'kubectl autoscale deployment api --cpu-percent=70 --min=2 --max=10',s:()=>({e:[...nodes({},2),UE(9),hpa('hi','4 → 6'),SVE(),pod('e0',0,1,'ok','api',{m:66}),pod('e1',1,1,'ok','api',{m:64}),pod('e2',0,0,'ok','api'),pod('e3',1,0,'ok','api'),pod('e4',0,2,'new','api'),pod('e5',1,2,'new','api')],l:[['hpa','e4','d']],f:[['u','sv',4],['sv','e0',1,'heavy'],['sv','e1',1,'heavy'],['sv','e2',1],['sv','e3',1],['sv','e4',1],['sv','e5',1]]})},
{k:'problema',cmd:'kubectl get pods --field-selector=status.phase=Pending',s:()=>({e:[...nodes({},2),UE(9),hpa('hi','6 → 7'),SVE(),pod('e0',0,1,'ok','api',{m:82}),pod('e1',1,1,'ok','api',{m:80}),pod('e2',0,0),pod('e3',1,0),pod('e4',0,2),pod('e5',1,2),...others(),pod('e6',2,1,'pend','api',{b:['Pending','bad'],z:0})],f:[['u','sv',4],['sv','e0',1,'heavy'],['sv','e1',1,'heavy'],['sv','e2',1],['sv','e3',1],['sv','e4',1],['sv','e5',1]]})},
{k:'solucao',s:()=>({e:[...nodes({2:{st:'new'}}),UE(9),hpa('',tl('pods7')),SVE(),pod('e0',0,1,'ok','api',{m:63}),pod('e1',1,1,'ok','api',{m:62}),pod('e2',0,0),pod('e3',1,0),pod('e4',0,2),pod('e5',1,2),...others(),pod('e6',2,1,'new','api',{m:58})],f:[['u','sv',4],...['e0','e1','e2','e3','e4','e5','e6'].map(p=>['sv',p,1])]})},
{k:'conceito',s:()=>({e:[...nodes({},2),UE(2),hpa('','7 → 2'),SVE(),pod('e0',0,1,'ok','api',{m:22}),pod('e1',1,1,'ok','api',{m:21}),...others()],f:[['u','sv',1],['sv','e0',1],['sv','e1',1]]})},
{k:'tradeoff',s:()=>({e:[...nodes({2:{st:'new'}}),UE(9),hpa('hi','2 → 7'),SVE(),pod('e0',0,1,'ok','api',{m:96}),pod('e1',1,1,'ok','api',{m:97}),...others(),pod('e6',2,1,'pend','api',{b:[tl('booting')]}),pod('e7',2,0,'pend','api'),pod('e8',2,2,'pend','api')],f:[['u','sv',4],['sv','e0',2,'heavy'],['sv','e1',2,'heavy'],['sv','e0',1,'bad']]})},
{k:'resumo',s:()=>({e:[...nodes(),UE(9),hpa('',tl('auto')),SVE(),pod('e0',0,1,'ok','api',{m:60}),pod('e1',1,1,'ok','api',{m:61}),pod('e6',2,1,'ok','api',{m:59})],f:[['u','sv',3],['sv','e0',1],['sv','e1',1],['sv','e6',1]]})}
]},
rollout:{min:11,lvl:'int',mod:2,steps:[
{k:'contexto',s:()=>({e:[...nodes(),UR6(),SV(),pod('r1a',0,1,'ok','v1'),pod('r1b',1,1,'ok','v1'),pod('r1c',2,1,'ok','v1')],f:[['u','sv',3],['sv','r1a',1],['sv','r1b',1],['sv','r1c',1]]})},
{k:'problema',s:()=>({e:[...nodes(),UR6(),SV(tl('maint'),undefined,undefined),pod('r1a',0,1,'dead','v1'),pod('r1b',1,1,'dead','v1'),pod('r1c',2,1,'dead','v1')],f:[['u','sv',4,'bad']]})},
{k:'solucao',cmd:'kubectl set image deployment/api api=loja/api:2.0',s:()=>({e:[...nodes(),UR6(),SV(),pod('r1a',0,1,'ok','v1'),pod('r1b',1,1,'ok','v1'),pod('r1c',2,1,'ok','v1'),pod('r2a',0,3,'pend','v2')],f:[['u','sv',3],['sv','r1a',1],['sv','r1b',1],['sv','r1c',1]]})},
{k:'conceito',s:()=>({e:[...nodes(),UR6(),SV(),pod('r1a',0,1,'ok','v1'),pod('r1b',1,1,'ok','v1'),pod('r1c',2,1,'ok','v1'),pod('r2a',0,3,'pend','v2',{b:['GET /health …']}),pod('k0',0,5,'other','kubelet',{ic:'srv'})],f:[['u','sv',3],['sv','r1a',1],['sv','r1b',1],['sv','r1c',1],['k0','r2a',2,'hc']]})},
{k:'solucao',s:()=>({e:[...nodes(),UR6(),SV(),pod('r2a',0,3,'v2','v2',{b:['200 OK','ok']}),pod('r1b',1,1,'ok','v1'),pod('r1c',2,1,'ok','v1')],f:[['u','sv',3],['sv','r2a',1],['sv','r1b',1],['sv','r1c',1]]})},
{k:'tradeoff',s:()=>({e:[...nodes(),UR6(),SV(),pod('r2a',0,3,'v2','v2'),pod('r2b',1,3,'v2','v2'),pod('r1c',2,1,'ok','v1'),pod('r2c',2,3,'pend','v2')],f:[['u','sv',3],['sv','r2a',1],['sv','r2b',1],['sv','r1c',1]]})},
{k:'solucao',cmd:'kubectl rollout status deployment/api',s:()=>({e:[...nodes(),UR6(),SV(),pod('r2a',0,3,'v2','v2'),pod('r2b',1,3,'v2','v2'),pod('r2c',2,3,'v2','v2')],f:[['u','sv',3],['sv','r2a',1],['sv','r2b',1],['sv','r2c',1]]})},
{k:'problema',s:()=>({e:[...nodes(),UR6(),SV(),pod('r2a',0,3,'v2','v2',{b:['500','bad']}),pod('r2b',1,3,'v2','v2'),pod('r2c',2,3,'v2','v2',{b:['500','bad']})],f:[['u','sv',3],['sv','r2a',1,'bad'],['sv','r2b',1],['sv','r2c',1,'bad']]})},
{k:'solucao',cmd:'kubectl rollout undo deployment/api',s:()=>({e:[...nodes(),UR6(),SV(),pod('r3a',0,1,'new','v1'),pod('r3b',1,1,'new','v1'),pod('r3c',2,1,'new','v1')],f:[['u','sv',3],['sv','r3a',1],['sv','r3b',1],['sv','r3c',1]]})},
{k:'conceito',s:()=>({e:[...nodes(),UR6(),SV(),pod('r3a',0,1,'ok','v1'),pod('r3b',1,1,'dead','v1',{b:[tl('frozen'),'bad']}),pod('r3c',2,1,'ok','v1'),pod('k1',1,5,'other','kubelet',{ic:'srv'})],f:[['u','sv',3],['sv','r3a',2],['sv','r3c',2],['k1','r3b',2,'hc']]})},
{k:'resumo',s:()=>({e:[...nodes(),UR6(),SV(),pod('r3a',0,1,'ok','v1'),pod('r3b',1,1,'new','v1',{b:[tl('restarted'),'ok']}),pod('r3c',2,1,'ok','v1')],f:[['u','sv',3],['sv','r3a',1],['sv','r3b',1],['sv','r3c',1]]})}
]},
config:{min:12,lvl:'int',mod:1,steps:[
{k:'problema',s:()=>({e:[...nodes({},2),CF.api('a0',0,{b:['DB_HOST=prod-db','bad']}),CF.api('a1',1),blk('img',...at(9,-15),'paper','loja/api',{s:2,h:30,ic:'box',b:[tl('rebuild')]})],f:[['img','a0',1],['img','a1',1]]})},
{k:'solucao',cmd:'kubectl create configmap loja-config --from-literal=DB_HOST=db',s:()=>({e:[...nodes({},2),CF.api('a0',0),CF.api('a1',1),CF.cm()],l:[['cm','a0'],['cm','a1']]})},
{k:'conceito',s:()=>({e:[...nodes({},2),CF.api('a0',0,{b:['env']}),CF.api('a1',1,{b:['/etc/config']}),CF.cm()],l:[['cm','a0'],['cm','a1']]})},
{k:'tradeoff',cmd:'kubectl rollout restart deployment/api',s:()=>({e:[...nodes({},2),CF.api('a0',0,{b:[tl('old'),'bad']}),CF.api('a1',1,{b:[tl('updated'),'ok']}),CF.cm('v2')],l:[['cm','a1']],f:[['cm','a1',1]]})},
{k:'solucao',cmd:'kubectl create secret generic db-cred --from-literal=password=s3nh4',s:()=>({e:[...nodes({},2),CF.api('a0',0),CF.api('a1',1),CF.cm(),CF.sec('base64')],l:[['cm','a0'],['cm','a1'],['sec','a0'],['sec','a1']]})},
{k:'conceito',cmd:'kubectl create secret tls loja-tls --cert=tls.crt --key=tls.key',s:()=>({e:[...nodes({},2),CF.api('a0',0),CF.api('a1',1),CF.sec('docker-registry'),blk('reg',...at(26,-14),'yellow','registry',{s:2,h:30,ic:'lock',b:[tl('private')]})],l:[['sec','a1']],f:[['reg','a1',2,'heavy']]})},
{k:'problema',s:()=>({e:[...nodes({},2),CF.api('a0',0,{b:['uid 0 (root)','bad'],m:null}),CF.api('a1',1),blk('atk',...at(-9,-12),'red',tl('attacker'),{s:1.9,h:30,ic:'user'})],f:[['atk','a0',2,'bad'],['a0','n0',1,'bad']]})},
{k:'solucao',s:()=>({e:[...nodes({},2),CF.api('a0',0,{st:'new',b:['uid 1000','ok']}),CF.api('a1',1,{st:'new',b:['uid 1000','ok']}),blk('atk',...at(-9,-12),'red',tl('attacker'),{s:1.9,h:30,ic:'user'})],f:[['atk','a0',2,'bad']]})},
{k:'conceito',s:()=>({e:[...nodes({},2),CF.api('a0',0,{st:'new',b:['drop: ALL']}),CF.api('a1',1,{st:'new',b:['+NET_BIND_SERVICE']})]})},
{k:'conceito',cmd:'kubectl label ns loja pod-security.kubernetes.io/enforce=restricted',s:()=>({e:[node(0,{lb:'ns: loja · restricted',c:'violet'}),node(1,{lb:'node-2'}),CF.api('a0',0,{st:'new'}),pod('bad',0,4,'pend','root',{b:[tl('rejected'),'bad']}),blk('apis',...at(9,-15),'violet','API server',{s:2,h:30,ic:'shield'})],f:[['apis','bad',2,'bad']]})},
{k:'resumo',s:()=>({e:[...nodes({},2),CF.api('a0',0,{st:'new'}),CF.api('a1',1,{st:'new'}),CF.cm(),CF.sec()],l:[['cm','a0'],['cm','a1'],['sec','a0'],['sec','a1']]})}
]},
storage:{min:13,lvl:'int',mod:1,steps:[
{k:'problema',s:()=>({e:[...nodes({},2),pod('db',0,1,'dead','db',{ic:'db',b:[tl('dataLost'),'bad']}),pod('db2',1,1,'new','db',{ic:'db',b:[tl('empty')]})]})},
{k:'conceito',s:()=>({e:[...nodes({},2),pod('w',0,1,'web','web',{ic:'web',b:['emptyDir']}),pod('lg',0,2,'v2','log',{ic:'log'}),pod('db',1,1,'ok','db',{ic:'db',b:['hostPath']}),blk('hd',...at(19,10),'yellow','/data',{s:1.7,h:20,ic:'db'})],l:[['w','lg'],['db','hd']]})},
{k:'problema',s:()=>({e:[...nodes({},2),pod('db',1,4,'new','db',{ic:'db',b:[tl('empty'),'bad']}),blk('hd',...at(3,10),'yellow','/data',{s:1.7,h:20,ic:'db',b:[tl('stuck')]})],f:[['hd','db',1,'bad']]})},
{k:'conceito',cmd:'kubectl get pv',s:()=>({e:[...nodes({},2),ST.pv('Available')]})},
{k:'conceito',cmd:'kubectl get pvc',s:()=>({e:[...nodes({},2),ST.pv('Bound'),ST.pvc('Bound')],l:[['pvc','pv']]})},
{k:'solucao',s:()=>({e:[...nodes({},2),ST.pv('Bound'),ST.pvc('Bound'),pod('db',1,1,'ok','db',{ic:'db',b:['claimName: dados']})],l:[['pvc','pv'],['db','pvc']]})},
{k:'conceito',s:()=>({e:[...nodes({},2),ST.pv('RWO'),pod('db',0,1,'ok','db',{ic:'db'}),pod('db2',1,1,'pend','db',{ic:'db',b:['RWO: '+tl('busy'),'bad']})],l:[['db','pv']]})},
{k:'conceito',cmd:'kubectl get storageclass',s:()=>({e:[...nodes({},2),ST.sc(),ST.pvc('Pending'),ST.pv('Bound',1)],f:[['pvc','sc',1],['sc','pv',1,'heavy']]})},
{k:'conceito',s:()=>({e:[...nodes({},2),ST.sc('WaitForFirstConsumer'),ST.pvc('Bound'),ST.pv('zona-b',1),pod('db',1,1,'new','db',{ic:'db'})],l:[['db','pvc'],['pvc','pv']]})},
{k:'tradeoff',cmd:'kubectl patch pv pv-dados -p \'{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}\'',s:()=>({e:[...nodes({},2),ST.sc(),ST.pv('Released',1,'bad'),blk('pvc',...ST.PVC,'yellow','PVC',{s:2,h:28,ic:'link',st:'dead'})]})},
{k:'conceito',cmd:'kubectl edit pvc dados',s:()=>({e:[...nodes({},2),ST.sc('allowVolumeExpansion'),ST.pvc('10Gi → 20Gi'),ST.pv('20Gi',1),pod('db',1,1,'ok','db',{ic:'db'})],l:[['db','pvc'],['pvc','pv']]})},
{k:'resumo',s:()=>({e:[...nodes({},2),ST.sc(),ST.pvc('Bound'),ST.pv('Bound',1),pod('db',1,1,'ok','db',{ic:'db'})],l:[['db','pvc'],['pvc','pv'],['pvc','sc','d']]})}
]},
sched:{min:13,lvl:'int',mod:2,steps:[
{k:'contexto',s:()=>({e:[...nodes(),SC.s(),pod('p0',0,1),pod('p1',1,1),pod('p9',1,3,'new','api',{b:[tl('score')+'','ok']})],l:[['sch','p9']]})},
{k:'conceito',s:()=>({e:[...nodes(),pod('g',0,1,'ok','api',{b:['Guaranteed','ok']}),pod('b',1,1,'web','web',{ic:'web',b:['Burstable']}),pod('be',2,1,'other','batch',{b:['BestEffort','bad']})]})},
{k:'problema',s:()=>({e:[...nodes({1:{c:'red',lb:'node-2 · MemoryPressure'}}),pod('g',0,1,'ok','api'),pod('b',1,1,'web','web',{ic:'web',m:99}),pod('be',1,3,'dead','batch',{b:[tl('evicted'),'bad']}),pod('b2',1,4,'other','batch',{m:97})]})},
{k:'solucao',cmd:'kubectl create quota loja --hard=requests.cpu=4,pods=10 -n loja',s:()=>({e:[node(0,{lb:'ns: loja · quota',c:'violet'}),...nodes().slice(1),pod('g',0,1,'ok','api'),pod('g2',0,2,'ok','api'),pod('x',0,4,'pend','api',{b:['exceeded quota','bad']}),blk('apis',...at(9,-15),'violet','API server',{s:2,h:30,ic:'shield'})],f:[['apis','x',2,'bad']]})},
{k:'conceito',cmd:'kubectl label node node-2 disktype=ssd',s:()=>({e:[...nodes({1:{lb:'node-2 · disktype=ssd',st:'hi'}}),SC.s(),pod('db',1,1,'new','db',{ic:'db',b:['nodeSelector']})],l:[['sch','db']]})},
{k:'conceito',s:()=>({e:[...nodes({0:{lb:'node-1 · zone=a'},1:{lb:'node-2 · zone=b',st:'hi'},2:{lb:'node-3 · zone=b'}}),SC.s(),pod('p',1,1,'new','api',{b:['required: zone=b']}),pod('p2',2,1,'ok','api',{b:['preferred']})],l:[['sch','p'],['sch','p2','d']]})},
{k:'conceito',s:()=>({e:[...nodes(),SC.s(),pod('r0',0,1,'ok','api'),pod('r1',1,1,'ok','api'),pod('r2',2,1,'new','api',{b:['anti-affinity']})],l:[['sch','r2']]})},
{k:'conceito',cmd:'kubectl taint nodes node-3 gpu=true:NoSchedule',s:()=>({e:[...nodes({2:{lb:'node-3 · taint gpu',c:'yellow'}}),SC.s(),pod('p',0,1),pod('p1',1,1),pod('ml',2,1,'v2','ml',{b:['toleration','ok']}),pod('x',1,4,'pend','api',{b:[tl('refused'),'bad']})],l:[['sch','ml']]})},
{k:'tradeoff',s:()=>({e:[...nodes({2:{lb:'node-3 · taint gpu',c:'yellow'}}),SC.s(),pod('p',0,1),pod('ml',1,1,'v2','ml',{b:[tl('wrongNode'),'bad']})],l:[['sch','ml']]})},
{k:'conceito',cmd:'kubectl drain node-2 --ignore-daemonsets --delete-emptydir-data',s:()=>({e:[...nodes({1:{lb:'node-2 · SchedulingDisabled',c:'grey'}}),SC.s(),pod('p',0,1),pod('m1',0,2,'new','api'),pod('m2',2,1,'new','api')],l:[['sch','m1','d'],['sch','m2','d']]})},
{k:'conceito',s:()=>({e:[node(0,{lb:'controlplane',c:'violet'}),...nodes().slice(1),pod('s0',0,0,'v2','etcd',{ic:'db',b:['/etc/kubernetes/manifests']}),pod('s1',0,2,'v2','api',{ic:'api'}),pod('s2',0,4,'v2','sched',{ic:'cal'}),pod('k',0,5,'other','kubelet',{ic:'srv'}),pod('m',2,1,'new','api',{b:['nodeName: node-3']})],f:[['k','s0',1,'hc'],['k','s1',1,'hc'],['k','s2',1,'hc']]})},
{k:'resumo',s:()=>({e:[...nodes({1:{lb:'node-2 · disktype=ssd'},2:{lb:'node-3 · taint gpu',c:'yellow'}}),SC.s(),pod('p',0,1),pod('db',1,1,'ok','db',{ic:'db'}),pod('ml',2,1,'v2','ml')]})}
]},
trouble:{min:14,lvl:'int',mod:3,steps:[
{k:'contexto',cmd:'kubectl get pods -A | grep -v Running',s:()=>({e:[kub('get · describe · logs'),...cp(['api']),...nodes(),pod('ok0',0,1),pod('pe',1,1,'pend','api',{b:['Pending','bad']}),pod('cr',2,1,'dead','api',{b:['CrashLoopBackOff','bad']}),pod('ip',0,3,'pend','web',{b:['ImagePullBackOff','bad']})],f:[['kc','api',2]]})},
{k:'problema',cmd:'kubectl describe pod web',s:()=>({e:[...nodes(),blk('reg',...at(16.9,-14),'yellow','registry',{s:2.1,h:30,ic:'box',b:['nginx:1.2O ?','bad']}),pod('ok0',0,1),pod('ip',0,3,'pend','web',{b:['ImagePullBackOff','bad']}),pod('ok1',1,1),pod('ok2',2,1)],f:[['reg','ip',2,'bad']]})},
{k:'problema',s:()=>({e:[...cp(['sched']),...nodes(),pod('ok0',0,1,'ok','api',{m:95}),pod('ok1',1,1,'ok','api',{m:96}),pod('ok2',2,1,'ok','api',{m:94}),pod('pe',1,4,'pend','api',{b:['Insufficient cpu','bad']})],f:[['sched','pe',2,'bad']]})},
{k:'problema',cmd:'kubectl logs api-7d9 --previous',s:()=>({e:[KB('logs --previous'),...nodes(),pod('ok0',0,1),pod('cr',2,1,'dead','api',{b:['exit 137 · OOMKilled','bad']}),pod('ok1',1,1)],f:[['cr','kc',2]]})},
{k:'problema',cmd:'kubectl get endpoints web',s:()=>({e:[...nodes(),SV('selector: app=wbe'),pod('w0',0,1,'web','web',{ic:'web',b:['app=web']}),pod('w1',1,1,'web','web',{ic:'web',b:['app=web']}),users(6)],f:[['u','sv',3,'bad']]})},
{k:'problema',cmd:'kubectl describe node node-3',s:()=>({e:[...cp(['ctrl']),...nodes({2:{c:'red',lb:'node-3 · NotReady'}}),pod('ok0',0,1),pod('ok1',1,1),pod('k2',2,5,'dead','kubelet',{b:['inactive','bad']}),pod('x',2,1,'pend','api')],f:[['k2','api',2,'bad']]})},
{k:'solucao',cmd:'systemctl restart kubelet',s:()=>({e:[...cp(['api']),...nodes({2:{st:'new'}}),pod('ok0',0,1),pod('ok1',1,1),pod('k2',2,5,'new','kubelet',{ic:'srv',b:['/var/lib/kubelet/config.yaml']}),pod('x',2,1,'ok','api')],f:[['k2','api',2]]})},
{k:'problema',s:()=>({e:[kub('connection refused :6443'),...cp([],undefined),...nodes(),pod('ok0',0,1),pod('ok1',1,1),pod('ok2',2,1)],f:[['kc','api',3,'bad']],dead:['api']})},
{k:'solucao',cmd:'crictl ps -a | grep kube-apiserver',s:()=>({e:[node(0,{lb:'controlplane',c:'violet'}),...nodes().slice(1),pod('se',0,0,'v2','etcd',{ic:'db'}),pod('sa',0,2,'dead','apiserver',{b:['/etc/kubernetes/manifests','bad']}),pod('ss',0,4,'v2','sched',{ic:'cal'}),blk('cri',...at(-7,-9),'orange','crictl',{s:1.9,h:30,ic:'term'}),pod('ok1',1,1),pod('ok2',2,1)],f:[['cri','sa',2,'hc'],['cri','se',1,'hc']]})},
{k:'problema',s:()=>({e:[...cp([]),...nodes(),pod('p0',0,1,'pend','api',{b:['Pending']}),pod('p1',1,1,'pend','api'),pod('p2',2,1,'pend','api')],dead:['sched']})},
{k:'resumo',s:()=>({e:[...cp(['api','etcd','sched','ctrl']),...nodes({0:{st:'new'},1:{st:'new'},2:{st:'new'}}),pod('ok0',0,1),pod('ok1',1,1),pod('ok2',2,1)]})}
]},
observ:{min:12,lvl:'int',mod:2,steps:[
{k:'contexto',cmd:'kubectl logs -f deploy/api',s:()=>({e:[KB('logs'),...nodes({},2),pod('a0',0,1),pod('a1',1,1)],f:[['a0','kc',2]]})},
{k:'conceito',cmd:'kubectl logs api-7d9 -c log-shipper',s:()=>({e:[KB('-c app | -c log'),...nodes({},2),pod('a0',0,1,'ok','app',{b:['-c app']}),pod('l0',0,2,'v2','log',{ic:'log',b:['-c log']}),pod('a1',1,1)],f:[['a0','kc',1],['l0','kc',1]]})},
{k:'conceito',s:()=>({e:[...nodes({},2),pod('a0',0,1),pod('a1',1,1),pod('f0',0,5,'other','fluent-bit',{ic:'log',b:['/var/log/pods']}),pod('f1',1,5,'other','fluent-bit',{ic:'log'}),blk('lk',...at(9.3,-15),'yellow','Loki',{s:2.2,h:30,ic:'db'})],f:[['f0','lk',2],['f1','lk',2]]})},
{k:'conceito',cmd:'kubectl get events -A --sort-by=.lastTimestamp',s:()=>({e:[...nodes({},2),blk('ev',...at(9.3,-15),'yellow','events',{s:2.1,h:30,ic:'log',b:['Scheduled · Pulled · Started']}),pod('a0',0,1),pod('a1',1,1,'dead','api',{b:['BackOff','bad']})],f:[['a0','ev',1],['a1','ev',1,'bad']]})},
{k:'conceito',cmd:'kubectl top pods -A --sort-by=memory',s:()=>({e:[...nodes({},2),blk('ms',...at(9.3,-15),'violet','metrics-server',{s:2.2,h:30,ic:'gauge'}),pod('a0',0,1,'ok','api',{m:35}),pod('a1',1,1,'ok','api',{m:86}),pod('k0',0,5,'other','kubelet',{ic:'srv'}),pod('k1',1,5,'other','kubelet',{ic:'srv'})],f:[['k0','ms',1],['k1','ms',1]]})},
{k:'conceito',cmd:'kubectl port-forward svc/api 8080:80',s:()=>({e:[KB(),...nodes({},2),pod('a0',0,1,'ok','api',{b:['exec -it -- sh']}),pod('a1',1,1,'ok','api',{b:['port-forward 8080:80']})],f:[['kc','a0',1],['kc','a1',2]]})},
{k:'conceito',cmd:'kubectl debug -it api-7d9 --image=busybox --target=api',s:()=>({e:[KB(),...nodes({},2),pod('a0',0,1,'ok','distroless',{b:[tl('noShell')]}),pod('dbg',0,2,'new','debug',{ic:'term',b:['ephemeral']}),pod('a1',1,1)],f:[['kc','dbg',2],['dbg','a0',1,'hc']]})},
{k:'conceito',cmd:"kubectl get pods -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName",s:()=>({e:[KB('-o jsonpath'),...cp(['api']),...nodes(),pod('a0',0,1),pod('a1',1,1),pod('a2',2,1)],f:[['api','kc',2]]})},
{k:'tradeoff',cmd:'kubectl api-resources | grep -i ingress',s:()=>({e:[...nodes({},2),blk('old',...at(3,-15),'grey','extensions/v1beta1',{s:2.2,h:30,ic:'log',st:'dead',b:[tl('removed'),'bad']}),blk('new',...at(16,-15),'green','networking.k8s.io/v1',{s:2.2,h:30,ic:'log',b:['Ingress','ok']}),pod('a0',0,1),pod('a1',1,1)],l:[['new','a1']]})},
{k:'resumo',s:()=>({e:[KB(),...nodes({},2),blk('ms',...at(9.3,-15),'violet','metrics-server',{s:2.2,h:30,ic:'gauge'}),pod('a0',0,1,'ok','api',{m:35}),pod('a1',1,1,'ok','api',{m:40})],f:[['a0','kc',1],['a1','kc',1]]})}
]},
kubeadm:{min:15,lvl:'int',mod:3,steps:[
{k:'contexto',s:()=>({e:[...KA.n(),...[0,1,2].flatMap(i=>[pod('rt'+i,i,1,'other','containerd',{ic:'box'}),pod('kl'+i,i,3,'other','kubelet',{ic:'srv'})]),blk('pk',...at(15,-15),'paper','kubeadm',{s:2.2,h:30,ic:'term',b:['swap off · ip_forward=1']})]})},
{k:'solucao',cmd:'kubeadm init --pod-network-cidr=10.244.0.0/16',s:()=>({e:[...KA.n(),...KA.cp(),blk('pk',...at(15,-15),'paper','kubeadm',{s:2.2,h:30,ic:'term',b:['init']})],f:[['pk','ka',2]]})},
{k:'problema',s:()=>({e:[...KA.n({0:'NotReady'}),...KA.cp(),pod('dns',0,4,'pend','coredns',{ic:'globe',b:[tl('noCni'),'bad']})]})},
{k:'solucao',cmd:'kubectl apply -f calico.yaml',s:()=>({e:[...KA.n(),...KA.cp(),pod('dns',0,4,'ok','coredns',{ic:'globe'}),pod('cn0',0,1,'new','cni',{ic:'svc'})]})},
{k:'solucao',cmd:'kubeadm token create --print-join-command',s:()=>({e:[...KA.n({1:'new',2:'new'}),...KA.cp(),pod('dns',0,4,'ok','coredns',{ic:'globe'}),pod('cn0',0,1,'ok','cni',{ic:'svc'}),pod('kl1',1,1,'new','kubelet',{ic:'srv',b:['kubeadm join']}),pod('kl2',2,1,'new','kubelet',{ic:'srv'})],f:[['kl1','ka',2],['kl2','ka',2]]})},
{k:'conceito',cmd:'kubectl config use-context prod',s:()=>({e:[kub('context: prod'),...KA.n(),...KA.cp(),blk('kcf',...at(-9,-20),'yellow','~/.kube/config',{s:2,h:28,ic:'log',b:['clusters · users · contexts']})],l:[['kcf','kc']],f:[['kc','ka',2]]})},
{k:'conceito',cmd:'kubeadm upgrade plan',s:()=>({e:[...KA.n({0:'v1.31 → 1.32'}),...KA.cp(),pod('kl1',1,1,'other','kubelet',{ic:'srv',b:['v1.31']}),pod('kl2',2,1,'other','kubelet',{ic:'srv',b:['v1.31']})]})},
{k:'solucao',cmd:'kubeadm upgrade apply v1.32.0',s:()=>({e:[...KA.n({0:'v1.32',1:'drain'}),...KA.cp(true),pod('kl1',1,1,'pend','kubelet',{ic:'srv',b:['kubeadm upgrade node']}),pod('kl2',2,1,'other','kubelet',{ic:'srv',b:['v1.31']}),pod('mv',2,3,'new','api')]})},
{k:'solucao',cmd:'ETCDCTL_API=3 etcdctl snapshot save /opt/backup.db',s:()=>({e:[...KA.n(),...KA.cp(true,'etcd'),blk('snap',...at(-9,-14),'yellow','snapshot.db',{s:2,h:26,ic:'db'})],f:[['ke','snap',2,'heavy']]})},
{k:'solucao',cmd:'etcdctl snapshot restore /opt/backup.db --data-dir /var/lib/etcd-restore',s:()=>({e:[...KA.n(),...KA.cp(true,'etcd'),blk('snap',...at(-9,-14),'yellow','snapshot.db',{s:2,h:26,ic:'db',b:['--data-dir']})],f:[['snap','ke',2,'heavy']]})},
{k:'conceito',s:()=>({e:[node(0,{lb:'cp-1',c:'violet'}),node(1,{lb:'cp-2',c:'violet'}),node(2,{lb:'cp-3',c:'violet'}),...[0,1,2].flatMap(i=>[pod('ha'+i,i,1,'v2','apiserver',{ic:'api'}),pod('he'+i,i,3,'v2','etcd',{ic:'db'})]),blk('lb',...at(15,-15),'orange','load balancer',{s:2.3,h:30,ic:'svc',b:[':6443']})],f:[['lb','ha0',1],['lb','ha1',1],['lb','ha2',1]]})},
{k:'conceito',cmd:'kubeadm certs check-expiration',s:()=>({e:[...KA.n(),...KA.cp(true),blk('pki',...at(-9,-14),'yellow','/etc/kubernetes/pki',{s:2.1,h:28,ic:'lock',b:[tl('oneYear')]})],l:[['pki','ka']]})},
{k:'resumo',s:()=>({e:[...KA.n({1:'new',2:'new'}),...KA.cp(true),pod('kl1',1,1,'ok','kubelet',{ic:'srv'}),pod('kl2',2,1,'ok','kubelet',{ic:'srv'})]})}
]},
probes:{min:11,lvl:'int',mod:2,steps:[
{k:'contexto',s:()=>({e:[...nodes({},2),UE(6),SVE(),pod('p0',0,1),pod('p1',1,1)],f:[['u','sv',2],['sv','p0',1],['sv','p1',1]]})},
{k:'problema',s:()=>({e:[...nodes({},2),UE(6),SVE(),pod('p0',0,1),pod('p1',1,1),pod('p2',0,3,'pend','api',{b:[tl('loading'),'bad']})],f:[['u','sv',2],['sv','p0',1],['sv','p1',1],['sv','p2',2,'bad']]})},
{k:'conceito',s:()=>({e:[...nodes({},2),UE(6),SVE(),pod('p0',0,1,'ok','api',{b:['GET /healthz']}),pod('p1',1,1),pod('k0',0,5,'other','kubelet',{ic:'srv'}),pod('k1',1,5,'other','kubelet',{ic:'srv'})],f:[['u','sv',2],['sv','p0',1],['sv','p1',1],['k0','p0',2,'hc'],['k1','p1',2,'hc']]})},
{k:'solucao',s:()=>({e:[...nodes({},2),UE(6),SVE(),pod('p0',0,1),pod('p1',1,1),pod('p2',0,3,'pend','api',{b:['readiness: '+tl('no'),'bad']}),pod('k0',0,5,'other','kubelet',{ic:'srv'}),pod('k1',1,5,'other','kubelet',{ic:'srv'})],f:[['u','sv',2],['sv','p0',1],['sv','p1',1],['k0','p2',2,'hc']]})},
{k:'solucao',s:()=>({e:[...nodes({},2),UE(6),SVE(),pod('p0',0,1),pod('p1',1,1),pod('p2',0,3,'new','api',{b:['readiness: '+tl('yes'),'ok']}),pod('k0',0,5,'other','kubelet',{ic:'srv'}),pod('k1',1,5,'other','kubelet',{ic:'srv'})],f:[['u','sv',3],['sv','p0',1],['sv','p1',1],['sv','p2',1],['k0','p2',1,'hc']]})},
{k:'problema',s:()=>({e:[...nodes({},2),UE(6),SVE(),pod('p0',0,1),pod('p1',1,1,'ok','api',{b:[tl('frozen'),'bad']}),pod('p2',0,3),pod('k0',0,5,'other','kubelet',{ic:'srv'}),pod('k1',1,5,'other','kubelet',{ic:'srv'})],f:[['u','sv',3],['sv','p0',2],['sv','p2',2],['k1','p1',2,'hc']]})},
{k:'solucao',cmd:'kubectl get pods -w',s:()=>({e:[...nodes({},2),UE(6),SVE(),pod('p0',0,1),pod('p1b',1,1,'new','api',{b:[tl('restarted'),'ok']}),pod('p2',0,3),pod('k0',0,5,'other','kubelet',{ic:'srv'}),pod('k1',1,5,'other','kubelet',{ic:'srv'})],f:[['u','sv',3],['sv','p0',1],['sv','p1b',1],['sv','p2',1],['k1','p1b',1,'hc']]})},
{k:'problema',cmd:'kubectl describe pod relatorios',s:()=>({e:[...nodes({},2),UE(6),SVE(),pod('p0',0,1),pod('p1b',1,1),pod('p2',0,3),pod('j0',1,3,'dead','java',{b:['CrashLoopBackOff','bad']}),pod('k0',0,5,'other','kubelet',{ic:'srv'}),pod('k1',1,5,'other','kubelet',{ic:'srv'})],f:[['u','sv',3],['sv','p0',1],['sv','p1b',1],['sv','p2',1],['k1','j0',2,'bad']]})},
{k:'solucao',s:()=>({e:[...nodes({},2),UE(6),SVE(),pod('p0',0,1),pod('p1b',1,1),pod('p2',0,3),pod('j1',1,3,'pend','java',{b:['startup: 30 × 10 s']}),pod('k0',0,5,'other','kubelet',{ic:'srv'}),pod('k1',1,5,'other','kubelet',{ic:'srv'})],f:[['u','sv',3],['sv','p0',1],['sv','p1b',1],['sv','p2',1],['k1','j1',2,'hc']]})},
{k:'tradeoff',s:()=>({e:[...nodes({},2),UE(6),SVE(),pod('p0',0,1,'pend','api',{b:[tl('restarting'),'bad']}),pod('p1b',1,1,'pend','api',{b:[tl('restarting'),'bad']}),pod('p2',0,3,'pend','api'),pod('db',1,2,'dead','db',{b:[tl('down'),'bad']}),pod('k0',0,5,'other','kubelet',{ic:'srv'}),pod('k1',1,5,'other','kubelet',{ic:'srv'})],f:[['u','sv',3,'bad'],['k0','p0',1,'hc'],['k1','p1b',1,'hc']]})},
{k:'resumo',s:()=>({e:[...nodes({},2),UE(6),SVE(),pod('p0',0,1),pod('p1b',1,1),pod('p2',0,3),pod('j1',1,3,'ok','java'),pod('k0',0,5,'other','kubelet',{ic:'srv'}),pod('k1',1,5,'other','kubelet',{ic:'srv'})],f:[['u','sv',3],['sv','p0',1],['sv','p1b',1],['sv','p2',1],['sv','j1',1],['k0','p0',1,'hc'],['k1','j1',1,'hc']]})}
]},
rbac:{min:13,lvl:'int',mod:4,steps:[
{k:'contexto',cmd:'kubectl get clusterrolebindings',s:()=>({e:[...RB.base(),RB.ana('cluster-admin'),RB.ci()],f:[['ana','apis',2]],l:[['apis','ns1','d'],['apis','ns2','d']]})},
{k:'problema',cmd:'kubectl delete pods --all -n financeiro',s:()=>({e:[...RB.base({f0:'dead',f1:'dead'}),RB.ana('cluster-admin'),RB.ci()],f:[['ana','apis',2],['apis','f0',2,'bad'],['apis','f1',2,'bad']]})},
{k:'conceito',s:()=>({e:[...RB.base(),RB.ana(),RB.ci(),...RB.gates()],f:[['ana','g1',2],['g1','g2',2],['g2','g3',2],['g3','apis',2]]})},
{k:'conceito',s:()=>({e:[...RB.base(),RB.ana(tl('user')),RB.ci('ServiceAccount'),blk('grp',...at(-9,-11),'orange',tl('group'),{s:1.9,h:30,ic:'user',b:['devs']})],f:[['ana','apis',1],['grp','apis',1],['ci','apis',1]]})},
{k:'conceito',cmd:'kubectl create role leitor-pods --verb=get,list,watch --resource=pods -n loja',s:()=>({e:[...RB.base({role:1}),RB.ana(),RB.ci()]})},
{k:'conceito',cmd:'kubectl create rolebinding ana-leitora --role=leitor-pods --user=ana -n loja',s:()=>({e:[...RB.base({role:1,rb:1}),RB.ana(),RB.ci()],l:[['ana','rb'],['rb','role']]})},
{k:'solucao',cmd:'kubectl auth can-i delete pods -n financeiro --as ana',s:()=>({e:[...RB.base({role:1,rb:1}),RB.ana(),RB.ci(),{...blk('apis',...RB.API,'violet','API server',{ic:'shield',b:['403 Forbidden','bad']})}],f:[['ana','apis',2],['apis','l0',1],['apis','f0',1,'bad']]})},
{k:'conceito',cmd:'kubectl create clusterrolebinding monitor-view --clusterrole=view --serviceaccount=monitoring:prometheus',s:()=>({e:[...RB.base(),RB.ana(),RB.ci(),blk('cr',...at(18,4),'violet','ClusterRole',{s:2.1,h:32,ic:'log',b:['view']}),blk('crb',...at(18,13),'green','ClusterRoleBinding',{s:2.3,h:30,ic:'link'}),blk('mon',...at(-9,-11),'orange','prometheus',{s:1.9,h:30,ic:'gauge',b:['ServiceAccount']})],l:[['mon','crb'],['crb','cr']],f:[['mon','apis',1],['apis','l0',1],['apis','f0',1]]})},
{k:'conceito',s:()=>({e:[...RB.base({rbv:1,rbv2:1}),RB.ana(),RB.ci(),blk('cr',...at(18,4),'violet','ClusterRole',{s:2.1,h:32,ic:'log',b:['view']})],l:[['rbv','cr'],['rbv2','cr']]})},
{k:'conceito',s:()=>({e:[...RB.base({role:1,rb:1,sa:1}),RB.ana(),RB.ci()],f:[['l0','apis',2]]})},
{k:'tradeoff',cmd:'kubectl auth can-i get secrets -n financeiro --as ana',s:()=>({e:[...RB.base({role:1,rb:1}),RB.ana(),RB.ci(),{...blk('apis',...RB.API,'violet','API server',{ic:'shield',b:['403 Forbidden','bad']})}],f:[['ana','apis',2],['apis','f1',1,'bad']]})},
{k:'resumo',s:()=>({e:[...RB.base({role:1,rb:1,sa:1}),RB.ana(),RB.ci(),blk('cr',...at(18,4),'violet','ClusterRole',{s:2.1,h:32,ic:'log',b:['view']})],l:[['ana','rb'],['rb','role']]})}
]},
tudo:{min:5,lvl:'beg',mod:4,steps:[
{k:'resumo',s:()=>({e:[...cp([],at(-3,-16)),...nodes(),users(9),ING(),SV('HPA 2–10'),pod('t0',0,1,'ok','api',{m:41}),pod('t1',1,1,'ok','api',{m:39}),pod('t2',2,1,'ok','api',{m:40}),pod('t3',1,3,'ok','api',{m:42})],f:[['u','ing',3],['ing','sv',3],['sv','t0',1],['sv','t1',1],['sv','t2',1],['sv','t3',1]]})},
{k:'resumo',s:()=>({e:[...cp(['api','etcd','sched','ctrl'],at(-3,-16)),...nodes({0:{st:'hi'},1:{st:'hi'},2:{st:'hi'}}),users(9),ING(),SV('HPA 2–10'),pod('t0',0,1),pod('t1',1,1),pod('t2',2,1),pod('t3',1,3)],l:[['cp','n0','d'],['cp','n1','d'],['cp','n2','d']],f:[['u','ing',3],['ing','sv',3],['sv','t0',1],['sv','t1',1],['sv','t2',1],['sv','t3',1]]})},
{k:'resumo',cmd:'kubectl get all',s:()=>({e:[...cp(['api','etcd','sched','ctrl'],at(-3,-16)),...nodes(),users(9),ING(),SV(),pod('t0',0,1),pod('t1',1,1),pod('t2',2,1),pod('t3',1,3)],f:[['u','ing',3],['ing','sv',3],['sv','t0',1],['sv','t1',1],['sv','t2',1],['sv','t3',1]]})}
]}
};};
window.LESSON_ORDER=['intro','cluster','pods','config','storage','service','escala','sched','rollout','probes','observ','kubeadm','trouble','rbac','tudo'];
