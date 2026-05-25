import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { PREFIX, TEMP_DIR } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { errorLog } from "../../../utils/logger.js";
import { getRandomName } from "../../../utils/index.js";

const execAsync = promisify(exec);

function cleanup(...files) {
  for (const file of files) {
    try {
      if (file && fs.existsSync(file)) fs.unlinkSync(file);
    } catch (_) {}
  }
}

async function resolveTikTokUrl(input) {
  const isUrl =
    input.includes("tiktok.com") ||
    input.includes("vm.tiktok") ||
    input.includes("vt.tiktok");

  if (isUrl) return input.trim();

  // Busca no TikTok pelo termo e pega o primeiro resultado
  const { stdout } = await execAsync(
    `yt-dlp "tiktoksearch1:${input}" --get-id --no-playlist`,
    { timeout: 30000 }
  );

  const videoId = stdout.trim();

  if (!videoId) {
    throw new Error("Nenhum vídeo encontrado para essa busca!");
  }

  return `https://www.tiktok.com/@/video/${videoId}`;
}

export default {
  name: "tik-tok",
  description: "Baixo vídeos do TikTok pelo link!",
  commands: ["tik-tok", "ttk", "tik"],
  usage: `${PREFIX}tik-tok https://www.tiktok.com/@user/video/123`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    sendVideoFromFile,
    fullArgs,
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
  }) => {
    if (!fullArgs.length) {
      throw new InvalidParameterError(
        "Você precisa enviar uma URL do TikTok!"
      );
    }

    await sendWaitReact();

    const baseName = getRandomName();
    const outputTemplate = path.resolve(TEMP_DIR, `${baseName}.mp4`);
    const fixedOutput = path.resolve(TEMP_DIR, `${baseName}_fixed.mp4`);

    try {
      const url = await resolveTikTokUrl(fullArgs);

      await execAsync(
        `yt-dlp --no-playlist -o "${outputTemplate}" "${url}"`,
        { timeout: 120000 }
      );

      if (!fs.existsSync(outputTemplate)) {
        await sendErrorReply("Não foi possível baixar o vídeo. Tente novamente!");
        return;
      }

      // Garante que o vídeo abre corretamente em qualquer dispositivo
      await execAsync(
        `ffmpeg -i "${outputTemplate}" -c copy -movflags +faststart -y "${fixedOutput}"`,
        { timeout: 60000 }
      );

      if (!fs.existsSync(fixedOutput)) {
        await sendErrorReply("Erro ao processar o vídeo. Tente novamente!");
        return;
      }

      await sendSuccessReact();
      await sendVideoFromFile(fixedOutput);
    } catch (error) {
      errorLog(`Erro ao baixar vídeo do TikTok: ${error.message}`);
      await sendErrorReply(
        error.message.includes("Nenhum")
          ? error.message
          : "Ocorreu um erro ao baixar o vídeo. Verifique o link!"
      );
    } finally {
      cleanup(outputTemplate, fixedOutput);
    }
  },
};
