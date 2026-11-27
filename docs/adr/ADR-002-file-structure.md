# ADR-002 — Separar o `index.html` em arquivos por responsabilidade, com scripts clássicos

- **Status:** aceito e implementado (publicado com a Fase 1 em 27/11/2026)
- **Relacionado:** ADR-001 (Docker), `docs/IMPLEMENTATION_PLAN.md` item F4

## Contexto

O `index.html` tinha 80 KB: o CSS inteiro, a interface e o motor do diagrama num único bloco `{ … }`. O `term.js` (121 KB) misturava o interpretador do terminal com os dados de cada lição e os arquivos YAML de exemplo. Isso dificultava revisar mudanças, testar partes isoladas e acrescentar os simuladores previstos nas fases 2 a 4.

O plano original sugeria módulos ES (`<script type="module">`). Mas módulos ES **não carregam quando o `index.html` é aberto direto do disco (`file://`)**, por causa da política de CORS dos navegadores. Hoje isso funciona, e não há ganho que justifique perder essa compatibilidade nem introduzir um bundler (ADR-001: produção sem build).

## Decisão

Separar em arquivos por responsabilidade, mantendo **scripts clássicos**. As declarações de topo (`const`/`let`/`function`) de scripts clássicos ficam no mesmo escopo léxico global e são compartilhadas entre arquivos, então o código foi dividido **sem mudar nenhuma linha de lógica**, só a localização.

```
index.html              estrutura da página (7 KB)
css/app.css             todos os estilos
data/certs.js           domínios e competências CKA/CKAD/CKS
data/scenes.js          cenas das lições (iguais nos dois idiomas)
i18n/pt.js, i18n/en.js  textos
js/term/lessons.js      terminal: ajustes por lição/passo (dados)
js/term/files.js        terminal: YAMLs de exemplo (dados)
js/term/engine.js       terminal: derivação do estado + interpretador (lógica)
js/geometry.js          projeção isométrica, cores, ícones, helpers de cena
js/content.js           idioma ativo e montagem das lições
js/renderer.js          desenho: blocos, setas, pacotes, câmera, anti-sobreposição
js/ui.js                interface, navegação e inicialização
```

**A ordem de carregamento importa** e está documentada no `index.html` e no cabeçalho de cada arquivo:
1. dados (`data/*.js`, `i18n/*.js`);
2. terminal (`lessons.js` e `files.js` antes de `engine.js`);
3. aplicação (`geometry` → `content` → `renderer` → `ui`).

Os dados do terminal ficam em `window.K8STERM_DATA`. O motor lê dali, então acrescentar uma lição ao terminal passa a ser só mexer em `js/term/lessons.js`.

## Verificação

- O DOM de **todos os 236 passos + abas CKA/CKAD** foi capturado antes e depois (SVG do diagrama, painel, cabeçalho, menu e terminal) e comparado: **idêntico**. A única diferença é a fase aleatória dos pacotes animados (`begin="…"`), que já variava a cada carga.
- `make test` (unitários, paridade PT/EN e 10 E2E) passa no container.
- A imagem `preview` serve os novos caminhos (200) e devolve 404 para os antigos (`/term.js`).

## Consequências

- **Positivas:**
  - Arquivos menores e com papel claro.
  - Dados separados da lógica no terminal.
  - Os testes unitários carregam só o necessário.
  - Abrir o `index.html` direto do disco continua funcionando.
- **Negativas:**
  - Sem `import`/`export`, as dependências entre arquivos são implícitas (nomes globais), e a ordem das tags `<script>` precisa ser respeitada. Um teste E2E acusa qualquer erro de carregamento.
  - Nomes de topo não podem se repetir entre arquivos (o navegador dá erro de redeclaração, o que ajuda a detectar).
- **Futuro:** se um dia houver build (por exemplo, para minificar), dá para migrar para módulos ES arquivo por arquivo, sem mudar o desenho.
