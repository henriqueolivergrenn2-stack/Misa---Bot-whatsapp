/**
 * Comando: autochat / auto-chat
 * Ativa ou desativa o AutoChat no grupo.
 * Apenas admins podem usar.
 */
import { PREFIX } from "../../config.js";
import { isAutoChatAtivo, setAutoChat } from "../../utils/autoChat.js";

export default {
  name: "autochat",
  description: "Ativa ou desativa o AutoChat (IA conversacional) no grupo.",
  commands: ["autochat", "auto-chat"],
  usage: `${PREFIX}autochat`,

  handle: async ({
    sendSuccessReply,
    remoteJid,
    isGroup,
  }) => {
    if (!isGroup) {
      await sendSuccessReply("Este comando só funciona em grupos!");
      return;
    }

    const ativo = isAutoChatAtivo(remoteJid);
    setAutoChat(remoteJid, !ativo);

    await sendSuccessReply(
      !ativo
        ? `🤖 AutoChat *ativado* neste grupo!\n\nAgora vou responder quando me mencionarem pelo nome.`
        : `🔇 AutoChat *desativado* neste grupo!\n\nNão vou mais responder automaticamente.`
    );
  },
};
