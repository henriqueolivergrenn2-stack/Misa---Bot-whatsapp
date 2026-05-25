/**
 * Comando: anime2
 * Gera uma logo estilizada com tema dark usando imagem do Sirv.
 */
import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { getBuffer } from "../../../utils/index.js";

export default {
  name: "anime2",
  description: "Gera uma logo dark estilizada com o texto informado!",
  commands: ["anime2"],
  usage: `${PREFIX}anime2 SeuTexto`,

  handle: async ({
    sendReply,
    fullArgs,
    remoteJid,
    socket,
    webMessage,
  }) => {
    if (!fullArgs.trim()) {
      throw new InvalidParameterError(
        `Cadê o texto?\n\nExemplo: *${PREFIX}anime2 Takeshi*`
      );
    }

    if (fullArgs.trim().length > 15) {
      throw new InvalidParameterError(
        "O texto é muito longo! Máximo de *15 caracteres*."
      );
    }

    await sendReply("▧⃯⃟𝙶𝚎𝚛𝚊𝚗𝚍𝚘 𝚂𝚞𝚊 𝙻𝚘𝚐𝚘ฺ͘.•🌑 ݈݇─");

    const texto = encodeURIComponent(fullArgs.trim());

    const url =
      `https://takeshi-bot-01.sirv.com/Images/images.jpeg` +
      `?text.0.text=${texto}` +
      `&text.0.position.gravity=center` +
      `&text.0.position.x=0%25` +
      `&text.0.position.y=-36%25` +
      `&text.0.size=60` +
      `&text.0.color=b0c4de` +
      `&text.0.opacity=95` +
      `&text.0.font.family=Bangers` +
      `&text.0.outline.color=000000` +
      `&text.0.outline.width=4` +
      `&text.0.outline.blur=0` +
      `&text.0.background.color=000000` +
      `&text.0.background.opacity=30`;

    const imageBuffer = await getBuffer(url);

    await socket.sendMessage(
      remoteJid,
      { image: imageBuffer },
      { quoted: webMessage }
    );
  },
};