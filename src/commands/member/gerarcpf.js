import { PREFIX } from "../../config.js";

export default {
  name: "gerarcpf",
  description: "Gera um CPF falso aleatório",
  commands: ["gerarcpf", "cpf", "cpfgerar"],
  usage: `${PREFIX}gerarcpf`,

  handle: async ({
    sendWaitReact,
    sendSuccessReact,
    sendReply,
  }) => {
    await sendWaitReact();

    try {
      const cp1 = String(Math.floor(Math.random() * 900) + 100).padStart(3, "0");
      const cp2 = String(Math.floor(Math.random() * 900) + 100).padStart(3, "0");
      const cp3 = String(Math.floor(Math.random() * 900) + 100).padStart(3, "0");
      const cp4 = String(Math.floor(Math.random() * 90) + 10).padStart(2, "0");

      const cpf = `${cp1}.${cp2}.${cp3}-${cp4}`;

      await sendSuccessReact();
      await sendReply(`𝐂𝐏𝐅 𝐆𝐄𝐑𝐀𝐃𝐎 𝐂𝐎𝐌『 𝐒𝐔𝐂𝐄𝐒𝐒𝐎 』💻\n\n${cpf}`);
    } catch (error) {
      console.error("[GerarCPF Error]:", error);
      await sendReply("❌ Erro ao gerar o CPF. Tente novamente!");
    }
  },
};
