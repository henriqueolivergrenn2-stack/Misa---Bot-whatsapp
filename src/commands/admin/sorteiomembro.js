/**
 * Admin: sorteiomembro — sorteia membro do grupo para evento/sorteio
 */
import { PREFIX } from "../../config.js";

export default {
  name: "sorteiomembro",
  description: "Sorteia um membro aleatório do grupo. (Admin)",
  commands: ["sorteiomembro", "sortearmembro"],
  usage: `${PREFIX}sorteiomembro`,
  handle: async ({ isGroup, sendWarningReply, sendReply, sendReact, socket, remoteJid }) => {
    if (!isGroup) return sendWarningReply("Apenas em grupos!");
    await sendReact("🎰");
    const meta    = await socket.groupMetadata(remoteJid);
    const members = meta.participants.filter(p => !p.admin);
    if (!members.length) return sendWarningReply("Nenhum membro não-admin encontrado!");
    const sorteado = members[Math.floor(Math.random() * members.length)];
    await sendReply(
      `🎰 *MEMBRO SORTEADO*\n\n🏆 @${sorteado.id.split("@")[0]}`,
      [sorteado.id]
    );
  },
};
