import { PREFIX } from "../../../config.js";
import { addGold, fmt, fmtTime, getCd, getPlayer, getNow, hasItem, rand, save } from "../../../utils/economy.js";

const PEIXES = [
  { name: "Peixinho",    emoji: "🐟", mult: 1.0, chance: 40 },
  { name: "Sardinha",    emoji: "🐠", mult: 1.2, chance: 25 },
  { name: "Truta",       emoji: "🎣", mult: 1.5, chance: 15 },
  { name: "Atum",        emoji: "🐡", mult: 2.0, chance: 10 },
  { name: "Tubarao",     emoji: "🦈", mult: 3.5, chance:  7 },
  { name: "Baleia Rara", emoji: "🐋", mult: 6.0, chance:  3 },
];

export default {
  name: "fish",
  description: "Pesque e ganhe gold a cada 45 minutos.",
  commands: ["fish", "pescar", "pesca"],
  usage: `${PREFIX}fish`,
  handle: async ({ sendReply, sendWarningReply, sendSuccessReact, userLid, webMessage }) => {
    const p = getPlayer(userLid, webMessage?.pushName);
    const wait = getCd(p.cooldowns.fish, 2_700_000);
    if (wait > 0) return sendWarningReply("⏳ Aguarde *" + fmtTime(wait) + "* para pescar novamente.");

    p.cooldowns.fish = getNow();

    const total = PEIXES.reduce((a, f) => a + f.chance, 0);
    let r = rand(1, total);
    let peixe = PEIXES[0];
    let acc = 0;
    for (const f of PEIXES) {
      acc += f.chance;
      if (r <= acc) { peixe = f; break; }
    }

    let amount = Math.floor(rand(100, 300) * peixe.mult);
    if (hasItem(userLid, "anzol")) amount = Math.floor(amount * 1.4);
    if (hasItem(userLid, "vip")) amount = Math.floor(amount * 1.15);

    addGold(userLid, amount);
    p.stats.fished = (p.stats.fished || 0) + 1;
    save();
    await sendSuccessReact();

    const raro = peixe.mult >= 3.5 ? "\n\n🎉 *PESCA RARA!*" : "";
    await sendReply(
      "🎣 *PESCARIA*\n\n" +
      "Voce pescou *" + peixe.emoji + " " + peixe.name + "*!" + raro + "\n" +
      "Ganhou *+" + fmt(amount) + " 🪙*\n\n" +
      "💰 Bolso: *" + fmt(p.gold) + " 🪙*\n" +
      "_Proxima pescaria em 45 minutos._"
    );
  },
};
