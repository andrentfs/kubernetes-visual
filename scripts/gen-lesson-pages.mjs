// Gera uma página estática por lição e idioma, com título, descrição e Open Graph próprios (ADR-005),
// e o sitemap com as alternativas de idioma (hreflang). As páginas trazem o texto da lição em HTML
// e um botão para a versão interativa (#lição-1). Saída versionada no repositório.
//
//   node scripts/gen-lesson-pages.mjs          → grava licao/, en/lesson/ e sitemap.xml
//   node scripts/gen-lesson-pages.mjs --check  → só confere se o que está no disco está atualizado
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { loadSite, ROOT } from '../tests/tools/load.mjs';

export const BASE = 'https://andrentfs.github.io/kubernetes-visual/';
const DATE = '2026-11-27';
const PATH = { pt: id => `licao/${id}/`, en: id => `en/lesson/${id}/` };
const UP = { pt: '../../', en: '../../../' };
const STR = {
  pt: { htmlLang: 'pt-BR', og: 'pt_BR', ogAlt: 'en_US', open: 'Abrir a lição interativa', course: 'Kubernetes Visual', home: 'Curso', goals: 'Você vai aprender', steps: 'Passo a passo', step: 'Passo', min: 'min', prev: 'Lição anterior', next: 'Próxima lição', other: 'English version', exam: 'Na prova', note: 'Esta é a versão em texto. A lição interativa tem o diagrama animado de cada passo.', key: 'Ideia-chave', good: 'Bom saber', warn: 'Atenção', desc: 'Lição do curso visual e interativo de Kubernetes.' },
  en: { htmlLang: 'en', og: 'en_US', ogAlt: 'pt_BR', open: 'Open the interactive lesson', course: 'Kubernetes Visual', home: 'Course', goals: 'You will learn', steps: 'Step by step', step: 'Step', min: 'min', prev: 'Previous lesson', next: 'Next lesson', other: 'Versão em português', exam: 'On the exam', note: 'This is the text version. The interactive lesson has the animated diagram for each step.', key: 'Key idea', good: 'Good to know', warn: 'Watch out', desc: 'Lesson from the visual, interactive Kubernetes course.' },
};
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function data() {
  const w = loadSite(['data/scenes.js', 'i18n/labels.js', 'i18n/pt.js', 'i18n/en.js']);
  const S = w.buildScenes(new Proxy({}, { get: () => () => [0, 0] }));
  return { order: w.LESSON_ORDER, S, TXT: w.TXT };
}

function page(lang, id, i, { order, S, TXT }) {
  const T = TXT[lang], L = T.les[id], sc = S[id], s = STR[lang], other = lang === 'pt' ? 'en' : 'pt';
  const url = BASE + PATH[lang](id), altUrl = BASE + PATH[other](id);
  const title = `${L.t} — ${s.course}`;
  const desc = `${L.lede} ${s.desc}`.trim();
  const app = `${UP[lang]}?lang=${lang}#${id}-1`;
  const nav = (k, label) => k >= 0 && k < order.length ? `<a href="${UP[lang]}${PATH[lang](order[k])}" rel="${k < i ? 'prev' : 'next'}">${label}: ${esc(T.les[order[k]].t)}</a>` : '';
  const ld = { '@context': 'https://schema.org', '@type': 'LearningResource', name: L.t, description: L.lede, url, inLanguage: s.htmlLang, isAccessibleForFree: true, timeRequired: `PT${sc.min}M`, educationalLevel: T.lv[sc.lvl], learningResourceType: 'Lesson', isPartOf: { '@type': 'Course', name: 'Kubernetes Visual', url: BASE } };
  const steps = L.steps.map((st, k) => `<section class="st"><h3><span>${s.step} ${k + 1} · ${esc(T.kinds[sc.steps[k].k] || '')}</span>${esc(st.h)}</h3>
${(st.p || []).map(p => `<p>${esc(p)}</p>`).join('\n')}
${['key', 'good', 'warn'].filter(f => st[f]).map(f => `<p class="nt ${f}"><b>${s[f]}:</b> ${esc(st[f])}</p>`).join('\n')}${st.tbl ? `\n<table><thead><tr>${st.tbl.h.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${st.tbl.r.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}${sc.steps[k].cmd ? `\n<pre><code>${esc(sc.steps[k].cmd)}</code></pre>` : ''}</section>`).join('\n');
  return `<!DOCTYPE html>
<html lang="${s.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="André Luiz">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="${STR.pt.htmlLang}" href="${BASE + PATH.pt(id)}">
<link rel="alternate" hreflang="${STR.en.htmlLang}" href="${BASE + PATH.en(id)}">
<link rel="alternate" hreflang="x-default" href="${BASE}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Kubernetes Visual">
<meta property="og:title" content="${esc(L.t)}">
<meta property="og:description" content="${esc(L.lede)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${BASE}assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${s.og}">
<meta property="og:locale:alternate" content="${s.ogAlt}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(L.t)}">
<meta name="twitter:description" content="${esc(L.lede)}">
<meta name="twitter:image" content="${BASE}assets/og-image.png">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
body{margin:0;background:#f3ede4;color:#211e1b;font:16px/1.6 ui-monospace,"JetBrains Mono",Menlo,Consolas,monospace}
main{max-width:46rem;margin:0 auto;padding:1.5rem 1.2rem 4rem}
a{color:#1d4ed8}.bc{font-size:.85rem;color:#6b6259}.bc a{color:inherit}
h1{font-size:1.9rem;line-height:1.2;margin:.4rem 0}.lede{color:#4a433c}
.chips span{display:inline-block;border:1.5px solid #211e1b;border-radius:99px;padding:.05rem .6rem;margin:0 .3rem .3rem 0;font-size:.8rem;background:#fffaf3}
.cta{display:inline-block;margin:1rem 0;padding:.7rem 1.1rem;background:#cfe7b9;color:#211e1b;border:2px solid #211e1b;border-radius:10px;box-shadow:3px 3px 0 #211e1b;text-decoration:none;font-weight:700}
.st{background:#fffaf3;border:1.5px solid #d9cfc2;border-radius:12px;padding:.4rem 1rem;margin:.8rem 0}
.st h3 span{display:block;font-size:.75rem;color:#6b6259;font-weight:400}
.nt{border-left:4px solid #9bc47a;padding-left:.7rem}.nt.warn{border-color:#e6a23c}.nt.key{border-color:#8b7bd8}
pre{background:#211e1b;color:#f3ede4;padding:.6rem .8rem;border-radius:8px;overflow:auto;white-space:pre-wrap}
table{border-collapse:collapse;width:100%;margin:.5rem 0}th,td{border:1px solid #d9cfc2;padding:.3rem .5rem;text-align:left}
nav.pn{display:flex;flex-direction:column;gap:.4rem;margin-top:2rem}small{color:#6b6259}
</style>
</head>
<body>
<main>
<p class="bc"><a href="${UP[lang]}?lang=${lang}">${s.course}</a> / ${esc(T.mods[sc.mod])} · <a href="${UP[lang]}${PATH[other](id)}" hreflang="${STR[other].htmlLang}">${s.other}</a></p>
<h1>${esc(L.t)}</h1>
<p class="lede">${esc(L.lede)}</p>
<p class="chips"><span>${sc.min} ${s.min}</span><span>${esc(T.lv[sc.lvl])}</span><span>${L.steps.length} ${lang === 'pt' ? 'passos' : 'steps'}</span></p>
<a class="cta" href="${app}">▶ ${s.open}</a>
<p><small>${s.note}</small></p>
<h2>${s.goals}</h2>
<ul>${(L.goals || []).map(g => `<li>${esc(g[0])}</li>`).join('')}</ul>
<h2>${s.steps}</h2>
${steps}
<a class="cta" href="${app}">▶ ${s.open}</a>
<nav class="pn">${nav(i - 1, s.prev)}${nav(i + 1, s.next)}</nav>
</main>
</body>
</html>
`;
}

export function build() {
  const d = data(), out = {};
  d.order.forEach((id, i) => { for (const lang of ['pt', 'en']) out[PATH[lang](id) + 'index.html'] = page(lang, id, i, d); });
  const alt = id => ['pt', 'en'].map(l => `    <xhtml:link rel="alternate" hreflang="${STR[l].htmlLang}" href="${BASE + PATH[l](id)}"/>`).join('\n');
  out['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${BASE}</loc>
    <lastmod>${DATE}</lastmod>
    <changefreq>weekly</changefreq>
  </url>
${d.order.flatMap(id => ['pt', 'en'].map(l => `  <url>
    <loc>${BASE + PATH[l](id)}</loc>
    <lastmod>${DATE}</lastmod>
${alt(id)}
  </url>`)).join('\n')}
</urlset>
`;
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = build(), check = process.argv.includes('--check');
  const stale = Object.entries(files).filter(([p, c]) => !existsSync(resolve(ROOT, p)) || readFileSync(resolve(ROOT, p), 'utf8') !== c).map(([p]) => p);
  if (check) {
    if (stale.length) { console.error(`✗ ${stale.length} arquivo(s) desatualizado(s). Rode: node scripts/gen-lesson-pages.mjs\n  ${stale.slice(0, 5).join('\n  ')}`); process.exit(1); }
    console.log(`✓ ${Object.keys(files).length - 1} páginas de lição e sitemap atualizados`);
  } else {
    for (const d of ['licao', 'en']) rmSync(resolve(ROOT, d), { recursive: true, force: true });
    for (const [p, c] of Object.entries(files)) { mkdirSync(dirname(resolve(ROOT, p)), { recursive: true }); writeFileSync(resolve(ROOT, p), c); }
    console.log(`✓ ${Object.keys(files).length - 1} páginas de lição + sitemap.xml gravados`);
  }
}
