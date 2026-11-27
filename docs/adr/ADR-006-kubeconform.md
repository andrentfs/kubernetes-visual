# ADR-006 — Validar os YAMLs das lições com kubeconform no CI

- **Status:** aceito e implementado (27/11/2026)
- **Data:** 27/11/2026
- **Contexto do plano:** `docs/IMPLEMENTATION_PLAN.md`, F3 e regra “não inventar”

## Contexto

O terminal simulado mostra 28 manifestos de exemplo (`js/term/files.js`): Pod, Deployment, StatefulSet, Service, Ingress, HTTPRoute, NetworkPolicy e outros. Eles são lidos por quem estuda e copiados para clusters reais. Um campo com nome errado ou fora do lugar passaria despercebido, porque nada no site aplica esses YAMLs num cluster.

## Decisão

1. **Extrator:** `tests/tools/extract-manifests.mjs` lê `FILES` e `FILEV` de `js/term/files.js` e grava um arquivo por manifesto em `build/manifests/` (pasta ignorada pelo git). Com `--k8s-version`, imprime a versão de referência de `data/meta.js` (hoje `1.37.0`), para o schema acompanhar o conteúdo.
2. **Validação:** o job `manifests` do CI roda a imagem oficial `ghcr.io/yannh/kubeconform:v0.8.0` em modo `-strict` (campo desconhecido é erro), com:
   - `-schema-location default` → schemas do Kubernetes em `yannh/kubernetes-json-schema` (`v1.37.0-standalone-strict`, conferido no repositório em 27/11/2026);
   - o catálogo `datreeio/CRDs-catalog` para CRDs (HTTPRoute da Gateway API, `gateway.networking.k8s.io/httproute_v1.json`, também conferido).
3. **Links:** o job `links` roda o `lycheeverse/lychee-action@v2.9.0` em todos os `.md`, ignorando endereços locais (`localhost`) e o LinkedIn, que bloqueia robôs.
4. **Local:** `make manifests` faz o mesmo com Docker. Um teste unitário (`tests/unit/manifests.test.mjs`) faz uma checagem rápida sem rede: `apiVersion`, `kind`, `metadata.name` e nada de tabulação.

## Verificação feita antes de ativar

Os 28 manifestos foram validados contra os mesmos schemas JSON `v1.37.0-standalone-strict` (e o da HTTPRoute) com o Ajv: 28 válidos. Um teste negativo, trocando `containerPort` por `containerPortt`, foi recusado como esperado.

## Alternativas consideradas

- **Instalar o kubeconform na imagem `dev`:** baixaria um binário a cada build da imagem; a imagem oficial no CI é mais simples e já tem versão fixa.
- **Validar com `kubectl apply --dry-run=server`:** exige um cluster de verdade no CI; mais pesado e lento.
- **Revisão manual:** é o que existia, e não escala.

## Consequências

- Mudar `K8S_REF` em `data/meta.js` muda automaticamente o schema usado.
- Se um schema da versão ainda não estiver publicado, o job falha. É o comportamento desejado: a versão de referência precisa ter schema.
- O job depende de rede (ghcr.io, raw.githubusercontent.com). Uma falha de rede aparece como erro do CI, não do conteúdo.
