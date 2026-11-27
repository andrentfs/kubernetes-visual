// Navegação entre Aprender, CKA e CKAD; tema e idioma.
import { test, expect } from '@playwright/test';
import { open } from './helpers.mjs';

test('voltar de CKA/CKAD/CKS para Aprender não deixa o painel de certificação visível', async ({ page }) => {
  await open(page, 'pods-3');
  for (const tab of ['CKA', 'CKAD', 'CKS']) {
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

test('caixa “Na prova” alterna CKA/CKAD e lembra a escolha', async ({ page }) => {
  await open(page, 'probes-1');
  const box = page.locator('#exam');
  await box.locator('button[data-x="ckad"]').click();
  await expect(box.locator('button[data-x="ckad"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(box).toContainText('Probes e health checks');
  await page.evaluate(() => { location.hash = 'kubeadm-1'; });
  await expect(box.locator('.exno')).toContainText('CKAD');
  await page.reload();
  await expect(page.locator('#exam button[data-x="ckad"]')).toHaveAttribute('aria-pressed', 'true');
});

test('caixa “Na prova” tem aba CKS com dicas onde o tema aparece', async ({ page }) => {
  await open(page, 'rbac-1');
  const box = page.locator('#exam');
  await box.locator('button[data-x="cks"]').click();
  await expect(box.locator('button[data-x="cks"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(box).toContainText('automountServiceAccountToken');
  await page.evaluate(() => { location.hash = 'pods-1'; });
  await expect(box.locator('.exno')).toContainText('CKS');
});

test('baixa só os textos do idioma em uso; o outro só na troca (ADR-003)', async ({ page }) => {
  const got = [];
  page.on('request', r => { const m = /\/i18n\/(\w+)\.js$/.exec(r.url()); if (m) got.push(m[1]); });
  await open(page, 'pods-1', 'pt');
  await expect(page.locator('#title')).not.toBeEmpty();
  expect(got.sort()).toEqual(['labels', 'pt']);
  await page.locator('#langB').click();
  await page.locator('#langM button[data-l="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(got.sort()).toEqual(['en', 'labels', 'pt']);
  await expect(page.locator('#title')).toHaveText(/Pod/);
});

for (const [lang, path, title] of [['pt', 'licao/nodefail/', 'Quando um node cai'], ['en', 'en/lesson/nodefail/', 'When a node goes down']]) {
  test(`página estática da lição abre a versão interativa no idioma dela (${lang}, ADR-005)`, async ({ page }) => {
    await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.fulfill({ status: 200, body: '' }));
    await page.addInitScript(() => { try { localStorage.setItem('k8s-lang', 'xx'); } catch {} });
    await page.goto('/' + path);
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page.locator('section.st')).toHaveCount(12);
    await page.locator('a.cta').first().click();
    await expect(page).toHaveURL(/#nodefail-1$/);
    await expect(page.locator('#title')).toHaveText(title);
  });
}
