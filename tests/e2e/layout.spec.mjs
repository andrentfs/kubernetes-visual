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

test('menu lateral: alça na borda recolhe; coluna de ícones com dicas, submenu por módulo e » para abrir', async ({ page }) => {
  await page.setViewportSize({ width: 1344, height: 800 });
  const errors = await open(page, 'escala-1', 'pt');
  const stage = async () => (await page.locator('.stage').boundingBox()).width;
  const before = await stage();
  await expect(page.locator('#rail')).toBeHidden();
  const h = page.locator('#sideH');
  await expect(h).toBeVisible();                                  // sempre à mostra, sem precisar do mouse
  const y0 = (await h.boundingBox()).y;
  await page.mouse.wheel(0, 600);
  await expect.poll(async () => Math.round((await h.boundingBox()).y)).toBe(Math.round(y0)); // não se move com a rolagem
  await page.mouse.wheel(0, -600);
  await h.hover();
  await expect(h).toHaveCSS('opacity', '1');
  await expect(h).toHaveAttribute('aria-label', 'Recolher o menu');
  await h.click();
  await expect(page.locator('body')).toHaveClass(/sidecol/);
  await expect(page.locator('#side')).toBeHidden();
  await expect(page.locator('#rail')).toBeVisible();
  await expect(page.locator('#railOpen')).toBeFocused();
  expect(await stage()).toBeGreaterThan(before + 150);

  // dica no mouse em cima; relevo só no hover
  const m3 = page.locator('#rail .rb[data-m="2"]');
  await expect(m3).toHaveAttribute('data-tip', /^03\. Operação · \d\/7$/);
  await expect(m3).toHaveClass(/cur/);
  await page.locator('#railOpen').hover();
  await expect(page.locator('#railOpen')).not.toHaveCSS('box-shadow', 'none');
  await expect.poll(() => page.locator('#railOpen').evaluate(e => getComputedStyle(e, '::after').opacity)).toBe('1');

  // submenu: abre no clique, foco na lição atual, setas, Esc
  await m3.click();
  const fly = page.locator('#fly');
  await expect(fly).toBeVisible();
  await expect(fly.locator('.les')).toHaveCount(7);
  await expect(fly.locator('.les.on')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(fly.locator('.les').nth(1)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(fly).toBeHidden();
  await expect(m3).toBeFocused();

  // clicar numa lição navega e mantém o menu recolhido
  await m3.click();
  await fly.locator('.les', { hasText: 'Quando um node cai' }).click();
  await expect(page.locator('#title')).toHaveText('Quando um node cai');
  await expect(fly).toBeHidden();
  await expect(page.locator('body')).toHaveClass(/sidecol/);

  // lembra a escolha; "Abrir o menu completo" abre com o módulo expandido
  await page.reload();
  await expect(page.locator('#rail')).toBeVisible();
  await page.locator('#rail .rb[data-m="4"]').click();
  await fly.locator('[data-full]').click();
  await expect(page.locator('body')).not.toHaveClass(/sidecol/);
  await expect(page.locator('#side details[data-m="4"]')).toHaveAttribute('open', '');

  // tecla [ alterna; » abre
  await page.keyboard.press('[');
  await expect(page.locator('body')).toHaveClass(/sidecol/);
  await page.locator('#railOpen').click();
  await expect(page.locator('body')).not.toHaveClass(/sidecol/);
  expect(errors).toEqual([]);
});

test('em tela estreita não há alça nem coluna de ícones; o ☰ continua abrindo a gaveta', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.addInitScript(() => { try { localStorage.setItem('k8s-side', '0'); } catch {} });
  await open(page, 'intro-1', 'pt');
  await expect(page.locator('#sideH')).toBeHidden();
  await expect(page.locator('#rail')).toBeHidden();
  await page.locator('#menu').click();
  await expect(page.locator('#side')).toHaveClass(/open/);
});

test('caixa “Na prova” no celular e no desktop: abas respondem e nada estoura a largura', async ({ page }) => {
  const errors = await open(page, 'cluster-1', 'pt');
  for (const id of ['cluster', 'hardening']) {
    await page.evaluate(h => { location.hash = h; }, `${id}-1`);
    const box = page.locator('#exam');
    await box.scrollIntoViewIfNeeded();
    await expect(box).toBeVisible();
    await box.locator('button[data-x="ckad"]').click();
    await expect(box.locator('button[aria-pressed="true"]')).toHaveText('CKAD');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});
