# ADR-001 — Desenvolvimento orientado a Docker, produção estática sem build

- **Status:** aceito e implementado (aprovado pelo autor e publicado em 27/11/2026)
- **Data:** 27/11/2026
- **Contexto do plano:** `docs/IMPLEMENTATION_PLAN.md`, Fase 1

## Contexto

O Kubernetes Visual é um site estático: HTML + JavaScript, sem etapa de build, publicado pelo GitHub Pages a partir da raiz da branch `main`. Até agora, as verificações (percorrer os passos, checar sobreposição no diagrama, rodar o terminal) eram scripts avulsos, dependentes do que estava instalado na máquina de quem rodava.

O plano prevê testes unitários, E2E, acessibilidade, regressão visual, validação de manifestos e Lighthouse. Cada uma dessas ferramentas pede uma versão de Node, de navegador e de bibliotecas de sistema. Sem padronizar isso, o resultado muda de máquina para máquina e entre a máquina local e o CI.

## Decisão

1. **Todo o desenvolvimento roda em containers.** Para servir o site, testar e (futuramente) medir, a única dependência na máquina é o Docker. Os comandos ficam no `Makefile`:

   | Comando | O que faz | Container |
   |---|---|---|
   | `make up` | Serve a pasta em http://localhost:8082, sem cache: edite e recarregue | `site` (`nginx:1.27-alpine`) |
   | `make test` | Testes unitários (`node:test`) + paridade PT/EN + E2E (Playwright/Chromium) | `dev` |
   | `make test-unit` / `test-i18n` / `test-e2e` | Cada suíte separada | `dev` |
   | `make shell` | Terminal dentro do ambiente de desenvolvimento | `dev` |
   | `make serve` | Site servido pelo container de dev em http://localhost:4173 | `dev` |
   | `make preview` | Imagem fechada, igual ao que vai publicado, em http://localhost:8081 | `preview` |

2. **A imagem de desenvolvimento** (`docker/Dockerfile.dev`) parte da imagem oficial `mcr.microsoft.com/playwright:v1.63.0-noble`, que já tem Node.js, Chromium e as dependências de sistema. A versão é fixa e precisa ser igual à do `@playwright/test` no `package.json`. As dependências entram com `npm ci`, a partir do `package-lock.json`.
3. **Produção continua estática e sem build.** O GitHub Pages segue servindo a raiz da `main`. As ferramentas de desenvolvimento (`package.json`, `tests/`, `docker/`, `Makefile`) não são carregadas pelo site.
4. **O CI usa a mesma imagem** (`.github/workflows/test.yml` roda `docker compose ... run dev npm test`), então o resultado local é o mesmo do CI.
5. **Os testes são herméticos:** requisições externas (ex.: Google Fonts) recebem resposta vazia, e o resultado não depende de rede.

## Consequências

**Positivas**
- O ambiente é reprodutível: a mesma versão de Node, Chromium e dependências em qualquer máquina e no CI.
- Um contribuidor novo só precisa de Docker e de `make test`.
- Ferramentas futuras (axe, Lighthouse CI, kubeconform, lychee) entram na imagem `dev`, sem instalar nada no host.
- A imagem `preview` reproduz o servidor estático e devolve 404 para arquivos inexistentes, como o Pages.

**Negativas / custos**
- Exige Docker instalado (Docker Desktop no macOS/Windows).
- Primeiro `make test`: baixa a imagem do Playwright (cerca de 1–2 GB).
- Subir a versão do Playwright exige mudar dois lugares (o `package.json` e o `ARG` do `Dockerfile.dev`). Um teste pode checar isso no futuro.

**Neutras**
- `npm test` continua funcionando fora do Docker, para quem preferir, mas o caminho oficial é o container.

## Alternativas consideradas

- **Rodar tudo no host** (Node + `npx playwright install`): mais simples no começo, mas não é reprodutível. Rejeitada.
- **Dev Containers (VS Code):** ótima experiência, mas presa a um editor. Pode ser adicionada depois, reaproveitando o mesmo `Dockerfile.dev`.
- **Build com bundler (Vite etc.) dentro do Docker:** mudaria o processo de publicação. Rejeitada por ora (ver ADR-002 no plano).
