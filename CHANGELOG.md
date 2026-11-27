# Changelog

All notable changes to this project. Format based on [Keep a Changelog](https://keepachangelog.com/); dates are in UTC-3.

## [Unreleased]

### Added
- **Module 06 — Advanced security (CKS)**, 5 new lessons (69 min, 52 steps) in PT and EN: cluster security (CIS/kube-bench, API access, ServiceAccount tokens, cloud metadata, Ingress TLS, binary verification); system hardening (host footprint, ports, firewall, IAM, AppArmor, seccomp); isolation and encryption (Secrets at rest, multi-tenancy, RuntimeClass sandboxes, mTLS); supply chain (minimal images, Trivy, SBOM, Kubesec/KubeLinter, cosign, allowed registries); runtime security (Falco, threats, attack investigation, immutability, audit logs). Each has CKS exam tips.
- CKS coverage is now **26 of 26 competencies**.
- “On the exam” box now has **CKA | CKAD** tabs. CKAD tips for the 18 lessons in the CKAD v1.37 curriculum, in PT and EN; lessons outside it say so. The choice is remembered.
- **CKS track**: new CKS tab with the 6 domains and weights of `CKS_Curriculum v1.37.pdf` (cncf/curriculum `f5ab45e`), honest coverage (covered / partial / coming soon, each gap pointing to a planned lesson), exam facts and tips.
- “On the exam” box gains a **CKS** tab, with tips in 9 lessons (RBAC, NetworkPolicy, ConfigMaps/Secrets/securityContext, images, kubeadm, Service/Ingress, extensions, observability, review).

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
