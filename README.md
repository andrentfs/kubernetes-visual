# Kubernetes Visual

Curso interativo e visual sobre Kubernetes, em português (Brasil) e inglês. Cada conceito é um diagrama isométrico animado que você avança passo a passo, com terminal `kubectl` simulado e trilhas para as provas CKA e CKAD.

**No ar:** https://andrentfs.github.io/kubernetes-visual/

## Rodar localmente

O site é estático (HTML + JS) e não tem etapa de build.

**Com Docker** (recomendado):

```bash
docker compose up
# abra http://localhost:8080
```

Os arquivos da pasta são servidos direto: edite e recarregue a página.
Para testar a imagem fechada, igual à publicada: `docker compose --profile preview up --build` → http://localhost:8081

**Sem Docker:**

```bash
python3 -m http.server 8080
# abra http://localhost:8080
```

## Publicação

O GitHub Pages publica a raiz da branch `main`. Os arquivos `Dockerfile`, `docker-compose.yml` e `docker/` servem só para rodar localmente e não afetam a publicação.

Plano de evolução: [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
