// Gera docs/quiz-references.md com todos os links de documentação usados nas questões dos simulados.
// O job "links" do CI (lychee) verifica os .md, então um link quebrado numa questão quebra o CI.
//   node scripts/gen-quiz-refs.mjs          → grava o arquivo
//   node scripts/gen-quiz-refs.mjs --check  → confere se está atualizado
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadSite, ROOT } from '../tests/tools/load.mjs';

export const FILE = 'docs/quiz-references.md';
export function build() {
  const { K8SQUIZ } = loadSite(['data/quiz/kcna.js', 'data/quiz/kcsa.js']);
  let md = '# Simulados: referências das questões\n\nArquivo gerado por `scripts/gen-quiz-refs.mjs` a partir de `data/quiz/*.js`. Não edite à mão.\nO job `links` do CI verifica cada endereço.\n';
  for (const id of ['kcna', 'kcsa']) {
    const Q = K8SQUIZ[id];
    md += `\n## ${Q.name}\n\n- Currículo: <${Q.source}>\n`;
    for (const q of Q.q) md += `- ${q.id}: ${q.ref ? `<${q.ref}>` : 'sem link (conceito geral)'}\n`;
  }
  return md;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const md = build(), p = resolve(ROOT, FILE);
  if (process.argv.includes('--check')) {
    if (!existsSync(p) || readFileSync(p, 'utf8') !== md) { console.error(`✗ ${FILE} desatualizado. Rode: node scripts/gen-quiz-refs.mjs`); process.exit(1); }
    console.log(`✓ ${FILE} atualizado`);
  } else { writeFileSync(p, md); console.log(`✓ ${FILE} gravado`); }
}
