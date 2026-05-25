/**
 * Comando: batalhanaval
 * Minigame de batalha naval no WhatsApp.
 * - Tabuleiro 5x5
 * - 3 navios escondidos
 * - Jogador tem 10 tentativas
 * - Funciona em grupos e privado
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAMES_FILE = path.resolve(
  __dirname,
  "../../../../database/batalhanaval.json"
);

// Configurações do jogo
const TAMANHO = 5;
const TOTAL_NAVIOS = 3;
const MAX_TENTATIVAS = 10;

// Emojis
const AGUA = "🟦";
const NAVIO_OCULTO = "🟦";
const ACERTO = "💥";
const ERRO = "⬜";
const NAVIO_REVELADO = "🚢";

function loadGames() {
  try {
    if (!fs.existsSync(GAMES_FILE)) {
      fs.mkdirSync(path.dirname(GAMES_FILE), { recursive: true });
      fs.writeFileSync(GAMES_FILE, "{}", "utf-8");
    }
    return JSON.parse(fs.readFileSync(GAMES_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveGames(data) {
  fs.writeFileSync(GAMES_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function criarTabuleiro() {
  return Array.from({ length: TAMANHO }, () => Array(TAMANHO).fill(0));
}

function posicionarNavios(tabuleiro) {
  let colocados = 0;
  while (colocados < TOTAL_NAVIOS) {
    const row = Math.floor(Math.random() * TAMANHO);
    const col = Math.floor(Math.random() * TAMANHO);
    if (tabuleiro[row][col] === 0) {
      tabuleiro[row][col] = 1; // 1 = navio
      colocados++;
    }
  }
  return tabuleiro;
}

function renderTabuleiro(tabuleiro, revelado = false) {
  const colunas = ["A", "B", "C", "D", "E"];
  let texto = "➖A    B    C    D   E\n";

  for (let r = 0; r < TAMANHO; r++) {
    texto += `${["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"][r]}`;
    for (let c = 0; c < TAMANHO; c++) {
      const celula = tabuleiro[r][c];
      if (celula === 2) texto += ACERTO;        // acertou navio
      else if (celula === 3) texto += ERRO;     // errou
      else if (celula === 1 && revelado) texto += NAVIO_REVELADO; // navio revelado no fim
      else texto += AGUA;                        // água desconhecida
    }
    texto += "\n";
  }

  return texto;
}

function parseCoordenada(input) {
  // Aceita formatos: "A1", "1A", "a1", "1 a", etc
  const clean = input.toUpperCase().replace(/\s/g, "");
  const match = clean.match(/^([A-E])([1-5])$/) || clean.match(/^([1-5])([A-E])$/);

  if (!match) return null;

  let letra, numero;
  if (isNaN(match[1])) {
    letra = match[1];
    numero = match[2];
  } else {
    numero = match[1];
    letra = match[2];
  }

  const col = ["A", "B", "C", "D", "E"].indexOf(letra);
  const row = parseInt(numero) - 1;

  return { row, col };
}

function novoJogo(userId) {
  const tabuleiro = posicionarNavios(criarTabuleiro());
  return {
    userId,
    tabuleiro,
    tentativas: 0,
    acertos: 0,
    iniciado: Date.now(),
  };
}

export default {
  name: "batalhanaval",
  description: "Minigame de batalha naval! Afunde os navios inimigos!",
  commands: ["batalhanaval", "naval", "bn"],
  usage: `${PREFIX}batalhanaval | ${PREFIX}batalhanaval A1 | ${PREFIX}batalhanaval desistir`,

  handle: async ({
    sendReply,
    sendSuccessReact,
    sendReact,
    fullArgs,
    userLid,
    remoteJid,
  }) => {
    const games = loadGames();
    const gameKey = `${remoteJid}_${userLid}`;
    const args = fullArgs.trim().toLowerCase();

    // ── DESISTIR ──────────────────────────────────────────
    if (args === "desistir" || args === "sair" || args === "cancelar") {
      if (!games[gameKey]) {
        throw new WarningError("Você não tem nenhum jogo em andamento!");
      }

      const jogo = games[gameKey];
      const tabuleiroFinal = renderTabuleiro(jogo.tabuleiro, true);
      delete games[gameKey];
      saveGames(games);

      await sendReact("🏳️");
      await sendReply(
        `🏳️ *Você desistiu!*\n\n` +
        `Veja onde estavam os navios:\n\n${tabuleiroFinal}`
      );
      return;
    }

    // ── NOVO JOGO ─────────────────────────────────────────
    if (!args || args === "novo" || args === "iniciar" || args === "start") {
      if (games[gameKey]) {
        throw new WarningError(
          `Você já tem um jogo em andamento!\n\n` +
          `Use *${PREFIX}bn <coordenada>* para jogar (ex: *${PREFIX}bn A3*)\n` +
          `Ou *${PREFIX}bn desistir* para abandonar.`
        );
      }

      const jogo = novoJogo(userLid);
      games[gameKey] = jogo;
      saveGames(games);

      const tabuleiro = renderTabuleiro(jogo.tabuleiro);

      await sendSuccessReact();
      await sendReply(
        `⚓ *BATALHA NAVAL* ⚓\n\n` +
        `🎯 Encontre e afunde os *${TOTAL_NAVIOS} navios* escondidos!\n` +
        `💣 Você tem *${MAX_TENTATIVAS} tentativas*\n\n` +
        `${tabuleiro}\n` +
        `📍 *Como jogar:*\n` +
        `Digite a coordenada: *${PREFIX}bn A1*\n` +
        `Coluna (A-E) + Linha (1-5)\n\n` +
        `${ACERTO} = Acerto | ${ERRO} = Erro | ${AGUA} = Água`
      );
      return;
    }

    // ── JOGADA ────────────────────────────────────────────
    if (!games[gameKey]) {
      throw new WarningError(
        `Você não tem nenhum jogo em andamento!\n\nUse *${PREFIX}batalhanaval* para começar!`
      );
    }

    const coord = parseCoordenada(args);

    if (!coord) {
      throw new InvalidParameterError(
        `Coordenada inválida! Use letra (A-E) + número (1-5)\n\nExemplo: *${PREFIX}bn A3* ou *${PREFIX}bn B5*`
      );
    }

    const jogo = games[gameKey];
    const { row, col } = coord;
    const celula = jogo.tabuleiro[row][col];

    // Já foi jogado nessa posição
    if (celula === 2 || celula === 3) {
      throw new WarningError(
        `Você já jogou nessa posição! Escolha outra coordenada.`
      );
    }

    jogo.tentativas++;

    let mensagem = "";
    let emoji = "";

    if (celula === 1) {
      // ACERTO
      jogo.tabuleiro[row][col] = 2;
      jogo.acertos++;
      emoji = "💥";
      mensagem = `💥 *ACERTO!* Você afundou um navio em ${args.toUpperCase()}!`;
    } else {
      // ERRO
      jogo.tabuleiro[row][col] = 3;
      emoji = "💦";
      mensagem = `💦 *Água!* Nenhum navio em ${args.toUpperCase()}.`;
    }

    const tentativasRestantes = MAX_TENTATIVAS - jogo.tentativas;
    const tabuleiro = renderTabuleiro(jogo.tabuleiro);

    // ── VITÓRIA ───────────────────────────────────────────
    if (jogo.acertos === TOTAL_NAVIOS) {
      delete games[gameKey];
      saveGames(games);

      await sendReact("🏆");
      await sendReply(
        `🏆 *VOCÊ VENCEU!* 🏆\n\n` +
        `${mensagem}\n\n` +
        `${tabuleiro}\n` +
        `✅ Todos os *${TOTAL_NAVIOS} navios* afundados!\n` +
        `🎯 Tentativas usadas: *${jogo.tentativas}/${MAX_TENTATIVAS}*\n\n` +
        `⭐ ${jogo.tentativas <= 5 ? "Incrível! Mestre da batalha naval!" : jogo.tentativas <= 7 ? "Muito bem!" : "Conseguiu!"}`
      );
      return;
    }

    // ── DERROTA ───────────────────────────────────────────
    if (jogo.tentativas >= MAX_TENTATIVAS) {
      const tabuleiroFinal = renderTabuleiro(jogo.tabuleiro, true);
      delete games[gameKey];
      saveGames(games);

      await sendReact("💀");
      await sendReply(
        `💀 *GAME OVER!* Sem mais tentativas!\n\n` +
        `${mensagem}\n\n` +
        `${tabuleiroFinal}\n` +
        `🚢 Navios afundados: *${jogo.acertos}/${TOTAL_NAVIOS}*\n\n` +
        `Use *${PREFIX}batalhanaval* para jogar novamente!`
      );
      return;
    }

    // ── CONTINUA ──────────────────────────────────────────
    games[gameKey] = jogo;
    saveGames(games);

    await sendReact(emoji);
    await sendReply(
      `${mensagem}\n\n` +
      `${tabuleiro}\n` +
      `💣 Tentativas restantes: *${tentativasRestantes}*\n` +
      `🚢 Navios afundados: *${jogo.acertos}/${TOTAL_NAVIOS}*`
    );
  },
};