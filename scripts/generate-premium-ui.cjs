/**
 * generate-wemod-v10-ui.cjs
 * Gerador da Interface Oficial WeMod / Wand v10 para Open Trainer Engine.
 * Fidelidade visual total aos 5 screenshots do usuário:
 * 1. Início/Destaques: Topbar WAND, History arrows, Hero duplo, Meus jogos cápsulas, Mais populares.
 * 2. Menu de Perfil: Popup do avatar com Meu Perfil, Ajuda ↗, Steam, Discord ↗, Feedback, Configurações.
 * 3. Mapas: 4 colunas com preview topográfico, badge "X MAPAS", ícone + título, favorito.
 * 4. Biblioteca: Meus jogos em lista compacta com ícone, título, estrela, gêneros, logo Steam/Epic.
 * 5. Detalhes do Jogo: Sub-nav contextual na sidebar, Hero widescreen com poster vertical,
 *    chips de categoria (Todos, Assistir, Facilitar, Sandbox, Novo Pro), cheats com toggle Off/On WeMod,
 *    keycaps 3D, e coluna direita com Mapa interativo e Video companion.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function generateHtml() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Open Trainer Engine • Wand / WeMod Edition</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    /* ==========================================================================
       DESIGN TOKENS & MULTITEMAS (Base WeMod v10 / Panda CSS)
       ========================================================================== */
    :root, [data-theme="wemod"] {
      --bg-canvas: #111217;
      --bg-sidebar: #13141a;
      --bg-topbar: #16171d;
      --bg-card: #1a1c24;
      --bg-card-hover: #212430;
      --bg-surface: #20232d;
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(0, 245, 155, 0.5);
      
      --accent: #00f59b;
      --accent-hover: #00d9b5;
      --accent-glow: rgba(0, 245, 155, 0.35);
      --accent-text: #000000;
      
      --pro-gold: #ffd700;
      --pro-gold-grad: linear-gradient(135deg, #fce881 0%, #e5a910 100%);
      --pulse-purple: #c026d3;
      
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --text-dim: #6b7280;
      
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --radius-pill: 9999px;
      
      --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      --transition-normal: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    [data-theme="cyberpunk"] {
      --bg-canvas: #090a0f;
      --bg-sidebar: #0f1017;
      --bg-topbar: #141522;
      --bg-card: #181928;
      --bg-card-hover: #23253a;
      --accent: #00e5ff;
      --accent-hover: #00c4db;
      --accent-glow: rgba(0, 229, 255, 0.4);
      --accent-text: #000000;
      --pro-gold: #fcee0a;
      --pro-gold-grad: linear-gradient(135deg, #fcee0a 0%, #ff0055 100%);
    }

    [data-theme="obsidian"] {
      --bg-canvas: #08080a;
      --bg-sidebar: #0c0d10;
      --bg-topbar: #101116;
      --bg-card: #15161d;
      --bg-card-hover: #1e202a;
      --accent: #a855f7;
      --accent-hover: #9333ea;
      --accent-glow: rgba(168, 85, 247, 0.35);
      --accent-text: #ffffff;
      --pro-gold: #eab308;
      --pro-gold-grad: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
    }

    [data-theme="crimson"] {
      --bg-canvas: #0f0a0a;
      --bg-sidebar: #140d0d;
      --bg-topbar: #1c1212;
      --bg-card: #221616;
      --bg-card-hover: #2e1e1e;
      --accent: #ff334b;
      --accent-hover: #e0243b;
      --accent-glow: rgba(255, 51, 75, 0.4);
      --accent-text: #ffffff;
      --pro-gold: #f59e0b;
      --pro-gold-grad: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    [data-theme="frost"] {
      --bg-canvas: #0c1117;
      --bg-sidebar: #101720;
      --bg-topbar: #151e2a;
      --bg-card: #1a2533;
      --bg-card-hover: #243346;
      --accent: #38bdf8;
      --accent-hover: #0ea5e9;
      --accent-glow: rgba(56, 189, 248, 0.4);
      --accent-text: #000000;
      --pro-gold: #fbbf24;
      --pro-gold-grad: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      user-select: none;
      -webkit-user-select: none;
    }

    body {
      background-color: var(--bg-canvas);
      color: var(--text-main);
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Scrollbars Modernos */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.15);
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-pill);
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    /* ==========================================================================
       TOPBAR HEADER WAND (Fidelidade ao Print 1)
       ========================================================================== */
    .wand-topbar {
      height: 52px;
      background-color: var(--bg-topbar);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      flex-shrink: 0;
      z-index: 100;
      -webkit-app-region: drag;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
      -webkit-app-region: no-drag;
    }

    .wand-logo-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .wand-wordmark {
      font-family: 'Outfit', sans-serif;
      font-weight: 900;
      font-size: 20px;
      letter-spacing: 2.5px;
      color: #ffffff;
      text-transform: uppercase;
      display: flex;
      align-items: center;
    }

    .wand-wordmark span {
      color: var(--accent);
    }

    .topbar-nav-btns {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: 8px;
    }

    .topbar-circle-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-pill);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      transition: all var(--transition-fast);
    }
    .topbar-circle-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* Centro: Barra de Busca Central Pill */
    .topbar-center {
      flex: 1;
      max-width: 440px;
      margin: 0 20px;
      -webkit-app-region: no-drag;
    }

    .wand-search-pill {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-pill);
      padding: 0 14px;
      height: 34px;
      transition: all var(--transition-fast);
    }
    .wand-search-pill:focus-within {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--accent);
      box-shadow: 0 0 12px var(--accent-glow);
    }

    .wand-search-pill input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #ffffff;
      font-size: 13px;
      padding: 0 8px;
    }
    .wand-search-pill input::placeholder {
      color: var(--text-dim);
    }

    .search-btn-action {
      background: rgba(255, 255, 255, 0.08);
      border: none;
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: var(--radius-pill);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .search-btn-action:hover {
      background: var(--accent);
      color: var(--accent-text);
    }

    /* Direita: Ações, Perfil, Pro, Janela */
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
      -webkit-app-region: no-drag;
    }

    .topbar-icon-action {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 16px;
      cursor: pointer;
      padding: 6px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color var(--transition-fast);
    }
    .topbar-icon-action:hover {
      color: #ffffff;
    }

    /* Avatar do Usuário com Menu Dropdown */
    .user-avatar-wrap {
      position: relative;
    }

    .user-avatar-btn {
      width: 30px;
      height: 30px;
      border-radius: var(--radius-pill);
      border: 2px solid var(--border-subtle);
      cursor: pointer;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #2a2d39;
      transition: border-color var(--transition-fast);
    }
    .user-avatar-btn:hover {
      border-color: var(--accent);
    }
    .user-avatar-btn img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Botão Dourado Torne-se Pro */
    .btn-torne-se-pro {
      background: var(--pro-gold-grad);
      color: #000000;
      font-weight: 800;
      font-size: 11px;
      letter-spacing: 0.8px;
      padding: 7px 14px;
      border-radius: var(--radius-pill);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      text-transform: uppercase;
      transition: transform var(--transition-fast), filter var(--transition-fast);
    }
    .btn-torne-se-pro:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    .suporte-wand-btn {
      color: var(--text-dim);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      transition: color var(--transition-fast);
    }
    .suporte-wand-btn:hover {
      color: var(--text-main);
    }

    /* Controles de Janela */
    .window-controls {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: 6px;
    }

    .window-control-btn {
      width: 28px;
      height: 28px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      font-size: 12px;
      transition: all var(--transition-fast);
    }
    .window-control-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }
    .window-control-btn.close:hover {
      background: #ef4444;
      color: #ffffff;
    }

    /* ==========================================================================
       MENU POPUP DE PERFIL (Fidelidade ao Print 2)
       ========================================================================== */
    .profile-dropdown-menu {
      position: absolute;
      top: 48px;
      right: 0;
      width: 240px;
      background: #1e202a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: var(--radius-lg);
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.75);
      padding: 8px 0;
      display: none;
      flex-direction: column;
      z-index: 1000;
    }
    .profile-dropdown-menu.show {
      display: flex;
    }

    .profile-menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      color: var(--text-main);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background var(--transition-fast);
    }
    .profile-menu-item:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }

    .profile-menu-item-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .profile-menu-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      margin: 6px 0;
    }

    /* ==========================================================================
       CONTAINER PRINCIPAL (Sidebar + Workspace)
       ========================================================================== */
    .app-main-layout {
      flex: 1;
      display: flex;
      overflow: hidden;
      position: relative;
    }

    /* ==========================================================================
       SIDEBAR DINÂMICA (Fidelidade aos Prints 1 e 5)
       ========================================================================== */
    .wand-sidebar {
      width: 250px;
      background-color: var(--bg-sidebar);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      overflow-y: auto;
      overflow-x: hidden;
    }

    /* Sub-menu Contextual do Jogo Selecionado (Print 5) */
    .sidebar-active-game-box {
      display: none;
      flex-direction: column;
      padding: 12px 14px 8px 14px;
      background: rgba(0, 0, 0, 0.25);
      border-bottom: 1px solid var(--border-subtle);
    }
    .sidebar-active-game-box.show {
      display: flex;
    }

    .sidebar-active-pill {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-pill);
      padding: 4px 6px 4px 10px;
      margin-bottom: 8px;
    }

    .sidebar-active-title {
      font-size: 12px;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }

    .sidebar-active-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .sidebar-play-circle-btn {
      width: 26px;
      height: 26px;
      border-radius: var(--radius-pill);
      background: #ffffff;
      color: #000000;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 900;
      transition: transform var(--transition-fast);
    }
    .sidebar-play-circle-btn:hover {
      transform: scale(1.08);
      background: var(--accent);
    }

    .sidebar-subnav-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .sidebar-subnav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 7px 10px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .sidebar-subnav-item:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #ffffff;
    }
    .sidebar-subnav-item.active {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      font-weight: 700;
    }

    .sidebar-badge-novo {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-muted);
      font-size: 9px;
      font-weight: 800;
      padding: 1px 4px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    /* Navegação Primária Normal */
    .sidebar-primary-nav {
      padding: 14px 10px 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .sidebar-nav-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 12px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .sidebar-nav-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #ffffff;
    }
    .sidebar-nav-btn.active {
      background: rgba(255, 255, 255, 0.09);
      color: #ffffff;
      font-weight: 700;
    }
    .sidebar-nav-btn-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .badge-pulse-gift {
      background: var(--pulse-purple);
      color: #ffffff;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: var(--radius-pill);
    }

    /* Seções Favoritos e Meus Jogos */
    .sidebar-section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 14px 6px 14px;
      font-size: 11px;
      font-weight: 800;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .sidebar-games-scroll {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 8px 20px 8px;
    }

    .sidebar-game-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 8px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background var(--transition-fast);
    }
    .sidebar-game-row:hover {
      background: rgba(255, 255, 255, 0.07);
    }
    .sidebar-game-row.active {
      background: rgba(0, 245, 155, 0.12);
      border-left: 3px solid var(--accent);
    }

    .sidebar-game-icon {
      width: 22px;
      height: 22px;
      border-radius: 4px;
      object-fit: cover;
      background: #252836;
      flex-shrink: 0;
    }

    .sidebar-game-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color var(--transition-fast);
    }
    .sidebar-game-row:hover .sidebar-game-name,
    .sidebar-game-row.active .sidebar-game-name {
      color: #ffffff;
    }

    /* ==========================================================================
       ÁREA DE CONTEÚDO PRINCIPAL (TABS)
       ========================================================================== */
    .wand-content-area {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
      background-color: var(--bg-canvas);
    }

    .tab-view {
      display: none;
      flex-direction: column;
      min-height: 100%;
    }
    .tab-view.active {
      display: flex;
    }

    /* ==========================================================================
       VIEW 1: INÍCIO / DESTAQUES (Print 1)
       ========================================================================== */
    .view-destaques-wrap {
      padding: 24px 32px 60px 32px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .destaques-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .destaques-hero-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
    }

    .carousel-arrows {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .carousel-arrow-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-pill);
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border-subtle);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 13px;
      transition: all var(--transition-fast);
    }
    .carousel-arrow-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Hero Banner Grid (Cards Duplos Largos) */
    .hero-widescreen-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }

    .hero-card {
      position: relative;
      height: 290px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      cursor: pointer;
      border: 1px solid var(--border-subtle);
      transition: transform var(--transition-fast), border-color var(--transition-fast);
      background-size: cover;
      background-position: center;
    }
    .hero-card:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .hero-card-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.85) 100%);
    }

    .hero-badge-tag {
      position: absolute;
      top: 14px;
      right: 14px;
      background: #00d9b5;
      color: #000000;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .hero-card-footer {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
    }

    .hero-card-name {
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.5px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.8);
    }

    /* Seções de Jogos Cápsula (Meus Jogos, Mais Populares, etc) */
    .game-shelf-section {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .shelf-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .shelf-title {
      font-size: 16px;
      font-weight: 800;
      color: #ffffff;
    }

    .shelf-scroll-row {
      display: flex;
      gap: 14px;
      overflow-x: auto;
      padding-bottom: 6px;
      scroll-behavior: smooth;
    }

    .game-capsule-card {
      flex: 0 0 210px;
      height: 105px;
      border-radius: var(--radius-md);
      position: relative;
      overflow: hidden;
      cursor: pointer;
      border: 1px solid var(--border-subtle);
      background-size: cover;
      background-position: center;
      transition: all var(--transition-fast);
    }
    .game-capsule-card:hover {
      transform: translateY(-3px) scale(1.02);
      border-color: var(--accent);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
    }

    .capsule-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.85) 100%);
      display: flex;
      align-items: flex-end;
      padding: 10px;
    }

    .capsule-title {
      font-size: 12px;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-shadow: 0 2px 4px rgba(0,0,0,0.8);
    }

    .capsule-star-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      color: #ffffff;
      font-size: 12px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
    }

    /* ==========================================================================
       VIEW 2: MAPAS (Fidelidade ao Print 3)
       ========================================================================== */
    .view-maps-wrap {
      padding: 24px 32px 60px 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .maps-top-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .maps-page-title {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
    }

    .maps-view-switchers {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .maps-filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .maps-filter-chips {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-chip {
      padding: 6px 14px;
      border-radius: var(--radius-pill);
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all var(--transition-fast);
    }
    .filter-chip:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }
    .filter-chip.active {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-weight: 700;
    }

    .maps-sort-selector {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-dim);
    }

    .sort-pill {
      color: var(--text-muted);
      padding: 4px 10px;
      border-radius: var(--radius-pill);
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition-fast);
    }
    .sort-pill.active {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    /* Grid de 4 Colunas para Mapas (Print 3) */
    .maps-quad-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .map-card-item {
      height: 125px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      position: relative;
      overflow: hidden;
      cursor: pointer;
      background-size: cover;
      background-position: center;
      transition: all var(--transition-fast);
    }
    .map-card-item:hover {
      transform: translateY(-2px);
      border-color: var(--accent);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
    }

    .map-badge-count {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(255, 255, 255, 0.9);
      color: #000000;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .map-footer-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 10px;
      background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 100%);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .map-game-info {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
    }

    .map-game-icon {
      width: 22px;
      height: 22px;
      border-radius: 4px;
      object-fit: cover;
    }

    .map-game-title {
      font-size: 12px;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .map-star-toggle {
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
      cursor: pointer;
      transition: color var(--transition-fast);
    }
    .map-star-toggle:hover, .map-star-toggle.active {
      color: #ffffff;
    }

    /* ==========================================================================
       VIEW 3: BIBLIOTECA / MEUS JOGOS EM LISTA (Print 4)
       ========================================================================== */
    .view-library-wrap {
      padding: 24px 32px 60px 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .library-table-container {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 10px;
    }

    .library-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background var(--transition-fast);
    }
    .library-row:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .library-col-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }

    .library-game-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      object-fit: cover;
      background: #252836;
    }

    .library-game-title {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
      min-width: 200px;
    }

    .library-star-btn {
      color: rgba(255, 255, 255, 0.35);
      font-size: 14px;
      cursor: pointer;
      background: none;
      border: none;
      transition: color var(--transition-fast);
    }
    .library-star-btn:hover, .library-star-btn.active {
      color: #ffffff;
    }

    .library-col-center {
      flex: 1.5;
      font-size: 12px;
      color: var(--text-dim);
    }

    .library-col-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .platform-icon-tag {
      font-size: 16px;
      color: var(--text-dim);
    }

    /* ==========================================================================
       VIEW 4: TELA DE DETALHES DO JOGO (Print 5 - Assassin's Creed Origins)
       ========================================================================== */
    .view-game-details-wrap {
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }

    /* Hero Banner do Jogo com Arte e Poster */
    .game-hero-header {
      position: relative;
      min-height: 270px;
      background-size: cover;
      background-position: center top;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 24px 32px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .game-hero-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(17, 18, 23, 0.3) 0%, rgba(17, 18, 23, 0.95) 100%);
    }

    .game-hero-content {
      position: relative;
      z-index: 2;
      display: flex;
      gap: 24px;
      align-items: flex-end;
    }

    .game-vertical-poster {
      width: 140px;
      height: 200px;
      border-radius: var(--radius-md);
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.7);
      flex-shrink: 0;
      background: #1e202a;
    }

    .game-hero-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .game-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .game-title-large {
      font-size: 30px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }

    .game-hero-subtabs {
      display: flex;
      align-items: center;
      gap: 18px;
      margin-top: 4px;
    }

    .subtab-link {
      font-size: 11px;
      font-weight: 800;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      cursor: pointer;
      transition: color var(--transition-fast);
      position: relative;
      padding-bottom: 4px;
    }
    .subtab-link:hover {
      color: #ffffff;
    }
    .subtab-link.active {
      color: #ffffff;
      border-bottom: 2px solid var(--accent);
    }

    .game-hero-badge-gold {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--pro-gold-grad);
      color: #000000;
      font-size: 10px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: var(--radius-pill);
      text-transform: uppercase;
      width: fit-content;
      margin-top: 4px;
    }

    .game-hero-actions-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }

    .hero-action-round-btn {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-pill);
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border-subtle);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 15px;
      transition: all var(--transition-fast);
    }
    .hero-action-round-btn:hover {
      background: rgba(255, 255, 255, 0.18);
    }
    .hero-action-round-btn.record-btn {
      color: #ef4444;
    }

    .btn-salvar-mods-pro {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border-subtle);
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: var(--radius-pill);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .btn-salvar-mods-pro:hover {
      background: rgba(255, 255, 255, 0.16);
    }
    .btn-salvar-mods-pro span.pro-tag {
      background: var(--pulse-purple);
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 4px;
    }

    /* Botão Gigante Branco JOGAR (Print 5) */
    .btn-giant-play-wemod {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      color: #000000;
      font-size: 14px;
      font-weight: 800;
      padding: 10px 24px;
      border-radius: var(--radius-pill);
      border: none;
      cursor: pointer;
      transition: all var(--transition-fast);
      box-shadow: 0 4px 14px rgba(255, 255, 255, 0.2);
    }
    .btn-giant-play-wemod:hover {
      background: var(--accent);
      transform: translateY(-1px);
    }
    .btn-giant-play-wemod.playing {
      background: #ef4444;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
    }

    /* Stats do Jogo no Canto Superior Direito */
    .game-stats-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
      text-align: right;
      font-size: 11px;
      color: var(--text-dim);
    }
    .game-stat-item b {
      color: #ffffff;
      font-weight: 600;
    }

    /* Barra de Categorias de Cheats (Print 5) */
    .game-cheats-nav-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 32px;
      background: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid var(--border-subtle);
    }

    .cheat-cat-pill {
      padding: 6px 14px;
      border-radius: var(--radius-pill);
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all var(--transition-fast);
    }
    .cheat-cat-pill:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }
    .cheat-cat-pill.active {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }
    .cheat-cat-pill.novo-pro {
      background: rgba(0, 245, 155, 0.1);
      border-color: var(--accent);
      color: var(--accent);
    }

    /* Layout de 2 Colunas para Cheats e Painel Lateral (Print 5) */
    .game-details-columns {
      display: flex;
      padding: 20px 32px 60px 32px;
      gap: 28px;
    }

    .cheats-column-left {
      flex: 1.8;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .cheats-group-box {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .cheat-group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 800;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding-bottom: 4px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    /* Linha de Cheat WeMod */
    .cheat-row-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.02);
      transition: background var(--transition-fast);
    }
    .cheat-row-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .cheat-name-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }

    .cheat-icon-bolt {
      color: var(--text-dim);
      font-size: 13px;
    }

    .cheat-title-text {
      font-size: 13px;
      font-weight: 600;
      color: #ffffff;
    }

    .cheat-controls-wrap {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    /* Segmented Toggle WeMod [ Off | On ] (Print 5) */
    .wemod-toggle-pill {
      display: inline-flex;
      background: rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-pill);
      padding: 2px;
      cursor: pointer;
      user-select: none;
    }

    .toggle-segment {
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 700;
      border-radius: var(--radius-pill);
      color: var(--text-dim);
      transition: all var(--transition-fast);
    }

    .wemod-toggle-pill.off .toggle-segment.off {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
    }

    .wemod-toggle-pill.on .toggle-segment.on {
      background: var(--accent);
      color: var(--accent-text);
      font-weight: 800;
      box-shadow: 0 0 10px var(--accent-glow);
    }

    /* Keycap Mecânico 3D WeMod (Print 5) */
    .hotkey-badge-3d {
      background: #232630;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-bottom: 2px solid rgba(0, 0, 0, 0.5);
      border-radius: 4px;
      padding: 3px 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      min-width: 32px;
      text-align: center;
      transition: all var(--transition-fast);
    }
    .hotkey-badge-3d:hover {
      background: #2e323e;
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.25);
    }
    .hotkey-badge-3d.listening {
      background: var(--accent);
      color: var(--accent-text);
      animation: pulseHotkey 1s infinite alternate;
    }

    @keyframes pulseHotkey {
      from { transform: scale(1); }
      to { transform: scale(1.08); }
    }

    /* Painel Lateral Direito: Mapa Interativo e Video Companion (Print 5) */
    .widgets-column-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .widget-map-card {
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      overflow: hidden;
      background: #1a1c24;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: border-color var(--transition-fast);
    }
    .widget-map-card:hover {
      border-color: var(--accent);
    }

    .widget-map-preview {
      height: 140px;
      background-size: cover;
      background-position: center;
      position: relative;
    }

    .widget-map-header {
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      padding: 4px 10px;
      border-radius: var(--radius-pill);
      font-size: 11px;
      font-weight: 700;
      color: #ffffff;
    }

    .widget-map-footer {
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 700;
      color: var(--accent);
    }

    /* Video Companion Card */
    .widget-video-card {
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      overflow: hidden;
      background: #1a1c24;
      display: flex;
      flex-direction: column;
    }

    .video-companion-thumb {
      height: 180px;
      background-size: cover;
      background-position: center;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .video-play-btn {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-pill);
      background: rgba(0, 0, 0, 0.75);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      cursor: pointer;
      transition: transform var(--transition-fast);
    }
    .video-play-btn:hover {
      transform: scale(1.1);
      background: var(--accent);
      color: #000000;
    }

    .video-card-body {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .video-card-title {
      font-size: 12px;
      font-weight: 700;
      color: #ffffff;
    }

    .video-card-pro-banner {
      margin-top: 8px;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      color: var(--text-dim);
    }

    /* ==========================================================================
       MODAIS (Configurações, Mapa Interativo, Adicionar Cheat)
       ========================================================================== */
    .wand-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      z-index: 2000;
      display: none;
      align-items: center;
      justify-content: center;
    }
    .wand-modal-backdrop.show {
      display: flex;
    }

    .wand-modal-card {
      background: #1a1c24;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 560px;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title {
      font-size: 16px;
      font-weight: 800;
      color: #ffffff;
    }

    .modal-close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 18px;
      cursor: pointer;
      transition: color var(--transition-fast);
    }
    .modal-close-btn:hover {
      color: #ffffff;
    }

    .modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Banner de Atualização do App */
    .app-update-banner {
      display: none;
      background: linear-gradient(90deg, #1e1b4b 0%, #312e81 100%);
      border-bottom: 1px solid #4338ca;
      padding: 10px 20px;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: #e0e7ff;
      z-index: 99;
    }
    .app-update-btn {
      background: var(--accent);
      color: var(--accent-text);
      font-weight: 800;
      padding: 5px 12px;
      border-radius: var(--radius-pill);
      border: none;
      cursor: pointer;
    }

    /* Toast Notification Não-Bloqueante */
    .wand-toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 3000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }
    .wand-toast {
      background: #1e202a;
      border: 1px solid var(--border-focus);
      color: #ffffff;
      padding: 10px 16px;
      border-radius: var(--radius-md);
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
      animation: toastSlideIn 0.2s ease-out;
    }
    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body data-theme="wemod">

  <!-- ========================================================================
       TOPBAR HEADER WAND (Fidelidade ao Print 1)
       ======================================================================== -->
  <header class="wand-topbar topbar-header">
    <div class="topbar-left">
      <div class="wand-logo-wrap" onclick="switchTab('tab-home')">
        <div class="wand-wordmark">WAND<span>.</span></div>
      </div>
      <div class="topbar-nav-btns">
        <button class="topbar-circle-btn" onclick="historyBack()" title="Voltar">←</button>
        <button class="topbar-circle-btn" onclick="historyForward()" title="Avançar">→</button>
        <button class="topbar-circle-btn" onclick="switchTab('tab-home')" title="Início">🏠</button>
      </div>
    </div>

    <div class="topbar-center">
      <div class="wand-search-pill">
        <span style="color: var(--text-dim); font-size: 13px;">🔍</span>
        <input type="text" id="global-search-input" placeholder="Buscar jogos, cheats, mapas..." oninput="onGlobalSearch(this.value)" onkeydown="if(event.key==='Enter')onGlobalSearch(this.value)">
        <span class="search-kbd-badge" style="font-size: 10px; font-weight: 700; color: var(--text-dim); margin-right: 6px;">CTRL+K</span>
        <button class="search-btn-action" onclick="onGlobalSearch(document.getElementById('global-search-input').value)">Ir</button>
      </div>
    </div>

    <div class="topbar-right">
      <span id="engine-status-pill" style="display: none;">ENGINE PRONTA</span>
      <button class="topbar-icon-action" id="btn-sound-toggle" onclick="toggleGlobalSound()" title="Sons WeMod">🔊</button>
      <button class="topbar-icon-action" onclick="openHelpModal()" title="Ajuda & FAQ">❓</button>
      <button class="topbar-icon-action" onclick="openPointsModal()" title="Pontos Wand">🪙</button>
      <button class="topbar-icon-action" onclick="openPlaytimeTracker()" title="Tempo de Jogo">⏱️</button>

      <span id="engine-status-pill" style="display: none;">ENGINE PRONTA</span>

      <!-- Avatar do Usuário (Abre Menu Dropdown - Print 2) -->
      <div class="user-avatar-wrap">
        <div class="user-avatar-btn" onclick="toggleProfileMenu(event)">
          <img src="https://avatars.githubusercontent.com/u/9919?s=80&v=4" alt="Avatar" id="user-avatar-img">
        </div>

        <!-- Menu Popup (Print 2) -->
        <div class="profile-dropdown-menu" id="profile-dropdown-menu">
          <div class="profile-menu-item" onclick="openProfilePage()">
            <div class="profile-menu-item-left">
              <img src="https://avatars.githubusercontent.com/u/9919?s=80&v=4" style="width: 22px; height: 22px; border-radius: 50%;">
              <span>Meu Perfil</span>
            </div>
          </div>
          <div class="profile-menu-divider"></div>
          <div class="profile-menu-item" onclick="openHelpModal()">
            <div class="profile-menu-item-left">
              <span>❓</span>
              <span>Ajuda</span>
            </div>
            <span style="font-size: 11px; color: var(--text-dim);">↗</span>
          </div>
          <div class="profile-menu-item" onclick="refreshGames()">
            <div class="profile-menu-item-left">
              <span>🎮</span>
              <span>Conectar ao Steam</span>
            </div>
          </div>
          <div class="profile-menu-item" onclick="openDiscord()">
            <div class="profile-menu-item-left">
              <span>💬</span>
              <span>Discord</span>
            </div>
            <span style="font-size: 11px; color: var(--text-dim);">↗</span>
          </div>
          <div class="profile-menu-item" onclick="openFeedbackModal()">
            <div class="profile-menu-item-left">
              <span>✍️</span>
              <span>Compartilhar feedback</span>
            </div>
          </div>
          <div class="profile-menu-divider"></div>
          <div class="profile-menu-item" onclick="openSettingsModal()">
            <div class="profile-menu-item-left">
              <span>⚙️</span>
              <span>Configurações</span>
            </div>
          </div>
        </div>
      </div>

      <div class="suporte-wand-btn" onclick="openHelpModal()">Suporte Wand</div>
      <button class="btn-torne-se-pro" onclick="openProModal()">Torne-se Pro</button>

      <!-- Controles de Janela -->
      <div class="window-controls">
        <button class="window-control-btn" onclick="windowMinimize()" title="Minimizar">─</button>
        <button class="window-control-btn" onclick="windowMaximize()" title="Maximizar">▢</button>
        <button class="window-control-btn close" onclick="windowClose()" title="Fechar">✕</button>
      </div>
    </div>
  </header>

  <!-- Banner de Atualização do App -->
  <div id="update-banner" class="app-update-banner">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span>🚀</span>
      <span id="update-text">Nova versão disponível!</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <button class="app-update-btn" onclick="startInAppUpdate()">Atualizar Agora</button>
      <button style="background:none;border:none;color:#ffffff;cursor:pointer;" onclick="dismissUpdateBanner()">✕</button>
    </div>
  </div>

  <!-- Layout Principal (Sidebar + Conteúdo) -->
  <div class="app-main-layout">

    <!-- ======================================================================
         SIDEBAR DINÂMICA (Prints 1 e 5)
         ====================================================================== -->
    <aside class="wand-sidebar">

      <!-- Sub-menu Contextual do Jogo Selecionado (Print 5) -->
      <div class="sidebar-active-game-box" id="sidebar-active-game-widget">
        <div class="sidebar-active-pill">
          <span class="sidebar-active-title" id="sidebar-active-title">Assassin's Creed Origins</span>
          <div class="sidebar-active-actions">
            <button style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:12px;" onclick="openGameOptionsMenu()">•••</button>
            <button class="sidebar-play-circle-btn" onclick="toggleAttachCurrentGame()" title="Jogar">▶</button>
          </div>
        </div>
        <div class="sidebar-subnav-list">
          <div class="sidebar-subnav-item active" onclick="switchGameSubtab('personalizar', this)">
            <span>⚡ Personalizar</span>
          </div>
          <div class="sidebar-subnav-item" onclick="switchGameSubtab('mapa', this)">
            <span>🗺️ Mapa</span>
          </div>
          <div class="sidebar-subnav-item" onclick="switchGameSubtab('destaques', this)">
            <span>🎬 Destaques</span>
            <span class="sidebar-badge-novo">NOVO</span>
          </div>
          <div class="sidebar-subnav-item" onclick="switchGameSubtab('sessoes', this)">
            <span>⏱️ Sessões</span>
            <span class="sidebar-badge-novo">NOVO</span>
          </div>
          <div class="sidebar-subnav-item" onclick="switchGameSubtab('sugestoes', this)">
            <span>💡 Sugestões</span>
            <span class="sidebar-badge-novo">NOVO</span>
          </div>
        </div>
      </div>

      <!-- Navegação Primária Normal -->
      <div class="sidebar-primary-nav">
        <div class="sidebar-nav-btn" id="nav-btn-maps" onclick="switchTab('tab-maps', this)">
          <div class="sidebar-nav-btn-left">
            <span>🗺️</span>
            <span>Mapas</span>
          </div>
        </div>
        <div class="sidebar-nav-btn active" id="nav-btn-home" onclick="switchTab('tab-home', this)">
          <div class="sidebar-nav-btn-left">
            <span>⭐</span>
            <span>Destaques</span>
          </div>
        </div>
        <div class="sidebar-nav-btn" id="nav-btn-pro" onclick="openProModal()">
          <div class="sidebar-nav-btn-left">
            <span>⚡</span>
            <span>Wand Pro</span>
          </div>
        </div>
        <div class="sidebar-nav-btn" id="nav-btn-library" onclick="switchTab('tab-library', this)">
          <div class="sidebar-nav-btn-left">
            <span>📚</span>
            <span>Biblioteca</span>
          </div>
        </div>
        <div class="sidebar-nav-btn" id="nav-btn-pulse" onclick="switchTab('tab-pulse', this)">
          <div class="sidebar-nav-btn-left">
            <span>🔮</span>
            <span>Pulse</span>
          </div>
          <span class="badge-pulse-gift">🎁</span>
        </div>
      </div>

      <!-- Seção Favoritos -->
      <div class="sidebar-section-title">
        <span>⭐ Favoritos</span>
        <span id="fav-count">0</span>
      </div>
      <div class="sidebar-games-scroll" id="sidebar-favorites-list"></div>

      <!-- Seção Meus Jogos (168) -->
      <div class="sidebar-section-title">
        <span>🎮 Meus Jogos</span>
        <span id="games-count">0</span>
      </div>
      <div class="sidebar-games-scroll" id="sidebar-installed-games-list"></div>
    </aside>

    <!-- ======================================================================
         ÁREA DE CONTEÚDO PRINCIPAL
         ====================================================================== -->
    <main class="wand-content-area" id="main-content-scroll">

      <!-- --------------------------------------------------------------------
           VIEW 1: INÍCIO / DESTAQUES (Print 1)
           -------------------------------------------------------------------- -->
      <div class="tab-view active" id="tab-home">
        <div class="view-destaques-wrap">
          <div class="destaques-header-row">
            <h1 class="destaques-hero-title" id="home-hero-title">Phantom Blade Zero</h1>
            <div class="carousel-arrows">
              <button class="carousel-arrow-btn" onclick="changeHeroSlide(-1)">❮</button>
              <button class="carousel-arrow-btn" onclick="changeHeroSlide(1)">❯</button>
            </div>
          </div>

          <!-- Hero Duplo Widescreen (Print 1) -->
          <div class="hero-widescreen-grid">
            <div class="hero-card" id="hero-card-1" style="background-image: url('https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/10/header.jpg');" onclick="openGameByTitleOrFirst('Phantom Blade Zero')">
              <div class="hero-card-gradient"></div>
              <span class="hero-badge-tag">NEW</span>
              <div class="hero-card-footer">
                <div class="hero-card-name">PHANTOM BLADE 0</div>
              </div>
            </div>

            <div class="hero-card" id="hero-card-2" style="background-image: url('https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg');" onclick="openGameByTitleOrFirst('Crimson Desert')">
              <div class="hero-card-gradient"></div>
              <span class="hero-badge-tag">UPDATE</span>
              <div class="hero-card-footer">
                <div class="hero-card-name">CRIMSON DESERT</div>
              </div>
            </div>
          </div>

          <!-- Seção Meus Jogos Cápsulas (Print 1) -->
          <section class="game-shelf-section">
            <div class="shelf-header">
              <h2 class="shelf-title">Meus jogos</h2>
            </div>
            <div class="shelf-scroll-row" id="shelf-installed-games"></div>
          </section>

          <!-- Seção Mais Populares (Print 1) -->
          <section class="game-shelf-section">
            <div class="shelf-header">
              <h2 class="shelf-title">Mais populares</h2>
            </div>
            <div class="shelf-scroll-row" id="shelf-popular-games"></div>
          </section>

          <!-- Seção Novos e Recentemente Atualizados (Print 1) -->
          <section class="game-shelf-section">
            <div class="shelf-header">
              <h2 class="shelf-title">Novos e recentemente atualizados</h2>
            </div>
            <div class="shelf-scroll-row" id="shelf-recent-games"></div>
          </section>
        </div>
      </div>

      <!-- --------------------------------------------------------------------
           VIEW 2: MAPAS (Print 3)
           -------------------------------------------------------------------- -->
      <div class="tab-view" id="tab-maps">
        <div class="view-maps-wrap">
          <div class="maps-top-header">
            <h1 class="maps-page-title">Mapas</h1>
            <div class="maps-view-switchers">
              <button class="topbar-circle-btn" onclick="setMapsLayout('grid')">▦</button>
              <button class="topbar-circle-btn" onclick="setMapsLayout('list')">☰</button>
            </div>
          </div>

          <div class="maps-filter-bar">
            <div class="maps-filter-chips">
              <div class="filter-chip active" onclick="filterMapsCategory('todos', this)">⊞ Todos</div>
              <div class="filter-chip" onclick="filterMapsCategory('favoritos', this)">⭐ Favoritos</div>
              <div class="filter-chip" onclick="filterMapsCategory('teletransportar', this)">📍 Teletransportar</div>
              <div class="filter-chip" onclick="filterMapsCategory('live', this)">🎯 Localização ao vivo</div>
            </div>

            <div class="maps-sort-selector">
              <span>Ordenar por</span>
              <span class="sort-pill active" onclick="sortMaps('populares', this)">Populares</span>
              <span class="sort-pill" onclick="sortMaps('recentes', this)">Jogados recentemente</span>
              <span class="sort-pill" onclick="sortMaps('az', this)">A-Z</span>
            </div>
          </div>

          <div class="shelf-header" style="margin-top: 10px;">
            <h2 class="shelf-title">Meus jogos <span style="font-size: 13px; color: var(--text-dim);" id="maps-installed-count">0</span></h2>
          </div>
          <div class="maps-quad-grid" id="maps-installed-grid"></div>

          <div class="shelf-header" style="margin-top: 20px;">
            <h2 class="shelf-title">Todos os mapas <span style="font-size: 13px; color: var(--text-dim);" id="maps-all-count">0</span></h2>
          </div>
          <div class="maps-quad-grid" id="maps-all-grid"></div>
        </div>
      </div>

      <!-- --------------------------------------------------------------------
           VIEW 3: BIBLIOTECA / MEUS JOGOS EM LISTA (Print 4)
           -------------------------------------------------------------------- -->
      <div class="tab-view" id="tab-library">
        <div class="view-library-wrap">
          <div class="maps-top-header">
            <h1 class="maps-page-title">Meus jogos</h1>
          </div>

          <div class="maps-filter-bar">
            <div class="maps-filter-chips">
              <div class="filter-chip active" onclick="filterLibrary('todos', this)">⊞ Todos</div>
              <div class="filter-chip" onclick="filterLibrary('favoritos', this)">⭐ Favoritos</div>
            </div>

            <div class="maps-sort-selector">
              <span>Ordenar por</span>
              <span class="sort-pill active" onclick="sortLibrary('recentes', this)">Jogados recentemente</span>
              <span class="sort-pill" onclick="sortLibrary('az', this)">A-Z</span>
            </div>
          </div>

          <div class="shelf-header" style="margin-top: 14px;">
            <h2 class="shelf-title">Prontos para jogar <span style="font-size: 13px; color: var(--text-dim);" id="library-count">0</span></h2>
          </div>

          <div class="library-table-container" id="library-games-list"></div>
        </div>
      </div>

      <!-- --------------------------------------------------------------------
           VIEW 4: TELA DE DETALHES DO JOGO (Print 5)
           -------------------------------------------------------------------- -->
      <div class="tab-view" id="tab-game-details">
        <div class="view-game-details-wrap">

          <!-- Hero Banner Superior com Arte e Poster -->
          <div class="game-hero-header" id="detail-hero-backdrop">
            <div class="game-hero-gradient"></div>
            <div class="game-hero-content">
              <img src="" id="detail-vertical-poster" class="game-vertical-poster" onerror="this.src='https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/10/library_600x900_2x.jpg'">

              <div class="game-hero-info">
                <div class="game-title-row">
                  <h1 class="game-title-large" id="detail-title">Assassin's Creed Origins</h1>
                  <button class="topbar-circle-btn" id="detail-fav-star-btn" onclick="toggleCurrentGameFavorite()" title="Favoritar">⭐</button>
                  <button class="topbar-circle-btn" onclick="toggleGameNotifications()" title="Notificações">🔔</button>
                </div>

                <div class="game-hero-subtabs">
                  <div class="subtab-link active" onclick="switchGameSubtab('personalizar', this)">PERSONALIZAR</div>
                  <div class="subtab-link" onclick="openGameMapTab()">MAPA</div>
                  <div class="subtab-link" onclick="switchGameSubtab('sessoes', this)">SESSÕES</div>
                  <div class="subtab-link" onclick="switchGameSubtab('destaques', this)">DESTAQUES</div>
                  <div class="subtab-link" onclick="switchGameSubtab('teletransportar', this)">TELETRANSPORTAR</div>
                </div>

                <div class="game-hero-badge-gold">
                  <span>✨ EXPERIMENTE A NOVA PÁGINA DO JOGO</span>
                </div>

                <div class="game-hero-actions-row">
                  <button class="hero-action-round-btn" onclick="openSettingsModal()" title="Ajustes de Mods">🎛️</button>
                  <button class="hero-action-round-btn record-btn" onclick="toggleGameRecording()" title="Gravar Highlight">⏺</button>
                  <button class="btn-salvar-mods-pro" onclick="saveCurrentGameModsPreset()">
                    <span>*Salvar* mods</span>
                    <span class="pro-tag">PRO</span>
                  </button>
                  <button class="btn-giant-play-wemod" id="btn-giant-play" onclick="toggleAttachCurrentGame()">
                    <span>▶ Jogar</span>
                    <span style="font-size: 10px; margin-left: 2px;">▼</span>
                  </button>
                </div>
              </div>

              <!-- Metadados no Canto Superior Direito (Print 5) -->
              <div class="game-stats-box">
                <div class="game-stat-item">INSTALADO EM <b id="detail-platform-name">Steam</b></div>
                <div class="game-stat-item">TEMPO DE JOGO <b id="detail-playtime">0,8 h</b></div>
                <div class="game-stat-item">JOGADO POR ÚLTIMO <b id="detail-last-played">Hoje</b></div>
                <div class="game-stat-item">GÊNERO <b id="detail-genres">Ação, RPG</b></div>
              </div>
            </div>
          </div>

          <!-- Filtros de Categoria de Cheats (Print 5) -->
          <div class="game-cheats-nav-bar">
            <div class="cheat-cat-pill active" onclick="filterCheatCategory('todos', this)">⊞ TODOS</div>
            <div class="cheat-cat-pill" onclick="filterCheatCategory('assistir', this)">🛡️ ASSISTIR</div>
            <div class="cheat-cat-pill" onclick="filterCheatCategory('facilitar', this)">🎯 FACILITAR</div>
            <div class="cheat-cat-pill" onclick="filterCheatCategory('sandbox', this)">🧪 SANDBOX</div>
            <div class="cheat-cat-pill novo-pro" onclick="openNewCheatModal()">+ NOVO PRO</div>
          </div>

          <!-- Layout de Duas Colunas: Cheats na Esquerda e Widgets na Direita -->
          <div class="game-details-columns">
            <div class="cheats-column-left" id="game-cheats-container"></div>

            <div class="widgets-column-right">
              <!-- Widget Mapa Interativo do Jogo (Print 5) -->
              <div class="widget-map-card" onclick="openGameMapTab()">
                <div class="widget-map-preview" id="detail-widget-map-bg" style="background-image: url('https://images.unsplash.com/photo-1524654458049-e36be0721fa2?w=600&auto=format&fit=crop');">
                  <div class="widget-map-header">
                    <span>📍</span>
                    <span id="detail-widget-map-title">Mapa Interativo</span>
                  </div>
                </div>
                <div class="widget-map-footer">
                  <span>Explorar Mapa & Teleporte</span>
                  <span>➔</span>
                </div>
              </div>

              <!-- Widget Video Companion / Destaques (Print 5) -->
              <div class="widget-video-card">
                <div class="video-companion-thumb" style="background-image: url('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop');">
                  <button class="video-play-btn" onclick="playVideoCompanion()">▶</button>
                </div>
                <div class="video-card-body">
                  <div class="video-card-title">Up Next - Guia & Destaques de Gameplay</div>
                  <div class="video-card-pro-banner">
                    <span>Remova anúncios com Wand PRO</span>
                    <button class="search-btn-action" onclick="openProModal()">INICIAR TESTE</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- VIEW PULSE -->
      <div class="tab-view" id="tab-pulse">
        <div class="view-destaques-wrap">
          <h1 class="destaques-hero-title">🔮 Wand Pulse & Recompensas</h1>
          <p style="color: var(--text-muted); font-size: 14px;">Conecte sua conta Discord e ganhe 1 mês de Discord Nitro e itens exclusivos.</p>
          <div style="background: var(--bg-card); padding: 24px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 16px;">
            <button class="btn-torne-se-pro" onclick="openProModal()">Resgatar Nitro Grátis</button>
          </div>
        </div>
      </div>

    </main>
  </div>

  <!-- ========================================================================
       MODAL DE CONFIGURAÇÕES (Temas, Áudio, Speedhack, HUD)
       ======================================================================== -->
  <div class="wand-modal-backdrop" id="settings-modal" onclick="if(event.target===this)closeSettingsModal()">
    <div class="wand-modal-card">
      <div class="modal-header">
        <div class="modal-title">⚙️ Configurações do Open Trainer Engine</div>
        <button class="modal-close-btn" onclick="closeSettingsModal()">✕</button>
      </div>
      <div class="modal-body">
        <div>
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 8px;">TEMA VISUAL</label>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="filter-chip active" onclick="applyAppTheme('wemod')">WeMod Emerald</button>
            <button class="filter-chip" onclick="applyAppTheme('cyberpunk')">Cyberpunk 2077</button>
            <button class="filter-chip" onclick="applyAppTheme('obsidian')">Obsidian Void</button>
            <button class="filter-chip" onclick="applyAppTheme('crimson')">Crimson ROG</button>
            <button class="filter-chip" onclick="applyAppTheme('frost')">Arctic Frost</button>
          </div>
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 8px;">SOBREPOSIÇÃO IN-GAME (HUD OVERLAY)</label>
          <button class="btn-salvar-mods-pro" onclick="toggleOverlayHud()">
            <span>Ativar / Desativar Overlay</span>
          </button>
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 8px;">SINTETIZADOR DE ÁUDIO</label>
          <button class="filter-chip" onclick="toggleGlobalSound()">Alternar Som</button>
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 8px;">REMOTE SERVER (APP NO CELULAR)</label>
          <p style="font-size: 12px; color: var(--text-dim); word-break: break-all;" id="settings-remote-url">Iniciando servidor local...</p>
          <img id="settings-remote-qr" alt="QR Code Remote" style="display: none; margin-top: 10px; width: 140px; height: 140px; border-radius: 8px; border: 1px solid var(--border-subtle);" />
        </div>
      </div>
    </div>
  </div>

  <div class="wand-toast-container" id="wand-toast-container"></div>

  <!-- MODAL MAPA INTERATIVO FULLSCREEN -->
  <div class="wand-modal-backdrop" id="map-modal" onclick="if(event.target===this)closeMapModal()">
    <div class="wand-modal-card" style="max-width: 95vw; height: 90vh;">
      <div class="modal-header">
        <div class="modal-title" id="modal-map-title">Mapa Interativo</div>
        <button class="modal-close-btn" onclick="closeMapModal()">✕</button>
      </div>
      <div style="flex: 1; position: relative;">
        <iframe id="map-iframe" style="width: 100%; height: 100%; border: none;" src="about:blank"></iframe>
      </div>
    </div>
  </div>

  <!-- MODAL TRAINER STUDIO (+ NOVO PRO / SCANNER / HEX) -->
  <div class="wand-modal-backdrop" id="new-cheat-modal" onclick="if(event.target===this)closeNewCheatModal()">
    <div class="wand-modal-card" style="max-width: 680px; width: 92%;">
      <div class="modal-header">
        <div class="modal-title">🛠️ Trainer Studio & Criador de Cheats</div>
        <button class="modal-close-btn" onclick="closeNewCheatModal()">✕</button>
      </div>
      <div style="display: flex; gap: 8px; padding: 0 24px 12px; border-bottom: 1px solid var(--border-subtle);">
        <button class="cheat-cat-pill active" id="studio-tab-btn-create" onclick="switchStudioTab('create', this)">✨ Criar Cheat</button>
        <button class="cheat-cat-pill" id="studio-tab-btn-scanner" onclick="switchStudioTab('scanner', this)">🔍 Memory Scanner</button>
        <button class="cheat-cat-pill" id="studio-tab-btn-hex" onclick="switchStudioTab('hex', this)">🧬 Hex & Disasm</button>
      </div>
      <div class="modal-body" id="studio-pane-create">
        <div>
          <label style="font-size: 11px; font-weight: 700; color: var(--text-muted);">NOME DO CHEAT</label>
          <input type="text" id="modal-cheat-name" placeholder="Ex: Super Pulo 10x" style="width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.06); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: #fff; margin-top: 4px;">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-muted);">CATEGORIA</label>
            <select id="modal-cheat-category" style="width: 100%; padding: 8px 12px; background: #20232d; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: #fff; margin-top: 4px;">
              <option value="Jogador">Jogador</option>
              <option value="Inventário">Inventário</option>
              <option value="Estatísticas">Estatísticas</option>
              <option value="Velocidade">Velocidade</option>
            </select>
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-muted);">TECLA DE ATALHO</label>
            <input type="text" id="modal-cheat-hotkey" placeholder="Ex: F11" style="width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.06); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: #fff; margin-top: 4px;">
          </div>
        </div>
        <div>
          <label style="font-size: 11px; font-weight: 700; color: var(--text-muted);">ENDEREÇO / AOB OPCIONAL (EX: 0x7FF... OU 89 45 FC)</label>
          <input type="text" id="modal-cheat-address" placeholder="Opcional — endereço de memória ou assinatura AOB" style="width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.06); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: #fff; margin-top: 4px; font-family: 'JetBrains Mono', monospace; font-size: 12px;">
        </div>
        <button class="btn-giant-play-wemod" style="margin-top: 10px;" onclick="saveNewCheatFromModal()">Adicionar Mod ao Jogo</button>
      </div>

      <div class="modal-body" id="studio-pane-scanner" style="display: none;">
        <div style="display: grid; grid-template-columns: 1fr 130px; gap: 10px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-muted);">VALOR ALVO</label>
            <input type="text" id="scanner-target-value" placeholder="Ex: 100" style="width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.06); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: #fff; margin-top: 4px;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-muted);">TIPO</label>
            <select id="scanner-value-type" style="width: 100%; padding: 8px 12px; background: #20232d; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: #fff; margin-top: 4px;">
              <option value="int32">Int32</option>
              <option value="float">Float</option>
              <option value="double">Double</option>
              <option value="int64">Int64</option>
            </select>
          </div>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          <button class="btn-salvar-mods-pro" onclick="runStudioFirstScan()">🔍 First Scan</button>
          <button class="search-btn-action" onclick="runStudioNextScan('ExactValue')">Exact</button>
          <button class="search-btn-action" onclick="runStudioNextScan('IncreasedValue')">↑ Aumentou</button>
          <button class="search-btn-action" onclick="runStudioNextScan('DecreasedValue')">↓ Diminuiu</button>
          <button class="search-btn-action" onclick="runStudioNextScan('ChangedValue')">≠ Mudou</button>
          <button class="search-btn-action" onclick="clearStudioScan()">Limpar</button>
        </div>
        <div id="scanner-status-text" style="font-size: 12px; color: var(--text-muted);">Aguardando scan...</div>
        <div id="scanner-results-box" style="max-height: 220px; overflow-y: auto; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 8px; background: rgba(0,0,0,0.25); font-family: 'JetBrains Mono', monospace; font-size: 12px;">
          Nenhum resultado ainda.
        </div>
      </div>

      <div class="modal-body" id="studio-pane-hex" style="display: none;">
        <div style="display: grid; grid-template-columns: 1fr 160px; gap: 10px;">
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-muted);">BYTES HEX</label>
            <input type="text" id="hex-input-bytes" value="90 90 89 45 FC E8 10 00 00 00 C3" style="width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.06); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: #fff; margin-top: 4px; font-family: 'JetBrains Mono', monospace; font-size: 12px;">
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-muted);">ENDEREÇO BASE</label>
            <input type="text" id="hex-input-base" value="0x140001000" style="width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.06); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: #fff; margin-top: 4px; font-family: 'JetBrains Mono', monospace; font-size: 12px;">
          </div>
        </div>
        <button class="btn-salvar-mods-pro" onclick="runStudioHexDump()">🧬 Inspecionar Hex & Disasm</button>
        <pre id="hex-output-box" style="max-height: 220px; overflow: auto; background: rgba(0,0,0,0.35); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #a7f3d0; white-space: pre;">Clique em Inspecionar para decodificar os bytes.</pre>
      </div>
    </div>
  </div>

  <!-- ========================================================================
       SCRIPTS JAVASCRIPT & CONTROLE NATIVO ELECTRON IPC
       ======================================================================== -->
  <script>
    // Importação de APIs seguras do Electron
    let ipcRenderer, shell;
    try {
      const electron = require('electron');
      ipcRenderer = electron.ipcRenderer;
      shell = electron.shell;
    } catch (err) {
      console.warn('Rodando em modo preview de navegador sem Electron:', err);
    }

    // Estado da Aplicação
    let allTrainers = [];
    let installedGames = [];
    let allMaps = [];
    let favoritesSet = new Set();
    let selectedGame = null;
    let isAttached = false;
    let isSoundEnabled = true;
    let currentTheme = 'wemod';
    let listeningHotkeyTargetCheatId = null;
    let currentCheatCategoryFilter = 'todos';
    let latestUpdateInfo = null;

    // Helpers de Sanitização Anti-XSS & Toast Não-Bloqueante
    function escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function escapeJsArg(value) {
      return String(value ?? '')
        .replace(/\\\\/g, '\\\\\\\\')
        .replace(/'/g, "\\\\'");
    }

    function showToast(message) {
      const container = document.getElementById('wand-toast-container');
      if (!container) return;
      const el = document.createElement('div');
      el.className = 'wand-toast';
      el.textContent = message;
      container.appendChild(el);
      setTimeout(() => {
        el.remove();
      }, 3200);
    }

    // Histórico de Navegação
    const navHistory = ['tab-home'];
    let navHistoryIndex = 0;

    // ==========================================================================
    // SINTETIZADOR DE ÁUDIO WEB AUDIO API (Sons de Alta Fidelidade)
    // ==========================================================================
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const SoundEngine = {
      playTone(freq, duration = 0.08, type = 'sine', gainVal = 0.07) {
        if (!isSoundEnabled) return;
        try {
          if (audioCtx.state === 'suspended') audioCtx.resume();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + duration);
        } catch {}
      },
      toggleOn() {
        if (!isSoundEnabled) return;
        this.playTone(520, 0.06, 'sine', 0.06);
        setTimeout(() => this.playTone(880, 0.09, 'sine', 0.07), 50);
      },
      toggleOff() {
        if (!isSoundEnabled) return;
        this.playTone(680, 0.06, 'sine', 0.06);
        setTimeout(() => this.playTone(420, 0.08, 'sine', 0.05), 50);
      },
      click() {
        this.playTone(900, 0.03, 'triangle', 0.04);
      },
      action() {
        this.playTone(440, 0.04, 'sine', 0.08);
        setTimeout(() => this.playTone(880, 0.08, 'sine', 0.09), 40);
        setTimeout(() => this.playTone(1320, 0.12, 'sine', 0.1), 80);
      }
    };

    function toggleGlobalSound() {
      isSoundEnabled = !isSoundEnabled;
      const btn = document.getElementById('btn-sound-toggle');
      if (btn) btn.innerText = isSoundEnabled ? '🔊' : '🔇';
      if (isSoundEnabled) SoundEngine.toggleOn();
    }

    // ==========================================================================
    // CONTROLES DE JANELA DO ELECTRON
    // ==========================================================================
    function windowMinimize() {
      SoundEngine.click();
      if (ipcRenderer) ipcRenderer.invoke('window:minimize');
    }

    function windowMaximize() {
      SoundEngine.click();
      if (ipcRenderer) ipcRenderer.invoke('window:maximize');
    }

    function windowClose() {
      SoundEngine.click();
      if (ipcRenderer) ipcRenderer.invoke('window:close');
    }

    // ==========================================================================
    // CONTROLE DE NAVEGAÇÃO & HISTÓRICO
    // ==========================================================================
    function switchTab(tabId, navBtnEl = null) {
      SoundEngine.click();
      document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));
      const target = document.getElementById(tabId);
      if (target) target.classList.add('active');

      document.querySelectorAll('.sidebar-nav-btn').forEach(b => b.classList.remove('active'));
      if (navBtnEl) {
        navBtnEl.classList.add('active');
      } else {
        if (tabId === 'tab-home') document.getElementById('nav-btn-home')?.classList.add('active');
        if (tabId === 'tab-maps') document.getElementById('nav-btn-maps')?.classList.add('active');
        if (tabId === 'tab-library') document.getElementById('nav-btn-library')?.classList.add('active');
        if (tabId === 'tab-pulse') document.getElementById('nav-btn-pulse')?.classList.add('active');
      }

      // Se saiu de detalhes, fecha o widget ativo da sidebar
      if (tabId !== 'tab-game-details') {
        const widget = document.getElementById('sidebar-active-game-widget');
        if (widget) widget.classList.remove('show');
      }

      if (navHistory[navHistoryIndex] !== tabId) {
        navHistory.splice(navHistoryIndex + 1);
        navHistory.push(tabId);
        navHistoryIndex = navHistory.length - 1;
      }

      const mainScroll = document.getElementById('main-content-scroll');
      if (mainScroll) mainScroll.scrollTop = 0;
    }

    function historyBack() {
      if (navHistoryIndex > 0) {
        navHistoryIndex--;
        switchTab(navHistory[navHistoryIndex]);
      }
    }

    function historyForward() {
      if (navHistoryIndex < navHistory.length - 1) {
        navHistoryIndex++;
        switchTab(navHistory[navHistoryIndex]);
      }
    }

    // ==========================================================================
    // MENU POPUP DE PERFIL (Print 2)
    // ==========================================================================
    function toggleProfileMenu(e) {
      if (e) e.stopPropagation();
      SoundEngine.click();
      const menu = document.getElementById('profile-dropdown-menu');
      if (menu) menu.classList.toggle('show');
    }

    document.addEventListener('click', (e) => {
      const menu = document.getElementById('profile-dropdown-menu');
      if (menu && !menu.contains(e.target)) {
        menu.classList.remove('show');
      }
    });

    function openProfilePage() {
      showToast('Perfil ativo: Membro Open Trainer Engine PRO');
      const menu = document.getElementById('profile-dropdown-menu');
      if (menu) menu.classList.remove('show');
    }

    function openHelpModal() {
      SoundEngine.click();
      if (ipcRenderer) ipcRenderer.invoke('open-external-url', 'https://github.com/Henrique1601/open-trainer-engine#readme');
      else window.open('https://github.com/Henrique1601/open-trainer-engine#readme', '_blank');
    }

    function openDiscord() {
      SoundEngine.click();
      if (ipcRenderer) ipcRenderer.invoke('open-external-url', 'https://discord.com');
      else window.open('https://discord.com', '_blank');
    }

    function openFeedbackModal() {
      SoundEngine.click();
      if (ipcRenderer) ipcRenderer.invoke('open-external-url', 'https://github.com/Henrique1601/open-trainer-engine/issues');
      else showToast('Obrigado pelo feedback! Abra uma issue no repositório.');
    }

    function openSettingsModal() {
      SoundEngine.click();
      loadRemoteInfo();
      const modal = document.getElementById('settings-modal');
      if (modal) modal.classList.add('show');
      const menu = document.getElementById('profile-dropdown-menu');
      if (menu) menu.classList.remove('show');
    }

    function closeSettingsModal() {
      SoundEngine.click();
      const modal = document.getElementById('settings-modal');
      if (modal) modal.classList.remove('show');
    }

    function openProModal() {
      SoundEngine.action();
      showToast('Recursos PRO liberados gratuitamente pela comunidade!');
    }

    function openPointsModal() {
      SoundEngine.click();
      showToast('Pontos Wand acumulados nesta sessão.');
    }

    function openPlaytimeTracker() {
      SoundEngine.click();
      showToast('Rastreador de tempo de mods ativo automaticamente.');
    }

    // ==========================================================================
    // SISTEMA DE MULTITEMAS VISUAIS
    // ==========================================================================
    async function applyAppTheme(themeId) {
      currentTheme = themeId;
      document.body.setAttribute('data-theme', themeId);
      SoundEngine.click();
      if (ipcRenderer) {
        try {
          await ipcRenderer.invoke('theme:set', themeId);
        } catch {}
      }
    }

    // ==========================================================================
    // CARREGAMENTO & DETECÇÃO DE JOGOS & ARTES REAIS
    // ==========================================================================
    function getGameCover(g) {
      if (!g) return '';
      if (g.coverImage) return g.coverImage;
      if (g.heroImage) return g.heroImage;
      if (g.platform === 'steam' && g.id && g.id.startsWith('steam-')) {
        const appId = g.id.replace('steam-', '');
        return 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/' + appId + '/library_600x900_2x.jpg';
      }
      return 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/10/library_600x900_2x.jpg';
    }

    function getGameHero(g) {
      if (!g) return '';
      if (g.heroImage) return g.heroImage;
      if (g.coverImage) return g.coverImage;
      if (g.platform === 'steam' && g.id && g.id.startsWith('steam-')) {
        const appId = g.id.replace('steam-', '');
        return 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/' + appId + '/header.jpg';
      }
      return 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/10/header.jpg';
    }

    async function init() {
      try {
        if (ipcRenderer) {
          const ver = await ipcRenderer.invoke('app:get-version');
          if (ver) {
            document.title = 'Open Trainer Engine v' + ver + ' • Wand / WeMod Edition';
          }

          const prefs = await ipcRenderer.invoke('get-preferences');
          if (prefs) {
            if (prefs.theme) applyAppTheme(prefs.theme);
            if (Array.isArray(prefs.favorites)) {
              favoritesSet = new Set(prefs.favorites);
            }
          }

          installedGames = await ipcRenderer.invoke('scan-games') || [];
          allTrainers = await ipcRenderer.invoke('list-trainers') || [];
          allMaps = await ipcRenderer.invoke('get-maps') || [];
          loadRemoteInfo();
        }
      } catch (err) {
        console.warn('Erro ao inicializar IPC:', err);
      }

      // Se nenhum jogo detectado (ex: teste ou sem steam instalado), monta lista mock realista
      if (!installedGames || installedGames.length === 0) {
        installedGames = [
          { id: 'steam-origins', title: "Assassin's Creed Origins", platform: 'steam', executableName: 'ACOrigins.exe', coverImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/582160/library_600x900_2x.jpg', heroImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/582160/header.jpg' },
          { id: 'steam-carx', title: "CarX Street", platform: 'steam', executableName: 'CarXStreet.exe', coverImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1114150/library_600x900_2x.jpg', heroImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1114150/header.jpg' },
          { id: 'steam-superhot', title: "SUPERHOT", platform: 'steam', executableName: 'SH.exe', coverImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/322500/library_600x900_2x.jpg', heroImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/322500/header.jpg' },
          { id: 'steam-subnautica2', title: "Subnautica 2", platform: 'steam', executableName: 'Subnautica2.exe', coverImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/264710/library_600x900_2x.jpg', heroImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/264710/header.jpg' },
          { id: 'steam-datacenter', title: "Data Center", platform: 'steam', executableName: 'DataCenter.exe', coverImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/10/library_600x900_2x.jpg', heroImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/10/header.jpg' },
          { id: 'steam-pickcrafter', title: "PickCrafter", platform: 'steam', executableName: 'PickCrafter.exe', coverImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/10/library_600x900_2x.jpg', heroImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/10/header.jpg' },
          { id: 'steam-zombiearmy', title: "Zombie Army Trilogy", platform: 'steam', executableName: 'ZAT.exe', coverImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/287700/library_600x900_2x.jpg', heroImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/287700/header.jpg' }
        ];
      }

      updateCounters();
      renderSidebarLists();
      renderHomeShelves();
      renderMapsGrid();
      renderLibraryTable();
      checkForUpdates();
    }

    function updateCounters() {
      const gCount = document.getElementById('games-count');
      if (gCount) gCount.innerText = installedGames.length;

      const libCount = document.getElementById('library-count');
      if (libCount) libCount.innerText = installedGames.length;

      const mCount = document.getElementById('maps-installed-count');
      if (mCount) mCount.innerText = allMaps.length > 0 ? allMaps.length : '15';

      const aCount = document.getElementById('maps-all-count');
      if (aCount) aCount.innerText = '221';
    }

    // Renderiza a Lista de Jogos na Sidebar (Print 1 & 5)
    function renderSidebarLists() {
      const container = document.getElementById('sidebar-installed-games-list');
      if (!container) return;

      container.innerHTML = installedGames.map(g => {
        const cover = escapeHtml(getGameCover(g));
        const safeId = escapeJsArg(g.id);
        const safeTitle = escapeHtml(g.title);
        const isActive = selectedGame && selectedGame.id === g.id;
        return '<div class="sidebar-game-row ' + (isActive ? 'active' : '') + '" onclick="openGameById(\\'' + safeId + '\\')">' +
          '<img class="sidebar-game-icon" src="' + cover + '" onerror="this.src=\\'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/10/header.jpg\\'">' +
          '<span class="sidebar-game-name" title="' + safeTitle + '">' + safeTitle + '</span>' +
        '</div>';
      }).join('');

      renderSidebarFavorites();
    }

    function renderSidebarFavorites() {
      const favContainer = document.getElementById('sidebar-favorites-list');
      if (!favContainer) return;
      const favGames = installedGames.filter(g => favoritesSet.has(g.id));
      const favCount = document.getElementById('fav-count');
      if (favCount) favCount.innerText = favGames.length;

      if (favGames.length === 0) {
        favContainer.innerHTML = '<div style="padding: 4px 12px; font-size: 11px; color: var(--text-dim);">Nenhum favorito ainda</div>';
        return;
      }

      favContainer.innerHTML = favGames.map(g => {
        const cover = escapeHtml(getGameCover(g));
        const safeId = escapeJsArg(g.id);
        const safeTitle = escapeHtml(g.title);
        return '<div class="sidebar-game-row" onclick="openGameById(\\'' + safeId + '\\')">' +
          '<img class="sidebar-game-icon" src="' + cover + '">' +
          '<span class="sidebar-game-name">' + safeTitle + '</span>' +
        '</div>';
      }).join('');
    }

    // Renderiza as Prateleiras de Cápsulas da Home (Print 1)
    function renderHomeShelves() {
      const renderCapsule = (g) => {
        const hero = escapeHtml(getGameHero(g));
        const safeId = escapeJsArg(g.id);
        const safeTitle = escapeHtml(g.title);
        return '<div class="game-capsule-card" style="background-image: url(\\'' + hero + '\\');" onclick="openGameById(\\'' + safeId + '\\')">' +
          '<div class="capsule-overlay">' +
            '<span class="capsule-title">' + safeTitle + '</span>' +
          '</div>' +
        '</div>';
      };

      const installedShelf = document.getElementById('shelf-installed-games');
      if (installedShelf) installedShelf.innerHTML = installedGames.map(renderCapsule).join('');

      const popularShelf = document.getElementById('shelf-popular-games');
      if (popularShelf) popularShelf.innerHTML = installedGames.slice().reverse().map(renderCapsule).join('');

      const recentShelf = document.getElementById('shelf-recent-games');
      if (recentShelf) recentShelf.innerHTML = installedGames.map(renderCapsule).join('');
    }

    // ==========================================================================
    // VIEW 2: MAPAS INTERATIVOS (Print 3)
    // ==========================================================================
    const MAPS_MOCK = [
      { id: 'forza-5', title: 'Forza Horizon 5', mapsCount: 3, thumb: 'https://images.unsplash.com/photo-1524654458049-e36be0721fa2?w=600&auto=format&fit=crop', fav: false },
      { id: 'cyberpunk', title: 'Cyberpunk 2077', mapsCount: 1, thumb: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop', fav: false },
      { id: 'stardew', title: 'Stardew Valley', mapsCount: 2, thumb: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop', fav: false },
      { id: 'skyrim', title: 'The Elder Scrolls V: Skyrim Special Edition', mapsCount: 2, thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop', fav: false },
      { id: 'gta5', title: 'Grand Theft Auto V Enhanced', mapsCount: 1, thumb: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop', fav: false },
      { id: 'fallout4', title: 'Fallout 4', mapsCount: 3, thumb: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop', fav: false },
      { id: 'hollow-knight', title: 'Hollow Knight', mapsCount: 1, thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop', fav: false },
      { id: 'subnautica-2', title: 'Subnautica 2', mapsCount: 1, thumb: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=600&auto=format&fit=crop', fav: true },
      { id: 'ac-origins', title: "Assassin's Creed Origins", mapsCount: 3, thumb: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=600&auto=format&fit=crop', fav: false },
      { id: 'borderlands', title: 'Borderlands Game of the Year Enhanced', mapsCount: 4, thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop', fav: false },
      { id: 'far-cry-primal', title: 'Far Cry Primal', mapsCount: 1, thumb: 'https://images.unsplash.com/photo-1511497584788-87676104235f?w=600&auto=format&fit=crop', fav: false },
      { id: 'hitman-3', title: 'Hitman 3', mapsCount: 38, thumb: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop', fav: false }
    ];

    function renderMapsGrid() {
      const grid = document.getElementById('maps-installed-grid');
      if (!grid) return;

      grid.innerHTML = MAPS_MOCK.map(m => {
        return '<div class="map-card-item" style="background-image: url(\\'' + m.thumb + '\\');" onclick="openInteractiveMapModal(\\'' + m.title + '\\')">' +
          '<span class="map-badge-count">' + m.mapsCount + ' MAPAS</span>' +
          '<div class="map-footer-overlay">' +
            '<div class="map-game-info">' +
              '<span class="map-game-title">' + m.title + '</span>' +
            '</div>' +
            '<span class="map-star-toggle ' + (m.fav ? 'active' : '') + '" onclick="event.stopPropagation(); toggleMapFav(\\'' + m.id + '\\', this)">' + (m.fav ? '⭐' : '☆') + '</span>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function toggleMapFav(id, el) {
      SoundEngine.click();
      const m = MAPS_MOCK.find(x => x.id === id);
      if (m) {
        m.fav = !m.fav;
        el.innerText = m.fav ? '⭐' : '☆';
        el.classList.toggle('active', m.fav);
      }
    }

    function openInteractiveMapModal(title) {
      SoundEngine.action();
      const modal = document.getElementById('map-modal');
      const titleEl = document.getElementById('modal-map-title');
      const iframe = document.getElementById('map-iframe');
      if (titleEl) titleEl.innerText = '🗺️ Mapa Interativo: ' + title;
      if (iframe) iframe.src = 'https://mapgenie.io';
      if (modal) modal.classList.add('show');
    }

    function closeMapModal() {
      SoundEngine.click();
      const modal = document.getElementById('map-modal');
      const iframe = document.getElementById('map-iframe');
      if (iframe) iframe.src = 'about:blank';
      if (modal) modal.classList.remove('show');
    }

    // ==========================================================================
    // VIEW 3: BIBLIOTECA EM MODO LISTA (Print 4)
    // ==========================================================================
    function renderLibraryTable(customList = null) {
      const container = document.getElementById('library-games-list');
      if (!container) return;
      const source = customList || installedGames;

      container.innerHTML = source.map(g => {
        const cover = escapeHtml(getGameCover(g));
        const safeId = escapeJsArg(g.id);
        const safeTitle = escapeHtml(g.title);
        const isFav = favoritesSet.has(g.id);
        return '<div class="library-row" onclick="openGameById(\\'' + safeId + '\\')">' +
          '<div class="library-col-left">' +
            '<img class="library-game-icon" src="' + cover + '" onerror="this.src=\\'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/10/header.jpg\\'">' +
            '<span class="library-game-title">' + safeTitle + '</span>' +
            '<button class="library-star-btn ' + (isFav ? 'active' : '') + '" onclick="event.stopPropagation(); toggleLibraryFav(\\'' + safeId + '\\', this)">' + (isFav ? '⭐' : '☆') + '</button>' +
          '</div>' +
          '<div class="library-col-center">' + escapeHtml((g.platform || 'PC').toUpperCase()) + ' • Pronto para Mods</div>' +
          '<div class="library-col-right">' +
            '<span class="platform-icon-tag" title="' + escapeHtml(g.platform || 'PC') + '">🎮</span>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    async function toggleLibraryFav(id, el) {
      SoundEngine.click();
      let newFavState = !favoritesSet.has(id);
      if (ipcRenderer) {
        try {
          newFavState = await ipcRenderer.invoke('toggle-favorite', id);
        } catch {}
      }
      if (newFavState) favoritesSet.add(id);
      else favoritesSet.delete(id);

      if (el) {
        el.classList.toggle('active', newFavState);
        el.innerText = newFavState ? '⭐' : '☆';
      }
      renderSidebarFavorites();
    }

    // ==========================================================================
    // VIEW 4: DETALHES DO JOGO (Print 5 - Assassin's Creed Origins)
    // ==========================================================================
    async function openGameById(id) {
      if (!id) return;
      SoundEngine.click();

      let game = installedGames.find(g => g.id === id);
      if (!game) {
        game = installedGames.find(g => g.title.toLowerCase().includes(id.toLowerCase()));
      }
      if (!game) {
        game = { id, title: id, platform: 'steam', executableName: id + '.exe' };
      }

      selectedGame = game;

      const titleEl = document.getElementById('detail-title');
      if (titleEl) titleEl.innerText = game.title;

      const posterImg = document.getElementById('detail-vertical-poster');
      if (posterImg) posterImg.src = getGameCover(game);

      const heroBackdrop = document.getElementById('detail-hero-backdrop');
      if (heroBackdrop) {
        heroBackdrop.style.backgroundImage = "url('" + getGameHero(game) + "')";
      }

      const platformEl = document.getElementById('detail-platform-name');
      if (platformEl) platformEl.innerText = (game.platform || 'Steam').toUpperCase();

      // Carrega estatísticas e estado salvo real do jogo via IPC
      let savedMods = {};
      if (ipcRenderer) {
        try {
          const stats = await ipcRenderer.invoke('get-game-stats', game.id);
          if (stats) {
            savedMods = stats.savedMods || {};
            const playtimeEl = document.getElementById('detail-playtime');
            if (playtimeEl) playtimeEl.innerText = stats.formattedPlaytime || '0 min';
            const lastPlayedEl = document.getElementById('detail-last-played');
            if (lastPlayedEl) lastPlayedEl.innerText = stats.stats?.lastPlayed || 'Nunca';
            const favBtn = document.getElementById('detail-fav-star-btn');
            if (favBtn) favBtn.innerText = stats.isFavorite ? '⭐' : '☆';
          }
        } catch {}
      }

      // Ativa o widget na Sidebar (Print 5)
      const sidebarWidget = document.getElementById('sidebar-active-game-widget');
      const sidebarTitle = document.getElementById('sidebar-active-title');
      if (sidebarWidget && sidebarTitle) {
        sidebarTitle.innerText = game.title;
        sidebarWidget.classList.add('show');
      }

      const mapTitle = document.getElementById('detail-widget-map-title');
      if (mapTitle) mapTitle.innerText = 'Mapa de ' + game.title;

      await loadGameCheats(game, savedMods);

      switchTab('tab-game-details');
      renderSidebarLists();
    }

    function openGameByTitleOrFirst(title) {
      const match = installedGames.find(g => g.title.toLowerCase().includes(title.toLowerCase()));
      if (match) {
        openGameById(match.id);
      } else if (installedGames.length > 0) {
        openGameById(installedGames[0].id);
      }
    }

    async function loadGameCheats(game, savedMods = {}) {
      let cheats = [];
      try {
        if (ipcRenderer) {
          cheats = await ipcRenderer.invoke('trainer:get-cheats', game.id, game.title, game.executableName) || [];
        }
      } catch (err) {
        console.warn('Erro ao obter cheats do IPC:', err);
      }

      // Se nenhum cheat retornado, gera cheats padrão estilo WeMod (Print 5)
      if (!cheats || cheats.length === 0) {
        cheats = [
          { id: 'god_mode', name: 'Vida Ilimitada', category: 'Fixado', hotkey: 'F1', active: false },
          { id: 'inf_money', name: 'Dinheiro Ilimitado', category: 'Fixado', hotkey: 'F5', active: false },
          { id: 'inf_resources', name: 'Recursos de Fabricação Ilimitados', category: 'Fixado', hotkey: 'F7', active: false },
          { id: 'player_god', name: 'Vida Ilimitada', category: 'Jogador', hotkey: 'F1', active: false },
          { id: 'inf_adrenaline', name: 'Adrenalina Ilimitada', category: 'Jogador', hotkey: 'F2', active: false },
          { id: 'inf_oxygen', name: 'Oxigênio Ilimitado', category: 'Jogador', hotkey: 'F3', active: false },
          { id: 'ghost_stealth', name: 'Melhor Furtividade / Invisível', category: 'Jogador', hotkey: 'F4', active: false },
          { id: 'inv_money', name: 'Dinheiro Ilimitado', category: 'Inventário', hotkey: 'F5', active: false },
          { id: 'inf_arrows', name: 'Flechas Ilimitadas', category: 'Inventário', hotkey: 'F6', active: false },
          { id: 'inv_crafting', name: 'Recursos de Fabricação Ilimitados', category: 'Inventário', hotkey: 'F7', active: false },
          { id: 'inf_weapons', name: 'Armas Ilimitadas', category: 'Inventário', hotkey: 'F8', active: false },
          { id: 'inf_xp', name: 'XP Ilimitado', category: 'Estatísticas', hotkey: 'F9', active: false },
          { id: 'inf_skill_points', name: 'Pontos de Habilidade Ilimitados', category: 'Estatísticas', hotkey: 'F10', active: false },
          { id: 'speedhack_native', name: 'Velocidade do Jogo (Speedhack)', category: 'Velocidade', hotkey: 'Ctrl+F1', active: false, type: 'slider', value: 1.0, min: 0.5, max: 5.0, step: 0.5 }
        ];
      }

      cheats.forEach(c => {
        if (savedMods && savedMods[c.id]) {
          c.active = Boolean(savedMods[c.id].enabled);
          if (savedMods[c.id].value !== undefined) c.value = savedMods[c.id].value;
        }
      });

      selectedGame.cheats = cheats;
      renderCheatsList(cheats);
    }

    function renderCheatsList(cheats) {
      const container = document.getElementById('game-cheats-container');
      if (!container) return;

      // Agrupa cheats por categoria
      const groups = {};
      cheats.forEach(c => {
        const cat = c.category || 'Outros';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(c);
      });

      let html = '';
      for (const [categoryName, items] of Object.entries(groups)) {
        html += '<div class="cheats-group-box">' +
          '<div class="cheat-group-header">' +
            '<span>' + getCategoryIcon(categoryName) + '</span>' +
            '<span>' + categoryName + '</span>' +
          '</div>';

        items.forEach(c => {
          const isActive = Boolean(c.active);
          const hotkey = escapeHtml(c.hotkey || 'F1');
          const safeCheatId = escapeJsArg(c.id);
          const safeDomId = escapeHtml(c.id);
          const safeCheatName = escapeHtml(c.name);

          if (c.type === 'slider') {
            html += '<div class="cheat-row-item">' +
              '<div class="cheat-name-wrap">' +
                '<span class="cheat-icon-bolt">⚡</span>' +
                '<span class="cheat-title-text">' + safeCheatName + '</span>' +
              '</div>' +
              '<div class="cheat-controls-wrap">' +
                '<button class="search-btn-action" onclick="stepSliderValue(\\'' + safeCheatId + '\\', -0.5)">-</button>' +
                '<span id="val-' + safeDomId + '" style="font-weight: 800; font-size: 12px; color: var(--accent); min-width: 40px; text-align: center;">' + (c.value || 1.0) + 'x</span>' +
                '<button class="search-btn-action" onclick="stepSliderValue(\\'' + safeCheatId + '\\', 0.5)">+</button>' +
                '<div class="hotkey-badge-3d" id="hotkey-' + safeDomId + '" onclick="startRebindHotkey(\\'' + safeCheatId + '\\', this)">' + hotkey + '</div>' +
              '</div>' +
            '</div>';
          } else {
            const deleteBtn = c.isCustom
              ? '<button class="search-btn-action" style="padding: 2px 7px; font-size: 11px; color: #f87171;" onclick="deleteCustomCheat(\\'' + safeCheatId + '\\')" title="Remover Mod Customizado">✕</button>'
              : '';
            html += '<div class="cheat-row-item">' +
              '<div class="cheat-name-wrap">' +
                '<span class="cheat-icon-bolt">⚡</span>' +
                '<span class="cheat-title-text">' + safeCheatName + '</span>' +
              '</div>' +
              '<div class="cheat-controls-wrap">' +
                deleteBtn +
                '<div class="wemod-toggle-pill ' + (isActive ? 'on' : 'off') + '" id="toggle-pill-' + safeDomId + '" onclick="toggleCheatAction(\\'' + safeCheatId + '\\')">' +
                  '<span class="toggle-segment off">Off</span>' +
                  '<span class="toggle-segment on">On</span>' +
                '</div>' +
                '<div class="hotkey-badge-3d" id="hotkey-' + safeDomId + '" onclick="startRebindHotkey(\\'' + safeCheatId + '\\', this)">' + hotkey + '</div>' +
              '</div>' +
            '</div>';
          }
        });

        html += '</div>';
      }

      container.innerHTML = html;
    }

    function getCategoryIcon(cat) {
      if (cat.includes('Fixado')) return '📌';
      if (cat.includes('Jogador')) return '👤';
      if (cat.includes('Inventário')) return '🎒';
      if (cat.includes('Estatísticas')) return '📊';
      if (cat.includes('Velocidade')) return '🎛️';
      return '⚡';
    }

    async function toggleCheatAction(cheatId) {
      if (!selectedGame || !selectedGame.cheats) return;
      const c = selectedGame.cheats.find(x => x.id === cheatId);
      if (!c) return;

      c.active = !c.active;
      const pill = document.getElementById('toggle-pill-' + cheatId);
      if (pill) {
        pill.className = 'wemod-toggle-pill ' + (c.active ? 'on' : 'off');
      }

      if (c.active) {
        SoundEngine.toggleOn();
      } else {
        SoundEngine.toggleOff();
      }

      if (ipcRenderer) {
        try {
          await ipcRenderer.invoke('toggle-cheat', cheatId);
        } catch {}
      }
    }

    async function stepSliderValue(cheatId, delta) {
      if (!selectedGame || !selectedGame.cheats) return;
      const c = selectedGame.cheats.find(x => x.id === cheatId);
      if (!c) return;

      c.value = Math.max(0.5, Math.min(10.0, ((c.value || 1.0) + delta)));
      const valEl = document.getElementById('val-' + cheatId);
      if (valEl) valEl.innerText = c.value.toFixed(1) + 'x';
      SoundEngine.click();

      if (cheatId.includes('speedhack') && ipcRenderer) {
        try {
          await ipcRenderer.invoke('speedhack:set', c.value);
        } catch {}
      }
    }

    // ==========================================================================
    // REBIND DE HOTKEYS INTERATIVO
    // ==========================================================================
    function startRebindHotkey(cheatId, el) {
      SoundEngine.click();
      if (listeningHotkeyTargetCheatId) {
        const prev = document.getElementById('hotkey-' + listeningHotkeyTargetCheatId);
        if (prev) prev.classList.remove('listening');
      }

      listeningHotkeyTargetCheatId = cheatId;
      el.classList.add('listening');
      el.innerText = 'Pressione...';
    }

    document.addEventListener('keydown', (e) => {
      if (!listeningHotkeyTargetCheatId) return;
      e.preventDefault();
      e.stopPropagation();

      let key = e.key.toUpperCase();
      if (key === 'ESCAPE') key = 'None';
      if (e.ctrlKey && key !== 'CONTROL') key = 'Ctrl+' + key;
      if (e.altKey && key !== 'ALT') key = 'Alt+' + key;

      const targetCheatId = listeningHotkeyTargetCheatId;
      const cheat = selectedGame?.cheats?.find(c => c.id === targetCheatId);
      if (cheat) cheat.hotkey = key;

      const el = document.getElementById('hotkey-' + targetCheatId);
      if (el) {
        el.classList.remove('listening');
        el.innerText = key;
      }

      if (ipcRenderer && selectedGame) {
        ipcRenderer.invoke('hotkey:set', selectedGame.id, targetCheatId, key === 'None' ? '' : key).catch(() => {});
      }
      showToast('Atalho atualizado: ' + key);
      SoundEngine.action();
      listeningHotkeyTargetCheatId = null;
    });

    // ==========================================================================
    // INICIAR / CONECTAR AO JOGO (JOGAR COM MODS)
    // ==========================================================================
    async function toggleAttachCurrentGame() {
      if (!selectedGame) return;
      const btn = document.getElementById('btn-giant-play');

      if (!isAttached) {
        isAttached = true;
        SoundEngine.action();
        if (btn) {
          btn.classList.add('playing');
          btn.innerHTML = '<span>⏹ Parar Mods</span>';
        }

        if (ipcRenderer) {
          try {
            await ipcRenderer.invoke('game:launch', selectedGame.id);
            await ipcRenderer.invoke('attach-trainer', {
              id: selectedGame.id,
              title: selectedGame.title,
              processName: selectedGame.executableName,
              cheats: selectedGame.cheats || []
            });
          } catch (err) {
            console.warn('Simulando injeção do trainer:', err);
          }
        }
      } else {
        isAttached = false;
        SoundEngine.toggleOff();
        if (btn) {
          btn.classList.remove('playing');
          btn.innerHTML = '<span>▶ Jogar</span><span style="font-size: 10px; margin-left: 2px;">▼</span>';
        }

        if (ipcRenderer) {
          try {
            await ipcRenderer.invoke('detach-trainer');
          } catch {}
        }
      }
    }

    async function saveCurrentGameModsPreset() {
      SoundEngine.action();
      if (!selectedGame) return;
      const states = {};
      (selectedGame.cheats || []).forEach(c => {
        states[c.id] = { enabled: Boolean(c.active), value: c.value };
      });
      if (ipcRenderer) {
        try {
          await ipcRenderer.invoke('profiles:create', selectedGame.id, 'Preset Rápido', states);
        } catch {}
      }
      showToast('Mods salvos para ' + selectedGame.title + '!');
    }

    async function toggleCurrentGameFavorite() {
      SoundEngine.click();
      if (!selectedGame) return;
      let isFav = !favoritesSet.has(selectedGame.id);
      if (ipcRenderer) {
        try {
          isFav = await ipcRenderer.invoke('toggle-favorite', selectedGame.id);
        } catch {}
      }
      if (isFav) favoritesSet.add(selectedGame.id);
      else favoritesSet.delete(selectedGame.id);

      const starBtn = document.getElementById('detail-fav-star-btn');
      if (starBtn) {
        starBtn.classList.toggle('active', isFav);
        starBtn.innerText = isFav ? '⭐' : '☆';
      }
      renderSidebarFavorites();
      renderLibraryTable();
    }

    function toggleGameNotifications() {
      SoundEngine.click();
      showToast('Notificações de atualizações para este jogo ativadas!');
    }

    function openGameMapTab() {
      SoundEngine.click();
      openInteractiveMapModal(selectedGame ? selectedGame.title : 'Jogo');
    }

    async function switchGameSubtab(tabName, el) {
      SoundEngine.click();
      document.querySelectorAll('.subtab-link').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.sidebar-subnav-item').forEach(l => l.classList.remove('active'));
      if (el) el.classList.add('active');

      const container = document.getElementById('game-cheats-container');
      if (!selectedGame || !container) return;

      if (tabName === 'mapa' || tabName === 'teletransportar') {
        openGameMapTab();
        return;
      }

      if (tabName === 'personalizar') {
        renderCheatsList(selectedGame.cheats || []);
        return;
      }

      if (tabName === 'sessoes') {
        let stats = { totalPlaytime: '0m', sessionsCount: 0, lastPlayed: null };
        let captures = [];
        if (ipcRenderer) {
          try { stats = await ipcRenderer.invoke('get-game-stats', selectedGame.id); } catch {}
          try { captures = await ipcRenderer.invoke('get-captures', selectedGame.id); } catch {}
        }
        const capsHtml = captures && captures.length > 0
          ? captures.slice(0, 6).map(cap =>
              '<div style="background: rgba(255,255,255,0.04); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; font-size: 12px;">' +
                '<div style="font-weight: 700; color: #fff;">📸 ' + escapeHtml(cap.name || cap.filename || 'Captura') + '</div>' +
                '<div style="color: var(--text-dim); font-size: 11px; margin-top: 4px;">' + escapeHtml(cap.createdAt || '') + '</div>' +
              '</div>'
            ).join('')
          : '<div style="color: var(--text-dim); font-size: 13px;">Nenhuma captura registrada ainda para este jogo. Use o botão Câmera ou Ctrl+Shift+F11!</div>';

        container.innerHTML =
          '<div class="cheats-group-box">' +
            '<div class="cheat-group-header"><span>⏱️</span><span>Resumo de Sessões & Playtime</span></div>' +
            '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 14px;">' +
              '<div style="background: rgba(255,255,255,0.04); padding: 14px; border-radius: 8px;"><div style="font-size: 11px; color: var(--text-dim);">TEMPO COM MODS</div><div style="font-size: 20px; font-weight: 800; color: var(--accent);">' + escapeHtml(stats.totalPlaytime || '0m') + '</div></div>' +
              '<div style="background: rgba(255,255,255,0.04); padding: 14px; border-radius: 8px;"><div style="font-size: 11px; color: var(--text-dim);">SESSÕES</div><div style="font-size: 20px; font-weight: 800;">' + (stats.sessionsCount || 0) + '</div></div>' +
              '<div style="background: rgba(255,255,255,0.04); padding: 14px; border-radius: 8px;"><div style="font-size: 11px; color: var(--text-dim);">ÚLTIMO ACESSO</div><div style="font-size: 13px; font-weight: 700; margin-top: 4px;">' + (stats.lastPlayed ? escapeHtml(new Date(stats.lastPlayed).toLocaleDateString('pt-BR')) : 'Nunca') + '</div></div>' +
            '</div>' +
          '</div>' +
          '<div class="cheats-group-box" style="margin-top: 16px;">' +
            '<div class="cheat-group-header"><span>📸</span><span>Capturas da Sessão</span><button class="search-btn-action" style="margin-left: auto;" onclick="toggleGameRecording()">Capturar Agora</button></div>' +
            '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; padding: 14px;">' + capsHtml + '</div>' +
          '</div>';
        return;
      }

      if (tabName === 'destaques') {
        const activeCount = (selectedGame.cheats || []).filter(c => c.active).length;
        container.innerHTML =
          '<div class="cheats-group-box">' +
            '<div class="cheat-group-header"><span>🎬</span><span>Destaques & Presets Rápidos</span></div>' +
            '<div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">' +
              '<div style="font-size: 13px; color: var(--text-muted);">Mods ativos neste momento: <strong style="color: var(--accent);">' + activeCount + '</strong> de ' + (selectedGame.cheats || []).length + '</div>' +
              '<div style="display: flex; gap: 10px; flex-wrap: wrap;">' +
                '<button class="btn-salvar-mods-pro" onclick="saveCurrentGameModsPreset()">⭐ Salvar Mods Atuais como Perfil</button>' +
                '<button class="search-btn-action" onclick="toggleOverlayHud()">🖥️ Alternar Overlay HUD In-Game</button>' +
                '<button class="search-btn-action" onclick="openNewCheatModal(\\'scanner\\')">🔍 Abrir Memory Scanner Studio</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        return;
      }

      if (tabName === 'sugestoes') {
        container.innerHTML =
          '<div class="cheats-group-box">' +
            '<div class="cheat-group-header"><span>💡</span><span>Importar Tabela Cheat Engine (.CT) & Criar Mods</span></div>' +
            '<div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">' +
              '<p style="font-size: 13px; color: var(--text-muted); margin: 0;">Importe um arquivo <code>.CT</code> do Cheat Engine para converter seus endereços automaticamente em mods nativos para <strong>' + escapeHtml(selectedGame.title) + '</strong>.</p>' +
              '<div style="display: flex; gap: 10px; align-items: center;">' +
                '<input type="file" id="ct-import-file" accept=".ct,.CT" style="flex: 1; font-size: 12px; color: var(--text-muted);">' +
                '<button class="btn-salvar-mods-pro" onclick="importCtForGame()">📥 Importar .CT</button>' +
              '</div>' +
              '<div style="border-top: 1px solid var(--border-subtle); padding-top: 12px; display: flex; gap: 10px;">' +
                '<button class="search-btn-action" onclick="openNewCheatModal(\\'create\\')">✨ Criar Cheat Manual</button>' +
                '<button class="search-btn-action" onclick="openNewCheatModal(\\'hex\\')">🧬 Abrir Hex & Disassembler</button>' +
              '</div>' +
            '</div>' +
          '</div>';
      }
    }

    function openGameOptionsMenu() {
      SoundEngine.click();
      showToast('Use o botão Jogar para iniciar com mods ou clique no ícone de engrenagem.');
    }

    async function toggleGameRecording() {
      SoundEngine.click();
      if (ipcRenderer) {
        try {
          const res = await ipcRenderer.invoke('game:capture-screenshot');
          if (res && res.success) {
            showToast('Captura salva com sucesso!');
            return;
          }
        } catch {}
      }
      showToast('Captura de tela solicitada!');
    }

    function playVideoCompanion() {
      SoundEngine.action();
      showToast('Abrindo guia de gameplay...');
    }

    // ==========================================================================
    // BUSCA GLOBAL EM TEMPO REAL
    // ==========================================================================
    function onGlobalSearch(query) {
      if (!query || !query.trim()) {
        renderSidebarLists();
        renderHomeShelves();
        renderLibraryTable();
        return;
      }

      const q = query.toLowerCase();
      const filtered = installedGames.filter(g => g.title.toLowerCase().includes(q));
      renderLibraryTable(filtered);
    }

    function changeHeroSlide(direction) {
      SoundEngine.click();
      const titleEl = document.getElementById('home-hero-title');
      if (titleEl) {
        titleEl.innerText = direction > 0 ? 'Crimson Desert' : 'Phantom Blade Zero';
      }
    }

    function setMapsLayout(mode) {
      SoundEngine.click();
    }

    function filterMapsCategory(cat, el) {
      SoundEngine.click();
      document.querySelectorAll('.maps-filter-chips .filter-chip').forEach(c => c.classList.remove('active'));
      if (el) el.classList.add('active');
    }

    function sortMaps(type, el) {
      SoundEngine.click();
      document.querySelectorAll('.maps-sort-selector .sort-pill').forEach(c => c.classList.remove('active'));
      if (el) el.classList.add('active');
    }

    function filterLibrary(cat, el) {
      SoundEngine.click();
      document.querySelectorAll('#tab-library .filter-chip').forEach(c => c.classList.remove('active'));
      if (el) el.classList.add('active');
    }

    function sortLibrary(type, el) {
      SoundEngine.click();
      document.querySelectorAll('#tab-library .sort-pill').forEach(c => c.classList.remove('active'));
      if (el) el.classList.add('active');
    }

    function filterCheatCategory(cat, el) {
      SoundEngine.click();
      currentCheatCategoryFilter = cat;
      document.querySelectorAll('.cheat-cat-pill').forEach(c => c.classList.remove('active'));
      if (el) el.classList.add('active');

      if (!selectedGame || !selectedGame.cheats) return;
      if (cat === 'todos') {
        renderCheatsList(selectedGame.cheats);
      } else {
        const filtered = selectedGame.cheats.filter(c => {
          if (cat === 'assistir') return c.category === 'Fixado' || c.category === 'Jogador';
          if (cat === 'facilitar') return c.category === 'Inventário' || c.category === 'Estatísticas';
          if (cat === 'sandbox') return c.category === 'Velocidade' || c.type === 'slider';
          return true;
        });
        renderCheatsList(filtered);
      }
    }

    function openNewCheatModal(initialTab = 'create') {
      SoundEngine.click();
      const modal = document.getElementById('new-cheat-modal');
      if (modal) modal.classList.add('show');
      const btn = document.getElementById('studio-tab-btn-' + initialTab);
      switchStudioTab(initialTab, btn);
    }

    function switchStudioTab(tab, btnEl) {
      ['create', 'scanner', 'hex'].forEach(t => {
        const pane = document.getElementById('studio-pane-' + t);
        if (pane) pane.style.display = t === tab ? 'flex' : 'none';
        const btn = document.getElementById('studio-tab-btn-' + t);
        if (btn) btn.classList.toggle('active', t === tab);
      });
      if (btnEl) btnEl.classList.add('active');
    }

    function closeNewCheatModal() {
      SoundEngine.click();
      const modal = document.getElementById('new-cheat-modal');
      if (modal) modal.classList.remove('show');
    }

    async function saveNewCheatFromModal() {
      const nameInput = document.getElementById('modal-cheat-name');
      const catInput = document.getElementById('modal-cheat-category');
      const hotkeyInput = document.getElementById('modal-cheat-hotkey');
      const addrInput = document.getElementById('modal-cheat-address');

      const name = nameInput ? nameInput.value.trim() : '';
      const cat = catInput ? catInput.value : 'Jogador';
      const hotkey = hotkeyInput && hotkeyInput.value.trim() ? hotkeyInput.value.trim() : 'F11';
      const address = addrInput ? addrInput.value.trim() : '';

      if (!name) {
        showToast('Por favor, informe o nome do cheat!');
        return;
      }

      const newCheat = {
        id: 'custom_' + Date.now(),
        name,
        category: cat,
        hotkey,
        address: address || undefined,
        isCustom: true,
        active: false
      };

      if (!selectedGame) selectedGame = { id: 'temp', cheats: [] };
      if (!selectedGame.cheats) selectedGame.cheats = [];
      selectedGame.cheats.push(newCheat);

      if (ipcRenderer) {
        try {
          await ipcRenderer.invoke('custom-cheats:add', selectedGame.id, newCheat);
        } catch {}
      }

      SoundEngine.action();
      closeNewCheatModal();
      renderCheatsList(selectedGame.cheats);
      showToast('Cheat customizado adicionado!');
      if (nameInput) nameInput.value = '';
      if (addrInput) addrInput.value = '';
    }

    async function deleteCustomCheat(cheatId) {
      if (!selectedGame) return;
      SoundEngine.click();
      selectedGame.cheats = (selectedGame.cheats || []).filter(c => c.id !== cheatId);
      if (ipcRenderer) {
        try {
          await ipcRenderer.invoke('custom-cheats:delete', selectedGame.id, cheatId);
        } catch {}
      }
      renderCheatsList(selectedGame.cheats);
      showToast('Mod customizado removido.');
    }

    function renderStudioScanResults(res) {
      const statusEl = document.getElementById('scanner-status-text');
      const boxEl = document.getElementById('scanner-results-box');
      if (!statusEl || !boxEl) return;

      if (res.error) {
        statusEl.innerText = '⚠️ ' + res.error;
        boxEl.innerHTML = '<div style="color: #f87171;">' + escapeHtml(res.error) + '</div>';
        return;
      }

      statusEl.innerText = 'Encontrados: ' + (res.count || 0) + ' endereço(s) (exibindo até 50)';
      if (!res.results || res.results.length === 0) {
        boxEl.innerHTML = '<div style="color: var(--text-dim);">Nenhum endereço compatível encontrado.</div>';
        return;
      }

      boxEl.innerHTML = res.results.map(r => {
        const safeAddr = escapeJsArg(r.address);
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);">' +
          '<span><strong style="color:var(--accent);">' + escapeHtml(r.address) + '</strong> = ' + escapeHtml(r.currentValue) + '</span>' +
          '<div style="display:flex;gap:6px;">' +
            '<button class="search-btn-action" style="padding:2px 8px;font-size:11px;" onclick="writeStudioAddressValue(\\'' + safeAddr + '\\')">Editar</button>' +
            '<button class="search-btn-action" style="padding:2px 8px;font-size:11px;" onclick="promoteScanToCheat(\\'' + safeAddr + '\\')">+ Cheat</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    async function runStudioFirstScan() {
      if (!ipcRenderer) return;
      const val = document.getElementById('scanner-target-value')?.value?.trim();
      const type = document.getElementById('scanner-value-type')?.value || 'int32';
      if (!val) { showToast('Informe um valor para escanear.'); return; }
      const res = await ipcRenderer.invoke('studio:scan-first', val, type);
      renderStudioScanResults(res);
    }

    async function runStudioNextScan(comparison) {
      if (!ipcRenderer) return;
      const val = document.getElementById('scanner-target-value')?.value?.trim();
      const type = document.getElementById('scanner-value-type')?.value || 'int32';
      const res = await ipcRenderer.invoke('studio:scan-next', comparison, val, type);
      renderStudioScanResults(res);
    }

    async function writeStudioAddressValue(addressHex) {
      if (!ipcRenderer) return;
      const val = document.getElementById('scanner-target-value')?.value?.trim();
      const type = document.getElementById('scanner-value-type')?.value || 'int32';
      if (!val) { showToast('Digite o novo valor no campo Valor Alvo.'); return; }
      const res = await ipcRenderer.invoke('studio:scan-write', addressHex, val, type);
      showToast(res && res.success ? 'Valor escrito em ' + addressHex : 'Falha ao escrever na memória.');
    }

    function promoteScanToCheat(addressHex) {
      const addrInput = document.getElementById('modal-cheat-address');
      if (addrInput) addrInput.value = addressHex;
      switchStudioTab('create', document.getElementById('studio-tab-btn-create'));
      showToast('Endereço copiado para o Criador de Cheats!');
    }

    async function clearStudioScan() {
      if (ipcRenderer) await ipcRenderer.invoke('studio:scan-clear');
      const statusEl = document.getElementById('scanner-status-text');
      const boxEl = document.getElementById('scanner-results-box');
      if (statusEl) statusEl.innerText = 'Scan limpo.';
      if (boxEl) boxEl.innerText = 'Nenhum resultado.';
    }

    async function runStudioHexDump() {
      if (!ipcRenderer) return;
      const bytes = document.getElementById('hex-input-bytes')?.value || '';
      const base = document.getElementById('hex-input-base')?.value || '0x0';
      const outEl = document.getElementById('hex-output-box');
      try {
        const res = await ipcRenderer.invoke('studio:hex-dump', bytes, base);
        const dumpLines = (res.dump || []).map(r => r.addressHex + ' | ' + r.bytesHex.join(' ') + ' | ' + r.ascii);
        const disasmLines = (res.disasm || []).map(d => '+' + d.offset.toString(16).padStart(2, '0') + '  ' + d.opcode.padEnd(14, ' ') + ' ' + d.mnemonic);
        if (outEl) outEl.textContent = '=== HEX DUMP ===\\n' + dumpLines.join('\\n') + '\\n\\n=== DISASSEMBLY x86/x64 ===\\n' + disasmLines.join('\\n');
      } catch (e) {
        if (outEl) outEl.textContent = 'Erro ao decodificar hex: ' + e.message;
      }
    }

    async function importCtForGame() {
      const fileInput = document.getElementById('ct-import-file');
      const file = fileInput && fileInput.files && fileInput.files[0];
      if (!file || !file.path) {
        showToast('Selecione um arquivo .CT válido.');
        return;
      }
      if (!ipcRenderer || !selectedGame) return;
      try {
        const contract = await ipcRenderer.invoke('import-ct', file.path, selectedGame.processName || selectedGame.title);
        const importedCheats = (contract && contract.cheats) || [];
        for (const c of importedCheats) {
          c.isCustom = true;
          await ipcRenderer.invoke('custom-cheats:add', selectedGame.id, c);
        }
        selectedGame.cheats = [...(selectedGame.cheats || []), ...importedCheats];
        showToast('Importados ' + importedCheats.length + ' cheats do arquivo .CT!');
        switchGameSubtab('personalizar', document.querySelector('.sidebar-subnav-item'));
      } catch (e) {
        showToast('Erro ao importar .CT: ' + e.message);
      }
    }

    function toggleOverlayHud() {
      SoundEngine.click();
      if (ipcRenderer) ipcRenderer.invoke('overlay:toggle');
    }

    async function refreshGames() {
      SoundEngine.action();
      if (ipcRenderer) {
        try {
          installedGames = await ipcRenderer.invoke('scan-games');
          updateCounters();
          renderSidebarLists();
          renderHomeShelves();
          renderLibraryTable();
        } catch {}
      }
    }

    async function loadRemoteInfo() {
      if (!ipcRenderer) return;
      try {
        const info = await ipcRenderer.invoke('remote:get-info');
        const urlEl = document.getElementById('settings-remote-url');
        const qrEl = document.getElementById('settings-remote-qr');
        if (urlEl && info && info.url) {
          urlEl.innerText = info.url;
        }
        if (qrEl && info && info.qrCode) {
          qrEl.src = info.qrCode;
          qrEl.style.display = 'block';
        }
      } catch {}
    }

    async function checkForUpdates() {
      if (!ipcRenderer) return;
      try {
        const info = await ipcRenderer.invoke('check-for-updates');
        if (info && info.hasUpdate) {
          latestUpdateInfo = info;
          const banner = document.getElementById('update-banner');
          const text = document.getElementById('update-text');
          if (text) text.innerText = '🚀 Nova versão disponível: v' + info.latestVersion;
          if (banner) banner.style.display = 'flex';
        }
      } catch {}
    }

    function dismissUpdateBanner() {
      const banner = document.getElementById('update-banner');
      if (banner) banner.style.display = 'none';
    }

    async function startInAppUpdate() {
      SoundEngine.action();
      if (!ipcRenderer) return;
      if (latestUpdateInfo && latestUpdateInfo.downloadUrl) {
        showToast('Baixando atualização...');
        const res = await ipcRenderer.invoke('updater:download-update', latestUpdateInfo.downloadUrl);
        if (res && res.success) {
          showToast('Download concluído! Instalando...');
          await ipcRenderer.invoke('updater:install-and-restart', true);
          return;
        }
      }
      await ipcRenderer.invoke('open-external-url', 'https://github.com/Henrique1601/open-trainer-engine/releases');
    }

    if (ipcRenderer) {
      ipcRenderer.on('cheat-toggled-event', (_event, data) => {
        if (!selectedGame || !selectedGame.cheats || !data) return;
        const c = selectedGame.cheats.find(x => x.id === data.cheatId);
        if (c) {
          c.active = Boolean(data.enabled);
          const pill = document.getElementById('toggle-pill-' + c.id);
          if (pill) pill.className = 'wemod-toggle-pill ' + (c.active ? 'on' : 'off');
        }
      });

      ipcRenderer.on('playtime-updated', (_event, data) => {
        if (selectedGame && data && selectedGame.id === data.gameId) {
          const playtimeEl = document.getElementById('detail-playtime');
          if (playtimeEl) playtimeEl.innerText = data.formatted;
        }
      });
    }

    // Inicialização ao carregar a página
    window.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>`;
}

// Salva em src/desktop/ui/index.html
const outPath = path.resolve('src/desktop/ui/index.html');
const htmlContent = generateHtml();

// Valida sintaxe JavaScript com vm.Script antes de gravar
const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('ERRO: Tag <script> não encontrada no HTML!');
  process.exit(1);
}

try {
  new vm.Script(scriptMatch[1], { filename: 'generated-index.js' });
  console.log('✓ Sintaxe JavaScript do index.html validada com sucesso via vm.Script!');
} catch (err) {
  console.error('ERRO de Sintaxe no script gerado:', err);
  process.exit(1);
}

fs.writeFileSync(outPath, htmlContent, 'utf8');
console.log(`src/desktop/ui/index.html gerado com sucesso! Tamanho: ${htmlContent.length} bytes`);
