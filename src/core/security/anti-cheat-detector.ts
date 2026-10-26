/**
 * Open Trainer Engine - Anti-Cheat Safe Guard
 * Detecta e bloqueia injeções em jogos protegidos por anti-cheats multiplayer/kernel
 * para proteger a conta do usuário contra banimentos acidentais.
 */

export interface AntiCheatDefinition {
  id: string;
  name: string;
  vendor: string;
  processNames: string[];
  kernelDrivers: string[];
  description: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface AntiCheatDetectionResult {
  detected: boolean;
  blocked: boolean;
  matches: {
    antiCheat: AntiCheatDefinition;
    matchedProcess?: string;
  }[];
  reason?: string;
}

export class AntiCheatDetector {
  public static readonly KNOWN_ANTI_CHEATS: AntiCheatDefinition[] = [
    {
      id: 'eac',
      name: 'Easy Anti-Cheat (Epic Games)',
      vendor: 'Epic Games / Kamu',
      processNames: ['easyanticheat.exe', 'easyanticheat_eos.exe', 'start_protected_game.exe', 'eac_server.exe'],
      kernelDrivers: ['easyanticheat.sys', 'easyanticheat_eos.sys'],
      description: 'Anti-cheat em nível de kernel comum em Apex Legends, Fortnite, Rust e Elden Ring (Online).',
      riskLevel: 'CRITICAL'
    },
    {
      id: 'battleye',
      name: 'BattlEye',
      vendor: 'BattlEye Innovations',
      processNames: ['beservice.exe', 'beservice_x64.exe', 'beclient.exe'],
      kernelDrivers: ['bedaisy.sys'],
      description: 'Anti-cheat utilizado em Rainbow Six Siege, Destiny 2, DayZ e PUBG.',
      riskLevel: 'CRITICAL'
    },
    {
      id: 'vanguard',
      name: 'Riot Vanguard',
      vendor: 'Riot Games',
      processNames: ['vgc.exe'],
      kernelDrivers: ['vgk.sys'],
      description: 'Kernel driver de alta restrição utilizado em Valorant e League of Legends.',
      riskLevel: 'CRITICAL'
    },
    {
      id: 'ricochet',
      name: 'Ricochet Anti-Cheat',
      vendor: 'Activision',
      processNames: ['cod.exe', 'bootstrapper.exe'],
      kernelDrivers: ['randgrid.sys'],
      description: 'Kernel driver anti-cheat de Call of Duty: Warzone e Modern Warfare.',
      riskLevel: 'CRITICAL'
    },
    {
      id: 'denuvo_ac',
      name: 'Denuvo Anti-Cheat',
      vendor: 'Irdeto',
      processNames: ['denuvo-anti-cheat.exe', 'dac.exe'],
      kernelDrivers: ['denuvo-anti-cheat.sys'],
      description: 'Anti-cheat integrado a nível de driver.',
      riskLevel: 'HIGH'
    },
    {
      id: 'gameguard',
      name: 'nProtect GameGuard',
      vendor: 'INCA Internet',
      processNames: ['gamemon.des', 'gamemon64.des'],
      kernelDrivers: ['npgg9x.sys', 'npggnt.sys'],
      description: 'Sistema anti-cheat utilizado em Helldivers 2 e Blade & Soul.',
      riskLevel: 'CRITICAL'
    },
    {
      id: 'xigncode',
      name: 'XignCode3',
      vendor: 'Wellbia',
      processNames: ['xigncode.exe', 'xcorona.xem'],
      kernelDrivers: ['xhunter1.sys'],
      description: 'Anti-cheat coreano comum em MMORPGs.',
      riskLevel: 'HIGH'
    }
  ];

  /**
   * Avalia a lista de processos ativos no sistema em busca de serviços ou processos de anti-cheat
   */
  public static checkRunningProcesses(runningProcesses: string[]): AntiCheatDetectionResult {
    const normalizedRunning = new Set(
      runningProcesses.map((p) => p.trim().toLowerCase())
    );

    const matches: AntiCheatDetectionResult['matches'] = [];

    for (const ac of this.KNOWN_ANTI_CHEATS) {
      for (const targetProc of ac.processNames) {
        if (normalizedRunning.has(targetProc.toLowerCase())) {
          matches.push({
            antiCheat: ac,
            matchedProcess: targetProc
          });
          break;
        }
      }
    }

    if (matches.length > 0) {
      const names = matches.map((m) => m.antiCheat.name).join(', ');
      return {
        detected: true,
        blocked: true,
        matches,
        reason: `Injeção bloqueada por segurança: detectado software anti-cheat ativo (${names}). Desative o modo online ou jogue em modo offline para evitar banimentos.`
      };
    }

    return {
      detected: false,
      blocked: false,
      matches: []
    };
  }

  /**
   * Verifica se é seguro anexar a um processo alvo específico
   */
  public static isSafeToInject(
    targetProcessName: string,
    runningProcesses: string[],
    allowForceBypass = false
  ): { safe: boolean; reason?: string; detectedAntiCheats: string[] } {
    const check = this.checkRunningProcesses(runningProcesses);

    if (check.blocked && !allowForceBypass) {
      return {
        safe: false,
        reason: check.reason,
        detectedAntiCheats: check.matches.map((m) => m.antiCheat.name)
      };
    }

    return {
      safe: true,
      detectedAntiCheats: check.matches.map((m) => m.antiCheat.name)
    };
  }
}
