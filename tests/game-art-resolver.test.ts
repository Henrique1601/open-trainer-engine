import { describe, it, expect } from 'vitest';
import { GameArtResolver } from '../src/core/scanner/game-art-resolver.js';
import { DetectedGame } from '../src/core/scanner/game-detector.js';

describe('GameArtResolver (WeMod Real Game Covers & Icons)', () => {
  it('deve gerar URLs oficiais da Steam CDN para capa e hero', () => {
    const art = GameArtResolver.getSteamArtwork(1091500);
    expect(art.coverImage).toContain('steamstatic.com/store_item_assets/steam/apps/1091500/library_600x900_2x.jpg');
    expect(art.heroImage).toContain('steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg');
    expect(art.fallbackCover).toContain('steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg');
  });

  it('deve limpar títulos com sufixos de edição e caracteres especiais para busca', () => {
    expect(GameArtResolver.cleanTitleForSearch('RollerCoaster Tycoon® 3: Complete Edition')).toBe('RollerCoaster Tycoon 3');
    expect(GameArtResolver.cleanTitleForSearch('Grand Theft Auto V Enhanced')).toBe('Grand Theft Auto V');
    expect(GameArtResolver.cleanTitleForSearch('DevolverDigital.DiscRoomWin10')).toBe('Disc Room');
    expect(GameArtResolver.cleanTitleForSearch('MotionTwin.DeadCellsWin10')).toBe('Dead Cells');
  });

  it('deve enriquecer jogos da Steam com capas reais instantaneamente', () => {
    const steamGame: DetectedGame = {
      id: 'steam-1794680',
      title: 'Vampire Survivors',
      platform: 'steam',
      installPath: 'D:\\SteamLibrary\\steamapps\\common\\Vampire Survivors',
      executableName: 'VampireSurvivors.exe'
    };

    const enriched = GameArtResolver.enrichGame(steamGame);
    expect(enriched.coverImage).toBeDefined();
    expect(enriched.coverImage).toContain('1794680');
    expect(enriched.heroImage).toBeDefined();
    expect(enriched.heroImage).toContain('1794680');
  });

  it('deve retornar estilo e cores personalizadas por plataforma', () => {
    const steamStyle = GameArtResolver.getPlatformTheme('steam');
    expect(steamStyle.badgeText).toBe('STEAM');
    expect(steamStyle.color).toContain('#');

    const epicStyle = GameArtResolver.getPlatformTheme('epic');
    expect(epicStyle.badgeText).toBe('EPIC');

    const xboxStyle = GameArtResolver.getPlatformTheme('xbox');
    expect(xboxStyle.badgeText).toBe('XBOX');
  });
});
