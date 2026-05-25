/**
 * Sorteio — sorteia número, membro ou item de lista
 */
import { PREFIX } from "../../../config.js";

export default {
  name: "sortear",
  description: "Sorteia número, membro do grupo ou item de uma lista.",
  commands: ["sortear", "sorteiro", "random"],
  usage: `${PREFIX}sortear 1/100 | ${PREFIX}sortear membro | ${PREFIX}sortear item1, item2, item3`,
  handle: async ({ sendReply, sendWarningReply, sendReact, fullArgs, isGroup, socket, remoteJid, webMessage }) => {
    const input = fullArgs?.trim() || "";

    await sendReact("🎰");

    // Sortear membro do grupo
    if (input.toLowerCase() === "membro" || input.toLowerCase() === "member") {
      if (!isGroup) return sendWarningReply("Esse modo só funciona em grupos!");
      const meta    = await socket.groupMetadata(remoteJid);
      const members = meta.participants.filter(p => !p.admin);
      if (!members.length) return sendWarningReply("Nenhum membro não-admin encontrado!");
      const sorteado = members[Math.floor(Math.random() * members.length)];
      return sendReply(
        `🎰 *SORTEIO DE MEMBRO*\n\n🏆 Sorteado: @${sorteado.id.split("@")[0]}`,
        [sorteado.id]
      );
    }

    // Intervalo numérico: 1/100
    if (input.includes("/")) {
      const [minS, maxS] = input.split("/");
      const min = parseInt(minS), max = parseInt(maxS);
      if (isNaN(min) || isNaN(max) || min >= max)
        return sendWarningReply(`Formato: *${PREFIX}sortear 1/100*`);
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      return sendReply(`🎰 *SORTEIO (${min} → ${max})*\n\n🏆 Número sorteado: *${num}*`);
    }

    // Lista de itens: a, b, c
    if (input.includes(",")) {
      const itens = input.split(",").map(i => i.trim()).filter(Boolean);
      if (itens.length < 2) return sendWarningReply("Separe os itens por vírgula!");
      const vencedor = itens[Math.floor(Math.random() * itens.length)];
      return sendReply(`🎰 *SORTEIO DE LISTA*\n\n${itens.map((it, i) => `${i+1}. ${it}`).join("\n")}\n\n🏆 Sorteado: *${vencedor}*`);
    }

    // Sem argumento ou argumento único — número 1-100
    const n = Math.floor(Math.random() * 100) + 1;
    return sendReply(`🎰 *SORTEIO*\n\n🏆 Número sorteado: *${n}* (de 1 a 100)\n\n_Use *${PREFIX}sortear 1/500* para definir o intervalo!_`);
  },
};
