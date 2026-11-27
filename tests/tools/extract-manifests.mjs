// Extrai os YAMLs de exemplo do terminal (js/term/files.js) para arquivos, um por manifesto,
// para o kubeconform validar contra o schema da versão de referência (ADR-006).
// Uso: node tests/tools/extract-manifests.mjs [pasta-de-saída]   (padrão: build/manifests)
//      node tests/tools/extract-manifests.mjs --k8s-version      → imprime a versão de referência (ex.: 1.37.0)
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { loadSite, ROOT } from './load.mjs';

if (process.argv[2] === '--k8s-version') {
  console.log(loadSite(['data/meta.js']).K8S_REF.patch.replace(/^v/, ''));
  process.exit(0);
}
const out = resolve(ROOT, process.argv[2] || 'build/manifests');
const { FILES, FILEV } = loadSite(['js/term/files.js']).K8STERM_DATA;

const all = { base: FILES, ...FILEV };
rmSync(out, { recursive: true, force: true });
let n = 0;
for (const [group, files] of Object.entries(all)) {
  for (const [name, yaml] of Object.entries(files)) {
    if (!/^apiVersion:/m.test(yaml) || !/^kind:/m.test(yaml)) throw new Error(`${group}/${name}: sem apiVersion ou kind`);
    const dir = join(out, group);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, name), yaml.endsWith('\n') ? yaml : yaml + '\n');
    n++;
  }
}
console.log(`✓ ${n} manifestos extraídos para ${out}`);
