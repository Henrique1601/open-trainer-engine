import { describe, it, expect } from 'vitest';
import { DefaultCheatsProvider } from '../src/core/trainer/default-cheats-provider.js';
import { PreferencesStore } from '../src/core/storage/preferences-store.js';
import { SpeedhackEngine } from '../src/core/memory/speedhack.js';

describe('DefaultCheatsProvider (Arsenal Completo de Cheats Estilo WeMod)', () => {
  it('deve gerar cheats categorizados para qualquer jogo (God Mode, Aimbot, Dinheiro, XP, Teleport, etc)', () => {
    const cheats = DefaultCheatsProvider.getCheatsForGame('Cyberpunk 2077', 'Cyberpunk2077.exe');
    expect(cheats.length).toBeGreaterThanOrEqual(15);

    const ids = cheats.map(c => c.id);
    expect(ids).toContain('god_mode');
    expect(ids).toContain('aimbot_assist');
    expect(ids).toContain('infinite_currency');
    expect(ids).toContain('xp_multiplier');
    expect(ids).toContain('waypoint_teleport');
    expect(ids).toContain('noclip_flight');

    const categories = new Set(cheats.map(c => c.category));
    expect(categories.has('Jogador & Sobrevivência')).toBe(true);
    expect(categories.has('Combate & Armas')).toBe(true);
    expect(categories.has('Economia & Progresso')).toBe(true);
    expect(categories.has('Teletransporte & No-Clip')).toBe(true);
    expect(categories.has('Física & Manipulação de Tempo')).toBe(true);
  });

  it('deve adaptar cheats para jogos RPG e de Tiro', () => {
    const rpgCheats = DefaultCheatsProvider.getCheatsForGame('Elden Ring: Shadow of the Erdtree', 'eldenring.exe');
    const shooterCheats = DefaultCheatsProvider.getCheatsForGame('Counter-Strike 2', 'cs2.exe');

    const rpgCurrency = rpgCheats.find(c => c.id === 'infinite_currency');
    expect(rpgCurrency?.name).toMatch(/Ouro/i);

    const shooterAimbot = shooterCheats.find(c => c.id === 'aimbot_assist');
    expect(shooterAimbot?.name).toMatch(/Aimbot/i);
  });
});

describe('PreferencesStore (Temas & Cheats Customizados)', () => {
  it('deve gerenciar e persistir o tema visual da UI', () => {
    const currentTheme = PreferencesStore.getTheme();
    expect(typeof currentTheme).toBe('string');

    PreferencesStore.setTheme('cyberpunk');
    expect(PreferencesStore.getTheme()).toBe('cyberpunk');

    PreferencesStore.setTheme('obsidian');
    expect(PreferencesStore.getTheme()).toBe('obsidian');

    PreferencesStore.setTheme('wemod');
    expect(PreferencesStore.getTheme()).toBe('wemod');
  });

  it('deve permitir criar, listar e remover cheats customizados no launcher', () => {
    const testGame = 'custom-game-test-999';
    const newCheat = {
      id: 'custom_speed_boost',
      name: 'Super Aceleração 10x',
      category: 'Física & Manipulação de Tempo',
      type: 'toggle',
      hotkey: 'Ctrl+F9',
      isCustom: true
    };

    const cheatsAfterAdd = PreferencesStore.addCustomCheat(testGame, newCheat);
    expect(cheatsAfterAdd.some(c => c.id === 'custom_speed_boost')).toBe(true);

    const fetched = PreferencesStore.getCustomCheats(testGame);
    expect(fetched.length).toBeGreaterThanOrEqual(1);

    const cheatsAfterDelete = PreferencesStore.deleteCustomCheat(testGame, 'custom_speed_boost');
    expect(cheatsAfterDelete.some(c => c.id === 'custom_speed_boost')).toBe(false);
  });
});

describe('SpeedhackEngine (Controle e Aplicação no Processo)', () => {
  it('deve aplicar velocidade normal (1.0x) e desativar', () => {
    const speed = new SpeedhackEngine();
    const res = speed.applyToProcess(null, 1.0);
    expect(res.success).toBe(true);
    expect(res.multiplier).toBe(1.0);
    expect(res.mode).toBe('normal');
    expect(speed.isEnabled()).toBe(false);
  });

  it('deve aplicar modo Bullet-Time (< 1.0x)', () => {
    const speed = new SpeedhackEngine();
    const res = speed.applyToProcess(null, 0.5);
    expect(res.success).toBe(true);
    expect(res.multiplier).toBe(0.5);
    expect(res.mode).toBe('bullet_time');
    expect(speed.isEnabled()).toBe(true);
    speed.disable();
  });

  it('deve aplicar modo Turbo (> 1.0x)', () => {
    const speed = new SpeedhackEngine();
    const res = speed.applyToProcess(null, 2.0);
    expect(res.success).toBe(true);
    expect(res.multiplier).toBe(2.0);
    expect(res.mode).toBe('turbo');
    expect(speed.isEnabled()).toBe(true);
    speed.disable();
  });
});
