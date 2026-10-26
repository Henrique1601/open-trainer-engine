import { describe, it, expect } from 'vitest';
import { PreferencesStore } from '../src/core/storage/preferences-store.js';

describe('PreferencesStore', () => {
  it('deve formatar corretamente horas e minutos de mods', () => {
    expect(PreferencesStore.formatPlaytime(45)).toBe('45s');
    expect(PreferencesStore.formatPlaytime(180)).toBe('3m');
    expect(PreferencesStore.formatPlaytime(3660)).toBe('1h 1m');
    expect(PreferencesStore.formatPlaytime(7200)).toBe('2h 0m');
  });

  it('deve alternar favoritos corretamente', () => {
    const isNowFav = PreferencesStore.toggleFavorite('test-game-123');
    expect(PreferencesStore.isFavorite('test-game-123')).toBe(isNowFav);

    const reverted = PreferencesStore.toggleFavorite('test-game-123');
    expect(reverted).toBe(!isNowFav);
    expect(PreferencesStore.isFavorite('test-game-123')).toBe(false);
  });

  it('deve persistir e resgatar estados de cheats', () => {
    PreferencesStore.saveCheatState('test-game', 'god_mode', true, 100);
    const saved = PreferencesStore.getSavedCheatStates('test-game');
    expect(saved['god_mode']).toBeDefined();
    expect(saved['god_mode'].enabled).toBe(true);
    expect(saved['god_mode'].value).toBe(100);
  });
});
