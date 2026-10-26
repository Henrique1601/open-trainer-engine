import { MemoryReaderWriter } from '../memory/memory-reader-writer.js';
import { AOBScanner } from '../memory/aob-scanner.js';
import {
  VirtualQueryEx,
  MEM_COMMIT,
  PAGE_NOACCESS,
  PAGE_GUARD
} from '../memory/win32.js';
import { TrainerContract, CheatDefinition, ValueType } from '../trainer/trainer-contract.js';

export type ScanComparisonType =
  | 'ExactValue'
  | 'IncreasedValue'
  | 'DecreasedValue'
  | 'ChangedValue'
  | 'UnchangedValue';

export interface ScanMatch {
  address: bigint;
  previousValue: number | bigint;
  currentValue: number | bigint;
}

export class MemoryScannerStudio {
  private lastResults: ScanMatch[] = [];

  constructor(
    private readonly handle: number,
    private readonly memory: MemoryReaderWriter
  ) {}

  public getResultsCount(): number {
    return this.lastResults.length;
  }

  public getResults(limit = 100): ScanMatch[] {
    return this.lastResults.slice(0, limit);
  }

  public clear(): void {
    this.lastResults = [];
  }

  /**
   * Lê um valor tipado de um buffer em um offset específico
   */
  private static readValueFromBuffer(
    buffer: Buffer,
    offset: number,
    type: ValueType
  ): number | bigint {
    switch (type) {
      case 'int8':
      case 'byte':
        return buffer.readInt8(offset);
      case 'int16':
        return buffer.readInt16LE(offset);
      case 'int32':
        return buffer.readInt32LE(offset);
      case 'int64':
        return buffer.readBigInt64LE(offset);
      case 'float':
        return Math.round(buffer.readFloatLE(offset) * 1000) / 1000;
      case 'double':
        return Math.round(buffer.readDoubleLE(offset) * 1000) / 1000;
      default:
        return buffer.readInt32LE(offset);
    }
  }

  /**
   * Primeiro Escaneamento (First Scan): Varre a memória inteira procurando o valor inicial
   */
  public firstScan(
    targetValue: number | bigint,
    valueType: ValueType = 'int32',
    alignment = 4,
    maxResults = 50000
  ): number {
    this.lastResults = [];
    const step = Math.max(1, alignment);
    const valSize = valueType === 'int64' || valueType === 'double' ? 8 : valueType === 'int16' ? 2 : valueType === 'int8' ? 1 : 4;

    let currentAddress = 0x10000n;
    const stopAddress = 0x7FFFFFFFFFFFn;

    const mbi: any = {};
    const mbiSize = 48;

    while (currentAddress < stopAddress && this.lastResults.length < maxResults) {
      const querySize = VirtualQueryEx(this.handle, Number(currentAddress), mbi, mbiSize);
      if (querySize === 0) break;

      const regionBase = BigInt(mbi.BaseAddress);
      const regionSize = BigInt(mbi.RegionSize);
      const state = Number(mbi.State);
      const protect = Number(mbi.Protect);

      const isCommitted = state === MEM_COMMIT;
      const isReadable = !(protect & PAGE_NOACCESS) && !(protect & PAGE_GUARD);

      if (isCommitted && isReadable && regionSize > 0n) {
        const chunkSize = 65536; // 64 KB
        let chunkOffset = 0n;

        while (chunkOffset < regionSize && this.lastResults.length < maxResults) {
          const bytesToRead = Number(
            regionSize - chunkOffset < BigInt(chunkSize)
              ? regionSize - chunkOffset
              : BigInt(chunkSize)
          );

          const readAddress = regionBase + chunkOffset;

          try {
            const buf = this.memory.readBytes(readAddress, bytesToRead);
            const limit = bytesToRead - valSize;

            for (let i = 0; i <= limit; i += step) {
              const currentVal = MemoryScannerStudio.readValueFromBuffer(buf, i, valueType);

              if (currentVal === targetValue) {
                const matchAddr = readAddress + BigInt(i);
                this.lastResults.push({
                  address: matchAddr,
                  previousValue: currentVal,
                  currentValue: currentVal
                });

                if (this.lastResults.length >= maxResults) break;
              }
            }
          } catch {
            break;
          }

          chunkOffset += BigInt(bytesToRead) - BigInt(valSize);
        }
      }

      currentAddress = regionBase + regionSize;
    }

    return this.lastResults.length;
  }

  /**
   * Próximo Escaneamento (Next Scan): Filtra os resultados anteriores com base no novo valor ou critério
   */
  public nextScan(
    comparison: ScanComparisonType,
    targetValue?: number | bigint,
    valueType: ValueType = 'int32'
  ): number {
    const filtered: ScanMatch[] = [];

    for (const match of this.lastResults) {
      try {
        let currentVal: number | bigint;
        switch (valueType) {
          case 'int8':
          case 'byte':
            currentVal = this.memory.readInt8(match.address);
            break;
          case 'int16':
            currentVal = this.memory.readInt16(match.address);
            break;
          case 'int32':
            currentVal = this.memory.readInt32(match.address);
            break;
          case 'int64':
            currentVal = this.memory.readInt64(match.address);
            break;
          case 'float':
            currentVal = Math.round(this.memory.readFloat(match.address) * 1000) / 1000;
            break;
          case 'double':
            currentVal = Math.round(this.memory.readDouble(match.address) * 1000) / 1000;
            break;
          default:
            currentVal = this.memory.readInt32(match.address);
        }

        let isMatch = false;
        switch (comparison) {
          case 'ExactValue':
            isMatch = targetValue !== undefined && currentVal === targetValue;
            break;
          case 'IncreasedValue':
            isMatch = currentVal > match.previousValue;
            break;
          case 'DecreasedValue':
            isMatch = currentVal < match.previousValue;
            break;
          case 'ChangedValue':
            isMatch = currentVal !== match.previousValue;
            break;
          case 'UnchangedValue':
            isMatch = currentVal === match.previousValue;
            break;
        }

        if (isMatch) {
          filtered.push({
            address: match.address,
            previousValue: currentVal,
            currentValue: currentVal
          });
        }
      } catch {
        // Ignora se o endereço deixou de ser acessível
      }
    }

    this.lastResults = filtered;
    return this.lastResults.length;
  }

  /**
   * Gera uma assinatura AOB com wildcards a partir de um endereço de instrução em memória
   */
  public generateAOBPattern(address: bigint, windowSize = 24): { pattern: string; replace: string } {
    const half = Math.floor(windowSize / 2);
    const startAddr = address - BigInt(half);
    const buf = this.memory.readBytes(startAddr, windowSize);

    const patternTokens: string[] = [];
    const replaceTokens: string[] = [];

    for (let i = 0; i < buf.length; i++) {
      const b = buf[i];
      const currentByteAddr = startAddr + BigInt(i);

      // Se for a instrução alvo exata, coloca NOP (0x90) para o patch
      if (currentByteAddr >= address && currentByteAddr < address + 3n) {
        patternTokens.push(b.toString(16).padStart(2, '0').toUpperCase());
        replaceTokens.push('90');
      } else if (i % 5 === 0 && i !== half) {
        // Aplica wildcards estratégicos em offsets de registradores relativos
        patternTokens.push('??');
        replaceTokens.push('??');
      } else {
        const hex = b.toString(16).padStart(2, '0').toUpperCase();
        patternTokens.push(hex);
        replaceTokens.push(hex);
      }
    }

    return {
      pattern: patternTokens.join(' '),
      replace: replaceTokens.join(' ')
    };
  }

  /**
   * Cria um TrainerContract pronto para ser salvo na pasta configs/
   */
  public static createTrainerContract(
    gameId: string,
    gameTitle: string,
    processName: string,
    cheats: CheatDefinition[]
  ): TrainerContract {
    return {
      id: gameId,
      title: gameTitle,
      processName,
      version: '1.0.0',
      supportedPlatforms: ['steam', 'epic', 'standalone'],
      cheats
    };
  }
}
