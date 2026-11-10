import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { DetectedGame, GamePlatform } from './game-detector.js';

export interface GameArtwork {
  coverImage: string;
  heroImage: string;
  fallbackCover: string;
  iconUrl?: string;
}

export interface PlatformTheme {
  badgeText: string;
  color: string;
  bgGradient: string;
  icon: string;
}

export class GameArtResolver {
  private static cacheFile = path.join(
    process.env.APPDATA || process.env.HOME || '.',
    'OpenTrainerEngine',
    'game-art-cache.json'
  );

  private static cache: Record<string, GameArtwork> = {};
  private static isInitialized = false;

  private static ensureCacheLoaded(): void {
    if (this.isInitialized) return;
    try {
      if (fs.existsSync(this.cacheFile)) {
        const raw = fs.readFileSync(this.cacheFile, 'utf8');
        this.cache = JSON.parse(raw);
      }
    } catch {
      this.cache = {};
    }
    this.isInitialized = true;
  }

  private static saveCache(): void {
    try {
      const dir = path.dirname(this.cacheFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2), 'utf8');
    } catch {}
  }

  /**
   * Retorna os links diretos oficiais da Steam CDN para capas e banners em alta definição
   */
  public static getSteamArtwork(appId: number | string): GameArtwork {
    const id = String(appId).replace(/^steam-/i, '');
    return {
      coverImage: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/library_600x900_2x.jpg`,
      fallbackCover: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`,
      heroImage: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`,
      iconUrl: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`
    };
  }

  /**
   * Limpa o nome do jogo para busca pública (removendo tags de lojas, edições e símbolos)
   */
  public static cleanTitleForSearch(title: string): string {
    let clean = title;

    // Tratamento específico de pacotes da Microsoft Store / Xbox Game Pass (ex: DevolverDigital.DiscRoomWin10)
    if (clean.includes('.')) {
      const parts = clean.split('.');
      clean = parts[parts.length - 1]; // pega a última parte ex: "DiscRoomWin10"
      clean = clean.replace(/Win10$/i, '');
      clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2');
    }

    // Remove caracteres especiais de marca
    clean = clean.replace(/[®™©]/g, '');

    // Remove subtítulos de edições comuns que atrapalham a busca na loja
    clean = clean.replace(/:\s*Complete Edition/i, '');
    clean = clean.replace(/:\s*Enhanced Edition/i, '');
    clean = clean.replace(/\s+Enhanced$/i, '');
    clean = clean.replace(/\s+GOTY$/i, '');
    clean = clean.replace(/\s+Edition$/i, '');

    return clean.trim();
  }

  /**
   * Consulta a API oficial pública da Steam Store para encontrar o AppId de jogos de outras lojas (Epic/Xbox/GOG)
   */
  public static searchSteamAppId(cleanTitle: string): Promise<number | null> {
    return new Promise((resolve) => {
      const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(cleanTitle)}&l=english&cc=US`;

      const req = https.get(url, { headers: { 'User-Agent': 'OpenTrainerEngine-ArtResolver' }, timeout: 4000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json && json.items && json.items.length > 0) {
              resolve(json.items[0].id);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    });
  }

  /**
   * Retorna cores e dados visuais característicos de cada plataforma
   */
  public static getPlatformTheme(platform: GamePlatform): PlatformTheme {
    switch (platform) {
      case 'steam':
        return {
          badgeText: 'STEAM',
          color: '#66c0f4',
          bgGradient: 'linear-gradient(135deg, #171a21 0%, #1b2838 100%)',
          icon: '🎮'
        };
      case 'epic':
        return {
          badgeText: 'EPIC',
          color: '#ffffff',
          bgGradient: 'linear-gradient(135deg, #121212 0%, #202020 100%)',
          icon: '⚡'
        };
      case 'xbox':
        return {
          badgeText: 'XBOX',
          color: '#107c10',
          bgGradient: 'linear-gradient(135deg, #0e1e12 0%, #107c10 100%)',
          icon: '🟢'
        };
      case 'gog':
        return {
          badgeText: 'GOG',
          color: '#a048ff',
          bgGradient: 'linear-gradient(135deg, #1e102e 0%, #4b1b77 100%)',
          icon: '🟣'
        };
      default:
        return {
          badgeText: 'PC',
          color: '#58a6ff',
          bgGradient: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
          icon: '💻'
        };
    }
  }

  /**
   * Enriquece um jogo detectado com URLs oficiais de capas e banners em alta definição
   */
  public static enrichGame(game: DetectedGame): DetectedGame {
    this.ensureCacheLoaded();

    // 1. Se for Steam, temos o AppId exato imediato
    if (game.platform === 'steam' || game.id.startsWith('steam-')) {
      const appId = game.id.replace(/^steam-/i, '');
      const art = this.getSteamArtwork(appId);
      return {
        ...game,
        coverImage: art.coverImage,
        heroImage: art.heroImage
      };
    }

    // 2. Verifica se já temos a capa salva no cache local
    if (this.cache[game.id]) {
      const cached = this.cache[game.id];
      return {
        ...game,
        coverImage: cached.coverImage,
        heroImage: cached.heroImage,
        iconUrl: cached.iconUrl
      };
    }

    // 3. Fallback inteligente com gradiente e metadados
    return {
      ...game,
      coverImage: game.coverImage,
      heroImage: game.heroImage
    };
  }

  /**
   * Resolve assincronamente a arte de jogos de outras lojas (Epic / Xbox / GOG) buscando na loja oficial
   */
  public static async resolveAndCacheArt(game: DetectedGame): Promise<DetectedGame> {
    this.ensureCacheLoaded();

    if (game.platform === 'steam' || game.id.startsWith('steam-')) {
      return this.enrichGame(game);
    }

    if (this.cache[game.id]) {
      return this.enrichGame(game);
    }

    try {
      const cleanTitle = this.cleanTitleForSearch(game.title);
      const matchedAppId = await this.searchSteamAppId(cleanTitle);

      if (matchedAppId) {
        const art = this.getSteamArtwork(matchedAppId);
        this.cache[game.id] = art;
        this.saveCache();
        return {
          ...game,
          coverImage: art.coverImage,
          heroImage: art.heroImage
        };
      }
    } catch {}

    return this.enrichGame(game);
  }

  /**
   * Enriquece uma lista inteira de jogos
   */
  public static enrichAll(games: DetectedGame[]): DetectedGame[] {
    return games.map(g => this.enrichGame(g));
  }
}
