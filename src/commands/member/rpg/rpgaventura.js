/**
 * RPG — Aventura / Batalha
 * src/commands/member/rpg/rpgaventura.js
 *
 * Uso: .rpgaventura          → batalha normal
 *      .rpgaventura hab      → usa habilidade especial (cd 2h)
 */
import { PREFIX } from "../../../config.js";
import { addGold, fmt, fmtTime, getCd, getPlayer, getNow, rand, save } from "../../../utils/economy.js";
import { CLASSES, MONSTROS, hpBar, levelUp, parseParts } from "./_rpgData.js";

export default {
  name: "rpgaventura",
  description: "Aventure-se e batalhe contra monstros! (cd 5min) Use 'hab' para habilidade especial.",
  commands: ["rpgaventura", "rpgbatalha", "rpglutar"],
  usage: `${PREFIX}rpgaventura  |  ${PREFIX}rpgaventura hab`,

  handle: async ({
    sendReply, sendWarningReply, sendErrorReply, sendSuccessReact,
    userLid, webMessage, fullArgs,
  }) => {
    const pName  = webMessage?.pushName || "Aventureiro";
    const player = getPlayer(userLid, pName);

    if (!player.rpg) {
      return sendWarningReply(
        `Você não tem personagem!\n` +
        `Crie um: *${PREFIX}rpgcriar <nome> <classe>*\n` +
        `Ver classes: *${PREFIX}rpgclasses*`
      );
    }

    const rpg = player.rpg;
    const cl  = CLASSES[rpg.classe];
    if (!rpg.cooldowns) rpg.cooldowns = { aventura: 0, hab: 0, descansar: 0 };

    // Cooldown aventura (15 min)
    const waitAv = getCd(rpg.cooldowns.aventura || 0, 900_000);
    if (waitAv > 0) {
      return sendWarningReply(`⏳ Aguarde *${fmtTime(waitAv)}* para aventurar novamente.`);
    }

    if (rpg.hp <= 0) {
      return sendWarningReply(
        `❤️ Você está sem HP!\n` +
        `Use *${PREFIX}rpgdescansar* para se recuperar.`
      );
    }

    // Verifica uso de habilidade
    const partes   = parseParts(fullArgs);
    const usarHab  = (partes[0] || "").toLowerCase() === "hab";
    const habWait  = getCd(rpg.cooldowns.hab || 0, 7_200_000);

    if (usarHab && habWait > 0) {
      return sendWarningReply(
        `⏳ Habilidade *${cl.hab}* em cooldown!\n` +
        `Disponível em: *${fmtTime(habWait)}*`
      );
    }

    // Seleciona monstro pelo nível do jogador
    const minIdx = Math.max(0, rpg.level - 2);
    const maxIdx = Math.min(rpg.level + 2, MONSTROS.length - 1);
    const mob    = { ...MONSTROS[rand(minIdx, maxIdx)] };

    let pHp  = rpg.hp;
    let mHp  = mob.hp;
    const log = [];

    // ── Turno do jogador ──────────────────────────────────────────────────────
    const pAtk = Math.max(1, rpg.atk - Math.floor(mob.def * 0.5) + rand(-5, 5));

    if (usarHab) {
      rpg.cooldowns.hab = getNow();

      if (rpg.classe === "curandeiro") {
        const cura = Math.floor(rpg.maxHp * 0.8);
        pHp = Math.min(rpg.maxHp, pHp + cura);
        log.push(`✨ *${cl.hab}:* Você se curou *+${cura} HP*!`);
        const dano = Math.max(1, pAtk);
        mHp -= dano;
        log.push(`⚔️ Você ataca *${mob.nome}* — *${dano} de dano!*`);
      } else if (rpg.classe === "assassino") {
        if (Math.random() < 0.5) {
          mHp = 0;
          log.push(`✨ *${cl.hab}:* INSTAKILL! *${mob.nome}* eliminado!`);
        } else {
          const dano = Math.floor(pAtk * cl.habMult);
          mHp -= dano;
          log.push(`✨ *${cl.hab}:* *${dano}* de dano crítico em *${mob.nome}*!`);
        }
      } else {
        const dano = Math.floor(pAtk * cl.habMult);
        mHp -= dano;
        log.push(`✨ *${cl.hab}:* *${dano}* de dano em *${mob.nome}*!`);
      }
    } else {
      mHp -= pAtk;
      log.push(`⚔️ Você ataca *${mob.nome}* — *${pAtk} de dano!*`);
    }

    // ── Turno do monstro ──────────────────────────────────────────────────────
    if (mHp > 0) {
      const mAtk = Math.max(1, mob.atk - Math.floor(rpg.def * 0.5) + rand(-3, 3));
      pHp -= mAtk;
      log.push(`🔴 *${mob.nome}* te ataca — *${mAtk} de dano!*`);
    }

    rpg.cooldowns.aventura = getNow();

    // ── Vitória ───────────────────────────────────────────────────────────────
    if (mHp <= 0) {
      const ouro    = rand(mob.oMin, mob.oMax);
      rpg.hp        = Math.max(1, pHp);
      rpg.ouro      += ouro;
      rpg.xp        += mob.xp;
      rpg.vitorias  += 1;
      const leveled  = levelUp(rpg);
      addGold(userLid, pName, null, Math.floor(ouro * 0.5));
      save();
      await sendSuccessReact();
      return sendReply(
        `⚔️ *AVENTURA — VITÓRIA!*\n\n` +
        `Inimigo: *${mob.emoji} ${mob.nome}*\n\n` +
        log.join("\n") + "\n\n" +
        `🏆 *Você venceu!*\n` +
        `💰 +${fmt(ouro)} ouro RPG\n` +
        `⭐ +${mob.xp} XP` +
        (leveled ? `\n\n🎉 *LEVEL UP! Agora você é Lv ${rpg.level}!*` : "") +
        `\n\n❤️ HP: ${hpBar(rpg.hp, rpg.maxHp)}\n` +
        `_Próxima aventura em 5 minutos._`
      );
    }

    // ── Derrota ───────────────────────────────────────────────────────────────
    if (pHp <= 0) {
      rpg.hp       = 0;
      rpg.derrotas += 1;
      save();
      return sendErrorReply(
        `💀 *AVENTURA — DERROTA!*\n\n` +
        `Inimigo: *${mob.emoji} ${mob.nome}*\n\n` +
        log.join("\n") + "\n\n" +
        `❤️ Você foi derrotado!\n` +
        `_Use *${PREFIX}rpgdescansar* para se recuperar._`
      );
    }

    // ── Sobrevivência ─────────────────────────────────────────────────────────
    rpg.hp       = pHp;
    rpg.derrotas += 1;
    save();
    return sendReply(
      `⚔️ *AVENTURA — SOBREVIVÊNCIA!*\n\n` +
      `Inimigo: *${mob.emoji} ${mob.nome}* fugiu!\n\n` +
      log.join("\n") + "\n\n" +
      `❤️ HP: ${hpBar(rpg.hp, rpg.maxHp)}\n` +
      `_Próxima aventura em 5 minutos._`
    );
  },
};
