/**
 * RPG — Descansar / Recuperar HP
 * src/commands/member/rpg/rpgdescansar.js
 *
 * Uso: .rpgdescansar   (cooldown 30 minutos)
 */
import { PREFIX } from "../../../config.js";
import { fmtTime, getCd, getPlayer, getNow, save } from "../../../utils/economy.js";
import { hpBar } from "./_rpgData.js";

export default {
  name: "rpgdescansar",
  description: "Descanse e recupere 50% do seu HP. (cooldown 30min)",
  commands: ["rpgdescansar", "rpgcurar", "rpgheal"],
  usage: `${PREFIX}rpgdescansar`,

  handle: async ({
    sendReply, sendWarningReply, sendSuccessReact,
    userLid, webMessage,
  }) => {
    const pName  = webMessage?.pushName || "Aventureiro";
    const player = getPlayer(userLid, pName);

    if (!player.rpg) {
      return sendWarningReply(
        `Você não tem personagem!\n` +
        `Crie um: *${PREFIX}rpgcriar <nome> <classe>*`
      );
    }

    const rpg = player.rpg;
    if (!rpg.cooldowns) rpg.cooldowns = { aventura: 0, hab: 0, descansar: 0 };

    const wait = getCd(rpg.cooldowns.descansar || 0, 1_800_000);
    if (wait > 0) {
      return sendWarningReply(`⏳ Aguarde *${fmtTime(wait)}* para descansar novamente.`);
    }

    if (rpg.hp >= rpg.maxHp) {
      return sendReply(`❤️ Você já está com HP cheio! (${rpg.hp}/${rpg.maxHp})`);
    }

    const cura = Math.floor(rpg.maxHp * 0.5);
    rpg.hp = Math.min(rpg.maxHp, rpg.hp + cura);
    rpg.cooldowns.descansar = getNow();
    save();

    await sendSuccessReact();
    return sendReply(
      `😴 *DESCANSANDO...*\n\n` +
      `❤️ HP recuperado: *+${cura}*\n` +
      `❤️ HP atual: ${hpBar(rpg.hp, rpg.maxHp)}\n\n` +
      `_Próximo descanso em 30 minutos._`
    );
  },
};
