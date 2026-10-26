import { describe, it, expect } from 'vitest';
import { GogScanner } from '../src/core/scanner/gog-scanner.js';
import { XboxScanner } from '../src/core/scanner/xbox-scanner.js';

describe('GogScanner & XboxScanner', () => {
  it('deve fazer o parse correto de manifesto goggame-*.info', () => {
    const mockJson = JSON.stringify({
      gameId: '1423049311',
      rootGameId: '1423049311',
      name: 'Cyberpunk 2077',
      playTasks: [
        {
          isPrimary: true,
          path: 'bin\\x64\\Cyberpunk2077.exe',
          type: 'FileTask'
        }
      ]
    });

    const parsed = GogScanner.parseGogGameInfo(mockJson, 'D:\\GOG Games\\Cyberpunk 2077');
    expect(parsed).not.toBeNull();
    expect(parsed?.id).toBe('gog-1423049311');
    expect(parsed?.title).toBe('Cyberpunk 2077');
    expect(parsed?.platform).toBe('gog');
    expect(parsed?.executableName).toBe('Cyberpunk2077.exe');
  });

  it('deve retornar null para gog info inválido', () => {
    const parsed = GogScanner.parseGogGameInfo('invalid json', 'C:\\dummy');
    expect(parsed).toBeNull();
  });

  it('deve fazer o parse correto do MicrosoftGame.config do Xbox Game Pass', () => {
    const mockXml = `<?xml version="1.0" encoding="utf-8"?>
<Game configVersion="1">
  <Identity Name="Bethesda.Starfield" Publisher="CN=Bethesda" Version="1.0.0.0" />
  <ExecutableList>
    <Executable Name="Starfield.exe" TargetDeviceFamily="PC" />
  </ExecutableList>
</Game>`;

    const parsed = XboxScanner.parseMicrosoftGameConfig(mockXml, 'C:\\XboxGames\\Starfield');
    expect(parsed).not.toBeNull();
    expect(parsed?.id).toBe('xbox-Bethesda.Starfield');
    expect(parsed?.title).toBe('Bethesda.Starfield');
    expect(parsed?.platform).toBe('xbox');
    expect(parsed?.executableName).toBe('Starfield.exe');
  });

  it('deve retornar null para MicrosoftGame.config inválido', () => {
    const parsed = XboxScanner.parseMicrosoftGameConfig('<Invalid></Invalid>', 'C:\\dummy');
    expect(parsed).toBeNull();
  });
});
