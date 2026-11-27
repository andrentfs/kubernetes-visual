// Layout: métricas não cortadas e sem rolagem horizontal da página.
import { test, expect } from '@playwright/test';
import { open, go } from './helpers.mjs';

test('cards de métricas cabem e a página não rola de lado', async ({ page }) => {
  await open(page, 'intro-1');
  const steps = await page.evaluate(() => window.__dbg.L().map(l => `${l.id}-1`));
  for (const h of steps) {
    await go(page, h);
    const r = await page.evaluate(() => ({
      hscroll: document.documentElement.scrollWidth > window.innerWidth + 1,
      cut: [...document.querySelectorAll('#mets .met')].some(m => m.scrollWidth > m.clientWidth + 1),
    }));
    expect(r.hscroll, `${h}: rolagem horizontal`).toBe(false);
    expect(r.cut, `${h}: métrica cortada`).toBe(false);
  }
});
