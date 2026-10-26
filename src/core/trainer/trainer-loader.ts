import fs from 'node:fs';
import path from 'node:path';
import { TrainerContract } from './trainer-contract.js';

export class TrainerLoader {
  /**
   * Carrega e valida um contrato de trainer a partir de um arquivo JSON
   */
  public static loadFromFile(filePath: string): TrainerContract {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo de trainer não encontrado: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const contract = JSON.parse(content) as TrainerContract;

    this.validateContract(contract);
    return contract;
  }

  /**
   * Valida a conformidade do contrato de trainer
   */
  public static validateContract(contract: TrainerContract): void {
    if (!contract.id || typeof contract.id !== 'string') {
      throw new Error("Contrato inválido: campo 'id' obrigatório.");
    }
    if (!contract.title || typeof contract.title !== 'string') {
      throw new Error("Contrato inválido: campo 'title' obrigatório.");
    }
    if (!contract.processName || typeof contract.processName !== 'string') {
      throw new Error("Contrato inválido: campo 'processName' obrigatório.");
    }
    if (!contract.version || typeof contract.version !== 'string') {
      throw new Error("Contrato inválido: campo 'version' obrigatório.");
    }
    if (!Array.isArray(contract.cheats)) {
      throw new Error("Contrato inválido: campo 'cheats' deve ser um array.");
    }

    for (const cheat of contract.cheats) {
      if (!cheat.id || !cheat.name || !cheat.type) {
        throw new Error(`Cheat inválido: campos 'id', 'name' e 'type' são obrigatórios em ${JSON.stringify(cheat)}`);
      }
      if (cheat.type === 'aob_patch' && (!cheat.pattern || !cheat.replace)) {
        throw new Error(`Cheat AOB '${cheat.name}' requer 'pattern' e 'replace'.`);
      }
      if (cheat.type === 'pointer_freeze' && (!cheat.pointerChain || cheat.value === undefined)) {
        throw new Error(`Cheat de ponteiro '${cheat.name}' requer 'pointerChain' e 'value'.`);
      }
    }
  }

  /**
   * Varre um diretório em busca de arquivos de trainer (.json)
   */
  public static scanTrainersDirectory(dirPath: string): TrainerContract[] {
    if (!fs.existsSync(dirPath)) return [];

    const contracts: TrainerContract[] = [];
    const files = fs.readdirSync(dirPath, { recursive: true });

    for (const file of files) {
      const full = path.join(dirPath, file.toString());
      if (full.endsWith('.json') && !full.endsWith('.schema.json')) {
        try {
          contracts.push(this.loadFromFile(full));
        } catch {
          // Ignora JSONs que não sejam contratos de trainer
        }
      }
    }

    return contracts;
  }
}
