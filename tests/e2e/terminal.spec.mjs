// Roda as sugestões do terminal em todos os passos das lições com terminal.
import { test, expect } from '@playwright/test';
import { open, go } from './helpers.mjs';

test('sugestões do terminal executam sem exceção', async ({ page }) => {
  const errors = await open(page, 'pods-1');
  const plan = await page.evaluate(() => {
    const L = window.__dbg.L(), on = window.K8STERM._lessons();
    return L.filter(l => on.includes(l.id)).flatMap(l => l.steps.map((_, i) => `${l.id}-${i + 1}`));
  });
  expect(plan.length).toBeGreaterThan(100);
  const problems = [];
  for (const h of plan) {
    await go(page, h);
    const res = await page.evaluate(() => [...document.querySelectorAll('#term .tcl button')].map(b => {
      try { const r = window.K8STERM._exec(b.dataset.c); return [b.dataset.c, r && typeof r.txt === 'string' ? '' : 'sem saída']; }
      catch (e) { return [b.dataset.c, 'exceção: ' + e.message]; }
    }));
    res.filter(([, p]) => p).forEach(([c, p]) => problems.push(`${h} · ${c} · ${p}`));
  }
  expect(problems).toEqual([]);
  expect(errors).toEqual([]);
});

test('terminal mostra aviso de simulação e roda comando digitado', async ({ page }) => {
  await open(page, 'trouble-4');
  const term = page.locator('#term');
  await expect(term).toBeVisible();
  await expect(term.locator('.tdisc')).toContainText('simulado');
  await term.locator('input').fill('cat deployment.yaml');
  await term.locator('input').press('Enter');
  await expect(term.locator('.tout')).toContainText('kind: Deployment');
  await expect(term.locator('.tout')).toContainText('Somente leitura');
});

test('lição sem terminal esconde o terminal', async ({ page }) => {
  await open(page, 'intro-1');
  await expect(page.locator('#term')).toBeHidden();
});
