/**
 * Comando: teias
 * Adiciona teias de aranha em fotos usando FFmpeg.
 * A teia é um PNG transparente salvo localmente em assets/images/
 *
 * Salve em: src/commands/canvas/teias.js
 *
 * CONFIGURAÇÃO:
 * Salve um PNG de teia com fundo transparente em:
 * assets/images/teia.png
 *
 * Sugestão de teia grátis (PNG transparente):
 * https://www.freepng.es/buscar/?q=spider+web+transparent
 */
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { ASSETS_DIR, PREFIX, TEMP_DIR } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { getRandomName } from "../../../utils/index.js";
import { errorLog } from "../../../utils/logger.js";

const execAsync = promisify(exec);

const TEIA_PATH = path.resolve(ASSETS_DIR, "images", "teias.png");

function cleanup(...files) {
  for (const f of files) {
    try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {}
  }
}

export default {
  name: "teias",
  description: "Adiciona teias de aranha na sua foto! 🕸️",
  commands: ["teias", "teia"],
  usage: `${PREFIX}teias — envie ou responda uma foto`,

  handle: async ({
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
    remoteJid,
    socket,
    webMessage,
    isImage,
    downloadImage,
  }) => {
    if (!isImage) {
      throw new InvalidParameterError(
        "Envie ou responda uma foto para adicionar as teias! 🕸️"
      );
    }

    if (!fs.existsSync(TEIA_PATH)) {
      await sendErrorReply(
        `Arquivo de teia não encontrado!\n\n` +
        `Salve um PNG transparente de teia em:\n` +
        `*assets/images/teia.png*`
      );
      return;
    }

    await sendWaitReact();

    const name    = getRandomName();
    const imgPath = path.resolve(TEMP_DIR, `${name}.png`);
    const outPath = path.resolve(TEMP_DIR, `${name}_teia.jpg`);

    try {
      await downloadImage(webMessage, name);
      if (!fs.existsSync(imgPath)) throw new Error("Imagem não baixada.");

      // Redimensiona a teia para o tamanho da foto e sobrepõe
      await execAsync(
        `ffmpeg -y -i "${imgPath}" -i "${TEIA_PATH}" ` +
        `-filter_complex ` +
        `"[0:v]scale=512:512:force_original_aspect_ratio=decrease,` +
        `pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black[foto];` +
        `[1:v]scale=512:512[teia];` +
        `[foto][teia]overlay=0:0" ` +
        `-frames:v 1 -q:v 2 "${outPath}"`,
        { timeout: 30000 }
      );

      if (!fs.existsSync(outPath)) throw new Error("Imagem não gerada.");

      await sendSuccessReact();

      await socket.sendMessage(
        remoteJid,
        {
          image: fs.readFileSync(outPath),
          caption: "🕸️ *Teias aplicadas!*",
        },
        { quoted: webMessage }
      );
    } catch (error) {
      errorLog(`[teias] ${error.message}`);
      await sendErrorReply(
        `Não foi possível aplicar as teias!\n\n📄 *Detalhes*: ${error.message}`
      );
    } finally {
      cleanup(imgPath, outPath);
    }
  },
};
