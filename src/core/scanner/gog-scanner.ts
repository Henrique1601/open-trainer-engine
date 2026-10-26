import fs from 'node:fs';
import path from 'node:path';
import { DetectedGame } from './game-detector.js';

export interface GogGameInfo {
  gameId: string;
  name: string;
  rootGameId?: string;
  playTasks?: {
    isPrimary?: boolean;
    path?: string;
    type?: string;
  }[];
}

export class GogScanner {
  public static readonly DEFAULT_GOG_PATHS = [
    'C:\\GOG Games',
    'D:\\GOG Games',
    'E:\\GOG Games',
    'C:\\Program Files (x86)\\GOG Galaxy\\Games',
    'D:\\Program Files (x86)\\GOG Galaxy\\Games'
  ];

  /**
   * Faz o parse do arquivo de manifesto goggame-*.info (JSON)
   */
  public static parseGogGameInfo(jsonContent: string, gameDirectory: string): DetectedGame | null {
    try {
      const data: GogGameInfo = JSON.parse(jsonContent);
      if (!data.gameId || !data.name) return null;

      let executableName: string | undefined;
      if (Array.isArray(data.playTasks)) {
        const primary = data.playTasks.find(t => t.isPrimary && t.path) || data.playTasks.find(t => t.path);
        if (primary && primary.path) {
          executableName = path.basename(primary.path);
        }
      }

      return {
        id: `gog-${data.gameId}`,
        title: data.name,
        installPath: gameDirectory,
        executableName,
        platform: 'gog'
      };
    } catch {
      return null;
    }
  }

  /**
   * Varre os diretórios padrão do GOG Galaxy em busca de jogos instalados
   */
  public static scanInstalledGames(customPaths?: string[]): DetectedGame[] {
    const searchDirs = customPaths || this.DEFAULT_GOG_PATHS;
    const detected: DetectedGame[] = [];

    for (const baseDir of searchDirs) {
      if (!fs.existsSync(baseDir)) continue;

      try {
        const entries = fs.readdirSync(baseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;

          const gameDir = path.join(baseDir, entry.name);
          try {
            const files = fs.readdirSync(gameDir);
            const infoFile = files.find(f => f.startsWith('goggame-') && f.endsWith('.info'));

            if (infoFile) {
              const fullInfoPath = path.join(gameDir, infoFile);
              const content = fs.readFileSync(fullInfoPath, 'utf-8');
              const game = this.parseGogGameInfo(content, gameDir);
              if (game) {
                detected.push(game);
              }
            }
          } catch {
            // Ignora pastas sem permissão
          }
        }
      } catch {
        // Ignora diretório inacessível
      }
    }

    return detected;
  }
}
