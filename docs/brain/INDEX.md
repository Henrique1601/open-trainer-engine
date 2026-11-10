# 🧠 Segundo Cérebro & Knowledge Base — Open Trainer Engine

Bem-vindo ao Segundo Cérebro do **Open Trainer Engine**. Esta base de conhecimento perene registra a arquitetura do projeto, histórico de decisões, pipelines de CI/CD e lições aprendidas.

---

## 📌 Documentos Mestres
- [[DECISIONS|Histórico de Decisões Arquiteturais (ADRs)]]
- [[GOTCHAS|Armadilhas Conhecidas & Lições Aprendidas]]

---

## 🚀 Versão Atual em Produção
- **Versão:** `v0.5.1`
- **Release no GitHub:** [v0.5.1 Releases](https://github.com/Henrique1601/open-trainer-engine/releases/tag/v0.5.1)
- **Correções & Recursos da v0.5.1:**
  - **Correção de Renderização:** Corrigida a substituição de `displaySelectedGameDetails` no frontend para carregar ativamente `trainer:get-cheats` em todos os jogos instalados.
  - **Seletor de Temas Visível:** Injetada a paleta de 5 temas visuais na barra lateral do app (`theme-selector-box`).
  - **Toolbar de Mods:** Adicionados a barra de busca e chips de filtro por categoria na tela de cheats.
  - **Botão Criar Cheat:** Botão `➕ CRIAR NOVO CHEAT` agora renderizado diretamente na interface com o Modal 3D Glass.
  - **Motion 3D & Speedhack Real:** Micro-pulsos de temporização precisa para Bullet-Time e elevação de prioridade Win32 para Turbo.
