import { describe, it, expect } from 'vitest';
import { MemoryScannerStudio } from '../src/core/studio/memory-scanner-studio.js';

describe('MemoryScannerStudio', () => {
  it('deve gerar contrato de trainer estruturado corretamente', () => {
    const contract = MemoryScannerStudio.createTrainerContract(
      'elden-ring',
      'Elden Ring',
      'eldenring.exe',
      [
        {
          id: 'inf_runes',
          name: 'Runas Infinitas',
          category: 'Recursos',
          type: 'pointer_freeze',
          baseModule: 'eldenring.exe',
          pointerChain: ['0x042A10', '0x28'],
          value: 9999999
        }
      ]
    );

    expect(contract.id).toBe('elden-ring');
    expect(contract.title).toBe('Elden Ring');
    expect(contract.processName).toBe('eldenring.exe');
    expect(contract.cheats).toHaveLength(1);
    expect(contract.cheats[0].name).toBe('Runas Infinitas');
  });
});
