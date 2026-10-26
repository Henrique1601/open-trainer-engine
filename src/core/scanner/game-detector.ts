import fs from 'node:fs';
import path from 'node:path';
import { SteamScanner } from './steam-scanner.js';
import { EpicScanner } from './epic-scanner.js';

export type GamePlatform = 'steam' | 'epic' | 'gog' | 'xbox' | 'standalone';

export interface DetectedGame {
  id: string;
  title: string;
  platform: GamePlatform;
  installPath: string;
  executableName?: string;
  versionOrBuild?: string;
}

export class GameDetector {
  /**
   * Tenta encontrar o executável principal dentro de uma pasta de jogo
   */
  public static findPrimaryExecutable(dir: string): string | undefined {
    if (!fs.existsSync(dir)) return undefined;

    try {
      const files = fs.readdirSync(dir);
      // Prioriza .exe que não sejam instaladores ou crash reporters
      const exes = files.filter(f => {
        const lower = f.toLowerCase();
        return (
          lower.endsWith('.exe') &&
          !lower.includes('crash') &&
          !lower.includes('report') &&
          !lower.includes('unitycrash') &&
          !lower.includes('unins') &&
          !lower.includes('setup') &&
          !lower.includes('launcher')
        );
      });

      if (exes.length > 0) {
        return exes[0];
      }

      // Se não encontrou na raiz, checa subpastas imediatas comuns (ex: bin/x64, etc)
      for (const sub of ['bin', 'binaries/win64', 'game', 'x64']) {
        const subPath = path.join(dir, sub);
        if (fs.existsSync(subPath)) {
          const subExes = fs.readdirSync(subPath).filter(f => f.toLowerCase().endsWith('.exe'));
          if (subExes.length > 0) return subExes[0];
        }
      }
    } catch {
      // Ignora erro de leitura
    }

    return undefined;
  }

  /**
   * Varre todas as plataformas suportadas no computador e retorna a biblioteca completa
   */
  public static scanAll(): DetectedGame[] {
    const detected: DetectedGame[] = [];

    // 1. Steam
    try {
      const steamGames = SteamScanner.scanInstalledGames();
      for (const sg of steamGames) {
        const exe = GameDetector.findPrimaryExecutable(sg.fullPath);
        detected.push({
          id: `steam-${sg.appId}`,
          title: sg.name,
          platform: 'steam',
          installPath: sg.fullPath,
          executableName: exe,
          versionOrBuild: sg.buildId
        });
      }
    } catch (err) {
      console.warn('Erro ao varrer Steam:', err);
    }

    // 2. Epic Games
    try {
      const epicGames = EpicScanner.scanInstalledGames();
      for (const eg of epicGames) {
        const exe = eg.launchExecutable || GameDetector.findPrimaryExecutable(eg.installLocation);
        detected.push({
          id: `epic-${eg.appName}`,
          title: eg.displayName,
          platform: 'epic',
          installPath: eg.installLocation,
          executableName: exe
        });
      }
    } catch (err) {
      console.warn('Erro ao varrer Epic Games:', err);
    }

    return detected;
  }

  /**
   * Procura um jogo na biblioteca pelo nome do executável
   */
  public static findByExecutable(executableName: string): DetectedGame | undefined {
    const list = this.scanAll();
    const target = executableName.toLowerCase();
    return list.find(g => g.executableName?.toLowerCase() === target);
  }
}
