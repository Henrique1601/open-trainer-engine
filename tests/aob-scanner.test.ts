import { describe, it, expect } from 'vitest';
import { AOBScanner } from '../src/core/memory/aob-scanner.js';

describe('AOBScanner', () => {
  it('deve compilar padrão AOB com bytes exatos e wildcards', () => {
    const pattern = AOBScanner.compilePattern('48 89 5C 24 ?? 57 48');
    expect(pattern.bytes).toEqual([0x48, 0x89, 0x5C, 0x24, 0x00, 0x57, 0x48]);
    expect(pattern.mask).toEqual([true, true, true, true, false, true, true]);
  });

  it('deve lançar erro em tokens inválidos', () => {
    expect(() => AOBScanner.compilePattern('48 ZZ 5C')).toThrow();
  });

  it('deve encontrar ocorrência exata dentro de um Buffer', () => {
    const buffer = Buffer.from([0x90, 0x90, 0x48, 0x89, 0x5C, 0x24, 0x10, 0x57, 0xC3]);
    const pattern = AOBScanner.compilePattern('48 89 5C 24 10');

    const matches = AOBScanner.findInBytes(buffer, pattern);
    expect(matches).toEqual([2]);
  });

  it('deve encontrar ocorrência com wildcards (??)', () => {
    const buffer = Buffer.from([0x00, 0x89, 0x46, 0x24, 0xFF, 0xEE, 0xDD, 0x57]);
    const pattern = AOBScanner.compilePattern('89 46 24 ?? ?? ?? 57');

    const matches = AOBScanner.findInBytes(buffer, pattern);
    expect(matches).toEqual([1]);
  });

  it('deve retornar array vazio quando o padrão não existe no buffer', () => {
    const buffer = Buffer.from([0x01, 0x02, 0x03, 0x04]);
    const pattern = AOBScanner.compilePattern('AA BB CC');

    const matches = AOBScanner.findInBytes(buffer, pattern);
    expect(matches).toEqual([]);
  });
});
