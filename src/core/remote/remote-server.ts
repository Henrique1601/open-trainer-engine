import http from 'node:http';
import os from 'node:os';
import { EventEmitter } from 'node:events';

export interface RemoteServerOptions {
  port?: number;
}

export class RemoteServer extends EventEmitter {
  private server: http.Server | null = null;
  private sseClients: http.ServerResponse[] = [];
  public readonly port: number;

  private currentGameState: {
    gameTitle: string | null;
    isAttached: boolean;
    cheats: {
      id: string;
      name: string;
      hotkey: string;
      category: string;
      type: string;
      active: boolean;
      currentValue?: number;
    }[];
  } = {
    gameTitle: null,
    isAttached: false,
    cheats: []
  };

  constructor(options: RemoteServerOptions = {}) {
    super();
    this.port = options.port || 38474;
  }

  /**
   * Obtém o endereço IPv4 local da máquina na rede Wi-Fi/Ethernet
   */
  public static getLocalIpAddress(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const netList = interfaces[name];
      if (!netList) continue;
      for (const net of netList) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    return '127.0.0.1';
  }

  public getRemoteUrl(): string {
    const ip = RemoteServer.getLocalIpAddress();
    return `http://${ip}:${this.port}`;
  }

  public getQrCodeUrl(): string {
    const remoteUrl = encodeURIComponent(this.getRemoteUrl());
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${remoteUrl}&color=38-189-248&bgcolor=10-13-20`;
  }

  /**
   * Atualiza o estado dos cheats para sincronização com os celulares conectados
   */
  public updateState(state: Partial<typeof this.currentGameState>): void {
    this.currentGameState = { ...this.currentGameState, ...state };
    this.broadcastSSE({
      type: 'stateUpdate',
      data: this.currentGameState
    });
  }

  private broadcastSSE(payload: any): void {
    const msg = `data: ${JSON.stringify(payload)}\n\n`;
    for (let i = this.sseClients.length - 1; i >= 0; i--) {
      const res = this.sseClients[i];
      try {
        res.write(msg);
      } catch {
        this.sseClients.splice(i, 1);
      }
    }
  }

  /**
   * Inicializa o servidor HTTP e SSE para o aplicativo mobile
   */
  public start(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        // Headers CORS para PWA
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        const url = new URL(req.url || '/', `http://${req.headers.host}`);

        // 1. Rota de Estado Atual
        if (url.pathname === '/api/status' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(this.currentGameState));
          return;
        }

        // 2. Rota SSE (Server-Sent Events) para sincronização em tempo real com o smartphone
        if (url.pathname === '/api/events' && req.method === 'GET') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive'
          });
          res.write(`data: ${JSON.stringify({ type: 'init', data: this.currentGameState })}\n\n`);
          this.sseClients.push(res);

          req.on('close', () => {
            const index = this.sseClients.indexOf(res);
            if (index !== -1) {
              this.sseClients.splice(index, 1);
            }
          });
          return;
        }

        // 3. Ação: Alternar Cheat via Celular
        if (url.pathname === '/api/toggle' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              this.emit('toggleCheat', data);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Payload JSON inválido' }));
            }
          });
          return;
        }

        // 4. Rota Raiz: Serve a interface Mobile PWA (WeMod Remote Style)
        if (url.pathname === '/' || url.pathname === '/remote') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(this.renderMobileHtml());
          return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      });

      this.server.listen(this.port, '0.0.0.0', () => {
        resolve(this.getRemoteUrl());
      });

      this.server.on('error', (err) => {
        reject(err);
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      for (const client of this.sseClients) {
        try { client.end(); } catch {}
      }
      this.sseClients = [];

      if (this.server) {
        this.server.close(() => resolve());
        this.server = null;
      } else {
        resolve();
      }
    });
  }

  /**
   * Gera a interface Mobile PWA com tema dark gamer e toque tátil
   */
  private renderMobileHtml(): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Open Trainer Remote</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: #0a0d14; color: #f0f6fc; padding: 16px; user-select: none; }
    header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; border-bottom: 1px solid #21262d; margin-bottom: 16px; }
    .brand { display: flex; align-items: center; gap: 8px; }
    .brand-logo { width: 28px; height: 28px; border-radius: 6px; background: linear-gradient(135deg, #38bdf8, #818cf8); display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .brand h1 { font-size: 16px; font-weight: 700; }
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge.online { background: rgba(63, 185, 80, 0.2); color: #3fb950; border: 1px solid #3fb950; }
    .badge.offline { background: rgba(248, 81, 73, 0.2); color: #f85149; border: 1px solid #f85149; }
    .game-banner { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 14px; margin-bottom: 16px; }
    .game-banner h2 { font-size: 15px; margin-bottom: 4px; color: #fff; }
    .game-banner p { font-size: 12px; color: #8b949e; }
    .cheats-container { display: flex; flex-direction: column; gap: 10px; }
    .cheat-card { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 14px; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s; }
    .cheat-card.active { border-color: #38bdf8; background: rgba(56, 189, 248, 0.08); box-shadow: 0 0 12px rgba(56, 189, 248, 0.2); }
    .cheat-info h3 { font-size: 14px; font-weight: 600; }
    .cheat-info span { font-size: 11px; color: #8b949e; }
    .toggle-btn { width: 52px; height: 30px; border-radius: 15px; background: #30363d; position: relative; border: none; cursor: pointer; transition: background 0.25s; }
    .toggle-btn.on { background: #38bdf8; }
    .toggle-thumb { width: 24px; height: 24px; border-radius: 50%; background: #fff; position: absolute; top: 3px; left: 3px; transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 2px 5px rgba(0,0,0,0.4); }
    .toggle-btn.on .toggle-thumb { transform: translateX(22px); }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-logo">⚡</div>
      <h1>Open Trainer Remote</h1>
    </div>
    <div class="badge offline" id="net-badge">Desconectado</div>
  </header>

  <div class="game-banner">
    <h2 id="game-title">Nenhum Jogo Anexado</h2>
    <p id="game-desc">Abra um jogo no computador e ative o trainer para controlar pelo celular.</p>
  </div>

  <div class="cheats-container" id="cheats-list">
    <!-- Injetado dinamicamente via SSE -->
  </div>

  <script>
    const netBadge = document.getElementById('net-badge');
    const gameTitle = document.getElementById('game-title');
    const cheatsList = document.getElementById('cheats-list');

    let currentCheats = [];

    function renderCheats(cheats) {
      currentCheats = cheats;
      if (!cheats || cheats.length === 0) {
        cheatsList.innerHTML = '<p style="text-align: center; color: #8b949e; font-size: 13px; padding: 20px;">Nenhum cheat ativo no momento.</p>';
        return;
      }

      cheatsList.innerHTML = cheats.map(c => \`
        <div class="cheat-card \${c.active ? 'active' : ''}" onclick="toggleCheat('\${c.id}')">
          <div class="cheat-info">
            <h3>\${c.name}</h3>
            <span>Atalho: \${c.hotkey || 'Nenhum'}</span>
          </div>
          <button class="toggle-btn \${c.active ? 'on' : ''}">
            <div class="toggle-thumb"></div>
          </button>
        </div>
      \`).join('');
    }

    async function toggleCheat(id) {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(40);
      }
      try {
        await fetch('/api/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cheatId: id })
        });
      } catch (e) {
        console.error('Falha ao alternar:', e);
      }
    }

    function connectSSE() {
      const evt = new EventSource('/api/events');
      evt.onopen = () => {
        netBadge.className = 'badge online';
        netBadge.textContent = 'Conectado';
      };
      evt.onmessage = (e) => {
        const payload = JSON.parse(e.data);
        const state = payload.data;
        if (state) {
          gameTitle.textContent = state.gameTitle || 'Aguardando Jogo...';
          renderCheats(state.cheats || []);
        }
      };
      evt.onerror = () => {
        netBadge.className = 'badge offline';
        netBadge.textContent = 'Reconectando...';
        evt.close();
        setTimeout(connectSSE, 3000);
      };
    }

    connectSSE();
  </script>
</body>
</html>`;
  }
}
