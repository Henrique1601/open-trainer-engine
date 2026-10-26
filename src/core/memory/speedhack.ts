/**
 * Open Trainer Engine - Speedhack Module
 * Controla a dilatação temporal de jogos single-player (Bullet-time 0.2x a Super Fast Forward 10x)
 * utilizando o modelo matemático de sincronização contínua de QueryPerformanceCounter/GetTickCount.
 */

export interface SpeedhackState {
  enabled: boolean;
  multiplier: number;
  virtualBaseTime: number;
  realBaseTime: number;
}

export class SpeedhackEngine {
  private multiplier: number = 1.0;
  private enabled: boolean = false;
  private virtualBaseTime: number = 0;
  private realBaseTime: number = 0;

  constructor() {
    this.resetTiming(Date.now());
  }

  /**
   * Reseta as bases de sincronização de tempo
   */
  public resetTiming(currentRealTimeMs: number): void {
    this.realBaseTime = currentRealTimeMs;
    this.virtualBaseTime = currentRealTimeMs;
  }

  /**
   * Define o multiplicador de velocidade (ex: 0.5 = 50% lento, 2.0 = 200% rápido)
   */
  public setSpeed(multiplier: number, currentRealTimeMs: number = Date.now()): void {
    if (multiplier <= 0) {
      throw new Error('O multiplicador de velocidade deve ser estritamente positivo (> 0).');
    }

    // Calcula o tempo virtual atual antes de trocar o multiplicador para evitar saltos temporais
    if (this.enabled) {
      this.virtualBaseTime = this.calculateVirtualTime(currentRealTimeMs);
    } else {
      this.virtualBaseTime = currentRealTimeMs;
    }

    this.realBaseTime = currentRealTimeMs;
    this.multiplier = Math.min(Math.max(multiplier, 0.1), 20.0);
  }

  public getSpeed(): number {
    return this.multiplier;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public enable(currentRealTimeMs: number = Date.now()): void {
    this.resetTiming(currentRealTimeMs);
    this.enabled = true;
  }

  public disable(currentRealTimeMs: number = Date.now()): void {
    this.enabled = false;
    this.resetTiming(currentRealTimeMs);
  }

  /**
   * Calcula o tempo virtual contínuo baseado no multiplicador ativo
   * Formula: T_virtual = Base_virtual + (T_real - Base_real) * Multiplier
   */
  public calculateVirtualTime(currentRealTimeMs: number): number {
    if (!this.enabled || this.multiplier === 1.0) {
      return currentRealTimeMs;
    }
    const delta = currentRealTimeMs - this.realBaseTime;
    return this.virtualBaseTime + (delta * this.multiplier);
  }

  /**
   * Gera o shellcode de trampolim para hook de QueryPerformanceCounter em processos x86_64
   */
  public generateQpcHookAssembly(multiplier: number): {
    multiplierIeee754: string;
    description: string;
  } {
    const buf = Buffer.alloc(8);
    buf.writeDoubleLE(multiplier);
    const hex = buf.toString('hex').match(/../g)?.join(' ') || '';

    return {
      multiplierIeee754: hex,
      description: `Hook de QueryPerformanceCounter x64 com escala de ponto flutuante (${multiplier}x)`
    };
  }

  public getState(): SpeedhackState {
    return {
      enabled: this.enabled,
      multiplier: this.multiplier,
      virtualBaseTime: this.virtualBaseTime,
      realBaseTime: this.realBaseTime
    };
  }
}
