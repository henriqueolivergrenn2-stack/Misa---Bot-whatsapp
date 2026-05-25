import { PREFIX } from "../../config.js";
import InvalidParameterError from "../../errors/InvalidParameterError.js";

export default {
  name: "meu-lid",
  description: "Retorna o LID da pessoa",
  commands: ["meu-lid", "my-lid", "lid"],
  usage: `${PREFIX}meu-lid`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async (props) => {
    const { sendSuccessReply, replyLid, args } = props;

    // Tenta pegar o userLid de diferentes formas que podem existir nas props
    const userLid =
      props.userLid ||
      props.authorLid ||
      props.senderLid ||
      props.message?.key?.participant ||
      props.message?.key?.remoteJid;

    if (args.length) {
      throw new InvalidParameterError(`Não tem mais como por o número na frente.

Para pegar seu LID:

${PREFIX}meu-lid

Para ver o lid de outra pessoa ela tem que estar no grupo e
você responde com o comando:

${PREFIX}lid (em cima de qualquer mensagem dela)`);
    }

    if (replyLid) {
      await sendSuccessReply(`LID do contato mencionado: ${replyLid}`);
    } else {
      await sendSuccessReply(`Seu LID: ${userLid}`);
    }
  },
};