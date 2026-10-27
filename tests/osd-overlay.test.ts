import { describe, it, expect } from 'vitest';
import { GameProcessPauser } from '../src/core/memory/process-pauser.js';
import { GameScreenshotCapture } from '../src/core/captures/screenshot-capture.js';

describe('GameProcessPauser (In-Game Auto-Pause / SuspendThread)', () => {
  it('deve inicializar com estado despausado', () => {
    const state = GameProcessPauser.getState();
    expect(state.isPaused).toBe(false);
    expect(state.targetPid).toBeNull();
  });

  it('deve retornar false seguro ao tentar despausar sem processo', () => {
    const res = GameProcessPauser.resume();
    expect(res).toBe(false);
  });
});

describe('GameScreenshotCapture', () => {
  it('deve possuir classe definida de captura de tela primária', () => {
    expect(GameScreenshotCapture.capturePrimaryScreen).toBeDefined();
    expect(typeof GameScreenshotCapture.capturePrimaryScreen).toBe('function');
  });
});
