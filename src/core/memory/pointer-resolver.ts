import { MemoryReaderWriter } from './memory-reader-writer.js';

export class PointerResolver {
  constructor(
    private readonly memory: MemoryReaderWriter,
    private readonly is64Bit = true
  ) {}

  /**
   * Converte uma string ou número de offset para BigInt
   */
  public static parseOffset(offset: string | number | bigint): bigint {
    if (typeof offset === 'bigint') return offset;
    if (typeof offset === 'number') return BigInt(offset);
    const cleaned = offset.trim();
    if (cleaned.startsWith('0x') || cleaned.startsWith('0X')) {
      return BigInt(cleaned);
    }
    return BigInt(cleaned);
  }

  /**
   * Resolve uma cadeia multinível de ponteiros
   * Exemplo: baseAddress + 0x38 -> lê ptr -> + 0x120 -> endereço final
   */
  public resolvePointerChain(
    baseAddress: bigint,
    offsets: (string | number | bigint)[]
  ): bigint {
    if (offsets.length === 0) {
      return baseAddress;
    }

    let currentAddress = baseAddress;

    // Percorre até o penúltimo offset desreferenciando o ponteiro
    for (let i = 0; i < offsets.length - 1; i++) {
      const offset = PointerResolver.parseOffset(offsets[i]);
      const pointerLocation = currentAddress + offset;

      const pointerValue = this.is64Bit
        ? this.memory.readUInt64(pointerLocation)
        : BigInt(this.memory.readUInt32(pointerLocation));

      if (pointerValue === 0n) {
        throw new Error(
          `Ponteiro nulo (0x0) encontrado no nível ${i} ao desreferenciar 0x${pointerLocation.toString(16).toUpperCase()}`
        );
      }

      currentAddress = pointerValue;
    }

    // Adiciona o último offset para obter o endereço final da variável
    const finalOffset = PointerResolver.parseOffset(offsets[offsets.length - 1]);
    return currentAddress + finalOffset;
  }
}
