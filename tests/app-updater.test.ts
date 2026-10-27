import { describe, it, expect, vi } from 'vitest';
import { AppUpdater } from '../src/core/updater/app-updater.js';
import fs from 'node:fs';
import path from 'node:path';

describe('AppUpdater (In-App Auto-Update & Comparison)', () => {
  it('deve comparar corretamente versões semânticas', () => {
    expect(AppUpdater.compareVersions('0.2.0', '0.3.0')).toBe(1);  // 0.3.0 é mais nova
    expect(AppUpdater.compareVersions('0.3.0', '0.3.0')).toBe(0);  // iguais
    expect(AppUpdater.compareVersions('0.3.0', '0.2.0')).toBe(-1); // 0.2.0 é mais antiga
    expect(AppUpdater.compareVersions('v0.2.0', '0.3.0')).toBe(1); // suporta prefixo v
    expect(AppUpdater.compareVersions('0.3.0', 'v1.0.0')).toBe(1); // major release
  });

  it('deve obter a versão atual a partir do ambiente ou package.json', () => {
    const v = AppUpdater.getCurrentVersion();
    expect(v).toBeDefined();
    expect(typeof v).toBe('string');
    expect(v).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('deve disparar erro claro ao tentar instalar arquivo inexistente', () => {
    expect(() => {
      AppUpdater.installAndRestart('C:\\caminho\\inexistente\\setup.exe', true);
    }).toThrow('Instalador não encontrado');
  });
});
