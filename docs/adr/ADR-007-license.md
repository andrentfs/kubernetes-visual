# ADR-007 — Licença: MIT para o código, CC BY 4.0 para o conteúdo

- **Status:** aceito e implementado (decisão do autor, publicado em 27/11/2026)
- **Data:** 27/11/2026
- **Contexto do plano:** `docs/IMPLEMENTATION_PLAN.md`, Fase 1 (F7)

## Contexto

O repositório não tinha licença. Sem ela, ninguém pode legalmente reutilizar, adaptar ou contribuir com o projeto, mesmo sendo público. O projeto mistura dois tipos de material: **código** (motor isométrico, terminal simulado, testes, Docker) e **conteúdo didático** (textos das lições, legendas, dicas de prova, cenas e mapas de certificação).

## Decisão

- **Código: MIT** ([`LICENSE`](../../LICENSE)). Permissiva e curta, compatível com uso em empresas e cursos.
- **Conteúdo: CC BY 4.0** ([`LICENSE-CONTENT.md`](../../LICENSE-CONTENT.md)). Permite copiar e adaptar as lições, inclusive comercialmente, desde que o autor seja citado.
- O `LICENSE-CONTENT.md` lista o que é conteúdo (`i18n/`, cenas e mapas em `data/`) e o que é código.
- Aviso de marca: Kubernetes® é marca registrada da The Linux Foundation; CKA, CKAD e CKS são certificações da CNCF / The Linux Foundation; o projeto é independente.

## Alternativas consideradas

- **Apache-2.0 para o código:** traz concessão explícita de patentes, mas é mais longa; para um site educacional estático, a MIT basta.
- **Uma licença só para tudo:** licenças de software não se encaixam bem em texto didático, e a CC BY 4.0 não é recomendada para código.

## Consequências

- Contribuições entram sob as mesmas licenças (ver `CONTRIBUTING.md`).
- Quem reutilizar o conteúdo precisa dar crédito ao autor.
