import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

export default {
  name: "chance",
  description: "Calcula a chance aleatória de algo acontecer.",
  commands: ["chance", "porcentagem"],
  usage: `${PREFIX}chance eu passar na prova`,
  handle: async ({ fullArgs, sendReply }) => {
    if (!fullArgs?.trim()) throw new InvalidParameterError(`Ex: *${PREFIX}chance eu passar na prova*`);
    const pct = Math.floor(Math.random() * 101);
    const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
    const emoji = pct >= 80 ? "🔥" : pct >= 50 ? "✅" : pct >= 30 ? "⚠️" : "❌";
    await sendReply(`${emoji} *Chance de:* _${fullArgs.trim()}_\n\n[${bar}] *${pct}%*`);
  },
};
