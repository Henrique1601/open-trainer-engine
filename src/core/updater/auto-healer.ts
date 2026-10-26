import fs from 'node:fs';
import crypto from 'node:crypto';
import { AOBScanner } from '../memory/aob-scanner.js';
import { TrainerContract, CheatDefinition } from '../trainer/trainer-contract.js';

export interface HealingResult {
  cheatId: string;
  cheatName: string;
  healed: boolean;
  originalPattern: string;
  newPattern?: string;
  newAddress?: bigint;
  confidence: number; // 0 a 100%
  message: string;
}

export class AutoHealer {
  constructor(private readonly aobScanner: AOBScanner) {}

  /**
   * Calcula o hash SHA-256 do arquivo executável do jogo para detecção de versão
   */
  public static calculateExecutableHash(exePath: string): string {
    if (!fs.existsSync(exePath)) return '';
    const buffer = fs.readFileSync(exePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Tenta 'relaxar' uma assinatura AOB substituindo bytes periféricos por wildcards
   */
  public static relaxPattern(pattern: string, level = 1): string[] {
    const tokens = pattern.trim().split(/\s+/);
    const candidates: string[] = [];

    if (tokens.length <= 4) return candidates;

    // Nível 1: Corta 2 bytes da ponta esquerda e 2 bytes da ponta direita
    if (level >= 1 && tokens.length > 8) {
      const trimmed = tokens.slice(2, tokens.length - 2);
      candidates.push(trimmed.join(' '));
    }

    // Nível 2: Substitui referências relativas comuns (offsets após instruções de 48 8B ou E8) por ??
    if (level >= 2) {
      const relaxed = [...tokens];
      for (let i = 0; i < relaxed.length - 1; i++) {
        if (relaxed[i] === '48' && relaxed[i + 1] === '8B' && i + 3 < relaxed.length) {
          relaxed[i + 2] = '??';
          relaxed[i + 3] = '??';
        }
      }
      candidates.push(relaxed.join(' '));
    }

    // Nível 3: Janela central estrita (núcleo da instrução)
    if (level >= 3 && tokens.length >= 6) {
      const mid = Math.floor(tokens.length / 2);
      const core = tokens.slice(Math.max(0, mid - 3), Math.min(tokens.length, mid + 3));
      candidates.push(core.join(' '));
    }

    return candidates;
  }

  /**
   * Tenta auto-recuperar um cheat cuja assinatura AOB quebrou após um patch do jogo
   */
  public healCheat(cheat: CheatDefinition): HealingResult {
    if (cheat.type !== 'aob_patch' || !cheat.pattern) {
      return {
        cheatId: cheat.id,
        cheatName: cheat.name,
        healed: false,
        originalPattern: cheat.pattern || '',
        confidence: 0,
        message: 'Apenas cheats do tipo aob_patch podem ser auto-recuperados.'
      };
    }

    // 1. Testa se o padrão original ainda funciona
    const originalMatches = this.aobScanner.scan(cheat.pattern, { maxResults: 2 });
    if (originalMatches.length === 1) {
      return {
        cheatId: cheat.id,
        cheatName: cheat.name,
        healed: true,
        originalPattern: cheat.pattern,
        newPattern: cheat.pattern,
        newAddress: originalMatches[0],
        confidence: 100,
        message: 'A assinatura original continua 100% válida na versão atual.'
      };
    }

    // 2. Aplica algoritmos de relaxamento progressivo
    for (let level = 1; level <= 3; level++) {
      const candidates = AutoHealer.relaxPattern(cheat.pattern, level);

      for (const candidate of candidates) {
        try {
          const matches = this.aobScanner.scan(candidate, { maxResults: 2 });

          // Se encontrou EXATAMENTE 1 correspondência única, o cheat foi realocado com sucesso!
          if (matches.length === 1) {
            return {
              cheatId: cheat.id,
              cheatName: cheat.name,
              healed: true,
              originalPattern: cheat.pattern,
              newPattern: candidate,
              newAddress: matches[0],
              confidence: level === 1 ? 95 : level === 2 ? 85 : 75,
              message: `Cheat realocado com sucesso no nível ${level} de relaxamento de bytes!`
            };
          }
        } catch {
          // Ignora candidato com erro de sintaxe
        }
      }
    }

    return {
      cheatId: cheat.id,
      cheatName: cheat.name,
      healed: false,
      originalPattern: cheat.pattern,
      confidence: 0,
      message: 'Não foi possível encontrar a instrução de forma unívoca na nova versão do jogo.'
    };
  }

  /**
   * Executa a auto-recuperação em todos os cheats de um contrato e salva o arquivo atualizado
   */
  public healTrainerFile(filePath: string): HealingResult[] {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const contract = JSON.parse(content) as TrainerContract;
    const results: HealingResult[] = [];

    let hasChanges = false;

    for (const cheat of contract.cheats) {
      if (cheat.type === 'aob_patch') {
        const res = this.healCheat(cheat);
        results.push(res);

        if (res.healed && res.newPattern && res.newPattern !== cheat.pattern) {
          cheat.pattern = res.newPattern;
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, JSON.stringify(contract, null, 2), 'utf8');
    }

    return results;
  }
}
