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

  const { stdout } = await execAsync(
    `yt-dlp "tiktoksearch1:${input}" --get-id --no-playlist`,
    { timeout: 30000 }
  );

  const videoId = stdout.trim();

  if (!videoId) {
    throw new Error("Nenhum áudio encontrado para essa busca!");
  }

  return `https://www.tiktok.com/@/video/${videoId}`;
}

export default {
  name: "tik-tok-audio",
  description: "Baixo áudios de vídeos do TikTok pelo link ou termo de busca!",
  commands: [
    "tik-tok-audio",
    "tik-tok-mp3",
    "tik-audio",
    "tik-mp3",
    "ttk-audio",
    "ttk-mp3",
  ],
  usage: `${PREFIX}tik-tok-audio https://www.tiktok.com/@user/video/123`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    sendAudioFromFile,
    fullArgs,
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
  }) => {
    if (!fullArgs.length) {
      throw new InvalidParameterError(
        "Você precisa enviar uma URL do TIKTOK"
      );
    }

    await sendWaitReact();

    const outputPath = path.resolve(TEMP_DIR, getRandomName("mp3"));

    try {
      const url = await resolveTikTokUrl(fullArgs);

      await execAsync(
        `yt-dlp -x --audio-format mp3 --audio-quality 0 --no-playlist -o "${outputPath}" "${url}"`,
        { timeout: 120000 }
      );

      if (!fs.existsSync(outputPath)) {
        await sendErrorReply("Não foi possível baixar o áudio. Tente novamente!");
        return;
      }

      await sendSuccessReact();
      await sendAudioFromFile(outputPath, false);
    } catch (error) {
      errorLog(`Erro ao baixar áudio do TikTok: ${error.message}`);
      await sendErrorReply(
        error.message.includes("Nenhum")
          ? error.message
          : "Ocorreu um erro ao baixar o áudio. Verifique o link!"
      );
    } finally {
      cleanup(outputPath);
    }
  },
};
