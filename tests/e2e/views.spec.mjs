// Navegação entre Aprender, CKA e CKAD; tema e idioma.
import { test, expect } from '@playwright/test';
import { open } from './helpers.mjs';

test('voltar de CKA/CKAD para Aprender não deixa o painel de certificação visível', async ({ page }) => {
  await open(page, 'pods-3');
  for (const tab of ['CKA', 'CKAD']) {
    await page.locator(`#tabs button[data-v="${tab.toLowerCase()}"]`).click();
    await expect(page.locator('#cert')).toBeVisible();
    await page.locator('#tabs button[data-v="learn"]').click();
    await expect(page.locator('#cert')).toBeHidden();
    await expect(page).toHaveURL(/#pods-3$/);
  }
});

test('troca de idioma muda os textos', async ({ page }) => {
  await open(page, 'pods-1', 'en');
  const en = await page.locator('#title').textContent();
  await page.locator('#langB').click();
  await page.locator('#langM button[data-l="pt"]').click();
  await expect(page.locator('#title')).not.toHaveText(en);
  await expect(page.locator('html')).toHaveAttribute('lang', /pt/);
});

test('setas do teclado avançam e voltam os passos', async ({ page }) => {
  await open(page, 'pods-1');
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#pods-2$/);
  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(/#pods-1$/);
});
