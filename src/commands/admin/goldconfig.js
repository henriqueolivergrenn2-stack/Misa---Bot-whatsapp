/**
 * ⚙️ Comando Admin: Configurar Eventos de Gold
 * Colocar em: src/commands/admin/goldconfig.js
 *
 * Uso:
 *   .goldconfig on     → ativa eventos de emoji no grupo
 *   .goldconfig off    → desativa eventos
 *   .goldconfig status → mostra configuração atual
 */

import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import {
  isEventEnabled,
  setEventEnabled,
} from "../../utils/goldManager.js";

export default {
  name: "goldconfig",
  description: "Ativa/desativa os eventos automáticos de Gold no grupo. (Admin)",
  commands: ["goldconfig", "eventosgold", "goldevento"],
  usage: `${PREFIX}goldconfig on  |  ${PREFIX}goldconfig off  |  ${PREFIX}goldconfig status`,

  handle: async ({
    sendSuccessReact,
    sendWarningReply,
    sendReply,
    remoteJid,
    fullArgs,
  }) => {
    const input = (fullArgs?.trim() ?? "").toLowerCase();

    if (!input || input === "status") {
      const enabled = isEventEnabled(remoteJid);
      await sendReply(
        `⚙️ *CONFIGURAÇÃO DE EVENTOS DE GOLD*\n\n` +
        `📡 Status atual: ${enabled ? "✅ *Ativado*" : "❌ *Desativado*"}\n\n` +
        `*Comandos:*\n` +
        `› *${PREFIX}goldconfig on* — ativa os eventos\n` +
        `› *${PREFIX}goldconfig off* — desativa os eventos\n\n` +
        `_Quando ativado, a cada 5 horas o bot envia um emoji no grupo._\n` +
        `_Quem mandar o emoji primeiro ganha 50-200 💰 Gold!_`
      );
      return;
    }

    if (input === "on" || input === "ativar" || input === "ligar") {
      if (isEventEnabled(remoteJid)) {
        await sendWarningReply("✅ Os eventos de Gold já estão *ativados* neste grupo!");
        return;
      }
      setEventEnabled(remoteJid, true);
      await sendSuccessReact();
      await sendReply(
        `✅ *Eventos de Gold ATIVADOS!*\n\n` +
        `💡 A cada *5 horas* o bot enviará um emoji no grupo.\n` +
        `Quem mandar o emoji correto primeiro ganha *50-200 💰 Gold!*\n\n` +
        `_Para desativar: *${PREFIX}goldconfig off*_`
      );
      return;
    }

    if (input === "off" || input === "desativar" || input === "desligar") {
      if (!isEventEnabled(remoteJid)) {
        await sendWarningReply("❌ Os eventos de Gold já estão *desativados* neste grupo!");
        return;
      }
      setEventEnabled(remoteJid, false);
      await sendSuccessReact();
      await sendReply(
        `❌ *Eventos de Gold DESATIVADOS.*\n\n` +
        `_Para reativar: *${PREFIX}goldconfig on*_`
      );
      return;
    }

    throw new InvalidParameterError(
      `Opção inválida! Use:\n` +
      `*${PREFIX}goldconfig on* — ativar\n` +
      `*${PREFIX}goldconfig off* — desativar\n` +
      `*${PREFIX}goldconfig status* — ver configuração`
    );
  },
};
