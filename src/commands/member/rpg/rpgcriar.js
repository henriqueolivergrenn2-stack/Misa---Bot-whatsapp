/**
 * RPG — Criar personagem
 * src/commands/member/rpg/rpgcriar.js
 *
 * Uso: .rpgcriar <nome> <classe>
 * Ex:  .rpgcriar Rimuro mago
 */
import { PREFIX } from "../../../config.js";
import { getPlayer, save } from "../../../utils/economy.js";
import { CLASSES, parseParts } from "./_rpgData.js";

export default {
  name: "rpgcriar",
  description: "Crie seu personagem de RPG! Ex: .rpgcriar Rimuro mago",
  commands: ["rpgcriar"],
  usage: `${PREFIX}rpgcriar <nome> <classe>`,

  handle: async ({
    sendReply, sendWarningReply, sendSuccessReact,
    userLid, webMessage, fullArgs,
  }) => {
    const pName = webMessage?.pushName || "Aventureiro";

    // ── Parseia fullArgs por espaço (fix do bug do args[]) ────────────────────
    // "Rimuro mago" → ["Rimuro", "mago"]
    const partes      = parseParts(fullArgs);
    const nomePerson  = partes[0];
    const classeKey   = (partes[1] || "").toLowerCase();

    if (!nomePerson || !classeKey) {
      return sendWarningReply(
        `Informe o nome e a classe!\n\n` +
        `*Uso:* *${PREFIX}rpgcriar <nome> <classe>*\n` +
        `*Ex:* *${PREFIX}rpgcriar Rimuro mago*\n\n` +
        `Ver classes disponíveis: *${PREFIX}rpgclasses*`
      );
    }

    if (!CLASSES[classeKey]) {
      const lista = Object.keys(CLASSES).join(", ");
      return sendWarningReply(
        `Classe *${classeKey}* inválida!\n\n` +
        `Classes disponíveis: ${lista}\n` +
        `Detalhes: *${PREFIX}rpgclasses*`
      );
    }

    const player = getPlayer(userLid, pName);

    if (player.rpg) {
      return sendWarningReply(
        `Você já tem um personagem: *${player.rpg.nome}*!\n` +
        `Use *${PREFIX}rpgstatus* para ver seu personagem.`
      );
    }

    const cl     = CLASSES[classeKey];

    player.rpg = {
      nome:     nomePerson,
      classe:   classeKey,
      hp: cl.hp,  maxHp: cl.hp,
      mp: cl.mp,  maxMp: cl.mp,
      atk:      cl.atk,
      def:      cl.def,
      xp:       0,
      level:    1,
      ouro:     0,
      vitorias: 0,
      derrotas: 0,
      cooldowns: { aventura: 0, hab: 0, descansar: 0 },
    };

    save();

    await sendSuccessReact();
    return sendReply(
      `⚔️ *PERSONAGEM CRIADO COM SUCESSO!*\n\n` +
      `🧑 Nome: *${nomePerson}*\n` +
      `${cl.emoji} Classe: *${cl.nome}*\n\n` +
      `❤️ HP: ${cl.hp}   ⚔️ ATK: ${cl.atk}\n` +
      `🛡️ DEF: ${cl.def}   🔮 MP: ${cl.mp}\n\n` +
      `✨ Habilidade: *${cl.hab}*\n` +
      `_${cl.habDesc}_\n\n` +
      `🗡️ _Comece sua aventura: *${PREFIX}rpgaventura*_`
    );
  },
};
