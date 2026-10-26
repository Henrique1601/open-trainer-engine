import {
  ReadProcessMemory,
  WriteProcessMemory,
  VirtualProtectEx,
  PAGE_EXECUTE_READWRITE
} from './win32.js';

export class MemoryReaderWriter {
  constructor(private readonly handle: number) {}

  /**
   * Lê um buffer bruto de bytes da memória do processo
   */
  public readBytes(address: bigint, size: number): Buffer {
    const buffer = Buffer.alloc(size);
    const bytesRead = [0];

    const success = ReadProcessMemory(
      this.handle,
      Number(address),
      buffer,
      size,
      bytesRead
    );

    if (!success) {
      throw new Error(`Falha ao ler ${size} bytes no endereço 0x${address.toString(16).toUpperCase()}`);
    }

    return buffer;
  }

  /**
   * Escreve um buffer de bytes na memória do processo, alterando proteções se necessário
   */
  public writeBytes(address: bigint, buffer: Buffer, changeProtection = true): boolean {
    const oldProtect = [0];
    const size = buffer.length;

    if (changeProtection) {
      VirtualProtectEx(this.handle, Number(address), size, PAGE_EXECUTE_READWRITE, oldProtect);
    }

    const bytesWritten = [0];
    const success = WriteProcessMemory(
      this.handle,
      Number(address),
      buffer,
      size,
      bytesWritten
    );

    if (changeProtection && oldProtect[0] !== 0) {
      const dummy = [0];
      VirtualProtectEx(this.handle, Number(address), size, oldProtect[0], dummy);
    }

    if (!success) {
      throw new Error(`Falha ao escrever ${size} bytes no endereço 0x${address.toString(16).toUpperCase()}`);
    }

    return true;
  }

  // ============================================================================
  // Leituras Tipadas
  // ============================================================================
  public readInt8(address: bigint): number {
    return this.readBytes(address, 1).readInt8(0);
  }

  public readUInt8(address: bigint): number {
    return this.readBytes(address, 1).readUInt8(0);
  }

  public readInt16(address: bigint): number {
    return this.readBytes(address, 2).readInt16LE(0);
  }

  public readUInt16(address: bigint): number {
    return this.readBytes(address, 2).readUInt16LE(0);
  }

  public readInt32(address: bigint): number {
    return this.readBytes(address, 4).readInt32LE(0);
  }

  public readUInt32(address: bigint): number {
    return this.readBytes(address, 4).readUInt32LE(0);
  }

  public readInt64(address: bigint): bigint {
    return this.readBytes(address, 8).readBigInt64LE(0);
  }

  public readUInt64(address: bigint): bigint {
    return this.readBytes(address, 8).readBigUInt64LE(0);
  }

  public readFloat(address: bigint): number {
    return this.readBytes(address, 4).readFloatLE(0);
  }

  public readDouble(address: bigint): number {
    return this.readBytes(address, 8).readDoubleLE(0);
  }

  public readString(address: bigint, maxLength = 256, encoding: BufferEncoding = 'utf8'): string {
    const buf = this.readBytes(address, maxLength);
    const nullIdx = buf.indexOf(0);
    const slice = nullIdx !== -1 ? buf.subarray(0, nullIdx) : buf;
    return slice.toString(encoding);
  }

  // ============================================================================
  // Escritas Tipadas
  // ============================================================================
  public writeInt8(address: bigint, value: number): boolean {
    const buf = Buffer.alloc(1);
    buf.writeInt8(value, 0);
    return this.writeBytes(address, buf);
  }

  public writeUInt8(address: bigint, value: number): boolean {
    const buf = Buffer.alloc(1);
    buf.writeUInt8(value, 0);
    return this.writeBytes(address, buf);
  }

  public writeInt16(address: bigint, value: number): boolean {
    const buf = Buffer.alloc(2);
    buf.writeInt16LE(value, 0);
    return this.writeBytes(address, buf);
  }

  public writeUInt16(address: bigint, value: number): boolean {
    const buf = Buffer.alloc(2);
    buf.writeUInt16LE(value, 0);
    return this.writeBytes(address, buf);
  }

  public writeInt32(address: bigint, value: number): boolean {
    const buf = Buffer.alloc(4);
    buf.writeInt32LE(value, 0);
    return this.writeBytes(address, buf);
  }

  public writeUInt32(address: bigint, value: number): boolean {
    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(value, 0);
    return this.writeBytes(address, buf);
  }

  public writeInt64(address: bigint, value: bigint): boolean {
    const buf = Buffer.alloc(8);
    buf.writeBigInt64LE(value, 0);
    return this.writeBytes(address, buf);
  }

  public writeUInt64(address: bigint, value: bigint): boolean {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(value, 0);
    return this.writeBytes(address, buf);
  }

  public writeFloat(address: bigint, value: number): boolean {
    const buf = Buffer.alloc(4);
    buf.writeFloatLE(value, 0);
    return this.writeBytes(address, buf);
  }

  public writeDouble(address: bigint, value: number): boolean {
    const buf = Buffer.alloc(8);
    buf.writeDoubleLE(value, 0);
    return this.writeBytes(address, buf);
  }
}
