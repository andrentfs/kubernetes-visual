// Utilitários compartilhados dos testes E2E.
// Testes herméticos: requisições externas (ex.: Google Fonts) recebem resposta vazia.
export async function open(page, hash = 'intro-1', lang = 'pt') {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.fulfill({ status: 200, body: '' }));
  await page.addInitScript(l => { try { localStorage.setItem('k8s-lang', l); } catch {} }, lang);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`/#${hash}`);
  await page.waitForFunction(() => window.__dbg && window.K8STERM);
  return errors;
}
export const allSteps = page => page.evaluate(() => window.__dbg.L().flatMap(l => l.steps.map((_, i) => `${l.id}-${i + 1}`)));
export async function go(page, hash) {
  await page.evaluate(h => { location.hash = h; }, hash);
  await page.waitForFunction(h => location.hash === '#' + h, hash);
}
