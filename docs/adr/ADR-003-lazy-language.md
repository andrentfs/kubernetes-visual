# ADR-003 — Carregar só os textos do idioma em uso

- **Status:** aceito e implementado (27/11/2026)
- **Data:** 27/11/2026
- **Contexto do plano:** `docs/IMPLEMENTATION_PLAN.md`, Fase 6 (C2, performance)

## Contexto

O `index.html` carregava `i18n/pt.js` e `i18n/en.js` sempre, mas cada visitante usa um idioma só. Medido em 27/11/2026 (gzip -9): `pt.js` 70,1 KB e `en.js` 68,5 KB, ou 203 KB e 202 KB sem compressão. Metade disso era baixada e interpretada à toa.

Duas restrições:

1. **Sem módulos ES** ([ADR-002](ADR-002-file-structure.md)): o site precisa abrir direto do disco (`file://`), e lá `import()` não funciona.
2. **O terminal simulado monta a cena em inglês** mesmo com o site em português (`js/ui.js`: `LANG='en'` durante `st.s()`), porque os nomes dos objetos do cluster simulado são em inglês. Para isso ele precisa dos rótulos em inglês (`TXT.en.lbl`).

A proposta original era `import()`; a restrição 1 a descartou.

## Decisão

1. **Rótulos à parte:** os rótulos curtos dos diagramas (`lbl`) dos dois idiomas saíram de `pt.js`/`en.js` para `i18n/labels.js` (3,1 KB, 1,5 KB gzip), sempre carregado. Os rótulos ficaram idênticos aos de antes (comparação feita na migração).
2. **Carregador** `js/boot.js`, último `<script>` estático:
   - decide o idioma como antes (`localStorage` `k8s-lang`, senão o idioma do navegador) e o expõe em `window.K8S_LANG`;
   - insere, com `async=false`, `i18n/<idioma>.js`, `js/content.js`, `js/renderer.js` e `js/ui.js`. Scripts clássicos inseridos assim executam na ordem de inserção, também em `file://`.
3. **Troca de idioma:** `setLang()` chama `window.K8S_loadLang(l, cb)`, que baixa o outro arquivo uma vez e só então refaz a tela.

## Resultado

Primeira visita: 70,1 + 68,5 = 138,6 KB gzip de textos passam a 1,5 + 70,1 KB (PT) ou 1,5 + 68,5 KB (EN). São cerca de **67–69 KB gzip a menos** (≈ 200 KB a menos para interpretar). O efeito no Lighthouse será medido de verdade no “depois” da Fase 6, sem estimativas.

## Verificação

- Teste E2E: abrindo em PT, só `labels.js` e `pt.js` são pedidos; ao trocar para EN, `en.js` é baixado e o título muda.
- Teste unitário: `index.html` não referencia `pt.js`/`en.js`; `labels.js` só tem rótulos, nos dois idiomas.
- Abertura por `file://` conferida nos dois sentidos (PT → EN e EN → PT), sem erros.
- Todos os 288 passos × 2 idiomas continuam sem erro e sem seta atravessando bloco.

## Alternativas consideradas

- **`import()` dinâmico:** quebra `file://`.
- **`document.write`:** síncrono e simples, mas desaconselhado pelos navegadores e por auditorias de desempenho.
- **Um arquivo por lição:** ganho maior, mas a busca (Ctrl K) precisa de todos os títulos; fica para depois, se valer a pena.

## Consequências

- **Rótulo novo de diagrama vai em `i18n/labels.js`**, nos dois idiomas, e não mais em `pt.js`/`en.js` (o guia de lição foi atualizado).
- Ferramentas que leem os textos em Node carregam `i18n/labels.js` antes de `pt.js`/`en.js`.
- A troca de idioma passa a ser assíncrona na primeira vez (um arquivo de cerca de 70 KB gzip).
