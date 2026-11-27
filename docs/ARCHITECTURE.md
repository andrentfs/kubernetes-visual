# Architecture

Static site, no production build, served by GitHub Pages from the root of `main`. Development and tests run in Docker ([ADR-001](adr/ADR-001-docker-first.md)).

```
index.html ─┬─ css/app.css
            ├─ data/meta.js        reference Kubernetes version
            ├─ data/certs.js       CKA/CKAD/CKS domains, weights, competencies → lessons
            ├─ data/scenes.js      window.buildScenes(H): scenes per lesson/step (language-neutral)
            ├─ i18n/labels.js      window.TXT.{pt,en}.lbl: short diagram labels, both languages (always loaded)
            ├─ js/term/lessons.js  ┐
            ├─ js/term/files.js    ├─ simulated terminal (data → window.K8STERM_DATA; engine → window.K8STERM)
            ├─ js/term/engine.js   ┘
            ├─ js/geometry.js      isometric projection, colours, icons, scene helpers
            └─ js/boot.js          picks the language, then loads in order (ADR-003):
                 ├─ i18n/pt.js or en.js   UI texts, lessons, captions (only the active language)
                 ├─ js/content.js         active language, builds the lesson list L
                 ├─ js/renderer.js        paint(): diff-based SVG rendering, links, packets, camera, anti-overlap
                 └─ js/ui.js            routing (#lesson-step, #cka, #ckad, #cks), panels, “On the exam” box (CKA/CKAD/CKS tabs), search, progress, theme, terminal wiring
```

Simulators ([ADR-004](adr/ADR-004-simulation-engine.md)) live in `js/sim/` and are loaded on demand (`window.K8S_load`) when the route `#sim/<id>` opens:

- `engine.js` (`window.K8SSIM`): shared clock: speed, pause, step, seek, exact rewind, user actions. No DOM.
- `nodefail.js` (`window.K8SSIM_NODEFAIL`): node failure model (state and rules only).
- `ui.js` (`window.SIMUI`): the screen, drawn with the same `paint()` as the lessons.

Classic scripts share top-level declarations, so **the order of `<script>` tags matters** ([ADR-002](adr/ADR-002-file-structure.md)).

## Flow of a step

1. `hashchange` → `show()` reads `#<lesson>-<step>`.
2. The step's `s()` builds the entities. `paint()` diffs them against what is on screen and animates.
3. The same scene, built in English, goes to `K8STERM.step()`, which derives a deterministic fake cluster state (pods, nodes, Services, PVCs…) and answers commands.

## State kept in the browser (`localStorage`)

`k8s-lang`, `k8s-theme`, `k8s-done` (lessons completed), `k8s-chk` (CKA/CKAD/CKS checklist), `k8s-exam` (tab chosen in the “On the exam” box).

## Quality gates

`make test`: unit tests (`tests/unit`), PT/EN parity (`tests/tools/i18n-parity.mjs`), end-to-end (`tests/e2e`: every step in both languages without console errors or overlapping links, terminal, views, layout). CI runs the same container (`.github/workflows/test.yml`).
