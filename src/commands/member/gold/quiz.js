import { PREFIX } from "../../../config.js";
import { addGold, fmt, fmtTime, getCd, getPlayer, getNow, rand, save } from "../../../utils/economy.js";

const PERGUNTAS = [
  { p: "Qual e a capital do Brasil?",               r: "brasilia",   d: ["Sao Paulo", "Rio de Janeiro", "Brasilia", "Salvador"],      premio: 200 },
  { p: "Quantos estados tem o Brasil?",             r: "26",         d: ["24", "26", "27", "28"],                                      premio: 200 },
  { p: "Qual o maior oceano do mundo?",             r: "pacifico",   d: ["Atlantico", "Indico", "Pacifico", "Artico"],                  premio: 200 },
  { p: "Quantos planetas tem o Sistema Solar?",     r: "8",          d: ["7", "8", "9", "10"],                                         premio: 200 },
  { p: "Qual e o menor pais do mundo?",             r: "vaticano",   d: ["Monaco", "Vaticano", "Maldivas", "Liechtenstein"],            premio: 250 },
  { p: "Qual elemento quimico tem simbolo Au?",     r: "ouro",       d: ["Prata", "Bronze", "Ferro", "Ouro"],                          premio: 300 },
  { p: "Quem pintou a Mona Lisa?",                  r: "da vinci",   d: ["Picasso", "Da Vinci", "Michelangelo", "Rafael"],             premio: 250 },
  { p: "Quanto e a raiz quadrada de 144?",          r: "12",         d: ["11", "12", "13", "14"],                                      premio: 200 },
  { p: "Em que ano o Brasil foi descoberto?",       r: "1500",       d: ["1498", "1500", "1502", "1492"],                              premio: 200 },
  { p: "Qual e o animal mais rapido do mundo?",     r: "guepardo",   d: ["Falcao", "Guepardo", "Leao", "Cavalo"],                      premio: 200 },
  { p: "Qual e a linguagem do bot?",                r: "javascript", d: ["Python", "JavaScript", "Java", "C++"],                       premio: 300 },
  { p: "Qual e o osso mais longo do corpo humano?", r: "femur",      d: ["Tibia", "Fibula", "Femur", "Umero"],                         premio: 300 },
  { p: "H2O e a formula de qual substancia?",       r: "agua",       d: ["Alcool", "Agua", "Sal", "Acucar"],                           premio: 200 },
  { p: "Quantas horas tem um dia?",                 r: "24",         d: ["12", "20", "24", "48"],                                      premio: 150 },
  { p: "Qual o continente mais populoso?",          r: "asia",       d: ["Europa", "America", "Asia", "Africa"],                       premio: 200 },
  { p: "Qual e o pais mais populoso do mundo?",     r: "india",      d: ["China", "India", "EUA", "Brasil"],                          premio: 250 },
  { p: "Quantos lados tem um hexagono?",            r: "6",          d: ["5", "6", "7", "8"],                                          premio: 150 },
  { p: "Qual e o metal mais caro do mundo?",        r: "rhodium",    d: ["Ouro", "Platina", "Rhodium", "Iridio"],                      premio: 350 },
  { p: "Quantos ossos tem o corpo humano adulto?",  r: "206",        d: ["186", "196", "206", "216"],                                   premio: 300 },
  { p: "Em que continente fica o Egito?",           r: "africa",     d: ["Asia", "Europa", "Africa", "Oriente Medio"],                  premio: 200 },
];

const activeQuizzes = new Map();

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default {
  name: "quiz",
  description: "Responda perguntas e ganhe gold!",
  commands: ["quiz"],
  usage: `${PREFIX}quiz`,
  handle: async ({ sendReply, sendWarningReply, sendSuccessReact, userLid, webMessage, fullArgs }) => {
    const p = getPlayer(userLid, webMessage?.pushName);
    const wait = getCd(p.cooldowns.quiz, 180_000);
    const active = activeQuizzes.get(userLid);

    // --- responder pergunta ativa ---
    if (active) {
      if (Date.now() > active.expires) {
        activeQuizzes.delete(userLid);
      } else {
        const resposta = normalize(fullArgs || "");
        if (!resposta) {
          const opts = active.question.d
            .map((d, i) => ["A", "B", "C", "D"][i] + ") " + d)
            .join("\n");
          return sendWarningReply(
            "⏳ Voce tem uma pergunta pendente!\n\n*" +
              active.question.p +
              "*\n\n" +
              opts +
              "\n\nResponda com a letra (A/B/C/D) ou o texto!"
          );
        }

        const correto = active.question.r;
        const opcoes = active.question.d.map((d) => normalize(d));
        const letraIdx = ["a", "b", "c", "d"].indexOf(resposta);
        const acertou =
          resposta === correto ||
          (letraIdx >= 0 && opcoes[letraIdx] === correto) ||
          resposta === correto;

        activeQuizzes.delete(userLid);
        p.cooldowns.quiz = getNow();
        save();

        const respostaCorreta = active.question.d.find(
          (d) => normalize(d) === correto
        );

        if (acertou) {
          addGold(userLid, active.question.premio);
          await sendSuccessReact();
          return sendReply(
            "✅ *CORRETO!*\n\n" +
              "Resposta: *" +
              respostaCorreta +
              "*\n" +
              "Premio: *+" +
              fmt(active.question.premio) +
              " 🪙*\n\n" +
              "💰 Bolso: *" +
              fmt(p.gold) +
              " 🪙*\n" +
              "_Proximo quiz em 3 minutos!_"
          );
        }

        return sendReply(
          "❌ *ERROU!*\n\n" +
            "Resposta correta: *" +
            respostaCorreta +
            "*\n\n" +
            "_Proximo quiz em 3 minutos!_"
        );
      }
    }

    if (wait > 0) return sendWarningReply("⏳ Aguarde *" + fmtTime(wait) + "* para o proximo quiz.");

    // --- nova pergunta ---
    const q = PERGUNTAS[rand(0, PERGUNTAS.length - 1)];
    const opcoes = [...q.d].sort(() => Math.random() - 0.5);
    const q2 = { p: q.p, r: q.r, d: opcoes, premio: q.premio };
    activeQuizzes.set(userLid, { question: q2, expires: Date.now() + 30_000 });

    const optsText = opcoes
      .map((d, i) => ["A", "B", "C", "D"][i] + ") " + d)
      .join("\n");

    await sendReply(
      "🧠 *QUIZ!*\n\n" +
        "*" +
        q2.p +
        "*\n\n" +
        optsText +
        "\n\n💰 Premio: *" +
        fmt(q2.premio) +
        " 🪙*\n" +
        "_Voce tem 30 segundos! Responda com a letra ou o texto._"
    );
  },
};
