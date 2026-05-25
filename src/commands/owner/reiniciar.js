import { PREFIX } from "../../config.js";
import { DangerError } from "../../errors/index.js";

/**
 * COMANDO: restart / reiniciar
 * Localização recomendada: src/commands/owner/restart.js
 */

export default {
  name: "restart",
  description: "Reinicia o bot completamente (apenas dono)",
  commands: ["restart", "reiniciar", "r", "reboot"],
  usage: `${PREFIX}restart`,

  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    sendWaitReact,
    sendSuccessReply,
    sendErrorReply,
    // isOwner,     // ← Nem sempre disponível, por isso usamos a pasta owner/
  }) => {
    await sendWaitReact();

    try {
      await sendSuccessReply(`🔄 *Reiniciando o bot...*\n\nAguarde alguns segundos.`);

      console.log("🔄 [RESTART] Bot reiniciado via comando pelo dono.");

      // Delay para conseguir enviar a mensagem antes de fechar
      setTimeout(() => {
        process.exit(0); // O PM2, nodemon ou seu script de start vai reiniciar automaticamente
      }, 1800);

    } catch (error) {
      console.error("[Restart Error]:", error);
      await sendErrorReply("❌ Ocorreu um erro ao tentar reiniciar o bot.");
    }
  },
};