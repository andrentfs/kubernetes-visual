# Contributing to Kubernetes Visual

Thanks for helping! This project teaches Kubernetes with animated isometric diagrams, a simulated `kubectl` terminal and CKA/CKAD study tracks, in **Brazilian Portuguese and English**.

## Ground rules

- **Accuracy first.** Every technical statement must be backed by official sources ([kubernetes.io/docs](https://kubernetes.io/docs/), [kubernetes/kubernetes](https://github.com/kubernetes/kubernetes), [cncf/curriculum](https://github.com/cncf/curriculum)…). Mention the source in the PR. Do not invent commands, flags, outputs or exam weights.
- **Reference version:** content targets the Kubernetes version in [`data/meta.js`](data/meta.js).
- **Both languages, always.** A change in `i18n/pt.js` needs the matching change in `i18n/en.js` (CI checks parity).
- **No production build, no runtime dependencies.** The site is static and served by GitHub Pages ([ADR-001](docs/adr/ADR-001-docker-first.md), [ADR-002](docs/adr/ADR-002-file-structure.md)).
- **The terminal is a simulation.** Keep outputs realistic and deterministic, and never present them as a real cluster.

## Development (Docker only)

You only need Docker (and `make`, or the plain `docker compose` commands in the README).

```bash
make up      # http://localhost:8082 — edit files and reload
make test    # unit + PT/EN parity + end-to-end (Playwright)
make shell   # shell inside the dev container
```

Before opening a PR, `make test` must pass. If you changed layout or diagrams, attach before/after screenshots.

## Where things live

| You want to… | Edit |
|---|---|
| Fix a lesson text or caption | `i18n/pt.js` and `i18n/en.js` |
| Change a diagram | `data/scenes.js` ([animation guide](docs/guides/ANIMATIONS.md)) |
| Add a lesson | see [new lesson guide](docs/guides/NEW_LESSON.md) |
| Add terminal support to a lesson | `js/term/lessons.js` (data) — rarely `js/term/engine.js` |
| Change the drawing engine or UI | `js/geometry.js`, `js/renderer.js`, `js/ui.js`, `css/app.css` |

## Commits and PRs

- Small, focused PRs. Describe *what* and *why*; link official sources for technical changes.
- Architecture changes need an ADR in `docs/adr/`.
- By contributing you agree that code is licensed under MIT and content under CC BY 4.0 (see [LICENSE](LICENSE) and [LICENSE-CONTENT.md](LICENSE-CONTENT.md)).

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).
