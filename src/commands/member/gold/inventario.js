import { PREFIX } from "../../../config.js";
import { getPlayer, ITEMS } from "../../../utils/economy.js";

export default {
  name: "inventario",
  description: "Veja seus itens.",
  commands: ["inventario", "inv"],
  usage: `${PREFIX}inventario`,
  handle: async ({ sendReply, userLid, webMessage }) => {
    const p = getPlayer(userLid, webMessage?.pushName);

    if (!p.inventory.length)
      return sendReply("🎒 Seu inventario esta vazio.\nVeja a loja: *" + PREFIX + "loja*");

    const linhas = p.inventory.map((k) => {
      const it = ITEMS[k];
      return it
        ? it.emoji + " *" + it.name + "* — _" + it.desc + "_"
        : "• " + k;
    });

    await sendReply("🎒 *INVENTARIO — " + p.name + "*\n\n" + linhas.join("\n"));
  },
};
