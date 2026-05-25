import { PREFIX } from "../../../config.js";
import { fmt, getPlayer, hasItem, ITEMS } from "../../../utils/economy.js";

export default {
  name: "loja",
  description: "Veja a loja de itens do bot.",
  commands: ["loja", "store"],
  usage: `${PREFIX}loja`,
  handle: async ({ sendReply, userLid, webMessage }) => {
    getPlayer(userLid, webMessage?.pushName);

    const linhas = Object.entries(ITEMS).map(([key, item]) => {
      const owned = hasItem(userLid, key) ? " ✅ *POSSUIDO*" : "";
      return (
        item.emoji + " *" + item.name + "*" + owned + "\n" +
        "💰 " + fmt(item.price) + " 🪙 — _" + item.desc + "_\n" +
        "🛒 *" + PREFIX + "comprar " + key + "*"
      );
    });

    await sendReply(
      "🏪 *LOJA DE ITENS*\n\n" +
      linhas.join("\n\n") +
      "\n\n_Use " + PREFIX + "comprar <item> para comprar!_"
    );
  },
};
