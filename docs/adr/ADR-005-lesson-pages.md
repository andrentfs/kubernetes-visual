# ADR-005 — Páginas estáticas por lição para SEO e prévia em redes sociais

- **Status:** aceito e implementado (27/11/2026), com uma mudança em relação à proposta (ver “Decisão”, item 3)
- **Data:** 27/11/2026
- **Contexto do plano:** `docs/IMPLEMENTATION_PLAN.md`, C3 (SEO por lição)

## Contexto

O site é uma página única com rotas por hash (`#pods-1`). Buscadores e robôs de redes sociais ignoram o que vem depois do `#`: todo link para uma lição mostra o mesmo título, a mesma descrição e a mesma prévia, e só a raiz pode ser indexada. Os links existentes com hash não podem quebrar.

## Decisão

1. **Uma página por lição e idioma**, gerada por `scripts/gen-lesson-pages.mjs` a partir dos mesmos dados do site (`data/scenes.js`, `i18n/*.js`) e **versionada** no repositório, para o GitHub Pages continuar servindo a raiz da `main` sem build:
   - `licao/<id>/` (PT) e `en/lesson/<id>/` (EN): 27 lições × 2 = 54 páginas.
2. **Metadados próprios em cada página:** `<title>`, description, canonical, `hreflang` (pt-BR, en e `x-default` para a raiz), Open Graph e Twitter Card com o título e o resumo da lição, e JSON-LD `LearningResource` dentro do `Course`.
3. **Mudança em relação à proposta:** a ideia era a página **redirecionar** para o hash. O Google trata redirecionamento imediato (meta refresh 0 ou JavaScript) como redirecionamento, e aí indexaria só a raiz. Por isso a página **não redireciona**: ela traz o texto completo da lição (objetivos, passos, notas, tabelas e comandos) e um botão “Abrir a lição interativa”, que leva a `?lang=<idioma>#<id>-1`. O robô do LinkedIn lê o Open Graph do mesmo jeito.
4. **Idioma pelo link:** `js/boot.js` aceita `?lang=pt|en` e grava a escolha, para quem chega pela página em inglês abrir o curso em inglês.
5. **Sitemap:** gerado junto, com a raiz e as 54 páginas, cada uma com as alternativas de idioma (`xhtml:link`).
6. **Atualização garantida:** `node scripts/gen-lesson-pages.mjs --check` e um teste unitário falham se o que está no disco for diferente do que o gerador produz. Assim, mudar uma lição sem regenerar as páginas quebra o CI.

## Verificação

- Testes unitários: páginas iguais ao gerador; canonical, `hreflang`, Open Graph, descrição e JSON-LD válidos em todas; sitemap com 1 + 54 URLs.
- E2E: `licao/nodefail/` e `en/lesson/nodefail/` mostram o título e os 12 passos; o botão abre a lição interativa no idioma da página, mesmo com outro idioma salvo no navegador.
- Os links antigos (`/#pods-1`) continuam iguais.

## Alternativas consideradas

- **History API (`/licao/pods/3` dentro da aplicação):** quebraria os links com hash e exigiria fallback de 404 no Pages.
- **Página que só redireciona:** resolve a prévia social, mas não a indexação (item 3).
- **Gerar no CI e publicar por Actions:** obrigaria a trocar a publicação do Pages (“servir a raiz da `main`”), que o ADR-001 manteve.

## Consequências

- Depois de mudar uma lição, é preciso rodar `make pages` (ou `node scripts/gen-lesson-pages.mjs`) e versionar o resultado.
- O repositório ganha cerca de 55 arquivos gerados (cerca de 600 KB em disco). Eles não são editados à mão.
- A data do sitemap (`lastmod`) é uma constante no gerador, para a saída ser determinística; atualize-a ao publicar mudanças de conteúdo.
