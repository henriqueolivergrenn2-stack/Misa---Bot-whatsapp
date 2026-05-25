/**
 * velhaManager.js
 *
 * Módulo central do Jogo da Velha.
 * Exporta o estado dos jogos e a função processVelhaMove,
 * que intercepta mensagens puras (sem prefixo) no chat.
 *
 * Usado por:
 *  - commands/member/velha.js  → comandos (.velha, .aceitar, etc.)
 *  - utils/dynamicCommand.js   → intercepta "1","2"..."9" no chat
 */

import { PREFIX } from "../config.js";

// ─── Estado global dos jogos ──────────────────────────────────────────────────
// Map: remoteJid → gameState
export const games = new Map();

// ─── Helpers visuais ──────────────────────────────────────────────────────────

const NUM_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

function cellDisplay(cell, idx) {
  if (cell === "X") return "❌";
  if (cell === "O") return "⭕";
  return NUM_EMOJIS[idx];
}

function renderBoard(board) {
  const c = (i) => cellDisplay(board[i], i);
  return [
    `${c(0)} │ ${c(1)} │ ${c(2)}`,
    `──┼──┼──`,
    `${c(3)} │ ${c(4)} │ ${c(5)}`,
    `──┼──┼──`,
    `${c(6)} │ ${c(7)} │ ${c(8)}`,
  ].join("\n");
}

export function buildMessage(game, status) {
  return [
    `🎮 *JOGO DA VELHA*`,
    ``,
    `❌ *${game.p1Name}*  vs  ⭕ *${game.p2Name}*`,
    ``,
    renderBoard(game.board),
    ``,
    status,
  ].join("\n");
}

// ─── Lógica do jogo ───────────────────────────────────────────────────────────

export function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // linhas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // colunas
    [0, 4, 8], [2, 4, 6],             // diagonais
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]; // "X" ou "O"
    }
  }
  if (board.every((cell) => cell !== null)) return "draw";
  return null;
}

// ─── Edição de mensagem com fallback ─────────────────────────────────────────

export async function editOrSend(socket, remoteJid, msgKey, text, sendReply) {
  if (msgKey) {
    try {
      await socket.sendMessage(remoteJid, { text, edit: msgKey });
      return;
    } catch { /* fallback abaixo */ }
  }
  await sendReply(text);
}

// ─── Interceptador de jogadas no chat ────────────────────────────────────────

/**
 * Chamado pelo dynamicCommand ANTES de qualquer verificação de prefixo.
 * Se houver um jogo ativo e a mensagem for um número de 1-9
 * enviado por um dos jogadores, processa a jogada e retorna true.
 * Caso contrário, retorna false e deixa o fluxo normal continuar.
 *
 * @param {CommandHandleProps} paramsHandler
 * @returns {Promise<boolean>}
 */
export async function processVelhaMove(paramsHandler) {
  const {
    remoteJid,
    userLid,
    fullMessage,
    socket,
    sendReply,
    sendWarningReply,
  } = paramsHandler;

  const game = games.get(remoteJid);

  // Só processa se tiver jogo rolando
  if (!game || game.status !== "playing") return false;

  // Só processa se a mensagem for exatamente um número de 1 a 9
  const trimmed = (fullMessage ?? "").trim();
  const moveNum = parseInt(trimmed);
  if (
    isNaN(moveNum) ||
    moveNum < 1 ||
    moveNum > 9 ||
    trimmed !== String(moveNum)
  ) {
    return false;
  }

  // Só processa se o remetente for um dos jogadores
  const isP1 = userLid === game.p1Lid;
  const isP2 = userLid === game.p2Lid;
  if (!isP1 && !isP2) return false; // não é jogador, deixa o chat fluir normal

  // A partir daqui, a mensagem é consumida (retorna true no final)

  if (userLid !== game.turn) {
    const turnName = game.turn === game.p1Lid ? game.p1Name : game.p2Name;
    const turnSym  = game.turn === game.p1Lid ? "❌" : "⭕";
    await sendWarningReply(`Aguarde sua vez! Agora é *${turnName}* ${turnSym}`);
    return true;
  }

  const idx = moveNum - 1;
  if (game.board[idx] !== null) {
    await sendWarningReply("Posição já ocupada! Escolha outra (1-9).");
    return true;
  }

  // Aplica a jogada
  const symbol = isP1 ? "X" : "O";
  game.board[idx] = symbol;

  const winner = checkWinner(game.board);
  let status;

  if (winner === "draw") {
    // Empate: devolve o gold apostado para cada um
    if (game.bet > 0) {
      const { cancelBetGame } = await import("../commands/member/gold/economy.js");
      cancelBetGame(remoteJid);
      status = `🤝 *Empate! Bom jogo para os dois!*\n💰 A aposta de *${game.bet.toLocaleString("pt-BR")} 🪙* foi devolvida.\n\nUse *${PREFIX}velha @jogador* para jogar novamente.`;
    } else {
      status = `🤝 *Empate! Bom jogo para os dois!*\n\nUse *${PREFIX}velha @jogador* para jogar novamente.`;
    }
    games.delete(remoteJid);
  } else if (winner) {
    const winnerLid  = winner === "X" ? game.p1Lid : game.p2Lid;
    const winnerName = winner === "X" ? game.p1Name : game.p2Name;
    const winnerSym  = winner === "X" ? "❌" : "⭕";

    if (game.bet > 0) {
      const { finishBetGame } = await import("../commands/member/gold/economy.js");
      const betResult = finishBetGame(remoteJid, winnerLid);
      const prize = betResult.success ? betResult.reward : 0;
      status = `🏆 *${winnerName}* ${winnerSym} *venceu!*\n💰 Ganhou *${prize.toLocaleString("pt-BR")} 🪙* da aposta!\n\nUse *${PREFIX}velha @jogador* para jogar novamente.`;
    } else {
      status = `🏆 *${winnerName}* ${winnerSym} *venceu! Parabéns!*\n\nUse *${PREFIX}velha @jogador* para jogar novamente.`;
    }
    games.delete(remoteJid);
  } else {
    // Troca o turno
    game.turn = game.turn === game.p1Lid ? game.p2Lid : game.p1Lid;
    const nextName = game.turn === game.p1Lid ? game.p1Name : game.p2Name;
    const nextSym  = game.turn === game.p1Lid ? "❌" : "⭕";
    status = `Vez de *${nextName}* ${nextSym} — mande o número no chat!`;
  }

  await editOrSend(
    socket,
    remoteJid,
    game.msgKey,
    buildMessage(game, status),
    sendReply
  );

  return true;
}
 