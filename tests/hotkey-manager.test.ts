import { describe, it, expect } from 'vitest';
import { HotkeyManager, MOD_CONTROL, MOD_ALT, VK_MAP } from '../src/core/overlay/hotkey-manager.js';

describe('HotkeyManager', () => {
  it('deve fazer o parse de tecla de função simples F1', () => {
    const { vk } = HotkeyManager.parseHotkeyString('F1');
    expect(vk).toBe(VK_MAP.F1);
  });

  it('deve fazer o parse de combinação Ctrl+F2', () => {
    const { modifiers, vk } = HotkeyManager.parseHotkeyString('Ctrl+F2');
    expect(vk).toBe(VK_MAP.F2);
    expect(modifiers & MOD_CONTROL).toBeTruthy();
  });

  it('deve fazer o parse de combinação com Numpad e Alt', () => {
    const { modifiers, vk } = HotkeyManager.parseHotkeyString('Alt+Numpad5');
    expect(vk).toBe(VK_MAP.NUMPAD5);
    expect(modifiers & MOD_ALT).toBeTruthy();
  });

  it('deve lançar erro em tecla desconhecida', () => {
    expect(() => HotkeyManager.parseHotkeyString('INVALIDKEY')).toThrow();
  });
});
