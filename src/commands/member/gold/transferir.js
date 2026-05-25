import { PREFIX } from "../../../config.js";
import { addGold, fmt, getPlayer, removeGold } from "../../../utils/economy.js";

export default {
  name: "transferir",
  description: "Transfira gold para outro jogador.",
  commands: ["transferir", "pagar", "pay"],
  usage: `${PREFIX}transferir @pessoa <valor>`,
  handle: async ({ sendReply, sendErrorReply, sendWarningReply, userLid, webMessage, args }) => {
    const p = getPlayer(userLid, webMessage?.pushName);
    const mentioned =
      webMessage?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const amount = Number(args.find((a) => !isNaN(Number(a)) && Number(a) > 0));

    if (!mentioned.length || !amount || amount <= 0)
      return sendWarningReply("Uso: *" + PREFIX + "transferir @pessoa <valor>*");
    if (mentioned[0] === userLid)
      return sendWarningReply("Voce nao pode transferir para si mesmo!");
    if (p.gold < amount)
      return sendErrorReply("Gold insuficiente. Bolso: *" + fmt(p.gold) + " 🪙*");

    const target = getPlayer(mentioned[0]);
    removeGold(userLid, amount);
    addGold(mentioned[0], amount);

    await sendReply(
      "💸 *TRANSFERENCIA REALIZADA!*\n\n" +
      "*" + p.name + "* → *" + target.name + "*\n" +
      "Valor: *" + fmt(amount) + " 🪙*\n\n" +
      "💰 Seu bolso: *" + fmt(p.gold) + " 🪙*"
    );
  },
};
