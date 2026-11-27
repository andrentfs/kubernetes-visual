// Percorre todos os passos de todas as lições nos dois idiomas.
import { test, expect } from '@playwright/test';
import { open, allSteps, go } from './helpers.mjs';

for (const lang of ['pt', 'en']) {
  test(`todos os passos abrem sem erro e sem sobreposição (${lang})`, async ({ page }) => {
    const errors = await open(page, 'intro-1', lang);
    const steps = await allSteps(page);
    expect(steps.length).toBeGreaterThan(200);
    const overlaps = [];
    for (const h of steps) {
      await go(page, h);
      await expect(page.locator('#title')).not.toBeEmpty();
      const bad = await page.evaluate(() => window.__audit());
      if (bad.length) overlaps.push(`${h}: ${JSON.stringify(bad)}`);
    }
    expect(overlaps, 'setas atravessando blocos').toEqual([]);
    expect(errors, 'erros de console').toEqual([]);
  });
}
