import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { PreferencesStore } from '../../core/storage/preferences-store.js';
import { AppUpdater } from '../../core/updater/app-updater.js';
import { RemoteServer } from '../../core/remote/remote-server.js';
import { GameScreenshotCapture } from '../../core/captures/screenshot-capture.js';

export function isAllowedExternalUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export interface SystemIpcDeps {
  getMainWindow: () => BrowserWindow | null;
  getOverlayWindow: () => BrowserWindow | null;
  remoteServer: RemoteServer;
}

export function registerSystemIpc(deps: SystemIpcDeps): void {
  ipcMain.handle('window:minimize', async () => {
    deps.getMainWindow()?.minimize();
    return true;
  });

  ipcMain.handle('window:maximize', async () => {
    const win = deps.getMainWindow();
    if (!win) return false;
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
    return win.isMaximized();
  });

  ipcMain.handle('window:close', async () => {
    deps.getMainWindow()?.close();
    return true;
  });

  ipcMain.handle('window:is-maximized', async () => {
    return deps.getMainWindow()?.isMaximized() || false;
  });

  ipcMain.handle('toggle-favorite', async (_event, gameId) => {
    return PreferencesStore.toggleFavorite(gameId);
  });

  ipcMain.handle('app:get-version', async () => {
    return app.getVersion() || AppUpdater.getCurrentVersion();
  });

  ipcMain.handle('get-preferences', async () => {
    return PreferencesStore.get();
  });

  ipcMain.handle('get-game-stats', async (_event, gameId) => {
    const prefs = PreferencesStore.get();
    const stats = prefs.playtime[gameId] || { totalSeconds: 0, lastPlayed: 'Nunca', sessionsCount: 0 };
    const savedMods = prefs.modStates[gameId] || {};
    const isFav = prefs.favorites.includes(gameId);
    return {
      isFavorite: isFav,
      stats,
      formattedPlaytime: PreferencesStore.formatPlaytime(stats.totalSeconds),
      savedMods
    };
  });

  ipcMain.handle('check-for-updates', async () => {
    return AppUpdater.checkForUpdates();
  });

  ipcMain.handle('open-external-url', async (_event, url: string) => {
    if (!isAllowedExternalUrl(url)) {
      return false;
    }
    await shell.openExternal(url);
    return true;
  });

  ipcMain.handle('remote:get-info', async () => {
    return {
      url: deps.remoteServer.getRemoteUrl(),
      qrCode: deps.remoteServer.getQrCodeUrl()
    };
  });

  const applyTheme = (theme: string) => {
    const applied = PreferencesStore.setTheme(theme);
    deps.getMainWindow()?.webContents.send('theme:changed', applied);
    deps.getOverlayWindow()?.webContents.send('theme:changed', applied);
    return applied;
  };

  ipcMain.handle('theme:get', async () => PreferencesStore.getTheme());
  ipcMain.handle('theme:set', async (_event, theme: string) => applyTheme(theme));
  ipcMain.handle('preferences:save-theme', async (_event, theme: string) => applyTheme(theme));

  let downloadedInstallerPath = '';

  ipcMain.handle('updater:download-update', async (_event, downloadUrl: string, fileName?: string) => {
    if (!isAllowedExternalUrl(downloadUrl)) {
      return { success: false, error: 'URL de atualização inválida.' };
    }
    const safeName = path.basename(fileName || 'OpenTrainerEngine-Update.exe');
    const tempDir = path.join(app.getPath('temp'), 'OpenTrainerEngineUpdates');
    downloadedInstallerPath = path.join(tempDir, safeName);

    try {
      await AppUpdater.downloadUpdate(downloadUrl, downloadedInstallerPath, (prog) => {
        deps.getMainWindow()?.webContents.send('updater:progress', prog);
      });
      return { success: true, path: downloadedInstallerPath };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('updater:install-and-restart', async (_event, silent: boolean = true) => {
    if (!downloadedInstallerPath || !fs.existsSync(downloadedInstallerPath)) {
      throw new Error('Nenhum instalador baixado para executar.');
    }
    AppUpdater.installAndRestart(downloadedInstallerPath, silent);
    return { success: true };
  });

  ipcMain.handle('overlay:toggle', async () => {
    const overlay = deps.getOverlayWindow();
    if (!overlay) return { visible: false };
    if (overlay.isVisible()) {
      overlay.hide();
      return { visible: false };
    }
    overlay.showInactive();
    return { visible: true };
  });

  ipcMain.handle('game:capture-screenshot', async () => {
    const res = await GameScreenshotCapture.capturePrimaryScreen();
    if (res.success) {
      deps.getMainWindow()?.webContents.send('screenshot-taken-event', res);
      deps.getOverlayWindow()?.webContents.send('screenshot-taken-event', res);
    }
    return res;
  });
}
