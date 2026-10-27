import { describe, it, expect, beforeEach } from 'vitest';
import { ProfileManager } from '../src/core/storage/profile-manager.js';
import { GameLauncher } from '../src/core/scanner/game-launcher.js';
import { DetectedGame } from '../src/core/scanner/game-detector.js';

describe('ProfileManager (WeMod Cheat Profiles)', () => {
  beforeEach(() => {
    ProfileManager._reset();
  });

  it('deve criar um novo perfil e defini-lo como ativo', () => {
    const profile = ProfileManager.createProfile('game-witcher3', 'God Mode Build', {
      'cheat-godmode': { enabled: true },
      'cheat-infinite-money': { enabled: true, value: 999999 }
    });

    expect(profile.name).toBe('God Mode Build');
    expect(profile.states['cheat-godmode'].enabled).toBe(true);

    const activeId = ProfileManager.getActiveProfileId('game-witcher3');
    expect(activeId).toBe(profile.id);

    const list = ProfileManager.getProfiles('game-witcher3');
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(profile.id);
  });

  it('deve atualizar o estado de cheats em um perfil existente', () => {
    const p1 = ProfileManager.createProfile('game-eldenring', 'Casual Run', {
      'cheat-hp': { enabled: false }
    });

    const updated = ProfileManager.updateProfile('game-eldenring', p1.id, {
      'cheat-hp': { enabled: true }
    });

    expect(updated).toBeDefined();
    expect(updated?.states['cheat-hp'].enabled).toBe(true);
  });

  it('deve alternar entre múltiplos perfis e deletar perfis', () => {
    const p1 = ProfileManager.createProfile('game-cyberpunk', 'Stealth Mode');
    const p2 = ProfileManager.createProfile('game-cyberpunk', 'Rambo Mode');

    expect(ProfileManager.getActiveProfileId('game-cyberpunk')).toBe(p2.id);

    ProfileManager.applyProfile('game-cyberpunk', p1.id);
    expect(ProfileManager.getActiveProfileId('game-cyberpunk')).toBe(p1.id);

    const deleted = ProfileManager.deleteProfile('game-cyberpunk', p1.id);
    expect(deleted).toBe(true);
    expect(ProfileManager.getProfiles('game-cyberpunk').length).toBe(1);
    expect(ProfileManager.getActiveProfileId('game-cyberpunk')).toBeUndefined();
  });
});

describe('GameLauncher (WeMod 1-Click Play)', () => {
  it('deve gerar comando URI correto para jogos da Steam', () => {
    const steamGame: DetectedGame = {
      id: 'steam-1091500',
      title: 'Cyberpunk 2077',
      platform: 'steam',
      installPath: 'C:\\Games\\Cyberpunk 2077',
      executableName: 'Cyberpunk2077.exe'
    };

    const cmd = GameLauncher.getLaunchCommand(steamGame);
    expect(cmd.type).toBe('uri');
    expect(cmd.command).toContain('steam://rungameid/1091500');
  });

  it('deve gerar comando URI correto para jogos da Epic Games', () => {
    const epicGame: DetectedGame = {
      id: 'epic-Sugar',
      title: 'GTA V',
      platform: 'epic',
      installPath: 'C:\\Games\\GTAV',
      executableName: 'GTA5.exe'
    };

    const cmd = GameLauncher.getLaunchCommand(epicGame);
    expect(cmd.type).toBe('uri');
    expect(cmd.command).toContain('com.epicgames.launcher://apps/Sugar?action=launch');
  });

  it('deve gerar comando executável direto ou URI para GOG', () => {
    const gogGame: DetectedGame = {
      id: 'gog-1207658924',
      title: 'The Witcher 3: Wild Hunt',
      platform: 'gog',
      installPath: 'C:\\Games\\The Witcher 3',
      executableName: 'witcher3.exe'
    };

    const cmd = GameLauncher.getLaunchCommand(gogGame);
    // Se não existir arquivo físico no disco de teste, usa fallback URI do Galaxy
    expect(cmd.command).toMatch(/goggalaxy|witcher3\.exe/);
  });
});
