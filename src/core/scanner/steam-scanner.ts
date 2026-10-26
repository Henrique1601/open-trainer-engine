import fs from 'node:fs';
import path from 'node:path';

export interface SteamGame {
  appId: number;
  name: string;
  installDir: string;
  fullPath: string;
  buildId: string;
  executable?: string;
}

export class SteamScanner {
  /**
   * Obtém os caminhos padrão prováveis de instalação da Steam no Windows
   */
  public static getPossibleSteamPaths(): string[] {
    const paths: string[] = [];

    if (process.env['ProgramFiles(x86)']) {
      paths.push(path.join(process.env['ProgramFiles(x86)'], 'Steam'));
    }
    if (process.env.ProgramFiles) {
      paths.push(path.join(process.env.ProgramFiles, 'Steam'));
    }
    paths.push('C:\\Steam', 'D:\\Steam', 'E:\\Steam');

    return paths.filter(p => fs.existsSync(p));
  }

  /**
   * Faz o parse básico do arquivo VDF da Valve (como libraryfolders.vdf ou appmanifest_*.acf)
   */
  public static parseVdf(content: string): Record<string, any> {
    const lines = content.split(/\r?\n/);
    const root: Record<string, any> = {};
    const stack: Record<string, any>[] = [root];

    let currentKey = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('//')) continue;

      if (line === '{') {
        const newObj: Record<string, any> = {};
        const currentObj = stack[stack.length - 1];
        if (currentKey) {
          currentObj[currentKey] = newObj;
          stack.push(newObj);
          currentKey = '';
        }
      } else if (line === '}') {
        stack.pop();
      } else {
        const matches = line.match(/"([^"]+)"\s+"([^"]*)"/);
        if (matches) {
          const key = matches[1];
          const val = matches[2].replace(/\\\\/g, '\\');
          const currentObj = stack[stack.length - 1];
          currentObj[key] = val;
        } else {
          const singleMatch = line.match(/"([^"]+)"/);
          if (singleMatch) {
            currentKey = singleMatch[1];
          }
        }
      }
    }

    return root;
  }

  /**
   * Encontra todas as pastas de bibliotecas de jogos cadastradas na Steam
   */
  public static getLibraryFolders(steamRoot: string): string[] {
    const vdfPath = path.join(steamRoot, 'steamapps', 'libraryfolders.vdf');
    const libraries: string[] = [steamRoot];

    if (!fs.existsSync(vdfPath)) {
      return libraries;
    }

    try {
      const content = fs.readFileSync(vdfPath, 'utf8');
      const parsed = SteamScanner.parseVdf(content);
      const libraryFolders = parsed.libraryfolders || parsed;

      for (const key of Object.keys(libraryFolders)) {
        const entry = libraryFolders[key];
        if (entry && typeof entry === 'object' && entry.path) {
          if (!libraries.includes(entry.path) && fs.existsSync(entry.path)) {
            libraries.push(entry.path);
          }
        }
      }
    } catch {
      // Retorna ao menos a pasta raiz da Steam
    }

    return libraries;
  }

  /**
   * Varre todas as bibliotecas da Steam e retorna todos os jogos instalados
   */
  public static scanInstalledGames(): SteamGame[] {
    const steamPaths = SteamScanner.getPossibleSteamPaths();
    if (steamPaths.length === 0) return [];

    const games: SteamGame[] = [];
    const scannedLibs = new Set<string>();

    for (const steamRoot of steamPaths) {
      const libs = SteamScanner.getLibraryFolders(steamRoot);

      for (const lib of libs) {
        if (scannedLibs.has(lib.toLowerCase())) continue;
        scannedLibs.add(lib.toLowerCase());

        const steamAppsDir = path.join(lib, 'steamapps');
        if (!fs.existsSync(steamAppsDir)) continue;

        try {
          const files = fs.readdirSync(steamAppsDir);
          for (const file of files) {
            if (file.startsWith('appmanifest_') && file.endsWith('.acf')) {
              try {
                const manifestPath = path.join(steamAppsDir, file);
                const content = fs.readFileSync(manifestPath, 'utf8');
                const parsed = SteamScanner.parseVdf(content);
                const appState = parsed.AppState || parsed;

                const appId = parseInt(appState.appid, 10);
                const name = appState.name || `App ${appId}`;
                const installDir = appState.installdir;
                const buildId = appState.buildid || '0';

                // Ignora Steamworks Common Redistributables e ferramentas
                if (appId === 228980 || !installDir) continue;

                const fullPath = path.join(steamAppsDir, 'common', installDir);
                if (fs.existsSync(fullPath)) {
                  games.push({
                    appId,
                    name,
                    installDir,
                    fullPath,
                    buildId
                  });
                }
              } catch {
                // Ignora manifestos corrompidos
              }
            }
          }
        } catch {
          // Ignora erros de permissão em pastas
        }
      }
    }

    return games;
  }
}
