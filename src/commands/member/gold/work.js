import { PREFIX } from "../../../config.js";
import { addGold, fmt, fmtTime, getCd, getPlayer, getNow, hasItem, rand, save } from "../../../utils/economy.js";

const JOBS = [
  { name: "Programador",  emoji: "💻", min: 250, max: 650 },
  { name: "Mercador",     emoji: "🛒", min: 200, max: 600 },
  { name: "Cacador",      emoji: "🏹", min: 180, max: 550 },
  { name: "Minerador",    emoji: "⛏️", min: 220, max: 620 },
  { name: "Chef",         emoji: "👨‍🍳", min: 190, max: 580 },
  { name: "Medico",       emoji: "🩺", min: 300, max: 700 },
  { name: "Ferreiro",     emoji: "🔨", min: 210, max: 610 },
  { name: "Agricultor",   emoji: "🌾", min: 170, max: 520 },
  { name: "Musico",       emoji: "🎸", min: 150, max: 500 },
  { name: "Eletricista",  emoji: "⚡", min: 230, max: 630 },
];

export default {
  name: "work",
  description: "Trabalhe e ganhe gold a cada 30 minutos.",
  commands: ["work", "trabalhar", "trampar"],
  usage: `${PREFIX}work`,
  handle: async ({ sendReply, sendWarningReply, sendSuccessReact, userLid, webMessage }) => {
    const p = getPlayer(userLid, webMessage?.pushName);
    const wait = getCd(p.cooldowns.work, 1_800_000);
    if (wait > 0) return sendWarningReply("⏳ Aguarde *" + fmtTime(wait) + "* para trabalhar novamente.");

    p.cooldowns.work = getNow();
    const job = JOBS[rand(0, JOBS.length - 1)];
    let amount = rand(job.min, job.max);
    if (hasItem(userLid, "mochila")) amount = Math.floor(amount * 1.3);
    if (hasItem(userLid, "vip")) amount = Math.floor(amount * 1.15);

    addGold(userLid, amount);
    p.stats.worked++;
    save();
    await sendSuccessReact();
    await sendReply(
      job.emoji + " *TRABALHO CONCLUIDO!*\n\n" +
      "Voce trabalhou como *" + job.name + "*!\n" +
      "Ganhou *+" + fmt(amount) + " 🪙*\n\n" +
      "💰 Bolso: *" + fmt(p.gold) + " 🪙*\n" +
      "_Proximo trabalho em 30 minutos._"
    );
  },
};
