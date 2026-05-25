import { PREFIX } from "../../../config.js";

const PIADAS = [
  "Por que o espantalho ganhou prêmio? Era outstanding no campo!",
  "O que o 0 disse ao 8? Que cinto bonito!",
  "Por que o livro de matemática estava triste? Tinha muitos problemas.",
  "O que é um peixe sem olho? Um pxe.",
  "Por que o computador foi ao médico? Estava com vírus!",
  "O que é uma anta com óculos? Uma antalogia!",
  "Qual o contrário de volátil? Vem a pé!",
  "Por que a lua não come? Porque já está cheia!",
  "Qual animal tem mais letras? O cavalo — tem um R a mais! 🐴",
  "Por que o goleiro não dorme? Tem medo de levar cabeçada na cama!",
  "O que o Oceano disse para a praia? Nada (onda).",
  "Sabe por que o esqueleto não briga? Não tem estômago pra isso!",
  "Por que o livro ligou para o outro livro? Para dar uma folheada!",
  "O que é um bode falando grego? Um capricórnio!",
  "Qual é o animal mais antigo? A zebra — está em preto e branco!",
];

export default {
  name: "piada",
  description: "Conta uma piada aleatória.",
  commands: ["piada", "piadas"],
  usage: `${PREFIX}piada`,
  handle: async ({ sendReply }) => {
    const p = PIADAS[Math.floor(Math.random() * PIADAS.length)];
    await sendReply(`😂 *Piada do dia:*\n\n_${p}_`);
  },
};
