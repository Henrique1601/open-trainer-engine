# 🏛️ Histórico de Decisões Arquiteturais (ADRs)

## ADR-001: Resolução de Capas e Ícones de Jogos Oficiais Estilo WeMod
- **Contexto:** Os cards de jogos utilizavam fotos genéricas do Unsplash e falhavam ao clicar se o jogo não tivesse trainer estático em `configs/trainers/`.
- **Decisão:** Criado o módulo `GameArtResolver` que conecta com a CDN oficial da Steam (`library_600x900_2x.jpg` e `header.jpg`), e adicionado handler IPC `app:get-file-icon` para extrair ícones nativos diretamente do `.exe` instalado na máquina do usuário.
- **Consequência:** Experiência 100% autêntica de biblioteca WeMod para Steam, Epic Games, Xbox Game Pass e GOG.

## ADR-002: Gatilho de Releases no GitHub Actions via Git Tags
- **Contexto:** Commits enviados diretamente para a branch `main` não geravam releases automáticos com binários `.exe`.
- **Decisão:** O workflow `.github/workflows/release.yml` escuta tags semânticas no formato `v*`. Toda nova versão deve ser acompanhada de uma git tag anotada (ex: `v0.4.2`) e sincronização do `package-lock.json` para garantir que `npm ci` e os builds NSIS/Portable sejam publicados automaticamente no GitHub Releases.

## ADR-003: In-App Auto-Updater com Download Direto
- **Contexto:** Ao avisar sobre novas atualizações, abrir abas externas no navegador causava atrito e SmartScreen warning.
- **Decisão:** Implementado fluxo nativo `updater:download-update` e `updater:install-and-restart` dentro do app Electron, realizando download silencioso e aplicando o instalador NSIS diretamente.
