import { describe, it, expect, afterEach } from 'vitest';
import { RemoteServer } from '../src/core/remote/remote-server.js';

describe('RemoteServer (WeMod Remote)', () => {
  let server: RemoteServer | null = null;

  afterEach(async () => {
    if (server) {
      await server.stop();
      server = null;
    }
  });

  it('deve retornar IP local e URL remota válida', () => {
    const ip = RemoteServer.getLocalIpAddress();
    expect(ip).toBeDefined();
    expect(typeof ip).toBe('string');

    server = new RemoteServer({ port: 39991 });
    const url = server.getRemoteUrl();
    expect(url).toContain(':39991');

    const qr = server.getQrCodeUrl();
    expect(qr).toContain('api.qrserver.com');
  });

  it('deve iniciar servidor HTTP e responder status via GET /api/status', async () => {
    server = new RemoteServer({ port: 39992 });
    await server.start();

    server.updateState({
      gameTitle: 'Elden Ring',
      cheats: [
        {
          id: 'god-mode',
          name: 'Modo Deus',
          hotkey: 'F1',
          category: 'Jogador',
          type: 'aob_patch',
          active: true
        }
      ]
    });

    const res = await fetch('http://127.0.0.1:39992/api/status');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.gameTitle).toBe('Elden Ring');
    expect(data.cheats).toHaveLength(1);
    expect(data.cheats[0].name).toBe('Modo Deus');
  });

  it('deve emitir evento toggleCheat ao receber POST /api/toggle', async () => {
    server = new RemoteServer({ port: 39993 });
    await server.start();

    let emittedId: string | null = null;
    server.on('toggleCheat', (data) => {
      emittedId = data.cheatId;
    });

    const res = await fetch('http://127.0.0.1:39993/api/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cheatId: 'inf-ammo' })
    });

    expect(res.status).toBe(200);
    expect(emittedId).toBe('inf-ammo');
  });

  it('deve exigir authToken quando configurado (401 sem token, 200 com token)', async () => {
    server = new RemoteServer({ port: 39994, authToken: 'secret123' });
    await server.start();

    expect(server.getRemoteUrl()).toContain('?token=secret123');

    const resUnauthorized = await fetch('http://127.0.0.1:39994/api/status');
    expect(resUnauthorized.status).toBe(401);

    const resWrong = await fetch('http://127.0.0.1:39994/api/status?token=wrong');
    expect(resWrong.status).toBe(401);

    const resAuthorized = await fetch('http://127.0.0.1:39994/api/status?token=secret123');
    expect(resAuthorized.status).toBe(200);

    const resHeader = await fetch('http://127.0.0.1:39994/api/status', {
      headers: { 'x-remote-token': 'secret123' }
    });
    expect(resHeader.status).toBe(200);
  });
});
