import { describe, it, expect } from 'vitest';
import { HexViewer } from '../src/core/studio/hex-viewer.js';

describe('HexViewer (Studio Disassembler)', () => {
  it('deve formatar buffer em linhas hexadecimais canônicas de 16 bytes', () => {
    const buf = Buffer.from('Hello World 1234');
    const dump = HexViewer.formatHexDump(buf, 0x140000000n);

    expect(dump).toHaveLength(1);
    expect(dump[0].addressHex).toBe('000140000000');
    expect(dump[0].bytesHex).toHaveLength(16);
    expect(dump[0].ascii).toBe('Hello World 1234');
  });

  it('deve desassemblar mnemônicos comuns x86/x64 como NOP, RET e JMP', () => {
    // 90 (NOP), 90 (NOP), C3 (RET)
    const buf = Buffer.from([0x90, 0x90, 0xC3]);
    const disasm = HexViewer.disassembleQuick(buf);

    expect(disasm).toHaveLength(3);
    expect(disasm[0].mnemonic).toBe('NOP');
    expect(disasm[1].mnemonic).toBe('NOP');
    expect(disasm[2].mnemonic).toBe('RET');
  });
});
