/**
 * Comando: facebook / face / fb
 * Baixa vídeos do Facebook usando yt-dlp (disponível no Termux).
 * Instale com: pkg install yt-dlp
 */
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { PREFIX, TEMP_DIR } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";
import { getRandomName } from "../../../utils/index.js";
import { errorLog } from "../../../utils/logger.js";

const execAsync = promisify(exec);

function cleanup(...files) {
  for (const file of files) {
    try {
      if (file && fs.existsSync(file)) fs.unlinkSync(file);
    } catch (_) {}
  }
}

export default {
  name: "facebook",
  description: "Faço o download de vídeos do Facebook!",
  commands: ["facebook", "face", "fb"],
  usage: `${PREFIX}facebook https://www.facebook.com/reel/123456789012345`,

  handle: async ({
    sendVideoFromFile,
    sendErrorReply,
    sendWaitReact,
    sendSuccessReact,
    fullArgs,
  }) => {
    if (!fullArgs.length) {
      throw new InvalidParameterError(
        "Você precisa enviar uma URL do Facebook!"
      );
    }

    if (!fullArgs.includes("facebook.com") && !fullArgs.includes("fb.watch")) {
      throw new WarningError("O link não é do Facebook!");
    }

    await sendWaitReact();

    const outputPath = path.resolve(TEMP_DIR, getRandomName("mp4"));

    try {
      await execAsync(
        `yt-dlp -f "best[ext=mp4]/best" --no-playlist -o "${outputPath}" "${fullArgs}"`,
        { timeout: 120000 }
      );

      if (!fs.existsSync(outputPath)) {
        await sendErrorReply("Não foi possível baixar o vídeo. Tente novamente!");
        return;
      }

      await sendSuccessReact();
      await sendVideoFromFile(outputPath);
    } catch (error) {
      errorLog(`[Facebook] Erro: ${error.message}`);
      await sendErrorReply(
        "Não foi possível baixar o vídeo.\n\nVerifique se o vídeo é público e tente novamente!"
      );
    } finally {
      cleanup(outputPath);
    }
  },
};
