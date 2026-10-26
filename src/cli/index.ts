#!/usr/bin/env node
import path from 'node:path';
import { GameDetector } from '../core/scanner/game-detector.js';
import { ProcessManager } from '../core/memory/process-manager.js';
import { TrainerLoader } from '../core/trainer/trainer-loader.js';
import { TrainerSession } from '../core/trainer/trainer-session.js';
import { HotkeyManager } from '../core/overlay/hotkey-manager.js';
import { OverlayServer } from '../core/overlay/overlay-server.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  console.log('\n======================================================');
  console.log('       🧙‍♂️ OPEN TRAINER ENGINE - CLI & RUNTIME');
  console.log('======================================================\n');

  switch (command) {
    case 'scan': {
      console.log('🔍 Varrendo bibliotecas de jogos instaladas no computador...\n');
      const games = GameDetector.scanAll();

      if (games.length === 0) {
        console.log('Nenhum jogo encontrado nas bibliotecas Steam ou Epic Games padrão.');
        return;
      }

      console.log(`✅ ${games.length} jogos encontrados:\n`);
      for (const g of games) {
        console.log(`• [${g.platform.toUpperCase()}] ${g.title}`);
        console.log(`  Pasta: ${g.installPath}`);
        if (g.executableName) console.log(`  Executável: ${g.executableName}`);
        if (g.versionOrBuild) console.log(`  Build/Versão: ${g.versionOrBuild}`);
        console.log('');
      }
      break;
    }

    case 'processes': {
      console.log('🔍 Listando processos em execução no Windows...\n');
      const list = ProcessManager.listProcesses();
      console.log(`Total de processos ativos: ${list.length}\n`);

      // Filtra executáveis relevantes
      const games = GameDetector.scanAll();
      const knownExes = new Set(games.map(g => g.executableName?.toLowerCase()).filter(Boolean));

      const detectedActive = list.filter(p => knownExes.has(p.name.toLowerCase()));
      if (detectedActive.length > 0) {
        console.log('🎮 JOGOS DETECTADOS EM EXECUÇÃO:');
        for (const p of detectedActive) {
          console.log(`  -> PID: ${p.pid} | Nome: ${p.name}`);
        }
        console.log('');
      } else {
        console.log('Nenhum dos seus jogos instalados está rodando no momento.');
      }
      break;
    }

    case 'trainers': {
      console.log('📦 Listando contratos de trainers disponíveis no projeto...\n');
      const configsDir = path.resolve('configs');
      const trainers = TrainerLoader.scanTrainersDirectory(configsDir);

      if (trainers.length === 0) {
        console.log(`Nenhum trainer encontrado na pasta: ${configsDir}`);
        return;
      }

      for (const t of trainers) {
        console.log(`• [${t.id}] ${t.title} (v${t.version})`);
        console.log(`  Alvo: ${t.processName}`);
        console.log(`  Total de Cheats: ${t.cheats.length}`);
        for (const c of t.cheats) {
          console.log(`    - [${c.hotkey || 'Sem tecla'}] ${c.name} (${c.type})`);
        }
        console.log('');
      }
      break;
    }

    case 'run': {
      const file = args[1] || 'configs/templates/trainer_sample.json';
      console.log(`🚀 Carregando trainer: ${file}...\n`);

      const contract = TrainerLoader.loadFromFile(path.resolve(file));
      console.log(`Jogo Alvo: ${contract.title}`);
      console.log(`Aguardando processo: ${contract.processName}...\n`);

      const session = new TrainerSession(contract);
      const hotkeys = new HotkeyManager();
      const overlay = new OverlayServer();

      overlay.setSession(session);
      await overlay.start();
      console.log(`🌐 Servidor de HUD Overlay ativo em: http://localhost:38472/overlay`);

      session.on('stateChanged', ({ from, to }) => {
        console.log(`[Lifecycle] ${from} -> ${to}`);
      });

      session.on('cheatToggled', ({ cheatId, enabled }) => {
        const cheat = contract.cheats.find(c => c.id === cheatId);
        console.log(`⚡ Cheat '${cheat?.name}': ${enabled ? 'LIGADO' : 'DESLIGADO'}`);
      });

      // Tenta anexar ao processo
      try {
        await session.attach();
        console.log('\n🎮 Trainer anexado com sucesso ao processo do jogo!');
        console.log('Registrando teclas de atalho globais...\n');

        for (const cheat of contract.cheats) {
          if (cheat.hotkey) {
            try {
              hotkeys.register(cheat.hotkey, () => {
                session.toggleCheat(cheat.id);
              });
              console.log(`✓ Atalho [${cheat.hotkey}]: ${cheat.name}`);
            } catch (err: any) {
              console.warn(`✗ Falha ao registrar atalho [${cheat.hotkey}]: ${err.message}`);
            }
          }
        }

        console.log('\nPressione Ctrl+C para desativar o trainer e sair com segurança.\n');
      } catch (err: any) {
        console.error(`\n❌ Erro ao anexar trainer: ${err.message}`);
        console.log('Certifique-se de que o jogo está aberto antes de executar o comando.');
        overlay.stop();
        return;
      }

      process.on('SIGINT', () => {
        console.log('\nDesconectando trainer e restaurando memória do jogo...');
        hotkeys.unregisterAll();
        session.detach();
        overlay.stop();
        console.log('Trainer encerrado limpo. Até a próxima!');
        process.exit(0);
      });

      break;
    }

    default:
      console.log('Comandos disponíveis:');
      console.log('  npm run cli scan          - Varre e lista todos os jogos instalados na máquina');
      console.log('  npm run cli processes     - Lista processos ativos e detecta se algum jogo está aberto');
      console.log('  npm run cli trainers      - Lista todos os contratos de trainers disponíveis');
      console.log('  npm run cli run <arquivo> - Executa um trainer anexando ao jogo e abrindo o HUD');
      console.log('  npm test                  - Executa a suíte completa de testes automatizados');
      break;
  }
}

main().catch(err => {
  console.error('\nErro fatal:', err);
  process.exit(1);
});
