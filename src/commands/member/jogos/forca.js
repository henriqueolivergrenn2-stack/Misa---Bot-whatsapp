/**
 * Jogo da Forca — sem API, 100% local
 * Salve em: src/commands/member/jogos/forca.js
 *
 * .forca        → inicia novo jogo
 * .forca <letra> → tenta uma letra
 * .forca desistir → cancela o jogo
 */
import { PREFIX } from "../../../config.js";
import { addGold, fmt, getPlayer } from "../../../utils/economy.js";

const PALAVRAS = [
  // Animais
  "gato","cachorro","elefante","girafa","pinguim","tubarao","papagaio","camelo",
  // Países
  "brasil","argentina","portugal","australia","japao","canada","mexico","italia",
  // Frutas
  "abacaxi","morango","melancia","goiaba","manga","caju","acerola","pitanga",
  // Tecnologia
  "computador","internet","smartphone","javascript","programador","software","hardware",
  // Esportes
  "futebol","basquete","natacao","voleibol","tenis","ciclismo","atletismo",
  // Aleatório
  "aventura","floresta","montanha","oceano","tempestade","relampago","arco-iris",
  "biblioteca","universidade","comunicacao","democracia","filosofia",
];

// Mapa em memória: chatId -> { palavra, acertos, erros, letrasUsadas, premio }
const GAMES = new Map();

const FORCA_IMGS = [
  "  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========",
];

function buildPalavra(palavra, acertos) {
  return palavra.split("").map(c => (c === "-" || acertos.includes(c)) ? c : "\_").join(" ");
}

export default {
  name: "forca",
  description: "Jogo da forca clássico! Adivinhe a palavra e ganhe gold.",
  commands: ["forca"],
  usage: `${PREFIX}forca | ${PREFIX}forca <letra>`,
  handle: async ({ sendReply, sendWarningReply, sendSuccessReact, userLid, webMessage, fullArgs, remoteJid }) => {
    const p     = getPlayer(userLid, webMessage?.pushName);
    const input = fullArgs?.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const gameId = remoteJid + "_forca_" + userLid;
    const game  = GAMES.get(gameId);

    // Desistir
    if (input === "desistir" || input === "sair") {
      if (!game) return sendWarningReply("Nenhum jogo de forca em andamento!");
      GAMES.delete(gameId);
      return sendReply(`🏳️ Você desistiu!\n\n📝 A palavra era: *${game.palavra.toUpperCase()}*`);
    }

    // Novo jogo (sem argumento ou nova palavra)
    if (!input || input === "novo") {
      if (game) return sendWarningReply(`Você já tem um jogo em andamento!\n\nPalavra: \`${buildPalavra(game.palavra, game.acertos)}\`\nErros: *${game.erros}/6*\n\nUse *${PREFIX}forca <letra>* ou *${PREFIX}forca desistir*`);
      const palavra = PALAVRAS[Math.floor(Math.random() * PALAVRAS.length)];
      const premio  = 50 + palavra.length * 30;
      GAMES.set(gameId, { palavra, acertos: [], erros: 0, letrasUsadas: [], premio });
      const g2 = GAMES.get(gameId);
      return sendReply(
        `🎮 *JOGO DA FORCA INICIADO!*\n\n` +
        `\`\`\`\n${FORCA_IMGS[0]}\`\`\`\n\n` +
        `📝 Palavra: \`${buildPalavra(palavra, [])}\`\n` +
        `📏 ${palavra.length} letras\n` +
        `💰 Prêmio: *${fmt(premio)} 🪙*\n\n` +
        `_Use *${PREFIX}forca <letra>* para tentar!_`
      );
    }

    // Tentar letra
    if (!game) return sendWarningReply(`Nenhum jogo ativo! Use *${PREFIX}forca* para começar.`);
    if (input.length !== 1) return sendWarningReply("Mande apenas *uma letra* por vez!");

    const letra = input;
    if (game.letrasUsadas.includes(letra))
      return sendWarningReply(`Você já usou a letra *${letra.toUpperCase()}*!\n\nUsadas: ${game.letrasUsadas.join(", ").toUpperCase()}`);

    game.letrasUsadas.push(letra);

    if (game.palavra.includes(letra)) {
      game.acertos.push(letra);
    } else {
      game.erros++;
    }

    const display = buildPalavra(game.palavra, game.acertos);
    const venceu  = !display.includes("\_");
    const perdeu  = game.erros >= 6;

    const forca = `\`\`\`\n${FORCA_IMGS[Math.min(game.erros, 6)]}\`\`\``;

    if (venceu) {
      GAMES.delete(gameId);
      const bonus = Math.max(0, (6 - game.erros) * 20);
      const total = game.premio + bonus;
      addGold(userLid, total);
      await sendSuccessReact();
      return sendReply(
        `🎉 *VOCÊ GANHOU!*\n\n${forca}\n\n` +
        `📝 Palavra: *${game.palavra.toUpperCase()}*\n\n` +
        `💰 Prêmio: *+${fmt(total)} 🪙*\n` +
        `_(inclui bônus de ${bonus} por erros poupados)_`
      );
    }

    if (perdeu) {
      GAMES.delete(gameId);
      return sendReply(
        `💀 *VOCÊ PERDEU!*\n\n${forca}\n\n` +
        `📝 A palavra era: *${game.palavra.toUpperCase()}*\n\n` +
        `_Tente novamente: *${PREFIX}forca*_`
      );
    }

    return sendReply(
      `🎮 *JOGO DA FORCA*\n\n${forca}\n\n` +
      `📝 Palavra: \`${display}\`\n` +
      `❌ Erros: *${game.erros}/6*\n` +
      `🔤 Usadas: ${game.letrasUsadas.join(" ").toUpperCase()}\n` +
      `💰 Prêmio: *${fmt(game.premio)} 🪙*\n\n` +
      `_Mande uma letra!_`
    );
  },
};
