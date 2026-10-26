import { EventEmitter } from 'node:events';
import { RegisterHotKey, UnregisterHotKey } from '../memory/win32.js';

export const MOD_ALT = 0x0001;
export const MOD_CONTROL = 0x0002;
export const MOD_SHIFT = 0x0004;
export const MOD_WIN = 0x0008;
export const MOD_NOREPEAT = 0x4000;

export const VK_MAP: Record<string, number> = {
  F1: 0x70,
  F2: 0x71,
  F3: 0x72,
  F4: 0x73,
  F5: 0x74,
  F6: 0x75,
  F7: 0x76,
  F8: 0x77,
  F9: 0x78,
  F10: 0x79,
  F11: 0x7A,
  F12: 0x7B,
  NUMPAD0: 0x60,
  NUMPAD1: 0x61,
  NUMPAD2: 0x62,
  NUMPAD3: 0x63,
  NUMPAD4: 0x64,
  NUMPAD5: 0x65,
  NUMPAD6: 0x66,
  NUMPAD7: 0x67,
  NUMPAD8: 0x68,
  NUMPAD9: 0x69,
  HOME: 0x24,
  END: 0x23,
  INSERT: 0x2D,
  DELETE: 0x2E,
  PAGEUP: 0x21,
  PAGEDOWN: 0x22
};

export class HotkeyManager extends EventEmitter {
  private registeredHotkeys = new Map<number, { id: number; keyString: string; action: () => void }>();
  private nextId = 1;

  /**
   * Converte uma string de atalho (ex: 'Ctrl+F1' ou 'Numpad1') em modificadores e Virtual-Key
   */
  public static parseHotkeyString(keyStr: string): { modifiers: number; vk: number } {
    const parts = keyStr.toUpperCase().split('+').map(p => p.trim());
    let modifiers = MOD_NOREPEAT;
    let vk = 0;

    for (const part of parts) {
      if (part === 'CTRL' || part === 'CONTROL') {
        modifiers |= MOD_CONTROL;
      } else if (part === 'ALT') {
        modifiers |= MOD_ALT;
      } else if (part === 'SHIFT') {
        modifiers |= MOD_SHIFT;
      } else if (part === 'WIN' || part === 'WINDOWS') {
        modifiers |= MOD_WIN;
      } else if (VK_MAP[part]) {
        vk = VK_MAP[part];
      } else if (part.length === 1) {
        vk = part.charCodeAt(0);
      }
    }

    if (vk === 0) {
      throw new Error(`Tecla virtual não reconhecida no atalho: '${keyStr}'`);
    }

    return { modifiers, vk };
  }

  /**
   * Registra um atalho global no Windows
   */
  public register(keyStr: string, action: () => void): number {
    const { modifiers, vk } = HotkeyManager.parseHotkeyString(keyStr);
    const id = this.nextId++;

    const success = RegisterHotKey(0, id, modifiers, vk);
    if (!success) {
      console.warn(`Aviso: Não foi possível registrar o atalho global '${keyStr}' (pode estar em uso por outro programa).`);
    }

    this.registeredHotkeys.set(id, { id, keyString: keyStr, action });
    return id;
  }

  /**
   * Desregistra um atalho global
   */
  public unregister(id: number): boolean {
    const entry = this.registeredHotkeys.get(id);
    if (!entry) return false;

    UnregisterHotKey(0, id);
    this.registeredHotkeys.delete(id);
    return true;
  }

  /**
   * Desregistra todos os atalhos
   */
  public unregisterAll(): void {
    for (const id of Array.from(this.registeredHotkeys.keys())) {
      this.unregister(id);
    }
  }
}
