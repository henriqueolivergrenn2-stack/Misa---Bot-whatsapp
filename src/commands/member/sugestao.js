/**
 * Comando: sugestao / sugerir / feedback
 * Envia a sugestão do usuário direto para o número do dono via WhatsApp.
 * Salve em: src/commands/member/sugestao.js
 */

import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import { errorLog, infoLog } from "../../utils/logger.js";

// Número do dono — recebe as sugestões
const DONO_JID = "5521969869469@s.whatsapp.net";

/**
 * Resolve o número de telefone real do remetente.
 *
 * WhatsApp novo usa @lid (ID interno) no key.participant dos grupos.
 * Para obter o telefone, cruzamos o LID com a lista de participantes
 * do grupo — cada participante tem { id: "telefone@s.whatsapp.net", lid: "xxx@lid" }.
 *
 * Fluxo:
 *  1. Se key.participant já for @s.whatsapp.net → extrai o número direto
 *  2. Se for @lid → busca na lista de participantes do grupo pelo lid
 *  3. Fallback → retorna os dígitos do LID (não é o telefone, mas é algo)
 */
async function getNumeroReal(socket, webMessage) {
  const raw = webMessage?.key?.participant || "";
  const jid = raw.replace(/:[0-9]+/, ""); // remove sufixo de dispositivo (:12)

  // ── Caso 1: já é JID de telefone ─────────────────────────────────────────
  if (jid.endsWith("@s.whatsapp.net")) {
    return jid.replace("@s.whatsapp.net", "");
  }

  // ── Caso 2: é @lid → tenta resolver via participantes do grupo ───────────
  if (jid.endsWith("@lid")) {
    const groupJid = webMessage?.key?.remoteJid;
    if (groupJid?.endsWith("@g.us")) {
      try {
        const meta = await socket.groupMetadata(groupJid);
        // Procura o participante cujo lid == nosso jid
        const found = meta?.participants?.find(
          (p) => p.lid === jid || p.id === jid
        );
        // found.id é "telefone@s.whatsapp.net" nas versões com LID
        if (found?.id?.endsWith("@s.whatsapp.net")) {
          return found.id.replace("@s.whatsapp.net", "");
        }
      } catch {
        // groupMetadata falhou, segue pro fallback
      }
    }
  }

  // ── Fallback: extrai dígitos (pode ser LID, não telefone) ─────────────────
  const digits = jid.replace(/[^0-9]/g, "");
  return digits || null;
}

/**
 * Busca o nome do grupo pelo remoteJid.
 * Retorna null se for chat privado.
 */
async function getNomeGrupo(socket, remoteJid) {
  if (!remoteJid?.endsWith("@g.us")) return null;
  try {
    const meta = await socket.groupMetadata(remoteJid);
    return meta?.subject || null;
  } catch {
    return null;
  }
}

export default {
  name: "sugestao",
  description: "Envie uma sugestão ou feedback para o dono do bot.",
  commands: ["sugestao", "sugerir", "feedback"],
  usage: `${PREFIX}sugestao <mensagem>`,

  handle: async ({
    sendReply,
    sendSuccessReact,
    sendErrorReply,
    socket,
    remoteJid,
    webMessage,
    fullArgs,
  }) => {
    const texto = fullArgs?.trim();

    if (!texto) {
      throw new InvalidParameterError(
        `Envie sua sugestão junto ao comando!\n\n` +
        `*Exemplo:* *${PREFIX}sugestao Adiciona o comando .clima*`
      );
    }

    if (texto.length < 5) {
      throw new InvalidParameterError("Sugestão muito curta! Escreva pelo menos 5 caracteres.");
    }

    if (texto.length > 500) {
      throw new InvalidParameterError("Sugestão muito longa! Máximo de 500 caracteres.");
    }

    const nome     = webMessage?.pushName || "Usuário";
    const dataHora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    // Resolve número e nome do grupo em paralelo
    const [numero, nomeGrupo] = await Promise.all([
      getNumeroReal(socket, webMessage),
      getNomeGrupo(socket, remoteJid),
    ]);

    const grupoInfo = nomeGrupo ? `\n📍 *Grupo:* ${nomeGrupo}` : "";

    const msgDono =
      `💡 *NOVA SUGESTÃO*\n\n` +
      `👤 *De:* ${nome}\n` +
      `📱 *Número:* ${numero ? `+${numero}` : "Não disponível"}${grupoInfo}\n` +
      `🕐 *Data:* ${dataHora}\n\n` +
      `💬 *Mensagem:*\n${texto}`;

    try {
      infoLog(`[sugestao] Enviando sugestão de ${nome} (${numero ?? "?"}) para o dono...`);

      await socket.sendMessage(DONO_JID, { text: msgDono });

      infoLog(`[sugestao] Sugestão enviada com sucesso!`);
      await sendSuccessReact();
      await sendReply(
        `✅ *Sugestão enviada com sucesso!*\n\n` +
        `Obrigado pelo feedback, *${nome}*! 🙏\n` +
        `O dono do bot vai analisar sua sugestão.`
      );
    } catch (error) {
      errorLog(`[sugestao] Erro ao enviar: ${error.message}`);
      await sendErrorReply(
        `Não foi possível enviar sua sugestão agora.\nTente novamente mais tarde.`
      );
    }
  },
};
