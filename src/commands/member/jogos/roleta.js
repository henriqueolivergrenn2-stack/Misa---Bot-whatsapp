/**
 * Roleta com aposta em gold
 * .roleta vermelho 500
 * .roleta numero 7 500
 * .roleta par 500
 */
import { PREFIX } from "../../../config.js";
import { addGold, fmt, getPlayer, rand, removeGold, save } from "../../../utils/economy.js";

const VERMELHOS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

export default {
  name: "roleta",
  description: "Aposte na roleta e multiplique seu gold!",
  commands: ["roleta", "roulette"],
  usage: `${PREFIX}roleta vermelho|verde|par|impar|numero <n> <valor>`,
  handle: async ({ sendReply, sendErrorReply, sendWarningReply, sendSuccessReact, userLid, webMessage, args }) => {
    const p = getPlayer(userLid, webMessage?.pushName);

    const tipo  = (args[0] || "").toLowerCase();
    let valor, aposta;

    if (tipo === "numero") {
      valor  = Number(args[1]);
      aposta = Number(args[2]);
      if (isNaN(valor) || valor < 0 || valor > 36)
        return sendWarningReply("Número entre 0 e 36!");
    } else {
      aposta = Number(args[1]);
    }

    if (!["vermelho","verde","preto","par","impar","numero"].includes(tipo))
      return sendWarningReply(
        `Tipos válidos: *vermelho, preto, verde, par, impar, numero <0-36>*\n` +
        `Uso: *${PREFIX}roleta vermelho 500*`
      );
    if (!aposta || aposta < 10)   return sendWarningReply("Aposta mínima de *10 🪙*!");
    if (p.gold < aposta)          return sendErrorReply(`Gold insuficiente. Bolso: *${fmt(p.gold)} 🪙*`);

    const numero  = rand(0, 36);
    const vermelho = VERMELHOS.includes(numero);
    const cor     = numero === 0 ? "🟢 Verde" : vermelho ? "🔴 Vermelho" : "⚫ Preto";

    let ganhou = false, mult = 1;
    switch (tipo) {
      case "vermelho": ganhou = vermelho && numero !== 0; mult = 2; break;
      case "preto":    ganhou = !vermelho && numero !== 0; mult = 2; break;
      case "verde":    ganhou = numero === 0; mult = 14; break;
      case "par":      ganhou = numero !== 0 && numero % 2 === 0; mult = 2; break;
      case "impar":    ganhou = numero % 2 !== 0; mult = 2; break;
      case "numero":   ganhou = numero === valor; mult = 35; break;
    }

    p.stats.gambled = (p.stats.gambled || 0) + 1;

    if (ganhou) {
      const premia = aposta * mult;
      addGold(userLid, premia); save();
      await sendSuccessReact();
      return sendReply(
        `🎡 *ROLETA — NÚMERO ${numero} (${cor})*\n\n` +
        `✅ *GANHOU!* ✖️ ${mult}x\n` +
        `+*${fmt(premia)} 🪙*\n\n` +
        `💰 Bolso: *${fmt(p.gold)} 🪙*`
      );
    }
    removeGold(userLid, aposta); save();
    return sendErrorReply(
      `🎡 *ROLETA — NÚMERO ${numero} (${cor})*\n\n` +
      `❌ *PERDEU!*\n` +
      `-*${fmt(aposta)} 🪙*\n\n` +
      `💰 Bolso: *${fmt(p.gold)} 🪙*`
    );
  },
};
