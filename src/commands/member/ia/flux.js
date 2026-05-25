/**
 * Comando: flux / imagine / gerar-imagem
 * Gera imagens usando Pollinations.ai — 100% gratuito, sem API Key!
 */
import fs from "node:fs";
import path from "node:path";
import { PREFIX, TEMP_DIR } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { getRandomName } from "../../../utils/index.js";
import { errorLog } from "../../../utils/logger.js";

function cleanup(...files) {
  for (const file of files) {
    try {
      if (file && fs.existsSync(file)) fs.unlinkSync(file);
    } catch (_) {}
  }
}

export default {
  name: "flux",
  description: "Cria uma imagem usando IA (gratuito, sem API Key)!",
  commands: ["flux", "imagine", "gerar-imagem"],
  usage: `${PREFIX}flux um gato astronauta no espaço`,

  handle: async ({
    fullArgs,
    sendWaitReply,
    sendSuccessReact,
    sendImageFromFile,
    sendErrorReply,
  }) => {
    if (!fullArgs?.trim()) {
      throw new InvalidParameterError(
        `Você precisa fornecer uma descrição!\n\nExemplo: *${PREFIX}flux um gato astronauta no espaço*`
      );
    }

    await sendWaitReply("Gerando sua imagem com IA, aguarde...");

    const outputPath = path.resolve(TEMP_DIR, getRandomName("png"));

    try {
      const prompt = encodeURIComponent(fullArgs.trim());
      const seed = Math.floor(Math.random() * 999999);

      // Pollinations.ai — gratuito, sem token, modelo Flux
      const url = `https://image.pollinations.ai/prompt/${prompt}?model=flux&width=1024&height=1024&seed=${seed}&nologo=true&safe=true`;

      const response = await fetch(url, { signal: AbortSignal.timeout(60000) });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      if (!buffer.length) {
        await sendErrorReply("A IA não retornou nenhuma imagem. Tente novamente!");
        return;
      }

      fs.writeFileSync(outputPath, buffer);

      await sendSuccessReact();
      await sendImageFromFile(outputPath, `🎨 *${fullArgs.trim()}*`);
    } catch (error) {
      errorLog(`[Flux] Erro: ${error.message}`);
      await sendErrorReply(
        "Não foi possível gerar a imagem. Tente novamente em alguns segundos!"
      );
    } finally {
      cleanup(outputPath);
    }
  },
};
