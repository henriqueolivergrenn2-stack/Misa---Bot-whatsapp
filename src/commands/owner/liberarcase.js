/**
 * Comando: liberarcase
 * Libera ou revoga o uso do .getcase em um grupo.
 * Salve em: src/commands/owner/liberarcase.js
 * (pasta owner = só o dono do bot)
 */
import { PREFIX } from "../../config.js";
import {
  isActiveGroupRestriction,
  updateIsActiveGroupRestriction,
} from "../../utils/database.js";

export default {
  name: "liberarcase",
  description: "Libera ou revoga o uso do .getcase em um grupo.",
  commands: ["liberarcase"],
  usage:
    `${PREFIX}liberarcase — libera/revoga no grupo atual\n` +
    `${PREFIX}liberarcase <groupId> — libera/revoga em outro grupo`,

  handle: async ({
    sendSuccessReact,
    sendErrorReply,
    sendReply,
    remoteJid,
    isGroup,
    fullArgs,
  }) => {
    // Permite usar fora de grupo informando o ID manualmente
    const groupId = fullArgs.trim() || remoteJid;

    if (!groupId.endsWith("@g.us")) {
      await sendErrorReply(
        `ID de grupo inválido!\n\n` +
        `Use em um grupo ou informe o ID:\n` +
        `*${PREFIX}liberarcase 120363xxxxxxx@g.us*`
      );
      return;
    }

    const atual = isActiveGroupRestriction(groupId, "getcase");
    const novo  = !atual;

    updateIsActiveGroupRestriction(groupId, "getcase", novo);

    await sendSuccessReact();
    await sendReply(
      novo
        ? `✅ Grupo *${groupId}* liberado para usar *${PREFIX}getcase*!`
        : `🚫 Grupo *${groupId}* bloqueado — *${PREFIX}getcase* desativado!`
    );
  },
};
