/**
 * Blackjack (21) com aposta em gold
 * .blackjack <valor>  → começa jogo
 * .blackjack hit      → pede carta
 * .blackjack stand    → para
 */
import { PREFIX } from "../../../config.js";
import { addGold, fmt, getPlayer, removeGold, save } from "../../../utils/economy.js";

const NAIPES = ["♠️","♥️","♦️","♣️"];
const VALORES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function novoDeck() {
  const d = [];
  for (const n of NAIPES) for (const v of VALORES) d.push({ n, v });
  return d.sort(() => Math.random() - 0.5);
}

function valorCarta(v) {
  if (["J","Q","K"].includes(v)) return 10;
  if (v === "A") return 11;
  return Number(v);
}

function somaM(mao) {
  let total = 0, ases = 0;
  for (const c of mao) {
    total += valorCarta(c.v);
    if (c.v === "A") ases++;
  }
  while (total > 21 && ases > 0) { total -= 10; ases--; }
  return total;
}

function exibirMao(mao, ocultar = false) {
  if (ocultar) return `${mao[0].v}${mao[0].n} 🂠`;
  return mao.map(c => `${c.v}${c.n}`).join(" ");
}

const GAMES = new Map();

export default {
  name: "blackjack",
  description: "Jogue Blackjack (21) apostando gold!",
  commands: ["blackjack", "bj", "21"],
  usage: `${PREFIX}blackjack <valor>`,
  handle: async ({ sendReply, sendErrorReply, sendWarningReply, sendSuccessReact, userLid, webMessage, args, fullArgs }) => {
    const p    = getPlayer(userLid, webMessage?.pushName);
    const input = (fullArgs?.trim() || "").toLowerCase();
    const game  = GAMES.get(userLid);

    // ── HIT ──────────────────────────────────────────────────
    if (input === "hit" || input === "carta" || input === "pedir") {
      if (!game) return sendWarningReply(`Nenhum jogo ativo! Use *${PREFIX}blackjack <valor>*`);
      game.player.push(game.deck.pop());
      const total = somaM(game.player);
      if (total > 21) {
        removeGold(userLid, game.bet); save();
        GAMES.delete(userLid);
        return sendErrorReply(
          `🃏 *BLACKJACK — BUST!*\n\n` +
          `Sua mão: ${exibirMao(game.player)} = *${total}*\n\n` +
          `💸 Você perdeu *${fmt(game.bet)} 🪙*\n💰 Bolso: *${fmt(p.gold)} 🪙*`
        );
      }
      return sendReply(
        `🃏 *BLACKJACK — HIT*\n\n` +
        `Sua mão: ${exibirMao(game.player)} = *${total}*\n` +
        `Dealer: ${exibirMao(game.dealer, true)}\n\n` +
        `_*${PREFIX}bj hit* para mais | *${PREFIX}bj stand* para parar_`
      );
    }

    // ── STAND ────────────────────────────────────────────────
    if (input === "stand" || input === "parar" || input === "stop") {
      if (!game) return sendWarningReply(`Nenhum jogo ativo! Use *${PREFIX}blackjack <valor>*`);
      // Dealer tira cartas até >= 17
      while (somaM(game.dealer) < 17) game.dealer.push(game.deck.pop());
      const pTotal = somaM(game.player);
      const dTotal = somaM(game.dealer);
      GAMES.delete(userLid);

      let msg, delta;
      if (dTotal > 21 || pTotal > dTotal) {
        // Jogador vence
        delta = game.bet;
        addGold(userLid, game.bet); save();
        await sendSuccessReact();
        msg = `🏆 *VOCÊ GANHOU!*\n\n+*${fmt(game.bet)} 🪙*`;
      } else if (pTotal === dTotal) {
        delta = 0;
        msg = `🤝 *EMPATE!*\n\nAposta devolvida.`;
      } else {
        delta = -game.bet;
        removeGold(userLid, game.bet); save();
        msg = `💀 *DEALER GANHOU!*\n\n-*${fmt(game.bet)} 🪙*`;
      }
      return sendReply(
        `🃏 *BLACKJACK — RESULTADO*\n\n` +
        `Sua mão: ${exibirMao(game.player)} = *${pTotal}*\n` +
        `Dealer: ${exibirMao(game.dealer)} = *${dTotal}*\n\n` +
        `${msg}\n💰 Bolso: *${fmt(p.gold)} 🪙*`
      );
    }

    // ── NOVO JOGO ────────────────────────────────────────────
    if (game) return sendWarningReply(`Você tem um jogo ativo!\n*${PREFIX}bj hit* ou *${PREFIX}bj stand*`);
    const bet = Number(args[0]);
    if (!bet || bet < 10)   return sendWarningReply(`Aposta mínima de 10 🪙.\nUso: *${PREFIX}blackjack <valor>*`);
    if (p.gold < bet)       return sendErrorReply(`Gold insuficiente. Bolso: *${fmt(p.gold)} 🪙*`);

    const deck   = novoDeck();
    const player = [deck.pop(), deck.pop()];
    const dealer = [deck.pop(), deck.pop()];
    GAMES.set(userLid, { deck, player, dealer, bet });

    const total = somaM(player);
    // Blackjack natural
    if (total === 21) {
      const ganho = Math.floor(bet * 1.5);
      addGold(userLid, ganho); save();
      GAMES.delete(userLid);
      await sendSuccessReact();
      return sendReply(
        `🃏 *BLACKJACK NATURAL!*\n\n` +
        `Sua mão: ${exibirMao(player)} = *21*\n\n` +
        `🏆 *+${fmt(ganho)} 🪙* (1.5x)\n💰 Bolso: *${fmt(p.gold)} 🪙*`
      );
    }

    return sendReply(
      `🃏 *BLACKJACK*\n\n` +
      `Sua mão: ${exibirMao(player)} = *${total}*\n` +
      `Dealer: ${exibirMao(dealer, true)}\n\n` +
      `💰 Aposta: *${fmt(bet)} 🪙*\n\n` +
      `_*${PREFIX}bj hit* para pedir carta | *${PREFIX}bj stand* para parar_`
    );
  },
};
