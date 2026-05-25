import { PREFIX } from "../../../config.js";
import { addGold, fmt, fmtTime, getCd, getPlayer, getNow, hasItem, rand, save } from "../../../utils/economy.js";

const PEDRAS = [
  { name: "Carvao",   emoji: "🪨", mult: 1.0, chance: 50 },
  { name: "Ferro",    emoji: "🔩", mult: 1.2, chance: 25 },
  { name: "Ouro",     emoji: "🟡", mult: 1.5, chance: 15 },
  { name: "Rubi",     emoji: "💎", mult: 2.0, chance:  7 },
  { name: "Diamante", emoji: "💠", mult: 3.0, chance:  3 },
];

export default {
  name: "mine",
  description: "Minere pedras e ganhe gold a cada hora.",
  commands: ["mine", "minar", "minerar"],
  usage: `${PREFIX}mine`,
  handle: async ({ sendReply, sendWarningReply, sendSuccessReact, userLid, webMessage }) => {
    const p = getPlayer(userLid, webMessage?.pushName);
    const wait = getCd(p.cooldowns.mine, 3_600_000);
    if (wait > 0) return sendWarningReply("⏳ Aguarde *" + fmtTime(wait) + "* para minerar novamente.");

    p.cooldowns.mine = getNow();

    const total = PEDRAS.reduce((a, b) => a + b.chance, 0);
    let r = rand(1, total);
    let pedra = PEDRAS[0];
    let acc = 0;
    for (let i = 0; i < PEDRAS.length; i++) {
      acc += PEDRAS[i].chance;
      if (r <= acc) { pedra = PEDRAS[i]; break; }
    }

    let amount = Math.floor(rand(120, 350) * pedra.mult);
    if (hasItem(userLid, "picareta")) amount = Math.floor(amount * 1.5);
    if (hasItem(userLid, "vip")) amount = Math.floor(amount * 1.15);

    addGold(userLid, amount);
    p.stats.mined++;
    save();
    await sendSuccessReact();
    await sendReply(
      "⛏️ *MINERACAO*\n\n" +
      "Voce minerou *" + pedra.emoji + " " + pedra.name + "*!\n" +
      "Ganhou *+" + fmt(amount) + " 🪙*\n\n" +
      "💰 Bolso: *" + fmt(p.gold) + " 🪙*\n" +
      "_Proxima mineracao em 1 hora._"
    );
  },
};
