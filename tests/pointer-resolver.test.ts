import { describe, it, expect } from 'vitest';
import { PointerResolver } from '../src/core/memory/pointer-resolver.js';

describe('PointerResolver', () => {
  it('deve converter corretamente strings hexadecimais e decimais para BigInt', () => {
    expect(PointerResolver.parseOffset('0x18')).toBe(24n);
    expect(PointerResolver.parseOffset('0X100')).toBe(256n);
    expect(PointerResolver.parseOffset(32)).toBe(32n);
    expect(PointerResolver.parseOffset(100n)).toBe(100n);
  });
});
