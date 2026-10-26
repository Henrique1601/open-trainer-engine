import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameDetector } from '../core/scanner/game-detector.js';
import { ProcessManager } from '../core/memory/process-manager.js';
import { TrainerLoader } from '../core/trainer/trainer-loader.js';
import { TrainerSession } from '../core/trainer/trainer-session.js';
import { CheatEngineTableImporter } from '../core/importers/ct-importer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let activeSession: TrainerSession | null = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 980,
    minHeight: 650,
    backgroundColor: '#0d1117',
    title: 'Open Trainer Engine',
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (activeSession) {
      activeSession.detach();
      activeSession = null;
    }
    if (overlayWindow) {
      overlayWindow.close();
    }
  });
}

function createOverlayWindow() {
  overlayWindow = new BrowserWindow({
    width: 380,
    height: 480,
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

  // Posiciona no canto superior direito da tela
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;
  overlayWindow.setPosition(width - 400, 40);
}

app.whenReady().then(() => {
  createMainWindow();
  createOverlayWindow();

  // Registra atalho global Ctrl+G para alternar a exibição do HUD In-Game
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
  if (activeSession) {
    activeSession.detach();
  }
});

// ==============================================================================
// Comunicação IPC com o Painel do Usuário
// ==============================================================================

// 1. Varre jogos instalados
ipcMain.handle('scan-games', async () => {
  return GameDetector.scanAll();
});

// 2. Lista trainers disponíveis
ipcMain.handle('list-trainers', async () => {
  const configsDir = path.resolve('configs');
  return TrainerLoader.scanTrainersDirectory(configsDir);
});

// 3. Checa processos em execução
ipcMain.handle('get-running-processes', async () => {
  return ProcessManager.listProcesses();
});

// 4. Anexa trainer a um jogo
ipcMain.handle('attach-trainer', async (_event, contract) => {
  if (activeSession) {
    activeSession.detach();
    activeSession = null;
  }

  try {
    const session = new TrainerSession(contract);
    await session.attach();
    activeSession = session;

    // Notifica janelas quando o estado de um cheat mudar
    session.on('cheatToggled', data => {
      mainWindow?.webContents.send('cheat-toggled-event', data);
      overlayWindow?.webContents.send('cheat-toggled-event', data);
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// 5. Alterna cheat
ipcMain.handle('toggle-cheat', async (_event, cheatId) => {
  if (!activeSession) {
    throw new Error('Nenhum trainer ativo no momento.');
  }
  const newState = activeSession.toggleCheat(cheatId);
  return { cheatId, enabled: newState };
});

// 6. Importa tabela do Cheat Engine (.CT)
ipcMain.handle('import-ct', async (_event, ctPath, processName) => {
  const contract = CheatEngineTableImporter.importFromCT(ctPath, processName);
  return contract;
});

// 7. Desconecta sessão
ipcMain.handle('detach-trainer', async () => {
  if (activeSession) {
    activeSession.detach();
    activeSession = null;
  }
  return { success: true };
});
