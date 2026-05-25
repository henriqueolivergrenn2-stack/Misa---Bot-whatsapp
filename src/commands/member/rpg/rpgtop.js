/**
 * RPG — Ranking / Top
 * src/commands/member/rpg/rpgtop.js
 *
 * Uso: .rpgtop
 */
import { PREFIX } from "../../../config.js";
import { getDb } from "../../../utils/economy.js";
import { CLASSES } from "./_rpgData.js";

export default {
  name: "rpgtop",
  description: "Veja o ranking dos maiores aventureiros do servidor!",
  commands: ["rpgtop", "rpgranking"],
  usage: `${PREFIX}rpgtop`,

  handle: async ({ sendReply, sendWarningReply, userLid, webMessage }) => {
    const pName = webMessage?.pushName || "Aventureiro";

    const todos = Object.entries(getDb().players)
      .filter(([, p]) => p.rpg)
      .map(([lid, p]) => ({ lid, ...p }))
      .sort((a, b) =>
        b.rpg.level !== a.rpg.level
          ? b.rpg.level - a.rpg.level
          : b.rpg.vitorias - a.rpg.vitorias
      )
      .slice(0, 10);

    if (!todos.length) {
      return sendReply(`Nenhum aventureiro cadastrado ainda!\nCrie seu personagem: *${PREFIX}rpgcriar <nome> <classe>*`);
    }

    const medals = ["🥇", "🥈", "🥉"];
    const linhas = todos.map((p, i) => {
      const c    = CLASSES[p.rpg.classe];
      const mark = p.lid === userLid ? " ◀ *você*" : "";
      return (
        `${medals[i] ?? `${i + 1}.`} *${p.rpg.nome}* ${c.emoji} Lv${p.rpg.level}${mark}\n` +
        `   ${p.rpg.vitorias}V / ${p.rpg.derrotas}D — ${p.name || "?"}`
      );
    });

    return sendReply(
      `🏆 *RANKING RPG — TOP ${todos.length}*\n\n` +
      linhas.join("\n\n")
    );
  },
};
