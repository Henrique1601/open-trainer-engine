import { EventEmitter } from 'node:events';
import { ProcessManager, ProcessInfo } from '../memory/process-manager.js';
import { MemoryReaderWriter } from '../memory/memory-reader-writer.js';
import { PointerResolver } from '../memory/pointer-resolver.js';
import { AOBScanner } from '../memory/aob-scanner.js';
import { CodeCaveInjector } from '../memory/code-cave-injector.js';
import { AntiCheatDetector } from '../security/anti-cheat-detector.js';
import { TrainerContract, CheatDefinition, TrainerLaunchState } from './trainer-contract.js';

interface ActiveAobPatch {
  address: bigint;
  originalBytes: Buffer;
  patchBytes: Buffer;
}

interface ActivePointerFreeze {
  timer: NodeJS.Timeout;
  address: bigint;
  value: any;
  valueType: string;
}

export class TrainerSession extends EventEmitter {
  private state: TrainerLaunchState = TrainerLaunchState.Idle;
  private processHandle: number | null = null;
  private processInfo: ProcessInfo | null = null;
  private mainModuleBase: bigint = 0n;

  private memory: MemoryReaderWriter | null = null;
  private pointerResolver: PointerResolver | null = null;
  private aobScanner: AOBScanner | null = null;
  private caveInjector: CodeCaveInjector | null = null;

  private activeAobPatches = new Map<string, ActiveAobPatch>();
  private activeFreezes = new Map<string, ActivePointerFreeze>();
  private activeCheatIds = new Set<string>();

  constructor(public readonly contract: TrainerContract) {
    super();
  }

  public getState(): TrainerLaunchState {
    return this.state;
  }

  public getActiveCheats(): string[] {
    return Array.from(this.activeCheatIds);
  }

  private transition(newState: TrainerLaunchState): void {
    const oldState = this.state;
    this.state = newState;
    this.emit('stateChanged', { from: oldState, to: newState });
  }

  /**
   * Converte uma string hexadecimal separada por espaços em Buffer
   */
  private static parseByteString(hexStr: string): Buffer {
    const cleaned = hexStr.trim().split(/\s+/).filter(x => x !== '??' && x !== '?' && x !== '*');
    return Buffer.from(cleaned.map(h => parseInt(h, 16)));
  }

  /**
   * Inicializa a sessão com o jogo executando as 14 etapas da máquina de estados
   */
  public async attach(): Promise<boolean> {
    try {
      this.transition(TrainerLaunchState.AcquiringBinary);
      // Validação do contrato em memória
      this.transition(TrainerLaunchState.EnsuringBinaryAccess);
      this.transition(TrainerLaunchState.CheckingInternalBinaries);

      // Validação de Segurança Contra Anti-Cheats Ativos (Safe Guard)
      try {
        const running = ProcessManager.listProcesses().map(p => p.name);
        const check = AntiCheatDetector.isSafeToInject(this.contract.processName, running);
        if (!check.safe) {
          throw new Error(check.reason || 'Injeção bloqueada por detecção de software anti-cheat ativo.');
        }
      } catch (secErr: any) {
        if (secErr.message && secErr.message.includes('bloqueada')) {
          throw secErr;
        }
        // Se a listagem falhar, segue com precaução
      }

      // Localiza o processo do jogo
      this.transition(TrainerLaunchState.FindingProcess);
      const proc = ProcessManager.findProcessByName(this.contract.processName);
      if (!proc) {
        throw new Error(`Processo '${this.contract.processName}' não encontrado. O jogo está aberto?`);
      }
      this.processInfo = proc;

      // Abre handle e valida módulo
      this.transition(TrainerLaunchState.ValidatingProcess);
      this.processHandle = ProcessManager.openProcess(proc.pid);
      this.mainModuleBase = ProcessManager.getMainModuleBase(proc.pid, this.contract.processName);

      // Cria os componentes do Trainer Host
      this.transition(TrainerLaunchState.CreatingTrainerHost);
      this.memory = new MemoryReaderWriter(this.processHandle);
      this.pointerResolver = new PointerResolver(this.memory, true);
      this.aobScanner = new AOBScanner(this.processHandle, this.memory);
      this.caveInjector = new CodeCaveInjector(this.processHandle, this.memory);

      this.transition(TrainerLaunchState.Injecting);
      this.transition(TrainerLaunchState.InitializingIpc);
      this.transition(TrainerLaunchState.Executing);
      this.transition(TrainerLaunchState.Connecting);
      this.transition(TrainerLaunchState.Activating);

      this.transition(TrainerLaunchState.Active);
      return true;
    } catch (err: any) {
      this.detach();
      throw err;
    }
  }

  /**
   * Ativa ou desativa um cheat específico
   */
  public toggleCheat(cheatId: string, forceState?: boolean): boolean {
    if (this.state !== TrainerLaunchState.Active) {
      throw new Error(`Não é possível alternar cheats. O trainer não está no estado Active (atual: ${this.state})`);
    }

    const cheat = this.contract.cheats.find(c => c.id === cheatId);
    if (!cheat) {
      throw new Error(`Cheat com ID '${cheatId}' não encontrado no contrato.`);
    }

    const shouldEnable = forceState !== undefined ? forceState : !this.activeCheatIds.has(cheatId);

    if (shouldEnable) {
      this.enableCheat(cheat);
      this.activeCheatIds.add(cheatId);
    } else {
      this.disableCheat(cheat);
      this.activeCheatIds.delete(cheatId);
    }

    this.emit('cheatToggled', { cheatId, enabled: shouldEnable });
    return shouldEnable;
  }

  /**
   * Aplica a ativação de um cheat
   */
  private enableCheat(cheat: CheatDefinition): void {
    if (!this.memory || !this.aobScanner || !this.pointerResolver) {
      throw new Error('TrainerSession não inicializada.');
    }

    if (cheat.type === 'aob_patch') {
      const targetAddress = this.aobScanner.findFirst(cheat.pattern!);
      if (!targetAddress) {
        throw new Error(
          `Assinatura AOB para '${cheat.name}' não encontrada na versão atual do jogo.`
        );
      }

      const patchBytes = TrainerSession.parseByteString(cheat.replace!);
      const originalBytes = this.memory.readBytes(targetAddress, patchBytes.length);

      // Escreve os novos bytes (NOPs ou código alternativo)
      this.memory.writeBytes(targetAddress, patchBytes);

      this.activeAobPatches.set(cheat.id, {
        address: targetAddress,
        originalBytes,
        patchBytes
      });
    } else if (cheat.type === 'pointer_freeze') {
      // Resolve a cadeia de ponteiros a partir do módulo base do jogo
      const finalAddress = this.pointerResolver.resolvePointerChain(
        this.mainModuleBase,
        cheat.pointerChain!
      );

      const val = cheat.value!;
      const vType = cheat.valueType || 'int32';

      // Escreve o valor inicial
      this.writeTypedValue(finalAddress, val, vType);

      // Inicia o timer de congelamento (atualização a cada 100ms)
      const timer = setInterval(() => {
        try {
          this.writeTypedValue(finalAddress, val, vType);
        } catch {
          // Ignora se o jogo fechar abruptamente
        }
      }, 100);

      this.activeFreezes.set(cheat.id, {
        timer,
        address: finalAddress,
        value: val,
        valueType: vType
      });
    }
  }

  /**
   * Escreve valor tipado no endereço de memória
   */
  private writeTypedValue(address: bigint, value: any, valueType: string): void {
    if (!this.memory) return;
    switch (valueType) {
      case 'int32':
        this.memory.writeInt32(address, Number(value));
        break;
      case 'float':
        this.memory.writeFloat(address, Number(value));
        break;
      case 'double':
        this.memory.writeDouble(address, Number(value));
        break;
      case 'int64':
        this.memory.writeInt64(address, BigInt(value));
        break;
      case 'int16':
        this.memory.writeInt16(address, Number(value));
        break;
      case 'int8':
      case 'byte':
        this.memory.writeInt8(address, Number(value));
        break;
      default:
        this.memory.writeInt32(address, Number(value));
    }
  }

  /**
   * Desativa um cheat restaurando o estado original da memória
   */
  private disableCheat(cheat: CheatDefinition): void {
    if (!this.memory) return;

    if (cheat.type === 'aob_patch') {
      const patch = this.activeAobPatches.get(cheat.id);
      if (patch) {
        // Restaura os bytes originais de forma limpa
        this.memory.writeBytes(patch.address, patch.originalBytes);
        this.activeAobPatches.delete(cheat.id);
      }
    } else if (cheat.type === 'pointer_freeze') {
      const freeze = this.activeFreezes.get(cheat.id);
      if (freeze) {
        clearInterval(freeze.timer);
        this.activeFreezes.delete(cheat.id);
      }
    }
  }

  /**
   * Desconecta o trainer, desfazendo todos os patches e fechando os handles
   */
  public detach(): void {
    this.transition(TrainerLaunchState.Detaching);

    // Desativa todos os cheats ativos e restaura a memória do jogo
    for (const cheatId of Array.from(this.activeCheatIds)) {
      const cheat = this.contract.cheats.find(c => c.id === cheatId);
      if (cheat) {
        this.disableCheat(cheat);
      }
    }
    this.activeCheatIds.clear();

    // Remove todos os hooks de code cave
    if (this.caveInjector) {
      this.caveInjector.removeAllHooks();
    }

    // Fecha o handle do processo
    if (this.processHandle) {
      ProcessManager.closeProcess(this.processHandle);
      this.processHandle = null;
    }

    this.transition(TrainerLaunchState.Ended);
  }
}
