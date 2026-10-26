import fs from 'node:fs';
import path from 'node:path';

export interface GamePlaytimeStats {
  totalSeconds: number;
  lastPlayed: string;
  sessionsCount: number;
}

export interface GamePreferences {
  favorites: string[]; // Lista de IDs de jogos favoritos
  modStates: Record<string, Record<string, { enabled: boolean; value?: any }>>; // Estado salvo dos cheats por jogo
  playtime: Record<string, GamePlaytimeStats>; // Estatísticas precisas de horas de mods
  autoRestoreMods: boolean; // Se deve restaurar automaticamente os mods ao abrir o jogo
}

export class PreferencesStore {
  private static filePath = path.join(
    process.env.APPDATA || process.env.HOME || '.',
    'OpenTrainerEngine',
    'preferences.json'
  );

  private static currentData: GamePreferences = {
    favorites: [],
    modStates: {},
    playtime: {},
    autoRestoreMods: true
  };

  private static initialized = false;

  private static ensureInitialized(): void {
    if (this.initialized) return;

    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.currentData = { ...this.currentData, ...JSON.parse(raw) };
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('Aviso: Não foi possível carregar preferences.json, usando padrão.', err);
    }

    this.initialized = true;
  }

  public static get(): GamePreferences {
    this.ensureInitialized();
    return this.currentData;
  }

  public static save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.currentData, null, 2), 'utf8');
    } catch (err) {
      console.error('Erro ao salvar preferências:', err);
    }
  }

  // ============================================================================
  // Favoritos
  // ============================================================================
  public static isFavorite(gameId: string): boolean {
    this.ensureInitialized();
    return this.currentData.favorites.includes(gameId);
  }

  public static toggleFavorite(gameId: string): boolean {
    this.ensureInitialized();
    const idx = this.currentData.favorites.indexOf(gameId);
    let state = false;
    if (idx === -1) {
      this.currentData.favorites.push(gameId);
      state = true;
    } else {
      this.currentData.favorites.splice(idx, 1);
      state = false;
    }
    this.save();
    return state;
  }

  // ============================================================================
  // Salvar e Restaurar Estados dos Mods
  // ============================================================================
  public static saveCheatState(gameId: string, cheatId: string, enabled: boolean, value?: any): void {
    this.ensureInitialized();
    if (!this.currentData.modStates[gameId]) {
      this.currentData.modStates[gameId] = {};
    }
    this.currentData.modStates[gameId][cheatId] = { enabled, value };
    this.save();
  }

  public static getSavedCheatStates(gameId: string): Record<string, { enabled: boolean; value?: any }> {
    this.ensureInitialized();
    return this.currentData.modStates[gameId] || {};
  }

  // ============================================================================
  // Rastreamento Preciso de Tempo de Uso dos Mods
  // ============================================================================
  public static addPlaytime(gameId: string, seconds: number): GamePlaytimeStats {
    this.ensureInitialized();
    if (!this.currentData.playtime[gameId]) {
      this.currentData.playtime[gameId] = {
        totalSeconds: 0,
        lastPlayed: new Date().toISOString(),
        sessionsCount: 0
      };
    }

    const stat = this.currentData.playtime[gameId];
    stat.totalSeconds += seconds;
    stat.lastPlayed = new Date().toISOString();
    this.save();
    return stat;
  }

  public static recordSessionStart(gameId: string): void {
    this.ensureInitialized();
    if (!this.currentData.playtime[gameId]) {
      this.currentData.playtime[gameId] = {
        totalSeconds: 0,
        lastPlayed: new Date().toISOString(),
        sessionsCount: 0
      };
    }
    this.currentData.playtime[gameId].sessionsCount++;
    this.currentData.playtime[gameId].lastPlayed = new Date().toISOString();
    this.save();
  }

  public static formatPlaytime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours === 0 && minutes === 0) {
      return `${totalSeconds}s`;
    }
    if (hours === 0) {
      return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  }
}
