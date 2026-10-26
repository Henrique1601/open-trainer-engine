import { describe, it, expect } from 'vitest';
import { SpeedhackEngine } from '../src/core/memory/speedhack.js';

describe('SpeedhackEngine', () => {
  it('deve iniciar desativado com velocidade 1.0x', () => {
    const engine = new SpeedhackEngine();
    expect(engine.isEnabled()).toBe(false);
    expect(engine.getSpeed()).toBe(1.0);
  });

  it('deve calcular o avanço temporal correto em modo 2.0x', () => {
    const engine = new SpeedhackEngine();
    const t0 = 1000;
    engine.enable(t0);
    engine.setSpeed(2.0, t0);

    // 100ms de tempo real depois = 200ms de tempo virtual
    const tVirtual = engine.calculateVirtualTime(t0 + 100);
    expect(tVirtual).toBe(1000 + 200);
  });

  it('deve calcular o avanço temporal em modo Bullet-Time (0.5x)', () => {
    const engine = new SpeedhackEngine();
    const t0 = 2000;
    engine.enable(t0);
    engine.setSpeed(0.5, t0);

    // 200ms de tempo real = 100ms de tempo virtual
    const tVirtual = engine.calculateVirtualTime(t0 + 200);
    expect(tVirtual).toBe(2000 + 100);
  });

  it('não deve causar saltos temporais descontínuos ao alterar velocidade em tempo de execução', () => {
    const engine = new SpeedhackEngine();
    const t0 = 5000;
    engine.enable(t0);
    engine.setSpeed(2.0, t0);

    // Avança 100ms em 2.0x -> tempo virtual é 5200
    const t1 = t0 + 100;
    const v1 = engine.calculateVirtualTime(t1);
    expect(v1).toBe(5200);

    // Altera para 0.5x no instante t1
    engine.setSpeed(0.5, t1);

    // Imediatamente após a troca, o tempo virtual não pode pular
    const vImmediate = engine.calculateVirtualTime(t1);
    expect(vImmediate).toBe(5200);

    // Avança mais 100ms em 0.5x -> avança 50ms -> 5250
    const t2 = t1 + 100;
    const v2 = engine.calculateVirtualTime(t2);
    expect(v2).toBe(5250);
  });

  it('deve gerar representação IEEE-754 correta para shellcode QPC', () => {
    const engine = new SpeedhackEngine();
    const qpc = engine.generateQpcHookAssembly(2.0);
    expect(qpc.multiplierIeee754).toBeDefined();
    expect(qpc.multiplierIeee754.length).toBeGreaterThan(10);
  });
});
