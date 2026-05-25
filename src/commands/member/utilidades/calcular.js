/**
 * Calcular / Bhaskara / Raiz Quadrada
 */
import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

export default {
  name: "calcular",
  description: "Calcula expressões matemáticas.",
  commands: ["calc", "calcular", "math"],
  usage: `${PREFIX}calc 10 * 5 + 3`,
  handle: async ({ fullArgs, sendReply }) => {
    if (!fullArgs?.trim()) throw new InvalidParameterError(`Ex: *${PREFIX}calc 10 * 5 + 3*`);
    try {
      const expr   = fullArgs.replace(/[^0-9+\-*/.() %^]/g, "");
      const result = Function(`"use strict"; return (${expr})`)();
      if (isNaN(result) || !isFinite(result)) throw new Error();
      await sendReply(`🧮 *Expressão:* \`${fullArgs.trim()}\`\n📊 *Resultado:* \`${result}\``);
    } catch { throw new InvalidParameterError("Expressão inválida!"); }
  },
};
