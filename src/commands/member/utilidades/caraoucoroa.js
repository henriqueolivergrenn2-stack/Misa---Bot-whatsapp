import { PREFIX } from "../../../config.js";

export default {
  name: "caraoucoroa",
  description: "Joga cara ou coroa.",
  commands: ["cc", "caraoucoroa", "flip"],
  usage: `${PREFIX}cc`,
  handle: async ({ sendReact, sendReply }) => {
    await sendReact("🪙");
    const res = Math.random() < 0.5 ? "👤 *CARA!*" : "👑 *COROA!*";
    await sendReply(`🪙 *Cara ou Coroa:*\n\n${res}`);
  },
};
