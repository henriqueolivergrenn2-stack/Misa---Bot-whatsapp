/**
 * Comando: predador
 * Gera um edit estilizado com o texto informado usando a API Sirv.
 */
import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { getBuffer } from "../../../utils/index.js";

export default {
  name: "aranha",
  description: "Gera um edit estilizado de Predador com o texto informado!",
  commands: ["aranha"],
  usage: `${PREFIX}aranha SeuTexto`,

  handle: async ({
    sendReply,
    fullArgs,
    remoteJid,
    socket,
    webMessage,
  }) => {
    if (!fullArgs.trim()) {
      throw new InvalidParameterError(
        `Cadê o texto?\n\nExemplo: *${PREFIX}aranha Takeshi*`
      );
    }

    if (fullArgs.trim().length > 20) {
      throw new InvalidParameterError(
        "O texto é muito longo! Máximo de *20 caracteres*."
      );
    }

    await sendReply("▧⃯⃟𝙶𝚎𝚛𝚊𝚗𝚍𝚘 𝚂𝚎𝚞 𝙴𝚍𝚒𝚝ฺ͘.•🕷️ ݈݇─");

    const texto = encodeURIComponent(fullArgs.trim());

    const url =
      `https://takeshi-bot-01.sirv.com/20260522_081304.jpg` +
      `?text.0.text=${texto}` +
      `&text.0.position.gravity=south` +
      `&text.0.size=50` +
      `&text.0.color=ffffff` +
      `&text.0.font.family=Creepster` +
      `&text.0.background.opacity=0` +
      `&text.0.position.y=-540`;

    const imageBuffer = await getBuffer(url);

    await socket.sendMessage(
      remoteJid,
      { image: imageBuffer },
      { quoted: webMessage }
    );
  },
};
