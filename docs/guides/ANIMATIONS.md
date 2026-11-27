# Guide — diagrams and animations

Diagrams are drawn by `js/renderer.js` from the plain objects returned by each step's `s()` in `data/scenes.js`. Between steps of the same lesson, entities with the **same `id`** are animated from the old state to the new one. New ids drop in, and missing ids fade out.

## Coordinates

- Isometric projection: `P(x,y)` in `js/geometry.js`. `at(a,b)` converts “screen-axis” coordinates.
- Three worker nodes sit side by side: `node(0)`, `node(1)`, `node(2)`. The control plane is `cp()` (above).
- Each node has six pod slots `k` = 0…5: 0 top, 1/3 middle (right/left), 2/4 lower, 5 bottom.

## Helpers available in `data/scenes.js`

| Helper | Draws |
|---|---|
| `node(i, {id, lb, st, c})`, `nodes({2:{st:'down'}})` | Worker node slab(s) |
| `pod(id, nodeIndex, slot, state, label, {ic, b, m})` | A pod block on a node. `state`: `ok`, `dead`, `pend`, `new`, `other`; `b`: badge `[text, 'bad'|'ok']`; `ic`: icon |
| `blk(id, x, y, colour, label, {…})` | Any block at a free position |
| `cp(highlight)` | Control plane (API server, scheduler, controller, etcd) |
| `users()`, `kub()` | Users and kubectl |
| `SV`, `ING` | Service and Ingress blocks |
| `PP(id, node, x, y, …)` | Pod at a free position inside a node |

## Links and flows

- `f:[[from, to, speed, kind]]` are animated packets. `kind`: `req` (request), `heavy`, `hc` (health check, green), `bad` (failure, red).
- `l:[[from, to, 'd']]` are dashed static lines.
- Arrows run along the floor from footprint edge to footprint edge, with a single arrowhead in the direction of travel. If the straight path would cross another block, the renderer routes to the destination node's slab.

## Rules that keep diagrams readable

1. Nothing overlaps. `make test` fails if a link crosses a block (`window.__audit()`).
2. Blocks shrink automatically if they would collide. Prefer moving to another slot over squeezing.
3. Represent controllers *creating* new pods. Never show a pod “moving” between nodes.
4. Use the same ids across steps for the same object, so the transition animates.
5. Badges are short (a status or a value). Explanations belong in the text.
