import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { TrainerContract, CheatDefinition, CheatType, ValueType } from '../trainer/trainer-contract.js';

export class CheatEngineTableImporter {
  private static parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  });

  /**
   * Converte tipo de variável do Cheat Engine para o nosso padrão ValueType
   */
  private static mapVariableType(ceType: string): ValueType {
    const lower = (ceType || '').toLowerCase();
    if (lower.includes('4 byte') || lower === 'dword') return 'int32';
    if (lower.includes('8 byte') || lower === 'qword') return 'int64';
    if (lower.includes('float')) return 'float';
    if (lower.includes('double')) return 'double';
    if (lower.includes('2 byte') || lower === 'word') return 'int16';
    if (lower.includes('byte')) return 'int8';
    return 'int32';
  }

  /**
   * Extrai assinatura AOB e código substituto de um script AutoAssembler do Cheat Engine
   */
  public static parseAssemblerScript(script: string): { pattern?: string; replace?: string } {
    // Procura por aobscan(...) ou aobscanmodule(...) na mesma linha
    const aobMatch = script.match(/aobscan(?:module)?\s*\([^\r\n,)]+?(?:,\s*[^\r\n,)]+?)?,\s*([A-Fa-f0-9\s\?]+)\)/i);
    let pattern: string | undefined;

    if (aobMatch) {
      pattern = aobMatch[1].trim().replace(/\s+/g, ' ');
    }

    // Procura por substituições de código (como db 90 90 90 ou nop...)
    const dbMatch = script.match(/db\s+((?:[A-Fa-f0-9]{2}\s*)+)/i);
    let replace: string | undefined;

    if (dbMatch) {
      replace = dbMatch[1].trim().replace(/\s+/g, ' ');
    } else if (script.includes('nop')) {
      const nopCount = (script.match(/nop/gi) || []).length;
      if (nopCount > 0) {
        replace = Array(nopCount).fill('90').join(' ');
      }
    }

    return { pattern, replace };
  }

  /**
   * Importa e converte um arquivo .CT (Cheat Table) em um TrainerContract
   */
  public static importFromCT(
    filePath: string,
    processName = 'Game.exe'
  ): TrainerContract {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo de tabela .CT não encontrado: ${filePath}`);
    }

    const xmlData = fs.readFileSync(filePath, 'utf8');
    const parsed = this.parser.parse(xmlData);

    const cheatTable = parsed.CheatTable;
    if (!cheatTable) {
      throw new Error('Arquivo XML não é uma tabela válida do Cheat Engine.');
    }

    const gameTitle = path.basename(filePath, path.extname(filePath));
    const gameId = gameTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const cheats: CheatDefinition[] = [];
    const entries = Array.isArray(cheatTable.CheatEntries?.CheatEntry)
      ? cheatTable.CheatEntries.CheatEntry
      : cheatTable.CheatEntries?.CheatEntry
      ? [cheatTable.CheatEntries.CheatEntry]
      : [];

    let cheatIndex = 1;

    for (const entry of entries) {
      const description = entry.Description ? String(entry.Description).replace(/["<>]/g, '') : `Cheat ${cheatIndex}`;
      const cheatId = `cheat_${cheatIndex}`;

      // 1. Checa se é um script AutoAssembler
      if (entry.AssemblerScript) {
        const { pattern, replace } = this.parseAssemblerScript(String(entry.AssemblerScript));
        if (pattern) {
          cheats.push({
            id: cheatId,
            name: description,
            category: 'Injeção AOB',
            type: 'aob_patch',
            pattern,
            replace: replace || '90 90 90',
            hotkey: `F${cheatIndex <= 12 ? cheatIndex : 1}`
          });
          cheatIndex++;
          continue;
        }
      }

      // 2. Checa se é um ponteiro com offsets
      if (entry.Offsets) {
        const rawOffsets = Array.isArray(entry.Offsets.Offset)
          ? entry.Offsets.Offset
          : [entry.Offsets.Offset];

        const pointerChain = rawOffsets.map((o: any) => `0x${String(o).replace(/^0x/i, '')}`).reverse();
        const address = String(entry.Address || processName);
        const baseModule = address.includes('+') ? address.split('+')[0] : processName;

        cheats.push({
          id: cheatId,
          name: description,
          category: 'Ponteiros',
          type: 'pointer_freeze',
          baseModule,
          pointerChain,
          valueType: this.mapVariableType(entry.VariableType),
          value: 999999,
          hotkey: `F${cheatIndex <= 12 ? cheatIndex : 1}`
        });
        cheatIndex++;
        continue;
      }
    }

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
