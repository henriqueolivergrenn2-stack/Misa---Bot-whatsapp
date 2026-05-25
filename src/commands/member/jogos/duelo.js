/**
 * Duelo PvP — dois jogadores apostam e lutam
 * .duelo @pessoa <valor>
 * .duelo aceitar
 */
import { PREFIX } from "../../../config.js";
import { addGold, cancelBetGame, createBetGame, finishBetGame, fmt, getPlayer, rand, save } from "../../../utils/economy.js";

const DESAFIOS = new Map(); // remoteJid -> { p1, p2, bet, expires }

const GOLPES = [
  "soco","chute","rasteira","voadora","cabeçada","mordida","catapultagem","golpe do destino",
];

export default {
  name: "duelo",
  description: "Desafie alguém para um duelo apostando gold!",
  commands: ["duelo", "duel"],
  usage: `${PREFIX}duelo @pessoa <valor>`,
  handle: async ({ sendReply, sendErrorReply, sendWarningReply, sendSuccessReact, userLid, webMessage, args, fullArgs, remoteJid }) => {
    const p     = getPlayer(userLid, webMessage?.pushName);
    const input = (args[0] || "").toLowerCase();

    // ── ACEITAR ──────────────────────────────────────────────
    if (input === "aceitar") {
      const desafio = DESAFIOS.get(remoteJid);
      if (!desafio)          return sendWarningReply("Nenhum duelo pendente neste grupo!");
      if (userLid === desafio.p1) return sendWarningReply("Você não pode aceitar o próprio duelo!");
      if (Date.now() > desafio.expires) {
        cancelBetGame(remoteJid + "_duelo");
        DESAFIOS.delete(remoteJid);
        return sendWarningReply("O desafio expirou!");
      }

      const p2 = getPlayer(userLid, webMessage?.pushName);
      if (p2.gold < desafio.bet) return sendErrorReply(`Gold insuficiente! Precisa de *${fmt(desafio.bet)} 🪙*`);

      const betResult = createBetGame(remoteJid + "_duelo", desafio.p1, userLid, desafio.bet);
      if (betResult.error) return sendErrorReply(betResult.error);

      DESAFIOS.delete(remoteJid);

      // Simular duelo
      const p1   = getPlayer(desafio.p1);
      const rnd1 = rand(1, 100), rnd2 = rand(1, 100);
      const vencedorId = rnd1 >= rnd2 ? desafio.p1 : userLid;
      const perdedorId = vencedorId === desafio.p1 ? userLid : desafio.p1;
      const vencedor   = getPlayer(vencedorId);
      const perdedor   = getPlayer(perdedorId);
      const golpe      = GOLPES[rand(0, GOLPES.length - 1)];

      const result = finishBetGame(remoteJid + "_duelo", vencedorId);
      vencedor.stats.wins  = (vencedor.stats.wins  || 0) + 1;
      perdedor.stats.loses = (perdedor.stats.loses || 0) + 1;
      save();

      await sendSuccessReact();
      return sendReply(
        `⚔️ *DUELO!*\n\n` +
        `*${p1.name}* vs *${p2.name}*\n\n` +
        `💥 *${vencedor.name}* aplica um *${golpe}* e vence!\n\n` +
        `🏆 *${vencedor.name}* ganhou *${fmt(result.reward)} 🪙*\n` +
        `💸 *${perdedor.name}* perdeu *${fmt(desafio.bet)} 🪙*`
      );
    }

    // ── NOVO DESAFIO ─────────────────────────────────────────
    const mentioned = webMessage?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const bet = Number(args.find(a => !isNaN(Number(a)) && Number(a) > 0));

    if (!mentioned.length || !bet)
      return sendWarningReply(`Uso: *${PREFIX}duelo @pessoa <valor>*\nAceitar: *${PREFIX}duelo aceitar*`);
    if (mentioned[0] === userLid) return sendWarningReply("Você não pode se desafiar!");
    if (p.gold < bet) return sendErrorReply(`Gold insuficiente. Bolso: *${fmt(p.gold)} 🪙*`);
    if (bet < 50) return sendWarningReply("Aposta mínima de *50 🪙*!");
    if (DESAFIOS.has(remoteJid)) return sendWarningReply("Já há um duelo pendente neste grupo!");

    DESAFIOS.set(remoteJid, {
      p1: userLid, p2: mentioned[0],
      bet, expires: Date.now() + 60_000,
    });

    return sendReply(
      `⚔️ *DESAFIO DE DUELO!*\n\n` +
      `*${p.name}* desafia @${mentioned[0].split("@")[0]}!\n` +
      `💰 Aposta: *${fmt(bet)} 🪙 cada*\n\n` +
      `_Use *${PREFIX}duelo aceitar* para aceitar!_\n` +
      `_(Expira em 60 segundos)_`,
      [mentioned[0]]
    );
  },
};
