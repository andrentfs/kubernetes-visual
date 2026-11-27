// Simulador “quando um node cai” (S2, ADR-004): fluxo completo pela interface.
import { test, expect } from '@playwright/test';
import { open } from './helpers.mjs';

const met = (page, i) => page.locator('#mets .met b').nth(i);

test('derrubar node-3, pular para NotReady e despejo, voltar 1 s e retornar à lição', async ({ page }) => {
  const errors = await open(page, 'nodefail-1', 'pt');
  await page.locator('a.chip.sim').click();
  await expect(page).toHaveURL(/#sim\/nodefail$/);
  await expect(page.locator('#title')).toHaveText('Simulador: derrube um node');
  await expect(page.locator('#term')).toBeHidden();
  await expect(met(page, 1)).toHaveText('3/3');

  await page.locator('#simn button[data-n="2"]').click();        // derruba (e começa a tocar)
  await page.locator('#simplay').click();                         // pausa
  await page.evaluate(() => SIMUI.sim().seek(1));                 // garante o ponto de partida (t=1)
  await expect(page.locator('#simf')).toContainText('node-3 desligou');

  await page.locator('[data-a="next"]').click();                  // próximo: NotReady (último Lease em 0, 51 − 0 > 50)
  await expect(met(page, 0)).toHaveText('0:51');
  await expect(met(page, 1)).toHaveText('2/3');
  await expect(page.locator('#simf li').first()).toContainText('NotReady');

  await page.locator('[data-a="next"]').click();                  // despejo 300 s depois
  await expect(met(page, 0)).toHaveText('5:51');
  await expect(met(page, 3)).toHaveText('2');
  await expect(page.locator('#simf')).toContainText('O StatefulSet não cria outro db-0');

  await page.keyboard.press('ArrowLeft');                         // volta 1 s: estado anterior exato
  await expect(met(page, 0)).toHaveText('5:50');
  await expect(met(page, 3)).toHaveText('0');

  await page.locator('#simn button[data-n="2"]').click();         // religa: novo futuro a partir daqui
  await page.locator('#simplay').click();
  await page.evaluate(() => SIMUI.sim().seek(360));
  await expect(met(page, 1)).toHaveText('3/3');
  await expect(met(page, 3)).toHaveText('0');

  await page.locator('a[href="#nodefail-1"]').click();
  await expect(page.locator('#title')).toHaveText('Quando um node cai');
  await expect(page.locator('body')).not.toHaveClass(/simmode/);
  expect(errors).toEqual([]);
});

test('simulador em inglês, aberto direto pelo link', async ({ page }) => {
  const errors = await open(page, 'nodefail-1', 'en');
  await page.goto('/#sim/nodefail');
  await expect(page.locator('#title')).toHaveText('Simulator: take a node down');
  await expect(page.locator('#simn button').first()).toHaveText('Take down node-1');
  expect(errors).toEqual([]);
});
