/**
 * Open Trainer Engine - Default Cheats Provider
 * Fornece e gera automaticamente um catálogo rico e categorizado de cheats
 * estilo WeMod Pro (Modo Deus, Aimbot, Dinheiro, XP, Teleport, No-Clip, Speedhack)
 * adaptado dinamicamente para qualquer jogo detectado no computador do usuário.
 */

export interface BuiltinCheat {
  id: string;
  name: string;
  category: string;
  type: 'toggle' | 'value' | 'action' | 'aob_patch' | 'pointer_freeze';
  hotkey?: string;
  description?: string;
  value?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  isCustom?: boolean;
}

export class DefaultCheatsProvider {
  /**
   * Gera uma suíte completa e rica de cheats para qualquer jogo
   */
  public static getCheatsForGame(title: string, processName?: string): BuiltinCheat[] {
    const cleanTitle = (title || '').toLowerCase();
    const isShooter = cleanTitle.includes('strike') || cleanTitle.includes('duty') || cleanTitle.includes('resident') || cleanTitle.includes('gta') || cleanTitle.includes('cyberpunk') || cleanTitle.includes('doom') || cleanTitle.includes('halo');
    const isRpg = cleanTitle.includes('elden') || cleanTitle.includes('souls') || cleanTitle.includes('witcher') || cleanTitle.includes('skyrim') || cleanTitle.includes('rpg') || cleanTitle.includes('baldur') || cleanTitle.includes('diablo') || cleanTitle.includes('monster');
    const isRoguelike = cleanTitle.includes('vampire') || cleanTitle.includes('cells') || cleanTitle.includes('hades') || cleanTitle.includes('binding') || cleanTitle.includes('slay');

    const cheats: BuiltinCheat[] = [
      // 🛡️ Categoria: Jogador & Sobrevivência
      {
        id: 'god_mode',
        name: 'Modo Deus (Vida Infinita / Imortal)',
        category: 'Jogador & Sobrevivência',
        type: 'toggle',
        hotkey: 'F1',
        description: 'Bloqueia qualquer dano à barra de vida do personagem.'
      },
      {
        id: 'infinite_stamina',
        name: isRpg ? 'Estamina & Vigor Ilimitados' : 'Estamina Infinita',
        category: 'Jogador & Sobrevivência',
        type: 'toggle',
        hotkey: 'F2',
        description: 'Permite correr, esquivar e atacar sem esgotar o fôlego.'
      },
      {
        id: 'ghost_stealth',
        name: 'Invisibilidade / Modo Fantasma (Stealth)',
        category: 'Jogador & Sobrevivência',
        type: 'toggle',
        hotkey: 'F3',
        description: 'Inimigos e câmeras de segurança não detectam seu personagem.'
      },
      {
        id: 'infinite_oxygen',
        name: 'Oxigênio & Fôlego Ilimitados',
        category: 'Jogador & Sobrevivência',
        type: 'toggle',
        hotkey: 'F4',
        description: 'Mergulhe ou fique em áreas com gás sem sofrer sufocamento.'
      },
      {
        id: 'jump_multiplier',
        name: 'Super Pulo (Multiplicador de Altura)',
        category: 'Jogador & Sobrevivência',
        type: 'value',
        value: 1,
        minValue: 1,
        maxValue: 10,
        step: 1,
        description: 'Aumente a altura do pulo para alcançar lugares secretos.'
      },

      // 🎯 Categoria: Combate & Armas
      {
        id: 'aimbot_assist',
        name: isShooter ? 'Aimbot Suave (Silent Auto-Lock)' : 'Auto-Lock de Mira & Ataques',
        category: 'Combate & Armas',
        type: 'toggle',
        hotkey: 'F5',
        description: 'Alinha automaticamente seus disparos e ataques nos pontos vitais.'
      },
      {
        id: 'infinite_ammo',
        name: isShooter ? 'Munição Infinita (Sem Recarga)' : 'Projéteis & Flechas Infinitos',
        category: 'Combate & Armas',
        type: 'toggle',
        hotkey: 'F6',
        description: 'Dispare continuamente sem precisar gastar pentes de munição.'
      },
      {
        id: 'no_recoil_spread',
        name: 'Sem Recuo & Dispersão Zero (Precisão Laser)',
        category: 'Combate & Armas',
        type: 'toggle',
        hotkey: 'F7',
        description: 'As balas atingem com 100% de estabilidade e agrupamento perfeito.'
      },
      {
        id: 'rapid_fire',
        name: 'Disparo Ultra-Rápido (Rapid Fire)',
        category: 'Combate & Armas',
        type: 'toggle',
        hotkey: 'F8',
        description: 'Elimina o tempo de espera entre rajadas ou golpes.'
      },
      {
        id: 'damage_multiplier',
        name: 'Multiplicador de Dano Crítico',
        category: 'Combate & Armas',
        type: 'value',
        value: 1,
        minValue: 1,
        maxValue: 50,
        step: 1,
        description: 'Multiplica o dano infligido aos inimigos e chefões.'
      },

      // 💰 Categoria: Economia & Progresso
      {
        id: 'infinite_currency',
        name: isRpg ? 'Ouro & Moedas Infinitas ($999,999,999)' : 'Dinheiro & Créditos Ilimitados',
        category: 'Economia & Progresso',
        type: 'toggle',
        hotkey: 'F9',
        description: 'Compre qualquer equipamento, arma ou melhoria sem restrições.'
      },
      {
        id: 'xp_multiplier',
        name: isRoguelike ? 'Ganho de Gemas/XP Acelerado' : 'Multiplicador de Ganho de XP',
        category: 'Economia & Progresso',
        type: 'value',
        value: 1,
        minValue: 1,
        maxValue: 100,
        step: 5,
        description: 'Multiplica a experiência obtida ao derrotar inimigos ou missões.'
      },
      {
        id: 'infinite_skill_points',
        name: 'Pontos de Habilidade & Atributos Livres',
        category: 'Economia & Progresso',
        type: 'toggle',
        hotkey: 'F10',
        description: 'Desbloqueie toda a árvore de habilidades imediatamente.'
      },
      {
        id: 'zero_weight',
        name: 'Capacidade de Carga Infinita (Peso Zero)',
        category: 'Economia & Progresso',
        type: 'toggle',
        hotkey: 'F11',
        description: 'Carregue itens no inventário sem penalidade de movimento.'
      },

      // 📍 Categoria: Teletransporte & No-Clip
      {
        id: 'waypoint_save',
        name: 'Salvar Posição Atual (Gravar Waypoint)',
        category: 'Teletransporte & No-Clip',
        type: 'action',
        hotkey: 'NumPad 1',
        description: 'Grava suas coordenadas X, Y, Z no espaço.'
      },
      {
        id: 'waypoint_teleport',
        name: 'Teleportar para Posição Salva',
        category: 'Teletransporte & No-Clip',
        type: 'action',
        hotkey: 'NumPad 2',
        description: 'Transporta instantaneamente o personagem para o Waypoint gravado.'
      },
      {
        id: 'noclip_flight',
        name: 'Atravessar Paredes (No-Clip / Modo Voo)',
        category: 'Teletransporte & No-Clip',
        type: 'toggle',
        hotkey: 'NumPad 3',
        description: 'Desativa colisão de terreno e estruturas.'
      },
      {
        id: 'low_gravity',
        name: 'Gravidade Lunar / Queda Lenta',
        category: 'Teletransporte & No-Clip',
        type: 'toggle',
        hotkey: 'NumPad 4',
        description: 'Flutue no ar suavemente sem sofrer dano de queda.'
      },

      // ⚡ Categoria: Física & Manipulação de Tempo
      {
        id: 'player_speed',
        name: 'Velocidade de Movimento (Super Speed)',
        category: 'Física & Manipulação de Tempo',
        type: 'value',
        value: 1,
        minValue: 1,
        maxValue: 5,
        step: 0.5,
        description: 'Acelera a velocidade de corrida e deslocamento do jogador.'
      },
      {
        id: 'freeze_enemies',
        name: 'Congelar Inimigos no Lugar (Freeze All)',
        category: 'Física & Manipulação de Tempo',
        type: 'toggle',
        hotkey: 'NumPad 5',
        description: 'Paralisa animações e inteligência artificial dos inimigos.'
      }
    ];

    return cheats;
  }
}
