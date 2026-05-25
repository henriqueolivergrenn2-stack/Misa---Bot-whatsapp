import { PREFIX } from "../../../config.js";
import { fmt, getPlayer, xpBar, ITEMS } from "../../../utils/economy.js";

export default {
  name: "saldo",
  description: "Veja seu saldo, nivel e inventario.",
  commands: ["saldo", "carteira", "wallet"],
  usage: `${PREFIX}saldo`,
  handle: async ({ sendReply, userLid, webMessage }) => {
    const p = getPlayer(userLid, webMessage?.pushName);
    const bar = xpBar(p.xp, p.level);
    const inv = p.inventory.length
      ? p.inventory.map((k) => (ITEMS[k]?.emoji ?? k)).join(" ")
      : "Vazio";
    const s = p.stats;
    const msg =
      "👤 *" + p.name + "*\n\n" +
      "💰 Bolso: *" + fmt(p.gold) + " 🪙*\n" +
      "🏦 Banco: *" + fmt(p.bank) + " 🪙*\n" +
      "📊 Total: *" + fmt(p.gold + p.bank) + " 🪙*\n\n" +
      "⭐ Nivel *" + p.level + "*\n" + bar + "\n" +
      "🔥 Streak: *" + (p.streak || 0) + " dia(s)*\n\n" +
      "🎒 Inventario: " + inv + "\n\n" +
      "📈 *Estatisticas*\n" +
      "⛏️ Mineracoes: " + s.mined + "  🎣 Pescarias: " + (s.fished || 0) + "\n" +
      "🏹 Cacadas: " + (s.hunted || 0) + "  💼 Trabalhos: " + s.worked + "\n" +
      "🔫 Crimes: " + (s.crimes || 0) + "  🗡️ Roubos: " + s.steals + "\n" +
      "🎰 Apostas: " + (s.gambled || 0);
    await sendReply(msg);
  },
};
