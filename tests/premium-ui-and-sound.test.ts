import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('UI/UX Premium Design & Sound Synthesizer Verification', () => {
  const indexHtmlPath = path.resolve('src/desktop/ui/index.html');
  const overlayHtmlPath = path.resolve('src/desktop/ui/overlay.html');

  it('deve conter estrutura completa de index.html com tipografia gaming e tokens de 5 temas', () => {
    expect(fs.existsSync(indexHtmlPath)).toBe(true);
    const content = fs.readFileSync(indexHtmlPath, 'utf8');

    // Tipografia AAA
    expect(content).toContain('Plus+Jakarta+Sans');
    expect(content).toContain('Outfit');
    expect(content).toContain('JetBrains+Mono');

    // 5 Temas
    expect(content).toContain('data-theme="wemod"');
    expect(content).toContain('data-theme="cyberpunk"');
    expect(content).toContain('data-theme="obsidian"');
    expect(content).toContain('data-theme="crimson"');
    expect(content).toContain('data-theme="frost"');

    // Topbar Header
    expect(content).toContain('topbar-header');
    expect(content).toContain('global-search-input');
    expect(content).toContain('CTRL+K');
    expect(content).toContain('btn-sound-toggle');
    expect(content).toContain('engine-status-pill');

    // Keycaps mecânicos 3D & Rebind
    expect(content).toContain('hotkey-badge-3d');
    expect(content).toContain('startRebindHotkey');

    // Sintetizador de áudio Web Audio API
    expect(content).toContain('SoundEngine');
    expect(content).toContain('audioCtx');
    expect(content).toContain('toggleOn');
    expect(content).toContain('toggleOff');
  });

  it('deve conter overlay.html sincronizado com temas e fontes do projeto', () => {
    expect(fs.existsSync(overlayHtmlPath)).toBe(true);
    const content = fs.readFileSync(overlayHtmlPath, 'utf8');

    expect(content).toContain('data-theme="wemod"');
    expect(content).toContain('data-theme="cyberpunk"');
    expect(content).toContain('theme:changed');
    expect(content).toContain('Plus+Jakarta+Sans');
    expect(content).toContain('Outfit');
  });
});
