/**
 * 🎮 Jogo da Velha com sistema de apostas
 * Salve em: src/commands/jogos/velhas.js
 */

import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import {
  buildMessage,
  editOrSend,
  games,
} from "../../../utils/velhaManager.js";
import {
  getPlayer,
  addGold,
  removeGold,
  createBetGame,
  finishBetGame,
  cancelBetGame,
} from "../../../utils/economy.js";

function getMentions(webMessage) {
  return (
    webMessage?.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
    webMessage?.message?.contextInfo?.mentionedJid ||
    []
  );
}

function stripNumber(jid) {
  return jid ? jid.replace(/[^0-9]/g, "") : "";
}

export default {
  name: "velha",
  description: "Jogo da velha no WhatsApp! Desafie alguém e aposte gold.",
  commands: ["velha", "jogodavelha", "jv"],
  usage: `${PREFIX}velha @jogador [aposta]`,

  handle: async ({
    sendReply,
    sendWarningReply,
    sendErrorReply,
    sendWaitReact,
    sendSuccessReact,
    socket,
    remoteJid,
    userLid,
    webMessage,
    fullArgs,
  }) => {
    const parts      = (fullArgs?.trim() ?? "").split(/\s+/);
    const input      = parts[0].toLowerCase();
    const game       = games.get(remoteJid);
    const playerName = webMessage?.pushName || "Jogador";
    const player     = getPlayer(userLid, playerName);

    // ── ACEITAR DESAFIO ──────────────────────────────────────────────────────
    if (input === "aceitar") {
      if (!game || game.status !== "pending") {
        await sendWarningReply("Nenhum desafio pendente para aceitar!");
        return;
      }
      if (userLid === game.p1Lid) {
        await sendWarningReply("Você não pode aceitar o seu próprio desafio! 😅");
        return;
      }

      // Verifica gold para a aposta
      if (game.bet > 0) {
        const accepter = getPlayer(userLid, playerName);
        if (accepter.gold < game.bet) {
          await sendErrorReply(
            `❌ Você não tem gold suficiente para essa aposta!\n\n` +
            `💰 Aposta: *${game.bet.toLocaleString("pt-BR")} 🪙*\n` +
            `💰 Seu saldo: *${accepter.gold.toLocaleString("pt-BR")} 🪙*`
          );
          return;
        }

        // Desconta o gold de ambos ao aceitar
        const betResult = createBetGame(remoteJid, game.p1Lid, userLid, game.bet);
        if (betResult.error) {
          await sendErrorReply(`❌ Erro na aposta: ${betResult.error}`);
          return;
        }
      }

      game.p2Lid  = userLid;
      game.p2Name = playerName;
      game.status = "playing";
      game.turn   = game.p1Lid;

      const betInfo   = game.bet > 0 ? `\n💰 Aposta: *${game.bet.toLocaleString("pt-BR")} 🪙 cada*` : "";
      const status    = `Jogo iniciado! 🎉${betInfo}\nVez de *${game.p1Name}* ❌ — mande o número no chat!`;
      const boardText = buildMessage(game, status);

      try {
        const sent = await socket.sendMessage(
          remoteJid,
          { text: boardText, mentions: [game.p2InviteJid] },
          { quoted: webMessage }
        );
        game.msgKey = sent?.key ?? null;
      } catch {
        await sendErrorReply("Erro ao iniciar o jogo. Tente novamente!");
        if (game.bet > 0) cancelBetGame(remoteJid);
        games.delete(remoteJid);
        return;
      }

      await sendSuccessReact();
      return;
    }

    // ── DESISTIR / CANCELAR ──────────────────────────────────────────────────
    if (["desistir", "sair", "cancelar"].includes(input)) {
      if (!game) {
        await sendWarningReply("Nenhum jogo em andamento!");
        return;
      }

      const isP1 = userLid === game.p1Lid;
      const isP2 = userLid === game.p2Lid;
      const myNum = stripNumber(userLid);
      const isInvitedP2 =
        game.p2InviteJid &&
        myNum.length >= 8 &&
        myNum === stripNumber(game.p2InviteJid);

      if (!isP1 && !isP2 && !isInvitedP2) {
        await sendWarningReply("Você não está participando deste jogo!");
        return;
      }

      // Devolve o gold se havia aposta e o jogo já estava em andamento
      if (game.bet > 0 && game.status === "playing") {
        // Quem desistiu perde a aposta para o adversário
        const winner = isP1 ? game.p2Lid : game.p1Lid;
        if (winner) {
          const betResult = finishBetGame(remoteJid, winner);
          if (betResult.success) {
            const winnerPlayer = getPlayer(winner);
            await sendReply(
              `🏳️ *${isP1 ? game.p1Name : game.p2Name}* desistiu!\n\n` +
              `🏆 *${winnerPlayer.name}* ganhou *${betResult.reward.toLocaleString("pt-BR")} 🪙* pela desistência!`
            );
            games.delete(remoteJid);
            return;
          }
        }
        // Se não tem adversário ainda (pending), devolve
        cancelBetGame(remoteJid);
      }

      const name = isP1 ? game.p1Name : game.p2Name;
      const abandonText =
        game.status === "pending"
          ? `❌ *${name}* cancelou o desafio.`
          : `🏳️ *${name}* desistiu! Jogo encerrado.`;

      games.delete(remoteJid);
      await editOrSend(socket, remoteJid, game.msgKey, abandonText, sendReply);
      return;
    }

    // ── INICIAR / DESAFIAR ───────────────────────────────────────────────────
    const mentioned = getMentions(webMessage);

    if (!mentioned.length) {
      if (game) {
        const st =
          game.status === "pending"
            ? `⏳ *${game.p1Name}* desafiou *${game.p2Name}*!\nAguardando *${PREFIX}velha aceitar*`
            : `🎮 Jogo em andamento: *${game.p1Name}* ❌ vs ⭕ *${game.p2Name}*`;
        await sendWarningReply(st);
        return;
      }

      throw new InvalidParameterError(
        `Mencione um jogador para desafiar!\n\n` +
        `*Sem aposta:* *${PREFIX}velha @jogador*\n` +
        `*Com aposta:* *${PREFIX}velha @jogador 500*\n\n` +
        `*Comandos:*\n` +
        `› *${PREFIX}velha aceitar* — aceita o desafio\n` +
        `› *${PREFIX}velha desistir* — encerra o jogo\n\n` +
        `_Durante o jogo, mande o número (1-9) no chat!_`
      );
    }

    if (game) {
      const st =
        game.status === "pending"
          ? `Já há um desafio pendente! Use *${PREFIX}velha desistir* para cancelar.`
          : `Já existe um jogo em andamento! Use *${PREFIX}velha desistir* para encerrar.`;
      await sendWarningReply(st);
      return;
    }

    const opponentJid = mentioned[0];

    if (
      stripNumber(userLid).length >= 8 &&
      stripNumber(userLid) === stripNumber(opponentJid)
    ) {
      await sendWarningReply("Você não pode desafiar a si mesmo! 😅");
      return;
    }

    // Aposta opcional — segundo arg numérico
    const betArg = Number(parts.find(p => !isNaN(Number(p)) && Number(p) > 0));
    let bet = 0;

    if (betArg > 0) {
      if (betArg < 50) {
        await sendWarningReply("A aposta mínima é *50 🪙*.");
        return;
      }
      if (player.gold < betArg) {
        await sendErrorReply(
          `❌ Gold insuficiente para apostar!\n\n` +
          `💰 Aposta desejada: *${betArg.toLocaleString("pt-BR")} 🪙*\n` +
          `💰 Seu saldo: *${player.gold.toLocaleString("pt-BR")} 🪙*`
        );
        return;
      }
      bet = betArg;
    }

    const p2DisplayName = `@${stripNumber(opponentJid)}`;

    games.set(remoteJid, {
      p1Lid:       userLid,
      p1Name:      playerName,
      p2Lid:       null,
      p2InviteJid: opponentJid,
      p2Name:      p2DisplayName,
      board:       Array(9).fill(null),
      turn:        null,
      status:      "pending",
      msgKey:      null,
      bet,          // 🪙 aposta por jogador
    });

    await sendWaitReact();

    const betLine = bet > 0
      ? `\n💰 *Aposta: ${bet.toLocaleString("pt-BR")} 🪙 cada!*`
      : "";

    const challengeText = [
      `🎮 *JOGO DA VELHA — DESAFIO!*`,
      ``,
      `❌ *${playerName}* desafia ⭕ *${p2DisplayName}*!${betLine}`,
      ``,
      `*${p2DisplayName}*, aceita o desafio?`,
      `Digite *${PREFIX}velha aceitar* para jogar!`,
      bet > 0 ? `_⚠️ Você precisará de ${bet.toLocaleString("pt-BR")} 🪙 para aceitar!_` : ``,
      ``,
      `_Durante o jogo, basta mandar o número (1-9) no chat!_`,
      `_(${PREFIX}velha desistir para cancelar)_`,
    ].filter(l => l !== null).join("\n");

    try {
      await socket.sendMessage(
        remoteJid,
        { text: challengeText, mentions: [opponentJid] },
        { quoted: webMessage }
      );
    } catch {
      await sendErrorReply("Erro ao enviar o desafio. Tente novamente!");
      games.delete(remoteJid);
      return;
    }

    await sendSuccessReact();
  },
};
