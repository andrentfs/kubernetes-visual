// Carrega os scripts do site (que definem globais em window) num contexto isolado do Node.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

export const ROOT = resolve(import.meta.dirname, '..', '..');

export function loadSite(files) {
  const window = {};
  const ctx = vm.createContext({ window, console, setTimeout, clearTimeout, atob, btoa, matchMedia: () => ({ matches: true }) });
  for (const f of files) vm.runInContext(readFileSync(resolve(ROOT, f), 'utf8'), ctx, { filename: f });
  return window;
}
