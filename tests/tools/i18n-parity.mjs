// Confere a paridade PT-BR × EN-US: mesmas chaves, mesmas lições, mesmos passos e campos.
import { loadSite } from './load.mjs';

const w = loadSite(['i18n/pt.js', 'i18n/en.js']);
const pt = w.TXT.pt, en = w.TXT.en;
const errors = [];
const keys = o => Object.keys(o || {}).sort();
const diff = (a, b) => a.filter(k => !b.includes(k));

for (const sec of ['ui', 'lbl', 'kinds', 'lv']) {
  const a = keys(pt[sec]), b = keys(en[sec]);
  diff(a, b).forEach(k => errors.push(`${sec}.${k}: falta em EN`));
  diff(b, a).forEach(k => errors.push(`${sec}.${k}: falta em PT`));
}
if ((pt.mods || []).length !== (en.mods || []).length) errors.push('mods: quantidade diferente');

const lessons = [...new Set([...keys(pt.les), ...keys(en.les)])];
for (const id of lessons) {
  const a = pt.les[id], b = en.les[id];
  if (!a || !b) { errors.push(`les.${id}: falta em ${a ? 'EN' : 'PT'}`); continue; }
  if (a.steps.length !== b.steps.length) errors.push(`les.${id}: ${a.steps.length} passos em PT, ${b.steps.length} em EN`);
  if ((a.ml || []).length !== (b.ml || []).length) errors.push(`les.${id}.ml: tamanho diferente`);
  if (!!a.exam !== !!b.exam) errors.push(`les.${id}.exam: só em um idioma`);
  for (const ex of ['exam', 'examD', 'examS']) if (a[ex] && b[ex] && (a[ex].t.length !== b[ex].t.length || (a[ex].c || []).length !== (b[ex].c || []).length)) errors.push(`les.${id}.${ex}: itens diferentes`);
  for (const ex of ['examD', 'examS']) if (!!a[ex] !== !!b[ex]) errors.push(`les.${id}.${ex}: só em um idioma`);
  a.steps.forEach((s, i) => {
    const t = b.steps[i]; if (!t) return;
    const fa = keys(s).filter(k => s[k] != null), fb = keys(t).filter(k => t[k] != null);
    if (fa.join() !== fb.join()) errors.push(`les.${id}[${i + 1}]: campos PT=${fa} EN=${fb}`);
    if ((s.p || []).length !== (t.p || []).length) errors.push(`les.${id}[${i + 1}].p: parágrafos ${s.p.length}×${t.p.length}`);
    if ((s.m || []).length !== (t.m || []).length) errors.push(`les.${id}[${i + 1}].m: métricas diferentes`);
  });
  const ca = (pt.cap || {})[id], cb = (en.cap || {})[id];
  if ((ca || []).length !== (cb || []).length) errors.push(`cap.${id}: legendas ${ca?.length}×${cb?.length}`);
}

const total = lessons.reduce((n, id) => n + (pt.les[id]?.steps.length || 0), 0);
if (errors.length) { console.error(`✗ Paridade PT/EN: ${errors.length} problema(s)\n  ` + errors.join('\n  ')); process.exit(1); }
console.log(`✓ Paridade PT/EN: ${lessons.length} lições, ${total} passos em cada idioma`);
