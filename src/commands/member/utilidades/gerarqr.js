import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

export default {
  name: "gerarqr",
  description: "Gera QR Code de qualquer texto ou link.",
  commands: ["qrcode", "qr", "gerarqr"],
  usage: `${PREFIX}qr https://github.com`,
  handle: async ({ fullArgs, sendImageFromURL, sendWaitReact, sendSuccessReact }) => {
    if (!fullArgs?.trim()) throw new InvalidParameterError(`Ex: *${PREFIX}qr https://exemplo.com*`);
    await sendWaitReact();
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(fullArgs.trim())}`;
    await sendImageFromURL(url, `🔳 *QR Code:*\n_${fullArgs.trim()}_`);
    await sendSuccessReact();
  },
};
