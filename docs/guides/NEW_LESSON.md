# Guide — adding a lesson

A lesson is **four pieces**, all keyed by the same id (e.g. `quotas`):

| Piece | File | What it holds |
|---|---|---|
| Order and module | `data/scenes.js` → `window.LESSON_ORDER` | Where the lesson appears in the course |
| Scenes | `data/scenes.js` → `quotas:{min,lvl,mod,steps:[…]}` | One diagram per step, language-neutral |
| Texts | `i18n/pt.js` and `i18n/en.js` → `les.quotas` and `cap.quotas` | Title, steps, captions, exam box |
| Diagram labels (if new) | `i18n/labels.js` → `TXT.pt.lbl` and `TXT.en.lbl` | Short words used inside diagrams via `tl('key')`; always loaded ([ADR-003](../adr/ADR-003-lazy-language.md)) |
| Certification mapping (optional) | `data/certs.js` | Which CKA/CKAD/CKS competencies the lesson covers |

## 1. Scenes (`data/scenes.js`)

```js
quotas:{min:10,lvl:'int',mod:2,steps:[
  {k:'contexto', s:()=>({e:[...cp(['api']),...nodes(),pod('a0',0,1),pod('a1',1,1)], f:[['a0','api',1,'req']]})},
  {k:'problema', cmd:'kubectl describe quota', s:()=>({e:[/* … */]})},
  // one object per step
]},
```

- `lvl` is `beg`, `int` or `adv`; `mod` is the module index (0–5, names in `TXT.<lang>.mods`).
- `k` is the step kind: `contexto`, `conceito`, `problema`, `solucao`, `tradeoff` or `resumo`. It sets the badge colour.
- `cmd` (optional) is shown in the step panel with Copy (and ▶ if the lesson has the terminal).
- `s()` returns the scene: `e` holds the entities, `f` the animated flows `[from, to, speed, kind]` and `l` the static lines `[from, to, 'd']`.
- See the [animation guide](ANIMATIONS.md) for helpers, positions and states.

## 2. Texts (`i18n/pt.js` **and** `i18n/en.js`)

```js
quotas:{t:'Title',lede:'One-sentence summary.',ml:['Metric 1','Metric 2','Metric 3','Metric 4'],
 goals:[['What you will learn',stepNumber],…],
 steps:[{n:'Short name',h:'Step title',p:['Paragraph','Paragraph'],key:'…',good:'…',warn:'…',chg:[['+','added'],['-','removed'],['~','changed']],m:['v1','v2','!bad','+good']}, …],
 exam:{t:['Exam tip…'],c:['kubectl …']},   // CKA tab (optional)
 examD:{t:[…],c:[…]},                      // CKAD tab (optional)
 examS:{t:[…],c:[…]}},                     // CKS tab (optional)
```

and in `cap`: `quotas:['caption of step 1', …]` (same number of items as steps).

Rules:
- Same number of steps, paragraphs and metrics in both languages (`make test-i18n` checks this).
- Simple language: explain as if to someone outside IT, then add the technical name.
- Every fact checked against official docs for the version in `data/meta.js`.

## 3. Optional: terminal

Add the lesson id to `LESSONS` in `js/term/lessons.js`. The engine derives pods, nodes and Services from the diagram. Use `OV.quotas` for per-step adjustments (`chips`, `out`, `pods`, …) and `js/term/files.js` for example YAMLs.

## 4. Static pages

Every lesson also has a text page per language (`licao/<id>/`, `en/lesson/<id>/`) with its own title and Open Graph, and the sitemap lists them ([ADR-005](../adr/ADR-005-lesson-pages.md)). After adding or changing a lesson:

```bash
make pages    # or: node scripts/gen-lesson-pages.mjs
```

`make test` fails if the pages are out of date.

## 5. Check

```bash
make test     # parity, same step count in scenes and texts, all steps without errors or overlaps, terminal suggestions
make up       # look at it in http://localhost:8082/#quotas-1
```
