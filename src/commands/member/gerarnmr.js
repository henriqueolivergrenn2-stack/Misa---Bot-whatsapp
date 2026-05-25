/**
 * Comando: gerarnmr
 * Gera um número de telefone celular aleatório com DDD informado.
 */
import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";

function digitoAleatorio() {
  return Math.floor(Math.random() * 3) + 6; // 6, 7 ou 8
}

export default {
  name: "gerarnmr",
  description: "Gero um número de telefone celular aleatório com o DDD informado!",
  commands: ["gerarnmr", "gerar-numero", "gerarnumero"],
  usage: `${PREFIX}gerarnmr 91`,

  handle: async ({
    sendSuccessReact,
    sendReply,
    args,
  }) => {
    if (!args[0]) {
      throw new InvalidParameterError(
        `Digite o DDD para gerar!\n\nExemplo: *${PREFIX}gerarnmr 91*`
      );
    }

    const ddd = args[0].replace(/\D/g, "");

    if (ddd.length !== 2) {
      throw new InvalidParameterError(
        `DDD inválido! Informe apenas os 2 dígitos do DDD.\n\nExemplo: *${PREFIX}gerarnmr 91*`
      );
    }

    const numero = Array.from({ length: 8 }, digitoAleatorio).join("");
    const telefone = `${ddd}9${numero}`;
    const link = `wa.me/55${telefone}`;

    await sendSuccessReact();
    await sendReply(
      `📱 *Número gerado com o DDD* ${ddd}\n\n⇒ *${telefone}*\n🔗 ${link}`
    );
  },
};
