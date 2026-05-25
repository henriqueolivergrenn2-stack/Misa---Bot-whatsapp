/**
 * Comando: linkimg
 * Envia uma imagem a partir de um link URL.
 */
import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";

export default {
  name: "linkimg",
  description: "Envia uma imagem a partir de um link!",
  commands: ["linkimg"],
  usage: `${PREFIX}linkimg <url da imagem>`,

  handle: async ({
    sendReply,
    sendReact,
    fullArgs,
    userLid,
    remoteJid,
    socket,
    webMessage,
  }) => {
    if (!fullArgs.trim()) {
      throw new InvalidParameterError(
        `Cadê o link fi?\n\nExemplo: *${PREFIX}linkimg https://site.com/imagem.jpg*`
      );
    }

    await sendReact("📷");

    try {
      const userNumber = userLid.split("@")[0].replace(/[^0-9]/g, "");

      await socket.sendMessage(remoteJid, {
        image: { url: fullArgs.trim() },
        caption: `@${userNumber} \`\`aqui está\`\`\` ✅`,
        mentions: [webMessage?.key?.participant || remoteJid],
      });
    } catch {
      await sendReply("Não consegui carregar o link... Verifique se a URL é válida!");
    }
  },
};