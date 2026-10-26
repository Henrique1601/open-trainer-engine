import { describe, it, expect } from 'vitest';
import { AppUpdater } from '../src/core/updater/app-updater.js';

describe('AppUpdater', () => {
  it('deve comparar versões semânticas corretamente', () => {
    // 0.2.0 > 0.1.0 -> 1 (update disponível)
    expect(AppUpdater.compareVersions('0.1.0', '0.2.0')).toBe(1);
    expect(AppUpdater.compareVersions('v0.1.0', 'v1.0.0')).toBe(1);
    expect(AppUpdater.compareVersions('0.1.5', '0.1.6')).toBe(1);

    // Iguais -> 0
    expect(AppUpdater.compareVersions('0.1.0', '0.1.0')).toBe(0);
    expect(AppUpdater.compareVersions('v1.0.0', '1.0.0')).toBe(0);

    // 0.1.0 < 0.2.0 (versão remota é mais antiga) -> -1
    expect(AppUpdater.compareVersions('0.2.0', '0.1.0')).toBe(-1);
  });
});
