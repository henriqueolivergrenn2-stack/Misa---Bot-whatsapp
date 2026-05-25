/**
 * Comando: leite
 * Adiciona leite de aranha em fotos usando FFmpeg.
 * A leite é um PNG transparente salvo localmente em assets/images/
 *
 * Salve em: src/commands/canvas/leite.js
 *
 * CONFIGURAÇÃO:
 * Salve um PNG de leite com fundo transparente em:
 * assets/images/leite.png
 *
 * Sugestão de leite grátis (PNG transparente):
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

const leite_PATH = path.resolve(ASSETS_DIR, "images", "leite.png");

function cleanup(...files) {
  for (const f of files) {
    try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {}
  }
}

export default {
  name: "leite",
  description: "Adiciona leite na sua foto! 🍼",
  commands: ["leite"],
  usage: `${PREFIX}leite — envie ou responda uma foto`,

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
        "Envie ou responda uma foto para adicionar o leite! 🍼️"
      );
    }

    if (!fs.existsSync(leite_PATH)) {
      await sendErrorReply(
        `Arquivo de leite não encontrado!\n\n` +
        `Salve um PNG transparente de leite em:\n` +
        `*assets/images/leite.png*`
      );
      return;
    }

    await sendWaitReact();

    const name    = getRandomName();
    const imgPath = path.resolve(TEMP_DIR, `${name}.png`);
    const outPath = path.resolve(TEMP_DIR, `${name}_leite.jpg`);

    try {
      await downloadImage(webMessage, name);
      if (!fs.existsSync(imgPath)) throw new Error("Imagem não baixada.");

      // Redimensiona a leite para o tamanho da foto e sobrepõe
      await execAsync(
        `ffmpeg -y -i "${imgPath}" -i "${leite_PATH}" ` +
        `-filter_complex ` +
        `"[0:v]scale=512:512:force_original_aspect_ratio=decrease,` +
        `pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black[foto];` +
        `[1:v]scale=512:512[leite];` +
        `[foto][leite]overlay=0:0" ` +
        `-frames:v 1 -q:v 2 "${outPath}"`,
        { timeout: 30000 }
      );

      if (!fs.existsSync(outPath)) throw new Error("Imagem não gerada.");

      await sendSuccessReact();

      await socket.sendMessage(
        remoteJid,
        {
          image: fs.readFileSync(outPath),
          caption: "🍼 *leitinho aplicado!*",
        },
        { quoted: webMessage }
      );
    } catch (error) {
      errorLog(`[leite] ${error.message}`);
      await sendErrorReply(
        `Não foi possível aplicar o leite!\n\n📄 *Detalhes*: ${error.message}`
      );
    } finally {
      cleanup(imgPath, outPath);
    }
  },
};
