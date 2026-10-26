import fs from 'node:fs';
import path from 'node:path';

export interface GameCapture {
  id: string;
  filename: string;
  filePath: string;
  gameTitle: string;
  sizeBytes: number;
  createdAt: string;
  type: 'screenshot' | 'video';
}

export class CapturesManager {
  private static capturesDir = path.join(
    process.env.USERPROFILE || process.env.HOME || '.',
    'Videos',
    'OpenTrainerEngine',
    'Captures'
  );

  public static getCapturesDirectory(): string {
    if (!fs.existsSync(this.capturesDir)) {
      fs.mkdirSync(this.capturesDir, { recursive: true });
    }
    return this.capturesDir;
  }

  /**
   * Lista todos os destaques e capturas de tela gravados
   */
  public static listCaptures(): GameCapture[] {
    const dir = this.getCapturesDirectory();
    const captures: GameCapture[] = [];

    try {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        const lower = file.toLowerCase();
        const isVideo = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mkv');
        const isImage = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg');

        if (isVideo || isImage) {
          captures.push({
            id: file,
            filename: file,
            filePath: fullPath,
            gameTitle: file.split('_')[0] || 'Gameplay',
            sizeBytes: stat.size,
            createdAt: stat.birthtime.toISOString(),
            type: isVideo ? 'video' : 'screenshot'
          });
        }
      }
    } catch {
      // Ignora erro
    }

    return captures.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
