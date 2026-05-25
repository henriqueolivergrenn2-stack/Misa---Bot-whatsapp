import { PREFIX } from "../../../config.js";
import { addGold, fmt, fmtTime, getCd, getPlayer, getNow, hasItem, rand, removeGold, save } from "../../../utils/economy.js";

export default {
  name: "roubar",
  description: "Tente roubar gold de outro jogador.",
  commands: ["roubar"],
  usage: `${PREFIX}roubar @pessoa`,
  handle: async ({ sendReply, sendErrorReply, sendWarningReply, userLid, webMessage }) => {
    const p = getPlayer(userLid, webMessage?.pushName);
    const wait = getCd(p.cooldowns.steal, 7_200_000);
    if (wait > 0) return sendWarningReply("⏳ Aguarde *" + fmtTime(wait) + "* para tentar roubar.");

    const mentioned =
      webMessage?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length)
      return sendWarningReply("Marque alguem!\nUso: *" + PREFIX + "roubar @pessoa*");

    const targetId = mentioned[0];
    if (targetId === userLid) return sendWarningReply("Voce nao pode roubar a si mesmo!");

    const victim = getPlayer(targetId);
    p.cooldowns.steal = getNow();

    let chance = hasItem(userLid, "vip") ? 0.68 : 0.55;
    if (hasItem(targetId, "colete")) chance -= 0.30;

    if (Math.random() > chance) {
      const multa = rand(100, 500);
      removeGold(userLid, multa);
      save();
      return sendErrorReply(
        "🚔 *ROUBO FALHOU!*\n\n" +
        "*" + victim.name + "* te viu!\n" +
        "Multa: *-" + fmt(multa) + " 🪙*\n\n" +
        "💰 Bolso: *" + fmt(p.gold) + " 🪙*"
      );
    }

    if (victim.gold <= 0) return sendErrorReply("😅 *" + victim.name + "* esta liso!");

    const amount = Math.floor(victim.gold * 0.25);
    removeGold(targetId, amount);
    addGold(userLid, amount);
    p.stats.steals++;
    save();
    return sendReply(
      "🗡️ *ROUBO BEM-SUCEDIDO!*\n\n" +
      "Voce roubou *" + fmt(amount) + " 🪙* de *" + victim.name + "*!\n\n" +
      "💰 Bolso: *" + fmt(p.gold) + " 🪙*"
    );
  },
};
