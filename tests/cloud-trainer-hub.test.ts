import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudTrainerHub, CloudTrainerIndex } from '../src/core/cloud/cloud-trainer-hub.js';
import { TrainerContract } from '../src/core/trainer/trainer-contract.js';

describe('CloudTrainerHub', () => {
  const mockCatalog: CloudTrainerIndex = {
    version: '1.0.0',
    lastUpdated: '2026-10-26T20:00:00Z',
    trainers: [
      {
        gameId: 'elden-ring',
        gameTitle: 'Elden Ring: Shadow of the Erdtree',
        processName: 'eldenring.exe',
        version: '1.14.0',
        author: 'Community',
        downloadUrl: 'https://example.com/elden-ring.json',
        cheatCount: 16
      },
      {
        gameId: 'cyberpunk-2077',
        gameTitle: 'Cyberpunk 2077',
        processName: 'Cyberpunk2077.exe',
        version: '2.13.0',
        author: 'Community',
        downloadUrl: 'https://example.com/cyberpunk.json',
        cheatCount: 10
      }
    ]
  };

  it('deve filtrar trainers por termo de busca', () => {
    const hub = new CloudTrainerHub();
    const results = hub.search(mockCatalog, 'elden');
    expect(results).toHaveLength(1);
    expect(results[0].gameTitle).toContain('Elden Ring');

    const byExe = hub.search(mockCatalog, 'cyberpunk2077.exe');
    expect(byExe).toHaveLength(1);
  });

  it('deve identificar quando há atualizações de versão disponíveis para trainers locais', () => {
    const hub = new CloudTrainerHub();
    const localTrainers: TrainerContract[] = [
      {
        id: 'elden-ring',
        title: 'Elden Ring',
        processName: 'eldenring.exe',
        version: '1.12.0', // versão antiga
        cheats: []
      },
      {
        id: 'cyberpunk-2077',
        title: 'Cyberpunk 2077',
        processName: 'Cyberpunk2077.exe',
        version: '2.13.0', // mesma versão
        cheats: []
      }
    ];

    const updates = hub.checkUpdates(mockCatalog, localTrainers);
    expect(updates).toHaveLength(1);
    expect(updates[0].localTrainer.id).toBe('elden-ring');
    expect(updates[0].cloudEntry.version).toBe('1.14.0');
  });
});
