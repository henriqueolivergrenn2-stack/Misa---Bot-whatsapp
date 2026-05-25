import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { onlyNumbers } from "../../../utils/index.js";

const SHIP_IMAGE_URL = "https://telegra.ph/file/070ced9a362da470ae3f9.jpg";

const FRASES_ALTO = [
  "💘 Essa dupla foi feita no céu! O universo conspirou pra isso!",
  "🔥 A química entre vocês é irresistível, alguém chama os bombeiros!",
  "💞 Dois corações que batem no mesmo ritmo. Isso é raro demais!",
  "🌹 Essa combinação é tão perfeita que até o cupido ficou com inveja!",
  "✨ Juntos vocês brilham mais do que qualquer estrela do céu!",
  "💑 Essa é aquela história de amor que vira filme!",
  "🥰 Compatibilidade absurda! Alguém avisa a família já!",
  "💫 O destino sabe o que faz… e dessa vez ele acertou em cheio!",
];

const FRASES_BAIXO = [
  "😬 Hmm... talvez seja melhor ficarem só na amizade mesmo.",
  "💔 O universo pediu pra vocês esperarem mais um pouco.",
  "😅 A faísca tá fraca... mas quem sabe com o tempo, né?",
  "🤷 Não é que não role, é que o timing ainda não chegou.",
  "🌧️ Esse ship tá precisando de mais chuva pra florescer.",
  "😶 O cupido atirou, mas a flecha desviou um pouquinho...",
  "🫤 Compatibilidade baixa, mas milagres acontecem todo dia!",
  "🍂 Não é a melhor combinação, mas o coração é teimoso mesmo.",
];

function calcShip(num1, num2) {
  const seed = [...`${num1}${num2}`].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const porcentagem = seed % 101;
  const isAlto = porcentagem >= 50;
  const frases = isAlto ? FRASES_ALTO : FRASES_BAIXO;
  const frase = frases[seed % frases.length];
  const emoji = porcentagem >= 80 ? "💘" : porcentagem >= 50 ? "💕" : porcentagem >= 30 ? "💔" : "😬";
  const barra = "█".repeat(Math.floor(porcentagem / 10)) + "░".repeat(10 - Math.floor(porcentagem / 10));
  return { porcentagem, frase, emoji, barra };
}

async function sendShip(socket, remoteJid, webMessage, jid1, jid2) {
  const num1 = onlyNumbers(jid1);
  const num2 = onlyNumbers(jid2);
  const { porcentagem, frase, emoji, barra } = calcShip(num1, num2);

  const mentions = [jid1, jid2];

  const caption =
    `${emoji} *SHIP DETECTOR* ${emoji}\n\n` +
    `👤 @${num1} + @${num2}\n\n` +
    `${barra} *${porcentagem}%*\n\n` +
    `${frase}`;

  try {
    const res = await fetch(SHIP_IMAGE_URL);
    if (!res.ok) throw new Error();
    const buffer = Buffer.from(await res.arrayBuffer());
    await socket.sendMessage(remoteJid, { image: buffer, caption, mentions }, { quoted: webMessage });
  } catch {
    await socket.sendMessage(remoteJid, { text: caption, mentions }, { quoted: webMessage });
  }
}

export default {
  name: "ship",
  description: "Calcula a compatibilidade entre dois usuários!",
  commands: ["ship"],
  usage: `${PREFIX}ship @usuario1 @usuario2  |  ${PREFIX}ship aleatorio`,

  handle: async ({
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
    remoteJid,
    socket,
    webMessage,
    fullArgs,
    isGroup,
    getGroupParticipants,
  }) => {
    if (!isGroup) {
      await sendErrorReply("Este comando só pode ser usado em grupos!");
      return;
    }

    await sendWaitReact();

    // Sub-comando: .ship aleatorio
    if (fullArgs.trim().toLowerCase() === "aleatorio") {
      const participants = await getGroupParticipants();

      // Aceita @lid ou @s.whatsapp.net
      const validos = participants
        .map((p) => p.id)
        .filter((id) => id && onlyNumbers(id).length > 4);

      if (validos.length < 2) {
        await sendErrorReply("Não há membros suficientes no grupo!");
        return;
      }

      const shuffled = [...validos].sort(() => Math.random() - 0.5);
      await sendSuccessReact();
      await sendShip(socket, remoteJid, webMessage, shuffled[0], shuffled[1]);
      return;
    }

    // Ship com menções normais
    const mentioned =
      webMessage?.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
      webMessage?.message?.imageMessage?.contextInfo?.mentionedJid ||
      [];

    if (mentioned.length < 2) {
      throw new InvalidParameterError(
        `Marque 2 pessoas ou use *${PREFIX}ship aleatorio*!\n\nExemplo: ${PREFIX}ship @pessoa1 @pessoa2`
      );
    }

    const jid1 = mentioned[0];
    const jid2 = mentioned[1];

    if (onlyNumbers(jid1) === onlyNumbers(jid2)) {
      throw new InvalidParameterError("Você não pode shipar uma pessoa com ela mesma! 😄");
    }

    await sendSuccessReact();
    await sendShip(socket, remoteJid, webMessage, jid1, jid2);
  },
};
