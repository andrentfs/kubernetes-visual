// Utilitários compartilhados dos testes E2E.
// Testes herméticos: nada sai para a internet. A JetBrains Mono (Google Fonts no site) é servida
// do pacote @fontsource/jetbrains-mono, para que as medidas de layout usem a mesma fonte do usuário
// (com a fonte de reserva, o cabeçalho cabia no teste e sobrepunha no Mac). Outras requisições: vazias.
import { readFileSync } from 'node:fs';
const FD = 'node_modules/@fontsource/jetbrains-mono/files/';
const WEIGHTS = [400, 500, 700, 800];
const FONT_CSS = WEIGHTS.map(w => `@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:${w};font-display:block;src:url(https://fonts.gstatic.com/kv/${w}.woff2) format('woff2')}`).join('');
export async function hermetic(page) {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => {
    const u = r.request().url();
    if (u.startsWith('https://fonts.googleapis.com/css')) return r.fulfill({ status: 200, contentType: 'text/css', body: FONT_CSS });
    const m = u.match(/fonts\.gstatic\.com\/kv\/(\d+)\.woff2/);
    if (m) return r.fulfill({ status: 200, contentType: 'font/woff2', body: readFileSync(`${FD}jetbrains-mono-latin-${m[1]}-normal.woff2`) });
    return r.fulfill({ status: 200, body: '' });
  });
}
export async function open(page, hash = 'intro-1', lang = 'pt') {
  await hermetic(page);
  await page.addInitScript(l => { try { localStorage.setItem('k8s-lang', l); } catch {} }, lang);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`/#${hash}`);
  await page.waitForFunction(() => window.__dbg && window.K8STERM);
  await page.evaluate(() => document.fonts.ready);
  return errors;
}
export const allSteps = page => page.evaluate(() => window.__dbg.L().flatMap(l => l.steps.map((_, i) => `${l.id}-${i + 1}`)));
export async function go(page, hash) {
  await page.evaluate(h => { location.hash = h; }, hash);
  await page.waitForFunction(h => location.hash === '#' + h, hash);
}
