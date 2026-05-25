import { PREFIX } from "../../../config.js";
import { addGold, fmt, getPlayer, save } from "../../../utils/economy.js";

export default {
  name: "sacar",
  description: "Saque gold do banco.",
  commands: ["sacar", "withdraw"],
  usage: `${PREFIX}sacar <valor|tudo>`,
  handle: async ({ sendReply, sendErrorReply, sendWarningReply, userLid, webMessage, fullArgs }) => {
    const p = getPlayer(userLid, webMessage?.pushName);
    const input = fullArgs?.trim().toLowerCase();
    const amount = input === "tudo" ? p.bank : Number(input);

    if (!amount || amount <= 0)
      return sendWarningReply("Uso: *" + PREFIX + "sacar <valor>* ou *tudo*");
    if (p.bank < amount)
      return sendErrorReply("Saldo bancario insuficiente. Banco: *" + fmt(p.bank) + " 🪙*");

    p.bank -= amount;
    addGold(userLid, amount);
    save();

    await sendReply(
      "🏦 *SAQUE REALIZADO*\n\n" +
      "💵 Sacado: *" + fmt(amount) + " 🪙*\n" +
      "💰 Bolso: *" + fmt(p.gold) + " 🪙*\n" +
      "🏦 Banco: *" + fmt(p.bank) + " 🪙*"
    );
  },
};
