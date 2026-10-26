import {
  VirtualAllocEx,
  VirtualFreeEx,
  MEM_COMMIT,
  MEM_RESERVE,
  MEM_RELEASE,
  PAGE_EXECUTE_READWRITE
} from './win32.js';
import { MemoryReaderWriter } from './memory-reader-writer.js';

export interface ActiveHook {
  id: string;
  targetAddress: bigint;
  caveAddress: bigint;
  originalBytes: Buffer;
  hookSize: number;
}

export class CodeCaveInjector {
  private activeHooks = new Map<string, ActiveHook>();

  constructor(
    private readonly handle: number,
    private readonly memory: MemoryReaderWriter
  ) {}

  /**
   * Aloca uma página de memória executável no processo alvo
   */
  public allocateCave(size = 1024): bigint {
    const addr = VirtualAllocEx(
      this.handle,
      0,
      size,
      MEM_COMMIT | MEM_RESERVE,
      PAGE_EXECUTE_READWRITE
    );

    if (!addr || addr === 0) {
      throw new Error(`Falha ao alocar ${size} bytes de memória executável remota.`);
    }

    return BigInt(addr);
  }

  /**
   * Libera a página de memória executável remota
   */
  public freeCave(address: bigint): boolean {
    const success = VirtualFreeEx(this.handle, Number(address), 0, MEM_RELEASE);
    return success !== 0;
  }

  /**
   * Cria um salto x64 absoluto para um endereço (14 bytes):
   * FF 25 00 00 00 00 [8 bytes de endereço de 64 bits]
   */
  public static createX64AbsoluteJmp(targetAddress: bigint): Buffer {
    const buf = Buffer.alloc(14);
    // opcode: jmp qword ptr [rip + 0]
    buf[0] = 0xff;
    buf[1] = 0x25;
    buf[2] = 0x00;
    buf[3] = 0x00;
    buf[4] = 0x00;
    buf[5] = 0x00;
    buf.writeBigUInt64LE(targetAddress, 6);
    return buf;
  }

  /**
   * Injeta um hook de desvio (detour) no endereço alvo:
   * 1. Aloca code cave remota
   * 2. Salva bytes originais
   * 3. Escreve payload na code cave + jmp de retorno
   * 4. Escreve jmp na função do jogo desviando para a code cave
   */
  public createHook(
    hookId: string,
    targetAddress: bigint,
    payloadBytes: Buffer,
    stolenBytesCount: number
  ): ActiveHook {
    if (this.activeHooks.has(hookId)) {
      throw new Error(`Hook com ID '${hookId}' já existe.`);
    }

    if (stolenBytesCount < 14) {
      throw new Error(
        `stolenBytesCount deve ser de no mínimo 14 bytes para acomodar o salto x64 absoluto. Fornecido: ${stolenBytesCount}`
      );
    }

    // Salva os bytes originais da instrução do jogo
    const originalBytes = this.memory.readBytes(targetAddress, stolenBytesCount);

    // Aloca a code cave
    const caveAddress = this.allocateCave(1024);

    // Constrói o buffer da code cave: Payload + Retorno para (targetAddress + stolenBytesCount)
    const returnAddress = targetAddress + BigInt(stolenBytesCount);
    const returnJmp = CodeCaveInjector.createX64AbsoluteJmp(returnAddress);

    const fullCavePayload = Buffer.concat([payloadBytes, returnJmp]);
    this.memory.writeBytes(caveAddress, fullCavePayload);

    // Constrói o trampolim no jogo: jmp caveAddress + NOPs para os bytes restantes
    const hookJmp = CodeCaveInjector.createX64AbsoluteJmp(caveAddress);
    const hookBuffer = Buffer.alloc(stolenBytesCount, 0x90); // Preenche tudo com NOP (0x90)
    hookJmp.copy(hookBuffer, 0);

    // Escreve o desvio na função do jogo
    this.memory.writeBytes(targetAddress, hookBuffer);

    const hook: ActiveHook = {
      id: hookId,
      targetAddress,
      caveAddress,
      originalBytes,
      hookSize: stolenBytesCount
    };

    this.activeHooks.set(hookId, hook);
    return hook;
  }

  /**
   * Remove o hook e restaura os bytes originais na memória do jogo
   */
  public removeHook(hookId: string): boolean {
    const hook = this.activeHooks.get(hookId);
    if (!hook) return false;

    // Restaura os bytes originais
    this.memory.writeBytes(hook.targetAddress, hook.originalBytes);

    // Libera a memória da code cave
    this.freeCave(hook.caveAddress);

    this.activeHooks.delete(hookId);
    return true;
  }

  /**
   * Remove todos os hooks ativos com segurança
   */
  public removeAllHooks(): void {
    for (const hookId of Array.from(this.activeHooks.keys())) {
      this.removeHook(hookId);
    }
  }
}
