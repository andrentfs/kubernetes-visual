# Roadmap

The detailed plan, with acceptance criteria, lives in [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md).

| Phase | Focus | Status |
|---|---|---|
| 1 — Foundation | Tests, CI, Docker, refactor, accuracy (v1.37, EndpointSlice, curricula), SEO, docs, licenses | ✅ done |
| 2 — Simulations | Shared simulation clock (speed, pause, step back); interactive node failure; packet-level networking (IPs, ports, DNAT/SNAT, EndpointSlices, Ingress vs Gateway API, eBPF, MetalLB); YAML synced with the animation | next |
| 3 — Troubleshooting | Guided incident mode (symptoms → investigate → hypotheses → root cause → fix) with 16 scenarios | planned |
| 4 — Autoscaling | HPA with live charts, VPA, Cluster Autoscaler, Karpenter, KEDA + RabbitMQ | planned |
| 5 — Learning platform | Tracks (Fundamentals, CKA, CKAD, Networking, Troubleshooting, Advanced Ops; ready for KCNA/KCSA; CKS track complete: exam page, tips and module 06 with 5 lessons), quizzes, glossary, favourites, history, export/import progress | planned |
| 6 — Consolidation | Performance (load only the active language, local font), WCAG 2.2 AA, per-lesson SEO pages, Lighthouse “after” | planned |
