import { PREFIX } from "../../../config.js";
import { addGold, fmt, fmtTime, getCd, getPlayer, getNow, hasItem, rand, save } from "../../../utils/economy.js";

export default {
  name: "daily",
  description: "Resgate seu premio diario com streak.",
  commands: ["daily", "diario"],
  usage: `${PREFIX}daily`,
  handle: async ({ sendReply, sendWarningReply, sendSuccessReact, userLid, webMessage }) => {
    const p = getPlayer(userLid, webMessage?.pushName);
    const wait = getCd(p.cooldowns.daily, 86_400_000);
    if (wait > 0) return sendWarningReply("⏳ Volte em *" + fmtTime(wait) + "* para o daily.");

    const todayStr = new Date().toDateString();
    const yestStr = new Date(Date.now() - 86_400_000).toDateString();
    p.streak = p.lastDailyDate === yestStr ? (p.streak || 0) + 1 : 1;
    p.lastDailyDate = todayStr;
    p.cooldowns.daily = getNow();

    const streakBonus = Math.min(p.streak * 60, 600);
    let amount = rand(600, 1_400) + streakBonus;
    if (hasItem(userLid, "lucky")) amount = Math.floor(amount * 1.2);
    if (hasItem(userLid, "vip")) amount = Math.floor(amount * 1.15);

    addGold(userLid, amount);
    save();
    await sendSuccessReact();
    await sendReply(
      "🎁 *DAILY RESGATADO!*\n\n" +
      "+*" + fmt(amount) + " 🪙*\n" +
      "🔥 Streak: *" + p.streak + " dia" + (p.streak > 1 ? "s" : "") + "* (+" + fmt(streakBonus) + " bonus)\n\n" +
      "💰 Bolso: *" + fmt(p.gold) + " 🪙*\n\n" +
      "_Volte amanha para manter o streak!_"
    );
  },
};
