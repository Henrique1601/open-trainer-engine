import { describe, it, expect } from 'vitest';
import { AntiCheatDetector } from '../src/core/security/anti-cheat-detector.js';

describe('AntiCheatDetector (Safe Guard)', () => {
  it('deve retornar safe: true quando nenhum anti-cheat estiver ativo', () => {
    const runningProcesses = ['chrome.exe', 'steam.exe', 'eldenring.exe', 'discord.exe'];
    const result = AntiCheatDetector.isSafeToInject('eldenring.exe', runningProcesses);

    expect(result.safe).toBe(true);
    expect(result.detectedAntiCheats).toHaveLength(0);
    expect(result.reason).toBeUndefined();
  });

  it('deve bloquear e alertar quando EasyAntiCheat estiver rodando', () => {
    const runningProcesses = ['chrome.exe', 'EasyAntiCheat.exe', 'game.exe'];
    const result = AntiCheatDetector.isSafeToInject('game.exe', runningProcesses);

    expect(result.safe).toBe(false);
    expect(result.detectedAntiCheats).toContain('Easy Anti-Cheat (Epic Games)');
    expect(result.reason).toContain('Injeção bloqueada por segurança');
  });

  it('deve bloquear quando BattlEye ou Riot Vanguard forem detectados', () => {
    const runningProcesses = ['BEService.exe', 'vgc.exe', 'shooter.exe'];
    const check = AntiCheatDetector.checkRunningProcesses(runningProcesses);

    expect(check.detected).toBe(true);
    expect(check.blocked).toBe(true);
    expect(check.matches).toHaveLength(2);
  });

  it('deve permitir bypass explícito caso o usuário force a injeção em ambiente de teste local', () => {
    const runningProcesses = ['easyanticheat.exe', 'game.exe'];
    const result = AntiCheatDetector.isSafeToInject('game.exe', runningProcesses, true);

    expect(result.safe).toBe(true);
    expect(result.detectedAntiCheats).toContain('Easy Anti-Cheat (Epic Games)');
  });
});
