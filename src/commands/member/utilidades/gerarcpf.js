import { PREFIX } from "../../../config.js";

export default {
  name: "gerarcpf",
  description: "Gera CPF fictício (apenas educacional/testes).",
  commands: ["gerarcpf"],
  usage: `${PREFIX}gerarcpf`,
  handle: async ({ sendReply }) => {
    const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
    let d1 = 0, d2 = 0;
    for (let i = 0; i < 9; i++) d1 += n[i] * (10 - i);
    d1 = (d1 * 10) % 11; if (d1 >= 10) d1 = 0;
    for (let i = 0; i < 9; i++) d2 += n[i] * (11 - i);
    d2 += d1 * 2; d2 = (d2 * 10) % 11; if (d2 >= 10) d2 = 0;
    const cpf = `${n.slice(0,3).join("")}.${n.slice(3,6).join("")}.${n.slice(6,9).join("")}-${d1}${d2}`;
    await sendReply(`🪪 *CPF Fictício (uso educacional):*\n\n\`${cpf}\``);
  },
};
