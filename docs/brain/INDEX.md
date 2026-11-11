# 🧠 Segundo Cérebro & Knowledge Base — Open Trainer Engine

Bem-vindo ao Segundo Cérebro do **Open Trainer Engine**. Esta base de conhecimento perene registra a arquitetura do projeto, histórico de decisões, pipelines de CI/CD e lições aprendidas.

---

## 📌 Documentos Mestres
- [[DECISIONS|Histórico de Decisões Arquiteturais (ADRs)]]
- [[GOTCHAS|Armadilhas Conhecidas & Lições Aprendidas]]

---

## 🚀 Versão Atual em Produção
- **Versão:** `v0.5.3`
- **Release no GitHub:** [v0.5.3 Releases](https://github.com/Henrique1601/open-trainer-engine/releases/tag/v0.5.3)
- **Correções & Recursos da v0.5.3:**
  - **Correção Crítica de Botões (SyntaxError no `<script>`):** Corrigido o caractere de escape de quebra de linha que quebrava o parser JavaScript no Chromium, impedindo a definição das funções de clique.
  - **Guarda de Sintaxe Automatizada:** Integrada validação estrita via `vm.Script` na geração de HTML e na nova suíte `tests/ui-syntax-and-handlers.test.ts`.
  - **Redesign Visual WeMod Pro AAA:** Tipografia `Outfit` + `Plus Jakarta Sans`, Topbar Header com busca `Ctrl+K`, Keycaps mecânicos 3D interativos, sons sintetizados Web Audio API e Speedhack Cockpit.
