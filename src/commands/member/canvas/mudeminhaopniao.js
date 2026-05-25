/**
 * Comando: trumptweet
 * Gera um tweet falso do Trump com o texto informado.
 * Salve em: src/commands/canvas/trumptweet.js
 */
import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { getBuffer } from "../../../utils/index.js";

export default {
  name: "opinião",
  description: "Gera uma montagem com o texto informado!",
  commands: ["opinião", "changemymind", "mudeminhaopniao", "opiniao"],
  usage: `${PREFIX}opinião Seu texto aqui`,

  handle: async ({
    sendReply,
    fullArgs,
    remoteJid,
    socket,
    webMessage,
  }) => {
    if (!fullArgs.trim()) {
      throw new InvalidParameterError(
        `Cadê o texto?\n\nExemplo: *${PREFIX}opniao A vida*`
      );
    }

    if (fullArgs.trim().length > 280) {
      throw new InvalidParameterError(
        "O texto é muito longo! Máximo de *280 caracteres*."
      );
    }

    await sendReply("▧⃯⃟𝙶𝚎𝚛𝚊𝚗𝚍𝚘 opiniãoฺ͘.•🔥 ݈݇─");

    const texto = encodeURIComponent(fullArgs.trim());
    const url   = `https://nekobot.xyz/api/imagegen?type=changemymind&text=${texto}`;

    const res  = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const data = await res.json();

    if (!data.success || !data.message) {
      throw new Error("A API não retornou a imagem. Tente novamente!");
    }

    const imageBuffer = await getBuffer(data.message);

    await socket.sendMessage(
      remoteJid,
      { image: imageBuffer },
      { quoted: webMessage }
    );
  },
};
