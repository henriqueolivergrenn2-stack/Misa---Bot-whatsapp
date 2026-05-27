/**
 * forcaManager.js — Sistema completo da Forca (individual + grupo + categoria)
 * Salve em: src/utils/forcaManager.js
 *
 * CORREÇÕES aplicadas:
 *  1. msgKey agora salva sentMsg?.key (não o objeto inteiro)
 *  2. Remoção do check de "isReply" para entrar no jogo em grupo —
 *     qualquer mensagem de 1 letra já conta como participação
 *  3. forcaFreeHandler verifica se a msg é reply da forca OU se já participou
 */

import { PREFIX } from "../config.js";

// ─── BANCO DE PALAVRAS ────────────────────────────────────────────────────────
export const BANCO = {
  "🐾 Animais": [
    "gato","cachorro","elefante","girafa","pinguim","tubarao","papagaio","camelo",
    "leao","tigre","zebra","hipopotamo","rinoceronte","crocodilo","tartaruga",
    "borboleta","aranha","escorpiao","aguia","flamingo","pelicano","tucano",
    "avestruz","capivara","preguica","jabuti","piranha","boto","lontra","lince",
    "guepardo","jaguar","pantera","lobo","raposa","texugo","castor","esquilo",
    "paca","cutia","ourico","morcego","coruja","gaviao","falcao","andorinha",
    "canario","periquito","calopsita","arara","jararaca","anaconda","sucuri",
    "cobra","lagartixa","iguana","camaleao","axolote","salamandra","sapo",
  ],
  "🌍 Países": [
    "brasil","argentina","portugal","australia","japao","canada","mexico","italia",
    "franca","alemanha","espanha","russia","china","india","egito","nigeria",
    "turquia","grecia","suecia","noruega","dinamarca","finlandia","holanda",
    "belgica","austria","suica","polonia","romenia","hungria","colombia",
    "venezuela","peru","chile","bolivia","paraguai","uruguai","equador","cuba",
    "jamaica","marrocos","angola","mocambique","tanzania","quenia",
    "iran","iraque","paquistao","indonesia","tailandia","vietna","coreia",
    "filipinas","malasia","singapura","myanmar",
  ],
  "🍎 Frutas e Alimentos": [
    "abacaxi","morango","melancia","goiaba","manga","caju","acerola","pitanga",
    "banana","laranja","limao","uva","maca","pera","pessego","ameixa","cereja",
    "melao","kiwi","mamao","maracuja","lichia","jabuticaba","cupuacu","bacuri",
    "pequi","umbu","murici","buriti","tamarindo","graviola","siriguela","pitomba",
    "sapoti","carambola","arroz","feijao","macarrao","batata","cenoura","tomate",
    "cebola","alho","brocolis","couve","espinafre","alface","pepino","abobrinha",
    "beringela","pimentao","quiabo","mandioca","pizza","hamburguer","sanduiche",
    "lasanha","sorvete","chocolate","brigadeiro","pudim","torta","bolo","biscoito",
  ],
  "💻 Tecnologia": [
    "computador","internet","smartphone","javascript","programador","software",
    "hardware","algoritmo","processador","memoria","teclado","monitor",
    "impressora","servidor","nuvem","aplicativo","sistema","rede","protocolo",
    "seguranca","criptografia","blockchain","robotica","automacao","transistor",
    "circuito","bateria","carregador","bluetooth","wireless","satelite","antena",
    "compilador","framework","biblioteca","repositorio","deploy","container",
    "microservico","endpoint",
  ],
  "⚽ Esportes": [
    "futebol","basquete","natacao","voleibol","tenis","ciclismo","atletismo",
    "ginastica","judo","karate","boxe","esgrima","hipismo","remo","canoagem",
    "vela","mergulho","surf","skate","snowboard","esqui","patinacao","hoquei",
    "golfe","beisebol","polo","rugby","handebol","futsal","badminton","squash",
    "pingpong","bilhar","xadrez","damas","boliche","maratona","triatlo",
  ],
  "🏛️ Profissões": [
    "medico","enfermeiro","dentista","farmaceutico","veterinario","biologo",
    "quimico","fisico","matematico","engenheiro","arquiteto","advogado",
    "promotor","juiz","delegado","policial","bombeiro","militar","professor",
    "pedagogo","psicologo","sociologo","filosofo","historiador","geografo",
    "economista","administrador","contador","auditor","analista","programador",
    "designer","fotografo","jornalista","escritor","poeta","musico","ator",
    "bailarino","cantor","compositor","pintor","escultor","cozinheiro",
    "padeiro","confeiteiro","motorista","piloto","marinheiro","astronauta",
  ],
  "🌿 Natureza": [
    "floresta","montanha","oceano","tempestade","relampago","vulcao","terremoto",
    "tsunami","tornado","furacao","ciclone","avalanche","deserto","savana",
    "pantanal","cerrado","caatinga","pampa","mangue","recife","glaciar",
    "iceberg","tundra","taiga","pradaria","cachoeira","corredeira","nascente",
    "estuario","lagoa","pantano","chapada","planalto","planicie","vale","canyon",
    "peninsula","ilha","arquipelago","cabo","estreito","baia","golfo",
  ],
  "🎓 Conhecimento": [
    "biblioteca","universidade","comunicacao","democracia","filosofia",
    "matematica","geometria","algebra","calculo","estatistica","probabilidade",
    "fisica","quimica","biologia","anatomia","fisiologia","genetica","ecologia",
    "geologia","paleontologia","arqueologia","antropologia","sociologia",
    "psicologia","neurologia","historia","geografia","literatura","gramatica",
    "sintaxe","semantica","ortografia","linguistica","pintura","escultura",
    "arquitetura","musica","harmonia","melodia","ritmo","fotografia","teatro",
  ],
  "🏠 Objetos do Dia a Dia": [
    "cadeira","sofa","cama","mesa","armario","gaveta","estante","prateleira",
    "geladeira","fogao","microondas","liquidificador","batedeira","torradeira",
    "televisao","controle","ventilador","aquecedor","lampada","interruptor",
    "tomada","tesoura","faca","garfo","colher","prato","tigela","caneca",
    "copo","garrafa","panela","frigideira","chaleira","bule","coador",
    "vassoura","rodo","balde","escova","esponja","detergente","sabonete",
    "shampoo","condicionador","perfume","desodorante",
  ],
  "🎭 Cultura e Entretenimento": [
    "aventura","misterio","romance","comedia","terror","ficcao","fantasia",
    "drama","suspense","animacao","documentario","serie","novela","circo",
    "carnaval","festival","forro","samba","pagode","baiao","funk","rap",
    "sertanejo","gospel","jazz","blues","rock","reggae","salsa","tango",
    "maracatu","frevo","capoeira","congada","reisado","quadrilha",
  ],
};

export const CATEGORIAS = Object.keys(BANCO);

export const DICA_CAT = {
  "🐾 Animais":                  "É um animal!",
  "🌍 Países":                   "É um país!",
  "🍎 Frutas e Alimentos":       "É uma fruta ou alimento!",
  "💻 Tecnologia":               "É um termo de tecnologia!",
  "⚽ Esportes":                  "É um esporte ou modalidade!",
  "🏛️ Profissões":               "É uma profissão!",
  "🌿 Natureza":                 "É algo da natureza!",
  "🎓 Conhecimento":             "É uma área do conhecimento!",
  "🏠 Objetos do Dia a Dia":     "É um objeto do dia a dia!",
  "🎭 Cultura e Entretenimento": "É algo de cultura ou entretenimento!",
};

export const FORCA_IMGS = [
  "  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========",
  "  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========",
];

// ─── ESTADO ───────────────────────────────────────────────────────────────────
export const gamesIndividual = new Map(); // userLid → game
export const gamesGrupo      = new Map(); // remoteJid → game

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export function norm(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
}

export function sortearPalavra(categoria) {
  if (categoria && BANCO[categoria]) {
    const lista = BANCO[categoria];
    return { palavra: norm(lista[Math.floor(Math.random() * lista.length)]), categoria };
  }
  const cat  = CATEGORIAS[Math.floor(Math.random() * CATEGORIAS.length)];
  const lista = BANCO[cat];
  return { palavra: norm(lista[Math.floor(Math.random() * lista.length)]), categoria: cat };
}

export function buildDisplay(palavra, acertos) {
  return palavra
    .split("")
    .map(c => (c === "-" || acertos.includes(c)) ? c : "_")
    .join(" ");
}

export function buildGameText(game, statusLine, mostrarCategoria) {
  if (mostrarCategoria === undefined) mostrarCategoria = true;
  const display  = buildDisplay(game.palavra, game.acertos);
  const forca    = FORCA_IMGS[Math.min(game.erros, 6)];
  const dicaLine = game.dicaUsada ? "💡 _" + (DICA_CAT[game.categoria] || game.categoria) + "_\n" : "";
  const catLine  = mostrarCategoria
    ? "🏷️ " + game.categoria + "  |  📏 *" + game.palavra.length + "* letras\n"
    : "📏 *" + game.palavra.length + "* letras\n";

  return (
    (statusLine || "🎮 *JOGO DA FORCA*") + "\n\n" +
    "```\n" + forca + "```\n\n" +
    "📝 `" + display + "`\n" +
    catLine +
    dicaLine +
    "❌ Erros: *" + game.erros + "/6*\n" +
    "🔤 Letras: " + (game.letrasUsadas.length ? game.letrasUsadas.join(" ").toUpperCase() : "nenhuma ainda")
  );
}

/**
 * Edita a mensagem da forca (usa game.msgKey que é o .key do objeto retornado pelo sendMessage).
 * Se falhar, envia nova mensagem.
 */
export async function editOrSend(socket, remoteJid, msgKey, text, sendReply) {
  if (msgKey) {
    try {
      await socket.sendMessage(remoteJid, { text, edit: msgKey });
      return;
    } catch { /* fallback para sendReply */ }
  }
  await sendReply(text);
}

export function processarTentativa(game, input, nome) {
  if (input.length === 1) {
    const letra = input;
    if (game.letrasUsadas.includes(letra)) {
      return { tipo: "ja_usada", letra };
    }
    game.letrasUsadas.push(letra);
    const acertou = game.palavra.includes(letra);
    if (acertou) game.acertos.push(letra);
    else game.erros++;

    const display = buildDisplay(game.palavra, game.acertos);
    const venceu  = !display.includes("_");
    const perdeu  = game.erros >= 6;

    if (venceu) return { tipo: "venceu", letra, nome };
    if (perdeu) return { tipo: "perdeu", letra, nome };
    return { tipo: acertou ? "letra_certa" : "letra_errada", letra, nome };
  }

  // Tentativa de palavra completa
  if (input === game.palavra) {
    return { tipo: "venceu", palavra: input, nome, direto: true };
  }
  game.erros = Math.min(game.erros + 2, 6);
  if (game.erros >= 6) return { tipo: "perdeu", palavra: input, nome };
  return { tipo: "palavra_errada", palavra: input, nome };
}

// ─── FREE HANDLER (interceptado pelo dynamicCommand) ─────────────────────────
export async function forcaFreeHandler(paramsHandler) {
  const { webMessage, remoteJid, userLid, sendReply, sendSuccessReact, socket } = paramsHandler;

  const raw =
    webMessage?.message?.conversation ||
    webMessage?.message?.extendedTextMessage?.text || "";

  // Ignora comandos com prefixo
  if (raw.startsWith(PREFIX)) return false;

  const input = norm(raw.trim());
  // Só letras (ou palavra com hífen), 1 a 20 chars, sem espaços
  if (!/^[a-z\-]{1,20}$/.test(input)) return false;
  // Ignora frases com mais de 2 palavras
  if (raw.trim().split(/\s+/).length > 2) return false;

  const nome = webMessage?.pushName || "Alguém";

  // ── INDIVIDUAL ───────────────────────────────────────────────────────────────
  const gameI = gamesIndividual.get(userLid);
  if (gameI) {
    return await _processarJogada(gameI, input, nome, {
      deleteFn:  () => gamesIndividual.delete(userLid),
      socket,
      remoteJid: gameI.remoteJid || remoteJid,
      sendReply,
      sendSuccessReact,
      modoLabel: "FORCA INDIVIDUAL",
    });
  }

  // ── GRUPO ────────────────────────────────────────────────────────────────────
  const gameG = gamesGrupo.get(remoteJid);
  if (gameG) {
    const jaParticipou = gameG.jogadores.has(userLid);

    if (!jaParticipou) {
      gameG.jogadores.add(userLid);
    }

    return await _processarJogada(gameG, input, nome, {
      deleteFn:  () => gamesGrupo.delete(remoteJid),
      socket,
      remoteJid,
      sendReply,
      sendSuccessReact,
      modoLabel: "FORCA EM GRUPO",
    });
  }

  return false;
}

// ─── HELPER INTERNO ───────────────────────────────────────────────────────────
async function _processarJogada(game, input, nome, { deleteFn, socket, remoteJid, sendReply, sendSuccessReact, modoLabel }) {
  const resultado = processarTentativa(game, input, nome);

  switch (resultado.tipo) {
    case "ja_usada":
      await sendReply(
        "⚠️ A letra *" + resultado.letra.toUpperCase() + "* já foi usada!\n" +
        "🔤 " + game.letrasUsadas.join(" ").toUpperCase()
      );
      return true;

    case "venceu": {
      deleteFn();
      const statusLine = resultado.direto
        ? "🎉 *" + nome + " adivinhou a palavra diretamente!*"
        : "🎉 *" + nome + " GANHOU!*";
      await editOrSend(
        socket, remoteJid, game.msgKey,
        statusLine + "\n\n" +
        "```\n" + FORCA_IMGS[Math.min(game.erros, 6)] + "```\n\n" +
        "📝 Palavra: *" + game.palavra.toUpperCase() + "*\n" +
        "🏷️ " + game.categoria + "\n" +
        "✅ Resolvida com *" + game.letrasUsadas.length + "* tentativas!",
        sendReply
      );
      await sendSuccessReact();
      return true;
    }

    case "perdeu": {
      deleteFn();
      await editOrSend(
        socket, remoteJid, game.msgKey,
        "💀 *Perderam!*\n\n" +
        "```\n" + FORCA_IMGS[6] + "```\n\n" +
        "📝 A palavra era: *" + game.palavra.toUpperCase() + "*\n" +
        "🏷️ " + game.categoria + "\n\n" +
        "_Tente novamente: *" + PREFIX + "forca*_",
        sendReply
      );
      return true;
    }

    case "letra_certa":
    case "letra_errada": {
      const s = resultado.tipo === "letra_certa"
        ? "✅ *" + nome + "* acertou *" + resultado.letra.toUpperCase() + "*!"
        : "❌ *" + nome + "* errou! Não tem *" + resultado.letra.toUpperCase() + "*";
      await editOrSend(
        socket, remoteJid, game.msgKey,
        buildGameText(game, "🎮 *" + modoLabel + "*\n" + s),
        sendReply
      );
      return true;
    }

    case "palavra_errada": {
      const s = "❌ *" + nome + "* errou a palavra! (-2 tentativas)";
      await editOrSend(
        socket, remoteJid, game.msgKey,
        buildGameText(game, "🎮 *" + modoLabel + "*\n" + s),
        sendReply
      );
      return true;
    }
  }
  return false;
}
