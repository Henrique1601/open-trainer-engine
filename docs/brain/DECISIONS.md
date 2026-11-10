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
