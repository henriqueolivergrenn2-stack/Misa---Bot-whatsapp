/**
 * RPG — Status, Classes e Menu
 * src/commands/member/rpg/rpg.js
 *
 * Comandos: .rpg  .rpgstatus  .rpgclasses
 * (Também aceita .rpg criar/aventura/descansar/top como atalho)
 */
import { PREFIX } from "../../../config.js";
import { fmt, fmtTime, getCd, getPlayer } from "../../../utils/economy.js";
import { CLASSES, hpBar, parseParts, xpParaSubir } from "./_rpgData.js";

export default {
  name: "rpg",
  description: "Sistema de RPG — veja seu status e as classes disponíveis.",
  commands: ["rpg", "rpgstatus", "rpgperfil", "rpgclasses"],
  usage: `${PREFIX}rpg  |  ${PREFIX}rpgstatus  |  ${PREFIX}rpgclasses`,

  handle: async ({
    sendReply, sendWarningReply,
    userLid, webMessage, fullArgs, commandName,
  }) => {
    const pName = webMessage?.pushName || "Aventureiro";

    // Determina sub-comando vindo de .rpg <sub> ou de .rpg<sub>
    const partes = parseParts(fullArgs);
    let sub;
    if (commandName === "rpg") {
      sub = (partes[0] || "status").toLowerCase();
    } else {
      // rpgstatus → "status" / rpgclasses → "classes"
      sub = commandName.replace(/^rpg/, "").toLowerCase();
    }

    // ── Classes ──────────────────────────────────────────────────────────────
    if (sub === "classes") {
      const linhas = Object.entries(CLASSES).map(([key, cl]) =>
        `${cl.emoji} *${cl.nome}* (_${key}_)\n` +
        `❤️ HP:${cl.hp}  ⚔️ ATK:${cl.atk}  🛡️ DEF:${cl.def}  🔮 MP:${cl.mp}\n` +
        `✨ *${cl.hab}* — ${cl.habDesc}\n` +
        `_${cl.desc}_`
      );
      return sendReply(
        `📖 *CLASSES DISPONÍVEIS*\n\n` +
        linhas.join("\n\n") +
        `\n\n_Crie seu personagem: *${PREFIX}rpgcriar <nome> <classe>*_`
      );
    }

    // ── Status / Perfil ───────────────────────────────────────────────────────
    const player = getPlayer(userLid, pName);
    if (!player.rpg) {
      return sendWarningReply(
        `Você não tem personagem!\n\n` +
        `Crie um: *${PREFIX}rpgcriar <nome> <classe>*\n` +
        `Ver classes: *${PREFIX}rpgclasses*`
      );
    }

    const rpg    = player.rpg;
    const cl     = CLASSES[rpg.classe];
    const xpNext = xpParaSubir(rpg.level);
    const xpFill = Math.round((rpg.xp / xpNext) * 10);
    const xpBar  = "[" + "█".repeat(xpFill) + "░".repeat(10 - xpFill) + "] " + rpg.xp + "/" + xpNext;
    const habCd  = getCd(rpg.cooldowns?.hab || 0, 7_200_000);
    const habTx  = habCd > 0 ? "⏳ " + fmtTime(habCd) : "✅ Disponível";

    return sendReply(
      `${cl.emoji} *${rpg.nome}* — Lv ${rpg.level} ${cl.nome}\n\n` +
      `❤️ HP: ${hpBar(rpg.hp, rpg.maxHp)}\n` +
      `🔮 MP: ${rpg.mp}/${rpg.maxMp}\n\n` +
      `⚔️ ATK: ${rpg.atk}   🛡️ DEF: ${rpg.def}\n` +
      `⭐ XP: ${xpBar}\n\n` +
      `🏆 Vitórias: ${rpg.vitorias}   💀 Derrotas: ${rpg.derrotas}\n` +
      `💰 Ouro RPG: ${fmt(rpg.ouro)} 🪙\n\n` +
      `✨ *${cl.hab}* — ${habTx}\n` +
      `_${cl.habDesc}_\n\n` +
      `*Comandos:*\n` +
      `${PREFIX}rpgaventura • ${PREFIX}rpgdescansar • ${PREFIX}rpgtop`
    );
  },
};
