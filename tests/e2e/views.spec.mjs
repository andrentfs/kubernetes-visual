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

// Regressão (relato de 28/11/2026): abas presas em lições com dica de uma prova só.
const exam = page => page.locator('#exam');
const pressed = page => exam(page).locator('button[aria-pressed="true"]');
for (const id of ['cluster', 'nodefail']) {
  test(`“Na prova” em ${id}-1: abre na CKA e as abas CKAD/CKS respondem`, async ({ page }) => {
    const errors = await open(page, `${id}-1`, 'pt');
    await expect(pressed(page)).toHaveText('CKA');
    await expect(exam(page).locator('ul li').first()).toBeVisible();
    await exam(page).locator('button[data-x="ckad"]').click();
    await expect(pressed(page)).toHaveText('CKAD');
    await expect(exam(page).locator('.exno')).toHaveText('Esta lição não tem dicas específicas para a CKAD. Há dicas em: CKA.');
    await exam(page).locator('button[data-x="cks"]').click();
    await expect(pressed(page)).toHaveText('CKS');
    await expect(exam(page).locator('.exno')).toContainText('CKS');
    await page.keyboard.press('ArrowRight');                       // outro passo da mesma lição: mantém a escolha
    await expect(page).toHaveURL(new RegExp(`#${id}-2$`));
    await expect(pressed(page)).toHaveText('CKS');
    await exam(page).locator('button[data-x="cka"]').click();
    await expect(pressed(page)).toHaveText('CKA');
    await expect(exam(page).locator('ul li').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('módulo 06: as 5 lições têm a caixa com dicas CKS, e CKA/CKAD mostram “sem dicas”', async ({ page }) => {
  const errors = await open(page, 'hardening-1', 'pt');
  for (const id of ['hardening', 'sistema', 'isolamento', 'supply', 'runtime']) {
    await page.evaluate(h => { location.hash = h; }, `${id}-1`);
    await expect(exam(page)).toBeVisible();
    await expect(pressed(page)).toHaveText('CKS');
    await expect(exam(page).locator('ul li').first()).toBeVisible();
  }
  await exam(page).locator('button[data-x="cka"]').click();
  await expect(pressed(page)).toHaveText('CKA');
  await expect(exam(page).locator('.exno')).toHaveText('Esta lição não tem dicas específicas para a CKA. Há dicas em: CKS.');
  expect(errors).toEqual([]);
});

test('escolha da prova persiste entre lições e após recarregar; idioma inglês', async ({ page }) => {
  await open(page, 'pods-1', 'en');
  await exam(page).locator('button[data-x="ckad"]').click();
  await page.evaluate(() => { location.hash = 'storage-1'; });
  await expect(pressed(page)).toHaveText('CKAD');
  await page.reload();
  await expect(pressed(page)).toHaveText('CKAD');
  await page.evaluate(() => { location.hash = 'cluster-1'; });           // só CKA: abre nela sem perder a escolha salva
  await expect(pressed(page)).toHaveText('CKA');
  await exam(page).locator('button[data-x="ckad"]').click();
  await expect(exam(page).locator('.exno')).toHaveText('This lesson has no specific CKAD tips. Tips available for: CKA.');
  await page.evaluate(() => { location.hash = 'tudo-1'; });
  await expect(pressed(page)).toHaveText('CKAD');
  await exam(page).locator('button[data-x="cka"]').click();
  await expect(exam(page).locator('ul li').first()).toContainText('The CKA is hands-on');
});

test('todas as lições, PT e EN: caixa “Na prova” só onde há dicas e as 3 abas respondem', async ({ page }) => {
  test.setTimeout(120000);
  for (const lang of ['pt', 'en']) {
    const errors = await open(page, 'intro-1', lang);
    const lessons = await page.evaluate(() => L.map(l => ({ id: l.id, tips: { cka: !!l.exam, ckad: !!l.examD, cks: !!l.examS } })));
    expect(lessons).toHaveLength(27);
    for (const { id, tips } of lessons) {
      await page.evaluate(h => { location.hash = h; }, `${id}-1`);
      await expect(page.locator('#title')).not.toBeEmpty();
      const any = tips.cka || tips.ckad || tips.cks;
      if (!any) { await expect(exam(page), `${lang} ${id}`).toBeHidden(); continue; }
      await expect(exam(page), `${lang} ${id}`).toBeVisible();
      for (const k of ['ckad', 'cks', 'cka']) {
        await exam(page).locator(`button[data-x="${k}"]`).click();
        await expect(pressed(page), `${lang} ${id} ${k}`).toHaveText(k.toUpperCase());
        await expect(exam(page).locator(tips[k] ? 'ul li' : '.exno').first(), `${lang} ${id} ${k}`).toBeVisible();
      }
    }
    expect(errors, lang).toEqual([]);
  }
});
