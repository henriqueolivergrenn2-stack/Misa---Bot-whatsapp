/**
 * Comando: rank / maisativos / ativos
 * Exibe o rank dos membros mais ativos do grupo.
 */
import { PREFIX } from "../../config.js";
import { WarningError } from "../../errors/index.js";
import { getGroupRank } from "../../utils/activityTracker.js";
import { onlyNumbers } from "../../utils/index.js";

const MEDALS = ["🥇", "🥈", "🥉"];

export default {
  name: "rank",
  description: "Exibe o rank dos membros mais ativos do grupo!",
  commands: ["rank", "maisativos", "ativos"],
  usage: `${PREFIX}rank`,

  handle: async ({
    sendReply,
    sendSuccessReact,
    isGroup,
    remoteJid,
    socket,
  }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só pode ser usado em grupos!");
    }

    const rank = getGroupRank(remoteJid, 10);

    if (!rank.length) {
      await sendReply(
        "Ainda não há dados de atividade neste grupo!\n\nAs estatísticas começam a ser registradas a partir de agora. 📊"
      );
      return;
    }

    const metadata = await socket.groupMetadata(remoteJid);
    const groupName = metadata?.subject || "do grupo";

    const mentions = [];
    const lines = rank.map((user, i) => {
      const medal = MEDALS[i] || `*${i + 1}º*`;
      mentions.push(user.id);

      return (
        `${medal} @${onlyNumbers(user.id)}\n` +
        `   💬 Mensagens: *${user.messages}*\n` +
        `   ⚙️ Comandos: *${user.commands}*\n` +
        `   🎭 Stickers: *${user.stickers}*\n` +
        `   📊 Total: *${user.total}*`
      );
    });

    const text =
      `🏆 *Rank dos mais ativos — ${groupName}*\n\n` +
      lines.join("\n\n");

    await sendSuccessReact();

    await socket.sendMessage(remoteJid, { text, mentions });
  },
};