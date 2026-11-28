// Simulados KCNA e KCSA: fluxo completo pela interface.
import { test, expect } from '@playwright/test';
import { open } from './helpers.mjs';

const answerAll = (page, right) => page.evaluate(r => {          // responde pela interface, certo ou errado
  const n = document.querySelectorAll('.qzgrid button').length;
  for (let k = 0; k < n; k++) {
    document.querySelector(`.qzgrid button[data-g="${k}"]`).click();
    const a = JSON.parse(localStorage.getItem('k8s-quiz-' + location.hash.split('/')[1]));
    const Q = window.K8SQUIZ[a.id], qi = a.order[a.i], ok = Q.q[qi].ok;
    const want = r ? ok : (ok + 1) % 4;
    document.querySelector(`.qzo button[data-o="${want}"]`).click();
  }
}, right);

test('aba Simulados: tela inicial com KCNA e KCSA, formato da prova e pesos oficiais', async ({ page }) => {
  const errors = await open(page, 'intro-1', 'pt');
  await page.locator('#tabs button[data-v="quiz"]').click();
  await expect(page).toHaveURL(/#quiz$/);
  await expect(page.locator('.qzc')).toHaveCount(2);
  await expect(page.locator('.qzc').first()).toContainText('60 questões · 90 min · 75% para passar');
  await expect(page.locator('.qzc').first()).toContainText('30 questões · 45 min · 75% para passar');
  await expect(page.locator('.qzc').nth(1)).toContainText('Kubernetes Cluster Component Security');
  await page.locator('#tabs button[data-v="learn"]').click();
  await expect(page.locator('#title')).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test('KCNA: responder tudo certo dá 100% e aprovação; revisão mostra as 30 com explicação', async ({ page }) => {
  const errors = await open(page, 'intro-1', 'pt');
  await page.goto('/#quiz');
  await page.locator('[data-start="kcna"]').click();
  await expect(page.locator('.qzbar')).toContainText('Questão 1 de 30');
  await answerAll(page, true);
  await expect(page.locator('.qzgrid button.an')).toHaveCount(30);
  await page.locator('[data-a="finish"]').click();                // tudo respondido: finaliza sem confirmação
  await expect(page.locator('.qzh h1')).toHaveText('KCNA · 100%');
  await expect(page.locator('.qzv')).toHaveClass(/ok/);
  await page.locator('[data-a="review"]').click();
  await expect(page.locator('.qzrev li.ok')).toHaveCount(30);
  await expect(page.locator('.qzrev .qzexp').first()).not.toBeEmpty();
  await page.locator('a[href="#quiz"]').first().click();
  await expect(page.locator('.qzbest').first()).toHaveText('Seu melhor resultado: 100%');
  expect(errors).toEqual([]);
});

test('KCSA em inglês: tudo errado reprova; confirmação ao finalizar com questões em branco', async ({ page }) => {
  const errors = await open(page, 'intro-1', 'en');
  await page.goto('/#quiz/kcsa');
  await expect(page.locator('.qzbar')).toContainText('Question 1 of 30');
  await page.locator('[data-a="finish"]').click();
  await expect(page.locator('.qzconf')).toContainText('30 question(s) still unanswered');
  await page.locator('[data-a="finish-no"]').click();
  await expect(page.locator('.qzconf')).toHaveCount(0);
  await answerAll(page, false);
  await page.locator('[data-a="finish"]').click();
  await expect(page.locator('.qzh h1')).toHaveText('KCSA · 0%');
  await expect(page.locator('.qzv')).toHaveClass(/bad/);
  expect(errors).toEqual([]);
});

test('tentativa continua depois de recarregar; teclado responde; tempo esgotado finaliza', async ({ page }) => {
  await open(page, 'intro-1', 'pt');
  await page.goto('/#quiz/kcna');
  await expect(page.locator('.qzbar')).toContainText('Questão 1 de 30');   // arquivos do simulado vêm sob demanda
  await page.keyboard.press('2');
  await expect(page.locator('.qzo button[aria-checked="true"]')).toHaveCount(1);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.qzbar')).toContainText('Questão 3 de 30');
  await page.reload();
  await expect(page.locator('.qzbar')).toContainText('Questão 3 de 30');
  await expect(page.locator('.qzgrid button.an')).toHaveCount(1);
  await page.evaluate(() => { const a = JSON.parse(localStorage.getItem('k8s-quiz-kcna')); a.end = Date.now() - 1000; localStorage.setItem('k8s-quiz-kcna', JSON.stringify(a)); });
  await page.reload();
  await expect(page.locator('.qzh h1')).toHaveText(/^KCNA · \d+%$/);
});
