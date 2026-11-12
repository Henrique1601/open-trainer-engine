# 🏛️ Histórico de Decisões Arquiteturais (ADRs)

## ADR-001: Resolução de Capas e Ícones de Jogos Oficiais Estilo WeMod
- **Contexto:** Os cards de jogos utilizavam fotos genéricas do Unsplash e falhavam ao clicar se o jogo não tivesse trainer estático em `configs/trainers/`.
- **Decisão:** Criado o módulo `GameArtResolver` que conecta com a CDN oficial da Steam (`library_600x900_2x.jpg` e `header.jpg`), e adicionado handler IPC `app:get-file-icon` para extrair ícones nativos diretamente do `.exe` instalado na máquina do usuário.
- **Consequência:** Experiência 100% autêntica de biblioteca WeMod para Steam, Epic Games, Xbox Game Pass e GOG.

## ADR-002: Gatilho de Releases no GitHub Actions via Git Tags
- **Contexto:** Commits enviados diretamente para a branch `main` não geravam releases automáticos com binários `.exe`.
- **Decisão:** O workflow `.github/workflows/release.yml` escuta tags semânticas no formato `v*`. Toda nova versão deve ser acompanhada de uma git tag anotada (ex: `v0.4.2`, `v0.5.0`) e sincronização do `package-lock.json` para garantir que `npm ci` e os builds NSIS/Portable sejam publicados automaticamente no GitHub Releases.

## ADR-003: In-App Auto-Updater com Download Direto
- **Contexto:** Ao avisar sobre novas atualizações, abrir abas externas no navegador causava atrito e SmartScreen warning.
- **Decisão:** Implementado fluxo nativo `updater:download-update` e `updater:install-and-restart` dentro do app Electron, realizando download silencioso e aplicando o instalador NSIS diretamente.

## ADR-004: Segundo Cérebro Perene do Projeto (`docs/brain/`)
- **Contexto:** Necessidade de persistência arquitetural, registro de decisões e regras de negócio entre sessões do usuário e diferentes agentes.
- **Decisão:** Criação e manutenção mandatória de `docs/brain/INDEX.md`, `DECISIONS.md` e `GOTCHAS.md`.

## ADR-005: Suíte Universal de Cheats e Criação In-Launcher
- **Contexto:** Usuários sem trainers estáticos criados viam telas vazias nos cheats e não podiam adicionar mods personalizados pelo app.
- **Decisão:** Criado o `DefaultCheatsProvider` gerando 20 mods categorizados (God mode, aimbot, teleport, dinheiro, xp, no-clip, tempo) e implementado o modal 3D de criação de cheats no próprio launcher persistindo em `PreferencesStore`.

## ADR-006: Speedhack Real no Processo e Multitemas 3D
- **Contexto:** O Speedhack anterior apenas alterava o estado interno de variáveis JavaScript sem atuar sobre o processo do jogo no Windows.
- **Decisão:** Implementado em `SpeedhackEngine` o modo Bullet-time com micro-pulsos de ciclo de trabalho usando `NtSuspendProcess`/`NtResumeProcess` e modo Turbo via prioridade de processo Win32 (`SetPriorityClass`), além de 5 temas visuais dinâmicos (WeMod, Cyberpunk, Obsidian, Crimson, Frost) e física 3D Tilt nos cards.

---

### ADR-007: Redesign Visual Completo Estilo WeMod Pro & Áudio Tátil Sintetizado (2026-11-10)
- **Status:** Aceito e Implementado (v0.5.2)
- **Contexto:** A interface anterior apresentava tipografia de sistema básica, ausência de topbar superior de controle, atalhos de cheats estáticos e feedback tátil inexistente, conferindo aspecto amador.
- **Decisão:**
  1. Adicionado Topbar Header com busca global instantânea (`Ctrl+K`), controle global de som tátil, acionamento do overlay HUD e status em tempo real do processo.
  2. Adotada tipografia gaming profissional (`Outfit`, `Plus Jakarta Sans` e `JetBrains Mono`).
  3. Criado o sintetizador de áudio `SoundEngine` usando a Web Audio API nativa para reproduzir chimes e cliques WeMod puros sem carregar arquivos MP3/WAV pesados (Princípio Ponytail).
  4. Implementado o remapeamento interativo de atalhos (`startRebindHotkey`) que permite clicar no keycap mecânico 3D de qualquer cheat para gravar uma nova tecla em tempo de execução.

---

### ADR-008: Engenharia Reversa do WeMod v10 (Wand) & Fidelidade Visual Absoluta (2026-11-11)
- **Status:** Aceito e Implementado (v0.6.0)
- **Contexto:** O usuário forneceu capturas reais da versão oficial mais recente do WeMod v10 (Wand) rodando localmente (`C:\Users\henri\AppData\Local\Wand\app-12.71.0\resources\app.asar`), destacando discrepâncias na estrutura de telas, menus contextuais, listas de jogos com ícones autênticos, toggles e painéis.
- **Decisão:**
  1. Engenharia reversa dos bundles CSS e do dicionário `pt-BR.json` do WeMod local para extração de tokens exatos, paleta `#111217`, `#13141a`, ciano `#00f59b`, amarelo pro `#ffd700` e radius pill.
  2. Implementação da Topbar WAND com logo oficial, botões de histórico `← →`, `🏠`, barra de busca centralizada, avatar com menu popup de perfil ("Meu Perfil", "Ajuda ↗", "Conectar ao Steam", "Discord ↗", "Feedback", "Configurações"), botão dourado "TORNE-SE PRO" e botões de janela nativos sem borda do SO (`frame: false`).
  3. Sidebar dinâmica em dois modos:
     - Modo Normal: navegação (Mapas, Destaques, Wand Pro, Biblioteca, Pulse), lista de Favoritos e Meus Jogos (190) com ícones reais.
     - Modo Jogo: widget contextual no topo com nome do jogo, botão Play e abas (Personalizar, Mapa, Destaques, Sessões, Sugestões).
  4. Tela Início com hero widescreen duplo (Phantom Blade Zero / Crimson Desert com badges NEW/UPDATE) e prateleiras de cápsulas horizontais (Meus jogos, Mais populares, Novos e recentemente atualizados).
  5. Tela Mapas em grid de 4 colunas com preview de satélite/topográfico, badge "X MAPAS", ícone + título e estrela de favoritos conectada ao MapGenie.
  6. Tela Biblioteca em modo tabela/lista com ícone, título, favoritos, gêneros e ícones das plataformas Steam/Epic.
  7. Tela de Detalhes do Jogo espelhando Assassin's Creed Origins: hero com arte imersiva, poster vertical, chips de filtro (Todos, Assistir, Facilitar, Sandbox, Novo Pro), cheats com segmented toggles `[ Off | On ]` e keycaps 3D, e coluna lateral com widget do Mapa e player de vídeo companion.
- **Consequência:** Experiência visual idêntica à aplicação oficial WeMod v10 / Wand, com todos os cliques, atalhos e integrações nativas funcionando perfeitamente.

## ADR-009: Modularização IPC, Blindagem XSS/URLs, Token Remoto e UI Real (v0.6.1)
- **Contexto:** A revisão de código e arquitetura da v0.6.0 identificou concentração excessiva de handlers IPC em `src/desktop/main.ts` (645 linhas), interpolação não sanitizada em `innerHTML` e handlers inline no frontend, ausência de validação de esquema em `open-external-url` / `updater:download-update`, servidor remoto sem autenticação por sessão, atalho global `F11` conflitando com fullscreen do SO e duplicação de geradores UI (`generate-wemod-v10-ui.cjs`).
- **Decisão:**
  - Dividir os handlers IPC em módulos de domínio (`src/desktop/ipc/ipc-library.ts`, `ipc-trainer.ts`, `ipc-system.ts`).
  - Validar URLs externas com `isAllowedExternalUrl` (somente `http:`/`https:`) e sanitizar nome de arquivo de update via `path.basename`.
  - Gerar `remoteAuthToken` por sessão para `RemoteServer`, exigindo token em `/api/*` e propagando-o na PWA móvel.
  - Remover `scripts/generate-wemod-v10-ui.cjs`, adicionar `escapeHtml`, `escapeJsArg` e `showToast` em `scripts/generate-premium-ui.cjs` e conectar favoritos, stats, perfis, remote QR, updater real e eventos `cheat-toggled-event`/`playtime-updated`.
- **Consequência:** Código principal enxuto (~195 linhas em `main.ts`), superfície IPC segura contra XSS/protocol abuse/acesso LAN não autorizado e UI v0.6.1 100% conectada ao backend real.
