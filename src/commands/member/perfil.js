import { ASSETS_DIR, PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import { getProfileImageData } from "../../services/baileys.js";
import { isGroup, onlyNumbers } from "../../utils/index.js";
import { errorLog } from "../../utils/logger.js";

// goldManager — sistema principal (usa LID)
import {
  getPlayer as getGoldPlayer,
  formatGold,
  getPlayerRank,
} from "../../utils/goldManager.js";

// economy — sistema secundário (usa LID também como ID)
import { getPlayer as getEconPlayer } from "../../utils/economy.js";

export default {
  name: "perfil",
  description: "Mostra informações de um usuário",
  commands: ["perfil", "profile"],
  usage: `${PREFIX}perfil ou perfil @usuario`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    args,
    socket,
    remoteJid,
    userLid,
    sendErrorReply,
    sendWaitReply,
    sendSuccessReact,
  }) => {
    if (!isGroup(remoteJid)) {
      throw new InvalidParameterError(
        "Este comando só pode ser usado em grupo."
      );
    }

    const targetLid = args[0] ? `${onlyNumbers(args[0])}@lid` : userLid;

    await sendWaitReply("Carregando perfil...");

    try {
      // ── Foto de perfil ──────────────────────────────────────────────────────
      let profilePicUrl;
      try {
        const { profileImage } = await getProfileImageData(socket, targetLid);
        profilePicUrl = profileImage || `${ASSETS_DIR}/images/default-user.png`;
      } catch (error) {
        errorLog(
          `Erro ao tentar pegar dados do usuário ${targetLid}: ${JSON.stringify(
            error,
            null,
            2
          )}`
        );
        profilePicUrl = `${ASSETS_DIR}/images/default-user.png`;
      }

      // ── Cargo no grupo ─────────────────────────────────────────────────────
      const groupMetadata = await socket.groupMetadata(remoteJid);
      const participant = groupMetadata.participants.find(
        (p) => p.id === targetLid
      );

      let userRole = "Membro";
      if (participant?.admin === "superadmin") userRole = "Dono do Grupo";
      else if (participant?.admin) userRole = "Administrador";

      // ── Gold (goldManager) ────────────────────────────────────────────────
      const goldPlayer = getGoldPlayer(targetLid, null, remoteJid);
      const goldAmount = goldPlayer?.gold ?? 0;
      const { group: rankGroup, global: rankGlobal } = getPlayerRank(targetLid, remoteJid);

      // ── Economy (sistema secundário) ──────────────────────────────────────
      const econPlayer = getEconPlayer(targetLid);
      const bankAmount = econPlayer?.bank  ?? 0;
      const xp         = econPlayer?.xp    ?? 0;
      const level      = econPlayer?.level ?? 1;
      const inventory  = econPlayer?.inventory ?? [];

      // ── Stats divertidos (aleatórios) ────────────────────────────────────
      const randomPercent = Math.floor(Math.random() * 100);
      const programPrice  = (Math.random() * 5000 + 1000).toFixed(2);
      const beautyLevel   = Math.floor(Math.random() * 100) + 1;

      // ── Inventário formatado ─────────────────────────────────────────────
      const inventoryText =
        inventory.length > 0
          ? inventory
              .map((item) => {
                const icons = {
                  picareta: "⛏️",
                  lucky:    "🍀",
                  colete:   "🦺",
                  vip:      "👑",
                };
                return icons[item] ?? item;
              })
              .join(" ")
          : "Vazio";

      // ── Ranking text ─────────────────────────────────────────────────────
      const rankText = [
        rankGroup  ? `#${rankGroup} no grupo`   : null,
        rankGlobal ? `#${rankGlobal} no geral`  : null,
      ]
        .filter(Boolean)
        .join(" · ") || "Sem ranking ainda";

      // ── Mensagem final ───────────────────────────────────────────────────
      const mensagem = [
        `👤 *Nome:* @${targetLid.split("@")[0]}`,
        `🎖️ *Cargo:* ${userRole}`,
        ``,
        `━━━━━━ 💰 *ECONOMIA* ━━━━━━`,
        `🪙 *Gold:* ${formatGold(goldAmount)}`,
        `🏦 *Banco:* ${formatGold(bankAmount)}`,
        `💼 *Total:* ${formatGold(goldAmount + bankAmount)}`,
        ``,
        `⭐ *Nível:* ${level}  |  ✨ *XP:* ${xp.toLocaleString("pt-BR")}`,
        `🏆 *Ranking:* ${rankText}`,
        `🎒 *Inventário:* ${inventoryText}`,
        ``,
        `━━━━━━ 😄 *PERFIL* ━━━━━━`,
        `🌚 *Programa:* R$ ${programPrice}`,
        `🐮 *Gado:* ${randomPercent + 7 || 5}%`,
        `🎱 *Passiva:* ${randomPercent + 5 || 10}%`,
        `✨ *Beleza:* ${beautyLevel}%`,
      ].join("\n");

      const mentions = [targetLid];

      await sendSuccessReact();

      await socket.sendMessage(remoteJid, {
        image:    { url: profilePicUrl },
        caption:  mensagem,
        mentions: mentions,
      });
    } catch (error) {
      console.error(error);
      sendErrorReply("Ocorreu um erro ao tentar verificar o perfil.");
    }
  },
};
