import path from "node:path";
import fs from "node:fs";
import { ASSETS_DIR, PREFIX } from "../../../config.js";

// ╔══════════════════════════════════════════════╗
// ║  QUER USAR MP4 (GIF animado)?               ║
// ║  1. Troque "rankbct.jpg" por "rankbct.mp4"  ║
// ║  2. Troque `image` por `video`              ║
// ║  3. Adicione `gifPlayback: true`            ║
// ╚══════════════════════════════════════════════╝
const IMAGE_PATH = path.resolve(ASSETS_DIR, "images", "funny", "rankbct.mp4");

export default {
  name: "rankbct",
  description: "Mostra um rank aleatório de membros do grupo.",
  commands: ["rankbct", "rankbuceta", "rankxrc", "rankxereca"],
  usage: `${PREFIX}rankbct`,

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

    await sendReact("😏");

    const metadata = await socket.groupMetadata(remoteJid);
    const members = metadata?.participants || [];

    if (!members.length) {
      await sendErrorReply("Não foi possível obter os membros do grupo!");
      return;
    }

    const shuffled = [...members].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, Math.min(5, shuffled.length));
    const mentions = chosen.map((m) => m.id);
    const lines = chosen.map((m) => `😏⧽ @${m.id.split("@")[0]}`).join("\n");
    const caption = `*ESSAS SÃO AS MAIS BUCETUDAS DO GRUPO*\n${lines}`;

    await socket.sendMessage(
      remoteJid,
      {
        // image: fs.readFileSync(IMAGE_PATH), 
 // MP4: troque por 
       video: fs.readFileSync(IMAGE_PATH), 
       gifPlayback: true,
        caption,
        mentions,
      },
      { quoted: webMessage }
    );
  },
};
