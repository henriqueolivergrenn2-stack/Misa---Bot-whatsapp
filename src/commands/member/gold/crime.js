import { PREFIX } from "../../../config.js";
import { addGold, fmt, fmtTime, getCd, getPlayer, getNow, hasItem, rand, removeGold, save } from "../../../utils/economy.js";

const CRIMES = [
  { name: "assalto a banco",     emoji: "🏦", min: 500,  max: 1_500 },
  { name: "furto de veiculo",    emoji: "🚗", min: 300,  max: 1_000 },
  { name: "golpe digital",       emoji: "💻", min: 400,  max: 1_200 },
  { name: "contrabando",         emoji: "📦", min: 350,  max: 1_100 },
  { name: "sequestro relampago", emoji: "⚡", min: 600,  max: 1_800 },
  { name: "fraude de cartao",    emoji: "💳", min: 250,  max: 900   },
];

const MOTIVOS_PRESO = [
  "A policia estava de plantao e te flagrou!",
  "Seu comparsa te entregou pra delegacia.",
  "As cameras te gravaram. Sem saida!",
  "Um policial disfarcado estava na area.",
  "Voce escorregou na fuga e foi preso.",
];

export default {
  name: "crime",
  description: "Cometa um crime — sucesso da gold, falha da multa.",
  commands: ["crime"],
  usage: `${PREFIX}crime`,
  handle: async ({ sendReply, sendErrorReply, sendWarningReply, userLid, webMessage }) => {
    const p = getPlayer(userLid, webMessage?.pushName);
    const wait = getCd(p.cooldowns.crime, 2_700_000);
    if (wait > 0) return sendWarningReply("⏳ Aguarde *" + fmtTime(wait) + "* para tentar um crime.");

    p.cooldowns.crime = getNow();
    const crime = CRIMES[rand(0, CRIMES.length - 1)];
    const chance = hasItem(userLid, "vip") ? 0.68 : 0.55;
    p.stats.crimes = (p.stats.crimes || 0) + 1;

    if (Math.random() < chance) {
      const amount = rand(crime.min, crime.max);
      addGold(userLid, amount);
      save();
      return sendReply(
        "🔫 *CRIME BEM-SUCEDIDO!*\n\n" +
        crime.emoji + " Voce realizou *" + crime.name + "*!\n" +
        "Ganhou *+" + fmt(amount) + " 🪙*\n\n" +
        "💰 Bolso: *" + fmt(p.gold) + " 🪙*"
      );
    }

    const motivo = MOTIVOS_PRESO[rand(0, MOTIVOS_PRESO.length - 1)];
    const multa = rand(150, 600);
    removeGold(userLid, multa);
    save();
    return sendErrorReply(
      "🚔 *PRESO!*\n\n" +
      motivo + "\n" +
      "Multa: *-" + fmt(multa) + " 🪙*\n\n" +
      "💰 Bolso: *" + fmt(p.gold) + " 🪙*"
    );
  },
};
