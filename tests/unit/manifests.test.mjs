// Pré-checagem local dos YAMLs de exemplo (a validação completa por schema roda no CI com kubeconform, ADR-006).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSite } from '../tools/load.mjs';

const { FILES, FILEV } = loadSite(['js/term/files.js']).K8STERM_DATA;
const all = Object.entries({ base: FILES, ...FILEV }).flatMap(([g, f]) => Object.entries(f).map(([n, y]) => [`${g}/${n}`, y]));

test('todo YAML de exemplo tem apiVersion, kind e metadata.name', () => {
  assert.ok(all.length >= 28);
  for (const [name, y] of all) {
    assert.match(y, /^apiVersion: \S+/m, name);
    assert.match(y, /^kind: [A-Z]\w+/m, name);
    assert.match(y, /^metadata:\n(?: {2}.*\n)*? {2}name: \S+/m, name);
  }
});

test('nenhum YAML usa tabulação (YAML só aceita espaços)', () => {
  for (const [name, y] of all) assert.ok(!y.includes('\t'), name);
});
