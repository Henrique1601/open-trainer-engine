import {
  OpenProcess,
  CloseHandle,
  CreateToolhelp32Snapshot,
  Process32FirstW,
  Process32NextW,
  Module32FirstW,
  Module32NextW,
  TH32CS_SNAPPROCESS,
  TH32CS_SNAPMODULE,
  TH32CS_SNAPMODULE32,
  PROCESS_ALL_ACCESS,
  INVALID_HANDLE_VALUE,
  PROCESSENTRY32W,
  MODULEENTRY32W
} from './win32.js';

export interface ProcessInfo {
  pid: number;
  name: string;
  parentPid: number;
  threads: number;
}

export interface ModuleInfo {
  name: string;
  path: string;
  baseAddress: bigint;
  size: number;
}

export class ProcessManager {
  /**
   * Converte array de caracteres UTF-16 (char16_t) terminado em nulo para string JavaScript
   */
  private static decodeUtf16Array(arr: number[]): string {
    const chars: string[] = [];
    for (const code of arr) {
      if (code === 0) break;
      chars.push(String.fromCharCode(code));
    }
    return chars.join('');
  }

  /**
   * Lista todos os processos em execução no Windows
   */
  public static listProcesses(): ProcessInfo[] {
    const snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (snapshot === INVALID_HANDLE_VALUE || snapshot === 0) {
      throw new Error('Falha ao criar snapshot de processos.');
    }

    const processes: ProcessInfo[] = [];
    try {
      const entry: any = {
        dwSize: 568 // Tamanho de PROCESSENTRY32W no Windows x64
      };

      if (Process32FirstW(snapshot, entry)) {
        do {
          const name = ProcessManager.decodeUtf16Array(entry.szExeFile);
          processes.push({
            pid: entry.th32ProcessID,
            name,
            parentPid: entry.th32ParentProcessID,
            threads: entry.cntThreads
          });
        } while (Process32NextW(snapshot, entry));
      }
    } finally {
      CloseHandle(snapshot);
    }

    return processes;
  }

  /**
   * Localiza um processo pelo nome do executável (ex: Hades2.exe)
   */
  public static findProcessByName(name: string): ProcessInfo | null {
    const target = name.toLowerCase().trim();
    const list = this.listProcesses();
    return list.find(p => p.name.toLowerCase() === target) || null;
  }

  /**
   * Abre um handle para o processo com direitos de leitura, escrita e operação
   */
  public static openProcess(pid: number, desiredAccess: number = PROCESS_ALL_ACCESS): number {
    const handle = OpenProcess(desiredAccess, 0, pid);
    if (!handle || handle === 0) {
      throw new Error(`Falha ao abrir processo (PID: ${pid}). Verifique se possui permissões de Administrador.`);
    }
    return handle;
  }

  /**
   * Fecha um handle aberto de processo
   */
  public static closeProcess(handle: number): void {
    if (handle && handle !== 0) {
      CloseHandle(handle);
    }
  }

  /**
   * Obtém a lista de módulos (DLLs e executável principal) carregados pelo processo
   */
  public static getProcessModules(pid: number): ModuleInfo[] {
    const snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, pid);
    if (snapshot === INVALID_HANDLE_VALUE || snapshot === 0) {
      throw new Error(`Falha ao criar snapshot de módulos para o processo PID ${pid}.`);
    }

    const modules: ModuleInfo[] = [];
    try {
      const entry: any = {
        dwSize: 1080 // Tamanho aproximado de MODULEENTRY32W no x64
      };

      if (Module32FirstW(snapshot, entry)) {
        do {
          const name = ProcessManager.decodeUtf16Array(entry.szModule);
          const path = ProcessManager.decodeUtf16Array(entry.szExePath);
          modules.push({
            name,
            path,
            baseAddress: BigInt(entry.modBaseAddr),
            size: entry.modBaseSize
          });
        } while (Module32NextW(snapshot, entry));
      }
    } finally {
      CloseHandle(snapshot);
    }

    return modules;
  }

  /**
   * Retorna o endereço base do executável principal do processo
   */
  public static getMainModuleBase(pid: number, processName: string): bigint {
    const modules = this.getProcessModules(pid);
    const main = modules.find(m => m.name.toLowerCase() === processName.toLowerCase());
    if (!main) {
      if (modules.length > 0) return modules[0].baseAddress;
      throw new Error(`Módulo principal ${processName} não encontrado no processo.`);
    }
    return main.baseAddress;
  }
}
