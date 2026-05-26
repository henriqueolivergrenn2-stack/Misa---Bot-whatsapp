/**
 * Direcionador
 * de comandos.
 *
 * @author Dev Gui
 */
// @charset utf-8
import { BOT_EMOJI, ONLY_GROUP_ID } from "../config.js";
import {
  DangerError,
  InvalidParameterError,
  WarningError,
} from "../errors/index.js";
import {
  checkPermission,
  hasTypeAndCommand,
  isAdmin,
  isBotOwner,
  isLink,
  verifyPrefix,
} from "../middlewares/index.js";
import { processAutoSticker } from "../services/sticker.js";
import { badMacHandler } from "./badMacHandler.js";
import {
  getAutoResponderResponse,
  getPrefix,
  isActiveAntiLinkGroup,
  isActiveAutoResponderGroup,
  isActiveAutoStickerGroup,
  isActiveGroup,
  isActiveOnlyAdmins,
} from "./database.js";
import { findCommandImport, formatCommand, onlyNumbers, readCommandImports } from "./index.js";
import { errorLog } from "./logger.js";
import { trackActivity } from "./activityTracker.js";
import { processVelhaMove } from "./velhaManager.js";
import { grantPassiveGold, processGoldEvent } from "./goldManager.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { processMarvelTest } from "./marvelTestManager.js";
import { isPvBloqueado } from "./pvBlock.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUGGESTIONS_FILE = path.resolve(__dirname, "fixedSuggestions.json");

function loadFixedSuggestions() {
  try {
    if (!fs.existsSync(SUGGESTIONS_FILE)) {
      return ["menu", "anime", "perfil", "suporte"];
    }
    const data = JSON.parse(fs.readFileSync(SUGGESTIONS_FILE, "utf-8"));
    const base = ["menu", "anime", "perfil", "suporte"];
    for (const name of base) {
      if (!data.includes(name)) data.push(name);
    }
    return data;
  } catch {
    return ["menu", "anime", "perfil", "suporte"];
  }
}

function lidToJid(lid) {
  if (!lid) return null;
  return `${onlyNumbers(lid)}@s.whatsapp.net`;
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0
    )
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function similarityScore(input, cmd) {
  if (cmd.startsWith(input)) return 0.1;
  if (input.startsWith(cmd)) return 0.5;

  const dist = levenshtein(input, cmd);
  const maxLen = Math.max(input.length, cmd.length);
  const ratio = dist / maxLen;

  if (ratio > 0.6) return Infinity;
  return ratio;
}

async function sendCommandSuggestion(commandName, sendWarningReply, groupPrefix) {
  try {
    const commandImports = await readCommandImports();
    const allCommandNames = [];

    for (const commands of Object.values(commandImports)) {
      for (const cmd of commands) {
        if (Array.isArray(cmd?.commands)) {
          for (const name of cmd.commands) {
            const formatted = formatCommand(name);
            if (!allCommandNames.includes(formatted)) {
              allCommandNames.push(formatted);
            }
          }
        }
      }
    }

    const fixed = loadFixedSuggestions();
    for (const name of fixed) {
      if (!allCommandNames.includes(name)) {
        allCommandNames.push(name);
      }
    }

    const scored = allCommandNames
      .map((cmd) => ({ cmd, score: similarityScore(commandName, cmd) }))
      .filter(({ score, cmd }) => score < Infinity && cmd !== commandName)
      .sort((a, b) => a.score - b.score)
      .slice(0, 1)
      .map(({ cmd }) => cmd);

    if (scored.length) {
      const suggestions = scored.map((cmd) => `› *${groupPrefix}${cmd}*`).join("\n");
      await sendWarningReply(
        `Comando *${groupPrefix}${commandName}* não encontrado!\n\n💡 *Você quis dizer?*\n${suggestions}`
      );
    } else {
      await sendWarningReply(
        `Comando *${groupPrefix}${commandName}* não encontrado!\n\nUse *${groupPrefix}menu* para ver todos os comandos disponíveis.`
      );
    }
  } catch (err) {
    errorLog(`Erro ao buscar sugestões de comando: ${err.message}`);
    await sendWarningReply(
      `Comando não encontrado! Use ${groupPrefix}menu para ver os comandos disponíveis!`
    );
  }
}

/**
 * @param {CommandHandleProps} paramsHandler
 * @param {number} startProcess
 */
export async function dynamicCommand(paramsHandler, startProcess) {
  const {
    commandName,
    fullMessage,
    prefix,
    remoteJid,
    sendErrorReply,
    sendReact,
    sendReply,
    sendWarningReply,
    socket,
    userLid,
    webMessage,
  } = paramsHandler;

  const activeGroup = isActiveGroup(remoteJid);
  const isPrivado = !remoteJid?.endsWith("@g.us");

  // 🔒 Bloqueia comandos no privado silenciosamente (exceto dono do bot)
  if (isPrivado && !isBotOwner({ userLid }) && isPvBloqueado()) {
    return;
  }

  // ✅ Rastreia atividade + concede Gold passivo silencioso
  if (activeGroup && userLid) {
    try {
      const pushname  = webMessage?.pushName || "Usuário";
      const isSticker = !!webMessage?.message?.stickerMessage;
      const msgText   =
        webMessage?.message?.conversation ||
        webMessage?.message?.extendedTextMessage?.text ||
        webMessage?.message?.imageMessage?.caption ||
        webMessage?.message?.videoMessage?.caption ||
        "";
      const groupPrefix = getPrefix(remoteJid);
      const isCommand   = msgText.startsWith(groupPrefix);

      if (isSticker) {
        trackActivity(remoteJid, userLid, pushname, "sticker");
      } else if (isCommand) {
        trackActivity(remoteJid, userLid, pushname, "command");
      } else {
        trackActivity(remoteJid, userLid, pushname, "message");
      }

      // após o bloco do processGoldEvent:
      if (activeGroup) {
        const marvelProcessed = await processMarvelTest(paramsHandler);
        if (marvelProcessed) return;
      }

      // 💰 Gold passivo — silencioso, sem notificação
      // Comandos não concedem Gold passivo (evita farm via bot)
      if (!isCommand) {
        grantPassiveGold(userLid, pushname, remoteJid, webMessage);
      }
    } catch (err) {
      errorLog(`Erro ao rastrear atividade: ${err.message}`);
    }
  }

  if (activeGroup && isActiveAntiLinkGroup(remoteJid) && isLink(fullMessage)) {
    if (!userLid) return;

    const userIsAdmin = await isAdmin({ remoteJid, userLid, socket });

    if (!userIsAdmin) {
      try {
        await socket.sendMessage(remoteJid, {
          delete: {
            remoteJid,
            fromMe: false,
            id: webMessage.key.id,
            participant: webMessage.key.participant,
          },
        });
      } catch (err) {
        errorLog(`Anti-link: erro ao apagar mensagem: ${err.message}`);
      }

      try {
        await sendReply("🚫 Anti-link ativado! Você foi removido por enviar um link!");
      } catch (err) {
        errorLog(`Anti-link: erro ao enviar aviso: ${err.message}`);
      }

      try {
        const userJid = lidToJid(userLid);
        await socket.groupParticipantsUpdate(remoteJid, [userJid], "remove");
      } catch (err) {
        errorLog(`Anti-link: erro ao remover participante: ${err.message}`);
      }

      return;
    }
  }

  if (activeGroup && isActiveAutoStickerGroup(remoteJid)) {
    const processed = await processAutoSticker(paramsHandler);
    if (processed) return;
  }

  // ✅ Jogo da Velha — intercepta jogadas (1-9) sem prefixo
  if (activeGroup) {
    const velhaProcessed = await processVelhaMove(paramsHandler);
    if (velhaProcessed) return;
  }

  // ✅ Eventos de Gold — intercepta emoji do evento e verifica novo disparo (5h)
  if (activeGroup) {
    const goldEventProcessed = await processGoldEvent(paramsHandler);
    if (goldEventProcessed) return;
  }

  const { type, command } = await findCommandImport(commandName);

  if (ONLY_GROUP_ID && ONLY_GROUP_ID !== remoteJid) return;

  if (activeGroup) {
    if (!verifyPrefix(prefix, remoteJid) || !hasTypeAndCommand({ type, command })) {
      if (isActiveAutoResponderGroup(remoteJid)) {
        const response = getAutoResponderResponse(fullMessage);
        if (response) await sendReply(response);
      }

      if (fullMessage.toLocaleLowerCase().includes("prefixo")) {
        await sendReact(BOT_EMOJI);
        const gPrefix = getPrefix(remoteJid);
        await sendReply(
          `O padrão é: ${gPrefix}\nUse ${gPrefix}menu para ver os comandos disponíveis!`
        );
        return;
      }

      if (verifyPrefix(prefix, remoteJid) && !hasTypeAndCommand({ type, command })) {
        const gPrefix = getPrefix(remoteJid);
        await sendCommandSuggestion(commandName, sendWarningReply, gPrefix);
      }

      return;
    }

    if (!(await checkPermission({ type, ...paramsHandler }))) {
      await sendErrorReply("Você não tem permissão para executar este comando!");
      return;
    }

    if (
      isActiveOnlyAdmins(remoteJid) &&
      !(await isAdmin({ remoteJid, userLid, socket }))
    ) {
      await sendWarningReply("Somente administradores podem executar comandos!");
      return;
    }
  }

  if (!isBotOwner({ userLid }) && !activeGroup) {
    if (verifyPrefix(prefix, remoteJid) && hasTypeAndCommand({ type, command })) {
      if (command.name !== "on") {
        await sendWarningReply(
          "Este grupo está desativado! Peça para o dono do grupo ativar o bot!"
        );
        return;
      }

      if (!(await checkPermission({ type, ...paramsHandler }))) {
        await sendErrorReply("Você não tem permissão para executar este comando!");
        return;
      }
    } else {
      return;
    }
  }

  if (!verifyPrefix(prefix, remoteJid)) return;

  const groupPrefix = getPrefix(remoteJid);

  if (fullMessage === groupPrefix) {
    await sendReact(BOT_EMOJI);
    await sendReply(
      `Este é meu prefixo! Use ${groupPrefix}menu para ver os comandos disponíveis!`
    );
    return;
  }

  if (!hasTypeAndCommand({ type, command })) {
    await sendCommandSuggestion(commandName, sendWarningReply, groupPrefix);
    return;
  }

  try {
    await command.handle({ ...paramsHandler, type, startProcess });
  } catch (error) {
    if (badMacHandler.handleError(error, `command:${command?.name}`)) {
      await sendWarningReply(
        "Erro temporário de sincronização. Tente novamente em alguns segundos."
      );
      return;
    }

    if (badMacHandler.isSessionError(error)) {
      errorLog(`Erro de sessão durante execução de comando ${command?.name}: ${error.message}`);
      await sendWarningReply("Erro de comunicação. Tente executar o comando novamente.");
      return;
    }

    if (error instanceof InvalidParameterError) {
      await sendWarningReply(`Parâmetros inválidos! ${error.message}`);
    } else if (error instanceof WarningError) {
      await sendWarningReply(error.message);
    } else if (error instanceof DangerError) {
      await sendErrorReply(error.message);
    } else if (error.isAxiosError) {
      const messageText = error.response?.data?.message || error.message;
      const url = error.config?.url || "URL não disponível";
      const isSpiderAPIError = url.includes("api.spiderx.com.br");
      await sendErrorReply(
        `Ocorreu um erro ao executar uma chamada remota para ${
          isSpiderAPIError ? "a Spider X API" : url
        } no comando ${command.name}!\n\n🔄 *Detalhes*: ${messageText}`
      );
    } else {
      errorLog("Erro ao executar comando", error);
      await sendErrorReply(
        `Ocorreu um erro ao executar o comando ${command.name}!\n\n🔄 *Detalhes*: ${error.message}`
      );
    }
  }
}
