/**
 * Open Trainer Engine - Hex Memory Viewer & Mini-Disassembler
 * Formata blocos de memória em grade hexadecimal e ASCII para inspeção no Cheat Maker Studio.
 */

export interface HexViewerRow {
  addressHex: string;
  bytesHex: string[];
  ascii: string;
}

export class HexViewer {
  /**
   * Converte um Buffer em linhas estruturadas de 16 bytes no padrão Hex Editor
   */
  public static formatHexDump(buffer: Buffer, baseAddress: bigint = 0n): HexViewerRow[] {
    const rows: HexViewerRow[] = [];
    const length = buffer.length;

    for (let offset = 0; offset < length; offset += 16) {
      const currentAddress = baseAddress + BigInt(offset);
      const addressHex = currentAddress.toString(16).toUpperCase().padStart(12, '0');

      const chunk = buffer.subarray(offset, Math.min(offset + 16, length));
      const bytesHex: string[] = [];
      let ascii = '';

      for (let i = 0; i < 16; i++) {
        if (i < chunk.length) {
          const byte = chunk[i];
          bytesHex.push(byte.toString(16).toUpperCase().padStart(2, '0'));
          // Caracteres imprimíveis ASCII (32 a 126)
          ascii += byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
        } else {
          bytesHex.push('  ');
          ascii += ' ';
        }
      }

      rows.push({
        addressHex,
        bytesHex,
        ascii
      });
    }

    return rows;
  }

  /**
   * Reconhece mnemônicos básicos de Assembly x86/x64 para inspeção visual rápida
   */
  public static disassembleQuick(buffer: Buffer): { offset: number; opcode: string; mnemonic: string }[] {
    const instructions: { offset: number; opcode: string; mnemonic: string }[] = [];
    let i = 0;

    while (i < buffer.length) {
      const byte = buffer[i];
      let mnemonic = 'UNKNOWN';
      let len = 1;

      if (byte === 0x90) {
        mnemonic = 'NOP';
      } else if (byte === 0xC3) {
        mnemonic = 'RET';
      } else if (byte === 0xCC) {
        mnemonic = 'INT 3 (Breakpoint)';
      } else if (byte === 0xE9 && i + 4 < buffer.length) {
        mnemonic = 'JMP rel32';
        len = 5;
      } else if (byte === 0xE8 && i + 4 < buffer.length) {
        mnemonic = 'CALL rel32';
        len = 5;
      } else if (byte === 0xEB && i + 1 < buffer.length) {
        mnemonic = 'JMP short';
        len = 2;
      } else if (byte === 0x89) {
        mnemonic = 'MOV r/m, reg';
        len = Math.min(2, buffer.length - i);
      } else if (byte === 0x8B) {
        mnemonic = 'MOV reg, r/m';
        len = Math.min(2, buffer.length - i);
      } else if (byte === 0x01) {
        mnemonic = 'ADD r/m, reg';
        len = Math.min(2, buffer.length - i);
      } else if (byte === 0x29) {
        mnemonic = 'SUB r/m, reg';
        len = Math.min(2, buffer.length - i);
      } else if (byte === 0xFF) {
        mnemonic = 'INC / DEC / CALL / JMP';
        len = Math.min(2, buffer.length - i);
      }

      const chunk = buffer.subarray(i, i + len);
      const opcode = chunk.toString('hex').toUpperCase();

      instructions.push({
        offset: i,
        opcode,
        mnemonic
      });

      i += len;
    }

    return instructions;
  }
}
