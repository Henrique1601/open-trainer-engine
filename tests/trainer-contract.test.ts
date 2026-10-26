import { describe, it, expect } from 'vitest';
import { TrainerLoader } from '../src/core/trainer/trainer-loader.js';
import { TrainerContract } from '../src/core/trainer/trainer-contract.js';

describe('TrainerLoader & Contracts', () => {
  it('deve validar com sucesso um contrato de trainer correto', () => {
    const validContract: TrainerContract = {
      id: 'hades-2',
      title: 'Hades II',
      processName: 'Hades2.exe',
      version: '1.0.0',
      cheats: [
        {
          id: 'god_mode',
          name: 'Modo Deus',
          category: 'Jogador',
          type: 'aob_patch',
          pattern: '89 46 24 ?? ??',
          replace: '90 90 90 90 90'
        }
      ]
    };

    expect(() => TrainerLoader.validateContract(validContract)).not.toThrow();
  });

  it('deve rejeitar contrato com campos obrigatórios ausentes', () => {
    const invalid: any = {
      id: 'test'
    };
    expect(() => TrainerLoader.validateContract(invalid)).toThrow();
  });

  it('deve rejeitar cheat AOB sem replace ou pattern', () => {
    const invalidAob: any = {
      id: 'test',
      title: 'Test Game',
      processName: 'Test.exe',
      version: '1.0',
      cheats: [
        {
          id: 'c1',
          name: 'Cheat 1',
          category: 'Main',
          type: 'aob_patch',
          pattern: '90 90'
        }
      ]
    };
    expect(() => TrainerLoader.validateContract(invalidAob)).toThrow();
  });
});
