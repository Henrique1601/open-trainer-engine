import fs from 'node:fs';
import path from 'node:path';
import { TrainerContract } from '../trainer/trainer-contract.js';

export interface CloudTrainerEntry {
  gameId: string;
  gameTitle: string;
  processName: string;
  version: string;
  author: string;
  downloadUrl: string;
  sha256?: string;
  description?: string;
  cheatCount: number;
}

export interface CloudTrainerIndex {
  version: string;
  lastUpdated: string;
  trainers: CloudTrainerEntry[];
}

export class CloudTrainerHub {
  public static readonly DEFAULT_HUB_URL =
    'https://raw.githubusercontent.com/Henrique1601/open-trainer-engine/main/configs/trainers/index.json';

  constructor(
    private readonly cachePath?: string,
    private readonly hubUrl: string = CloudTrainerHub.DEFAULT_HUB_URL
  ) {}

  /**
   * Obtém o índice do catálogo remoto com fallback para cache local
   */
  public async fetchCatalog(): Promise<CloudTrainerIndex> {
    try {
      const response = await fetch(this.hubUrl);
      if (response.ok) {
        const data = (await response.json()) as CloudTrainerIndex;
        if (this.cachePath) {
          try {
            fs.mkdirSync(path.dirname(this.cachePath), { recursive: true });
            fs.writeFileSync(this.cachePath, JSON.stringify(data, null, 2), 'utf-8');
          } catch {}
        }
        return data;
      }
    } catch {
      // Fallback para cache local se offline
    }

    if (this.cachePath && fs.existsSync(this.cachePath)) {
      try {
        const cached = fs.readFileSync(this.cachePath, 'utf-8');
        return JSON.parse(cached);
      } catch {}
    }

    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      trainers: []
    };
  }

  /**
   * Filtra trainers disponíveis por título ou nome do executável
   */
  public search(catalog: CloudTrainerIndex, query: string): CloudTrainerEntry[] {
    const q = query.trim().toLowerCase();
    if (!q) return catalog.trainers;

    return catalog.trainers.filter(
      t =>
        t.gameTitle.toLowerCase().includes(q) ||
        t.processName.toLowerCase().includes(q) ||
        t.gameId.toLowerCase().includes(q)
    );
  }

  /**
   * Compara os trainers locais com o catálogo na nuvem e identifica atualizações disponíveis
   */
  public checkUpdates(
    catalog: CloudTrainerIndex,
    localTrainers: TrainerContract[]
  ): {
    localTrainer: TrainerContract;
    cloudEntry: CloudTrainerEntry;
  }[] {
    const updates: { localTrainer: TrainerContract; cloudEntry: CloudTrainerEntry }[] = [];

    for (const local of localTrainers) {
      const cloudMatch = catalog.trainers.find(
        c => c.gameId.toLowerCase() === local.id.toLowerCase()
      );

      if (cloudMatch && cloudMatch.version !== local.version) {
        updates.push({
          localTrainer: local,
          cloudEntry: cloudMatch
        });
      }
    }

    return updates;
  }

  /**
   * Baixa e salva um contrato de trainer na pasta local
   */
  public async installTrainer(
    entry: CloudTrainerEntry,
    targetDirectory: string
  ): Promise<string> {
    const response = await fetch(entry.downloadUrl);
    if (!response.ok) {
      throw new Error(`Falha ao baixar trainer da nuvem: status HTTP ${response.status}`);
    }

    const contractData = (await response.json()) as TrainerContract;
    fs.mkdirSync(targetDirectory, { recursive: true });

    const filePath = path.join(targetDirectory, `${entry.gameId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(contractData, null, 2), 'utf-8');

    return filePath;
  }
}
