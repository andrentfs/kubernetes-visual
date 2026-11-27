# Kubernetes Visual — Plano de implementação

> Status: **diagnóstico — aguardando aprovação**. Nada deste plano foi implementado ainda.
> Data da análise: 27/11/2026 · Commit analisado: `7ad7b9f` (branch `main`).

---

## 1. Diagnóstico da arquitetura atual

### 1.1 Visão geral

Site 100% estático, sem build, publicado na raiz da branch `main` pelo GitHub Pages (`.nojekyll`). Não há `package.json`, testes, CI, LICENSE nem pasta `docs/`.

| Arquivo | Tamanho | Linhas | Responsabilidade |
|---|---:|---:|---|
| `index.html` | 80 KB | 552 | CSS inteiro, HTML da interface e **todo o motor**: projeção isométrica, desenho de blocos e slabs, rotas das setas, pacotes animados, câmera, layout anti-sobreposição, roteamento por hash, busca, progresso, tema, idioma, telas CKA/CKAD |
| `scenes.js` | 64 KB | 327 | Cenas das 22 lições, sem texto e iguais nos dois idiomas (`window.buildScenes(H)`, `LESSON_ORDER`) |
| `pt.js` / `en.js` | 157 / 156 KB | 421 / 421 | Textos: UI, lições (passos, metas, “Na prova”), legendas e rótulos |
| `certs.js` | 15 KB | 48 | Domínios e pesos de CKA/CKAD, competências → lições, status de cobertura |
| `term.js` | 121 KB | 1.202 | Terminal simulado: deriva o estado do cluster do diagrama, interpretador de `kubectl`/shell, sobreposições por lição/passo, arquivos YAML de exemplo |

**Total:** cerca de 593 KB sem minificação, todos carregados no primeiro acesso. Os dois idiomas são baixados sempre, embora só um seja usado. A fonte vem do Google Fonts.

### 1.2 Fluxo de execução

1. `pt.js`, `en.js`, `scenes.js`, `certs.js` e `term.js` definem globais em `window`.
2. O script inline do `index.html` monta a lista `L` (ordem da trilha + textos + cenas) e registra os listeners.
3. `show()` lê `location.hash` (`#<lição>-<passo>`, `#cka`, `#ckad`), monta a interface e chama `paint(scene, fresh)`.
4. `paint` calcula tamanhos (`fitSizes`), separa etiquetas (`deconflict`), cria ou atualiza grupos SVG por diferença e anima com transições CSS. Setas e pacotes usam `route()`/`link()` e SMIL (`animateMotion`).
5. `K8STERM.step()` recebe a cena (sempre gerada em inglês, para ser determinística) e deriva o estado simulado do cluster.

### 1.3 Pontos fortes (preservar)

- A identidade visual isométrica é consistente, com a mesma linguagem de cores, ícones, rótulos e animação de entrada.
- As cenas são separadas dos textos, então dá para acrescentar um idioma sem mexer nos diagramas.
- O desenho é atualizado por diferença: o mesmo objeto sobrevive entre passos e é animado.
- O terminal é **determinístico** e derivado do diagrama, então diagrama e saída nunca se contradizem.
- Paridade PT/EN: 236 passos em cada idioma, com 0 chaves faltando segundo a checagem atual.
- Não há dependências em tempo de execução, e o site roda em qualquer hospedagem estática.

### 1.4 Problemas técnicos identificados

| # | Problema | Impacto | Gravidade |
|---|---|---|---|
| T1 | `index.html` monolítico (CSS + motor + UI no mesmo arquivo) | Difícil testar, revisar PRs e reaproveitar o motor nos simuladores novos | Alta |
| T2 | `term.js` mistura o motor do interpretador com os dados das lições (sobreposições, YAML) | O arquivo cresce linearmente a cada lição | Média |
| T3 | Os dois idiomas são carregados sempre (cerca de 313 KB) | Desperdício na primeira carga, sobretudo no celular | Média |
| T4 | Não há `<meta description>`, Open Graph, Twitter Card, `lang` dinâmico no `<html>` inicial, sitemap nem robots | Sem preview no LinkedIn e indexação fraca | Alta (divulgação) |
| T5 | Rotas por hash (`#pods-3`): o crawler enxerga uma página só | SEO por lição é impossível sem pré-renderização | Média |
| T6 | Não há testes nem CI. As verificações (sobreposição, percurso de todos os passos, varredura do terminal) existem só como scripts ad hoc fora do repositório | Regressões visuais passam despercebidas | Alta |
| T7 | Não há LICENSE | Juridicamente, o código não é open source; contribuições ficam bloqueadas | Alta (decisão do autor) |
| T8 | Google Fonts externo | Requisição a terceiro (privacidade/LGPD) e +1 RTT | Baixa |
| T9 | Ganchos de depuração expostos (`window.__dbg`, `window.__audit`) | Inofensivos, mas poluem a API global | Baixa |
| T10 | Regra global `[hidden]{display:none!important}` (correção recente) | Correta, mas deve ficar documentada | Baixa |
| T11 | Acessibilidade não medida: o diagrama SVG não tem descrição textual equivalente além da legenda; foco e contraste das cores de estado sem auditoria; terminal sem anúncio de resultado para leitor de tela além de `aria-live` | Risco de não atingir WCAG 2.2 AA | Média |
| T12 | Animação de pacotes via SMIL e transições CSS; não há controle de velocidade | Requisito novo (velocidade, avançar/voltar) exige um relógio próprio | Média |

### 1.5 Precisão técnica — pontos para revisar

| # | Ponto | Situação |
|---|---|---|
| P1 | Versão de referência | O conteúdo cita v1.27 a v1.36 em pontos diferentes e o terminal simula v1.31.2. É preciso **definir uma versão de referência única** (ex.: a usada pela prova na data da consulta) e exibi-la no site |
| P2 | Endpoints × EndpointSlice | As lições e o terminal usam `Endpoints` (4 menções em PT) e só citam EndpointSlice uma vez. A API `Endpoints` está *deprecated* desde v1.33; o material precisa priorizar EndpointSlice |
| P3 | Rede: Service, kube-proxy e NetworkPolicy aparecem como blocos com setas | É preciso diferenciar visualmente **objeto declarativo**, **controlador** e **dataplane**, conforme o requisito §5 |
| P4 | DNAT/SNAT, IP de origem e destino, portas | Ainda não são exibidos |
| P5 | `node-monitor-grace-period` (40 s → 50 s na v1.32) | Já está citado; validar na documentação oficial ao fixar a versão de referência |
| P6 | Pesos e competências CKA/CKAD em `certs.js` | Mapeados a partir do currículo de 18/02/2025. **Reconsultar `github.com/cncf/curriculum`** e registrar a data. A consulta não foi feita nesta análise porque o acesso web ficou bloqueado aguardando permissão |
| P7 | Selos GA/Beta/Alpha/deprecated | Não existem; cada recurso citado precisa do selo e da versão |
| P8 | Referências oficiais por lição | Não existem |

---

## 2. Inventário das funcionalidades existentes

**Conteúdo**
- 22 lições, 236 passos por idioma, em 5 módulos:
  - Fundamentos: intro, cluster, images.
  - Rodando apps: pods, workloads, config, storage, service, network, netpol.
  - Operação: escala, sched, rollout, probes, nodefail, helm, observ.
  - Administração: kubeadm, trouble, extend.
  - Segurança e visão geral: rbac, tudo.
- Cada passo tem título, parágrafos, “Ideia-chave / Bom saber / Atenção”, “O que mudou”, tabela opcional, comando opcional com Copiar e quatro métricas.
- Caixa “Na prova (CKA)” por lição, com dicas e comandos.
- Abas CKA e CKAD com domínios, pesos, competências → lições, checklist persistente e roteiro de estudo.

**Diagramas**
- Motor isométrico com animação de entrada (queda, pop, desenho das linhas), câmera com zoom, ajuste automático de tamanho e etiquetas sem sobreposição, setas no chão com ponta única no sentido do fluxo, pacotes animados (`req/heavy/hc/bad`) e destaque.
- Controles: repetir, pausar e tela cheia. Atalhos: ←, →, R, Espaço e Esc.

**Terminal simulado** (10 lições: pods, workloads, config, storage, service, network, netpol, probes, nodefail, trouble)
- `get` (pods, deploy, rs, svc, ep, nodes, ing, ds, sts, jobs, cj, cm, secret, pv, pvc, sc, netpol, events, ns, leases, gateway, httproute, all), com `-o wide|yaml|name|jsonpath`, `-A`, `-n`, `-l`, `-w` e `--show-labels`.
- `describe`, `logs` (`--previous`, `-c`, `-l`), `exec` (env, id, cat, nc, wget, curl, nslookup), `scale`, `delete`, `run`, `create`, `apply`, `expose`, `patch`, `label`, `taint`, `rollout`, `set image`, `top`, `cordon`, `drain`, `--dry-run=client -o yaml`.
- Pipes `| grep`, `| grep -v`, `| head`, `| tail` e `| base64 -d`.
- `systemctl`, `journalctl` e `crictl` em troubleshooting.
- Arquivos YAML somente leitura (`ls`, `cat`, `more`).
- Aviso “simulado”, histórico (↑/↓), sugestões de comando por passo e destaque no diagrama dos objetos citados.

**Plataforma**
- Busca (Ctrl K), progresso por lição (`k8s-done`), checklist de competências (`k8s-chk`), tema claro/escuro (`k8s-theme`) e idioma com detecção do navegador (`k8s-lang`).
- Links diretos por passo (`#licao-passo`), layout responsivo (desktop, notebook, celular), crédito com link para o LinkedIn e suporte parcial a `prefers-reduced-motion`.

---

## 3. Lacunas em relação ao objetivo

| Área (seção do pedido) | Já existe | Falta |
|---|---|---|
| §4 Falha de node | Lição `nodefail`: 12 passos com linha do tempo, taints, tolerância, StatefulSet, out-of-service e terminal | Modo **simulador livre**: botão “derrubar node”, relógio com velocidade, pausar/avançar/voltar, tempo real × acelerado, EndpointSlices, scheduler escolhendo o node; comparativo restart × replacement × failure × drain × graceful shutdown × eviction × PDB |
| §5 Rede | Lições `service`, `network` e `netpol` | Fluxo por pacote (IPs, portas, DNAT/SNAT, escolha de endpoint), mesmo pod / mesmo node / outro node, EndpointSlice, eBPF, MetalLB, Ingress × Gateway lado a lado, separação objeto/controle/dataplane, “enviar requisição” |
| §6 Troubleshooting | Lição `trouble`: 11 passos com terminal | Modo **incidente guiado**: sintomas → investigar → hipóteses → causa raiz revelada só depois → solução. Dos 16 cenários, cerca de 7 existem como passos (CrashLoop, ImagePull, OOM, Pending, NotReady, Service sem endpoints, probes); faltam FailedMount, DNS, NetworkPolicy, PVC Pending, RBAC, Ingress/Gateway e HPA sem métricas como cenários. Comandos `auth can-i` (hoje responde sempre “yes”) e `rollout status` mais realistas |
| §7 Autoscaling | Lição `escala` (HPA e Cluster Autoscaler) | Controles deslizantes (CPU, RPS, fila, min/max, janela de estabilização), gráficos dinâmicos, VPA, KEDA (com RabbitMQ) e Karpenter |
| §8 YAML interativo | YAMLs de exemplo somente leitura no terminal | YAML ao lado do diagrama com o trecho do passo destacado, explicação por campo, parâmetros editáveis e validados que alteram a simulação |
| §9 Trilhas | Trilha única + abas CKA/CKAD | Trilhas independentes (Fundamentals, CKA, CKAD, Networking, Troubleshooting, Advanced Ops) e estrutura preparada para KCNA/KCSA/CKS |
| §10 Aprendizado | Progresso, checklist, busca | Favoritos, histórico, “continuar de onde parei” (parcial), glossário, pré-requisitos, quiz, exercícios, revisão de erros, modo revisão, exportar/importar/zerar progresso |
| §11 UX | Tema, responsivo, tela cheia, atalhos, links diretos | Controle de velocidade, breadcrumbs completos, sidebar por trilha, auditoria WCAG 2.2 AA, reduced-motion completo (pacotes SMIL) |
| §12 Performance | Arquivos pequenos e sem framework | Idioma carregado sob demanda, minificação opcional, fonte hospedada no próprio site, medição com Lighthouse (antes/depois) |
| §13 SEO | — | Meta tags, OG/Twitter, imagem de preview, sitemap, robots, Schema.org (`Course`/`LearningResource`), `hreflang`, páginas estáticas por lição |
| §14 Documentação | README de 4 linhas | READMEs EN/PT, CONTRIBUTING, CODE_OF_CONDUCT, CHANGELOG, ROADMAP, SECURITY, arquitetura, guias de lição e animação, templates |
| §15 Testes/CI | Scripts ad hoc fora do repositório | Suíte versionada + GitHub Actions |
| §16 Precisão | — | Referências por lição, selos de maturidade, versão de referência |

---

## 4. Decisões arquiteturais propostas (ADRs, pedem aprovação)

| ADR | Proposta | Motivo | Alternativa descartada |
|---|---|---|---|
| **ADR-001** | Manter o site **sem build em produção**. Ferramentas (testes, lint, pré-renderização) só como `devDependencies`, rodando no CI | Preserva a simplicidade e a compatibilidade com GitHub Pages | Vite/Next, que adicionam build obrigatório e mudam o processo de publicação |
| **ADR-002** | Separar `index.html` em módulos ES nativos (`<script type="module">`): `css/app.css`, `js/engine/` (iso, render, links, camera, layout), `js/ui/` (sidebar, search, progress, cert), `js/sim/` (relógio e linha do tempo compartilhados), `js/term/` (motor e dados por lição em `lessons/*.js`) | Testabilidade e reuso do motor nos simuladores | Manter o monólito |
| **ADR-003** | Carregar o idioma ativo sob demanda (`import()` de `i18n/pt.js` ou `i18n/en.js`) | Corta cerca de 150 KB da primeira carga | Bundle por idioma, que exigiria build |
| **ADR-004** | **Motor de simulação único** (relógio com velocidade, pausa, passo a passo, estados versionados para voltar no tempo), usado por: falha de node, autoscaling, troubleshooting e YAML interativo | Evita quatro implementações paralelas (DRY) | Uma animação ad hoc por simulador |
| **ADR-005** | Manter as rotas hash (compatibilidade) e **gerar páginas estáticas por lição** (`/licao/pods/`, `/en/lesson/pods/`) com metadados próprios, que redirecionam para o hash. Geradas por script no CI e versionadas, para o Pages continuar servindo a raiz | SEO e preview por lição sem quebrar links | Trocar para History API, o que quebraria links existentes e exigiria fallback 404 |
| **ADR-006** | Validar os YAMLs das lições com `kubeconform` no CI, contra o schema da versão de referência | “Não inventar”: os manifestos ficam verificáveis | Revisão manual |
| **ADR-007** | Escolher a licença | **Decisão sua.** Sugestões: MIT ou Apache-2.0 para o código e CC BY 4.0 para o conteúdo didático | — |

---

## 5. Roadmap priorizado

As fases seguem o documento. Cada item é entregue separadamente, com testes e **sem publicar** até a sua aprovação.

### Fase 1 — Fundação (pré-requisito de tudo)
1. Suíte de testes versionada a partir dos scripts já usados: percurso dos 236 passos × 2 idiomas, auditoria de sobreposição, varredura do terminal e paridade de traduções.
2. GitHub Actions rodando os testes em PR, **sem mexer na publicação** (o Pages continua servindo `main`/raiz).
3. Refatoração ADR-002 sem mudança visual, garantida por regressão visual (screenshots antes/depois).
4. Correções de precisão P1, P2 e P6 (versão de referência, EndpointSlice, currículo reconsultado com data).
5. Documentação básica: READMEs EN/PT, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG e ROADMAP. LICENSE depois da sua escolha.
6. SEO mínimo: meta, OG, Twitter, imagem de preview, `robots.txt` e `sitemap.xml`.
7. Lighthouse “antes”, com números reais registrados em `docs/lighthouse/`.

### Fase 2 — Simulações
8. Motor de simulação (ADR-004): relógio, velocidades 0,5×–10×, pausa, ±passo, reinício, linha do tempo “tempo real × acelerado”.
9. Simulador de falha de node sobre a lição `nodefail` (reaproveitando a cena) + painel comparativo restart/replacement/failure/drain/graceful shutdown/eviction/PDB.
10. Rede por pacote: modo “enviar requisição” com cabeçalho IP/porta, DNAT/SNAT, escolha de EndpointSlice, mesmo pod / mesmo node / outro node, camadas objeto/controle/dataplane, Ingress × Gateway, eBPF e MetalLB.
11. YAML sincronizado: painel com o trecho destacado, campos explicados, cópia e parâmetros editáveis validados.

### Fase 3 — Troubleshooting
12. Modo incidente (sintomas → investigação no terminal → hipóteses → causa → solução), com a solução bloqueada até a investigação.
13. Os 16 cenários, reaproveitando o motor do terminal; `auth can-i` com RBAC simulado de verdade.

### Fase 4 — Autoscaling
14. HPA com controles deslizantes e gráfico (fórmula `desired = ceil(current × metric/target)`, janela de estabilização).
15. VPA, Cluster Autoscaler, Karpenter, KEDA + RabbitMQ.

### Fase 5 — Plataforma educacional
16. Trilhas independentes + estrutura para KCNA/KCSA/CKS.
17. Quiz por lição, revisão de erros, modo revisão, glossário, favoritos, histórico, pré-requisitos, exportar/importar/zerar progresso.

### Fase 6 — Consolidação
18. Performance (ADR-003, fonte local), acessibilidade WCAG 2.2 AA (axe + revisão manual), SEO por lição (ADR-005), Lighthouse “depois”, guias de lição e animação, ADRs finais.

---

## 6. Backlog com critérios de aceitação

Complexidade relativa: P (até ~1 dia), M (2–3 dias), G (1 semana), GG (mais de 1 semana).

| ID | Item | Critérios de aceitação | Compl. | Depende de |
|---|---|---|:-:|---|
| F1 | Testes E2E versionados | `npm test` percorre 236×2 passos sem erro de console; auditoria aponta 0 sobreposições; varredura do terminal sem exceções; roda local e no CI | M | — |
| F2 | Paridade i18n | Script falha se faltar chave, passo, legenda ou caixa de prova em um idioma | P | — |
| F3 | GitHub Actions | Workflow em PR e push roda F1, F2, link-check e kubeconform; **não** altera o deploy | P | F1, F2 |
| F4 | Refatoração em módulos | Screenshots de todos os passos idênticos antes/depois (diferença < 0,1%); nenhuma URL muda | G | F1 |
| F5 | Versão de referência + EndpointSlice | Uma constante `K8S_REF` exibida no rodapé; textos e terminal usam EndpointSlice (`get endpointslices`); Endpoints citado como *deprecated* | M | F4 |
| F6 | Currículo CKA/CKAD reconsultado | `certs.js` com data e link da consulta; pesos e competências conferidos no repositório oficial | P | acesso web |
| F7 | Docs open source | Arquivos do §14 presentes, com screenshots reais e instruções de execução local | M | ADR-007 |
| F8 | SEO básico | Preview correto no LinkedIn Post Inspector; `robots.txt` e `sitemap.xml` válidos | P | — |
| F9 | Lighthouse antes | Relatórios JSON e HTML reais versionados | P | — |
| S1 | Motor de simulação | Testes unitários do relógio: velocidade, pausa, voltar para t−1 reproduz o estado exato | G | F4 |
| S2 | Simulador de falha de node | O usuário derruba e restaura qualquer worker; Lease, Ready, taints, eviction, novo pod, EndpointSlice e scheduler visíveis na linha do tempo; nenhum pod “se move”; tempos reais configuráveis | GG | S1 |
| S3 | Comparativo de interrupções | Tabela e animação curta para restart/replacement/failure/drain/graceful/eviction/PDB, validadas na documentação oficial | M | S1 |
| S4 | Rede por pacote | Para cada cenário do §5: IP origem→destino, porta, DNAT/SNAT quando houver, endpoint escolhido; Service/EndpointSlice/NetworkPolicy desenhados como objetos (não como saltos) | GG | S1 |
| S5 | YAML sincronizado | Trecho do passo destacado; campos explicados; edição validada (ex.: `replicas` 0–10) refaz a simulação | G | S1, F5 |
| T1 | Modo incidente | Solução só aparece depois de pelo menos N comandos relevantes ou de pedir dica; hipóteses com feedback | G | S1 |
| T2 | 16 cenários | Cada um com os 10 itens do §6, logs e eventos com formato real de kubectl | GG | T1 |
| A1 | HPA interativo | Controle de CPU/RPS altera réplicas pela fórmula oficial; gráfico ao vivo; janela de estabilização respeitada | G | S1 |
| A2 | VPA, CA, Karpenter, KEDA + RabbitMQ | Diferença workload × recurso × node clara; KEDA escala a partir da fila, inclusive para 0 | GG | A1 |
| E1 | Trilhas | 6 trilhas, cada lição mapeada a objetivos oficiais com data | G | F6 |
| E2 | Quiz e revisão | Quiz por lição, revisão dos erros, modo revisão por certificação | G | E1 |
| E3 | Progresso completo | Favoritos, histórico, continuar, exportar/importar/zerar (JSON) | M | — |
| E4 | Glossário | Termos com link para a lição e a documentação oficial; busca integrada | M | — |
| C1 | Acessibilidade AA | axe sem violações sérias; navegação 100% por teclado; reduced-motion desliga pacotes | G | F4 |
| C2 | Performance | Lighthouse ≥ 90 (quando viável), idioma sob demanda, fonte local | M | F4, F9 |
| C3 | SEO por lição | Páginas estáticas por lição com OG próprio e hreflang; hash antigo continua funcionando | G | F4 |

---

## 7. Dependências entre funcionalidades

```
F1 ─┬─ F3 (CI)
F2 ─┘
F1 ── F4 (módulos) ─┬─ F5 ── S5
                    ├─ S1 (motor de simulação) ─┬─ S2, S3, S4
                    │                           ├─ T1 ── T2
                    │                           └─ A1 ── A2
                    ├─ C1, C2, C3
F6 ── E1 ── E2
ADR-007 (licença) ── F7
```

---

## 8. Estratégia de testes

| Tipo | Ferramenta (dev-only) | O que valida |
|---|---|---|
| Unitário | `node:test` (nativo, sem dependência) | Projeção iso, rotas das setas, `deconflict`, motor do terminal (`exec` puro), relógio da simulação |
| Integração | `node:test` + jsdom (opcional) | `derive()` diagrama → estado; paridade cena × texto |
| E2E | Playwright | Navegação por todos os passos, troca de idioma e de aba, terminal, busca, atalhos |
| Regressão visual | Playwright `toHaveScreenshot` | Um screenshot por passo × 3 larguras (390, 1280, 1920) |
| Sobreposição | Script de auditoria atual (`__audit`) | 0 sobreposições de blocos, setas e etiquetas |
| Acessibilidade | `@axe-core/playwright` | WCAG 2.2 AA automatizável |
| Traduções | Script Node | Chaves e estrutura idênticas PT/EN |
| Links | `lychee` (GitHub Action) | Links externos e âncoras |
| Manifestos | `kubeconform` | Todos os YAMLs das lições e do terminal contra o schema da versão de referência |
| Performance | Lighthouse CI | Relatórios versionados (sem números inventados) |

---

## 9. Como ver as mudanças antes de publicar

Até sua autorização, **nada vai para `main` nem para o GitHub Pages**. Opções para pré-visualizar, a escolher:

1. **Rodar no seu computador**: eu envio um `.zip` com os arquivos. Você descompacta e roda `python3 -m http.server 8080` na pasta, depois abre `http://localhost:8080`.
2. **Branch de preview no GitHub** (ex.: `preview`), sem afetar `main`. Exige autorização para *push* nessa branch.
3. **Página de preview privada** separada, visível só para você, sem tocar na versão publicada.

---

## 10. Riscos, limitações e pendências

- **Escopo muito grande:** as seis fases somam várias semanas de trabalho. A entrega é incremental, uma etapa aprovada por vez.
- **Precisão:** comportamentos de componentes, pesos de prova e status GA/Beta precisam ser conferidos nas fontes oficiais. Nesta análise o acesso à web ficou bloqueado aguardando permissão, então **F6 e P1 seguem pendentes**.
- **SEO com hash:** só se resolve de fato com páginas estáticas por lição (ADR-005).
- **Lighthouse:** os números serão medidos de verdade (Chrome headless). Nenhum resultado será estimado.
- **Licença:** depende da sua escolha (ADR-007).
- **Ferramentas dev** (Playwright, axe, kubeconform) entram só no CI e no ambiente local, nunca no site publicado.

### Aprovações necessárias para começar
1. Aprovar (ou ajustar) os ADR-001 a ADR-006.
2. Escolher a licença (ADR-007).
3. Escolher a forma de preview (seção 9).
4. Autorizar a Fase 1 começando por F1 → F2 → F3 → F4.
