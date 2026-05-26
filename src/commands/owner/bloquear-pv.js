/**
 * Comando: bloquear-pv / desbloquear-pv
 * Ativa ou desativa comandos no privado salvando no config.js.
 * Apenas o dono do bot pode usar.
 */
import { PREFIX } from "../../config.js";
import { setPvBloqueado, isPvBloqueado } from "../../utils/pvBlock.js";

export default {
  name: "bloquear-pv",
  description: "Ativa ou desativa comandos no privado para todos.",
  commands: ["bloquear-pv", "desbloquear-pv", "bloquearpv", "desbloquearpv"],
  usage: `${PREFIX}bloquear-pv`,

  handle: async ({ sendSuccessReply, commandName }) => {
    const desbloquear =
      commandName === "desbloquearpv" || commandName === "desbloquear-pv";

    setPvBloqueado(!desbloquear);

    await sendSuccessReply(
      !desbloquear
        ? "Comandos no *privado* foram *desativados* para todos!\n\nApenas grupos funcionarão agora."
        : "Comandos no *privado* foram *reativados* para todos!"
    );
  },
};
