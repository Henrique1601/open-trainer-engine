import { describe, it, expect } from 'vitest';
import { GameMapsManager } from '../src/core/maps/game-maps.js';

describe('GameMapsManager', () => {
  it('deve listar mapas interativos disponíveis', () => {
    const maps = GameMapsManager.getAllMaps();
    expect(maps.length).toBeGreaterThan(0);

    const elden = GameMapsManager.getMapById('elden-ring');
    expect(elden).toBeDefined();
    expect(elden?.gameTitle).toBe('Elden Ring');
    expect(elden?.mapUrl).toContain('mapgenie.io');
  });
});
