/**
 * Dado — joga dados com ou sem aposta
 */
import { PREFIX } from "../../../config.js";
import { addGold, fmt, getPlayer, rand, removeGold, save } from "../../../utils/economy.js";

export default {
  name: "dado",
  description: "Jogue dados. Sem argumento = d6 grátis. Com valor = aposta.",
  commands: ["dado", "dice", "d6"],
  usage: `${PREFIX}dado | ${PREFIX}dado <aposta>`,
  handle: async ({ sendReply, sendErrorReply, sendWarningReply, sendSuccessReact, userLid, webMessage, args }) => {
    const p   = getPlayer(userLid, webMessage?.pushName);
    const bet = Number(args[0]);
    const r   = rand(1, 6);
    const faces = ["⚀","⚁","⚂","⚃","⚄","⚅"];

    if (!bet) {
      await sendReply(`🎲 *DADO ROLADO!*\n\n${faces[r-1]} — *${r}*`);
      return;
    }

    if (bet < 10) return sendWarningReply("Aposta mínima de *10 🪙*!");
    if (p.gold < bet) return sendErrorReply(`Gold insuficiente. Bolso: *${fmt(p.gold)} 🪙*`);

    const bot = rand(1, 6);
    p.stats.gambled = (p.stats.gambled || 0) + 1;

    if (r > bot) {
      addGold(userLid, bet); save();
      await sendSuccessReact();
      return sendReply(
        `🎲 *DUELO DE DADOS*\n\n` +
        `Você: ${faces[r-1]} *${r}* vs Bot: ${faces[bot-1]} *${bot}*\n\n` +
        `✅ Você venceu! *+${fmt(bet)} 🪙*\n💰 Bolso: *${fmt(p.gold)} 🪙*`
      );
    } else if (r === bot) {
      return sendReply(
        `🎲 *DUELO DE DADOS — EMPATE*\n\n` +
        `Você: ${faces[r-1]} *${r}* vs Bot: ${faces[bot-1]} *${bot}*\n\n` +
        `🤝 Empate! Aposta devolvida.`
      );
    }
    removeGold(userLid, bet); save();
    return sendErrorReply(
      `🎲 *DUELO DE DADOS*\n\n` +
      `Você: ${faces[r-1]} *${r}* vs Bot: ${faces[bot-1]} *${bot}*\n\n` +
      `❌ Você perdeu! *-${fmt(bet)} 🪙*\n💰 Bolso: *${fmt(p.gold)} 🪙*`
    );
  },
};
