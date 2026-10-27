import fs from 'node:fs';
import path from 'node:path';

export interface CheatProfile {
  id: string;
  name: string;
  gameId: string;
  createdAt: string;
  updatedAt: string;
  states: Record<string, { enabled: boolean; value?: any }>;
}

export interface ProfileStoreData {
  profiles: Record<string, CheatProfile[]>; // gameId -> profiles list
  activeProfileId: Record<string, string>;  // gameId -> currently active profile id
}

export class ProfileManager {
  private static filePath = path.join(
    process.env.APPDATA || process.env.HOME || '.',
    'OpenTrainerEngine',
    'profiles.json'
  );

  private static currentData: ProfileStoreData = {
    profiles: {},
    activeProfileId: {}
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
      console.warn('Aviso: Não foi possível carregar profiles.json, usando padrão.', err);
    }

    this.initialized = true;
  }

  public static save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.currentData, null, 2), 'utf8');
    } catch (err) {
      console.error('Erro ao salvar perfis:', err);
    }
  }

  public static getProfiles(gameId: string): CheatProfile[] {
    this.ensureInitialized();
    return this.currentData.profiles[gameId] || [];
  }

  public static getActiveProfileId(gameId: string): string | undefined {
    this.ensureInitialized();
    return this.currentData.activeProfileId[gameId];
  }

  public static createProfile(
    gameId: string,
    name: string,
    states: Record<string, { enabled: boolean; value?: any }> = {}
  ): CheatProfile {
    this.ensureInitialized();
    if (!this.currentData.profiles[gameId]) {
      this.currentData.profiles[gameId] = [];
    }

    const id = `profile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newProfile: CheatProfile = {
      id,
      name,
      gameId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      states
    };

    this.currentData.profiles[gameId].push(newProfile);
    this.currentData.activeProfileId[gameId] = id;
    this.save();
    return newProfile;
  }

  public static updateProfile(
    gameId: string,
    profileId: string,
    states: Record<string, { enabled: boolean; value?: any }>
  ): CheatProfile | undefined {
    this.ensureInitialized();
    const list = this.currentData.profiles[gameId] || [];
    const prof = list.find(p => p.id === profileId);
    if (!prof) return undefined;

    prof.states = { ...prof.states, ...states };
    prof.updatedAt = new Date().toISOString();
    this.save();
    return prof;
  }

  public static applyProfile(gameId: string, profileId: string): CheatProfile | undefined {
    this.ensureInitialized();
    const list = this.currentData.profiles[gameId] || [];
    const prof = list.find(p => p.id === profileId);
    if (!prof) return undefined;

    this.currentData.activeProfileId[gameId] = profileId;
    this.save();
    return prof;
  }

  public static deleteProfile(gameId: string, profileId: string): boolean {
    this.ensureInitialized();
    const list = this.currentData.profiles[gameId] || [];
    const idx = list.findIndex(p => p.id === profileId);
    if (idx === -1) return false;

    list.splice(idx, 1);
    if (this.currentData.activeProfileId[gameId] === profileId) {
      delete this.currentData.activeProfileId[gameId];
    }
    this.save();
    return true;
  }

  /**
   * Reseta ou limpa cache em memória e arquivo para testes
   */
  public static _reset(): void {
    this.currentData = { profiles: {}, activeProfileId: {} };
    this.initialized = true; // evita recarregar dados antigos do disco durante testes
    try {
      if (fs.existsSync(this.filePath)) {
        fs.unlinkSync(this.filePath);
      }
    } catch {}
  }
}
