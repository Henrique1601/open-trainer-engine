import { app, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { GameDetector } from '../../core/scanner/game-detector.js';
import { GameArtResolver } from '../../core/scanner/game-art-resolver.js';
import { GameLauncher } from '../../core/scanner/game-launcher.js';
import { TrainerLoader } from '../../core/trainer/trainer-loader.js';
import { ProcessManager } from '../../core/memory/process-manager.js';
import { GameMapsManager } from '../../core/maps/game-maps.js';
import { CapturesManager } from '../../core/captures/captures-manager.js';
import { CloudTrainerHub, CloudTrainerEntry } from '../../core/cloud/cloud-trainer-hub.js';

export function registerLibraryIpc(getCloudHub: () => CloudTrainerHub): void {
  ipcMain.handle('scan-games', async () => {
    const games = GameDetector.scanAll();
    return GameArtResolver.enrichAll(games);
  });

  ipcMain.handle('list-trainers', async () => {
    const configsDir = path.resolve('configs');
    return TrainerLoader.scanTrainersDirectory(configsDir);
  });

  ipcMain.handle('get-running-processes', async () => {
    return ProcessManager.listProcesses();
  });

  ipcMain.handle('get-maps', async () => {
    return GameMapsManager.getAllMaps();
  });

  ipcMain.handle('get-captures', async () => {
    return CapturesManager.listCaptures();
  });

  ipcMain.handle('game:launch', async (_event, game) => {
    return GameLauncher.launch(game);
  });

  ipcMain.handle('app:get-file-icon', async (_event, filePath: string) => {
    try {
      if (filePath && fs.existsSync(filePath)) {
        const icon = await app.getFileIcon(filePath, { size: 'large' });
        return icon.toDataURL();
      }
    } catch {}
    return '';
  });

  ipcMain.handle('games:resolve-art', async (_event, game) => {
    return GameArtResolver.resolveAndCacheArt(game);
  });

  ipcMain.handle('cloud:fetch-catalog', async () => {
    return getCloudHub().fetchCatalog();
  });

  ipcMain.handle('cloud:install-trainer', async (_event, entry: CloudTrainerEntry) => {
    const targetDir = path.resolve('configs/trainers');
    return getCloudHub().installTrainer(entry, targetDir);
  });
}
