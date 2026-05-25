import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

export default {
  name: "anagrama",
  description: "Embaralha as letras de uma palavra.",
  commands: ["anagrama", "embaralhar"],
  usage: `${PREFIX}anagrama javascript`,
  handle: async ({ fullArgs, sendReply }) => {
    if (!fullArgs?.trim()) throw new InvalidParameterError(`Ex: *${PREFIX}anagrama javascript*`);
    const palavra = fullArgs.trim();
    const embaralhado = palavra.split("").sort(() => Math.random() - 0.5).join("");
    await sendReply(`🔀 *Anagrama:*\n\nOriginal: *${palavra}*\nEmbaralhado: *${embaralhado}*`);
  },
};
