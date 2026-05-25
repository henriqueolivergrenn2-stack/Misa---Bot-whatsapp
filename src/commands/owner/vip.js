/**
 * Comando: vip
 * Gerencia VIPs — apenas o dono pode usar.
 * Salve em: src/commands/owner/vip.js
 */

import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import { onlyNumbers, toUserLid } from "../../utils/index.js";
import {
  addVipGroup,
  addVipUser,
  listVipGroups,
  listVipUsers,
  removeVipGroup,
  removeVipUser,
} from "../../utils/vipManager.js";

export default {
  name: "vip",
  description: "Gerencia VIPs de usuários e grupos. Apenas dono.",
  commands: ["vip", "darvip", "removervip", "listvip"],
  usage:
    `*${PREFIX}vip add @usuario* — dar VIP ao usuário\n` +
    `*${PREFIX}vip rem @usuario* — remover VIP do usuário\n` +
    `*${PREFIX}vip grupo add* — dar VIP a este grupo\n` +
    `*${PREFIX}vip grupo rem* — remover VIP deste grupo\n` +
    `*${PREFIX}vip lista* — listar todos os VIPs`,

  handle: async ({
    sendReply,
    sendSuccessReact,
    sendErrorReply,
    sendWarningReply,
    webMessage,
    remoteJid,
    args,
    fullArgs,
  }) => {
    const parts = (fullArgs?.trim() || "").toLowerCase().split(/\s+/);
    const sub   = parts[0] || "";
    const sub2  = parts[1] || "";

    // ── LISTA ──────────────────────────────────────────────────────────────
    if (sub === "lista" || sub === "list") {
      const users  = listVipUsers();
      const groups = listVipGroups();

      const usersText  = users.length
        ? users.map((u, i) => `${i + 1}. \`${u}\``).join("\n")
        : "_Nenhum usuário VIP_";

      const groupsText = groups.length
        ? groups.map((g, i) => `${i + 1}. \`${g}\``).join("\n")
        : "_Nenhum grupo VIP_";

      return sendReply(
        `👑 *LISTA VIP*\n\n` +
        `👤 *Usuários (${users.length}):*\n${usersText}\n\n` +
        `📋 *Grupos (${groups.length}):*\n${groupsText}`
      );
    }

    // ── VIP DE GRUPO ───────────────────────────────────────────────────────
    if (sub === "grupo" || sub === "group") {
      if (!remoteJid.endsWith("@g.us")) {
        return sendWarningReply("Este comando deve ser usado dentro de um grupo!");
      }

      if (sub2 === "add" || sub2 === "dar") {
        const added = addVipGroup(remoteJid);
        await sendSuccessReact();
        return sendReply(added
          ? `✅ Este grupo agora tem acesso *VIP*! 👑\n\nTodos os membros podem usar comandos VIP aqui.`
          : `⚠️ Este grupo já é *VIP*!`
        );
      }

      if (sub2 === "rem" || sub2 === "remover") {
        const removed = removeVipGroup(remoteJid);
        await sendSuccessReact();
        return sendReply(removed
          ? `✅ VIP removido deste grupo.`
          : `⚠️ Este grupo não era *VIP*.`
        );
      }

      throw new InvalidParameterError(
        `Uso:\n*${PREFIX}vip grupo add* — dar VIP ao grupo\n*${PREFIX}vip grupo rem* — remover VIP do grupo`
      );
    }

    // ── VIP DE USUÁRIO ─────────────────────────────────────────────────────
    const mentioned = webMessage?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    if (!mentioned.length) {
      throw new InvalidParameterError(
        `Marque um usuário!\n\n` +
        `*${PREFIX}vip add @usuario* — dar VIP\n` +
        `*${PREFIX}vip rem @usuario* — remover VIP\n` +
        `*${PREFIX}vip grupo add* — VIP no grupo\n` +
        `*${PREFIX}vip lista* — listar VIPs`
      );
    }

    const targetJid = mentioned[0];
    // Converte JID para LID (formato interno do bot)
    const targetLid = targetJid.endsWith("@lid")
      ? targetJid
      : toUserLid(onlyNumbers(targetJid));
    const targetNum = onlyNumbers(targetJid);

    if (sub === "add" || sub === "dar") {
      const added = addVipUser(targetLid);
      await sendSuccessReact();
      return sendReply(added
        ? `✅ *+${targetNum}* agora tem acesso *VIP*! 👑`
        : `⚠️ Este usuário já é *VIP*!`
      );
    }

    if (sub === "rem" || sub === "remover") {
      const removed = removeVipUser(targetLid);
      await sendSuccessReact();
      return sendReply(removed
        ? `✅ VIP removido de *+${targetNum}*.`
        : `⚠️ Este usuário não era *VIP*.`
      );
    }

    throw new InvalidParameterError(
      `Subcomando inválido!\n\n` +
      `*${PREFIX}vip add @usuario* — dar VIP\n` +
      `*${PREFIX}vip rem @usuario* — remover VIP\n` +
      `*${PREFIX}vip grupo add/rem* — VIP no grupo\n` +
      `*${PREFIX}vip lista* — listar VIPs`
    );
  },
};
