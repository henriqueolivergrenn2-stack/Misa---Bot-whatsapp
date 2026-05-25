/**
 * 🦸 Comando: Teste Psicológico Marvel
 * Colocar em: src/commands/member/testemarvell.js
 *
 * Uso: .testemarvell
 * Durante o teste: responda só com 1, 2, 3 ou 4 no chat
 * Para cancelar: .testemarvell cancelar
 */

import { PREFIX } from "../../config.js";
import {
  cancelTest,
  hasActiveTest,
  setTestMsgKey,
  startTest,
} from "../../utils/marvelTestManager.js";

export default {
  name: "testemarvel",
  description: "Descubra qual herói Marvel você é! Baseado no modelo Big Five (OCEAN).",
  commands: ["testemarvel", "heroimarvel", "qualheroi", "marveltest"],
  usage: `${PREFIX}testemarvel`,

  handle: async ({
    sendWaitReact,
    sendSuccessReact,
    sendWarningReply,
    sendReply,
    socket,
    remoteJid,
    userLid,
    webMessage,
    fullArgs,
  }) => {
    const userName = webMessage?.pushName || "Herói";
    const input    = (fullArgs?.trim() ?? "").toLowerCase();

    // ── Cancelar ──────────────────────────────────────────────────────────
    if (["cancelar", "sair", "stop"].includes(input)) {
      if (!hasActiveTest(remoteJid, userLid)) {
        await sendWarningReply("Você não tem nenhum teste em andamento!");
        return;
      }
      cancelTest(remoteJid, userLid);
      await sendReply(`❌ Teste cancelado!\n\nUse *${PREFIX}testemarvell* para começar novamente.`);
      return;
    }

    // ── Já tem teste ativo ────────────────────────────────────────────────
    if (hasActiveTest(remoteJid, userLid)) {
      await sendWarningReply(
        `Você já tem um teste em andamento!\n\n` +
        `Responda com *1*, *2*, *3* ou *4* no chat.\n` +
        `Para cancelar: *${PREFIX}testemarvell cancelar*`
      );
      return;
    }

    await sendWaitReact();

    // ── Inicia o teste e envia a primeira pergunta ─────────────────────────
    const firstQuestion = startTest(remoteJid, userLid, userName);

    try {
      const sent = await socket.sendMessage(
        remoteJid,
        { text: firstQuestion },
        { quoted: webMessage }
      );
      // Armazena a chave da mensagem para editar nas próximas perguntas
      if (sent?.key) setTestMsgKey(remoteJid, userLid, sent.key);
    } catch {
      await sendReply(firstQuestion);
    }

    await sendSuccessReact();
  },
};
