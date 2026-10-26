import fs from 'node:fs';
import path from 'node:path';

export interface EpicGame {
  appName: string;
  displayName: string;
  installLocation: string;
  launchExecutable: string;
  catalogItemId: string;
  catalogNamespace: string;
}

export class EpicScanner {
  /**
   * Obtém o diretório de manifestos da Epic Games no Windows
   */
  public static getManifestsDirectory(): string {
    const programData = process.env.ProgramData || 'C:\\ProgramData';
    return path.join(programData, 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests');
  }

  /**
   * Varre e lista todos os jogos instalados na Epic Games
   */
  public static scanInstalledGames(): EpicGame[] {
    const manifestDir = EpicScanner.getManifestsDirectory();
    if (!fs.existsSync(manifestDir)) {
      return [];
    }

    const games: EpicGame[] = [];

    try {
      const files = fs.readdirSync(manifestDir);

      for (const file of files) {
        if (!file.endsWith('.item')) continue;

        try {
          const itemPath = path.join(manifestDir, file);
          const raw = fs.readFileSync(itemPath, 'utf8');
          const data = JSON.parse(raw);

          // Validações idênticas às identificadas na engenharia reversa do WeMod
          if (
            data &&
            !data.bIsIncompleteInstall &&
            typeof data.InstallLocation === 'string' &&
            typeof data.DisplayName === 'string' &&
            Array.isArray(data.AppCategories) &&
            data.AppCategories.includes('games') &&
            fs.existsSync(data.InstallLocation)
          ) {
            games.push({
              appName: data.AppName || path.basename(data.InstallLocation),
              displayName: data.DisplayName,
              installLocation: data.InstallLocation,
              launchExecutable: data.LaunchExecutable || '',
              catalogItemId: data.CatalogItemId || '',
              catalogNamespace: data.CatalogNamespace || ''
            });
          }
        } catch {
          // Ignora arquivos corrompidos
        }
      }
    } catch {
      // Ignora erro de acesso
    }

    return games;
  }
}
