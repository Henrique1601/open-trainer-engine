import { exec, spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { DetectedGame, GamePlatform } from './game-detector.js';

export interface LaunchResult {
  success: boolean;
  message: string;
  commandExecuted?: string;
  pid?: number;
}

export class GameLauncher {
  /**
   * Constrói o comando ou protocolo URI oficial da loja para abrir o jogo
   */
  public static getLaunchCommand(game: DetectedGame): { type: 'uri' | 'exe'; command: string; args: string[] } {
    // 1. Steam: Protocolo steam://rungameid/<appId>
    if (game.platform === 'steam') {
      const appId = game.id.replace('steam-', '');
      return {
        type: 'uri',
        command: `rundll32 url.dll,FileProtocolHandler "steam://rungameid/${appId}"`,
        args: []
      };
    }

    // 2. Epic Games: Protocolo com.epicgames.launcher://apps/<appName>?action=launch
    if (game.platform === 'epic') {
      const appName = game.id.replace('epic-', '');
      return {
        type: 'uri',
        command: `rundll32 url.dll,FileProtocolHandler "com.epicgames.launcher://apps/${appName}?action=launch&silent=true"`,
        args: []
      };
    }

    // 3. GOG Galaxy: Protocolo goggalaxy://openGameView/<gameId> ou executável direto
    if (game.platform === 'gog') {
      const gogId = game.id.replace('gog-', '');
      if (game.installPath && game.executableName) {
        const fullExe = path.join(game.installPath, game.executableName);
        if (fs.existsSync(fullExe)) {
          return { type: 'exe', command: fullExe, args: [] };
        }
      }
      return {
        type: 'uri',
        command: `rundll32 url.dll,FileProtocolHandler "goggalaxy://openGameView/${gogId}"`,
        args: []
      };
    }

    // 4. Xbox Game Pass: Inicia por shell:AppsFolder/<aumid> ou executável
    if (game.platform === 'xbox') {
      if (game.installPath && game.executableName) {
        const fullExe = path.join(game.installPath, game.executableName);
        if (fs.existsSync(fullExe)) {
          return { type: 'exe', command: fullExe, args: [] };
        }
      }
      const aumid = game.id.replace('xbox-', '');
      return {
        type: 'uri',
        command: `explorer.exe "shell:AppsFolder\\${aumid}!App"`,
        args: []
      };
    }

    // 5. Standalone ou Genérico: Executa o .exe direto
    if (game.installPath && game.executableName) {
      const fullExe = path.join(game.installPath, game.executableName);
      return { type: 'exe', command: fullExe, args: [] };
    }

    throw new Error(`Não foi possível determinar a forma de execução para o jogo ${game.title}`);
  }

  /**
   * Executa o jogo na plataforma correspondente
   */
  public static async launch(game: DetectedGame): Promise<LaunchResult> {
    try {
      const launchInfo = this.getLaunchCommand(game);

      if (launchInfo.type === 'uri') {
        return new Promise((resolve) => {
          exec(launchInfo.command, (error) => {
            if (error) {
              resolve({
                success: false,
                message: `Erro ao disparar launcher: ${error.message}`,
                commandExecuted: launchInfo.command
              });
            } else {
              resolve({
                success: true,
                message: `Jogo iniciado com sucesso via launcher oficial da ${game.platform.toUpperCase()}`,
                commandExecuted: launchInfo.command
              });
            }
          });
        });
      }

      // Execução direta do executável
      const child = spawn(launchInfo.command, launchInfo.args, {
        cwd: game.installPath,
        detached: true,
        stdio: 'ignore'
      });
      child.unref();

      return {
        success: true,
        message: `Executável ${game.executableName} iniciado diretamente em segundo plano`,
        commandExecuted: launchInfo.command,
        pid: child.pid
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Falha ao executar jogo'
      };
    }
  }
}
