/**
 * ✅ Aceitar todas as solicitações pendentes do grupo
 * src/commands/admin/aceitartodos.js
 *
 * Uso: .aceitartodos
 * Requer: bot e usuário como administradores do grupo
 */

import { PREFIX } from "../../config.js";

export default {
  name: "aceitartodos",
  description: "Aceita todas as solicitações de entrada pendentes no grupo.",
  commands: ["aceitartodos", "aprovarsolicitacoes", "aceitarsolicitacoes"],
  usage: `${PREFIX}aceitartodos`,

  handle: async ({
    sendReply,
    sendWarningReply,
    sendErrorReply,
    sendWaitReact,
    sendSuccessReact,
    socket,
    remoteJid,
  }) => {
    if (!remoteJid?.endsWith("@g.us")) {
      return sendWarningReply("Este comando só funciona em grupos!");
    }

    await sendWaitReact();

    // ── Busca solicitações pendentes ───────────────────────────────────────────
    let pendentes = [];
    try {
      pendentes = await socket.groupRequestParticipantsList(remoteJid);
    } catch (err) {
      return sendErrorReply(
        `Não foi possível buscar as solicitações!\n\n` +
        `📄 *Detalhes:* ${err.message}\n\n` +
        `_Verifique se o bot é administrador do grupo._`
      );
    }

    if (!pendentes || pendentes.length === 0) {
      return sendReply("✅ Não há solicitações pendentes no momento!");
    }

    // ── Aprova todas ───────────────────────────────────────────────────────────
    const jids = pendentes.map(p => p.jid);

    try {
      await socket.groupRequestParticipantsUpdate(remoteJid, jids, "approve");
    } catch (err) {
      return sendErrorReply(
        `Erro ao aprovar as solicitações!\n\n` +
        `📄 *Detalhes:* ${err.message}`
      );
    }

    await sendSuccessReact();
    await sendReply(
      `✅ *${jids.length} solicitação${jids.length > 1 ? "ões" : ""} aprovada${jids.length > 1 ? "s" : ""}!*\n\n` +
      `_Todos os participantes foram adicionados ao grupo._`
    );
  },
};
