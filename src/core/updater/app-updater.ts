import https from 'node:https';

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  downloadUrl?: string;
  publishedAt?: string;
}

export class AppUpdater {
  public static readonly CURRENT_VERSION = '0.1.0';
  public static readonly REPO = 'Henrique1601/open-trainer-engine';

  /**
   * Compara duas versões semânticas (ex: '0.1.0' vs '0.2.0')
   * Retorna 1 se v2 > v1 (existe update), 0 se iguais, -1 se v1 > v2
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
              const latestTag = release.tag_name || release.name || '0.1.0';
              const cleanLatest = latestTag.replace(/^v/i, '');

              const hasUpdate = this.compareVersions(this.CURRENT_VERSION, cleanLatest) > 0;

              // Encontra o asset .exe se houver
              const exeAsset = release.assets?.find((a: any) => a.name?.endsWith('.exe'));
              const downloadUrl = exeAsset?.browser_download_url || release.html_url;

              resolve({
                hasUpdate,
                currentVersion: this.CURRENT_VERSION,
                latestVersion: cleanLatest,
                releaseName: release.name || latestTag,
                releaseNotes: release.body || 'Correções e novos trainers incluídos.',
                downloadUrl,
                publishedAt: release.published_at
              });
            } else {
              // Sem releases publicadas ainda ou limite de rate do GitHub
              resolve({
                hasUpdate: false,
                currentVersion: this.CURRENT_VERSION,
                latestVersion: this.CURRENT_VERSION,
                releaseName: 'Versão Atual',
                releaseNotes: 'Você está utilizando a versão mais recente.'
              });
            }
          } catch {
            resolve({
              hasUpdate: false,
              currentVersion: this.CURRENT_VERSION,
              latestVersion: this.CURRENT_VERSION,
              releaseName: 'Versão Atual',
              releaseNotes: 'Verificação concluída.'
            });
          }
        });
      });

      req.on('error', () => {
        resolve({
          hasUpdate: false,
          currentVersion: this.CURRENT_VERSION,
          latestVersion: this.CURRENT_VERSION,
          releaseName: 'Offline',
          releaseNotes: 'Não foi possível conectar ao servidor de atualizações.'
        });
      });

      req.end();
    });
  }
}
