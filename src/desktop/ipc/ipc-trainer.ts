import { BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { TrainerSession } from '../../core/trainer/trainer-session.js';
import { TrainerLoader } from '../../core/trainer/trainer-loader.js';
import { DefaultCheatsProvider } from '../../core/trainer/default-cheats-provider.js';
import { CheatEngineTableImporter } from '../../core/importers/ct-importer.js';
import { PreferencesStore } from '../../core/storage/preferences-store.js';
import { ProfileManager } from '../../core/storage/profile-manager.js';
import { ProcessManager } from '../../core/memory/process-manager.js';
import { SpeedhackEngine } from '../../core/memory/speedhack.js';
import { GameProcessPauser } from '../../core/memory/process-pauser.js';
import { AntiCheatDetector } from '../../core/security/anti-cheat-detector.js';
import { HexViewer } from '../../core/studio/hex-viewer.js';

export interface TrainerIpcDeps {
  getMainWindow: () => BrowserWindow | null;
  getOverlayWindow: () => BrowserWindow | null;
  getActiveSession: () => TrainerSession | null;
  setActiveSession: (session: TrainerSession | null, gameId: string | null) => void;
  getActiveGameId: () => string | null;
  setActiveSessionTimer: (timer: NodeJS.Timeout | null) => void;
  cleanupSession: () => void;
  syncRemoteServerState: () => void;
  speedhack: SpeedhackEngine;
}

export function registerTrainerIpc(deps: TrainerIpcDeps): void {
  ipcMain.handle('attach-trainer', async (_event, contract) => {
    deps.cleanupSession();

    try {
      const session = new TrainerSession(contract);
      await session.attach();
      deps.setActiveSession(session, contract.id);

      PreferencesStore.recordSessionStart(contract.id);
      const timer = setInterval(() => {
        const gId = deps.getActiveGameId();
        if (gId) {
          PreferencesStore.addPlaytime(gId, 5);
          const updated = PreferencesStore.get().playtime[gId];
          deps.getMainWindow()?.webContents.send('playtime-updated', {
            gameId: gId,
            formatted: PreferencesStore.formatPlaytime(updated.totalSeconds),
            totalSeconds: updated.totalSeconds
          });
        }
      }, 5000);
      deps.setActiveSessionTimer(timer);

      const savedStates = PreferencesStore.getSavedCheatStates(contract.id);
      for (const cheatId of Object.keys(savedStates)) {
        if (savedStates[cheatId].enabled) {
          try {
            session.toggleCheat(cheatId, true);
          } catch {}
        }
      }

      session.on('cheatToggled', data => {
        const gId = deps.getActiveGameId();
        if (gId) {
          PreferencesStore.saveCheatState(gId, data.cheatId, data.enabled);
        }
        deps.syncRemoteServerState();
        deps.getMainWindow()?.webContents.send('cheat-toggled-event', data);
        deps.getOverlayWindow()?.webContents.send('cheat-toggled-event', data);
      });

      deps.syncRemoteServerState();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('toggle-cheat', async (_event, cheatId, forceState, gameId) => {
    const gId = gameId || deps.getActiveGameId() || 'active-game';
    const session = deps.getActiveSession();
    let newState = false;
    if (session) {
      try {
        newState = session.toggleCheat(cheatId, forceState);
      } catch {
        const saved = PreferencesStore.getSavedCheatStates(gId);
        newState = forceState !== undefined ? forceState : !(saved[cheatId]?.enabled);
      }
    } else {
      const saved = PreferencesStore.getSavedCheatStates(gId);
      newState = forceState !== undefined ? forceState : !(saved[cheatId]?.enabled);
    }
    PreferencesStore.saveCheatState(gId, cheatId, newState);
    deps.syncRemoteServerState();
    return { cheatId, enabled: newState };
  });

  ipcMain.handle('detach-trainer', async () => {
    deps.cleanupSession();
    return { success: true };
  });

  ipcMain.handle('import-ct', async (_event, ctPath, processName) => {
    return CheatEngineTableImporter.importFromCT(ctPath, processName);
  });

  ipcMain.handle('speedhack:set', async (_event, multiplier, targetPid, processName) => {
    let pid = targetPid || null;
    const session = deps.getActiveSession();
    if (!pid && session) {
      pid = (session as any).getProcessInfo?.()?.pid || (session as any).processInfo?.pid || null;
    }
    if (!pid && processName) {
      try {
        const detected = ProcessManager.findProcessByName(processName);
        if (detected) pid = detected.pid;
      } catch {}
    }
    const result = deps.speedhack.applyToProcess(pid, multiplier);
    deps.getMainWindow()?.webContents.send('speedhack:status', result);
    deps.getOverlayWindow()?.webContents.send('speedhack:status', result);
    return result;
  });

  ipcMain.handle('speedhack:get', async () => {
    return deps.speedhack.getState();
  });

  ipcMain.handle('trainer:get-cheats', async (_event, gameId: string, arg2?: string, arg3?: string) => {
    const isArg2Exe = Boolean(arg2 && (arg2.toLowerCase().endsWith('.exe') || arg2.includes('.')));
    const title = isArg2Exe ? (arg3 || gameId) : (arg2 || gameId);
    const processName = isArg2Exe ? arg2 : arg3;

    const defaults = DefaultCheatsProvider.getCheatsForGame(title || gameId, processName);
    const staticDirs = [path.resolve('configs'), path.resolve('configs/trainers')];
    let staticTrainer: any = null;
    for (const dir of staticDirs) {
      if (fs.existsSync(dir)) {
        const trainers = TrainerLoader.scanTrainersDirectory(dir);
        staticTrainer = trainers.find((t: any) =>
          t.id === gameId ||
          (processName && t.processName && t.processName.toLowerCase() === processName.toLowerCase()) ||
          t.title.toLowerCase().includes((title || '').toLowerCase()) ||
          (title && t.title.toLowerCase() === title.toLowerCase())
        );
        if (staticTrainer) break;
      }
    }

    const customCheats = PreferencesStore.getCustomCheats(gameId);
    const cheatMap = new Map<string, any>();
    for (const c of defaults) cheatMap.set(c.id, c);
    if (staticTrainer) {
      for (const c of staticTrainer.cheats) cheatMap.set(c.id, c);
    }
    for (const c of customCheats) cheatMap.set(c.id, c);

    return Array.from(cheatMap.values());
  });

  ipcMain.handle('custom-cheats:get', async (_event, gameId: string) => {
    return PreferencesStore.getCustomCheats(gameId);
  });

  ipcMain.handle('custom-cheats:add', async (_event, gameId: string, cheat: any) => {
    return PreferencesStore.addCustomCheat(gameId, cheat);
  });

  ipcMain.handle('custom-cheats:delete', async (_event, gameId: string, cheatId: string) => {
    return PreferencesStore.deleteCustomCheat(gameId, cheatId);
  });

  ipcMain.handle('profiles:get', async (_event, gameId) => {
    return {
      profiles: ProfileManager.getProfiles(gameId),
      activeProfileId: ProfileManager.getActiveProfileId(gameId)
    };
  });

  ipcMain.handle('profiles:create', async (_event, gameId, name, states) => {
    return ProfileManager.createProfile(gameId, name, states);
  });

  ipcMain.handle('profiles:apply', async (_event, gameId, profileId) => {
    const profile = ProfileManager.applyProfile(gameId, profileId);
    const session = deps.getActiveSession();
    if (profile && session) {
      for (const [cheatId, st] of Object.entries(profile.states)) {
        try {
          session.toggleCheat(cheatId, st.enabled);
        } catch {}
      }
      deps.syncRemoteServerState();
      deps.getMainWindow()?.webContents.send('profile-applied', profile);
      deps.getOverlayWindow()?.webContents.send('profile-applied', profile);
    }
    return profile;
  });

  ipcMain.handle('profiles:delete', async (_event, gameId, profileId) => {
    return ProfileManager.deleteProfile(gameId, profileId);
  });

  ipcMain.handle('security:check-anti-cheat', async () => {
    const procs = ProcessManager.listProcesses().map(p => p.name);
    return AntiCheatDetector.checkRunningProcesses(procs);
  });

  ipcMain.handle('studio:hex-dump', async (_event, hexBytes: string, baseAddressStr?: string) => {
    const clean = hexBytes.replace(/\s+/g, '');
    const buf = Buffer.from(clean, 'hex');
    const baseAddr = baseAddressStr ? BigInt(baseAddressStr) : 0n;
    return {
      dump: HexViewer.formatHexDump(buf, baseAddr),
      disasm: HexViewer.disassembleQuick(buf)
    };
  });

  ipcMain.handle('game:toggle-pause', async () => {
    const session = deps.getActiveSession();
    if (!session) {
      return { isPaused: false, message: 'Nenhum jogo ativo.' };
    }
    const pid = (session as any).processHandle?.pid || (session as any).pid || null;
    if (!pid) {
      return { isPaused: false, message: 'PID do jogo não identificado.' };
    }
    const isPaused = GameProcessPauser.toggle(pid);
    return { isPaused, pid };
  });
}
