import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

describe('UI Script Syntax & Event Handler Integrity', () => {
  const indexHtmlPath = path.resolve('src/desktop/ui/index.html');

  it('deve compilar o script de index.html com ZERO erros sintáticos', () => {
    const html = fs.readFileSync(indexHtmlPath, 'utf8');
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(scriptMatch).toBeTruthy();

    const code = scriptMatch![1];
    expect(() => {
      new vm.Script(code, { filename: 'index.html.js' });
    }).not.toThrow();
  });

  it('deve garantir que todos os manipuladores onclick do HTML estejam definidos no script', () => {
    const html = fs.readFileSync(indexHtmlPath, 'utf8');
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    const code = scriptMatch![1];

    const onclickRegex = /onclick="([a-zA-Z0-9_]+)\s*\(/g;
    let match: RegExpExecArray | null;
    const handlers = new Set<string>();

    while ((match = onclickRegex.exec(html)) !== null) {
      if (match[1] !== 'alert') {
        handlers.add(match[1]);
      }
    }

    expect(handlers.size).toBeGreaterThan(15);

    for (const h of handlers) {
      const funcRegex = new RegExp('(function\\s+' + h + '|const\\s+' + h + '|let\\s+' + h + '|var\\s+' + h + '|' + h + '\\s*=)', 'm');
      const isDefined = funcRegex.test(code);
      expect(isDefined, `Handler ${h} deve estar definido no <script> de index.html`).toBe(true);
    }
  });
});
