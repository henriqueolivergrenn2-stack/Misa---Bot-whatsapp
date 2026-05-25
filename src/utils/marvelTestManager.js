/**
 * marvelTestManager.js — Teste Psicológico Marvel
 *
 * Base científica: Modelo Big Five (OCEAN)
 *   O = Openness (Abertura à Experiência)
 *   C = Conscientiousness (Conscienciosidade)
 *   A = Agreeableness (Amabilidade)
 *   E = Extraversion (Extroversão)
 *   N = Neuroticism (Neuroticismo)
 *
 * Colocar em: src/utils/marvelTestManager.js
 *
 * Fotos dos heróis: assets/marvel/<arquivo>
 * Adicionar no dynamicCommand.js:
 *   import { processMarvelTest } from "./marvelTestManager.js";
 *   if (activeGroup) {
 *     const marvelProcessed = await processMarvelTest(paramsHandler);
 *     if (marvelProcessed) return;
 *   }
 */

import fs from "node:fs";
import path from "node:path";
import { ASSETS_DIR, PREFIX } from "../config.js";

// ─── Estado ativo dos testes ──────────────────────────────────────────────────
// Chave: `${remoteJid}:${userLid}`
const activeTests = new Map();

// ─── 10 Perguntas (Big Five) ──────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    text: "Diante de uma situação nova e desafiadora, você tende a...",
    options: [
      { text: "Criar uma estratégia inovadora e original", scores: { O: 2, C: 1 } },
      { text: "Agir com coragem e confiança imediatamente", scores: { E: 2, C: 1 } },
      { text: "Analisar os riscos e planejar cada detalhe", scores: { C: 2, O: 1 } },
      { text: "Buscar o apoio e a perspectiva de outras pessoas", scores: { A: 2, E: 1 } },
    ],
  },
  {
    id: 2,
    text: "O que mais te move no dia a dia?",
    options: [
      { text: "Descobrir coisas novas e explorar o desconhecido", scores: { O: 2, E: 1 } },
      { text: "Cumprir minhas responsabilidades com excelência", scores: { C: 2, A: 1 } },
      { text: "Estar junto de quem amo e ajudá-los sempre", scores: { A: 2, C: 1 } },
      { text: "Viver experiências intensas e marcantes", scores: { E: 2, O: 1 } },
    ],
  },
  {
    id: 3,
    text: "Quando você comete um erro grave, sua reação é...",
    options: [
      { text: "Analisar friamente o que deu errado e corrigir", scores: { C: 2, O: 1 } },
      { text: "Sentir profundamente, mas usar isso como força", scores: { N: 2, E: 1 } },
      { text: "Buscar ajuda e a perspectiva de quem confio", scores: { A: 2, E: 1 } },
      { text: "Assumir responsabilidade e seguir em frente", scores: { C: 2, A: 1 } },
    ],
  },
  {
    id: 4,
    text: "Qual é o seu maior valor pessoal?",
    options: [
      { text: "Justiça — fazer o que é certo, sempre", scores: { C: 2, A: 1 } },
      { text: "Liberdade — criar e explorar sem limites", scores: { O: 2, E: 1 } },
      { text: "Lealdade — estar ao lado de quem importa", scores: { A: 2, C: 1 } },
      { text: "Autossuperação — ser melhor do que ontem", scores: { O: 2, C: 1 } },
    ],
  },
  {
    id: 5,
    text: "Em um grupo de pessoas, você naturalmente...",
    options: [
      { text: "Assume a liderança e inspira os outros", scores: { E: 2, C: 1 } },
      { text: "Oferece ideias criativas e fora do convencional", scores: { O: 2, E: 1 } },
      { text: "Garante que todos se sintam incluídos e ouvidos", scores: { A: 2, E: 1 } },
      { text: "Foca em fazer sua parte com perfeição", scores: { C: 2, A: 1 } },
    ],
  },
  {
    id: 6,
    text: "Como você lida com situações de alta pressão?",
    options: [
      { text: "Mantenho a calma e penso com clareza total", scores: { C: 2, A: 1 } },
      { text: "Sinto a adrenalina e rendo melhor sob pressão", scores: { E: 2, C: 1 } },
      { text: "Preciso de um tempo para processar as emoções", scores: { N: 2, O: 1 } },
      { text: "Convoco quem puder ajudar e agimos juntos", scores: { A: 2, E: 1 } },
    ],
  },
  {
    id: 7,
    text: "Diante de uma injustiça, você...",
    options: [
      { text: "Age imediatamente, mesmo em desvantagem", scores: { E: 2, C: 1 } },
      { text: "Planeja cuidadosamente para garantir a vitória", scores: { C: 2, O: 1 } },
      { text: "Sente uma raiva intensa que vira força motriz", scores: { N: 2, E: 1 } },
      { text: "Tenta resolver pelo diálogo e pela empatia", scores: { A: 2, C: 1 } },
    ],
  },
  {
    id: 8,
    text: "Como as pessoas ao seu redor costumam te descrever?",
    options: [
      { text: "Brilhante e cheio(a) de ideias originais", scores: { O: 2, C: 1 } },
      { text: "Confiável e comprometido(a) com suas obrigações", scores: { C: 2, A: 1 } },
      { text: "Carinhoso(a) e sempre disposto(a) a ajudar", scores: { A: 2, O: 1 } },
      { text: "Animado(a), divertido(a) e cheio(a) de energia", scores: { E: 2, O: 1 } },
    ],
  },
  {
    id: 9,
    text: "Quando precisa tomar uma decisão importante...",
    options: [
      { text: "Confio na lógica e analiso os dados disponíveis", scores: { C: 2, O: 1 } },
      { text: "Sigo minhas emoções e intuições mais profundas", scores: { N: 2, O: 1 } },
      { text: "Penso no que é melhor para todos envolvidos", scores: { A: 2, C: 1 } },
      { text: "Ajo com base nos meus valores e princípios", scores: { C: 2, A: 1 } },
    ],
  },
  {
    id: 10,
    text: "Como você quer ser lembrado(a)?",
    options: [
      { text: "Como alguém que mudou o mundo com ideias geniais", scores: { O: 2, C: 1 } },
      { text: "Como alguém que nunca desistiu do que era certo", scores: { C: 2, A: 1 } },
      { text: "Como alguém que tocou o coração das pessoas", scores: { A: 2, E: 1 } },
      { text: "Como alguém que viveu com paixão e intensidade", scores: { E: 2, O: 1 } },
    ],
  },
];

// ─── Heróis Marvel com perfis Big Five (escala 0-10) ─────────────────────────
// Referências: estudos de personalidade em personagens ficcionais,
// análises de Myers-Briggs to Big Five conversions (McCrae & Costa, 1989)
// e o modelo de Olver & Mooradian (2003) aplicado a arquétipos heroicos.

const HEROES = [
  {
    name: "Tony Stark (Homem de Ferro)",
    file: "homem-de-ferro.jpg",
    O: 9, C: 9, A: 3, E: 8, N: 4,
    desc: "Você combina genialidade criativa (Alta Abertura) com disciplina e ambição (Alta Conscienciosidade). Como Tony, você confia no seu próprio intelecto e tem uma capacidade única de transformar ideias em soluções reais — mas pode ser percebido(a) como arrogante por quem ainda não te conhece.",
    dominant: ["Abertura à Experiência", "Conscienciosidade"],
  },
  {
    name: "Steve Rogers (Capitão América)",
    file: "capitao-america.jpg",
    O: 5, C: 10, A: 9, E: 6, N: 2,
    desc: "Você é a definição de integridade. Com altíssima Conscienciosidade e Amabilidade, como Steve Rogers, você coloca o dever e as pessoas acima de tudo. Sua estabilidade emocional (baixo Neuroticismo) é sua âncora em qualquer crise.",
    dominant: ["Conscienciosidade", "Amabilidade"],
  },
  {
    name: "Thor",
    file: "thor.jpg",
    O: 7, C: 5, A: 6, E: 10, N: 3,
    desc: "Você é energia pura. Com Extroversão no máximo, como Thor, você naturalmente atrai e inspira as pessoas ao seu redor. Sua abertura a experiências novas e sua coragem fazem de você um líder nato — apesar de às vezes agir antes de pensar.",
    dominant: ["Extroversão", "Abertura à Experiência"],
  },
  {
    name: "Bruce Banner (Hulk)",
    file: "hulk.jpg",
    O: 10, C: 7, A: 5, E: 2, N: 9,
    desc: "Você é a mente mais brilhante e complexa do grupo. Sua Abertura à Experiência extraordinária (Off the charts, como diria Banner) vive em conflito com um alto Neuroticismo — uma intensidade emocional que, quando canalizada, pode mover montanhas.",
    dominant: ["Abertura à Experiência", "Neuroticismo"],
  },
  {
    name: "Natasha Romanoff (Viúva Negra)",
    file: "viuva-negra.jpg",
    O: 7, C: 10, A: 4, E: 3, N: 3,
    desc: "Você é precisão e controle. Extremamente Consciencioso(a) e emocionalmente estável (baixo Neuroticismo), como Natasha você executa cada tarefa com maestria, preferindo a profundidade de poucas relações à superficialidade de muitas.",
    dominant: ["Conscienciosidade", "Abertura à Experiência"],
  },
  {
    name: "Clint Barton (Gavião Arqueiro)",
    file: "gaviao-arqueiro.jpg",
    O: 5, C: 8, A: 8, E: 5, N: 3,
    desc: "Você é o herói silencioso. Equilibrando alta Conscienciosidade com alta Amabilidade, como Clint, você é extremamente confiável e leal, mas sem a necessidade de holofotes. Seu maior poder é a consistência — você sempre está lá quando precisam.",
    dominant: ["Conscienciosidade", "Amabilidade"],
  },
  {
    name: "Peter Parker (Homem-Aranha)",
    file: "homem-aranha.jpg",
    O: 8, C: 7, A: 9, E: 7, N: 6,
    desc: "Você é o coração do grupo. Sua combinação de Abertura, Amabilidade e Extroversão, como Peter Parker, te torna uma pessoa criativa, empática e adorável. Seu Neuroticismo moderado reflete a profundidade de quem sente tudo com muita intensidade.",
    dominant: ["Amabilidade", "Abertura à Experiência"],
  },
  {
    name: "T'Challa (Pantera Negra)",
    file: "pantera-negra.jpg",
    O: 7, C: 10, A: 8, E: 5, N: 2,
    desc: "Você carrega o mundo com elegância. Como T'Challa, sua altíssima Conscienciosidade e Amabilidade combinam-se com uma estabilidade emocional rara. Você pensa no coletivo antes do individual e lidera pelo exemplo — não pela força.",
    dominant: ["Conscienciosidade", "Amabilidade"],
  },
  {
    name: "Stephen Strange (Doutor Estranho)",
    file: "doutor-estranho.jpg",
    O: 10, C: 9, A: 3, E: 5, N: 4,
    desc: "Sua mente opera em dimensões que poucos alcançam. Com Abertura à Experiência máxima e altíssima Conscienciosidade, como Strange, você nunca para de aprender e desafia qualquer limite — mesmo que sua baixa Amabilidade faça você parecer distante a princípio.",
    dominant: ["Abertura à Experiência", "Conscienciosidade"],
  },
  {
    name: "Wanda Maximoff (Feiticeira Escarlate)",
    file: "feiticeira-escarlate.jpg",
    O: 9, C: 4, A: 6, E: 4, N: 10,
    desc: "Você sente tudo com uma intensidade que vai além do comum. Como Wanda, seu Alto Neuroticismo não é fraqueza — é a fonte do seu poder. Sua Abertura à Experiência e profundidade emocional te tornam capaz de coisas que outros nem imaginam ser possíveis.",
    dominant: ["Neuroticismo", "Abertura à Experiência"],
  },
  {
    name: "Scott Lang (Homem-Formiga)",
    file: "homem-formiga.jpg",
    O: 6, C: 4, A: 8, E: 8, N: 5,
    desc: "Você é o herói mais humano de todos. Com alta Amabilidade e Extroversão, como Scott Lang, você usa o humor e a conexão genuína com as pessoas como superpoderes. Nem sempre o mais organizado, mas sempre o mais presente quando importa.",
    dominant: ["Amabilidade", "Extroversão"],
  },
  {
    name: "Carol Danvers (Capitã Marvel)",
    file: "capita-marvel.jpg",
    O: 6, C: 9, A: 4, E: 6, N: 2,
    desc: "Você é pura força e determinação. Como Carol Danvers, sua alta Conscienciosidade e baixo Neuroticismo te tornam uma presença inabalável. Você não precisa da aprovação dos outros — sua convicção interna é combustível suficiente.",
    dominant: ["Conscienciosidade", "Estabilidade Emocional"],
  },
  {
    name: "Sam Wilson (Falcão)",
    file: "falcao.jpg",
    O: 6, C: 7, A: 9, E: 8, N: 3,
    desc: "Você é o líder que as pessoas precisam, não o que esperam. Como Sam Wilson, sua combinação de Amabilidade e Extroversão faz você inspirar através da conexão genuína. Você lidera pelo coração, e as pessoas confiam em você por isso.",
    dominant: ["Amabilidade", "Extroversão"],
  },
  {
    name: "Peter Quill (Star-Lord)",
    file: "star-lord.jpg",
    O: 8, C: 3, A: 6, E: 10, N: 5,
    desc: "Você é energia, carisma e improviso puro. Como Star-Lord, sua Extroversão máxima e alta Abertura à Experiência fazem de você alguém irresistível e criativo — mesmo que a Conscienciosidade não seja exatamente seu ponto forte. O plano surge no meio da ação.",
    dominant: ["Extroversão", "Abertura à Experiência"],
  },
  {
    name: "Gamora",
    file: "gamora.jpg",
    O: 6, C: 9, A: 5, E: 4, N: 4,
    desc: "Você é determinação e propósito. Como Gamora, sua alta Conscienciosidade te faz avançar com precisão em direção aos seus objetivos. Você pode parecer fria por fora, mas quem te conhece sabe que toda ação tem um porquê profundo.",
    dominant: ["Conscienciosidade", "Abertura à Experiência"],
  },
  {
    name: "Rocket Raccoon",
    file: "rocket.jpg",
    O: 9, C: 8, A: 2, E: 6, N: 7,
    desc: "Você é um gênio incompreendido. Com Abertura à Experiência e Conscienciosidade altíssimas, como Rocket, você resolve problemas de formas que ninguém mais pensaria. Seu alto Neuroticismo e baixa Amabilidade são escudos — quem passa por eles encontra uma lealdade inabalável.",
    dominant: ["Abertura à Experiência", "Conscienciosidade"],
  },
  {
    name: "Groot",
    file: "groot.jpg",
    O: 5, C: 5, A: 10, E: 6, N: 2,
    desc: "Você é pura presença e amor. Com Amabilidade máxima e baixíssimo Neuroticismo, como Groot, você não precisa de palavras elaboradas para tocar as pessoas. Sua bondade genuína e estabilidade emocional são um presente raro para quem está ao seu lado.",
    dominant: ["Amabilidade", "Estabilidade Emocional"],
  },
  {
    name: "Nick Fury",
    file: "nick-fury.jpg",
    O: 7, C: 10, A: 3, E: 4, N: 3,
    desc: "Você enxerga o que os outros não veem. Com Conscienciosidade máxima e alta Abertura à Experiência, como Nick Fury, você pensa dez passos à frente de todos e constrói sistemas que sobrevivem a qualquer crise. A liderança é sua natureza — mesmo que nem sempre seja visível.",
    dominant: ["Conscienciosidade", "Abertura à Experiência"],
  },
  {
    name: "Shang-Chi",
    file: "shang-chi.jpg",
    O: 7, C: 9, A: 8, E: 6, N: 3,
    desc: "Você é equilíbrio em movimento. Como Shang-Chi, sua alta Conscienciosidade e Amabilidade convivem com abertura ao novo e estabilidade emocional invejável. Você transforma tradição e inovação em força, sem abrir mão de nenhuma das duas.",
    dominant: ["Conscienciosidade", "Amabilidade"],
  },
  {
    name: "Kamala Khan (Ms. Marvel)",
    file: "ms-marvel.jpg",
    O: 9, C: 7, A: 9, E: 8, N: 5,
    desc: "Você é autenticidade e entusiasmo em forma de superpoder. Como Kamala, sua combinação de alta Abertura, Amabilidade e Extroversão te faz conectar com todos — e sua paixão genuína transforma qualquer ambiente. Você não apenas sonha: você age.",
    dominant: ["Abertura à Experiência", "Amabilidade"],
  },
  {
    name: "Marc Spector (Cavaleiro da Lua)",
    file: "cavaleiro-da-lua.jpg",
    O: 8, C: 7, A: 3, E: 4, N: 10,
    desc: "Você é profundidade e complexidade como ninguém. Com Neuroticismo máximo e alta Abertura à Experiência, como Marc Spector, você vive entre intensidades que outros mal compreendem. Sua força nasce exatamente de onde outros veriam vulnerabilidade.",
    dominant: ["Neuroticismo", "Abertura à Experiência"],
  },
  {
    name: "Jessica Jones",
    file: "jessica-jones.jpg",
    O: 6, C: 3, A: 4, E: 3, N: 9,
    desc: "Você é brutalidade honesta e força bruta de sobrevivência. Como Jessica Jones, seu alto Neuroticismo não te paralisa — te endurece. Por trás da fachada áspera há uma bússola moral inabalável e uma lealdade feroz pelas pessoas que realmente importam.",
    dominant: ["Neuroticismo", "Abertura à Experiência"],
  },
  {
    name: "Matt Murdock (Demolidor)",
    file: "demolidor.jpg",
    O: 7, C: 10, A: 8, E: 5, N: 6,
    desc: "Você é dever e sacrifício elevados ao máximo. Com altíssima Conscienciosidade e Amabilidade, como Matt Murdock, você não aceita meio-termo quando se trata de justiça. Seu Neuroticismo moderado reflete a luta constante entre razão e emoção — uma tensão que te torna mais humano(a).",
    dominant: ["Conscienciosidade", "Amabilidade"],
  },
  {
    name: "Kate Bishop (Gavião Arqueiro II)",
    file: "kate-bishop.jpg",
    O: 7, C: 6, A: 7, E: 8, N: 5,
    desc: "Você é talento bruto com coração enorme. Como Kate Bishop, sua Extroversão e Amabilidade te tornam magnética e empática, enquanto sua Abertura à Experiência garante que você nunca pare de crescer. Você ainda está descobrindo sua versão mais poderosa — e isso é empolgante.",
    dominant: ["Extroversão", "Amabilidade"],
  },
  {
    name: "America Chavez",
    file: "america-chavez.jpg",
    O: 8, C: 6, A: 8, E: 9, N: 4,
    desc: "Você é força, coração e presença inesquecível. Com alta Extroversão, Amabilidade e Abertura à Experiência, como America Chavez, você atravessa qualquer obstáculo — literalmente — sem perder a autenticidade. Você sabe quem é, e isso é tudo.",
    dominant: ["Extroversão", "Abertura à Experiência"],
  },
  {
    name: "Mantis",
    file: "mantis.jpg",
    O: 7, C: 5, A: 10, E: 4, N: 6,
    desc: "Você sente o que os outros sentem antes que eles mesmos percebam. Com Amabilidade máxima, como Mantis, você possui uma empatia extraordinária — uma das mais raras e valiosas qualidades do Big Five. Sua sensibilidade não é fraqueza: é seu dom mais poderoso.",
    dominant: ["Amabilidade", "Abertura à Experiência"],
  },
  {
    name: "Bucky Barnes (Soldado Invernal)",
    file: "soldado-invernal.jpg",
    O: 5, C: 8, A: 5, E: 3, N: 8,
    desc: "Você é resiliência em forma humana. Como Bucky, você carrega um histórico pesado mas segue em frente com Conscienciosidade e determinação. Seu Neuroticismo elevado reflete cicatrizes reais — e a coragem de continuar apesar delas é o que define quem você é.",
    dominant: ["Conscienciosidade", "Neuroticismo"],
  },
  {
    name: "Okoye",
    file: "okoye.jpg",
    O: 5, C: 10, A: 6, E: 5, N: 2,
    desc: "Você é dever e honra personificados. Com Conscienciosidade máxima e baixíssimo Neuroticismo, como Okoye, você é o tipo de pessoa com quem todos querem ao lado numa crise. Leal ao que acredita, inabalável sob pressão — uma força da natureza discreta e letal.",
    dominant: ["Conscienciosidade", "Estabilidade Emocional"],
  },
  {
    name: "Valquíria",
    file: "valquiria.jpg",
    O: 7, C: 5, A: 5, E: 7, N: 6,
    desc: "Você é liberdade e coragem com cicatrizes. Como Valquíria, sua Extroversão e Abertura à Experiência te empurram a viver com intensidade, enquanto seu Neuroticismo moderado revela profundidade emocional que vai muito além do que você deixa aparecer.",
    dominant: ["Extroversão", "Abertura à Experiência"],
  },
  {
    name: "Wong",
    file: "wong.jpg",
    O: 7, C: 9, A: 6, E: 4, N: 2,
    desc: "Você é sabedoria e seriedade com camadas inesperadas. Como Wong, sua alta Conscienciosidade e estabilidade emocional te tornam um pilar confiável. Por trás da postura reservada há abertura genuína e senso de humor que poucos têm o privilégio de conhecer.",
    dominant: ["Conscienciosidade", "Abertura à Experiência"],
  },
  {
    name: "Nebula",
    file: "nebula.jpg",
    O: 6, C: 8, A: 3, E: 3, N: 8,
    desc: "Você é determinação forjada na dor. Como Nebula, seu alto Neuroticismo e Conscienciosidade criam uma combinação de intensidade e foco que, quando direcionados para o bem, é imparável. Sua jornada é de constante reinvenção — e você nunca para.",
    dominant: ["Conscienciosidade", "Neuroticismo"],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function testKey(remoteJid, userLid) {
  return `${remoteJid}:${userLid}`;
}

function buildQuestionText(test) {
  const q    = QUESTIONS[test.currentQ];
  const num  = test.currentQ + 1;
  const opts = q.options
    .map((o, i) => `*${i + 1}.* ${o.text}`)
    .join("\n");

  return [
    `🦸 *TESTE PSICOLÓGICO MARVEL* 🦸`,
    `📊 _Base científica: Modelo Big Five (OCEAN)_`,
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `❓ *Pergunta ${num}/10*`,
    ``,
    q.text,
    ``,
    opts,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    `_Responda com o número da sua opção (1, 2, 3 ou 4)_`,
  ].join("\n");
}

function bar(value, max = 10) {
  const filled = Math.round((value / max) * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

function pct(value, max = 10) {
  return Math.round((value / max) * 100) + "%";
}

// ─── Matching por distância Euclidiana normalizada ────────────────────────────
function matchHero(scores) {
  // Normaliza scores brutos para 0-10 (max raw ≈ 20)
  const norm = {
    O: Math.min((scores.O || 0) / 2, 10),
    C: Math.min((scores.C || 0) / 2, 10),
    A: Math.min((scores.A || 0) / 2, 10),
    E: Math.min((scores.E || 0) / 2, 10),
    N: Math.min((scores.N || 0) / 2, 10),
  };

  let best = null;
  let bestDist = Infinity;

  for (const hero of HEROES) {
    const dist = Math.sqrt(
      Math.pow(norm.O - hero.O, 2) +
      Math.pow(norm.C - hero.C, 2) +
      Math.pow(norm.A - hero.A, 2) +
      Math.pow(norm.E - hero.E, 2) +
      Math.pow(norm.N - hero.N, 2)
    );
    if (dist < bestDist) {
      bestDist = dist;
      best     = hero;
    }
  }

  return { hero: best, norm };
}

function buildResultText(userName, hero, norm) {
  return [
    `🦸 *TESTE PSICOLÓGICO MARVEL* 🦸`,
    `📊 _Base científica: Modelo Big Five (OCEAN)_`,
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `✨ *${userName}, você é:*`,
    `🎯 *${hero.name}*`,
    ``,
    `📖 *Análise do seu perfil:*`,
    hero.desc,
    ``,
    `📈 *Seus traços Big Five:*`,
    `🔬 Abertura:         ${bar(norm.O)} ${pct(norm.O)}`,
    `📋 Conscienciosidade: ${bar(norm.C)} ${pct(norm.C)}`,
    `🤝 Amabilidade:      ${bar(norm.A)} ${pct(norm.A)}`,
    `⚡ Extroversão:      ${bar(norm.E)} ${pct(norm.E)}`,
    `💭 Neuroticismo:     ${bar(norm.N)} ${pct(norm.N)}`,
    ``,
    `🏆 *Traços dominantes:* ${hero.dominant.join(" · ")}`,
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    `_Use *${PREFIX}testemarvell* para refazer o teste!_`,
  ].join("\n");
}

// ─── Exportações ──────────────────────────────────────────────────────────────

export function startTest(remoteJid, userLid, userName) {
  const key = testKey(remoteJid, userLid);
  activeTests.set(key, {
    currentQ: 0,
    scores:   { O: 0, C: 0, A: 0, E: 0, N: 0 },
    msgKey:   null,
    userName: userName || "Herói",
  });
  return buildQuestionText(activeTests.get(key));
}

export function hasActiveTest(remoteJid, userLid) {
  return activeTests.has(testKey(remoteJid, userLid));
}

export function cancelTest(remoteJid, userLid) {
  activeTests.delete(testKey(remoteJid, userLid));
}

/**
 * Intercepta mensagens numéricas (1-4) de quem tem teste ativo.
 * Chamado pelo dynamicCommand.js antes da verificação de prefixo.
 * Retorna true se consumiu a mensagem.
 */
export async function processMarvelTest(paramsHandler) {
  const { remoteJid, userLid, fullMessage, socket, webMessage } = paramsHandler;

  const key  = testKey(remoteJid, userLid);
  const test = activeTests.get(key);
  if (!test) return false;

  const trimmed = (fullMessage ?? "").trim();
  const answer  = parseInt(trimmed);

  if (isNaN(answer) || answer < 1 || answer > 4 || trimmed !== String(answer)) {
    return false; // não é uma resposta válida — deixa fluir
  }

  const userName = webMessage?.pushName || test.userName || "Herói";
  test.userName  = userName;

  // Aplica scores da resposta escolhida
  const chosen = QUESTIONS[test.currentQ].options[answer - 1];
  for (const [trait, val] of Object.entries(chosen.scores)) {
    test.scores[trait] = (test.scores[trait] || 0) + val;
  }

  test.currentQ++;

  // ── Ainda há perguntas ────────────────────────────────────────────────────
  if (test.currentQ < QUESTIONS.length) {
    const nextText = buildQuestionText(test);
    try {
      if (test.msgKey) {
        await socket.sendMessage(remoteJid, { text: nextText, edit: test.msgKey });
      } else {
        const sent = await socket.sendMessage(remoteJid, { text: nextText });
        test.msgKey = sent?.key ?? null;
      }
    } catch {
      const sent = await socket.sendMessage(remoteJid, { text: nextText });
      test.msgKey = sent?.key ?? null;
    }
    return true;
  }

  // ── Teste concluído ───────────────────────────────────────────────────────
  activeTests.delete(key);

  const { hero, norm } = matchHero(test.scores);
  const resultText     = buildResultText(userName, hero, norm);

  // Edita última pergunta com aviso de conclusão
  if (test.msgKey) {
    try {
      await socket.sendMessage(remoteJid, {
        text: `⏳ *${userName}*, calculando seu herói...\n\n_Analisando ${QUESTIONS.length} respostas com o modelo Big Five..._`,
        edit: test.msgKey,
      });
    } catch { /* ignora */ }
  }

  // Envia resultado com foto do herói (se disponível)
  const heroImg = path.resolve(ASSETS_DIR, "marvel", hero.file);

  if (fs.existsSync(heroImg)) {
    try {
      await socket.sendMessage(remoteJid, {
        image:   fs.readFileSync(heroImg),
        caption: resultText,
      });
      return true;
    } catch { /* fallback para texto */ }
  }

  // Fallback sem imagem
  await socket.sendMessage(remoteJid, { text: resultText });
  return true;
}

export function setTestMsgKey(remoteJid, userLid, msgKey) {
  const test = activeTests.get(testKey(remoteJid, userLid));
  if (test) test.msgKey = msgKey;
}

// Expõe lista de arquivos esperados para o admin saber quais fotos colocar
export const HERO_FILES = HEROES.map((h) => ({ name: h.name, file: h.file }));
