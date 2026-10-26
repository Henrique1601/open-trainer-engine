import {
  VirtualQueryEx,
  MEM_COMMIT,
  PAGE_NOACCESS,
  PAGE_GUARD,
  MEMORY_BASIC_INFORMATION
} from './win32.js';
import { MemoryReaderWriter } from './memory-reader-writer.js';

export interface CompiledPattern {
  bytes: number[];
  mask: boolean[]; // true = compara byte, false = wildcard (??)
  raw: string;
}

export interface ScanOptions {
  startAddress?: bigint;
  stopAddress?: bigint;
  maxResults?: number;
  writableOnly?: boolean;
  executableOnly?: boolean;
}

export class AOBScanner {
  constructor(
    private readonly handle: number,
    private readonly memory: MemoryReaderWriter
  ) {}

  /**
   * Compila uma string de padrão de bytes AOB com wildcards ('??' ou '?')
   * Exemplo: "89 46 24 48 8B 05 ?? ?? ?? ??"
   */
  public static compilePattern(pattern: string): CompiledPattern {
    const tokens = pattern.trim().split(/\s+/);
    const bytes: number[] = [];
    const mask: boolean[] = [];

    for (const token of tokens) {
      if (token === '??' || token === '?' || token === '*') {
        bytes.push(0x00);
        mask.push(false);
      } else {
        const val = parseInt(token, 16);
        if (isNaN(val) || val < 0 || val > 255) {
          throw new Error(`Token AOB inválido: '${token}' no padrão '${pattern}'`);
        }
        bytes.push(val);
        mask.push(true);
      }
    }

    if (bytes.length === 0) {
      throw new Error('Padrão AOB vazio.');
    }

    return { bytes, mask, raw: pattern };
  }

  /**
   * Busca um padrão compilado diretamente dentro de um Buffer em memória (método ultrarrápido)
   */
  public static findInBytes(
    buffer: Buffer,
    pattern: CompiledPattern,
    maxMatches = 1
  ): number[] {
    const { bytes, mask } = pattern;
    const patternLen = bytes.length;
    const bufLen = buffer.length;
    const matches: number[] = [];

    if (patternLen > bufLen) return matches;

    const firstByte = bytes[0];
    const firstMask = mask[0];

    for (let i = 0; i <= bufLen - patternLen; i++) {
      if (firstMask && buffer[i] !== firstByte) {
        continue;
      }

      let matched = true;
      for (let j = 1; j < patternLen; j++) {
        if (mask[j] && buffer[i + j] !== bytes[j]) {
          matched = false;
          break;
        }
      }

      if (matched) {
        matches.push(i);
        if (matches.length >= maxMatches) {
          break;
        }
      }
    }

    return matches;
  }

  /**
   * Varre a memória virtual do processo alvo procurando o padrão AOB
   */
  public scan(patternStr: string, options: ScanOptions = {}): bigint[] {
    const pattern = AOBScanner.compilePattern(patternStr);
    const results: bigint[] = [];
    const max = options.maxResults ?? 1;

    let currentAddress = options.startAddress ?? 0x10000n;
    const stopAddress = options.stopAddress ?? 0x7FFFFFFFFFFFn;

    const mbi: any = {};
    const mbiSize = 48; // Tamanho de MEMORY_BASIC_INFORMATION

    while (currentAddress < stopAddress) {
      const querySize = VirtualQueryEx(this.handle, Number(currentAddress), mbi, mbiSize);
      if (querySize === 0) {
        break;
      }

      const regionBase = BigInt(mbi.BaseAddress);
      const regionSize = BigInt(mbi.RegionSize);
      const state = Number(mbi.State);
      const protect = Number(mbi.Protect);

      const isCommitted = state === MEM_COMMIT;
      const isReadable = !(protect & PAGE_NOACCESS) && !(protect & PAGE_GUARD);

      if (isCommitted && isReadable && regionSize > 0n) {
        // Lê a página em blocos para não alocar buffers gigantes
        const chunkSize = 65536; // 64 KB por leitura
        let chunkOffset = 0n;

        while (chunkOffset < regionSize) {
          const bytesToRead = Number(
            regionSize - chunkOffset < BigInt(chunkSize)
              ? regionSize - chunkOffset
              : BigInt(chunkSize)
          );

          const readAddress = regionBase + chunkOffset;

          try {
            const buf = this.memory.readBytes(readAddress, bytesToRead);
            const matches = AOBScanner.findInBytes(buf, pattern, max - results.length);

            for (const offset of matches) {
              results.push(readAddress + BigInt(offset));
              if (results.length >= max) {
                return results;
              }
            }
          } catch {
            // Se a leitura falhou em bloco protegido, avança para próxima página
            break;
          }

          chunkOffset += BigInt(bytesToRead) - BigInt(pattern.bytes.length - 1);
        }
      }

      currentAddress = regionBase + regionSize;
    }

    return results;
  }

  /**
   * Encontra a primeira ocorrência do padrão AOB na memória do processo
   */
  public findFirst(patternStr: string, options: ScanOptions = {}): bigint | null {
    const res = this.scan(patternStr, { ...options, maxResults: 1 });
    return res.length > 0 ? res[0] : null;
  }
}
