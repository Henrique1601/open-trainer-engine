import http from 'node:http';
import { TrainerSession } from '../trainer/trainer-session.js';

export class OverlayServer {
  private server: http.Server | null = null;
  private currentSession: TrainerSession | null = null;

  constructor(private readonly port = 38472) {}

  public setSession(session: TrainerSession | null): void {
    this.currentSession = session;
  }

  /**
   * Inicia o servidor local de controle e overlay
   */
  public start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        const url = new URL(req.url || '/', `http://localhost:${this.port}`);

        // CORS headers para permitir conexão de webviews locais
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        // Endpoint de Status
        if (url.pathname === '/api/status' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          if (!this.currentSession) {
            res.end(JSON.stringify({ active: false, message: 'Nenhuma sessão de trainer ativa.' }));
            return;
          }

          res.end(
            JSON.stringify({
              active: true,
              game: this.currentSession.contract.title,
              state: this.currentSession.getState(),
              activeCheats: this.currentSession.getActiveCheats(),
              cheats: this.currentSession.contract.cheats.map(c => ({
                id: c.id,
                name: c.name,
                category: c.category,
                type: c.type,
                hotkey: c.hotkey || '',
                enabled: this.currentSession?.getActiveCheats().includes(c.id) || false
              }))
            })
          );
          return;
        }

        // Endpoint para alternar cheat
        if (url.pathname.startsWith('/api/cheats/') && url.pathname.endsWith('/toggle') && req.method === 'POST') {
          const parts = url.pathname.split('/');
          const cheatId = parts[3];

          if (!this.currentSession) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Nenhum trainer ativo no momento.' }));
            return;
          }

          try {
            const newState = this.currentSession.toggleCheat(cheatId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, cheatId, enabled: newState }));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Interface do HUD Overlay In-Game
        if (url.pathname === '/overlay' || url.pathname === '/') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(this.getOverlayHtml());
          return;
        }

        res.writeHead(404);
        res.end('Not Found');
      });

      this.server.listen(this.port, () => {
        resolve(this.port);
      });

      this.server.on('error', err => {
        reject(err);
      });
    });
  }

  public stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  /**
   * Retorna a UI do In-Game Overlay HUD com tema escuro e animações
   */
  private getOverlayHtml(): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Open Trainer Engine - HUD Overlay</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: rgba(13, 17, 23, 0.92);
      color: #e6edf3;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 24px;
      user-select: none;
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      max-width: 500px;
      margin: 20px auto;
      box-shadow: 0 16px 40px rgba(0,0,0,0.6);
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    h1 { font-size: 18px; font-weight: 700; color: #58a6ff; }
    .badge {
      font-size: 11px;
      background: #238636;
      color: #fff;
      padding: 3px 8px;
      border-radius: 20px;
      font-weight: 600;
    }
    .cheat-card {
      background: rgba(22, 27, 34, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s ease;
    }
    .cheat-card:hover {
      border-color: rgba(88, 166, 255, 0.3);
      transform: translateY(-1px);
    }
    .cheat-info h3 { font-size: 14px; margin-bottom: 4px; }
    .cheat-info span { font-size: 12px; color: #8b949e; }
    .hotkey-tag {
      background: #21262d;
      border: 1px solid #30363d;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      color: #79c0ff;
      margin-right: 8px;
    }
    .toggle-btn {
      background: #21262d;
      border: 1px solid #30363d;
      color: #8b949e;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }
    .toggle-btn.active {
      background: #238636;
      color: #fff;
      border-color: #2ea043;
      box-shadow: 0 0 12px rgba(46, 160, 67, 0.4);
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1 id="game-title">Open Trainer Engine</h1>
      <span style="font-size: 12px; color: #8b949e;" id="session-state">Conectando...</span>
    </div>
    <span class="badge" id="status-badge">ONLINE</span>
  </header>
  <div id="cheats-container">
    <div style="text-align: center; color: #8b949e; padding: 20px;">Carregando cheats da sessão...</div>
  </div>

  <script>
    async function loadStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (!data.active) {
          document.getElementById('session-state').innerText = 'Nenhum jogo em execução';
          document.getElementById('status-badge').style.background = '#6e7681';
          document.getElementById('cheats-container').innerHTML = '<div style="text-align: center; color: #8b949e; padding: 20px;">Abra um jogo e execute o trainer para controlar cheats.</div>';
          return;
        }

        document.getElementById('game-title').innerText = data.game;
        document.getElementById('session-state').innerText = 'Status: ' + data.state;
        document.getElementById('status-badge').style.background = '#238636';

        let html = '';
        for (const cheat of data.cheats) {
          html += \`
            <div class="cheat-card">
              <div class="cheat-info">
                <h3>\${cheat.name}</h3>
                <span>\${cheat.hotkey ? '<span class="hotkey-tag">' + cheat.hotkey + '</span>' : ''}\${cheat.category} • \${cheat.type}</span>
              </div>
              <button class="toggle-btn \${cheat.enabled ? 'active' : ''}" onclick="toggleCheat('\${cheat.id}')">
                \${cheat.enabled ? 'LIGADO' : 'DESLIGADO'}
              </button>
            </div>
          \`;
        }
        document.getElementById('cheats-container').innerHTML = html;
      } catch (err) {
        console.error(err);
      }
    }

    async function toggleCheat(id) {
      await fetch('/api/cheats/' + id + '/toggle', { method: 'POST' });
      loadStatus();
    }

    setInterval(loadStatus, 1500);
    loadStatus();
  </script>
</body>
</html>`;
  }
}
