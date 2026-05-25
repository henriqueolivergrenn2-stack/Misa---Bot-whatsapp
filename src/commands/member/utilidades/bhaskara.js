import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

export default {
  name: "bhaskara",
  description: "Resolve equação do segundo grau.",
  commands: ["bhaskara"],
  usage: `${PREFIX}bhaskara 2 4 2`,
  handle: async ({ args, sendReply }) => {
    const [a, b, c] = args.map(Number);
    if (args.length < 3 || [a, b, c].some(isNaN))
      throw new InvalidParameterError(`Uso: *${PREFIX}bhaskara <a> <b> <c>*\nEx: ${PREFIX}bhaskara 2 4 2`);
    const delta = b * b - 4 * a * c;
    let txt = `📐 *Bhaskara*\n${a}x² + ${b}x + ${c} = 0\n\nΔ = ${b}² - 4·${a}·${c} = *${delta}*\n\n`;
    if (delta < 0)       txt += "❌ Δ < 0 — Sem raízes reais.";
    else if (delta === 0) txt += `✅ Raiz dupla: x = *${(-b / (2 * a)).toFixed(4)}*`;
    else {
      const x1 = (-b + Math.sqrt(delta)) / (2 * a);
      const x2 = (-b - Math.sqrt(delta)) / (2 * a);
      txt += `✅ x₁ = *${x1.toFixed(4)}*\nx₂ = *${x2.toFixed(4)}*`;
    }
    await sendReply(txt);
  },
};
