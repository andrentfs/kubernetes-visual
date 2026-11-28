# Changelog

All notable changes to this project. Format based on [Keep a Changelog](https://keepachangelog.com/); dates are in UTC-3.

## [Unreleased]

### Added
- **Text in full screen**: the full-screen diagram now shows the step text on the side (below it on portrait screens), with Back/Next working. “Hide the text” (or the T key) leaves only the diagram, and “Show the text” brings it back. The “On the exam” box and the terminal (in lessons that have one) come along below the text, so you can switch exam tabs and run commands without leaving full screen.
- **KCNA and KCSA mock exams** (new “Mock exams” tab, `#quiz`): 30 original questions per exam in PT and EN, spread by the official domain weights (cncf/curriculum `f5ab45e`), 45 min, 75% to pass (the real exams have 60 questions in 90 min, per the Linux Foundation docs). Shuffled order, timer, flag for review, question map, keyboard, resume after reload, score by domain and a review with an explanation and an official docs link for every question. Loaded only when the tab opens. All question links are listed in `docs/quiz-references.md` so the CI link check verifies them.

### Fixed
- With the new tab there are 5 tabs, which overflowed the width on phones; on screens up to 560 px each tab now shows the icon above the name.
- **“On the exam” tabs stuck** in lessons with tips for a single exam (`cluster`, `nodefail` and the 5 module 06 lessons): clicking CKAD/CKS (or CKA/CKAD in module 06) did nothing. Cause: since the CKS release, the box forced the only exam with tips even after a click. Now a click always wins in that lesson; without a click the box still opens on the only exam with tips. The rule lives in one pure function (`CERTS_TAB` in `data/certs.js`) with unit tests. Reported by Júlio César.
- The “no tips” messages claimed things that are not always true (the CKAD one said the topic “is covered by the CKA”, wrong for CKS topics; the CKS one still spoke of content “coming”). Replaced by a neutral message that lists the tabs that do have tips.
- The review lesson (`tudo`) had CKAD and CKS tips but no CKA tips; added from the facts already on the CKA page and the CKA v1.37 weights.
- The collapse handle (‹) is now always visible on wide screens, at the same height of the window as you scroll; it used to appear only on hover and could end up off-screen, because a `<button>` centres its content vertically.
- **Collapsed menu in front of the text**: with the sidebar collapsed, the icon rail (and its flyout) now stays above the lesson content instead of being covered by it.
- **Long words no longer overflow**: long commands, URLs and resource names in the panel, the diagram caption, the “On the exam” box, the certification pages, the mock exams and the progress tracker now wrap inside their box.
- **Fast arrow keys**: pressing → then ← quickly could jump to the previous lesson, because the second key read the position from before the first one. Now each key starts from the step the previous key asked for.

- **Header overlap**: between about 1440 and 1560 px wide, the “Lesson X of 27” counter did not fit and slid under the language button, and on narrow tablets (561–760 px) the header ran off the screen. The counter and the “made by” text now show only from 1680 px, the tab names only from 1280 px, and on narrow tablets the tabs move to a second row. Reported on a Mac.
- **Diagram fits short windows**: on laptops with a short window, the diagram shrinks so the title, diagram and caption fit without scrolling. In the narrow side panel (1280–1599 px), “Back” becomes just the arrow so “Next: …” no longer wraps onto three lines.
- **Tests use the real font**: the E2E tests now load JetBrains Mono from the `@fontsource/jetbrains-mono` package (dev only; the site still uses Google Fonts). With the fallback font the header fit in the tests but not on screen. New tests: header in 14 widths (PT and EN), diagram fit in 4 short windows, and full screen with text.

### Changed
- **Better use of large screens**: the page grows up to 1640 px (2000 px from 1920 px wide, 2240 px from 2400 px), with wider side columns on those screens, and the header lines up with the content. On tablets (561–1000 px) the diagram is wider (16:11) so it is less cramped. An E2E test checks 5 window sizes (1024×768 to 2560×1440) for horizontal scroll and text overflowing its box.

## 2026-11-27 — Collapsible sidebar

### Added
- **Collapsible sidebar** on wide screens (≥ 1280 px). A handle with an arrow on the menu’s right edge collapses it. Collapsed, it becomes a column of module icons (colour, number, progress badge, current module highlighted, overall progress ring); hovering shows the module name and progress, and clicking opens a submenu with that module’s lessons (arrow keys, Esc, click outside). » opens the full menu, the `[` key toggles, and the choice is remembered. The lesson gains about 200 px. Smaller screens keep the drawer.

### Fixed
- Module 06 folder had the same colour as module 01; it now has its own.

## 2026-11-27 — ADRs 003–006 and node failure simulator

### Added
- CI validates the 28 example manifests with **kubeconform** (strict, Kubernetes v1.37.0 schemas + Gateway API CRD) and checks Markdown links with **lychee** ([ADR-006](docs/adr/ADR-006-kubeconform.md)). Locally: `make manifests`.
- Only the active language's texts are downloaded on first visit (≈ 67–69 KB gzip less); the other one is fetched when you switch. Diagram labels moved to `i18n/labels.js` ([ADR-003](docs/adr/ADR-003-lazy-language.md)).
- **A page per lesson and language** (`licao/<id>/`, `en/lesson/<id>/`, 54 pages) with its own title, description, Open Graph, `hreflang` and JSON-LD, the full lesson text and a button to the interactive version; the sitemap lists them all. Generated by `make pages` ([ADR-005](docs/adr/ADR-005-lesson-pages.md)). The app accepts `?lang=pt|en`.
- Shared **simulation engine** `js/sim/engine.js`: speed 0.5×–10×, pause, step forward/back, seek and exact rewind via checkpoints, immutable snapshots; 13 unit tests ([ADR-004](docs/adr/ADR-004-simulation-engine.md)). Users can act mid-timeline (`act`): going back and acting again creates a new future.
- **Node failure simulator** (`#sim/nodefail`, “Simulator” button in the “When a node goes down” lesson): take any node down or bring it back and watch the Lease, NotReady, taint, EndpointSlice, eviction, ReplicaSet, scheduler and StatefulSet second by second; speed 0.5×–10×, ±1 s, jump to next event, time slider and adjustable timings (v1.37 defaults). No pod ever moves. Loaded only when opened.

### Changed
- Docs brought up to date: implementation plan statuses (Phase 1 done, CKS track done, pending ADRs), ADR-001/002 marked accepted, new [ADR-007](docs/adr/ADR-007-license.md) for the license, architecture and lesson guide cover CKS (`examS`, `adv` level, module 06).

## 2026-11-27 — CKAD and CKS tracks

### Added
- “On the exam” box now has **CKA | CKAD** tabs. CKAD tips for the 18 lessons in the CKAD v1.37 curriculum, in PT and EN; lessons outside it say so. The choice is remembered.
- **CKS track**: new CKS tab with the 6 domains and weights of `CKS_Curriculum v1.37.pdf` (cncf/curriculum `f5ab45e`), honest coverage (covered / partial / coming soon, each gap pointing to a planned lesson), exam facts and tips.
- “On the exam” box gains a **CKS** tab, with tips in 9 lessons (RBAC, NetworkPolicy, ConfigMaps/Secrets/securityContext, images, kubeadm, Service/Ingress, extensions, observability, review).
- **Module 06 — Advanced security (CKS)**, 5 new lessons (69 min, 52 steps) in PT and EN: cluster security (CIS/kube-bench, API access, ServiceAccount tokens, cloud metadata, Ingress TLS, binary verification); system hardening (host footprint, ports, firewall, IAM, AppArmor, seccomp); isolation and encryption (Secrets at rest, multi-tenancy, RuntimeClass sandboxes, mTLS); supply chain (minimal images, Trivy, SBOM, Kubesec/KubeLinter, cosign, allowed registries); runtime security (Falco, threats, attack investigation, immutability, audit logs). Each has CKS exam tips.
- CKS coverage is now **26 of 26 competencies**.

### Changed
- “On the exam” box also shows on lessons that only have CKS tips, opening on that tab.

## 2026-11-27 — Phase 1 (foundation)

### Added
- Docker-first development: `site` (nginx), `dev` (Playwright/Node) and `preview` containers, `Makefile`, CI workflow ([ADR-001](docs/adr/ADR-001-docker-first.md)).
- Test suite: unit tests (`node:test`) for the simulated terminal, certification data and SEO; PT/EN parity check; Playwright end-to-end tests over all 236 steps in both languages.
- Reference Kubernetes version (**v1.37**, the CKA/CKAD exam version on 27 Nov 2026) shown in the sidebar ([`data/meta.js`](data/meta.js)).
- Terminal: `kubectl get endpointslices`, deprecation warning on `get endpoints`, read-only example YAML files (`ls`, `cat`).
- SEO: description, canonical, Open Graph image, Twitter Card, Schema.org `Course`, `robots.txt`, `sitemap.xml`.
- Lighthouse baseline in [`docs/lighthouse/`](docs/lighthouse/README.md).
- Licenses (MIT for code, CC BY 4.0 for content) and community files.

### Changed
- Code split by responsibility: `css/`, `js/`, `js/term/`, `data/`, `i18n/` ([ADR-002](docs/adr/ADR-002-file-structure.md)). Rendered output identical for all steps.
- Lessons use EndpointSlice instead of the deprecated Endpoints API.
- Node failure timeline uses the current `node-monitor-grace-period` default (50 s).
- kubeadm upgrade example: 1.35 → 1.36 → 1.37.
- CKA/CKAD domains and competencies re-checked against `cncf/curriculum` v1.37 (matched 1:1); source shown on the exam pages.

### Fixed
- Exam box overflowing the page width (Scheduling lesson).
- CKA/CKAD panel staying visible after returning to “Learn”.
- Orphan diagram blocks left behind when switching lessons.

## 2026-11-26 — Interactive terminal and node failure
- Simulated `kubectl` terminal in 10 lessons; new lesson “When a node goes down”; layout fixes for small screens; LinkedIn credit.
