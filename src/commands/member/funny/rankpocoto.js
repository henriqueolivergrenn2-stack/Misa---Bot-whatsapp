import path from "node:path";
import fs from "node:fs";
import { ASSETS_DIR, PREFIX } from "../../../config.js";

const GIF_PATH = path.resolve(ASSETS_DIR, "images", "funny", "rankpocoto.mp4");

export default {
  name: "rankpocoto",
  description: "Mostra um rank aleatório de membros do grupo.",
  commands: ["rankpocoto"],
  usage: `${PREFIX}rankpocoto`,

  handle: async ({
    sendReact,
    sendErrorReply,
    remoteJid,
    socket,
    webMessage,
    isGroup,
  }) => {
    if (!isGroup) {
      await sendErrorReply("Este comando só pode ser usado em grupos!");
      return;
    }

    await sendReact("🐴");

    // Busca metadata direto pelo socket
    const metadata = await socket.groupMetadata(remoteJid);
    const members = metadata?.participants || [];

    if (!members.length) {
      await sendErrorReply("Não foi possível obter os membros do grupo!");
      return;
    }

    const shuffled = [...members].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, Math.min(5, shuffled.length));
    const mentions = chosen.map((m) => m.id);
    const lines = chosen.map((m) => `🐴⧽ @${m.id.split("@")[0]}`).join("\n");
    const caption = `*ESSES SÃO OS MAIS POCOTO DO GRUPO*\n${lines}`;

    await socket.sendMessage(
      remoteJid,
      {
        video: fs.readFileSync(GIF_PATH),
        gifPlayback: true,
        caption,
        mentions,
      },
      { quoted: webMessage }
    );
  },
};
