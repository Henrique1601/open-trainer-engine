import { describe, it, expect } from 'vitest';
import { AutoHealer } from '../src/core/updater/auto-healer.js';
import fs from 'node:fs';
import path from 'node:path';

describe('AutoHealer', () => {
  it('deve relaxar assinaturas AOB progressivamente nos níveis 1, 2 e 3', () => {
    const pattern = '48 89 5C 24 08 57 48 83 EC 20 48 8B D9';

    // Nível 1: Remove bytes periféricos
    const level1 = AutoHealer.relaxPattern(pattern, 1);
    expect(level1.length).toBeGreaterThan(0);
    expect(level1[0]).toBe('5C 24 08 57 48 83 EC 20 48');

    // Nível 2: Neutraliza offsets relativos
    const level2 = AutoHealer.relaxPattern(pattern, 2);
    expect(level2.length).toBeGreaterThan(0);

    // Nível 3: Janela central do opcode
    const level3 = AutoHealer.relaxPattern(pattern, 3);
    expect(level3.length).toBeGreaterThan(0);
  });

  it('deve calcular hash SHA-256 de arquivo executável corretamente', () => {
    const tmp = path.resolve('tmp_hash_test.bin');
    fs.writeFileSync(tmp, Buffer.from('test executable content'));
    try {
      const hash = AutoHealer.calculateExecutableHash(tmp);
      expect(hash).toHaveLength(64);
    } finally {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    }
  });
});
