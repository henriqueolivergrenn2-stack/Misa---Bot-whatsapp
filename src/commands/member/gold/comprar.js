import { PREFIX } from "../../../config.js";
import { buyItem, fmt, getPlayer } from "../../../utils/economy.js";

export default {
  name: "comprar",
  description: "Compre um item da loja.",
  commands: ["comprar", "buy"],
  usage: `${PREFIX}comprar <item>`,
  handle: async ({ sendReply, sendErrorReply, sendWarningReply, sendSuccessReact, userLid, webMessage, args }) => {
    getPlayer(userLid, webMessage?.pushName);

    if (!args[0])
      return sendWarningReply("Uso: *" + PREFIX + "comprar <item>*\nVeja a loja: *" + PREFIX + "loja*");

    const result = buyItem(userLid, args[0].toLowerCase());
    if (result.error) return sendErrorReply(result.error);

    await sendSuccessReact();
    const p = getPlayer(userLid);
    await sendReply(
      "✅ Voce comprou *" + result.item.emoji + " " + result.item.name + "*!\n" +
      "💰 Bolso restante: *" + fmt(p.gold) + " 🪙*"
    );
  },
};
