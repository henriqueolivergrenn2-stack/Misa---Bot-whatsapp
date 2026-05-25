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
      if (file && fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch (_) {}
  }
}

async function resolveYouTubeUrl(input) {
  const isUrl =
    input.includes("youtube.com") ||
    input.includes("youtu.be") ||
    input.includes("you");

  if (isUrl) {
    return input.trim();
  }

  // Busca pelo termo e pega o primeiro resultado
  const { stdout } = await execAsync(
    `yt-dlp "ytsearch1:${input}" --get-id --no-playlist`,
    { timeout: 30000 }
  );

  const videoId = stdout.trim();

  if (!videoId) {
    throw new Error("Nenhum vídeo encontrado para essa busca!");
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
}

export default {
  name: "yt-mp3",
  description: "Baixo áudios do YouTube pelo link ou pelo nome da música!",
  commands: ["yt-mp3", "youtube-mp3", "yt-audio", "youtube-audio", "mp3", "play-audio", "playaudio"],
  usage: `${PREFIX}yt-mp3 https://www.youtube.com/watch?v=mW8o_WDL91o\n${PREFIX}yt-mp3 Nome da música ou vídeo`,
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
        "Você precisa enviar uma URL ou o nome da música/vídeo!"
      );
    }

    await sendWaitReact();

    const outputPath = path.resolve(TEMP_DIR, getRandomName("mp3"));

    try {
      const url = await resolveYouTubeUrl(fullArgs);

      await execAsync(
        `yt-dlp -x --audio-format mp3 --audio-quality 0 --no-playlist -o "${outputPath}" "${url}"`,
        { timeout: 120000 }
      );

      if (!fs.existsSync(outputPath)) {
        await sendErrorReply(
          "Não foi possível baixar o áudio. Tente novamente!"
        );
        return;
      }

      await sendSuccessReact();

      await sendAudioFromFile(outputPath, false);
    } catch (error) {
      errorLog(`Erro ao baixar áudio do YouTube: ${error.message}`);
      await sendErrorReply(
        error.message.includes("Nenhum")
          ? error.message
          : "Ocorreu um erro ao baixar o áudio. Verifique o link ou o nome e tente novamente!"
      );
    } finally {
      cleanup(outputPath);
    }
  },
};
