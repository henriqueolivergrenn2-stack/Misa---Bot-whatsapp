import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { PREFIX, TEMP_DIR } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
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

async function generateStickerBuffer(text) {
  const outputPath = path.resolve(TEMP_DIR, getRandomName("webp"));

  // Escapa caracteres especiais para o drawtext do FFmpeg
  const safeText = text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\u2019")
    .replace(/:/g, "\\:")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");

  // Gera imagem 512x512 com fundo branco e texto centralizado via lavfi
  await execAsync(
    `ffmpeg -y -f lavfi -i color=white:size=512x512 -vframes 1 ` +
    `-vf "drawtext=text='${safeText}':fontsize=80:fontcolor=black:` +
    `x=(w-text_w)/2:y=(h-text_h)/2:` +
    `shadowcolor=gray:shadowx=3:shadowy=3" ` +
    `"${outputPath}"`,
    { timeout: 30000 }
  );

  const buffer = fs.readFileSync(outputPath);
  cleanup(outputPath);
  return buffer;
}

export default {
  name: "ttp",
  description: "Faz figurinhas de texto.",
  commands: ["ttp"],
  usage: `${PREFIX}ttp teste`,

  handle: async ({
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
    args,
    socket,
    remoteJid,
    webMessage,
  }) => {
    if (!args.length) {
      throw new InvalidParameterError(
        "Você precisa informar o texto que deseja transformar em figurinha."
      );
    }

    const text = args[0].trim();

    if (text.length > 30) {
      throw new InvalidParameterError(
        "O texto não pode ter mais de 30 caracteres."
      );
    }

    await sendWaitReact();

    try {
      const stickerBuffer = await generateStickerBuffer(text);

      await sendSuccessReact();

      await socket.sendMessage(
        remoteJid,
        { sticker: stickerBuffer },
        { quoted: webMessage }
      );
    } catch (error) {
      errorLog(`[ttp] Erro: ${error.message}`);
      await sendErrorReply(
        `Não foi possível gerar a figurinha!\n\n📄 *Detalhes*: ${error.message}`
      );
    }
  },
};