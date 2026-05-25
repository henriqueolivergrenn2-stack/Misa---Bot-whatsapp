import { PREFIX } from "../../../config.js";
import { addGold, fmt, getPlayer, removeGold, save } from "../../../utils/economy.js";

export default {
  name: "coinflip",
  description: "Aposte gold em cara ou coroa.",
  commands: ["coinflip", "flip"],
  usage: `${PREFIX}coinflip cara 500`,
  handle: async ({ sendReply, sendErrorReply, sendWarningReply, userLid, webMessage, args }) => {
    const p = getPlayer(userLid, webMessage?.pushName);
    const side = (args[0] || "").toLowerCase();
    const amount = Number(args[1]);

    if (!["cara", "coroa"].includes(side) || !amount || amount < 10)
      return sendWarningReply("Uso: *" + PREFIX + "coinflip cara|coroa <valor>*");
    if (p.gold < amount)
      return sendErrorReply("Gold insuficiente. Bolso: *" + fmt(p.gold) + " 🪙*");

    const result = Math.random() < 0.5 ? "cara" : "coroa";
    const emoji = result === "cara" ? "👤" : "👑";
    p.stats.gambled = (p.stats.gambled || 0) + 1;

    if (side === result) {
      addGold(userLid, amount);
      save();
      return sendReply(
        "🪙 *COINFLIP — " + emoji + " " + result.toUpperCase() + "*\n\n" +
        "✅ Acertou! *+" + fmt(amount) + " 🪙*\n" +
        "💰 Bolso: *" + fmt(p.gold) + " 🪙*"
      );
    }

    removeGold(userLid, amount);
    save();
    return sendErrorReply(
      "🪙 *COINFLIP — " + emoji + " " + result.toUpperCase() + "*\n\n" +
      "❌ Errou! *-" + fmt(amount) + " 🪙*\n" +
      "💰 Bolso: *" + fmt(p.gold) + " 🪙*"
    );
  },
};
