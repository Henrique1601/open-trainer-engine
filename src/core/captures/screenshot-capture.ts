import fs from 'node:fs';
import path from 'node:path';
import { desktopCapturer } from 'electron';

export interface ScreenshotResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
}

export class GameScreenshotCapture {
  private static targetDir = path.join(
    process.env.USERPROFILE || process.env.HOME || '.',
    'Videos',
    'OpenTrainerEngine'
  );

  public static async capturePrimaryScreen(): Promise<ScreenshotResult> {
    try {
      if (!fs.existsSync(this.targetDir)) {
        fs.mkdirSync(this.targetDir, { recursive: true });
      }

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      if (!sources || sources.length === 0) {
        return { success: false, error: 'Nenhuma tela detectada para captura.' };
      }

      const primarySource = sources[0];
      const img = primarySource.thumbnail;
      const pngBuffer = img.toPNG();

      const timeStamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `Screenshot-${timeStamp}.png`;
      const fullPath = path.join(this.targetDir, fileName);

      fs.writeFileSync(fullPath, pngBuffer);

      return {
        success: true,
        filePath: fullPath,
        fileName
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Erro ao capturar tela.'
      };
    }
  }
}
