import { app, BrowserWindow, ipcMain, globalShortcut, shell, screen } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GameDetector } from '../core/scanner/game-detector.js';
import { ProcessManager } from '../core/memory/process-manager.js';
import { TrainerLoader } from '../core/trainer/trainer-loader.js';
import { TrainerSession } from '../core/trainer/trainer-session.js';
import { CheatEngineTableImporter } from '../core/importers/ct-importer.js';
import { PreferencesStore } from '../core/storage/preferences-store.js';
import { AppUpdater } from '../core/updater/app-updater.js';
import { GameMapsManager } from '../core/maps/game-maps.js';
import { CapturesManager } from '../core/captures/captures-manager.js';
import { RemoteServer } from '../core/remote/remote-server.js';
import { SpeedhackEngine } from '../core/memory/speedhack.js';
import { CloudTrainerHub, CloudTrainerEntry } from '../core/cloud/cloud-trainer-hub.js';
import { HexViewer } from '../core/studio/hex-viewer.js';
import { AntiCheatDetector } from '../core/security/anti-cheat-detector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let activeSession: TrainerSession | null = null;
let activeSessionTimer: NodeJS.Timeout | null = null;
let activeGameId: string | null = null;

const remoteServer = new RemoteServer({ port: 38474 });
const speedhack = new SpeedhackEngine();
let cloudHub: CloudTrainerHub | null = null;

function syncRemoteServerState() {
  if (!activeSession) {
    remoteServer.updateState({
      gameTitle: null,
      isAttached: false,
      cheats: []
    });
    return;
  }
  const activeCheats = new Set(activeSession.getActiveCheats());
  remoteServer.updateState({
    gameTitle: activeSession.contract.title,
    isAttached: true,
    cheats: activeSession.contract.cheats.map(c => ({
      id: c.id,
      name: c.name,
      hotkey: c.hotkey || '',
      category: c.category,
      type: c.type,
      active: activeCheats.has(c.id)
    }))
  });
}

function getAppIconPath(): string {
  const possiblePaths = [
    path.join(__dirname, '../../assets/icon.png'),
    path.join(__dirname, '../assets/icon.png'),
    path.join(__dirname, '../../build/icon.ico'),
    path.join(app.getAppPath(), 'assets', 'icon.png'),
    path.join(app.getAppPath(), 'build', 'icon.ico')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return '';
}

function createMainWindow() {
  const iconPath = getAppIconPath();
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1040,
    minHeight: 680,
    backgroundColor: '#0a0d14',
    title: 'Open Trainer Engine',
    frame: true,
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
    cleanupSession();
    if (overlayWindow) {
      overlayWindow.close();
    }
  });
}

function createOverlayWindow() {
  overlayWindow = new BrowserWindow({
    width: 400,
    height: 520,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  overlayWindow.loadFile(path.join(__dirname, 'ui', 'overlay.html'));

  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;
  overlayWindow.setPosition(width - 420, 40);
}

function cleanupSession() {
  if (activeSessionTimer) {
    clearInterval(activeSessionTimer);
    activeSessionTimer = null;
  }
  if (activeSession) {
    activeSession.detach();
    activeSession = null;
  }
  activeGameId = null;
  syncRemoteServerState();
}

app.whenReady().then(async () => {
  cloudHub = new CloudTrainerHub(path.join(app.getPath('userData'), 'cloud-trainers-cache.json'));

  // Inicia o servidor do WeMod Remote (Mobile PWA)
  try {
    const remoteUrl = await remoteServer.start();
    console.log(`[WeMod Remote] Servidor mobile iniciado em: ${remoteUrl}`);
    remoteServer.on('toggleCheat', (data) => {
      if (activeSession && data.cheatId) {
        const newState = activeSession.toggleCheat(data.cheatId);
        if (activeGameId) {
          PreferencesStore.saveCheatState(activeGameId, data.cheatId, newState);
        }
        syncRemoteServerState();
        mainWindow?.webContents.send('cheat-toggled-event', { cheatId: data.cheatId, enabled: newState });
        overlayWindow?.webContents.send('cheat-toggled-event', { cheatId: data.cheatId, enabled: newState });
      }
    });
  } catch (err) {
    console.warn('[WeMod Remote] Não foi possível iniciar o servidor mobile:', err);
  }

  createMainWindow();
  createOverlayWindow();

  // Atalho global Ctrl+G para alternar o HUD In-Game
  globalShortcut.register('CommandOrControl+G', () => {
    if (!overlayWindow) return;
    if (overlayWindow.isVisible()) {
      overlayWindow.hide();
    } else {
      overlayWindow.showInactive();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  cleanupSession();
});

// ==============================================================================
// Comunicação IPC
// ==============================================================================

ipcMain.handle('scan-games', async () => {
  return GameDetector.scanAll();
});

ipcMain.handle('list-trainers', async () => {
  const configsDir = path.resolve('configs');
  return TrainerLoader.scanTrainersDirectory(configsDir);
});

ipcMain.handle('get-running-processes', async () => {
  return ProcessManager.listProcesses();
});

ipcMain.handle('attach-trainer', async (_event, contract) => {
  cleanupSession();

  try {
    const session = new TrainerSession(contract);
    await session.attach();
    activeSession = session;
    activeGameId = contract.id;

    // Inicia rastreamento de horas jogadas com mods com precisão de segundos
    PreferencesStore.recordSessionStart(contract.id);
    activeSessionTimer = setInterval(() => {
      if (activeGameId) {
        PreferencesStore.addPlaytime(activeGameId, 5); // acumula a cada 5 segundos
        const updated = PreferencesStore.get().playtime[activeGameId];
        mainWindow?.webContents.send('playtime-updated', {
          gameId: activeGameId,
          formatted: PreferencesStore.formatPlaytime(updated.totalSeconds),
          totalSeconds: updated.totalSeconds
        });
      }
    }, 5000);

    // Auto-restauração de mods salvos
    const savedStates = PreferencesStore.getSavedCheatStates(contract.id);
    for (const cheatId of Object.keys(savedStates)) {
      if (savedStates[cheatId].enabled) {
        try {
          session.toggleCheat(cheatId, true);
        } catch {}
      }
    }

    session.on('cheatToggled', data => {
      // Salva o estado do mod persistente
      if (activeGameId) {
        PreferencesStore.saveCheatState(activeGameId, data.cheatId, data.enabled);
      }
      syncRemoteServerState();
      mainWindow?.webContents.send('cheat-toggled-event', data);
      overlayWindow?.webContents.send('cheat-toggled-event', data);
    });

    syncRemoteServerState();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('toggle-cheat', async (_event, cheatId, forceState) => {
  if (!activeSession) {
    throw new Error('Nenhum trainer ativo no momento.');
  }
  const newState = activeSession.toggleCheat(cheatId, forceState);
  if (activeGameId) {
    PreferencesStore.saveCheatState(activeGameId, cheatId, newState);
  }
  syncRemoteServerState();
  return { cheatId, enabled: newState };
});

ipcMain.handle('detach-trainer', async () => {
  cleanupSession();
  return { success: true };
});

ipcMain.handle('import-ct', async (_event, ctPath, processName) => {
  const contract = CheatEngineTableImporter.importFromCT(ctPath, processName);
  return contract;
});

// ==============================================================================
// Preferências, Favoritos e Horas Jogadas
// ==============================================================================
ipcMain.handle('toggle-favorite', async (_event, gameId) => {
  return PreferencesStore.toggleFavorite(gameId);
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

// ==============================================================================
// Verificação de Atualizações do App
// ==============================================================================
ipcMain.handle('check-for-updates', async () => {
  return AppUpdater.checkForUpdates();
});

ipcMain.handle('open-external-url', async (_event, url) => {
  shell.openExternal(url);
  return true;
});

// ==============================================================================
// Mapas ao Vivo & Clipes de Gravação
// ==============================================================================
ipcMain.handle('get-maps', async () => {
  return GameMapsManager.getAllMaps();
});

ipcMain.handle('get-captures', async () => {
  return CapturesManager.listCaptures();
});

// ==============================================================================
// WeMod Remote (Mobile PWA & QR Code)
// ==============================================================================
ipcMain.handle('remote:get-info', async () => {
  return {
    url: remoteServer.getRemoteUrl(),
    qrCode: remoteServer.getQrCodeUrl()
  };
});

// ==============================================================================
// Speedhack Nativo (Controle de Velocidade / Bullet-Time)
// ==============================================================================
ipcMain.handle('speedhack:set', async (_event, multiplier) => {
  if (multiplier === 1.0) {
    speedhack.disable();
  } else {
    speedhack.enable();
    speedhack.setSpeed(multiplier);
  }
  return speedhack.getState();
});

ipcMain.handle('speedhack:get', async () => {
  return speedhack.getState();
});

// ==============================================================================
// Catálogo de Trainers na Nuvem (Cloud Trainers Hub)
// ==============================================================================
ipcMain.handle('cloud:fetch-catalog', async () => {
  if (!cloudHub) {
    cloudHub = new CloudTrainerHub(path.join(app.getPath('userData'), 'cloud-trainers-cache.json'));
  }
  return cloudHub.fetchCatalog();
});

ipcMain.handle('cloud:install-trainer', async (_event, entry: CloudTrainerEntry) => {
  if (!cloudHub) {
    cloudHub = new CloudTrainerHub(path.join(app.getPath('userData'), 'cloud-trainers-cache.json'));
  }
  const targetDir = path.resolve('configs/trainers');
  return cloudHub.installTrainer(entry, targetDir);
});

// ==============================================================================
// Segurança: Detecção de Anti-Cheats Ativos (Safe Guard)
// ==============================================================================
ipcMain.handle('security:check-anti-cheat', async () => {
  const procs = ProcessManager.listProcesses().map(p => p.name);
  return AntiCheatDetector.checkRunningProcesses(procs);
});

// ==============================================================================
// Cheat Maker Studio: Hex Memory Viewer & Disassembler
// ==============================================================================
ipcMain.handle('studio:hex-dump', async (_event, hexBytes: string, baseAddressStr?: string) => {
  const clean = hexBytes.replace(/\s+/g, '');
  const buf = Buffer.from(clean, 'hex');
  const baseAddr = baseAddressStr ? BigInt(baseAddressStr) : 0n;
  const dump = HexViewer.formatHexDump(buf, baseAddr);
  const disasm = HexViewer.disassembleQuick(buf);
  return { dump, disasm };
});
