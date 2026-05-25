/**
 * Exemplo de comando VIP
 * Salve em: src/commands/vip/vip-exemplo.js
 *
 * Qualquer arquivo dentro de src/commands/vip/ só funciona
 * para usuários ou grupos com acesso VIP.
 * O checkPermission do middleware faz essa verificação.
 */

import { PREFIX } from "../../config.js";

export default {
  name: "vip-exemplo",
  description: "Comando exclusivo para membros VIP.",
  commands: ["viptest", "testvip"],
  usage: `${PREFIX}viptest`,

  handle: async ({ sendReply, sendSuccessReact, webMessage }) => {
    const nome = webMessage?.pushName || "VIP";
    await sendSuccessReact();
    return sendReply(
      `👑 *BEM-VINDO, ${nome}!*\n\n` +
      `Você tem acesso *VIP* e pode usar todos os comandos exclusivos!\n\n` +
      `_Este é um exemplo — substitua pela lógica do seu comando VIP._`
    );
  },
};
