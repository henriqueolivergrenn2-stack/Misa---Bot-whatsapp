import { PREFIX } from "../../../config.js";
import { addGold, fmt, getPlayer, rand, removeGold, save } from "../../../utils/economy.js";

const SYMBOLS = ["💎", "🔥", "⭐", "🍒", "🍋", "🎰", "🌸", "⚡"];

export default {
  name: "slot",
  description: "Jogue no caca-niqueis e tente a sorte!",
  commands: ["slot"],
  usage: `${PREFIX}slot <valor>`,
  handle: async ({ sendReply, sendErrorReply, sendWarningReply, userLid, webMessage, args }) => {
    const p = getPlayer(userLid, webMessage?.pushName);
    const amount = Number(args[0]);
    if (!amount || amount < 10)
      return sendWarningReply("Aposta minima de 10 🪙.\nUso: *" + PREFIX + "slot <valor>*");
    if (p.gold < amount)
      return sendErrorReply("Gold insuficiente. Bolso: *" + fmt(p.gold) + " 🪙*");

    removeGold(userLid, amount);
    p.stats.gambled = (p.stats.gambled || 0) + 1;

    const a = SYMBOLS[rand(0, 7)];
    const b = SYMBOLS[rand(0, 7)];
    const c = SYMBOLS[rand(0, 7)];

    let multi = 0;
    let msg = "❌ Sem premio";

    if (a === b && b === c) {
      if (a === "💎") { multi = 15; msg = "💎 JACKPOT SUPREMO!"; }
      else if (a === "🔥") { multi = 10; msg = "🔥 JACKPOT!"; }
      else { multi = 5; msg = "🎉 JACKPOT!"; }
    } else if (a === b || b === c || a === c) {
      multi = 2;
      msg = "✨ Par!";
    }

    const reward = amount * multi;
    if (reward > 0) addGold(userLid, reward);
    save();

    await sendReply(
      "🎰 *CACA-NIQUEIS*\n\n" +
      "┌───────────────┐\n" +
      "│   " + a + "  " + b + "  " + c + "   │\n" +
      "└───────────────┘\n\n" +
      msg + "\n" +
      "✖️ " + multi + "x = *" + fmt(reward) + " 🪙*\n" +
      "Apostou: *" + fmt(amount) + " 🪙*\n\n" +
      "💰 Bolso: *" + fmt(p.gold) + " 🪙*"
    );
  },
};
