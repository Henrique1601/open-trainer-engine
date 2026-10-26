import { describe, it, expect } from 'vitest';
import { CheatEngineTableImporter } from '../src/core/importers/ct-importer.js';
import fs from 'node:fs';
import path from 'node:path';

describe('CheatEngineTableImporter', () => {
  it('deve extrair assinatura AOB e código substituto de script AutoAssembler', () => {
    const script = `
[ENABLE]
aobscan(godmode_aob, 89 46 24 48 8B 05 ?? ?? ?? ??)
alloc(newmem, 1024)
godmode_aob:
  db 90 90 90
[DISABLE]
godmode_aob:
  db 89 46 24
`;
    const res = CheatEngineTableImporter.parseAssemblerScript(script);
    expect(res.pattern).toBe('89 46 24 48 8B 05 ?? ?? ?? ??');
    expect(res.replace).toBe('90 90 90');
  });

  it('deve importar tabela .CT XML completa e gerar TrainerContract válido', () => {
    const mockCT = `<?xml version="1.0" encoding="utf-8"?>
<CheatTable CheatEngineTableVersion="45">
  <CheatEntries>
    <CheatEntry>
      <ID>1</ID>
      <Description>"Modo Deus"</Description>
      <VariableType>Auto Assembler Script</VariableType>
      <AssemblerScript>[ENABLE]
aobscan(godmode, 89 46 24 ?? ??)
godmode:
  db 90 90 90
[DISABLE]
</AssemblerScript>
    </CheatEntry>
    <CheatEntry>
      <ID>2</ID>
      <Description>"Ouro Infinito"</Description>
      <VariableType>4 Bytes</VariableType>
      <Address>"Game.exe"+01B34020</Address>
      <Offsets>
        <Offset>118</Offset>
        <Offset>40</Offset>
      </Offsets>
    </CheatEntry>
  </CheatEntries>
</CheatTable>`;

    const tmpFile = path.resolve('tmp_test_table.CT');
    fs.writeFileSync(tmpFile, mockCT, 'utf8');

    try {
      const contract = CheatEngineTableImporter.importFromCT(tmpFile, 'Game.exe');
      expect(contract.title).toBe('tmp_test_table');
      expect(contract.processName).toBe('Game.exe');
      expect(contract.cheats.length).toBe(2);

      // Cheat 1: AOB
      expect(contract.cheats[0].name).toBe('Modo Deus');
      expect(contract.cheats[0].type).toBe('aob_patch');
      expect(contract.cheats[0].pattern).toBe('89 46 24 ?? ??');

      // Cheat 2: Pointer
      expect(contract.cheats[1].name).toBe('Ouro Infinito');
      expect(contract.cheats[1].type).toBe('pointer_freeze');
      expect(contract.cheats[1].pointerChain).toEqual(['0x40', '0x118']);
      expect(contract.cheats[1].valueType).toBe('int32');
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });
});
