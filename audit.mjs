import { chromium } from 'playwright';
const ids = { hardening: 11, sistema: 10, isolamento: 11, supply: 10, runtime: 10 };
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
await p.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.fulfill({ status: 200, body: '' }));
await p.goto('http://127.0.0.1:4173/#hardening-1'); await p.waitForTimeout(600);
for (const [id, n] of Object.entries(ids)) for (let i = 1; i <= n; i++) {
  await p.evaluate(h => { location.hash = h }, `${id}-${i}`); await p.waitForTimeout(450);
  const bad = await p.evaluate(() => window.__audit());
  if (bad.length) console.log(`${id}-${i}`, JSON.stringify(bad));
  await p.locator('#svw').screenshot({ path: `/shots/c_${id}-${i}.png` });
}
console.log('errors', errs); await b.close();
