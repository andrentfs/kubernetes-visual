/* Kubernetes Visual — js/term/lessons.js
   Dados do terminal simulado por lição e passo (sem lógica de interpretação).
   - LESSONS: lições que mostram o terminal.
   - OV[lição][passo|'all']: ajustes do estado derivado do diagrama.
     names:{eid:nome}  pods:{eid:{patch}}  set:[lista completa de pods]  svc:{eid:{name,selector}}
     deploys:[{name,replicas}]  out:[[regex,texto]]  watch:fn  apiDown  chips:[comandos]  …
   Carregar ANTES de js/term/engine.js. */
(function(){
const LESSONS=['pods','workloads','config','storage','service','network','netpol','probes','nodefail','trouble'];
const NP=(ns,name,sel,ing,eg,types)=>({ns,name,sel,ing:ing||(types.includes('Ingress')?'Allowing ingress traffic:\n  <none> (Selected pods are isolated for ingress connectivity)':null),eg,types});
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
 config:{
  all:{uid:1000},
  1:{env:{DB_HOST:'prod-db',LOG_LEVEL:'debug'},chips:['kubectl exec api -- env','kubectl get cm']},
  2:{chips:['kubectl create configmap loja-config --from-literal=DB_HOST=db','kubectl get cm','kubectl describe cm loja-config']},
  3:{files:{'/etc/config/DB_HOST':'db','/etc/config/LOG_LEVEL':'info'},chips:['kubectl exec $E:a0 -- env','kubectl exec $E:a1 -- ls /etc/config','kubectl exec $E:a1 -- cat /etc/config/DB_HOST']},
  4:{cmData:{DB_HOST:'db-v2',LOG_LEVEL:'info'},env:{DB_HOST:'db'},files:{'/etc/config/DB_HOST':'db-v2','/etc/config/LOG_LEVEL':'info'},chips:['kubectl get cm loja-config -o yaml','kubectl exec $E:a0 -- env','kubectl exec $E:a1 -- cat /etc/config/DB_HOST','kubectl rollout restart deployment/api']},
  5:{chips:['kubectl create secret generic db-cred --from-literal=password=s3nh4','kubectl get secret','kubectl describe secret db-cred',"kubectl get secret db-cred -o jsonpath='{.data.password}' | base64 -d"]},
  6:{chips:['kubectl create secret tls loja-tls --cert=tls.crt --key=tls.key','kubectl get secret','kubectl create secret docker-registry regcred --docker-server=registry.loja.com --docker-username=loja --docker-password=s3nh4']},
  7:{uid:0,chips:['kubectl exec $E:a0 -- id','kubectl exec $E:a0 -- whoami','kubectl describe pod $E:a0']},
  8:{chips:['kubectl exec $E:a0 -- id','kubectl exec $E:a1 -- id']},
  9:{chips:['kubectl exec $E:a0 -- id','kubectl describe pod $E:a1']},
  10:{nsList:[['loja','kubernetes.io/metadata.name=loja,pod-security.kubernetes.io/enforce=restricted']],out:[[/^kubectl run root/,'Error from server (Forbidden): pods "root" is forbidden: violates PodSecurity "restricted:latest": allowPrivilegeEscalation != false (container "root" must set securityContext.allowPrivilegeEscalation=false), unrestricted capabilities (container "root" must set securityContext.capabilities.drop=["ALL"]), runAsNonRoot != true (pod or container "root" must set securityContext.runAsNonRoot=true), seccompProfile (pod or container "root" must set securityContext.seccompProfile.type to "RuntimeDefault" or "Localhost")']],chips:['kubectl label ns loja pod-security.kubernetes.io/enforce=restricted','kubectl run root --image=nginx -n loja','kubectl get ns loja --show-labels']},
 },
 storage:{
  all:{pvName:'pv-dados'},
  1:{chips:['kubectl get pods','kubectl logs $E:db2','kubectl get pvc']},
  2:{pods:{w:{containers:['web','log']}},chips:['kubectl get pods -o wide','kubectl describe pod $E:db','kubectl logs $E:w -c log']},
  3:{chips:['kubectl get pods -o wide','kubectl logs $E:db']},
  4:{chips:['kubectl get pv','kubectl describe pv pv-dados','kubectl get pvc']},
  5:{chips:['kubectl get pvc','kubectl get pv','kubectl describe pvc dados']},
  6:{pods:{db:{claim:'dados'}},chips:['kubectl describe pod $E:db','kubectl describe pvc dados','kubectl get pv']},
  7:{pods:{db:{claim:'dados'},db2:{claim:'dados'}},chips:['kubectl get pods -o wide','kubectl describe pod $E:db2','kubectl get pv']},
  8:{chips:['kubectl get storageclass','kubectl get pvc','kubectl describe pvc dados']},
  9:{pods:{db:{claim:'dados'}},chips:['kubectl describe sc standard','kubectl get pvc','kubectl describe pv pv-dados']},
  10:{reclaim:'Retain',out:[[/^kubectl patch pv pv-dados/,'persistentvolume/pv-dados patched']],chips:['kubectl get pv','kubectl get pvc',`kubectl patch pv pv-dados -p '{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}'`]},
  11:{pods:{db:{claim:'dados'}},out:[[/^kubectl edit pvc/,'persistentvolumeclaim/dados edited']],chips:['kubectl get pvc','kubectl get sc',`kubectl patch pvc dados -p '{"spec":{"resources":{"requests":{"storage":"20Gi"}}}}'`]},
  12:{pods:{db:{claim:'dados'}}},
 },
 network:{
  all:{svc:{sv:{name:'api'}}},
  1:{chips:['kubectl get pods -o wide','kubectl exec $E:w0 -- wget -qO- -T 2 10.244.1.8:8080']},
  2:{chips:['kubectl get pods -n kube-system -o wide','kubectl get ds -n kube-system','kubectl get nodes -o wide']},
  3:{chips:['kubectl get svc','kubectl get endpoints api','kubectl get pods -n kube-system -l k8s-app=kube-proxy']},
  4:{chips:['kubectl expose deploy api --port=80 --target-port=8080','kubectl get svc api','kubectl exec $E:w0 -- wget -qO- -T 2 api']},
  5:{chips:['kubectl expose deploy api --type=NodePort --port=80','kubectl get svc api','curl http://192.168.1.11:30080']},
  6:{chips:['kubectl get svc api','kubectl describe svc api']},
  7:{svc:{sv:{name:'db',selector:{app:'db'},port:'5432/TCP',target:5432}},chips:['kubectl get svc db','kubectl get endpoints db','kubectl run t --image=busybox --rm -it -- nslookup db']},
  8:{chips:['kubectl run t --image=busybox --rm -it -- nslookup api.loja','kubectl get svc -n kube-system','kubectl exec $E:w0 -- cat /etc/resolv.conf']},
  9:{dnsDown:true,chips:['kubectl -n kube-system logs -l k8s-app=kube-dns','kubectl get pods -n kube-system -l k8s-app=kube-dns','kubectl run t --image=busybox --rm -it -- nslookup api.loja']},
  10:{chips:['kubectl get gatewayclass','kubectl get gateway','kubectl get httproute']},
 },
 netpol:{
  all:{names:{x:'hacker'},svcAdd:[{name:'db',ns:'dados',selector:{app:'db'},port:'5432/TCP',target:5432}],nsList:[['loja','kubernetes.io/metadata.name=loja'],['teste','kubernetes.io/metadata.name=teste'],['dados','kubernetes.io/metadata.name=dados']],chips:['kubectl get pods -A -o wide','kubectl get netpol -A','kubectl exec web -n loja -- nc -zv -w 2 db.dados 5432','kubectl exec hacker -n teste -- nc -zv -w 2 db.dados 5432']},
  1:{},2:{chips:['kubectl get pods -A -o wide','kubectl get netpol -A','kubectl exec web -n loja -- nc -zv -w 2 db.dados 5432']},
  3:{netpols:[NP('dados','deny-all','',null,null,'Ingress')],reach:{web:'timeout',hacker:'timeout'}},
  4:{netpols:[NP('dados','deny-all','',null,null,'Ingress'),NP('dados','allow-web','app=db','Allowing ingress traffic:\n  To Port: <any> (traffic allowed to all ports)\n  From:\n    NamespaceSelector: kubernetes.io/metadata.name=loja\n    PodSelector: app=web',null,'Ingress')],reach:{hacker:'timeout'}},
  5:{netpols:[NP('dados','deny-all','',null,null,'Ingress'),NP('dados','allow-loja','app=db','Allowing ingress traffic:\n  To Port: <any> (traffic allowed to all ports)\n  From:\n    NamespaceSelector: kubernetes.io/metadata.name=loja',null,'Ingress')],reach:{hacker:'timeout'}},
  6:{netpols:[NP('dados','deny-all','',null,null,'Ingress'),NP('dados','allow-loja','app=db','Allowing ingress traffic:\n  To Port: 5432/TCP\n  From:\n    NamespaceSelector: kubernetes.io/metadata.name=loja',null,'Ingress')],reach:{hacker:'timeout'},reachPort:5432,chips:['kubectl describe netpol allow-loja -n dados','kubectl exec web -n loja -- nc -zv -w 2 db.dados 5432','kubectl exec web -n loja -- nc -zv -w 2 db.dados 22']},
  7:{names:{x:'web-6f7c9d5b8-qzt2k'},netpols:[NP('dados','allow-web','app=db','Allowing ingress traffic:\n  To Port: <any> (traffic allowed to all ports)\n  From:\n    NamespaceSelector: kubernetes.io/metadata.name=loja\n  ----------\n  To Port: <any> (traffic allowed to all ports)\n  From:\n    NamespaceSelector: <none>\n    PodSelector: app=web',null,'Ingress')],chips:['kubectl describe netpol allow-web -n dados','kubectl exec web-6f7c9d5b8-qzt2k -n teste -- nc -zv -w 2 db.dados 5432','kubectl get pods -A --show-labels']},
  8:{netpols:[NP('dados','allow-loja','app=db','Allowing ingress traffic:\n  To Port: 5432/TCP\n  From:\n    NamespaceSelector: kubernetes.io/metadata.name=loja',null,'Ingress'),NP('loja','deny-egress','',null,'Allowing egress traffic:\n  <none> (Selected pods are isolated for egress connectivity)','Egress')],reach:{web:'dns',hacker:'timeout'},chips:['kubectl get netpol -A','kubectl exec web -n loja -- nc -zv -w 2 db.dados 5432','kubectl exec web -n loja -- nslookup db.dados']},
  9:{netpols:[NP('dados','allow-loja','app=db','Allowing ingress traffic:\n  To Port: 5432/TCP\n  From:\n    NamespaceSelector: kubernetes.io/metadata.name=loja',null,'Ingress'),NP('loja','deny-egress','',null,'Allowing egress traffic:\n  <none> (Selected pods are isolated for egress connectivity)','Egress'),NP('loja','allow-dns-db','',null,'Allowing egress traffic:\n  To Port: 53/UDP\n  To Port: 53/TCP\n  To:\n    NamespaceSelector: kubernetes.io/metadata.name=kube-system\n    PodSelector: k8s-app=kube-dns\n  ----------\n  To Port: 5432/TCP\n  To:\n    NamespaceSelector: kubernetes.io/metadata.name=dados','Egress')],reach:{hacker:'timeout'},chips:['kubectl exec web -n loja -- nc -zv -w 2 db.dados 5432','kubectl describe netpol allow-dns-db -n loja','kubectl get netpol -A']},
  10:{netpols:[NP('dados','deny-all','',null,null,'Ingress'),NP('dados','allow-loja','app=db','Allowing ingress traffic:\n  To Port: 5432/TCP\n  From:\n    NamespaceSelector: kubernetes.io/metadata.name=loja',null,'Ingress'),NP('loja','deny-egress','',null,'Allowing egress traffic:\n  <none> (Selected pods are isolated for egress connectivity)','Egress'),NP('loja','allow-dns-db','',null,'Allowing egress traffic:\n  To Port: 53/UDP, 53/TCP (kube-dns)\n  ----------\n  To Port: 5432/TCP (ns dados)','Egress')],reach:{hacker:'timeout'}},
 },
 nodefail:{
  all:{stsReplicas:1,svcAdd:[{name:'api',selector:{app:'api'}},{name:'db',selector:{app:'db'},port:'5432/TCP',target:5432,ip:'None'}],pods:{a3:{age:'5m'},db1:{age:'3m'}}},
  1:{chips:['kubectl get nodes','kubectl get leases -n kube-node-lease','kubectl get pods -o wide']},
  6:{pods:{a3:{age:'4s',status:'ContainerCreating',ready:false,phase:'Pending'}}},
  2:{nodeReady:{'node-3':true},chips:['kubectl get nodes','kubectl get pods -o wide']},
  3:{chips:['kubectl get nodes','kubectl get pods -o wide','kubectl get endpoints','kubectl describe node node-3']},
  5:{chips:['kubectl describe pod $A2','kubectl get pods -o wide']},
  8:{pods:{db1:{gone:1}},chips:['kubectl get pods -l app=db','kubectl get sts','kubectl describe pod db-0']},
  9:{out:[[/^kubectl delete pod db-0 --force/,'Warning: Immediate deletion does not wait for confirmation that the running resource has been terminated. The resource may continue to run on the cluster indefinitely.\npod "db-0" force deleted']],chips:['kubectl delete pod db-0 --force --grace-period=0','kubectl describe pod db-0','kubectl get pods -o wide']},
  10:{taintOOS:true,pods:{db1:{status:'Running',ready:true,phase:'Running',age:'40s',reason:''}},chips:['kubectl taint nodes node-3 node.kubernetes.io/out-of-service=nodeshutdown:NoExecute','kubectl get pods -o wide','kubectl describe node node-3']},
  11:{chips:['kubectl taint nodes node-3 node.kubernetes.io/out-of-service-','kubectl get nodes','kubectl get pods -o wide']},
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
const D=window.K8STERM_DATA=window.K8STERM_DATA||{};
D.LESSONS=LESSONS;D.OV=OV;
})();
