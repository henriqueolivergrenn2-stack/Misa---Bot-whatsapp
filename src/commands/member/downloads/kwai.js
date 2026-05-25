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
  name: "kwai",
  description: "Baixa vídeos do Kwai sem marca d'água!",
  commands: ["kwai"],
  usage: `${PREFIX}kwai https://k.kwai.com/p/XvBCuvbR`,

  handle: async ({
    sendVideoFromFile,
    sendErrorReply,
    sendWaitReact,
    sendSuccessReact,
    fullArgs,
  }) => {
    if (!fullArgs.length) {
      throw new InvalidParameterError(
        "Você precisa enviar uma URL do Kwai!"
      );
    }

    if (!fullArgs.includes("kwai.com") && !fullArgs.includes("kw.ai")) {
      throw new WarningError("O link não é do Kwai!");
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
      errorLog(`[Kwai] Erro: ${error.message}`);
      await sendErrorReply(
        "Não foi possível baixar o vídeo.\n\nVerifique se o vídeo é público e tente novamente!"
      );
    } finally {
      cleanup(outputPath);
    }
  },
};
