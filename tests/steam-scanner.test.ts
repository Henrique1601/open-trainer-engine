import { describe, it, expect } from 'vitest';
import { SteamScanner } from '../src/core/scanner/steam-scanner.js';

describe('SteamScanner', () => {
  it('deve fazer o parse correto de estruturas VDF da Valve', () => {
    const mockVdf = `
"AppState"
{
  "appid"    "1145360"
  "name"     "Hades"
  "installdir" "Hades"
  "buildid"  "5432100"
}
`;
    const parsed = SteamScanner.parseVdf(mockVdf);
    expect(parsed.AppState).toBeDefined();
    expect(parsed.AppState.appid).toBe('1145360');
    expect(parsed.AppState.name).toBe('Hades');
    expect(parsed.AppState.installdir).toBe('Hades');
    expect(parsed.AppState.buildid).toBe('5432100');
  });

  it('deve fazer o parse de libraryfolders.vdf com múltiplos discos', () => {
    const mockLibraryVdf = `
"libraryfolders"
{
  "0"
  {
    "path"    "C:\\\\Program Files (x86)\\\\Steam"
  }
  "1"
  {
    "path"    "D:\\\\SteamLibrary"
  }
}
`;
    const parsed = SteamScanner.parseVdf(mockLibraryVdf);
    expect(parsed.libraryfolders['0'].path).toBe('C:\\Program Files (x86)\\Steam');
    expect(parsed.libraryfolders['1'].path).toBe('D:\\SteamLibrary');
  });
});
