import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { DetectedGame } from './game-detector.js';

export class XboxScanner {
  public static readonly DEFAULT_XBOX_PATHS = [
    'C:\\XboxGames',
    'D:\\XboxGames',
    'E:\\XboxGames',
    'F:\\XboxGames',
    'C:\\Program Files\\ModifiableWindowsApps'
  ];

  /**
   * Faz o parse de um arquivo MicrosoftGame.config XML
   */
  public static parseMicrosoftGameConfig(xmlContent: string, gameDirectory: string): DetectedGame | null {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_'
      });
      const parsed = parser.parse(xmlContent);

      const gameConfig = parsed?.Game;
      if (!gameConfig) return null;

      const title = gameConfig.Identity?.['@_Name'] || path.basename(gameDirectory);
      
      let exeName: string | undefined;
      const execList = gameConfig.ExecutableList?.Executable;
      if (Array.isArray(execList) && execList.length > 0) {
        exeName = execList[0]['@_Name'] || undefined;
      } else if (execList && typeof execList === 'object') {
        exeName = execList['@_Name'] || undefined;
      }

      const id = `xbox-${gameConfig.Identity?.['@_Name'] || path.basename(gameDirectory).toLowerCase()}`;

      return {
        id,
        title,
        installPath: gameDirectory,
        executableName: exeName,
        platform: 'xbox'
      };
    } catch {
      return null;
    }
  }

  /**
   * Varre pastas padrão de instalação de jogos do Xbox Game Pass PC
   */
  public static scanInstalledGames(customPaths?: string[]): DetectedGame[] {
    const searchDirs = customPaths || this.DEFAULT_XBOX_PATHS;
    const detected: DetectedGame[] = [];

    for (const baseDir of searchDirs) {
      if (!fs.existsSync(baseDir)) continue;

      try {
        const entries = fs.readdirSync(baseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;

          const gameDir = path.join(baseDir, entry.name);
          const configPath = path.join(gameDir, 'Content', 'MicrosoftGame.config');
          const rootConfigPath = path.join(gameDir, 'MicrosoftGame.config');

          let targetConfig = '';
          if (fs.existsSync(configPath)) {
            targetConfig = configPath;
          } else if (fs.existsSync(rootConfigPath)) {
            targetConfig = rootConfigPath;
          }

          if (targetConfig) {
            try {
              const xmlContent = fs.readFileSync(targetConfig, 'utf-8');
              const game = this.parseMicrosoftGameConfig(xmlContent, gameDir);
              if (game) {
                detected.push(game);
              }
            } catch {
              // Ignora arquivos corrompidos
            }
          }
        }
      } catch {
        // Ignora diretórios protegidos
      }
    }

    return detected;
  }
}
