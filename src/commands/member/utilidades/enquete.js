import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

export default {
  name: "enquete",
  description: "Cria enquete no grupo.",
  commands: ["enquete", "poll"],
  usage: `${PREFIX}enquete Qual o melhor?|opção1/opção2/opção3`,
  handle: async ({ fullArgs, isGroup, sendPoll, sendWarningReply }) => {
    if (!isGroup) return sendWarningReply("Apenas em grupos!");
    if (!fullArgs?.includes("|") || !fullArgs?.includes("/"))
      throw new InvalidParameterError(`Ex: *${PREFIX}enquete Qual o melhor?|A/B/C*`);
    const [pergunta, opcoesStr] = fullArgs.split("|");
    const opcoes = opcoesStr.split("/").map(o => o.trim()).filter(Boolean);
    if (opcoes.length < 2)  throw new InvalidParameterError("Pelo menos 2 opções!");
    if (opcoes.length > 12) throw new InvalidParameterError("Máximo 12 opções!");
    await sendPoll(pergunta.trim(), opcoes, 1);
  },
};
