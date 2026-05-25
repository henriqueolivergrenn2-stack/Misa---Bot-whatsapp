import { PREFIX } from "../../../config.js";
import { fmt, getPlayer, removeGold, save } from "../../../utils/economy.js";

export default {
  name: "depositar",
  description: "Deposite gold no banco (protegido de roubo).",
  commands: ["depositar", "dep"],
  usage: `${PREFIX}depositar <valor|tudo>`,
  handle: async ({ sendReply, sendErrorReply, sendWarningReply, userLid, webMessage, fullArgs }) => {
    const p = getPlayer(userLid, webMessage?.pushName);
    const input = fullArgs?.trim().toLowerCase();
    const amount = input === "tudo" ? p.gold : Number(input);

    if (!amount || amount <= 0)
      return sendWarningReply("Uso: *" + PREFIX + "depositar <valor>* ou *tudo*");
    if (p.gold < amount)
      return sendErrorReply("Gold insuficiente. Bolso: *" + fmt(p.gold) + " 🪙*");

    removeGold(userLid, amount);
    p.bank += amount;
    save();

    await sendReply(
      "🏦 *DEPOSITO REALIZADO*\n\n" +
      "💰 Depositado: *" + fmt(amount) + " 🪙*\n" +
      "🏦 Banco: *" + fmt(p.bank) + " 🪙*\n" +
      "💼 Bolso: *" + fmt(p.gold) + " 🪙*"
    );
  },
};
