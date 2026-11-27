/* Simulated kubectl terminal. Builds a fake cluster state from the current diagram
   (pods, nodes, Services…) plus per-step overrides, and answers kubectl commands
   with realistic output. Language-neutral output; UI strings in T. */
(function(){
'use strict';
const LESSONS=['pods','workloads','service','probes','trouble'];
const T={
 pt:{title:'Terminal',sim:'simulado',try:'Experimente:',ph:'digite um comando kubectl e aperte Enter',run:'Rodar no terminal',clear:'limpar',step:'Passo',
  unknownCmd:c=>`# Este terminal simulado não conhece "${c}". Digite help para ver o que dá para rodar.`,
  unknownVerb:v=>`# Dica: o verbo "${v}" não está na simulação. Digite help.`,
  help:`Comandos que este terminal simulado entende:
  kubectl get pods | deploy | rs | svc | endpoints | nodes | ingress
              ds | sts | jobs | cronjobs | pvc | events | ns | all
  kubectl describe pod | node | deploy | svc <nome>
  kubectl logs <pod> [--previous] [-c <container>]
  kubectl scale deploy <nome> --replicas=N
  kubectl delete pod <nome>
  kubectl run · create · apply · expose · patch · rollout · set image · top
  opções: -n <ns>  -A  -o wide|yaml|name  -l app=api  -w  --show-labels
          --dry-run=client -o yaml
  atalhos: k = kubectl · | grep <texto> · | grep -v <texto> · clear · history
  na aula de troubleshooting: systemctl, journalctl e crictl também respondem.
# A saída é de exemplo, gerada a partir do que o diagrama mostra neste passo.`,
  watch:'# (-w fica observando; aqui a simulação para sozinha)'},
 en:{title:'Terminal',sim:'simulated',try:'Try:',ph:'type a kubectl command and press Enter',run:'Run in terminal',clear:'clear',step:'Step',
  unknownCmd:c=>`# This simulated terminal doesn't know "${c}". Type help to see what you can run.`,
  unknownVerb:v=>`# Tip: the verb "${v}" isn't part of the simulation. Type help.`,
  help:`Commands this simulated terminal understands:
  kubectl get pods | deploy | rs | svc | endpoints | nodes | ingress
              ds | sts | jobs | cronjobs | pvc | events | ns | all
  kubectl describe pod | node | deploy | svc <name>
  kubectl logs <pod> [--previous] [-c <container>]
  kubectl scale deploy <name> --replicas=N
  kubectl delete pod <name>
  kubectl run · create · apply · expose · patch · rollout · set image · top
  flags: -n <ns>  -A  -o wide|yaml|name  -l app=api  -w  --show-labels
         --dry-run=client -o yaml
  shortcuts: k = kubectl · | grep <text> · | grep -v <text> · clear · history
  in the troubleshooting lesson: systemctl, journalctl and crictl answer too.
# Output is an example, generated from what the diagram shows in this step.`,
  watch:'# (-w keeps watching; here the simulation stops by itself)'}
};

/* ---------- small utils ---------- */
const AL='bcdfghjklmnpqrstvwxz2456789';
function hs(s,n){let h=2166136261>>>0;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;let o='';for(let i=0;i<n;i++){h=Math.imul(h^(h>>>13),2654435761)>>>0;o+=AL[h%AL.length]}return o}
function hn(s,m){let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h%m}
function table(rows,head){const all=[head,...rows].map(r=>r.map(x=>String(x??'')));const w=head.map((_,i)=>Math.max(...all.map(r=>r[i].length)));return all.map(r=>r.map((x,i)=>i===r.length-1?x:x.padEnd(w[i]+3)).join('').trimEnd()).join('\n')}
const pad=(k,n=18)=>(k+':').padEnd(n);
const clone=o=>JSON.parse(JSON.stringify(o));
function now(){return new Date()}
function iso(d){return d.toISOString().replace(/\.\d+Z$/,'.'+String(d.getMilliseconds()).padStart(3,'0')+'Z')}
function rfc(d){return d.toUTCString().replace('GMT','+0000')}
const ago=(sec)=>new Date(Date.now()-sec*1000);
function ageS(a){const m=/^(\d+)([smhd])$/.exec(a||'');if(!m)return 3600;return +m[1]*({s:1,m:60,h:3600,d:86400})[m[2]]}

/* ---------- images / owners ---------- */
const IMG={api:'loja/api:1.0',web:'nginx:1.27',db:'postgres:16',agent:'fluent/fluent-bit:3.0',relatorio:'busybox:1.36',backup:'busybox:1.36',relatorios:'loja/relatorios:2.3',app:'loja/app:1.4','loja-v1':'loja/loja:1.0','loja-v2':'loja/loja:2.0',log:'busybox:1.36'};
const NOTPOD=new Set(['kubelet','registry','crictl','etcd','apiserver','sched','init','proxy','adapter']);
function ownerOf(lb){
 if(/^db-\d$/.test(lb))return{kind:'StatefulSet',name:'db',fixed:lb};
 if(/^job(-\d)?$/.test(lb))return{kind:'Job',name:'relatorio'};
 if(lb==='backup')return{kind:'Job',name:'backup-29387700',cron:'backup'};
 if(lb==='agent')return{kind:'DaemonSet',name:'node-agent'};
 if(lb==='java')return{kind:'Deployment',name:'relatorios'};
 if(lb==='v1'||lb==='v2')return{kind:'Deployment',name:'loja-'+lb,labels:{app:'loja',version:lb}};
 return{kind:'Deployment',name:lb};
}
function podName(o,id,lesson){
 if(o.fixed)return o.fixed;
 const k=lesson+':'+id;
 if(o.kind==='Deployment')return`${o.name}-${hs(o.name+lesson,9)}-${hs(k,5)}`;
 return`${o.name}-${hs(k,5)}`;
}

/* ---------- status from diagram state ---------- */
function statusOf(e,bad,nodeDown){
 const b=(e.b||[]).filter(x=>x!=='bad'&&x!=='ok').join(' · ');
 const r={status:'Running',ready:true,restarts:0,reason:'',badge:b};
 const t=b;
 if(/Completed/.test(t))return{...r,status:'Completed',ready:false,phase:'Succeeded'};
 if(/OOMKilled|exit 137/.test(t))return{...r,status:/exit 137/.test(t)?'CrashLoopBackOff':'OOMKilled',ready:false,restarts:/exit 137/.test(t)?5:1,reason:'OOMKilled'};
 if(/CrashLoopBackOff|restarting/.test(t))return{...r,status:'CrashLoopBackOff',ready:false,restarts:6,reason:'crash'};
 if(/ImagePullBackOff/.test(t))return{...r,status:'ImagePullBackOff',ready:false,reason:'image',phase:'Pending'};
 if(/Insufficient|Pending/.test(t))return{...r,status:'Pending',ready:false,reason:/Insufficient/.test(t)?'cpu':'pending',phase:'Pending',unsched:true};
 if(/Failed|Error/.test(t))return{...r,status:'Error',ready:false,reason:'error',phase:'Failed'};
 if(/readiness: no|probe failed|off the list/.test(t))return{...r,ready:false,reason:'readiness'};
 if(/readiness: yes/.test(t))return r;
 if(/frozen/.test(t))return{...r,reason:'frozen'};
 if(/restarted/.test(t))return{...r,restarts:1,reason:'restarted'};
 if(/loading/.test(t))return{...r,reason:'loading'};
 if(/startup:/.test(t))return{...r,ready:false,reason:'startup'};
 if(/starting/.test(t))return{...r,status:'ContainerCreating',ready:false,phase:'Pending',age:'6s'};
 if(/waiting/.test(t))return{...r,status:'Pending',ready:false,phase:'Pending',unsched:true,reason:'order'};
 if(/Running/.test(t))return r;
 if(e.st==='dead')return nodeDown?{...r,status:'Terminating',ready:false,reason:'node'}:{...r,status:'Error',ready:false,reason:'error',phase:'Failed'};
 if(e.st==='pend')return{...r,status:'Pending',ready:false,phase:'Pending',unsched:true,reason:'pending'};
 if(e.c==='green')return{...r,status:'ContainerCreating',ready:false,phase:'Pending',age:'4s'};
 return r;
}

/* ---------- per-lesson / per-step overrides ----------
   names:{eid:name}  pods:{eid:{patch}}  set:[full pod list]  svc:{eid:{name,selector}}
   deploys:[{name,replicas}]  out:[[regex,text]]  watch:[lines]  apiDown  chips:[cmds] */
const API_LOGS=(t)=>[
 `${t(40)} INFO  starting loja-api v1.0 on :8080`,
 `${t(39)} INFO  connected to postgres db:5432 (pool=10)`,
 `${t(30)} INFO  GET /healthz 200 1ms`,
 `${t(22)} INFO  GET /api/produtos 200 18ms`,
 `${t(12)} INFO  POST /api/pedidos 201 42ms`,
 `${t(4)} INFO  GET /healthz 200 1ms`];
const OV={
 pods:{
  1:{set:[{name:'api',eid:['pd','ca'],node:'node-2',ip:'10.1.0.12',age:'15s',owner:null,lb:'api'}],
     out:[[/^kubectl run /,'pod/api created']]},
  2:{set:[{name:'api',eid:['pd','ca','cl'],node:'node-2',ip:'10.1.0.12',age:'3m',owner:null,lb:'api',containers:['api','log']}]},
  4:{set:[{name:'api',eid:['pd','ca','cl'],node:'node-2',ip:'10.1.0.12',age:'41m',owner:null,lb:'api',containers:['api','log'],status:'Error',ready:false,phase:'Failed',reason:'error'}]},
  5:{set:[{name:'api',eid:['pd2','ca2','cl2'],node:'node-2',ip:'10.1.0.47',age:'8s',owner:null,lb:'api',containers:['api','log']}]},
  6:{set:[],deploys:[{name:'api',replicas:3}],out:[[/^kubectl apply -f /,'deployment.apps/api created']]},
 },
 workloads:{
  all:{svc:{sv:{name:'loja'}}},
  2:{out:[[/^kubectl get ds -A$/,null]]},
  5:{skipPend:true,out:[[/^kubectl create job /,'job.batch/relatorio created']]},
  7:{out:[[/^kubectl create cronjob /,'cronjob.batch/backup created']]},
  8:{set:[{name:'app-7f6b9c4d8-qx2lm',eid:['in','ap'],lb:'app',node:'node-1',status:'Init:0/1',ready:false,phase:'Pending',reason:'init',containers:['app'],init:['wait-for-db']},
          {name:'db-0',eid:['db'],lb:'db',node:'node-2',owner:{kind:'StatefulSet',name:'db'}}]},
  9:{set:[{name:'app-7f6b9c4d8-qx2lm',eid:['ap','sc'],lb:'app',node:'node-1',containers:['app','proxy']},
          {name:'metrics-5c8d7b6f9-r4wzt',eid:['ad','ad2'],lb:'app',node:'node-2',containers:['app','adapter'],owner:{kind:'Deployment',name:'metrics'}}]},
  10:{out:[[/^kubectl patch svc loja /,'service/loja patched']]},
 },
 service:{
  all:{svc:{sv:{name:'api'},ws:{name:'web'}}},
  3:{out:[[/^kubectl expose deployment api/,'service/api exposed']]},
 },
 probes:{
  all:{svc:{sv:{name:'api'}},names:{j0:'relatorios-6d5f8b7c9-m2xkp',j1:'relatorios-6d5f8b7c9-w8tqz'}},
  7:{watch:p=>{const n=p.find(x=>x.eid&&x.eid.includes('p1b'))?.name||'api-x';return[
    `${n.padEnd(30)}0/1     Running   0          2d`,
    `${n.padEnd(30)}0/1     Running   1 (1s ago) 2d`,
    `${n.padEnd(30)}1/1     Running   1 (12s ago) 2d`]}},
  8:{out:[[/^kubectl describe pod relatorios$/,'@describe:relatorios-6d5f8b7c9-m2xkp']]},
  10:{pods:{db:{status:'Error',ready:false,reason:'error',phase:'Failed'},p2:{status:'CrashLoopBackOff',ready:false,restarts:4,reason:'crash',probeDb:true},p0:{probeDb:true},p1b:{probeDb:true}}},
 },
 trouble:{
  all:{names:{cr:'api-7d9',ip:'web'},svc:{sv:{name:'web'}},images:{ip:'nginx:1.2O'},pods:{cr:{reason:'OOMKilled'}}},
  1:{chips:['kubectl get pods -A | grep -v Running','kubectl describe pod web','kubectl logs api-7d9 --previous']},
  3:{pods:{pe:{cpu:'4'}}},
  6:{kubelet:'dead',chips:['kubectl get nodes','kubectl describe node node-3','systemctl status kubelet','journalctl -u kubelet | tail -3']},
  7:{kubelet:'ok',chips:['systemctl restart kubelet','systemctl status kubelet','kubectl get nodes'],out:[[/^(sudo )?systemctl restart kubelet$/,'']]},
  8:{apiDown:true,chips:['kubectl get pods','crictl ps -a | grep kube-apiserver','systemctl status kubelet']},
  9:{apiDown:true,apiExited:true,chips:['crictl ps -a | grep kube-apiserver','crictl logs 7f3e2a9c1b4d','cat /etc/kubernetes/manifests/kube-apiserver.yaml | grep etcd']},
  10:{schedDown:true,chips:['kubectl get pods','kubectl get pods -n kube-system','kubectl describe pod '+'$P0']},
 },
};

/* ---------- derive cluster state ---------- */
let ST=null,CTX=null,LANG='pt',HIST=[],HI=-1,REAL={};
function derive(c){
 const E=c.sc.e,ov=OV[c.lesson]||{},so=Object.assign({},ov.all||{},ov[c.step+1]||{});
 const merge=(k)=>Object.assign({},(ov.all||{})[k]||{},(ov[c.step+1]||{})[k]||{});
 const names=merge('names'),pp=merge('pods'),svO=merge('svc'),imgs=merge('images');
 const slabs=E.filter(e=>e.t==='slab');
 const nodeSlab=n=>slabs.find(s=>String(s.lb||'').startsWith(n));
 const nodes=[{name:'controlplane',role:'control-plane',ip:'192.168.1.10',eid:slabs.find(s=>s.lb==='controlplane'||s.id==='cp')?.id,ready:true}];
 for(let k=1;k<=3;k++){const s=nodeSlab('node-'+k);nodes.push({name:'node-'+k,role:'<none>',ip:'192.168.1.1'+k,eid:s?.id,ready:!(s&&(s.st==='down'||/NotReady/.test(s.lb)))})}
 if(so.kubelet==='dead')nodes[3].ready=false;
 const nodeOfSlab=s=>{if(!s)return null;if(s.lb==='controlplane')return'controlplane';const m=/node-(\d)/.exec(s.lb||'');if(m)return'node-'+m[1];return null};
 let pods=[];
 if(so.set){pods=clone(so.set).map(p=>({ns:'default',restarts:0,ready:true,status:'Running',age:'2d',containers:[p.lb],owner:p.owner===undefined?ownerOf(p.lb):p.owner,ip:p.ip||ipFor(p.name,p.node),...p}))}
 else E.filter(e=>e.pod&&!NOTPOD.has(e.lb)).forEach(e=>{
  const host=c.hostOf(e,slabs),node=nodeOfSlab(host)||'node-1',nd=nodes.find(n=>n.name===node);
  const st=statusOf(e,0,nd&&!nd.ready);
  if(so.skipPend&&e.st==='pend'&&!st.badge)return;
  const o=ownerOf(e.lb),name=names[e.id]||podName(o,e.id,c.lesson);
  const ipm=/(\d+\.\d+\.\d+\.\d+)/.exec(st.badge||'');
  const p={name,eid:[e.id],lb:e.lb,ns:'default',node:st.unsched?'<none>':node,ip:st.unsched?'<none>':(ipm?ipm[1]:ipFor(e.id+c.lesson,node)),owner:o,containers:[o.kind==='Deployment'?o.name.replace(/-v\d$/,''):o.name.replace(/-\d+$/,'')],age:st.age||'2d',...st};
  if(o.labels)p.labels=o.labels;
  if(imgs[e.id])p.image=imgs[e.id];
  Object.assign(p,pp[e.id]||{});
  pods.push(p)});
 pods.forEach(p=>{if(!p.labels)p.labels=p.owner&&p.owner.labels?p.owner.labels:{app:p.owner&&p.owner.kind!=='Deployment'?p.owner.name:(p.owner?p.owner.name:p.lb)};
  if(!p.image)p.image=IMG[p.owner?.cron||p.owner?.name]||IMG[p.lb]||'loja/'+p.lb+':1.0';
  if(p.owner&&p.owner.kind==='Deployment'&&!p.labels['pod-template-hash'])p.labels['pod-template-hash']=hs(p.owner.name+c.lesson,9)});
 // deployments
 const deps={};pods.forEach(p=>{if(p.owner&&p.owner.kind==='Deployment'){const d=deps[p.owner.name]||(deps[p.owner.name]={name:p.owner.name,replicas:0,ready:0,labels:p.labels,image:p.image});d.replicas++;if(p.ready&&p.status==='Running')d.ready++}});
 (so.deploys||[]).forEach(d=>{deps[d.name]=Object.assign({ready:0,labels:{app:d.name},image:IMG[d.name]||'loja/'+d.name+':1.0'},deps[d.name]||{},d)});
 // services
 const svcs=[{name:'kubernetes',ip:'10.96.0.1',port:'443/TCP',selector:null,type:'ClusterIP',age:'30d'}];
 E.filter(e=>e.lb==='Service').forEach(e=>{const b=(e.b||[]).filter(x=>x!=='bad'&&x!=='ok').join(' ');const o=svO[e.id]||{};
  const name=o.name||(e.id==='ws'?'web':/^[a-z][a-z-]*$/.test(b)?b:'api');
  let sel=o.selector;if(!sel){const m=/(?:selector:\s*)?(app|version)=(\S+)/.exec(b);sel=m?(m[1]==='version'?{app:'loja',version:m[2]}:{app:m[2]}):{app:name}}
  if(!svcs.some(s=>s.name===name))svcs.push({name,eid:e.id,ip:'10.96.'+hn(name,200)+'.'+(10+hn(name+'x',200)),port:'80/TCP',target:name==='web'?80:8080,selector:sel,type:'ClusterIP',age:'5d'})});
 // ingress
 const ings=E.filter(e=>e.lb==='Ingress').map(e=>({name:'loja',eid:e.id,host:'loja.com',tls:/https/.test((e.b||[]).join()),rules:svcs.filter(s=>s.selector).map(s=>({path:s.name==='web'?'/':'/'+s.name,svc:s.name}))}));
 // pvcs
 const pvcs=E.filter(e=>/^data-\d$/.test(e.lb||'')).map(e=>({name:'data-db-'+e.lb.slice(-1),eid:e.id,vol:'pvc-'+hs(e.id+c.lesson,8)+'-'+hs(e.id,4)+'-'+hs(e.id+'a',4)}));
 // control plane extras
 const has=l=>E.some(e=>e.lb===l);
 return{lesson:c.lesson,step:c.step,nodes,pods,deps,svcs,ings,pvcs,so,
  ds:has('DaemonSet')||pods.some(p=>p.owner?.kind==='DaemonSet'),sts:has('StatefulSet')||pods.some(p=>p.owner?.kind==='StatefulSet'),
  job:E.find(e=>e.lb==='Job'),cron:has('CronJob')};
}
function ipFor(seed,node){const n=(/node-(\d)/.exec(node||'')||[0,0])[1];return`10.1.${n}.${10+hn(seed,230)}`}

/* ---------- selectors / flags ---------- */
function parseArgs(argv){const f={ns:null,all:false,o:null,l:null,w:false,prev:false,c:null,labels:false,dry:false,rest:[],kv:{}};
 for(let i=0;i<argv.length;i++){const a=argv[i];
  if(a==='-n'||a==='--namespace')f.ns=argv[++i];else if(/^--namespace=/.test(a))f.ns=a.split('=')[1];
  else if(a==='-A'||a==='--all-namespaces')f.all=true;
  else if(a==='-o'||a==='--output')f.o=argv[++i];else if(/^-o(.+)/.test(a)&&!/^-o=/.test(a))f.o=a.slice(2);else if(/^(-o|--output)=/.test(a))f.o=a.split('=')[1];
  else if(a==='-l'||a==='--selector')f.l=argv[++i];else if(/^(-l|--selector)=/.test(a))f.l=a.split('=')[1];
  else if(a==='-w'||a==='--watch')f.w=true;else if(a==='-p'||a==='--previous')f.prev=true;
  else if(a==='-c'||a==='--container')f.c=argv[++i];else if(/^(-c|--container)=/.test(a))f.c=a.split('=')[1];
  else if(a==='--show-labels')f.labels=true;else if(/^--dry-run/.test(a))f.dry=true;
  else if(/^--[a-z-]+=/.test(a)){const[k,v]=a.slice(2).split(/=(.*)/);f.kv[k]=v}
  else if(/^--[a-z-]+$/.test(a)&&argv[i+1]&&!/^-/.test(argv[i+1])&&['image','replicas','port','schedule','target-port','type','name','restart','from'].includes(a.slice(2)))f.kv[a.slice(2)]=argv[++i];
  else if(a==='-f'||a==='--filename')f.kv.f=argv[++i];
  else if(a==='--')break;
  else if(/^-/.test(a)){}
  else f.rest.push(a)}
 return f}
function matchSel(labels,sel){if(!sel)return true;return sel.split(',').every(t=>{const[k,v]=t.split('=');return labels&&labels[k]===v})}
const RT={po:'pods',pod:'pods',pods:'pods',deploy:'deployments',deployment:'deployments',deployments:'deployments',rs:'replicasets',replicaset:'replicasets',replicasets:'replicasets',svc:'services',service:'services',services:'services',ep:'endpoints',endpoints:'endpoints',no:'nodes',node:'nodes',nodes:'nodes',ing:'ingress',ingress:'ingress',ingresses:'ingress',ds:'daemonsets',daemonset:'daemonsets',daemonsets:'daemonsets',sts:'statefulsets',statefulset:'statefulsets',statefulsets:'statefulsets',job:'jobs',jobs:'jobs',cj:'cronjobs',cronjob:'cronjobs',cronjobs:'cronjobs',pvc:'pvc',persistentvolumeclaim:'pvc',persistentvolumeclaims:'pvc',ev:'events',event:'events',events:'events',ns:'namespaces',namespace:'namespaces',namespaces:'namespaces',all:'all',pv:'pv',persistentvolume:'pv',persistentvolumes:'pv'};

/* ---------- system pods ---------- */
function sysPods(s){const so=s.so;const L=[
 ['coredns-76f75df574-8xk2p','1/1','Running',0,'30d','10.1.0.2','controlplane'],
 ['coredns-76f75df574-tq9vz','1/1','Running',0,'30d','10.1.0.3','controlplane'],
 ['etcd-controlplane','1/1','Running',0,'30d','192.168.1.10','controlplane'],
 ['kube-apiserver-controlplane',so.apiExited?'0/1':'1/1',so.apiExited?'CrashLoopBackOff':'Running',so.apiExited?7:0,'30d','192.168.1.10','controlplane'],
 ['kube-controller-manager-controlplane','1/1','Running',0,'30d','192.168.1.10','controlplane'],
 ['kube-scheduler-controlplane',so.schedDown?'0/1':'1/1',so.schedDown?'CrashLoopBackOff':'Running',so.schedDown?9:0,'30d','192.168.1.10','controlplane']];
 s.nodes.forEach(n=>L.push(['kube-proxy-'+hs(n.name,5),n.ready?'1/1':'1/1','Running',0,'30d',n.ip,n.name]));
 s.nodes.forEach(n=>L.push(['calico-node-'+hs(n.name+'c',5),n.ready?'1/1':'0/1','Running',0,'30d',n.ip,n.name]));
 return L.map(r=>({ns:'kube-system',name:r[0],readyS:r[1],status:r[2],restarts:r[3],age:r[4],ip:r[5],node:r[6],sys:1}))}

/* ---------- get ---------- */
function readyS(p){if(p.readyS)return p.readyS;const n=p.containers.length;const r=p.ready?n:(p.status==='Running'&&p.reason==='readiness'||p.reason==='startup'||p.reason==='loading')?Math.max(0,n-1):0;return`${p.status==='Completed'?0:r}/${n}`}
function restartsS(p){return p.restarts?`${p.restarts} (${p.restarts>3?'2m':'45s'} ago)`:'0'}
function getPods(s,f){
 let list=s.pods.filter(p=>!p.gone);
 const ns=f.ns||'default';
 if(f.all)list=[...sysPods(s),...list];else if(ns==='kube-system')list=sysPods(s);else if(ns!=='default')list=[];
 if(f.l)list=list.filter(p=>matchSel(p.labels,f.l));
 if(f.rest[2]){const n=f.rest[2];const p=list.find(x=>x.name===n);if(!p)return err404('pods',n);list=[p]}
 if(!list.length)return{txt:`No resources found in ${f.all?'any':ns} namespace.`};
 if(f.o==='name')return{txt:list.map(p=>'pod/'+p.name).join('\n'),hi:list};
 if(f.o==='yaml'||f.o==='json')return{txt:list.map(p=>podYaml(s,p)).join('\n---\n'),hi:list};
 const wide=f.o==='wide';
 const head=[...(f.all?['NAMESPACE']:[]),'NAME','READY','STATUS','RESTARTS','AGE',...(wide?['IP','NODE','NOMINATED NODE','READINESS GATES']:[]),...(f.labels?['LABELS']:[])];
 const rows=list.map(p=>[...(f.all?[p.ns]:[]),p.name,readyS(p),p.status,restartsS(p),p.age,...(wide?[p.ip,p.node,'<none>','<none>']:[]),...(f.labels?[Object.entries(p.labels||{}).map(([k,v])=>k+'='+v).join(',')]:[])]);
 return{txt:table(rows,head),hi:list}}
function err404(kind,n){return{txt:`Error from server (NotFound): ${kind} "${n}" not found`,err:1}}
function getDeps(s,f,one){let d=Object.values(s.deps);if((f.ns||'default')!=='default'&&!f.all)d=[];
 if(f.all)d=[{name:'coredns',ns:'kube-system',replicas:2,ready:2,image:'registry.k8s.io/coredns/coredns:v1.11.1',labels:{'k8s-app':'kube-dns'}},{name:'calico-kube-controllers',ns:'kube-system',replicas:1,ready:1,image:'calico/kube-controllers:v3.28.0',labels:{}},...d];
 if(one){d=d.filter(x=>x.name===one);if(!d.length)return err404('deployments.apps',one)}
 if(!d.length)return{txt:`No resources found in ${f.ns||'default'} namespace.`};
 if(f.o==='name')return{txt:d.map(x=>'deployment.apps/'+x.name).join('\n')};
 const wide=f.o==='wide';
 return{txt:table(d.map(x=>[...(f.all?[x.ns||'default']:[]),x.name,`${x.ready}/${x.replicas}`,x.replicas,x.ready,x.age||'2d',...(wide?[x.name.replace(/-v\d$/,''),x.image,Object.entries(x.labels||{}).filter(([k])=>k!=='pod-template-hash').map(([k,v])=>k+'='+v).join(',')]:[])]),[...(f.all?['NAMESPACE']:[]),'NAME','READY','UP-TO-DATE','AVAILABLE','AGE',...(wide?['CONTAINERS','IMAGES','SELECTOR']:[])]),hi:s.pods.filter(p=>d.some(x=>p.owner?.name===x.name))}}
function getRS(s,f){const d=Object.values(s.deps);if(!d.length)return{txt:'No resources found in default namespace.'};
 return{txt:table(d.map(x=>[`${x.name}-${hs(x.name+s.lesson,9)}`,x.replicas,x.replicas,x.ready,x.age||'2d']),['NAME','DESIRED','CURRENT','READY','AGE'])}}
function epsOf(s,sv){return s.pods.filter(p=>!p.gone&&p.status==='Running'&&p.ready&&matchSel(p.labels,Object.entries(sv.selector||{}).map(([k,v])=>k+'='+v).join(',')))}
function getSvc(s,f,one){let L=s.svcs;if((f.ns||'default')!=='default'&&!f.all)L=f.ns==='kube-system'?[{name:'kube-dns',ip:'10.96.0.10',port:'53/UDP,53/TCP,9153/TCP',type:'ClusterIP',age:'30d',selector:{'k8s-app':'kube-dns'}}]:[];
 if(one){L=L.filter(x=>x.name===one);if(!L.length)return err404('services',one)}
 if(!L.length)return{txt:`No resources found in ${f.ns} namespace.`};
 const wide=f.o==='wide';
 return{txt:table(L.map(x=>[x.name,x.type,x.ip,'<none>',x.port,x.age,...(wide?[x.selector?Object.entries(x.selector).map(([k,v])=>k+'='+v).join(','):'<none>']:[])]),['NAME','TYPE','CLUSTER-IP','EXTERNAL-IP','PORT(S)','AGE',...(wide?['SELECTOR']:[])]),hiE:L.map(x=>x.eid).filter(Boolean)}}
function getEp(s,f,one){let L=s.svcs;if(one){L=L.filter(x=>x.name===one);if(!L.length)return err404('endpoints',one)}
 const hi=[];const rows=L.map(x=>{if(!x.selector)return[x.name,'192.168.1.10:6443','30d'];const e=epsOf(s,x);hi.push(...e);const t=e.map(p=>p.ip+':'+x.target);return[x.name,t.length?(t.length>3?t.slice(0,3).join(',')+` + ${t.length-3} more...`:t.join(',')):'<none>',x.age]});
 return{txt:table(rows,['NAME','ENDPOINTS','AGE']),hi,hiE:L.map(x=>x.eid).filter(Boolean)}}
function getNodes(s,f,one){let L=s.nodes;if(one){L=L.filter(n=>n.name===one);if(!L.length)return err404('nodes',one)}
 const wide=f.o==='wide';
 return{txt:table(L.map(n=>[n.name,n.ready?'Ready':'NotReady',n.role,n.name==='controlplane'?'30d':'29d','v1.31.2',...(wide?[n.ip,'<none>','Ubuntu 24.04.1 LTS','6.8.0-48-generic','containerd://1.7.22']:[])]),['NAME','STATUS','ROLES','AGE','VERSION',...(wide?['INTERNAL-IP','EXTERNAL-IP','OS-IMAGE','KERNEL-VERSION','CONTAINER-RUNTIME']:[])]),hiE:L.map(n=>n.eid).filter(Boolean)}}
function getIng(s,f){if(!s.ings.length)return{txt:'No resources found in default namespace.'};
 return{txt:table(s.ings.map(i=>[i.name,'nginx',i.host,'203.0.113.10',i.tls?'80, 443':'80','3d']),['NAME','CLASS','HOSTS','ADDRESS','PORTS','AGE']),hiE:s.ings.map(i=>i.eid)}}
function getDS(s,f){const rows=[];const n=s.nodes.filter(x=>x.name!=='controlplane').length;
 if(f.all||f.ns==='kube-system'){rows.push(['kube-system','calico-node',4,4,s.nodes.filter(x=>x.ready).length,4,s.nodes.filter(x=>x.ready).length,'kubernetes.io/os=linux','30d']);rows.push(['kube-system','kube-proxy',4,4,4,4,4,'kubernetes.io/os=linux','30d'])}
 const ag=s.pods.filter(p=>p.owner?.kind==='DaemonSet');
 if(ag.length&&(f.all||!f.ns||f.ns==='default')){const r=ag.filter(p=>p.status==='Running').length;rows.push(['default','node-agent',ag.length,ag.length,r,ag.length,r,'<none>','12d'])}
 if(!rows.length)return{txt:`No resources found in ${f.ns||'default'} namespace.`};
 const head=['NAMESPACE','NAME','DESIRED','CURRENT','READY','UP-TO-DATE','AVAILABLE','NODE SELECTOR','AGE'];
 return{txt:f.all?table(rows,head):table(rows.map(r=>r.slice(1)),head.slice(1)),hi:ag}}
function getSTS(s){const p=s.pods.filter(x=>x.owner?.kind==='StatefulSet');if(!p.length)return{txt:'No resources found in default namespace.'};
 const r=p.filter(x=>x.ready&&x.status==='Running').length;return{txt:table([['db',`${r}/3`,'8d']],['NAME','READY','AGE']),hi:p}}
function getJobs(s){const p=s.pods.filter(x=>x.owner?.kind==='Job');if(!p.length)return{txt:'No resources found in default namespace.'};
 const by={};p.forEach(x=>{(by[x.owner.name]=by[x.owner.name]||[]).push(x)});
 const st=s.so;return{txt:table(Object.entries(by).map(([n,L])=>{const done=L.filter(x=>x.status==='Completed').length,failed=L.filter(x=>x.status==='Error').length;const tot=n==='relatorio'?3:1;return[n,failed>=3?'Failed':done>=tot?'Complete':'Running',`${done}/${tot}`,done>=tot?'21s':failed>=3?'2m':'34s','2m']}),['NAME','STATUS','COMPLETIONS','DURATION','AGE']),hi:p}}
function getCJ(s){if(!s.cron)return{txt:'No resources found in default namespace.'};return{txt:table([['backup','0 3 * * *','<none>','False',0,'6h','9d']],['NAME','SCHEDULE','TIMEZONE','SUSPEND','ACTIVE','LAST SCHEDULE','AGE'])}}
function getPVC(s){if(!s.pvcs.length)return{txt:'No resources found in default namespace.'};return{txt:table(s.pvcs.map(p=>[p.name,'Bound',p.vol,'1Gi','RWO','standard','<unset>','8d']),['NAME','STATUS','VOLUME','CAPACITY','ACCESS MODES','STORAGECLASS','VOLUMEATTRIBUTESCLASS','AGE']),hiE:s.pvcs.map(p=>p.eid)}}
function getEvents(s){const ev=[];s.pods.forEach(p=>podEvents(s,p).forEach(e=>ev.push([e[2],e[0],e[1],'pod/'+p.name,e[4]])));
 s.nodes.filter(n=>!n.ready).forEach(n=>ev.push(['2m','Normal','NodeNotReady','node/'+n.name,`Node ${n.name} status is now: NodeNotReady`]));
 if(!ev.length)return{txt:'No events found in default namespace.'};return{txt:table(ev,['LAST SEEN','TYPE','REASON','OBJECT','MESSAGE'])}}
function getAll(s,f){const o=[];const p=getPods(s,f);if(!/^No resources/.test(p.txt))o.push(p.txt.replace(/^NAME/,'NAME').split('\n').map((l,i)=>i?l.replace(/^(\S+)/,'pod/$1'):l).join('\n'));
 o.push(getSvc(s,f).txt.split('\n').map((l,i)=>i?l.replace(/^(\S+)/,'service/$1'):l).join('\n'));
 const d=Object.values(s.deps);if(d.length){o.push(getDeps(s,f).txt.split('\n').map((l,i)=>i?l.replace(/^(\S+)/,'deployment.apps/$1'):l).join('\n'));o.push(getRS(s,f).txt.split('\n').map((l,i)=>i?l.replace(/^(\S+)/,'replicaset.apps/$1'):l).join('\n'))}
 return{txt:o.join('\n\n'),hi:p.hi}}

/* ---------- describe ---------- */
function podEvents(s,p){const n=p.name,img=p.image,E=[];const node=p.node;
 if(p.unsched){if(s.so.schedDown)return[];E.push(['Warning','FailedScheduling','2m','default-scheduler',p.reason==='cpu'?`0/4 nodes are available: 1 node(s) had untolerated taint {node-role.kubernetes.io/control-plane: }, 3 Insufficient cpu. preemption: 0/4 nodes are available: 1 Preemption is not helpful for scheduling, 3 No preemption victims found for incoming pod.`:p.reason==='order'?`pod is waiting for db-${(+p.name.slice(-1))-1} to be Running and Ready (OrderedReady)`:`0/4 nodes are available: 1 node(s) had untolerated taint {node-role.kubernetes.io/control-plane: }, 3 node(s) didn't match Pod's node affinity/selector.`]);return E}
 E.push(['Normal','Scheduled',p.age,'default-scheduler',`Successfully assigned default/${n} to ${node}`]);
 if(p.init)E.push(['Normal','Started','40s','kubelet','Started container wait-for-db']);
 if(p.status==='ImagePullBackOff'){E.push(['Normal','Pulling','95s (x4 over 3m)','kubelet',`Pulling image "${img}"`]);E.push(['Warning','Failed','94s (x4 over 3m)','kubelet',`Failed to pull image "${img}": rpc error: code = NotFound desc = failed to pull and unpack image "docker.io/library/${img}": failed to resolve reference "docker.io/library/${img}": docker.io/library/${img}: not found`]);E.push(['Warning','Failed','94s (x4 over 3m)','kubelet','Error: ErrImagePull']);E.push(['Normal','BackOff','8s (x12 over 3m)','kubelet',`Back-off pulling image "${img}"`]);E.push(['Warning','Failed','8s (x12 over 3m)','kubelet','Error: ImagePullBackOff']);return E}
 if(p.status==='ContainerCreating'){E.push(['Normal','Pulling','3s','kubelet',`Pulling image "${img}"`]);return E}
 E.push(['Normal','Pulled',p.restarts?'2m (x'+(p.restarts+1)+' over 9m)':p.age,'kubelet',`Container image "${img}" already present on machine`]);
 E.push(['Normal','Created',p.restarts?'2m (x'+(p.restarts+1)+' over 9m)':p.age,'kubelet',`Created container: ${p.containers[0]}`]);
 E.push(['Normal','Started',p.restarts?'2m (x'+(p.restarts+1)+' over 9m)':p.age,'kubelet',`Started container ${p.containers[0]}`]);
 const url=`http://${p.ip}:8080/healthz`;
 if(p.reason==='readiness')E.push(['Warning','Unhealthy','4s (x18 over 90s)','kubelet','Readiness probe failed: HTTP probe failed with statuscode: 503']);
 if(p.reason==='startup')E.push(['Warning','Unhealthy','6s (x9 over 86s)','kubelet',`Startup probe failed: Get "${url}": dial tcp ${p.ip}:8080: connect: connection refused`]);
 if(p.reason==='restarted'){E.push(['Warning','Unhealthy','40s (x3 over 60s)','kubelet',`Liveness probe failed: Get "${url}": context deadline exceeded (Client.Timeout exceeded while awaiting headers)`]);E.push(['Normal','Killing','40s','kubelet',`Container ${p.containers[0]} failed liveness probe, will be restarted`])}
 if(p.reason==='crash'&&p.lb==='java'){E.push(['Warning','Unhealthy','2m (x18 over 9m)','kubelet',`Liveness probe failed: Get "${url}": dial tcp ${p.ip}:8080: connect: connection refused`]);E.push(['Normal','Killing','2m (x6 over 9m)','kubelet','Container relatorios failed liveness probe, will be restarted'])}
 if(p.probeDb){E.push(['Warning','Unhealthy','20s (x9 over 70s)','kubelet','Liveness probe failed: HTTP probe failed with statuscode: 500']);E.push(['Normal','Killing','20s (x3 over 70s)','kubelet',`Container ${p.containers[0]} failed liveness probe, will be restarted`])}
 if(p.status==='CrashLoopBackOff'||p.status==='OOMKilled')E.push(['Warning','BackOff','5s (x'+(p.restarts*4+3)+' over 9m)','kubelet',`Back-off restarting failed container ${p.containers[0]} in pod ${n}_default(${hs(n,8)}-${hs(n+'u',4)})`]);
 if(p.status==='Terminating')E.push(['Warning','NodeNotReady','90s','node-controller','Node is not ready']);
 return E}
function evTable(E){if(!E.length)return'Events:            <none>';return'Events:\n'+table(E,['Type','Reason','Age','From','Message']).split('\n').map((l,i)=>'  '+(i===0?l:l)).join('\n').replace(/^(  .*)\n/,(m,h)=>m+'  '+h.replace(/[^ ]/g,'-').replace(/-+/g,x=>x)+'\n').replace(/\n  (-[ -]+)\n/,'\n  $1\n')}
function evT(E){if(!E.length)return'Events:            <none>';const h=['Type','Reason','Age','From','Message'];const rows=[h,h.map(x=>'-'.repeat(x.length)),...E];return'Events:\n'+table(rows.slice(1),rows[0]).split('\n').map(l=>'  '+l).join('\n')}
function describePod(s,p){const o=p.owner,crash=p.status==='CrashLoopBackOff'||p.status==='OOMKilled',start=rfc(ago(ageS(p.age)));
 const lim=p.reason==='OOMKilled'?{cpu:'500m',memory:'256Mi'}:{cpu:'500m',memory:'512Mi'},req={cpu:p.cpu||'250m',memory:'128Mi'};
 const probeL=(p.lb==='api'||p.lb==='java'||p.lb==='web')&&s.lesson!=='pods'?(s.lesson==='probes'&&s.step<6?null:`http-get http://:${p.lb==='web'?80:8080}/${p.probeDb?'health/full':'healthz'} delay=0s timeout=1s period=10s #success=1 #failure=3`):null;
 const probeR=(p.lb==='api'||p.lb==='web')&&!(s.lesson==='probes'&&s.step<3)&&s.lesson!=='pods'?`http-get http://:${p.lb==='web'?80:8080}/ready delay=0s timeout=1s period=5s #success=1 #failure=3`:null;
 const probeS=p.lb==='java'&&p.reason==='startup'?'http-get http://:8080/healthz delay=0s timeout=1s period=10s #success=1 #failure=30':null;
 const cont=p.containers.map((c,i)=>{const main=i===0;const img=main?p.image:IMG[c]||'loja/'+c+':1.0';
  let state;if(p.status==='ImagePullBackOff')state=`    State:          Waiting\n      Reason:       ImagePullBackOff\n    Ready:          False\n    Restart Count:  0`;
  else if(p.status==='ContainerCreating'||p.unsched||p.init&&main)state=`    State:          Waiting\n      Reason:       ${p.init&&main?'PodInitializing':'ContainerCreating'}\n    Ready:          False\n    Restart Count:  0`;
  else if(p.status==='Completed')state=`    State:          Terminated\n      Reason:       Completed\n      Exit Code:    0\n      Started:      ${start}\n      Finished:     ${start}\n    Ready:          False\n    Restart Count:  0`;
  else if(p.status==='Error'&&main)state=`    State:          Terminated\n      Reason:       Error\n      Exit Code:    1\n      Started:      ${start}\n      Finished:     ${start}\n    Ready:          False\n    Restart Count:  ${p.restarts}`;
  else if(crash&&main)state=`    State:          Waiting\n      Reason:       CrashLoopBackOff\n    Last State:     Terminated\n      Reason:       ${p.reason==='OOMKilled'?'OOMKilled':'Error'}\n      Exit Code:    ${p.reason==='OOMKilled'?137:p.lb==='java'?143:1}\n      Started:      ${rfc(ago(150))}\n      Finished:     ${rfc(ago(128))}\n    Ready:          False\n    Restart Count:  ${p.restarts}`;
  else state=`    State:          Running\n      Started:      ${rfc(ago(p.restarts?12:ageS(p.age)))}\n${p.restarts?`    Last State:     Terminated\n      Reason:       Error\n      Exit Code:    137\n`:''}    Ready:          ${p.ready||!main?'True':'False'}\n    Restart Count:  ${main?p.restarts:0}`;
  return`  ${c}:\n    Container ID:   ${p.status==='ImagePullBackOff'||p.unsched?'':'containerd://'+hs(p.name+c,12)+hs(c,12)}\n    Image:          ${img}\n    Port:           ${main?(p.lb==='web'?'80/TCP':p.lb==='db'?'5432/TCP':'8080/TCP'):'<none>'}\n${state}\n    Limits:\n      cpu:     ${lim.cpu}\n      memory:  ${lim.memory}\n    Requests:\n      cpu:        ${req.cpu}\n      memory:     ${req.memory}\n${main&&probeL?`    Liveness:     ${probeL}\n`:''}${main&&probeR?`    Readiness:    ${probeR}\n`:''}${main&&probeS?`    Startup:      ${probeS}\n`:''}    Environment:  <none>\n    Mounts:\n      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-${hs(p.name,5)} (ro)`}).join('\n');
 const init=p.init?`Init Containers:\n  wait-for-db:\n    Image:          busybox:1.36\n    Command:\n      sh\n      -c\n      until nc -z db 5432; do echo esperando db; sleep 2; done\n    State:          Running\n      Started:      ${rfc(ago(40))}\n    Ready:          False\n    Restart Count:  0\n`:'';
 const ready=p.ready&&p.status==='Running';
 const ctrl=o?(o.kind==='Deployment'?`ReplicaSet/${o.name}-${hs(o.name+s.lesson,9)}`:`${o.kind}/${o.name}`):'';
 return[`Name:             ${p.name}`,`Namespace:        default`,`Priority:         0`,`Service Account:  default`,`Node:             ${p.unsched?'<none>':p.node+'/'+(s.nodes.find(n=>n.name===p.node)?.ip||'')}`,`Start Time:       ${p.unsched?'<unset>':start}`,
  `Labels:           ${Object.entries(p.labels||{}).map(([k,v])=>k+'='+v).join('\n                  ')}`,`Annotations:      <none>`,
  `Status:           ${p.status==='Terminating'?'Terminating (lasts 30s)':p.phase||'Running'}`,`IP:               ${p.ip==='<none>'?'':p.ip}`,`IPs:\n  IP:  ${p.ip==='<none>'?'':p.ip}`,...(ctrl?[`Controlled By:    ${ctrl}`]:[]),
  init+`Containers:\n${cont}`,
  `Conditions:\n  Type                        Status\n  PodReadyToStartContainers   ${p.unsched?'False':'True'}\n  Initialized                 ${p.init?'False':'True'}\n  Ready                       ${ready?'True':'False'}\n  ContainersReady             ${ready?'True':'False'}\n  PodScheduled                ${p.unsched?'False':'True'}`,
  `Volumes:\n  kube-api-access-${hs(p.name,5)}:\n    Type:                    Projected (a volume that contains injected data from multiple sources)`,
  `QoS Class:                   Burstable`,`Node-Selectors:              <none>`,`Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Exists for 300s\n                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s`,
  evT(podEvents(s,p))].join('\n')}
function describeNode(s,n){const pods=s.pods.filter(p=>p.node===n.name);const cpu=pods.length*250+(n.name==='controlplane'?950:350);
 const cond=n.ready?[['MemoryPressure','False','KubeletHasSufficientMemory','kubelet has sufficient memory available'],['DiskPressure','False','KubeletHasNoDiskPressure','kubelet has no disk pressure'],['PIDPressure','False','KubeletHasSufficientPID','kubelet has sufficient PID available'],['Ready','True','KubeletReady','kubelet is posting ready status']]
  :[['MemoryPressure','Unknown','NodeStatusUnknown','Kubelet stopped posting node status.'],['DiskPressure','Unknown','NodeStatusUnknown','Kubelet stopped posting node status.'],['PIDPressure','Unknown','NodeStatusUnknown','Kubelet stopped posting node status.'],['Ready','Unknown','NodeStatusUnknown','Kubelet stopped posting node status.']];
 return[`Name:               ${n.name}`,`Roles:              ${n.role}`,`Labels:             kubernetes.io/arch=amd64\n                    kubernetes.io/hostname=${n.name}\n                    kubernetes.io/os=linux${n.name==='controlplane'?'\n                    node-role.kubernetes.io/control-plane=':''}`,
  `CreationTimestamp:  ${rfc(ago(86400*29))}`,`Taints:             ${n.name==='controlplane'?'node-role.kubernetes.io/control-plane:NoSchedule':n.ready?'<none>':'node.kubernetes.io/unreachable:NoExecute\n                    node.kubernetes.io/unreachable:NoSchedule'}`,`Unschedulable:      false`,
  `Conditions:\n  ${table(cond.map(c=>[c[0],c[1],n.ready?'Thu, 26 Nov 2026 17:01:12':'Thu, 26 Nov 2026 16:52:40',c[2],c[3]]),['Type','Status','LastHeartbeatTime','Reason','Message']).split('\n').join('\n  ')}`,
  `Addresses:\n  InternalIP:  ${n.ip}\n  Hostname:    ${n.name}`,`Capacity:\n  cpu:                2\n  memory:             4015300Ki\n  pods:               110`,`Allocatable:\n  cpu:                2\n  memory:             3912900Ki\n  pods:               110`,
  `System Info:\n  Kernel Version:             6.8.0-48-generic\n  OS Image:                   Ubuntu 24.04.1 LTS\n  Container Runtime Version:  containerd://1.7.22\n  Kubelet Version:            v1.31.2`,
  `Non-terminated Pods:          (${pods.length+2} in total)\n  ${table([['kube-system','kube-proxy-'+hs(n.name,5),'0 (0%)','0 (0%)','30d'],['kube-system','calico-node-'+hs(n.name+'c',5),'250m (12%)','0 (0%)','30d'],...pods.map(p=>['default',p.name,(p.cpu?p.cpu*1000+'m':'250m')+` (${p.cpu?200:12}%)`,'500m (25%)',p.age])],['Namespace','Name','CPU Requests','CPU Limits','Age']).split('\n').join('\n  ')}`,
  `Allocated resources:\n  Resource           Requests     Limits\n  cpu                ${cpu}m (${Math.round(cpu/20)}%)   ${pods.length*500}m (${pods.length*25}%)\n  memory             ${pods.length*128+140}Mi (${Math.round((pods.length*128+140)/38)}%)  ${pods.length*512+170}Mi`,
  evT(n.ready?[]:[['Normal','NodeNotReady','8m','node-controller',`Node ${n.name} status is now: NodeNotReady`]])].join('\n')}
function describeDep(s,d){const pods=s.pods.filter(p=>p.owner?.name===d.name);const un=d.replicas-d.ready;
 return[`Name:                   ${d.name}`,`Namespace:              default`,`CreationTimestamp:      ${rfc(ago(86400*2))}`,`Labels:                 app=${d.name.replace(/-v\d$/,'')}`,`Selector:               ${Object.entries(d.labels||{app:d.name}).filter(([k])=>k!=='pod-template-hash').map(([k,v])=>k+'='+v).join(',')}`,
  `Replicas:               ${d.replicas} desired | ${d.replicas} updated | ${d.replicas} total | ${d.ready} available | ${un} unavailable`,`StrategyType:           RollingUpdate`,`MinReadySeconds:        0`,`RollingUpdateStrategy:  25% max unavailable, 25% max surge`,
  `Pod Template:\n  Labels:  app=${d.name.replace(/-v\d$/,'')}\n  Containers:\n   ${d.name.replace(/-v\d$/,'')}:\n    Image:      ${d.image}\n    Port:       8080/TCP\n    Limits:\n      cpu:     500m\n      memory:  ${s.lesson==='pods'&&s.step===7?'256Mi':'512Mi'}`,
  `Conditions:\n  Type           Status  Reason\n  ----           ------  ------\n  Available      ${un?'False':'True'}    ${un?'MinimumReplicasUnavailable':'MinimumReplicasAvailable'}\n  Progressing    True    NewReplicaSetAvailable`,
  `OldReplicaSets:  <none>`,`NewReplicaSet:   ${d.name}-${hs(d.name+s.lesson,9)} (${d.replicas}/${d.replicas} replicas created)`,
  evT([['Normal','ScalingReplicaSet','2d','deployment-controller',`Scaled up replica set ${d.name}-${hs(d.name+s.lesson,9)} from 0 to ${d.replicas}`]])].join('\n')}
function describeSvc(s,sv){const e=sv.selector?epsOf(s,sv):[];
 return[`Name:                     ${sv.name}`,`Namespace:                default`,`Labels:                   ${sv.selector?'app='+sv.name:'component=apiserver'}`,`Annotations:              <none>`,`Selector:                 ${sv.selector?Object.entries(sv.selector).map(([k,v])=>k+'='+v).join(','):'<none>'}`,`Type:                     ${sv.type}`,`IP Family Policy:         SingleStack`,`IP Families:              IPv4`,`IP:                       ${sv.ip}`,`IPs:                      ${sv.ip}`,
  `Port:                     <unset>  ${sv.port}`,`TargetPort:               ${sv.target||6443}/TCP`,`Endpoints:                ${sv.selector?(e.length?e.map(p=>p.ip+':'+sv.target).join(','):''):'192.168.1.10:6443'}`,`Session Affinity:         None`,`Internal Traffic Policy:  Cluster`,'Events:                   <none>'].join('\n')}

/* ---------- logs ---------- */
function logsOf(s,p,f){const t=sec=>iso(ago(sec));
 if(p.sys)return{txt:'I1126 17:01:02.112310       1 leaderelection.go:254] successfully acquired lease'};
 if(p.containers.length>1&&!f.c)return{txt:`Defaulted container "${p.containers[0]}" out of: ${p.containers.join(', ')}\n`+logsOf(s,p,{...f,c:p.containers[0]}).txt};
 const c=f.c||p.containers[0];
 if(!p.containers.includes(c))return{txt:`error: container ${c} is not valid for pod ${p.name}`,err:1};
 if(p.status==='ImagePullBackOff')return{txt:`Error from server (BadRequest): container "${c}" in pod "${p.name}" is waiting to start: trying and failing to pull image`,err:1};
 if(p.unsched||p.status==='ContainerCreating')return{txt:`Error from server (BadRequest): container "${c}" in pod "${p.name}" is waiting to start: ContainerCreating`,err:1};
 if(p.init&&c===p.containers[0])return{txt:`Error from server (BadRequest): container "${c}" in pod "${p.name}" is waiting to start: PodInitializing`,err:1};
 if(f.prev&&!p.restarts&&p.status!=='Error')return{txt:`Error from server (BadRequest): previous terminated container "${c}" in pod "${p.name}" not found`,err:1};
 if(c==='log')return{txt:[`[sidecar] tail -F /var/log/app/api.log`,...API_LOGS(t).slice(2)].join('\n')};
 if(c==='proxy')return{txt:`[proxy] listening on :15001, forwarding to 127.0.0.1:8080\n[proxy] ${t(9)} GET /api 200 14ms`};
 if(c==='adapter')return{txt:`# HELP app_requests_total Total requests\napp_requests_total{code="200"} 18231\napp_requests_total{code="500"} 12`};
 if(c==='wait-for-db')return{txt:'esperando db\nesperando db\nesperando db'};
 const lb=p.lb;
 if(p.reason==='OOMKilled')return{txt:[`${t(175)} INFO  starting loja-api v1.0 on :8080`,`${t(174)} INFO  connected to postgres db:5432 (pool=10)`,`${t(160)} INFO  GET /healthz 200 1ms`,`${t(150)} INFO  importing catalog batch 1/40`,`${t(141)} WARN  heap 198Mi / limit 256Mi`,`${t(133)} WARN  heap 241Mi / limit 256Mi`,`${t(129)} INFO  importing catalog batch 7/40`].join('\n')+(f.prev?'':'')};
 if(p.reason==='crash'&&lb==='java')return{txt:[`${t(160)}  INFO 1 --- [main] c.l.relatorios.Application : Starting Application v2.3 using Java 21`,`${t(150)}  INFO 1 --- [main] c.l.relatorios.Application : Loading 4.2 GB of report templates...`,`${t(132)}  INFO 1 --- [main] o.s.b.w.e.tomcat.TomcatWebServer : Tomcat initialized with port 8080`,`${t(129)}  INFO 1 --- [ionShutdownHook] o.s.b.w.e.tomcat.GracefulShutdown : Commencing graceful shutdown (SIGTERM)`].join('\n')};
 if(p.probeDb)return{txt:[`${t(30)} INFO  GET /health/full -> checking db:5432`,`${t(29)} ERROR health check failed: dial tcp 10.96.88.14:5432: connect: connection refused`,`${t(29)} INFO  GET /health/full 500 1003ms`].join('\n')};
 if(p.reason==='crash')return{txt:[`${t(70)} INFO  starting loja-api v1.0 on :8080`,`${t(69)} ERROR cannot connect to db:5432: connection refused`,`${t(69)} FATAL exiting with code 1`].join('\n')};
 if(p.status==='Error')return{txt:lb==='job'||/relatorio/.test(p.name)?'gerando relatorio...\nerro: arquivo /data/vendas.csv não encontrado\n':[`${t(80)} INFO  starting loja-api v1.0 on :8080`,`${t(79)} FATAL panic: runtime error: invalid memory address or nil pointer dereference`].join('\n')};
 if(p.reason==='readiness'||p.reason==='loading')return{txt:[`${t(20)} INFO  starting loja-api v1.0 on :8080`,`${t(19)} INFO  warming cache: 18% (9.000 / 50.000 produtos)`,`${t(9)} INFO  warming cache: 41% (20.500 / 50.000 produtos)`,p.reason==='readiness'?`${t(4)} INFO  GET /ready 503 0ms (cache not ready)`:`${t(3)} WARN  GET /api/produtos 503 0ms (cache not ready)`].join('\n')};
 if(p.reason==='frozen')return{txt:[`${t(900)} INFO  GET /api/produtos 200 16ms`,`${t(880)} WARN  worker pool exhausted (10/10 busy)`,`${t(870)} WARN  deadlock detected? waiting for lock orders_tx`].join('\n')};
 if(p.reason==='startup')return{txt:`${t(80)}  INFO 1 --- [main] c.l.relatorios.Application : Starting Application v2.3 using Java 21\n${t(70)}  INFO 1 --- [main] c.l.relatorios.Application : Loading 4.2 GB of report templates... (37%)`};
 if(lb==='web')return{txt:[`/docker-entrypoint.sh: Configuration complete; ready for start up`,`10.1.0.1 - - [${new Date().toUTCString()}] "GET / HTTP/1.1" 200 1532 "-" "Mozilla/5.0"`,`10.1.0.1 - - [${new Date().toUTCString()}] "GET /static/app.js HTTP/1.1" 200 48213 "-" "Mozilla/5.0"`].join('\n')};
 if(lb==='db'||/^db-/.test(lb))return{txt:`${t(600)} UTC [1] LOG:  starting PostgreSQL 16.4 on x86_64-pc-linux-gnu\n${t(599)} UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432\n${t(598)} UTC [1] LOG:  database system is ready to accept connections`};
 if(lb==='agent')return{txt:`[${t(120)}] [ info] [fluent bit] version=3.0.7\n[${t(119)}] [ info] [input:tail:tail.0] initializing\n[${t(110)}] [ info] [output:forward:forward.0] worker #0 started`};
 if(/^job/.test(lb))return{txt:'ok'};
 if(lb==='backup')return{txt:new Date().toUTCString()};
 if(lb==='java')return{txt:`${t(300)}  INFO 1 --- [main] c.l.relatorios.Application : Started Application in 212.4 seconds`};
 if(/^v\d$/.test(lb))return{txt:`${t(60)} INFO  loja ${lb==='v2'?'2.0':'1.0'} listening on :8080\n${t(5)} INFO  GET / 200 9ms`};
 return{txt:(p.restarts?[`${t(12)} INFO  starting loja-api v1.0 on :8080 (restart #${p.restarts})`,`${t(11)} INFO  connected to postgres db:5432 (pool=10)`,`${t(2)} INFO  GET /healthz 200 1ms`]:API_LOGS(t)).join('\n')};
}

/* ---------- yaml ---------- */
function podYaml(s,p){return`apiVersion: v1
kind: Pod
metadata:
  name: ${p.name}
  namespace: ${p.ns||'default'}
  labels:
${Object.entries(p.labels||{}).map(([k,v])=>`    ${k}: ${v}`).join('\n')}
spec:
  nodeName: ${p.node}
  containers:
${(p.containers||[]).map((c,i)=>`  - name: ${c}\n    image: ${i?IMG[c]||'busybox:1.36':p.image}\n    resources:\n      requests: {cpu: 250m, memory: 128Mi}\n      limits: {cpu: 500m, memory: ${p.reason==='OOMKilled'?'256Mi':'512Mi'}}`).join('\n')}
status:
  phase: ${p.phase||'Running'}
  podIP: ${p.ip}`}
function dryYaml(kind,name,img,f){
 if(kind==='pod')return`apiVersion: v1
kind: Pod
metadata:
  creationTimestamp: null
  labels:
    run: ${name}
  name: ${name}
spec:
  containers:
  - image: ${img}
    name: ${name}
${f.kv.port?`    ports:\n    - containerPort: ${f.kv.port}\n`:''}    resources: {}
  dnsPolicy: ClusterFirst
  restartPolicy: ${f.kv.restart||'Always'}
status: {}`;
 if(kind==='deployment')return`apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: ${name}
  name: ${name}
spec:
  replicas: ${f.kv.replicas||1}
  selector:
    matchLabels:
      app: ${name}
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: ${name}
    spec:
      containers:
      - image: ${img}
        name: ${img.split('/').pop().split(':')[0]}
        resources: {}
status: {}`;
 if(kind==='job')return`apiVersion: batch/v1
kind: Job
metadata:
  creationTimestamp: null
  name: ${name}
spec:
  template:
    metadata:
      creationTimestamp: null
    spec:
      containers:
      - image: ${img}
        name: ${name}
        resources: {}
      restartPolicy: Never
status: {}`;
 return`apiVersion: v1
kind: ${kind}
metadata:
  name: ${name}`}

/* ---------- top ---------- */
function top(s,f){const what=RT[f.rest[1]]||f.rest[1];
 if(what==='nodes')return{txt:table(s.nodes.map(n=>n.ready?[n.name,(120+hn(n.name,700))+'m',Math.round((120+hn(n.name,700))/20)+'%',(900+hn(n.name+'m',1600))+'Mi',Math.round((900+hn(n.name+'m',1600))/38)+'%']:[n.name,'<unknown>','<unknown>','<unknown>','<unknown>']),['NAME','CPU(cores)','CPU(%)','MEMORY(bytes)','MEMORY(%)']),hiE:s.nodes.map(n=>n.eid).filter(Boolean)};
 const L=s.pods.filter(p=>p.status==='Running');if(!L.length)return{txt:'No resources found in default namespace.'};
 return{txt:table(L.map(p=>[p.name,(p.reason==='OOMKilled'?480:5+hn(p.name,180))+'m',(p.reason==='OOMKilled'?250:40+hn(p.name+'m',200))+'Mi']),['NAME','CPU(cores)','MEMORY(bytes)']),hi:L}}

/* ---------- mutations ---------- */
function newPod(s,owner,lb,node){const name=`${owner.name}-${hs(owner.name+s.lesson,9)}-${hs(owner.name+Math.random(),5)}`;return{name,lb,ns:'default',node,ip:ipFor(name,node),owner,containers:[owner.name.replace(/-v\d$/,'')],labels:{app:owner.name.replace(/-v\d$/,''),'pod-template-hash':hs(owner.name+s.lesson,9)},image:IMG[owner.name]||IMG[lb]||'loja/'+lb+':1.0',status:'ContainerCreating',ready:false,restarts:0,age:'1s',phase:'Pending'}}
function scale(s,f){const t=(f.rest[1]||'').replace(/^(deploy|deployment|deployments)\//,'');const name=f.rest[2]||(t.includes('/')?t.split('/')[1]:t);const dn=/^(deploy|deployment|deployments)$/.test(f.rest[1])?f.rest[2]:t;
 const d=s.deps[dn];if(!d)return err404('deployments.apps',dn||'');const n=+f.kv.replicas;if(!(n>=0))return{txt:'error: --replicas=COUNT is required, and COUNT must be greater than or equal to 0',err:1};
 const mine=s.pods.filter(p=>p.owner?.name===dn&&!p.gone&&p.status!=='Terminating');
 if(n>mine.length){const nodes=s.nodes.filter(x=>x.ready&&x.name!=='controlplane');for(let i=mine.length;i<n;i++){const p=newPod(s,mine[0]?.owner||{kind:'Deployment',name:dn},mine[0]?.lb||dn,nodes[i%nodes.length].name);s.pods.push(p);setTimeout(()=>{p.status='Running';p.ready=true;p.phase='Running';p.age='14s';d.ready++},4000)}}
 else mine.slice(n).forEach(p=>{p.status='Terminating';p.ready=false;setTimeout(()=>{p.gone=1},3000)});
 d.replicas=n;d.ready=Math.min(d.ready,n);return{txt:`deployment.apps/${dn} scaled`}}
function del(s,f){const k=RT[f.rest[1]]||f.rest[1];let n=f.rest[2];if((f.rest[1]||'').includes('/')){const[a,b]=f.rest[1].split('/');n=b;if(!/^(pod|pods|po)$/.test(a))return{txt:`${a}.apps "${b}" deleted`}}
 if(k!=='pods')return n?{txt:`${(f.rest[1]||'').replace(/s$/,'')} "${n}" deleted`}:{txt:'error: resource(s) were provided, but no name was specified',err:1};
 const p=s.pods.find(x=>x.name===n&&!x.gone);if(!p)return err404('pods',n||'');
 p.status='Terminating';p.ready=false;setTimeout(()=>{p.gone=1},2500);
 const out={txt:`pod "${n}" deleted`,hi:[p]};
 if(p.owner&&(p.owner.kind==='Deployment'||p.owner.kind==='DaemonSet'||p.owner.kind==='StatefulSet')){const nodes=s.nodes.filter(x=>x.ready&&x.name!=='controlplane');const r=p.owner.kind==='StatefulSet'?{...clone(p),status:'ContainerCreating',ready:false,age:'1s',restarts:0}:newPod(s,p.owner,p.lb,p.owner.kind==='DaemonSet'?p.node:nodes[hn(n,nodes.length)].name);s.pods.push(r);setTimeout(()=>{r.status='Running';r.ready=true;r.phase='Running';r.age='9s'},3500);
  out.note=LANG==='pt'?`# O ${p.owner.kind} já está criando um substituto. Rode kubectl get pods de novo.`:`# The ${p.owner.kind} is already creating a replacement. Run kubectl get pods again.`}
 return out}

/* ---------- troubleshooting shell extras ---------- */
function shellCmd(s,line){const so=s.so;
 if(/^(sudo )?systemctl (status|is-active) kubelet/.test(line)){const dead=so.kubelet==='dead';return{txt:dead?`○ kubelet.service - kubelet: The Kubernetes Node Agent
     Loaded: loaded (/usr/lib/systemd/system/kubelet.service; enabled; preset: enabled)
    Drop-In: /usr/lib/systemd/system/kubelet.service.d
             └─10-kubeadm.conf
     Active: activating (auto-restart) (Result: exit-code) since ${new Date().toUTCString()}; 4s ago
    Process: 48211 ExecStart=/usr/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS (code=exited, status=1/FAILURE)
   Main PID: 48211 (code=exited, status=1/FAILURE)`:`● kubelet.service - kubelet: The Kubernetes Node Agent
     Loaded: loaded (/usr/lib/systemd/system/kubelet.service; enabled; preset: enabled)
    Drop-In: /usr/lib/systemd/system/kubelet.service.d
             └─10-kubeadm.conf
     Active: active (running) since ${new Date().toUTCString()}; 2min ago
   Main PID: 51022 (kubelet)
      Tasks: 13 (limit: 4598)
     Memory: 41.2M`,hiE:['k2']}}
 if(/^(sudo )?journalctl .*kubelet/.test(line)){return{txt:so.kubelet==='dead'?`kubelet[48211]: E1126 16:52:40.118 run.go:72] "command failed" err="failed to load kubelet config file, path: /var/lib/kubelet/config.yml, error: open /var/lib/kubelet/config.yml: no such file or directory"
systemd[1]: kubelet.service: Main process exited, code=exited, status=1/FAILURE
systemd[1]: kubelet.service: Failed with result 'exit-code'.
# Dica: o arquivo certo é /var/lib/kubelet/config.yaml (veja o drop-in 10-kubeadm.conf)`.replace('# Dica: o arquivo certo é','# '+(LANG==='pt'?'Dica: o arquivo certo é':'Tip: the right file is')).replace('(veja o drop-in','('+(LANG==='pt'?'veja o drop-in':'see the drop-in')):`kubelet[51022]: I1126 17:00:02.441 kubelet.go:2392] "Starting kubelet main sync loop"
kubelet[51022]: I1126 17:00:03.019 kubelet_node_status.go:76] "Successfully registered node" node="node-3"`,hiE:['k2']}}
 if(/^(sudo )?systemctl (restart|start) kubelet/.test(line))return{txt:''};
 if(/^(sudo )?crictl ps/.test(line)){const ex=so.apiExited;return{txt:table([
  [ex?'7f3e2a9c1b4d':'a1c9e2f7d3b8',hs('img1',13),'40 seconds ago',ex?'Exited':'Running','kube-apiserver',ex?'7':'0',hs('pod1',13),'kube-apiserver-controlplane'],
  ['3b8d1e6f0a2c',hs('img2',13),'30 days ago','Running','etcd','0',hs('pod2',13),'etcd-controlplane'],
  ['9e4f7a2b5c1d',hs('img3',13),'30 days ago','Running','kube-scheduler','0',hs('pod3',13),'kube-scheduler-controlplane'],
  ['5c2a8d9e3f7b',hs('img4',13),'30 days ago','Running','kube-controller-manager','0',hs('pod4',13),'kube-controller-manager-controlplane'],
  ['1d6b3f8a4e9c',hs('img5',13),'30 days ago','Running','kube-proxy','0',hs('pod5',13),'kube-proxy-'+hs('controlplane',5)]],['CONTAINER','IMAGE','CREATED','STATE','NAME','ATTEMPT','POD ID','POD']),hiE:['sa','se','ss']}}
 if(/^(sudo )?crictl logs/.test(line))return{txt:so.apiExited?`I1126 17:02:01.002 options.go:228] external host was not specified, using 192.168.1.10
E1126 17:02:01.311 run.go:72] "command failed" err="unknown flag: --etcd-servrs"`:'I1126 17:00:01.002 server.go:150] Version: v1.31.2',hiE:['sa']};
 if(/^(sudo )?cat \/etc\/kubernetes\/manifests\/kube-apiserver\.yaml/.test(line))return{txt:`    - --advertise-address=192.168.1.10\n    - --etcd-cafile=/etc/kubernetes/pki/etcd/ca.crt\n    - --${so.apiExited?'etcd-servrs':'etcd-servers'}=https://127.0.0.1:2379\n    - --secure-port=6443`};
 if(/^ssh /.test(line))return{txt:`Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-48-generic x86_64)\n# ${LANG==='pt'?'(simulado: os comandos continuam aqui mesmo)':'(simulated: commands keep running here)'}`};
 return null}

/* ---------- main dispatcher ---------- */
function exec(line){const s=ST,so=s.so;let raw=line.trim();if(!raw)return{txt:''};
 const parts=raw.split(/\s*\|\s*/);let cmd=parts[0];
 // exact overrides
 for(const[re,txt]of(so.out||[])){if(re.test(cmd)&&txt!==null){if(typeof txt==='string'&&txt.startsWith('@describe:')){const p=s.pods.find(x=>x.name===txt.slice(10))||s.pods.find(x=>/relatorios/.test(x.name));return pipe({txt:describePod(s,p),hi:[p]},parts)}return pipe({txt},parts)}}
 if(cmd==='help'||cmd==='kubectl help'||cmd==='?')return{txt:T[LANG].help};
 if(cmd==='clear')return{clear:1};
 if(cmd==='history')return{txt:HIST.map((h,i)=>String(i+1).padStart(4)+'  '+h).join('\n')};
 const sh=shellCmd(s,cmd);if(sh)return pipe(sh,parts);
 const argv=tok(cmd);if(argv[0]==='k')argv[0]='kubectl';
 if(argv[0]!=='kubectl'){if(/^(alias|export|source|complete)\b/.test(argv[0]))return{txt:''};return{txt:`bash: ${argv[0]}: command not found\n`+T[LANG].unknownCmd(argv[0]),err:1}}
 if(so.apiDown)return{txt:'The connection to the server 192.168.1.10:6443 was refused - did you specify the right host or port?',err:1,hiE:['api','kc']};
 const verb=argv[1],f=parseArgs(argv.slice(1));
 const r=dispatch(s,verb,f,argv);return pipe(r,parts)}
function tok(s){const o=[];let cur='',q=null;for(const ch of s){if(q){if(ch===q)q=null;else cur+=ch}else if(ch==='"'||ch==="'")q=ch;else if(/\s/.test(ch)){if(cur){o.push(cur);cur=''}}else cur+=ch}if(cur)o.push(cur);return o}
function pipe(r,parts){if(!r||r.clear)return r;let txt=r.txt||'';for(const p of parts.slice(1)){const a=tok(p);if(a[0]==='grep'){const inv=a.includes('-v'),ic=a.includes('-i'),pat=a.filter(x=>!/^-/.test(x))[1]||'';const re=new RegExp(pat.replace(/[.*+?^${}()[\]\\]/g,'\\$&'),ic?'i':'');txt=txt.split('\n').filter(l=>re.test(l)!==inv).join('\n')}else if(a[0]==='tail'){const n=+(a[1]||'').replace('-n','').replace('-','')||10;txt=txt.split('\n').slice(-n).join('\n')}else if(a[0]==='head'){const n=+(a[1]||'').replace('-n','').replace('-','')||10;txt=txt.split('\n').slice(0,n).join('\n')}else if(a[0]==='wc'&&a.includes('-l')){txt=String(txt.split('\n').filter(Boolean).length)}}
 return{...r,txt}}
function dispatch(s,verb,f,argv){const one=f.rest[2];
 if(!verb)return{txt:'kubectl controls the Kubernetes cluster manager.\n\n'+T[LANG].help};
 if(verb==='get'){let k=f.rest[1]||'';if(k.includes('/')){const[a,b]=k.split('/');k=a;f.rest[1]=a;f.rest[2]=b}if(k.includes(',')){return{txt:k.split(',').map(x=>{f.rest[1]=x;return dispatch(s,'get',{...f,rest:[ 'get',x]},argv).txt}).join('\n\n')}}
  const R=RT[k];if(!k)return{txt:'You must specify the type of resource to get. Use "kubectl api-resources" for a complete list of supported resources.',err:1};
  if(!R)return{txt:`error: the server doesn't have a resource type "${k}"`,err:1};
  const n=f.rest[2];let r;
  if(R==='pods'){r=getPods(s,{...f,rest:['get','pods',n].filter(Boolean)});if(f.w&&!r.err){const w=typeof s.so.watch==='function'?s.so.watch(s.pods):[];r.watch=[...w,T[LANG].watch]}}
  else if(R==='deployments')r=getDeps(s,f,n);else if(R==='replicasets')r=getRS(s,f);else if(R==='services')r=getSvc(s,f,n);else if(R==='endpoints')r=getEp(s,f,n);else if(R==='nodes')r=getNodes(s,f,n);else if(R==='ingress')r=getIng(s,f);else if(R==='daemonsets')r=getDS(s,f);else if(R==='statefulsets')r=getSTS(s);else if(R==='jobs')r=getJobs(s);else if(R==='cronjobs')r=getCJ(s);else if(R==='pvc')r=getPVC(s);else if(R==='events')r=getEvents(s);else if(R==='all')r=getAll(s,f);
  else if(R==='namespaces')r={txt:table([['default','Active','30d'],['kube-node-lease','Active','30d'],['kube-public','Active','30d'],['kube-system','Active','30d']],['NAME','STATUS','AGE'])};
  else if(R==='pv')r=s.pvcs.length?{txt:table(s.pvcs.map(p=>[p.vol,'1Gi','RWO','Delete','Bound','default/'+p.name,'standard','<unset>','','8d']),['NAME','CAPACITY','ACCESS MODES','RECLAIM POLICY','STATUS','CLAIM','STORAGECLASS','VOLUMEATTRIBUTESCLASS','REASON','AGE'])}:{txt:'No resources found'};
  if(r&&f.o==='yaml'&&R!=='pods'&&!r.err)r={...r,txt:`# (${LANG==='pt'?'simulado: YAML completo só para pods':'simulated: full YAML only for pods'})\n`+r.txt};
  return r}
 if(verb==='describe'){let k=f.rest[1]||'',n=f.rest[2];if(k.includes('/')){[k,n]=k.split('/')}const R=RT[k];if(!R)return{txt:`error: the server doesn't have a resource type "${k}"`,err:1};
  if(R==='pods'){if(!n){const L=s.pods.filter(p=>!p.gone);return{txt:L.map(p=>describePod(s,p)).join('\n\n\n'),hi:L}}const p=s.pods.find(x=>x.name===n&&!x.gone)||sysPods(s).find(x=>x.name===n);if(!p)return err404('pods',n);if(p.sys)return{txt:`Name:             ${p.name}\nNamespace:        kube-system\nNode:             controlplane/192.168.1.10\nStatus:           Running\nControlled By:    Node/controlplane\nEvents:           <none>`};return{txt:describePod(s,p),hi:[p]}}
  if(R==='nodes'){const L=n?s.nodes.filter(x=>x.name===n):s.nodes;if(!L.length)return err404('nodes',n);return{txt:L.map(x=>describeNode(s,x)).join('\n\n\n'),hiE:L.map(x=>x.eid).filter(Boolean)}}
  if(R==='deployments'){const d=n?s.deps[n]:Object.values(s.deps)[0];if(!d)return err404('deployments.apps',n||'');return{txt:describeDep(s,d),hi:s.pods.filter(p=>p.owner?.name===d.name)}}
  if(R==='services'){const sv=s.svcs.find(x=>x.name===n)||(!n&&s.svcs[1]);if(!sv)return err404('services',n||'');return{txt:describeSvc(s,sv),hiE:[sv.eid].filter(Boolean),hi:sv.selector?epsOf(s,sv):[]}}
  if(R==='endpoints'){return getEp(s,f,n)}
  return{txt:`# (${LANG==='pt'?'simulado: describe disponível para pod, node, deploy e svc':'simulated: describe is available for pod, node, deploy and svc'})`}}
 if(verb==='logs'){let n=f.rest[1];if(!n)return{txt:'error: expected \'logs [-f] [-p] (POD | TYPE/NAME) [-c CONTAINER]\'.',err:1};n=n.replace(/^(pod|pods|po)\//,'');
  if(/^(deploy|deployment)\//.test(n)){const d=n.split('/')[1];const p=s.pods.find(x=>x.owner?.name===d&&!x.gone);if(!p)return err404('deployments.apps',d);n=p.name;}
  const p=s.pods.find(x=>x.name===n&&!x.gone);if(!p)return err404('pods',n);const r=logsOf(s,p,f);return{...r,hi:[p]}}
 if(verb==='run'){const n=f.rest[1];const img=f.kv.image;if(!n||!img)return{txt:'error: required flag(s) "image" not set',err:1};if(f.dry&&f.o==='yaml')return{txt:dryYaml('pod',n,img,f)};if(f.dry)return{txt:`pod/${n} created (dry run)`};
  s.pods.push({name:n,lb:n,ns:'default',node:'node-1',ip:ipFor(n,'node-1'),owner:null,containers:[n],labels:{run:n},image:img,status:'ContainerCreating',ready:false,restarts:0,age:'1s',phase:'Pending'});setTimeout(()=>{const p=s.pods.find(x=>x.name===n);if(p){p.status=f.kv.restart==='Never'?'Completed':'Running';p.ready=f.kv.restart!=='Never';p.age='12s';p.phase='Running'}},3500);return{txt:`pod/${n} created`}}
 if(verb==='create'){const k=f.rest[1],n=f.rest[2];if(!k)return{txt:'error: must specify one of -f and -k',err:1};
  const kind=({deployment:'deployment',deploy:'deployment',job:'job',cronjob:'cronjob',cj:'cronjob',namespace:'namespace',ns:'namespace',configmap:'configmap',cm:'configmap',secret:'secret',serviceaccount:'serviceaccount',sa:'serviceaccount',role:'role',rolebinding:'rolebinding',clusterrole:'clusterrole',clusterrolebinding:'clusterrolebinding',service:'service',svc:'service',ingress:'ingress',ing:'ingress'})[k];
  if(!kind)return{txt:`error: unknown command "${k}" for "kubectl create"`,err:1};
  if(f.dry&&f.o==='yaml')return{txt:dryYaml(kind,kind==='secret'||kind==='service'?f.rest[3]||n:n,f.kv.image||'nginx',f)};
  const nm=kind==='secret'||kind==='service'?f.rest[3]:n;
  const api={deployment:'deployment.apps',job:'job.batch',cronjob:'cronjob.batch',namespace:'namespace',configmap:'configmap',secret:'secret',serviceaccount:'serviceaccount',role:'role.rbac.authorization.k8s.io',rolebinding:'rolebinding.rbac.authorization.k8s.io',clusterrole:'clusterrole.rbac.authorization.k8s.io',clusterrolebinding:'clusterrolebinding.rbac.authorization.k8s.io',service:'service',ingress:'ingress.networking.k8s.io'}[kind];
  if(kind==='deployment'&&nm&&!s.deps[nm]){const img=f.kv.image||'nginx';const rep=+(f.kv.replicas||1);s.deps[nm]={name:nm,replicas:rep,ready:0,labels:{app:nm},image:img};const nodes=s.nodes.filter(x=>x.ready&&x.name!=='controlplane');for(let i=0;i<rep;i++){const p=newPod(s,{kind:'Deployment',name:nm},nm,nodes[i%nodes.length].name);p.image=img;s.pods.push(p);setTimeout(()=>{p.status='Running';p.ready=true;p.age='10s';p.phase='Running';s.deps[nm].ready++},3500)}}
  return{txt:`${api}/${nm||'x'} created${f.dry?' (dry run)':''}`}}
 if(verb==='apply'){const fn=f.kv.f||'';const n=fn.replace(/\.ya?ml$/,'').split('/').pop();return{txt:/deploy/.test(fn)?'deployment.apps/api configured':/svc|service/.test(fn)?'service/'+(n.replace(/-?(svc|service)/,'')||'api')+' configured':/pod/.test(fn)?`pod/${n} created`:fn?`${n.includes('-')?n.split('-').pop():'configmap'}/${n} configured`:'error: must specify one of -f and -k'}}
 if(verb==='expose'){const t=f.rest[1],n=f.rest[2]||(t||'').split('/')[1];return{txt:`service/${f.kv.name||n} exposed`}}
 if(verb==='scale')return scale(s,f);
 if(verb==='delete')return del(s,f);
 if(verb==='patch'||verb==='label'||verb==='annotate'){const t=f.rest[1]||'',n=f.rest[2]||t.split('/')[1];const k=(t.split('/')[0]||'').replace(/^svc$/,'service').replace(/^deploy$/,'deployment.apps').replace(/^po$/,'pod');return{txt:`${k}/${n} ${verb==='patch'?'patched':verb==='label'?'labeled':'annotated'}`}}
 if(verb==='set'&&f.rest[1]==='image'){const t=f.rest[2]||'';return{txt:`${t.replace(/^deploy\//,'deployment.apps/').replace(/^deployment\//,'deployment.apps/')} image updated`}}
 if(verb==='rollout'){const sub=f.rest[1],t=(f.rest[2]||'').replace(/^deploy(ment)?\//,''),n=f.rest[3]||t;const d=s.deps[n];if(!d)return err404('deployments.apps',n);
  if(sub==='status')return{txt:d.ready>=d.replicas?`deployment "${n}" successfully rolled out`:`Waiting for deployment "${n}" rollout to finish: ${d.ready} of ${d.replicas} updated replicas are available...`};
  if(sub==='history')return{txt:`deployment.apps/${n}\nREVISION  CHANGE-CAUSE\n1         <none>\n2         <none>`};
  if(sub==='undo')return{txt:`deployment.apps/${n} rolled back`};if(sub==='restart')return{txt:`deployment.apps/${n} restarted`};if(sub==='pause')return{txt:`deployment.apps/${n} paused`};if(sub==='resume')return{txt:`deployment.apps/${n} resumed`};
  return{txt:'error: unknown rollout subcommand',err:1}}
 if(verb==='top')return top(s,f);
 if(verb==='edit')return{txt:`Edit cancelled, no changes made.\n# ${LANG==='pt'?'(simulado: o editor não abre aqui; na prova use kubectl edit ou -o yaml > arquivo)':'(simulated: no editor here; in the exam use kubectl edit or -o yaml > file)'}`};
 if(verb==='explain'){const k=f.rest[1]||'pod';return{txt:`KIND:       ${k.split('.')[0].replace(/^./,c=>c.toUpperCase())}\nVERSION:    v1\n\nFIELD: ${k} <Object>\n\nDESCRIPTION:\n    ${LANG==='pt'?'(simulado) Use kubectl explain para ver os campos de qualquer recurso sem sair do terminal.':'(simulated) Use kubectl explain to see any resource field without leaving the terminal.'}`}}
 if(verb==='auth')return{txt:'yes'};
 if(verb==='version')return{txt:'Client Version: v1.31.2\nKustomize Version: v5.4.2\nServer Version: v1.31.2'};
 if(verb==='cluster-info')return{txt:'Kubernetes control plane is running at https://192.168.1.10:6443\nCoreDNS is running at https://192.168.1.10:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy'};
 if(verb==='config')return{txt:/current-context/.test(argv.join(' '))?'kubernetes-admin@kubernetes':table([['*','kubernetes-admin@kubernetes','kubernetes','kubernetes-admin','']],['CURRENT','NAME','CLUSTER','AUTHINFO','NAMESPACE'])};
 if(verb==='api-resources')return{txt:table([['pods','po','v1','true','Pod'],['services','svc','v1','true','Service'],['deployments','deploy','apps/v1','true','Deployment'],['daemonsets','ds','apps/v1','true','DaemonSet'],['statefulsets','sts','apps/v1','true','StatefulSet'],['jobs','','batch/v1','true','Job'],['cronjobs','cj','batch/v1','true','CronJob'],['ingresses','ing','networking.k8s.io/v1','true','Ingress'],['nodes','no','v1','false','Node']],['NAME','SHORTNAMES','APIVERSION','NAMESPACED','KIND'])};
 if(verb==='exec')return{txt:/env/.test(argv.join(' '))?'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin\nHOSTNAME='+(f.rest[1]||'pod'):`# ${LANG==='pt'?'(simulado: exec não abre shell aqui)':'(simulated: exec does not open a shell here)'}`};
 if(verb==='cordon'||verb==='uncordon'||verb==='drain'){const n=f.rest[1];const nd=s.nodes.find(x=>x.name===n);if(!nd)return err404('nodes',n||'');return{txt:verb==='drain'?`node/${n} cordoned\nevicting pod default/${(s.pods.find(p=>p.node===n)||{name:'api'}).name}\nnode/${n} drained`:`node/${n} ${verb}ed`,hiE:[nd.eid].filter(Boolean)}}
 return{txt:`error: unknown command "${verb}" for "kubectl"\n\nDid you mean this?\n\tget\n\tdescribe\n\tlogs\n`+T[LANG].unknownVerb(verb),err:1}}

/* ---------- suggestions ---------- */
function suggest(s,cmd){const o=[];const add=c=>{if(c&&!o.includes(c))o.push(c)};
 const res=c=>c&&c.replace('$P0',(s.pods[0]||{}).name||'api');
 if(s.so.chips)s.so.chips.forEach(c=>add(res(c)));
 if(cmd)add(cmd.replace(/^kubectl logs api-7d9/,'kubectl logs api-7d9'));
 if(s.so.apiDown)return o.slice(0,4);
 const bad=s.pods.find(p=>!p.gone&&p.status!=='Running'&&p.status!=='Completed')||s.pods.find(p=>!p.ready&&p.status==='Running');
 add('kubectl get pods'+(s.lesson==='pods'&&s.step>=6?' -o wide':''));
 if(bad){add('kubectl describe pod '+bad.name);if(bad.restarts)add(`kubectl logs ${bad.name} --previous`)}
 const sv=s.svcs.find(x=>x.selector);if(sv)add('kubectl get endpoints '+sv.name);
 if(s.nodes.some(n=>!n.ready))add('kubectl get nodes');
 if(Object.keys(s.deps).length&&o.length<4)add('kubectl get deploy');
 if(!bad&&s.pods[0]&&o.length<4)add('kubectl logs '+s.pods[0].name);
 return o.slice(0,4)}

/* ---------- UI ---------- */
let root,out,inp,chipsEl,hiFn,lastKey='',busy=false,QUEUE=[];
function esc(t){return String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c])}
function color(l){return esc(l).replace(/\b(Running|Ready|Completed|Bound|Active|True|created|configured|exposed|scaled|patched|deleted|successfully rolled out)\b/g,'<i class="tg">$1</i>').replace(/\b(CrashLoopBackOff|ImagePullBackOff|ErrImagePull|OOMKilled|Error|NotReady|Failed|FailedScheduling|Unhealthy|BackOff|Warning|Unknown|refused|NotFound|FATAL|ERROR|Exited|Insufficient cpu)\b/g,'<i class="tr">$1</i>').replace(/\b(Pending|ContainerCreating|Terminating|Init:0\/1|WARN|Waiting|activating)\b/g,'<i class="ty">$1</i>')}
function print(lines,cls,done){const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;const arr=lines.split('\n');
 if(reduce||arr.length>60){out.insertAdjacentHTML('beforeend',arr.map(l=>`<div class="${cls||''}">${cls==='cm'?esc(l):cls==='nt'?esc(l):color(l)||'&nbsp;'}</div>`).join(''));out.scrollTop=out.scrollHeight;done&&done();return}
 let i=0;const dt=Math.max(6,Math.min(28,500/arr.length));const tick=()=>{if(i>=arr.length){done&&done();return}const l=arr[i++];out.insertAdjacentHTML('beforeend',`<div class="${cls||''}">${cls==='nt'?esc(l):color(l)||'&nbsp;'}</div>`);out.scrollTop=out.scrollHeight;setTimeout(tick,dt)};tick()}
function run(line){if(busy){QUEUE.push(line);return}line=line.trim();if(!line)return;HIST.push(line);HI=HIST.length;
 out.insertAdjacentHTML('beforeend',`<div class="cm"><b>$</b> ${esc(line)}</div>`);out.scrollTop=out.scrollHeight;
 let r;try{r=exec(line)}catch(e){r={txt:'error: '+e.message,err:1};console.error(e)}
 if(r&&r.clear){out.innerHTML='';return}
 busy=true;const fin=()=>{busy=false;if(r.hi||r.hiE)hiFn([...(r.hi||[]).flatMap(p=>p.eid||[]),...(r.hiE||[])]);if(QUEUE.length)run(QUEUE.shift())};
 const after=()=>{if(r.note)print(r.note,'nt',fin);else fin()};
 const w=()=>{if(r.watch&&r.watch.length){let k=0;const nx=()=>{if(k>=r.watch.length){after();return}const l=r.watch[k++];setTimeout(()=>print(l,/^#/.test(l)?'nt':'',nx),900)};nx()}else after()};
 if(r.txt==='')w();else print(r.txt||'',r.err?'er':'',w)}
function init(o){root=document.getElementById('term');if(!root)return;hiFn=o.hi;
 root.innerHTML=`<div class="thd"><span class="tdots"><i></i><i></i><i></i></span><b class="ttl"></b><em class="tsim"></em><button type="button" class="tclr"></button></div><div class="tchips"><span class="ttry"></span><span class="tcl"></span></div><div class="tout" role="log" aria-live="polite"></div><label class="tin"><b>$</b><input type="text" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="kubectl"></label>`;
 out=root.querySelector('.tout');inp=root.querySelector('input');chipsEl=root.querySelector('.tcl');
 inp.addEventListener('keydown',e=>{if(e.key==='Enter'){const v=inp.value;inp.value='';run(v)}else if(e.key==='ArrowUp'){if(HI>0){HI--;inp.value=HIST[HI];e.preventDefault()}}else if(e.key==='ArrowDown'){if(HI<HIST.length-1){HI++;inp.value=HIST[HI]}else{HI=HIST.length;inp.value=''}e.preventDefault()}else if(e.key==='l'&&e.ctrlKey){out.innerHTML='';e.preventDefault()}e.stopPropagation()});
 root.querySelector('.tclr').addEventListener('click',()=>{out.innerHTML='';inp.focus()});
 chipsEl.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;inp.value='';run(b.dataset.c);inp.focus({preventScroll:true})});
 out.addEventListener('click',()=>{if(!getSelection().toString())inp.focus({preventScroll:true})})}
function ui(){const t=T[LANG];root.querySelector('.ttl').textContent=t.title;root.querySelector('.tsim').textContent=t.sim;root.querySelector('.tclr').textContent=t.clear;root.querySelector('.ttry').textContent=t.try;inp.placeholder=t.ph}
function step(c){if(!root)return;LANG=c.lang;const on=LESSONS.includes(c.lesson);root.hidden=!on;if(!on)return;ui();
 const key=c.lesson+'-'+c.step+'-'+LANG;if(key===lastKey)return;
 const newLesson=!lastKey.startsWith(c.lesson+'-');lastKey=key;CTX=c;
 ST=derive(c);
 if(newLesson)out.innerHTML='';else if(out.children.length)out.insertAdjacentHTML('beforeend',`<div class="sep">── ${esc(T[LANG].step)} ${c.step+1} · ${esc(c.title)} ──</div>`);
 const sg=suggest(ST,c.cmd);chipsEl.innerHTML=sg.map(x=>`<button type="button" data-c="${esc(x)}">${esc(x)}</button>`).join('');
 inp.value=c.cmd||'';out.scrollTop=out.scrollHeight}
function runNow(cmd){if(!root||root.hidden)return;root.scrollIntoView({behavior:'smooth',block:'nearest'});inp.value='';run(cmd);inp.focus({preventScroll:true})}
window.K8STERM={init,step,run:runNow,has:id=>LESSONS.includes(id),T:()=>T[LANG],_exec:exec,_state:()=>ST};
})();
