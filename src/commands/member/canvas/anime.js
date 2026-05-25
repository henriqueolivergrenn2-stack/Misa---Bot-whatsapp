/**
 * Comando: anime
 * Gera uma logo estilizada com o texto informado usando a API Sirv.
 * 
 * 💡 Para criar suas próprias logos personalizadas:
 * Acesse: https://sirv.com
 * Você pode hospedar imagens lá e usar parâmetros de texto via URL,
 * como font, color, position, size, opacity, outline, etc.
 * Documentação: https://sirv.com/help/articles/dynamic-imaging/
 */
import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { getBuffer } from "../../../utils/index.js";

export default {
  name: "anime",
  description: "Gera uma logo estilizada com o texto informado!",
  commands: ["anime"],
  usage: `${PREFIX}anime2 SeuTexto`,

  handle: async ({
    sendReply,
    sendReact,
    fullArgs,
    remoteJid,
    socket,
    webMessage,
  }) => {
    if (!fullArgs.trim()) {
      throw new InvalidParameterError(
        `Cadê o texto?\n\nExemplo: *${PREFIX}anime Takeshi*`
      );
    }

    if (fullArgs.trim().length > 15) {
      throw new InvalidParameterError(
        "O texto é muito longo! Máximo de *15 caracteres*."
      );
    }

    await sendReply("▧⃯⃟𝙶𝚎𝚛𝚊𝚗𝚍𝚘 𝚂𝚞𝚊 𝙻𝚘𝚐𝚘ฺ͘.•🛸 ݈݇─");

    const texto = encodeURIComponent(fullArgs.trim());

    const url = `https://lollityp.sirv.com/venom_apis7.jpg?text.0.text=${texto}&text.0.position.gravity=north&text.0.position.x=1%25&text.0.position.y=58%25&text.0.size=69&text.0.color=00ffea&text.0.opacity=37&text.0.font.family=Bangers&text.0.background.opacity=77&text.0.outline.color=ffffff&text.0.outline.width=2&text.0.outline.blur=20`;

    const imageBuffer = await getBuffer(url);

    await socket.sendMessage(
      remoteJid,
      { image: imageBuffer },
      { quoted: webMessage }
    );
  },
};