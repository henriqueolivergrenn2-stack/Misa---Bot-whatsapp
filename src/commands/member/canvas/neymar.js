/**
 * Comando: neymar
 * Gera um edit estilizado do Neymar com o texto informado usando a API Sirv.
 */
import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { getBuffer } from "../../../utils/index.js";

// Limite de caracteres por linha — ajuste aqui conforme o edit
const LIMITE_POR_LINHA = 12;

function quebrarLinhas(texto, limite) {
  const palavras = texto.trim().split(" ");
  const linhas = [];
  let atual = "";

  for (const palavra of palavras) {
    if ((atual + " " + palavra).trim().length <= limite) {
      atual = (atual + " " + palavra).trim();
    } else {
      if (atual) linhas.push(atual);
      atual = palavra;
    }
  }

  if (atual) linhas.push(atual);

  // Máximo 3 linhas
  return linhas.slice(0, 3);
}

export default {
  name: "neymar",
  description: "Gera um edit do Neymar com o texto informado!",
  commands: ["neymar"],
  usage: `${PREFIX}neymar Seu Texto Aqui`,

  handle: async ({
    sendReply,
    fullArgs,
    remoteJid,
    socket,
    webMessage,
  }) => {
    if (!fullArgs.trim()) {
      throw new InvalidParameterError(
        `Cadê o texto?\n\nExemplo: *${PREFIX}neymar Seu Nome*`
      );
    }

    await sendReply("▧⃯⃟𝙶𝚎𝚛𝚊𝚗𝚍𝚘 𝚂𝚎𝚞 𝙴𝚍𝚒𝚝ฺ͘.•⚽ ݈݇─");

    const linhas = quebrarLinhas(fullArgs, LIMITE_POR_LINHA);
    const texto  = encodeURIComponent(linhas.join("\n"));

    const url =
      `https://takeshi-bot-01.sirv.com/20260521_091312.jpg` +
      `?text=${texto}` +
      `&text.size=34` +
      `&text.font.family=Playfair%20Display` +
      `&text.font.style=italic` +
      `&text.color=1a1a1a` +
      `&text.background.opacity=0.92` +
      `&text.position.x=-245` +
      `&text.position.y=-920` +
      `&rotate=-3`;

    const imageBuffer = await getBuffer(url);

    await socket.sendMessage(
      remoteJid,
      { image: imageBuffer },
      { quoted: webMessage }
    );
  },
};
