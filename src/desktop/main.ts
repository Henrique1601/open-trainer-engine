import { app, BrowserWindow, globalShortcut, screen } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { TrainerSession } from '../core/trainer/trainer-session.js';
import { PreferencesStore } from '../core/storage/preferences-store.js';
import { RemoteServer } from '../core/remote/remote-server.js';
import { SpeedhackEngine } from '../core/memory/speedhack.js';
import { CloudTrainerHub } from '../core/cloud/cloud-trainer-hub.js';
import { GameScreenshotCapture } from '../core/captures/screenshot-capture.js';
import { registerLibraryIpc } from './ipc/ipc-library.js';
import { registerTrainerIpc } from './ipc/ipc-trainer.js';
import { registerSystemIpc } from './ipc/ipc-system.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let activeSession: TrainerSession | null = null;
let activeSessionTimer: NodeJS.Timeout | null = null;
let activeGameId: string | null = null;

const remoteAuthToken = crypto.randomBytes(8).toString('hex');
const remoteServer = new RemoteServer({ port: 38474, authToken: remoteAuthToken });
const speedhack = new SpeedhackEngine();
let cloudHub: CloudTrainerHub | null = null;

function getCloudHub(): CloudTrainerHub {
  if (!cloudHub) {
    cloudHub = new CloudTrainerHub(path.join(app.getPath('userData'), 'cloud-trainers-cache.json'));
  }
  return cloudHub;
}

function syncRemoteServerState() {
  if (overlayWindow && activeSession) {
    const activeCheats = new Set(activeSession.getActiveCheats());
    overlayWindow.webContents.send('sync-overlay-cheats', {
      gameTitle: activeSession.contract.title,
      cheats: activeSession.contract.cheats.map(c => ({
        id: c.id,
        name: c.name,
        hotkey: c.hotkey || '',
        category: c.category,
        active: activeCheats.has(c.id)
      }))
    });
  }
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
    if (fs.existsSync(p)) return p;
  }
  return '';
}

function createMainWindow() {
  const iconPath = getAppIconPath();
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1040,
    minHeight: 680,
    backgroundColor: '#111217',
    title: 'Open Trainer Engine (Wand / WeMod Edition)',
    frame: false,
    titleBarStyle: 'hidden',
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
  getCloudHub();

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

  registerLibraryIpc(getCloudHub);
  registerTrainerIpc({
    getMainWindow: () => mainWindow,
    getOverlayWindow: () => overlayWindow,
    getActiveSession: () => activeSession,
    setActiveSession: (session, gameId) => {
      activeSession = session;
      activeGameId = gameId;
    },
    getActiveGameId: () => activeGameId,
    setActiveSessionTimer: (timer) => {
      activeSessionTimer = timer;
    },
    cleanupSession,
    syncRemoteServerState,
    speedhack
  });
  registerSystemIpc({
    getMainWindow: () => mainWindow,
    getOverlayWindow: () => overlayWindow,
    remoteServer
  });

  createMainWindow();
  createOverlayWindow();

  globalShortcut.register('CommandOrControl+Shift+F11', async () => {
    const res = await GameScreenshotCapture.capturePrimaryScreen();
    if (res.success) {
      mainWindow?.webContents.send('screenshot-taken-event', res);
      overlayWindow?.webContents.send('screenshot-taken-event', res);
    }
  });

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
