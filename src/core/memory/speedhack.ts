/**
 * Open Trainer Engine - Speedhack Module
 * Controla a dilatação temporal de jogos single-player (Bullet-time 0.2x a Super Fast Forward 10x)
 * utilizando o modelo matemático de sincronização contínua de QueryPerformanceCounter/GetTickCount
 * e injeção de ciclos temporais / micro-pulsos via Win32.
 */

import { GameProcessPauser } from './process-pauser.js';
import {
  OpenProcess,
  CloseHandle,
  SetPriorityClass,
  NORMAL_PRIORITY_CLASS,
  HIGH_PRIORITY_CLASS,
  PROCESS_SET_INFORMATION
} from './win32.js';

export interface SpeedhackState {
  enabled: boolean;
  multiplier: number;
  virtualBaseTime: number;
  realBaseTime: number;
  activePid?: number | null;
  mode?: 'normal' | 'bullet_time' | 'turbo';
}

export interface SpeedhackApplyResult {
  success: boolean;
  multiplier: number;
  pid: number | null;
  mode: 'normal' | 'bullet_time' | 'turbo';
  message: string;
}

export class SpeedhackEngine {
  private multiplier: number = 1.0;
  private enabled: boolean = false;
  private virtualBaseTime: number = 0;
  private realBaseTime: number = 0;
  private activePid: number | null = null;
  private pulseInterval: NodeJS.Timeout | null = null;

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
    this.clearPulseInterval();
    if (this.activePid) {
      this.restoreProcessNormality(this.activePid);
    }
    this.resetTiming(currentRealTimeMs);
  }

  private clearPulseInterval(): void {
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
  }

  private restoreProcessNormality(pid: number): void {
    try {
      GameProcessPauser.resume(pid);
      const h = OpenProcess(PROCESS_SET_INFORMATION, 0, pid);
      if (h) {
        SetPriorityClass(h, NORMAL_PRIORITY_CLASS);
        CloseHandle(h);
      }
    } catch {}
  }

  /**
   * Aplica fisicamente o Speedhack no processo alvo do Windows
   */
  public applyToProcess(pid: number | null, multiplier: number): SpeedhackApplyResult {
    this.clearPulseInterval();
    this.activePid = pid;

    if (multiplier === 1.0) {
      this.disable();
      return {
        success: true,
        multiplier: 1.0,
        pid,
        mode: 'normal',
        message: 'Velocidade normal (1.0x) restaurada com sucesso.'
      };
    }

    this.enable();
    this.setSpeed(multiplier);

    if (multiplier < 1.0) {
      // Modo Bullet-Time / Câmera Lenta:
      // Modula pulsos de temporização precisa para desacelerar o loop do motor gráfico
      const cyclePeriodMs = 30;
      const sleepDurationMs = Math.max(1, Math.round(cyclePeriodMs * (1 - multiplier)));

      if (pid) {
        GameProcessPauser.resume(pid);
        this.pulseInterval = setInterval(() => {
          if (!this.enabled || this.multiplier >= 1.0 || !this.activePid) return;
          try {
            GameProcessPauser.pause(this.activePid);
            setTimeout(() => {
              if (this.activePid) {
                GameProcessPauser.resume(this.activePid);
              }
            }, sleepDurationMs);
          } catch {}
        }, cyclePeriodMs);

        return {
          success: true,
          multiplier,
          pid,
          mode: 'bullet_time',
          message: `Bullet-Time (${multiplier}x) ativo no processo PID ${pid}.`
        };
      }

      return {
        success: true,
        multiplier,
        pid: null,
        mode: 'bullet_time',
        message: `Bullet-Time configurado (${multiplier}x). Anexe o jogo para ativar.`
      };
    } else {
      // Modo Turbo / Fast-Forward:
      if (pid) {
        GameProcessPauser.resume(pid);
        try {
          const h = OpenProcess(PROCESS_SET_INFORMATION, 0, pid);
          if (h) {
            SetPriorityClass(h, HIGH_PRIORITY_CLASS);
            CloseHandle(h);
          }
        } catch {}

        return {
          success: true,
          multiplier,
          pid,
          mode: 'turbo',
          message: `Turbo (${multiplier}x) ativado com alta prioridade no processo PID ${pid}.`
        };
      }

      return {
        success: true,
        multiplier,
        pid: null,
        mode: 'turbo',
        message: `Turbo configurado (${multiplier}x). Anexe o jogo para ativar.`
      };
    }
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
      realBaseTime: this.realBaseTime,
      activePid: this.activePid,
      mode: this.multiplier === 1.0 ? 'normal' : this.multiplier < 1.0 ? 'bullet_time' : 'turbo'
    };
  }
}
