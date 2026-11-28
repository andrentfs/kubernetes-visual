// Navegação entre Aprender, CKA e CKAD; tema e idioma.
import { test, expect } from '@playwright/test';
import { open, hermetic } from './helpers.mjs';

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
  await expect(page.locator('#title')).not.toBeEmpty();           // lição carregada antes da tecla
  await expect(page.locator('#stepT, .step h2').first()).toBeVisible();
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
    await hermetic(page);
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

// Revisão de layout (28/11/2026): sem rolagem lateral nem texto estourando caixas, do tablet à tela 2560.
for (const [w, h] of [[1024, 768], [1280, 720], [1366, 768], [1920, 1080], [2560, 1440]]) {
  test(`layout ${w}×${h}: sem rolagem lateral; textos longos quebram dentro das caixas`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const errors = await open(page, 'hardening-5', 'pt');                 // tem “authentication.anonymous.enabled:”
    for (const hash of ['hardening-5', 'sim/nodefail', 'quiz', 'cks']) {
      await page.evaluate(x => { location.hash = x; }, hash);
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const de = document.documentElement;
        const vis = e => e.offsetParent !== null && getComputedStyle(e).visibility !== 'hidden';
        const over = [...document.querySelectorAll('.panel *, .exam *, #cert *')]
          .filter(e => !(e instanceof SVGElement) && vis(e) && getComputedStyle(e).overflowX === 'visible' && e.scrollWidth > e.clientWidth + 6)
          .map(e => (e.textContent || '').trim().slice(0, 40));
        return { hs: de.scrollWidth > de.clientWidth, over };
      });
      expect(r.hs, `${hash}: rolagem lateral`).toBe(false);
      expect(r.over, `${hash}: texto estourando`).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}

test('menu recolhido fica na frente do conteúdo (dicas visíveis)', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.addInitScript(() => { try { localStorage.setItem('k8s-side', '0'); } catch {} });
  await open(page, 'hardening-5', 'pt');
  await expect(page.locator('#rail')).toBeVisible();
  expect(await page.locator('#rail').evaluate(e => +getComputedStyle(e).zIndex)).toBeGreaterThan(0);
});

// Revisão de layout 2 (relato de 28/11/2026, Mac): "Lição X de 27" passava por baixo do botão de idioma.
// Medido com a JetBrains Mono real (servida localmente pelo helper), não com a fonte de reserva.
const barHits = page => page.evaluate(() => {
  const kids = [...document.querySelector('.bar').children].filter(e => e.offsetParent && getComputedStyle(e).display !== 'none');
  const out = [], n = e => e.id || e.className;
  for (let i = 0; i < kids.length; i++) {
    const a = kids[i].getBoundingClientRect();
    if (a.right > innerWidth + 1) out.push('fora da tela: ' + n(kids[i]));
    if (!kids[i].matches('.search') && kids[i].scrollWidth > kids[i].clientWidth + 6) out.push('texto estourando: ' + n(kids[i]));
    for (let j = i + 1; j < kids.length; j++) {
      const c = kids[j].getBoundingClientRect();
      if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) out.push(n(kids[i]) + ' × ' + n(kids[j]));
    }
  }
  return out;
});
for (const lang of ['pt', 'en']) {
  test(`cabeçalho sem sobreposição em 14 larguras (${lang})`, async ({ page }) => {
    await open(page, 'porque-1', lang);
    for (const w of [360, 420, 560, 600, 700, 760, 1024, 1240, 1286, 1366, 1470, 1512, 1600, 1728]) {
      await page.setViewportSize({ width: w, height: 800 });
      expect(await barHits(page), `largura ${w}`).toEqual([]);
    }
  });
}

test('diagrama encolhe em janelas baixas para a lição caber sem rolar', async ({ page }) => {
  await open(page, 'porque-1', 'pt');
  for (const [w, h] of [[1286, 701], [1366, 768], [1440, 789], [1512, 860]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    const b = await page.locator('.stage').evaluate(e => e.getBoundingClientRect().bottom);
    expect(b, `${w}×${h}`).toBeLessThanOrEqual(h + 8);
  }
});

test('tela cheia mostra o texto do passo, navega, oculta com T e devolve o cartão ao sair', async ({ page }) => {
  const errors = await open(page, 'probes-3', 'pt');
  await page.locator('#full').click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('dia');
  const side = page.locator('#fsside');
  await expect(side.locator('.step h2')).toHaveText(/Probe/);
  await expect(side.locator('#next')).toBeVisible();
  await expect(page.locator('#full')).toBeVisible();                 // controles não ficam sob o painel
  await side.locator('#next').click();
  await expect(page).toHaveURL(/#probes-4$/);
  await expect(side.locator('.step .sh')).toContainText('4 / 11');
  await page.keyboard.press('t');
  await expect(side.locator('.step')).toBeHidden();
  await expect(page.locator('#fsTog')).toHaveText('Mostrar o texto');
  await page.keyboard.press('t');
  await expect(side.locator('.step')).toBeVisible();
  await page.evaluate(() => document.exitFullscreen());
  await expect(page.locator('.panel > .step')).toHaveCount(1);
  await expect(page.locator('#fsside .step')).toHaveCount(0);
  expect(errors).toEqual([]);
});
