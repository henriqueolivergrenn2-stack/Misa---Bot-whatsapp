/**
 * forca.js — Comando unificado da Forca (individual + grupo + categoria)
 * Salve em: src/commands/member/jogos/forca.js
 *
 * TODOS os modos em um só comando:
 *
 *   .forca              → inicia forca individual (categoria aleatória)
 *   .forca g            → inicia forca em grupo   (categoria aleatória)
 *   .forca cat          → lista categorias disponíveis
 *   .forca cat <n>      → individual com categoria escolhida
 *   .forca cat <n> g    → grupo com categoria escolhida
 *   .forca dica         → revela dica + uma letra grátis
 *   .forca desistir     → encerra o jogo ativo
 *
 * Após iniciar, basta digitar a letra direto no chat.
 * Em grupo, na PRIMEIRA vez responda a mensagem da forca. Depois é direto.
 */

import { PREFIX } from "../../../config.js";
import {
  CATEGORIAS,
  DICA_CAT,
  FORCA_IMGS,
  gamesGrupo,
  gamesIndividual,
  buildDisplay,
  buildGameText,
  editOrSend,
  norm,
  sortearPalavra,
} from "../../../utils/forcaManager.js";

export default {
  name: "forca",
  description: "Jogo da Forca! Individual, grupo ou com categoria.",
  commands: ["forca"],
  usage: `${PREFIX}forca | ${PREFIX}forca g | ${PREFIX}forca cat | ${PREFIX}forca cat <n> [g]`,

  handle: async ({
    sendReply,
    sendWarningReply,
    remoteJid,
    userLid,
    fullArgs,
    socket,
    webMessage,
  }) => {
    const args  = (fullArgs?.trim() || "").split(/\s+/);
    const sub   = norm(args[0] || "");
    const nome  = webMessage?.pushName || "Jogador";

    // ── .forca desistir ───────────────────────────────────────────────────────
    if (sub === "desistir" || sub === "sair") {
      const gameI = gamesIndividual.get(userLid);
      const gameG = gamesGrupo.get(remoteJid);

      if (!gameI && !gameG) {
        return sendWarningReply("Nenhum jogo em andamento para encerrar!");
      }

      if (gameI) {
        gamesIndividual.delete(userLid);
        await editOrSend(socket, remoteJid, gameI.msgKey,
          "🏳️ *Jogo encerrado!*\n\n" +
          "```\n" + FORCA_IMGS[gameI.erros] + "```\n\n" +
          "📝 A palavra era: *" + gameI.palavra.toUpperCase() + "*\n" +
          "🏷️ " + gameI.categoria,
          sendReply
        );
      } else {
        gamesGrupo.delete(remoteJid);
        await editOrSend(socket, remoteJid, gameG.msgKey,
          "🏳️ *Jogo encerrado!*\n\n" +
          "```\n" + FORCA_IMGS[gameG.erros] + "```\n\n" +
          "📝 A palavra era: *" + gameG.palavra.toUpperCase() + "*\n" +
          "🏷️ " + gameG.categoria,
          sendReply
        );
      }
      return;
    }

    // ── .forca dica ───────────────────────────────────────────────────────────
    if (sub === "dica") {
      const gameI = gamesIndividual.get(userLid);
      const gameG = gamesGrupo.get(remoteJid);
      const game  = gameI || gameG;

      if (!game) {
        return sendWarningReply(
          "Nenhum jogo ativo!\nUse *" + PREFIX + "forca* para começar."
        );
      }

      if (!game.dicaUsada) {
        const naoReveladas = game.palavra.split("").filter(c => c !== "-" && !game.acertos.includes(c));
        if (naoReveladas.length > 0) {
          const letraBonus = naoReveladas[Math.floor(Math.random() * naoReveladas.length)];
          game.acertos.push(letraBonus);
          game.letrasUsadas.push(letraBonus);
        }
        game.dicaUsada = true;
      }

      const modoLabel = gameI ? "FORCA INDIVIDUAL" : "FORCA EM GRUPO";
      await editOrSend(socket, remoteJid, game.msgKey,
        buildGameText(game, "🎮 *" + modoLabel + "*\n💡 Dica revelada!"),
        sendReply
      );
      return;
    }

    // ── .forca cat ────────────────────────────────────────────────────────────
    if (sub === "cat" || sub === "categoria" || sub === "categorias") {
      const num  = parseInt(args[1]);
      const modo = norm(args[2] || "") === "g" ? "grupo" : "individual";

      // Sem número → lista categorias
      if (!args[1] || isNaN(num)) {
        const lista = CATEGORIAS.map((cat, i) => "*" + (i + 1) + ".* " + cat).join("\n");
        return sendReply(
          "🏷️ *CATEGORIAS DISPONÍVEIS*\n\n" + lista + "\n\n" +
          "_Individual: *" + PREFIX + "forca cat <número>*_\n" +
          "_Grupo: *" + PREFIX + "forca cat <número> g*_"
        );
      }

      if (num < 1 || num > CATEGORIAS.length) {
        return sendWarningReply(
          "Número inválido! Escolha entre 1 e " + CATEGORIAS.length + ".\n" +
          "Use *" + PREFIX + "forca cat* para ver a lista."
        );
      }

      const categoria = CATEGORIAS[num - 1];
      return _iniciarJogo({ modo, categoria, nome, userLid, remoteJid, socket, sendReply, sendWarningReply, webMessage });
    }

    // ── .forca g ──────────────────────────────────────────────────────────────
    if (sub === "g" || sub === "grupo") {
      return _iniciarJogo({ modo: "grupo", categoria: null, nome, userLid, remoteJid, socket, sendReply, sendWarningReply, webMessage });
    }

    // ── .forca (sem argumento) → mostra ajuda ────────────────────────────────
    if (sub === "") {
      return sendReply(
        "🎮 *JOGO DA FORCA*\n\n" +
        "Escolha um modo abaixo:\n\n" +
        "━━━━━━━━━━━━━━━━━━━━\n" +
        "👤 *INDIVIDUAL*\n" +
        "_Você joga sozinho. Só você vê e responde as letras._\n" +
        "▶️ *" + PREFIX + "forca i*\n\n" +
        "━━━━━━━━━━━━━━━━━━━━\n" +
        "👥 *EM GRUPO*\n" +
        "_Todo o grupo participa! Cada um manda uma letra._\n" +
        "_Na 1ª vez, responda a mensagem da forca com sua letra._\n" +
        "▶️ *" + PREFIX + "forca g*\n\n" +
        "━━━━━━━━━━━━━━━━━━━━\n" +
        "🏷️ *POR CATEGORIA*\n" +
        "_Escolha o tema da palavra antes de começar._\n" +
        "_Individual ou grupo, você decide!_\n" +
        "▶️ *" + PREFIX + "forca cat* — ver categorias\n" +
        "▶️ *" + PREFIX + "forca cat <n>* — individual\n" +
        "▶️ *" + PREFIX + "forca cat <n> g* — grupo\n\n" +
        "━━━━━━━━━━━━━━━━━━━━\n" +
        "💡 *DURANTE O JOGO*\n" +
        "*" + PREFIX + "forca dica* — revela categoria + uma letra grátis\n" +
        "*" + PREFIX + "forca desistir* — encerra o jogo atual"
      );
    }

    // ── .forca i (individual, categoria aleatória) ────────────────────────────
    if (sub === "i" || sub === "individual" || sub === "novo") {
      return _iniciarJogo({ modo: "individual", categoria: null, nome, userLid, remoteJid, socket, sendReply, sendWarningReply, webMessage });
    }

    // Sub-comando desconhecido
    return sendWarningReply(
      "❓ Sub-comando inválido!\n\n" +
      "*Uso:*\n" +
      PREFIX + "forca — individual aleatório\n" +
      PREFIX + "forca g — grupo aleatório\n" +
      PREFIX + "forca cat — ver categorias\n" +
      PREFIX + "forca cat <n> — individual com categoria\n" +
      PREFIX + "forca cat <n> g — grupo com categoria\n" +
      PREFIX + "forca dica — pegar dica\n" +
      PREFIX + "forca desistir — encerrar jogo"
    );
  },
};

// ─── HELPER: iniciar jogo ─────────────────────────────────────────────────────
async function _iniciarJogo({ modo, categoria, nome, userLid, remoteJid, socket, sendReply, sendWarningReply, webMessage }) {
  if (modo === "individual") {
    if (gamesIndividual.has(userLid)) {
      const g = gamesIndividual.get(userLid);
      await editOrSend(socket, remoteJid, g.msgKey,
        buildGameText(g, "🎮 *FORCA INDIVIDUAL*\n⚠️ Você já tem um jogo em andamento!"),
        sendReply
      );
      return;
    }

    const sorteio = sortearPalavra(categoria);
    const newGame = {
      palavra:      sorteio.palavra,
      categoria:    sorteio.categoria,
      acertos:      [],
      erros:        0,
      letrasUsadas: [],
      dicaUsada:    false,
      msgKey:       null,
      dono:         userLid,
      remoteJid,
    };
    gamesIndividual.set(userLid, newGame);

    const texto =
      "🎮 *FORCA INDIVIDUAL — " + nome + "*\n\n" +
      "```\n" + FORCA_IMGS[0] + "```\n\n" +
      "📝 `" + buildDisplay(sorteio.palavra, []) + "`\n" +
      "🏷️ " + sorteio.categoria + "  |  📏 *" + sorteio.palavra.length + "* letras\n" +
      "❌ Erros: *0/6*\n" +
      "🔤 Letras: nenhuma ainda\n\n" +
      "_Digite uma letra direto no chat!_\n" +
      "_Dica: *" + PREFIX + "forca dica*  |  Desistir: *" + PREFIX + "forca desistir*_";

    const sentMsg = await sendReply(texto);
    // CORREÇÃO: salva apenas o .key para edição futura
    newGame.msgKey = sentMsg?.key || null;
    return;
  }

  // ── GRUPO ──────────────────────────────────────────────────────────────────
  if (gamesGrupo.has(remoteJid)) {
    const g = gamesGrupo.get(remoteJid);
    await editOrSend(socket, remoteJid, g.msgKey,
      buildGameText(g, "🎮 *FORCA EM GRUPO*\n⚠️ Já tem um jogo em andamento!"),
      sendReply
    );
    return;
  }

  const sorteio = sortearPalavra(categoria);
  const newGame = {
    palavra:      sorteio.palavra,
    categoria:    sorteio.categoria,
    acertos:      [],
    erros:        0,
    letrasUsadas: [],
    dicaUsada:    false,
    msgKey:       null,
    jogadores:    new Set(),
    remoteJid,
  };
  gamesGrupo.set(remoteJid, newGame);

  const texto =
    "🎮 *FORCA EM GRUPO!*\n\n" +
    "```\n" + FORCA_IMGS[0] + "```\n\n" +
    "📝 `" + buildDisplay(sorteio.palavra, []) + "`\n" +
    "🏷️ " + sorteio.categoria + "  |  📏 *" + sorteio.palavra.length + "* letras\n" +
    "❌ Erros: *0/6*\n" +
    "🔤 Letras: nenhuma ainda\n\n" +
    "⚠️ _Para participar, *responda esta mensagem* com sua letra!_\n" +
    "_Depois não precisa mais marcar._\n" +
    "_Dica: *" + PREFIX + "forca dica*  |  Desistir: *" + PREFIX + "forca desistir*_";

  const sentMsg = await sendReply(texto);
  // CORREÇÃO: salva apenas o .key para edição futura
  newGame.msgKey = sentMsg?.key || null;
}
