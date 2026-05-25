import { PREFIX } from "../../../config.js";
import { fmt, getDb, getPlayer } from "../../../utils/economy.js";

export default {
  name: "rankgold",
  description: "Veja o ranking de gold do servidor.",
  commands: ["rankgold", "topgold", "ranking"],
  usage: `${PREFIX}rankgold`,
  handle: async ({ sendReply, userLid, webMessage }) => {
    getPlayer(userLid, webMessage?.pushName);

    const todos = Object.values(getDb().players).sort(
      (a, b) => b.gold + b.bank - (a.gold + a.bank)
    );

    const top10 = todos.slice(0, 10);
    const medals = ["🥇", "🥈", "🥉"];
    const myPos = todos.findIndex((p) => p.id === userLid) + 1;

    const linhas = top10.map((p, i) => {
      const pos = medals[i] || (i + 1) + ".";
      return pos + " *" + p.name + "* — " + fmt(p.gold + p.bank) + " 🪙 (Lv " + p.level + ")";
    });

    await sendReply(
      "🏆 *TOP 10 — RANKING DE GOLD*\n\n" +
      linhas.join("\n") +
      "\n\n📍 Sua posicao: *#" + myPos + "*"
    );
  },
};
