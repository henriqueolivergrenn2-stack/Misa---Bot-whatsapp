import { PREFIX } from "../../../config.js";
import { addGold, fmt, fmtTime, getCd, getPlayer, getNow, hasItem, rand, save } from "../../../utils/economy.js";

const ANIMAIS = [
  { name: "Coelho",  emoji: "🐇", mult: 1.0, chance: 35 },
  { name: "Veado",   emoji: "🦌", mult: 1.5, chance: 25 },
  { name: "Javali",  emoji: "🐗", mult: 2.0, chance: 18 },
  { name: "Lobo",    emoji: "🐺", mult: 2.8, chance: 12 },
  { name: "Urso",    emoji: "🐻", mult: 4.0, chance:  7 },
  { name: "Dragao",  emoji: "🐉", mult: 8.0, chance:  3 },
];

export default {
  name: "hunt",
  description: "Cace animais e ganhe gold a cada 1h30.",
  commands: ["hunt", "cacar", "caca"],
  usage: `${PREFIX}hunt`,
  handle: async ({ sendReply, sendWarningReply, sendSuccessReact, userLid, webMessage }) => {
    const p = getPlayer(userLid, webMessage?.pushName);
    const wait = getCd(p.cooldowns.hunt, 5_400_000);
    if (wait > 0) return sendWarningReply("⏳ Aguarde *" + fmtTime(wait) + "* para cacar novamente.");

    p.cooldowns.hunt = getNow();

    const total = ANIMAIS.reduce((a, f) => a + f.chance, 0);
    let r = rand(1, total);
    let animal = ANIMAIS[0];
    let acc = 0;
    for (const a of ANIMAIS) {
      acc += a.chance;
      if (r <= acc) { animal = a; break; }
    }

    let amount = Math.floor(rand(150, 400) * animal.mult);
    if (hasItem(userLid, "faca")) amount = Math.floor(amount * 1.4);
    if (hasItem(userLid, "vip")) amount = Math.floor(amount * 1.15);

    addGold(userLid, amount);
    p.stats.hunted = (p.stats.hunted || 0) + 1;
    save();
    await sendSuccessReact();

    const lendario = animal.mult >= 4.0 ? "\n\n🏆 *CACADA LENDARIA!*" : "";
    await sendReply(
      "🏹 *CACADA*\n\n" +
      "Voce cacou *" + animal.emoji + " " + animal.name + "*!" + lendario + "\n" +
      "Ganhou *+" + fmt(amount) + " 🪙*\n\n" +
      "💰 Bolso: *" + fmt(p.gold) + " 🪙*\n" +
      "_Proxima cacada em 1h30._"
    );
  },
};
