/* Kubernetes Visual — js/term/files.js
   Arquivos YAML de exemplo, somente leitura, mostrados por ls/cat no terminal simulado.
   Carregar ANTES de js/term/engine.js. */
(function(){
/* ---------- example files (read-only) ---------- */
const DEP=(o={})=>`apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${o.name||'api'}
  labels:
    app: ${o.name||'api'}
spec:
  replicas: ${o.replicas||3}
  selector:
    matchLabels:
      app: ${o.name||'api'}
  template:
    metadata:
      labels:
        app: ${o.name||'api'}
    spec:
${o.podExtra||''}      containers:
      - name: ${o.name||'api'}
        image: ${o.image||'loja/api:1.0'}
        ports:
        - containerPort: ${o.port||8080}
${o.ctrExtra||''}        resources:
          requests:
            cpu: 250m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: ${o.mem||'512Mi'}`;
const PROBES=`        startupProbe:
          httpGet: {path: /healthz, port: 8080}
          periodSeconds: 10
          failureThreshold: 30      # até 5 min para subir
        readinessProbe:
          httpGet: {path: /ready, port: 8080}
          periodSeconds: 5
        livenessProbe:
          httpGet: {path: /healthz, port: 8080}
          periodSeconds: 10
          failureThreshold: 3
`;
const FILES={
'pod.yaml':`apiVersion: v1
kind: Pod
metadata:
  name: api
  labels:
    app: api
spec:
  containers:
  - name: api
    image: loja/api:1.0
    ports:
    - containerPort: 8080
  - name: log                 # sidecar
    image: busybox:1.36
    command: ["sh", "-c", "tail -F /var/log/app/api.log"]`,
'deployment.yaml':DEP({mem:'256Mi'}),
'service.yaml':`apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: ClusterIP
  selector:
    app: api
  ports:
  - port: 80
    targetPort: 8080`,
'ingress.yaml':`apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: loja
spec:
  ingressClassName: nginx
  tls:
  - hosts: [loja.com]
    secretName: loja-tls
  rules:
  - host: loja.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service: {name: web, port: {number: 80}}
      - path: /api
        pathType: Prefix
        backend:
          service: {name: api, port: {number: 80}}`,
'configmap.yaml':`apiVersion: v1
kind: ConfigMap
metadata:
  name: loja-config
data:
  DB_HOST: db
  LOG_LEVEL: info`,
'secret.yaml':`apiVersion: v1
kind: Secret
metadata:
  name: db-cred
type: Opaque
data:
  username: bG9qYQ==      # "loja"  (base64, não é criptografia)
  password: czNuaDQ=      # "s3nh4"`,
'pv.yaml':`apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-dados
spec:
  capacity:
    storage: 10Gi
  accessModes: [ReadWriteOnce]
  persistentVolumeReclaimPolicy: Retain
  storageClassName: manual
  hostPath:
    path: /mnt/dados`,
'pvc.yaml':`apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: dados
spec:
  accessModes: [ReadWriteOnce]
  storageClassName: standard
  resources:
    requests:
      storage: 10Gi`,
'storageclass.yaml':`apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true`,
'daemonset.yaml':`apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-agent
spec:
  selector:
    matchLabels: {app: node-agent}
  template:
    metadata:
      labels: {app: node-agent}
    spec:
      tolerations:
      - key: node-role.kubernetes.io/control-plane
        effect: NoSchedule
      containers:
      - name: agent
        image: fluent/fluent-bit:3.0`,
'statefulset.yaml':`apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: db
spec:
  serviceName: db            # Service headless
  replicas: 3
  selector:
    matchLabels: {app: db}
  template:
    metadata:
      labels: {app: db}
    spec:
      containers:
      - name: db
        image: postgres:16
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ReadWriteOnce]
      resources:
        requests:
          storage: 1Gi`,
'job.yaml':`apiVersion: batch/v1
kind: Job
metadata:
  name: relatorio
spec:
  completions: 3
  parallelism: 2
  backoffLimit: 3
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: relatorio
        image: busybox:1.36
        command: ["sh", "-c", "echo ok"]`,
'cronjob.yaml':`apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup
spec:
  schedule: "0 3 * * *"       # todo dia às 3h
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: backup
            image: busybox:1.36
            command: ["sh", "-c", "date"]`,
'deny-all.yaml':`apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: dados
spec:
  podSelector: {}            # todos os pods do namespace
  policyTypes: [Ingress]`,
'allow-loja.yaml':`apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-loja
  namespace: dados
spec:
  podSelector:
    matchLabels: {app: db}
  policyTypes: [Ingress]
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: loja
    ports:
    - protocol: TCP
      port: 5432`,
'allow-dns-db.yaml':`apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-db
  namespace: loja
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
  - to:
    - namespaceSelector:
        matchLabels: {kubernetes.io/metadata.name: kube-system}
      podSelector:
        matchLabels: {k8s-app: kube-dns}
    ports:
    - {protocol: UDP, port: 53}
    - {protocol: TCP, port: 53}
  - to:
    - namespaceSelector:
        matchLabels: {kubernetes.io/metadata.name: dados}
    ports:
    - {protocol: TCP, port: 5432}`,
'service-nodeport.yaml':`apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: NodePort
  selector:
    app: api
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080           # 30000-32767`,
'service-headless.yaml':`apiVersion: v1
kind: Service
metadata:
  name: db
spec:
  clusterIP: None             # headless: DNS devolve o IP de cada pod
  selector:
    app: db
  ports:
  - port: 5432`,
'httproute.yaml':`apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api
spec:
  parentRefs:
  - name: loja                # o Gateway
  hostnames: ["loja.com"]
  rules:
  - matches:
    - path: {type: PathPrefix, value: /api}
    backendRefs:
    - name: api
      port: 80`,
};
const LS={
 pods:['pod.yaml','deployment.yaml'],
 workloads:['deployment.yaml','daemonset.yaml','statefulset.yaml','job.yaml','cronjob.yaml'],
 config:['configmap.yaml','secret.yaml','deployment.yaml'],
 storage:['pv.yaml','pvc.yaml','storageclass.yaml','deployment.yaml'],
 service:['deployment.yaml','service.yaml','ingress.yaml'],
 network:['service.yaml','service-nodeport.yaml','service-headless.yaml','httproute.yaml'],
 netpol:['deny-all.yaml','allow-loja.yaml','allow-dns-db.yaml'],
 probes:['deployment.yaml','service.yaml'],
 nodefail:['deployment.yaml','statefulset.yaml'],
 trouble:['deployment.yaml','service.yaml'],
};
const FILEV={
 workloads:{'deployment.yaml':DEP({})},
 config:{'deployment.yaml':DEP({podExtra:`      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
`,ctrExtra:`        envFrom:
        - configMapRef:
            name: loja-config
        env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef: {name: db-cred, key: password}
        volumeMounts:
        - name: config
          mountPath: /etc/config
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            drop: [ALL]
            add: [NET_BIND_SERVICE]
`}).replace(/(\n            memory: 512Mi)$/,'$1\n      volumes:\n      - name: config\n        configMap:\n          name: loja-config')},
 storage:{'deployment.yaml':DEP({name:'db',replicas:1,image:'postgres:16',port:5432,ctrExtra:`        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
`}).replace(/(\n            memory: 512Mi)$/,'$1\n      volumes:\n      - name: data\n        persistentVolumeClaim:\n          claimName: dados')},
 service:{'deployment.yaml':DEP({})},
 probes:{'deployment.yaml':DEP({ctrExtra:PROBES})},
 nodefail:{'deployment.yaml':DEP({podExtra:`      # padrão adicionado pelo Kubernetes em todo pod:
      tolerations:
      - key: node.kubernetes.io/unreachable
        operator: Exists
        effect: NoExecute
        tolerationSeconds: 300
`}),'statefulset.yaml':`apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: db
spec:
  serviceName: db
  replicas: 1
  selector:
    matchLabels: {app: db}
  template:
    metadata:
      labels: {app: db}
    spec:
      containers:
      - name: db
        image: postgres:16
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ReadWriteOnce]   # um node por vez
      resources:
        requests:
          storage: 1Gi`},
 trouble:{'deployment.yaml':DEP({name:'web',replicas:2,image:'nginx:1.2O',port:80}),'service.yaml':`apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: wbe                  # repare no nome do label
  ports:
  - port: 80
    targetPort: 80`},
};
const CMT_EN=[['# até 5 min para subir','# up to 5 min to start'],['(base64, não é criptografia)','(base64, not encryption)'],['# todo dia às 3h','# every day at 3 am'],['# todos os pods do namespace','# every pod in the namespace'],['# Service headless','# headless Service'],['# headless: DNS devolve o IP de cada pod','# headless: DNS returns each pod IP'],['# o Gateway','# the Gateway'],['# padrão adicionado pelo Kubernetes em todo pod:','# default added by Kubernetes to every pod:'],['# um node por vez','# one node at a time'],['# repare no nome do label','# look closely at the label']];
const D=window.K8STERM_DATA=window.K8STERM_DATA||{};
Object.assign(D,{FILES,LS,FILEV,CMT_EN});
})();
