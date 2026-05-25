/**
 * Casal do dia — sorteia casal aleatório do grupo
 */
import { PREFIX } from "../../../config.js";

export default {
  name: "casal",
  description: "Sorteia o casal do dia no grupo.",
  commands: ["casal", "casaldodia"],
  usage: `${PREFIX}casal`,
  handle: async ({ sendReply, isGroup, sendWarningReply, socket, remoteJid }) => {
    if (!isGroup) return sendWarningReply("Apenas em grupos!");
    const meta    = await socket.groupMetadata(remoteJid);
    const members = meta.participants.map(p => p.id).filter(id => id);
    if (members.length < 2) return sendWarningReply("Precisa de pelo menos 2 membros!");
    const shuffled = [...members].sort(() => Math.random() - 0.5);
    const [p1, p2] = shuffled;
    await sendReply(
      `💑 *CASAL DO DIA*\n\n❤️ @${p1.split("@")[0]} + @${p2.split("@")[0]}\n\n_O amor está no ar!_ 💕`,
      [p1, p2]
    );
  },
};
