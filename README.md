# Kubernetes Visual

Curso interativo e visual sobre Kubernetes, em português (Brasil) e inglês. Cada conceito é um diagrama isométrico animado que você avança passo a passo, com terminal `kubectl` simulado e trilhas para as provas CKA e CKAD.

**No ar:** https://andrentfs.github.io/kubernetes-visual/

![Lição “Quando um node cai” servida pelo container de preview](docs/img/preview-docker.png)

## Desenvolvimento (Docker)

O desenvolvimento é orientado a Docker ([ADR-001](docs/adr/ADR-001-docker-first.md)): só é preciso ter Docker e `make`.

```bash
make up        # site em http://localhost:8080 — lê os arquivos da pasta: edite e recarregue
make test      # testes unitários + paridade PT/EN + E2E (Playwright/Chromium)
make shell     # terminal dentro do container de desenvolvimento
make preview   # imagem fechada, igual ao que vai publicado, em http://localhost:8081
make down      # para tudo
```

Também dá para rodar só uma parte: `make test-unit`, `make test-i18n`, `make test-e2e`.
Se mudar o `package.json`, rode `make clean` para recriar o volume de `node_modules`.

| Container | Imagem | Uso |
|---|---|---|
| `site` | `nginx:1.27-alpine` | Serve a pasta sem cache (desenvolvimento) |
| `dev` | `docker/Dockerfile.dev` (base `mcr.microsoft.com/playwright:v1.63.0-noble`) | Testes e ferramentas |
| `preview` | `Dockerfile` (nginx + arquivos do site) | Conferir antes de publicar |

### Testes

| Suíte | Onde | O que verifica |
|---|---|---|
| Unitários | `tests/unit/` (`node:test`) | Motor do terminal simulado: saídas, flags, pipes, determinismo, arquivos somente leitura |
| Paridade PT/EN | `tests/tools/i18n-parity.mjs` | Mesmas chaves, lições, passos, campos e legendas nos dois idiomas |
| E2E | `tests/e2e/` (Playwright) | Todos os passos nos dois idiomas sem erro e sem seta atravessando bloco; terminal; abas CKA/CKAD; idioma; teclado; layout desktop e celular |

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| `index.html` | Interface e motor do diagrama isométrico |
| `scenes.js` | Cenas de cada lição (iguais nos dois idiomas) |
| `pt.js` / `en.js` | Textos |
| `certs.js` | Domínios e competências CKA/CKAD |
| `term.js` | Terminal `kubectl` simulado |

## Publicação

O GitHub Pages publica a raiz da branch `main`. O site é estático e não tem etapa de build. `package.json`, `tests/`, `docker/` e `Makefile` são só para desenvolvimento.

Plano de evolução: [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
