/**
 * Comando: sorteionumero / snmr
 * Sorteia um participante aleatório do grupo.
 */
import { PREFIX } from "../../config.js";
import { WarningError } from "../../errors/index.js";

export default {
  name: "sorteionumero",
  description: "Sorteia um participante aleatório do grupo!",
  commands: ["sorteionumero", "snmr", "sortear"],
  usage: `${PREFIX}sorteionumero`,

  handle: async ({
    sendSuccessReact,
    isGroup,
    remoteJid,
    socket,
    webMessage,
  }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só pode ser usado em grupos!");
    }

    const metadata = await socket.groupMetadata(remoteJid);
    const participants = metadata?.participants;

    if (!participants?.length) {
      throw new WarningError("Não consegui obter os participantes do grupo!");
    }

    const sorteado =
      participants[Math.floor(Math.random() * participants.length)];

    const jid =
      sorteado?.lid ||
      sorteado?.id ||
      sorteado?.jid;

    if (!jid) {
      throw new WarningError("Não consegui identificar o participante sorteado!");
    }

    await sendSuccessReact();

    await socket.sendMessage(remoteJid, {
      text: `🎲 *Sorteio do grupo!*\n\nO sortudo de hoje é... @${jid.split("@")[0]} 🎉`,
      mentions: [jid],
    });
  },
};