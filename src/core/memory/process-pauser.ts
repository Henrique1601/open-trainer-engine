import { kernel32, OpenProcess, CloseHandle } from './win32.js';
import koffi from 'koffi';

// Carrega ntdll para suspensão atômica e segura do processo
let NtSuspendProcess: any = null;
let NtResumeProcess: any = null;

try {
  const ntdll = koffi.load('ntdll.dll');
  NtSuspendProcess = ntdll.func('int32 __stdcall NtSuspendProcess(uintptr ProcessHandle)');
  NtResumeProcess = ntdll.func('int32 __stdcall NtResumeProcess(uintptr ProcessHandle)');
} catch (err) {
  console.warn('ntdll.dll não pôde ser carregada para NtSuspendProcess:', err);
}

export interface PauseState {
  isPaused: boolean;
  targetPid: number | null;
  pausedAt?: string;
}

export class GameProcessPauser {
  private static currentState: PauseState = {
    isPaused: false,
    targetPid: null
  };

  public static getState(): PauseState {
    return { ...this.currentState };
  }

  /**
   * Suspende atomicamente todas as threads do processo do jogo
   */
  public static pause(pid: number): boolean {
    if (!NtSuspendProcess) {
      console.warn('NtSuspendProcess indisponível neste ambiente');
      return false;
    }

    try {
      // PROCESS_SUSPEND_RESUME (0x0800) | PROCESS_QUERY_LIMITED_INFORMATION (0x1000)
      const PROCESS_SUSPEND_RESUME = 0x0800;
      const hProcess = OpenProcess(PROCESS_SUSPEND_RESUME, 0, pid);
      if (!hProcess) {
        console.warn(`Não foi possível abrir processo ${pid} para suspensão`);
        return false;
      }

      const status = NtSuspendProcess(hProcess);
      CloseHandle(hProcess);

      // Status 0 (STATUS_SUCCESS)
      if (status === 0) {
        this.currentState = {
          isPaused: true,
          targetPid: pid,
          pausedAt: new Date().toISOString()
        };
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao pausar processo do jogo:', err);
      return false;
    }
  }

  /**
   * Retoma a execução do processo do jogo
   */
  public static resume(pid?: number): boolean {
    if (!NtResumeProcess) {
      console.warn('NtResumeProcess indisponível neste ambiente');
      return false;
    }

    const targetPid = pid || this.currentState.targetPid;
    if (!targetPid) return false;

    try {
      const PROCESS_SUSPEND_RESUME = 0x0800;
      const hProcess = OpenProcess(PROCESS_SUSPEND_RESUME, 0, targetPid);
      if (!hProcess) return false;

      const status = NtResumeProcess(hProcess);
      CloseHandle(hProcess);

      if (status === 0) {
        this.currentState = {
          isPaused: false,
          targetPid: null
        };
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao retomar processo do jogo:', err);
      return false;
    }
  }

  /**
   * Alterna estado de pausa
   */
  public static toggle(pid: number): boolean {
    if (this.currentState.isPaused && this.currentState.targetPid === pid) {
      this.resume(pid);
      return false;
    } else {
      this.pause(pid);
      return true;
    }
  }
}
