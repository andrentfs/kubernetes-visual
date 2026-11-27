# Lighthouse — medições

Medições reais, feitas com **Lighthouse 13.6.0** (Chromium 1243, headless) dentro do container `dev`, contra o container `site` (nginx). Nenhum número aqui foi estimado.

Para refazer: `make lighthouse` (gera `docs/lighthouse/<nome>-mobile|desktop.report.{html,json}`).

## “Antes” — 27/11/2026 (commit `442c767`, antes das Fases 2–6)

| Perfil | Performance | Acessibilidade | Boas práticas | SEO |
|---|:-:|:-:|:-:|:-:|
| Mobile (padrão do Lighthouse) | 71 | 94 | 74 | 100 |
| Desktop (`--preset=desktop`) | 99 | 95 | 74 | 100 |

Relatórios completos: [`before-mobile.report.html`](before-mobile.report.html) · [`before-desktop.report.html`](before-desktop.report.html)

### O que tirou pontos

| Categoria | Auditoria | Situação | Observação |
|---|---|---|---|
| Performance (mobile) | Cumulative Layout Shift **0,63** | Problema real | O layout muda depois do primeiro desenho (montagem do menu, das métricas e do diagrama). Entra na Fase 6 |
| Performance (mobile) | FCP 2,4 s · LCP 2,6 s | Melhorável | Carregar só o idioma ativo e hospedar a fonte localmente (ADR-003, Fase 6) |
| Acessibilidade | `color-contrast` | Problema real | Textos em cinza claro (`--muted`) e algumas etiquetas abaixo de 4,5:1. Fase 6 (WCAG 2.2 AA) |
| Acessibilidade | `landmark-one-main` | Problema real | Falta o elemento `<main>`. Correção simples, Fase 6 |
| Boas práticas | `is-on-https` / `redirects-http` | **Artefato do ambiente local** | O container serve em `http://`. O GitHub Pages serve em HTTPS |
| Boas práticas | `errors-in-console` | **Artefato do ambiente local** | O ambiente de medição não alcança o Google Fonts, e a falha de rede aparece no console. Com rede normal não ocorre, e deixa de existir quando a fonte for hospedada no próprio site (Fase 6) |

A meta (acima de 90 nas quatro categorias, quando tecnicamente viável) será medida de novo no fim da Fase 6, com os mesmos comandos.
