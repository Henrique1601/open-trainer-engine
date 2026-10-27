import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  downloadUrl?: string;
  publishedAt?: string;
  fileName?: string;
  fileSize?: number;
}

export interface DownloadProgress {
  totalBytes: number;
  downloadedBytes: number;
  percent: number;
}

export class AppUpdater extends EventEmitter {
  public static readonly REPO = 'Henrique1601/open-trainer-engine';

  public static getCurrentVersion(): string {
    try {
      const pkgPath = path.resolve('package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        return pkg.version || '0.3.0';
      }
    } catch {}
    return '0.3.0';
  }

  /**
   * Compara duas versões semânticas (ex: '0.2.0' vs '0.3.0')
   * Retorna 1 se v2 > v1 (update disponível), 0 se iguais, -1 se v1 > v2
   */
  public static compareVersions(v1: string, v2: string): number {
    const clean1 = v1.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
    const clean2 = v2.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);

    for (let i = 0; i < Math.max(clean1.length, clean2.length); i++) {
      const p1 = clean1[i] || 0;
      const p2 = clean2[i] || 0;
      if (p2 > p1) return 1;
      if (p2 < p1) return -1;
    }
    return 0;
  }

  /**
   * Consulta a API do GitHub Releases para checar se há uma versão mais nova
   */
  public static checkForUpdates(): Promise<UpdateInfo> {
    const currentVersion = this.getCurrentVersion();

    return new Promise((resolve) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.REPO}/releases/latest`,
        method: 'GET',
        headers: {
          'User-Agent': 'OpenTrainerEngine-AppUpdater'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const release = JSON.parse(data);
              const latestTag = release.tag_name || release.name || currentVersion;
              const cleanLatest = latestTag.replace(/^v/i, '');

              const hasUpdate = this.compareVersions(currentVersion, cleanLatest) > 0;

              // Prioriza o instalador NSIS ou executável do release
              const exeAsset = release.assets?.find((a: any) => 
                a.name?.toLowerCase().endsWith('.exe') && !a.name?.toLowerCase().includes('portable')
              ) || release.assets?.find((a: any) => a.name?.toLowerCase().endsWith('.exe'));

              const downloadUrl = exeAsset?.browser_download_url || release.html_url;

              resolve({
                hasUpdate,
                currentVersion,
                latestVersion: cleanLatest,
                releaseName: release.name || latestTag,
                releaseNotes: release.body || 'Correções e novos trainers incluídos.',
                downloadUrl,
                fileName: exeAsset?.name,
                fileSize: exeAsset?.size,
                publishedAt: release.published_at
              });
            } else {
              resolve({
                hasUpdate: false,
                currentVersion,
                latestVersion: currentVersion,
                releaseName: 'Versão Atual',
                releaseNotes: 'Você está utilizando a versão mais recente.'
              });
            }
          } catch {
            resolve({
              hasUpdate: false,
              currentVersion,
              latestVersion: currentVersion,
              releaseName: 'Versão Atual',
              releaseNotes: 'Verificação concluída.'
            });
          }
        });
      });

      req.on('error', () => {
        resolve({
          hasUpdate: false,
          currentVersion,
          latestVersion: currentVersion,
          releaseName: 'Offline',
          releaseNotes: 'Não foi possível conectar ao servidor de atualizações.'
        });
      });

      req.end();
    });
  }

  /**
   * Baixa a atualização diretamente para o disco exibindo progresso
   */
  public static downloadUpdate(
    downloadUrl: string,
    targetPath: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const getFile = (url: string) => {
        const client = url.startsWith('https') ? https : http;
        
        client.get(url, { headers: { 'User-Agent': 'OpenTrainerEngine-AppUpdater' } }, (res) => {
          // Trata redirecionamentos 301 / 302 do GitHub / AWS S3
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            getFile(res.headers.location);
            return;
          }

          if (res.statusCode !== 200) {
            reject(new Error(`Falha no download da atualização: HTTP ${res.statusCode}`));
            return;
          }

          const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          let downloadedBytes = 0;

          const dir = path.dirname(targetPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          const fileStream = fs.createWriteStream(targetPath);

          res.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            fileStream.write(chunk);
            if (onProgress && totalBytes > 0) {
              const percent = Math.min(100, Math.round((downloadedBytes / totalBytes) * 100));
              onProgress({ totalBytes, downloadedBytes, percent });
            }
          });

          res.on('end', () => {
            fileStream.end();
            resolve(targetPath);
          });

          res.on('error', (err) => {
            fileStream.close();
            reject(err);
          });
        }).on('error', (err) => {
          reject(err);
        });
      };

      getFile(downloadUrl);
    });
  }

  /**
   * Executa o instalador em modo silencioso (/S) ou normal e fecha o aplicativo para substituição
   */
  public static installAndRestart(installerPath: string, silent: boolean = true): void {
    if (!fs.existsSync(installerPath)) {
      throw new Error(`Instalador não encontrado: ${installerPath}`);
    }

    const args = silent ? ['/S'] : [];

    const child = spawn(installerPath, args, {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    // Fecha o processo atual permitindo que o instalador o substitua
    setTimeout(() => {
      process.exit(0);
    }, 800);
  }
}
