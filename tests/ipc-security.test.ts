import { describe, it, expect, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getVersion: () => '0.6.1',
    getPath: () => '.',
    relaunch: vi.fn(),
    exit: vi.fn()
  },
  ipcMain: { handle: vi.fn() },
  shell: { openExternal: vi.fn() },
  BrowserWindow: vi.fn()
}));

import { isAllowedExternalUrl } from '../src/desktop/ipc/ipc-system';

describe('IPC Security Helpers', () => {
  it('permite apenas URLs http: e https: em isAllowedExternalUrl', () => {
    expect(isAllowedExternalUrl('https://github.com/Henrique3h0/open-trainer-engine')).toBe(true);
    expect(isAllowedExternalUrl('http://localhost:39988')).toBe(true);

    expect(isAllowedExternalUrl('file:///C:/Windows/System32/calc.exe')).toBe(false);
    expect(isAllowedExternalUrl('ms-msdt:/id PCWDiagnostic')).toBe(false);
    expect(isAllowedExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedExternalUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isAllowedExternalUrl('not-a-valid-url')).toBe(false);
    expect(isAllowedExternalUrl('')).toBe(false);
  });
});
