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
    input.includes("youtu");

  if (isUrl) {
    return input.trim();
  }

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
  name: "yt-mp4",
  description: "Baixo vídeos do YouTube pelo link ou pelo nome do vídeo!",
  commands: ["yt-mp4", "youtube-mp4", "yt-video", "youtube-video", "mp4", "play-video", "playvideo"],
  usage: `${PREFIX}yt-mp4 https://www.youtube.com/watch?v=mW8o_WDL91o\n${PREFIX}yt-mp4 Nome do vídeo`,
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
        "Você precisa enviar uma URL ou o nome do vídeo!"
      );
    }

    await sendWaitReact();

    const rawName = getRandomName();
    const rawOutput = path.resolve(TEMP_DIR, `${rawName}.mp4`);
    const fixedOutput = path.resolve(TEMP_DIR, `${rawName}_fixed.mp4`);

    try {
      const url = await resolveYouTubeUrl(fullArgs);

      // Baixa em mp4 puro, sem merge de formatos diferentes
      // Isso evita que o ffmpeg precise re-encodar no Termux
      await execAsync(
        `yt-dlp \
          -f "best[ext=mp4][height<=480]/best[ext=mp4]/best" \
          --no-playlist \
          -o "${rawOutput}" \
          "${url}"`,
        { timeout: 180000 }
      );

      if (!fs.existsSync(rawOutput)) {
        await sendErrorReply("Não foi possível baixar o vídeo. Tente novamente!");
        return;
      }

      // -c copy não re-encodar, apenas move o moov atom pro início
      // Isso corrige o "arquivo corrompido" no WhatsApp sem precisar de libx264
      await execAsync(
        `ffmpeg -i "${rawOutput}" -c copy -movflags +faststart -y "${fixedOutput}"`,
        { timeout: 120000 }
      );

      if (!fs.existsSync(fixedOutput)) {
        // Se o ffmpeg falhar, tenta enviar o arquivo original mesmo assim
        await sendSuccessReact();
        await sendVideoFromFile(rawOutput);
        return;
      }

      await sendSuccessReact();
      await sendVideoFromFile(fixedOutput);
    } catch (error) {
      errorLog(`Erro ao baixar vídeo do YouTube: ${error.message}`);
      await sendErrorReply(
        error.message.includes("Nenhum")
          ? error.message
          : "Ocorreu um erro ao baixar o vídeo. Verifique o link ou o nome e tente novamente!"
      );
    } finally {
      cleanup(rawOutput, fixedOutput);
    }
  },
};