import { getUsuario, atualizarUsuario, formatarMoeda, getOuCriarUsuario } from '../../arquivos/js/rpgCore.js';

// ─────────────────────────────────────────────────────────────────────────
// BANCO DE PALAVRAS LOCAL (offline, sempre funciona mesmo sem internet)
// ─────────────────────────────────────────────────────────────────────────
const PALAVRAS = [
    // Comida
    { palavra: 'churrasco', categoria: 'Comida' }, { palavra: 'feijoada', categoria: 'Comida' },
    { palavra: 'brigadeiro', categoria: 'Comida' }, { palavra: 'pastel', categoria: 'Comida' },
    { palavra: 'coxinha', categoria: 'Comida' }, { palavra: 'pamonha', categoria: 'Comida' },
    { palavra: 'tapioca', categoria: 'Comida' }, { palavra: 'acaraje', categoria: 'Comida' },
    { palavra: 'moqueca', categoria: 'Comida' }, { palavra: 'canjica', categoria: 'Comida' },
    { palavra: 'pudim', categoria: 'Comida' }, { palavra: 'lasanha', categoria: 'Comida' },
    { palavra: 'hamburguer', categoria: 'Comida' }, { palavra: 'empada', categoria: 'Comida' },
    { palavra: 'cocada', categoria: 'Comida' }, { palavra: 'rapadura', categoria: 'Comida' },
    { palavra: 'paçoca', categoria: 'Comida' }, { palavra: 'quindim', categoria: 'Comida' },
    { palavra: 'farofa', categoria: 'Comida' }, { palavra: 'pipoca', categoria: 'Comida' },

    // Games
    { palavra: 'minecraft', categoria: 'Games' }, { palavra: 'fortnite', categoria: 'Games' },
    { palavra: 'controle', categoria: 'Games' }, { palavra: 'joystick', categoria: 'Games' },
    { palavra: 'roblox', categoria: 'Games' }, { palavra: 'freefire', categoria: 'Games' },
    { palavra: 'valorant', categoria: 'Games' }, { palavra: 'playstation', categoria: 'Games' },
    { palavra: 'videogame', categoria: 'Games' }, { palavra: 'gamer', categoria: 'Games' },
    { palavra: 'teclado', categoria: 'Games' }, { palavra: 'monitor', categoria: 'Games' },

    // Tecnologia
    { palavra: 'whatsapp', categoria: 'Tecnologia' }, { palavra: 'internet', categoria: 'Tecnologia' },
    { palavra: 'instagram', categoria: 'Tecnologia' }, { palavra: 'celular', categoria: 'Tecnologia' },
    { palavra: 'notebook', categoria: 'Tecnologia' }, { palavra: 'bluetooth', categoria: 'Tecnologia' },
    { palavra: 'aplicativo', categoria: 'Tecnologia' }, { palavra: 'senha', categoria: 'Tecnologia' },
    { palavra: 'carregador', categoria: 'Tecnologia' }, { palavra: 'smartphone', categoria: 'Tecnologia' },
    { palavra: 'tablet', categoria: 'Tecnologia' }, { palavra: 'impressora', categoria: 'Tecnologia' },

    // Cultura
    { palavra: 'carnaval', categoria: 'Cultura' }, { palavra: 'anime', categoria: 'Cultura' },
    { palavra: 'mangá', categoria: 'Cultura' }, { palavra: 'cosplay', categoria: 'Cultura' },
    { palavra: 'folclore', categoria: 'Cultura' }, { palavra: 'saci', categoria: 'Cultura' },
    { palavra: 'curupira', categoria: 'Cultura' }, { palavra: 'capoeira', categoria: 'Cultura' },
    { palavra: 'samba', categoria: 'Cultura' }, { palavra: 'cordel', categoria: 'Cultura' },

    // Esporte
    { palavra: 'futebol', categoria: 'Esporte' }, { palavra: 'volei', categoria: 'Esporte' },
    { palavra: 'natação', categoria: 'Esporte' }, { palavra: 'basquete', categoria: 'Esporte' },
    { palavra: 'corrida', categoria: 'Esporte' }, { palavra: 'ciclismo', categoria: 'Esporte' },
    { palavra: 'judô', categoria: 'Esporte' }, { palavra: 'ginástica', categoria: 'Esporte' },
    { palavra: 'skate', categoria: 'Esporte' }, { palavra: 'surfe', categoria: 'Esporte' },

    // Lugar
    { palavra: 'praia', categoria: 'Lugar' }, { palavra: 'igreja', categoria: 'Lugar' },
    { palavra: 'escola', categoria: 'Lugar' }, { palavra: 'mercado', categoria: 'Lugar' },
    { palavra: 'shopping', categoria: 'Lugar' }, { palavra: 'parque', categoria: 'Lugar' },
    { palavra: 'hospital', categoria: 'Lugar' }, { palavra: 'biblioteca', categoria: 'Lugar' },
    { palavra: 'aeroporto', categoria: 'Lugar' }, { palavra: 'estádio', categoria: 'Lugar' },
    { palavra: 'floresta', categoria: 'Lugar' }, { palavra: 'fazenda', categoria: 'Lugar' },

    // Transporte
    { palavra: 'ônibus', categoria: 'Transporte' }, { palavra: 'bicicleta', categoria: 'Transporte' },
    { palavra: 'motocicleta', categoria: 'Transporte' }, { palavra: 'caminhão', categoria: 'Transporte' },
    { palavra: 'metrô', categoria: 'Transporte' }, { palavra: 'trem', categoria: 'Transporte' },
    { palavra: 'avião', categoria: 'Transporte' }, { palavra: 'barco', categoria: 'Transporte' },
    { palavra: 'patinete', categoria: 'Transporte' },

    // Música
    { palavra: 'gospel', categoria: 'Música' }, { palavra: 'sertanejo', categoria: 'Música' },
    { palavra: 'funk', categoria: 'Música' }, { palavra: 'pagode', categoria: 'Música' },
    { palavra: 'forró', categoria: 'Música' }, { palavra: 'axé', categoria: 'Música' },
    { palavra: 'reggae', categoria: 'Música' }, { palavra: 'rap', categoria: 'Música' },
    { palavra: 'piseiro', categoria: 'Música' },

    // Animais
    { palavra: 'cachorro', categoria: 'Animais' }, { palavra: 'gato', categoria: 'Animais' },
    { palavra: 'papagaio', categoria: 'Animais' }, { palavra: 'tucano', categoria: 'Animais' },
    { palavra: 'arara', categoria: 'Animais' }, { palavra: 'jacaré', categoria: 'Animais' },
    { palavra: 'tartaruga', categoria: 'Animais' }, { palavra: 'borboleta', categoria: 'Animais' },
    { palavra: 'elefante', categoria: 'Animais' }, { palavra: 'girafa', categoria: 'Animais' },
    { palavra: 'macaco', categoria: 'Animais' }, { palavra: 'tubarão', categoria: 'Animais' },
    { palavra: 'capivara', categoria: 'Animais' },

    // Natureza
    { palavra: 'cachoeira', categoria: 'Natureza' }, { palavra: 'montanha', categoria: 'Natureza' },
    { palavra: 'vulcão', categoria: 'Natureza' }, { palavra: 'deserto', categoria: 'Natureza' },
    { palavra: 'oceano', categoria: 'Natureza' }, { palavra: 'furacão', categoria: 'Natureza' },
    { palavra: 'trovão', categoria: 'Natureza' }, { palavra: 'relâmpago', categoria: 'Natureza' },
    { palavra: 'nevoeiro', categoria: 'Natureza' }, { palavra: 'savana', categoria: 'Natureza' },

    // Profissões
    { palavra: 'professor', categoria: 'Profissões' }, { palavra: 'médico', categoria: 'Profissões' },
    { palavra: 'bombeiro', categoria: 'Profissões' }, { palavra: 'motorista', categoria: 'Profissões' },
    { palavra: 'cozinheiro', categoria: 'Profissões' }, { palavra: 'cantor', categoria: 'Profissões' },
    { palavra: 'dentista', categoria: 'Profissões' }, { palavra: 'advogado', categoria: 'Profissões' },
    { palavra: 'engenheiro', categoria: 'Profissões' }, { palavra: 'policial', categoria: 'Profissões' },
    { palavra: 'enfermeiro', categoria: 'Profissões' }, { palavra: 'pescador', categoria: 'Profissões' },

    // Escola
    { palavra: 'caderno', categoria: 'Escola' }, { palavra: 'mochila', categoria: 'Escola' },
    { palavra: 'lápis', categoria: 'Escola' }, { palavra: 'borracha', categoria: 'Escola' },
    { palavra: 'quadro', categoria: 'Escola' }, { palavra: 'recreio', categoria: 'Escola' },
    { palavra: 'uniforme', categoria: 'Escola' }, { palavra: 'boletim', categoria: 'Escola' },

    // Casa
    { palavra: 'geladeira', categoria: 'Casa' }, { palavra: 'fogão', categoria: 'Casa' },
    { palavra: 'sofá', categoria: 'Casa' }, { palavra: 'travesseiro', categoria: 'Casa' },
    { palavra: 'cortina', categoria: 'Casa' }, { palavra: 'varal', categoria: 'Casa' },
    { palavra: 'vassoura', categoria: 'Casa' }, { palavra: 'panela', categoria: 'Casa' },
    { palavra: 'escada', categoria: 'Casa' }, { palavra: 'garagem', categoria: 'Casa' },

    // Roupas
    { palavra: 'camiseta', categoria: 'Roupas' }, { palavra: 'bermuda', categoria: 'Roupas' },
    { palavra: 'sandália', categoria: 'Roupas' }, { palavra: 'boné', categoria: 'Roupas' },
    { palavra: 'jaqueta', categoria: 'Roupas' }, { palavra: 'vestido', categoria: 'Roupas' },
    { palavra: 'chinelo', categoria: 'Roupas' }, { palavra: 'casaco', categoria: 'Roupas' },

    // Cores
    { palavra: 'amarelo', categoria: 'Cores' }, { palavra: 'vermelho', categoria: 'Cores' },
    { palavra: 'verde', categoria: 'Cores' }, { palavra: 'roxo', categoria: 'Cores' },
    { palavra: 'laranja', categoria: 'Cores' }, { palavra: 'marrom', categoria: 'Cores' },
    { palavra: 'dourado', categoria: 'Cores' },

    // Bebidas
    { palavra: 'guaraná', categoria: 'Bebidas' }, { palavra: 'suco', categoria: 'Bebidas' },
    { palavra: 'refrigerante', categoria: 'Bebidas' }, { palavra: 'vitamina', categoria: 'Bebidas' },
    { palavra: 'cafezinho', categoria: 'Bebidas' },

    // Frutas
    { palavra: 'banana', categoria: 'Frutas' }, { palavra: 'manga', categoria: 'Frutas' },
    { palavra: 'abacaxi', categoria: 'Frutas' }, { palavra: 'melancia', categoria: 'Frutas' },
    { palavra: 'jabuticaba', categoria: 'Frutas' }, { palavra: 'caju', categoria: 'Frutas' },
    { palavra: 'goiaba', categoria: 'Frutas' }, { palavra: 'maracujá', categoria: 'Frutas' },

    // Instrumentos
    { palavra: 'violão', categoria: 'Instrumentos' }, { palavra: 'bateria', categoria: 'Instrumentos' },
    { palavra: 'flauta', categoria: 'Instrumentos' }, { palavra: 'pandeiro', categoria: 'Instrumentos' },
    { palavra: 'cavaquinho', categoria: 'Instrumentos' }, { palavra: 'saxofone', categoria: 'Instrumentos' },

    // Emoções
    { palavra: 'feliz', categoria: 'Emoções' }, { palavra: 'triste', categoria: 'Emoções' },
    { palavra: 'animado', categoria: 'Emoções' }, { palavra: 'surpreso', categoria: 'Emoções' },
    { palavra: 'calmo', categoria: 'Emoções' }, { palavra: 'orgulhoso', categoria: 'Emoções' }
];

const FORCA_ARTE = [
    '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```'
];

const COOLDOWN_ENTRE_JOGOS = 60 * 1000; // 1 minuto de intervalo entre partidas no mesmo grupo

function buildDisplay(palavra, palavraNormalizada, acertos) {
    return palavra.split('').map((c, i) => {
        if (c === ' ') return '  ';
        return acertos.includes(palavraNormalizada[i]) ? c.toUpperCase() : '_';
    }).join(' ');
}

function contarLetras(palavra) {
    return palavra.replace(/ /g, '').length;
}

function letrasTentadasTexto(letrasUsadas) {
    if (!letrasUsadas.length) return '';
    return `\n🔤 Letras tentadas: ${letrasUsadas.map(l => l.toUpperCase()).join(', ')}`;
}

function normalizar(txt) {
    return (txt || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// ─────────────────────────────────────────────────────────────────────────
// TEMAS: agrupa o banco local por categoria + conecta em temas "ao vivo"
// buscados na API pública e oficial do IBGE (dados.gov.br), pra dar mais
// variedade sem depender só das palavras fixas do código.
// ─────────────────────────────────────────────────────────────────────────
const LOCAIS_POR_CATEGORIA = new Map();
for (const item of PALAVRAS) {
    const chave = normalizar(item.categoria);
    if (!LOCAIS_POR_CATEGORIA.has(chave)) LOCAIS_POR_CATEGORIA.set(chave, { label: item.categoria, palavras: [] });
    LOCAIS_POR_CATEGORIA.get(chave).palavras.push(item.palavra);
}

// Apelidos pra digitar o tema sem se preocupar com plural/acento
// (ex: "musica", "músicas" e "música" caem tudo na mesma chave)
const APELIDOS_TEMA = {
    comida: 'comida', comidas: 'comida', comer: 'comida',
    game: 'games', games: 'games', jogo: 'games', jogos: 'games',
    tecnologia: 'tecnologia', tech: 'tecnologia',
    cultura: 'cultura',
    esporte: 'esporte', esportes: 'esporte',
    lugar: 'lugar', lugares: 'lugar',
    transporte: 'transporte', transportes: 'transporte',
    musica: 'musica', musicas: 'musica',
    animal: 'animais', animais: 'animais', bicho: 'animais', bichos: 'animais',
    natureza: 'natureza',
    profissao: 'profissoes', profissoes: 'profissoes', trabalho: 'profissoes',
    escola: 'escola',
    casa: 'casa',
    roupa: 'roupas', roupas: 'roupas',
    cor: 'cores', cores: 'cores',
    bebida: 'bebidas', bebidas: 'bebidas',
    fruta: 'frutas', frutas: 'frutas',
    instrumento: 'instrumentos', instrumentos: 'instrumentos',
    emocao: 'emocoes', emocoes: 'emocoes',
    estado: 'estados', estados: 'estados', uf: 'estados',
    cidade: 'cidades', cidades: 'cidades', municipio: 'cidades', municipios: 'cidades'
};

// Cache em memória das buscas na API, pra não ficar batendo no IBGE toda hora
const CACHE_API = new Map(); // chave -> { data, expira }
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 horas

async function buscarEstadosIBGE() {
    const cache = CACHE_API.get('estados');
    if (cache && cache.expira > Date.now()) return cache.data;
    try {
        const resp = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
        if (!resp.ok) throw new Error(`status ${resp.status}`);
        const json = await resp.json();
        const data = json
            .map(e => (e.nome || '').toLowerCase())
            .filter(nome => /^[a-zà-ú ]+$/i.test(nome))
            .map(nome => ({ palavra: nome, categoria: 'Estado do Brasil' }));
        if (data.length) CACHE_API.set('estados', { data, expira: Date.now() + CACHE_TTL });
        return data.length ? data : (cache ? cache.data : null);
    } catch (e) {
        return cache ? cache.data : null; // API fora do ar — usa cache velho se tiver, senão desiste
    }
}

async function buscarCidadesIBGE() {
    const cache = CACHE_API.get('cidades');
    if (cache && cache.expira > Date.now()) return cache.data;
    try {
        const resp = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
        if (!resp.ok) throw new Error(`status ${resp.status}`);
        const json = await resp.json();
        const data = json
            .map(m => (m.nome || '').toLowerCase())
            .filter(nome => nome.length >= 4 && nome.length <= 16 && /^[a-zà-ú ]+$/i.test(nome))
            .map(nome => ({ palavra: nome, categoria: 'Cidade do Brasil' }));
        if (data.length) CACHE_API.set('cidades', { data, expira: Date.now() + CACHE_TTL });
        return data.length ? data : (cache ? cache.data : null);
    } catch (e) {
        return cache ? cache.data : null;
    }
}

const TEMAS_API = {
    estados: buscarEstadosIBGE,
    cidades: buscarCidadesIBGE
};

// Resolve o nome digitado pelo usuário (ex: "comida", "cidades") pro banco
// de palavras correspondente. Retorna null se o tema não existir ou se a
// busca online falhar sem ter cache pra usar.
async function resolverTema(nomeTema) {
    const chave = APELIDOS_TEMA[normalizar(nomeTema)];
    if (!chave) return null;

    if (TEMAS_API[chave]) {
        const dados = await TEMAS_API[chave]();
        return dados && dados.length ? dados : null;
    }

    const local = LOCAIS_POR_CATEGORIA.get(chave);
    return local ? local.palavras.map(p => ({ palavra: p, categoria: local.label })) : null;
}

// Sessão em memória: chave = from (o jogo é do grupo/chat inteiro)
const JOGOS = new Map();
const ULTIMO_FIM = new Map(); // from -> timestamp do fim da última partida

export function temJogoAtivo(from) {
    return JOGOS.has(from);
}

/**
 * Envia a "mensagem de status" do jogo (tabuleiro/forca/erros) ou EDITA a
 * mensagem anterior no lugar, pra não ficar poluindo o chat com uma
 * mensagem nova a cada letra digitada. Se a edição falhar (ex: mensagem
 * muito antiga / não suportado), cai pro modo antigo de mandar nova.
 */
async function atualizarStatus({ jogo, from, columbina, texto, info, quotar }) {
    if (jogo.msgKey) {
        try {
            await columbina.sendMessage(from, { text: texto, edit: jogo.msgKey });
            return;
        } catch (e) {
            // edição falhou (mensagem expirou etc) — cai pro envio normal abaixo
        }
    }
    const opts = quotar && info ? { quoted: info } : undefined;
    const enviado = await columbina.sendMessage(from, { text: texto }, opts);
    if (enviado?.key) jogo.msgKey = enviado.key;
}

// Finaliza o jogo com vitória (usado tanto por acerto de letra que completa
// a palavra quanto por acerto da palavra inteira de uma vez).
async function finalizarVitoria({ jogo, from, columbina, info, reagir }) {
    let premio = 0;
    if (jogo.aposta > 0) {
        const usuario = getUsuario(jogo.dono);
        if (usuario) {
            premio = jogo.aposta * 2;
            atualizarUsuario(jogo.dono, { carteira: usuario.carteira + premio });
        }
    }
    await atualizarStatus({
        jogo, from, columbina, info,
        texto: `🏆 *PALAVRA COMPLETA!*\n\n📝 *${jogo.palavra.toUpperCase()}*\n🏷️ ${jogo.categoria}\n\n` +
            (premio > 0 ? `💰 Prêmio: *+${formatarMoeda(premio)}* (pra quem começou o jogo)` : '🎉 Mandou bem, galera!')
    });
    JOGOS.delete(from);
    ULTIMO_FIM.set(from, Date.now());
    await reagir('🏆');
}

// Finaliza o jogo por excesso de erros (enforcado).
async function finalizarEnforcado({ jogo, from, columbina, info, reagir }) {
    if (jogo.aposta > 0) {
        const usuario = getUsuario(jogo.dono);
        if (usuario) atualizarUsuario(jogo.dono, { carteira: usuario.carteira - jogo.aposta });
    }
    await atualizarStatus({
        jogo, from, columbina, info,
        texto: `💀 *ENFORCADO!*\n\n${FORCA_ARTE[6]}\n\n📝 A palavra era: *${jogo.palavra.toUpperCase()}*\n🏷️ ${jogo.categoria}` +
            (jogo.aposta > 0 ? `\n\n💸 -${formatarMoeda(jogo.aposta)}` : '')
    });
    JOGOS.delete(from);
    ULTIMO_FIM.set(from, Date.now());
    await reagir('💀');
}

// Processa um chute da PALAVRA INTEIRA (não letra por letra). Só é chamado
// quando o tamanho do palpite bate exatamente com o tamanho da palavra
// secreta — isso evita confundir uma mensagem qualquer do chat com uma
// tentativa de chute.
async function processarChutePalavra({ jogo, from, columbina, info, reagir, chute }) {
    const alvo = jogo.palavraNormalizada.replace(/ /g, '');

    if (chute === alvo) {
        jogo.acertos = [...new Set(alvo.split(''))];
        await finalizarVitoria({ jogo, from, columbina, info, reagir });
        return true;
    }

    // chute de palavra inteira errado também custa uma vida (senão dava
    // pra ficar chutando a palavra toda de graça até acertar)
    jogo.erros++;
    if (jogo.erros >= 6) {
        await finalizarEnforcado({ jogo, from, columbina, info, reagir });
        return true;
    }

    await atualizarStatus({
        jogo, from, columbina, info,
        texto: `❌ *Palavra errada!*\n\n🏷️ ${jogo.categoria}\n${FORCA_ARTE[jogo.erros]}\n\n📝 \`${buildDisplay(jogo.palavra, jogo.palavraNormalizada, jogo.acertos)}\`\n❌ Erros: *${jogo.erros}/6*${letrasTentadasTexto(jogo.letrasUsadas)}`
    });
    return true;
}

// Processa um palpite — usado tanto pelo comando .forca <letra ou palavra>
// quanto pela digitação livre no chat (sem comando). Aceita:
//  • 1 letra, com ou sem acento (ex: "a" acerta tanto "a" quanto "á")
//  • a palavra inteira, desde que o tamanho bata certinho com a palavra
//    secreta (evita tratar qualquer mensagem do chat como chute errado)
export async function processarLetra({ from, letra: palpiteBruto, columbina, info, reagir }) {
    const jogo = JOGOS.get(from);
    if (!jogo) return false;

    const bruto = (palpiteBruto || '').toString().trim();
    if (!bruto) return false;

    // remove acento e qualquer caractere que não seja letra (espaço incluso)
    const normalizado = normalizar(bruto).replace(/[^a-z]/g, '');
    if (!normalizado) return false;

    const tamanhoAlvo = jogo.palavraNormalizada.replace(/ /g, '').length;

    // ── CHUTE DA PALAVRA INTEIRA ──
    if (normalizado.length > 1 && normalizado.length === tamanhoAlvo) {
        return await processarChutePalavra({ jogo, from, columbina, info, reagir, chute: normalizado });
    }

    // qualquer outra coisa que não seja exatamente 1 letra não é um chute
    // válido — ignora (é só mensagem normal do chat, tipo "oi tudo bem")
    if (normalizado.length !== 1) return false;

    const letra = normalizado;

    if (jogo.letrasUsadas.includes(letra)) {
        await atualizarStatus({
            jogo, from, columbina, info,
            texto: `⚠️ A letra *${letra.toUpperCase()}* já foi tentada!${letrasTentadasTexto(jogo.letrasUsadas)}\n\n🏷️ ${jogo.categoria}\n${FORCA_ARTE[jogo.erros]}\n\n📝 \`${buildDisplay(jogo.palavra, jogo.palavraNormalizada, jogo.acertos)}\`\n❌ Erros: *${jogo.erros}/6*`
        });
        return true;
    }
    jogo.letrasUsadas.push(letra);

    // compara pela versão SEM acento — assim "a" acerta tanto "a" quanto
    // "á"/"à"/"â"/"ã" da palavra, não importa qual acento a palavra tenha
    if (jogo.palavraNormalizada.includes(letra)) {
        jogo.acertos.push(letra);

        const completou = jogo.palavraNormalizada.split('').every((c, i) => jogo.palavra[i] === ' ' || jogo.acertos.includes(c));
        if (completou) {
            await finalizarVitoria({ jogo, from, columbina, info, reagir });
            return true;
        }

        await atualizarStatus({
            jogo, from, columbina, info,
            texto: `✅ *Letra certa!*\n\n🏷️ ${jogo.categoria}\n${FORCA_ARTE[jogo.erros]}\n\n📝 \`${buildDisplay(jogo.palavra, jogo.palavraNormalizada, jogo.acertos)}\`\n❌ Erros: *${jogo.erros}/6*${letrasTentadasTexto(jogo.letrasUsadas)}`
        });
        return true;
    }

    jogo.erros++;
    if (jogo.erros >= 6) {
        await finalizarEnforcado({ jogo, from, columbina, info, reagir });
        return true;
    }

    await atualizarStatus({
        jogo, from, columbina, info,
        texto: `❌ *Letra errada!*\n\n🏷️ ${jogo.categoria}\n${FORCA_ARTE[jogo.erros]}\n\n📝 \`${buildDisplay(jogo.palavra, jogo.palavraNormalizada, jogo.acertos)}\`\n❌ Erros: *${jogo.erros}/6*${letrasTentadasTexto(jogo.letrasUsadas)}`
    });
    return true;
}

export default {
    name: 'forca',
    description: 'Jogo da forca no grupo — todo mundo pode ajudar a adivinhar (aposta opcional). Dá pra escolher o tema direto (ex: .forca comida) e até jogar com cidades/estados do Brasil buscados ao vivo. Depois de iniciado, é só digitar a letra direto no chat!',
    category: 'rpg',
    aliases: [],
    async execute({ sender, from, info, columbina, q, prefix, reply, reagir, pushname }) {
        const entrada = (q || '').trim().toLowerCase();
        const jogo = JOGOS.get(from);

        // ── DESISTIR ──
        if (['desistir', 'sair', 'cancelar'].includes(entrada)) {
            if (!jogo) return reply('⚠️ Nenhum jogo de forca ativo neste chat!');
            if (jogo.aposta > 0) {
                const usuario = getUsuario(jogo.dono);
                if (usuario) atualizarUsuario(jogo.dono, { carteira: usuario.carteira - jogo.aposta });
            }
            await atualizarStatus({
                jogo, from, columbina, info,
                texto: `🏳️ *Jogo encerrado!*\n\n📝 A palavra era: *${jogo.palavra.toUpperCase()}*\n🏷️ ${jogo.categoria}`
            });
            JOGOS.delete(from);
            ULTIMO_FIM.set(from, Date.now());
            await reagir('🏳️');
            return;
        }

        // ── DICA ──
        if (entrada === 'dica') {
            if (!jogo) return reply(`⚠️ Nenhum jogo ativo! Use *${prefix}forca* para começar.`);

            if (jogo.dicaUsada) {
                await atualizarStatus({
                    jogo, from, columbina, info,
                    texto: `💡 Você já usou a dica de letra grátis nessa partida!\n\n🏷️ ${jogo.categoria}\n${FORCA_ARTE[jogo.erros]}\n\n📝 \`${buildDisplay(jogo.palavra, jogo.palavraNormalizada, jogo.acertos)}\`\n❌ Erros: *${jogo.erros}/6*${letrasTentadasTexto(jogo.letrasUsadas)}`
                });
                return;
            }

            const faltando = [];
            for (let i = 0; i < jogo.palavraNormalizada.length; i++) {
                const cNorm = jogo.palavraNormalizada[i];
                if (jogo.palavra[i] !== ' ' && !jogo.acertos.includes(cNorm)) faltando.push(cNorm);
            }
            if (faltando.length > 0) {
                const letraBonus = faltando[Math.floor(Math.random() * faltando.length)];
                jogo.acertos.push(letraBonus);
            }
            jogo.dicaUsada = true;

            await atualizarStatus({
                jogo, from, columbina, info,
                texto: `💡 *Letra bônus revelada!*\n\n🏷️ ${jogo.categoria}\n${FORCA_ARTE[jogo.erros]}\n\n📝 \`${buildDisplay(jogo.palavra, jogo.palavraNormalizada, jogo.acertos)}\`\n❌ Erros: *${jogo.erros}/6*${letrasTentadasTexto(jogo.letrasUsadas)}`
            });
            return;
        }

        // ── LISTAR TEMAS ──
        if (['temas', 'tema', 'categorias'].includes(entrada)) {
            const locais = [...new Set(PALAVRAS.map(p => p.categoria))];
            const extras = ['Estados do Brasil (estados)', 'Cidades do Brasil (cidades)'];
            return reply(
                `🏷️ *Temas disponíveis:*\n\n${locais.map(c => `• ${c}`).join('\n')}\n${extras.map(c => `• ${c}`).join('\n')}\n\n` +
                `_Use *${prefix}forca <tema>* pra jogar direto nesse tema. Ex: *${prefix}forca comida* ou *${prefix}forca cidades*_\n` +
                `_Também dá pra apostar junto: *${prefix}forca comida 50*_`
            );
        }

        // ── NOVO JOGO (aleatório, com aposta e/ou tema) ──
        const tokens = entrada.split(/\s+/).filter(Boolean);
        const temaChave = tokens[0] ? APELIDOS_TEMA[normalizar(tokens[0])] : null;
        const somenteNumero = entrada !== '' && tokens.length === 1 && !isNaN(parseInt(entrada, 10));

        if (!entrada || somenteNumero || temaChave) {
            if (jogo) {
                return reply(`⚠️ Já tem um jogo de forca em andamento neste chat!\n\nÉ só digitar a letra direto no chat, sem comando!\nOu *${prefix}forca desistir* pra encerrar.`);
            }

            const ultimoFim = ULTIMO_FIM.get(from) || 0;
            const faltaEspera = COOLDOWN_ENTRE_JOGOS - (Date.now() - ultimoFim);
            if (faltaEspera > 0) {
                await reagir('⏳');
                return reply(`⏳ Calma aí! Espera mais *${Math.ceil(faltaEspera / 1000)}s* pra começar outra forca neste grupo.`);
            }

            // Resolve o banco de palavras: tema escolhido ou todas as palavras locais
            let banco = PALAVRAS;
            if (temaChave) {
                if (TEMAS_API[temaChave]) await reagir('🔎'); // dá um feedback rápido enquanto busca na API
                const dados = await resolverTema(tokens[0]);
                if (!dados) {
                    await reagir('❌');
                    return reply(`❌ Não consegui carregar o tema *${tokens[0]}* agora (site fora do ar ou tema inexistente).\n\nUse *${prefix}forca temas* pra ver os temas disponíveis.`);
                }
                banco = dados;
            }

            // Aposta: número sozinho, ou segundo token depois do tema
            const tokenAposta = temaChave ? tokens[1] : (somenteNumero ? tokens[0] : null);
            let aposta = 0;
            if (tokenAposta) {
                const usuario = getOuCriarUsuario(sender, pushname);
                aposta = parseInt(tokenAposta, 10);
                if (isNaN(aposta) || aposta < 10) {
                    await reagir('❌');
                    return reply(`❌ Aposta mínima de *${formatarMoeda(10)}*!`);
                }
                if (aposta > usuario.carteira) {
                    await reagir('❌');
                    return reply('❌ Você não tem esse valor na carteira!');
                }
            }

            const sorteio = banco[Math.floor(Math.random() * banco.length)];
            const novoJogo = {
                palavra: sorteio.palavra, palavraNormalizada: normalizar(sorteio.palavra), categoria: sorteio.categoria,
                acertos: [], erros: 0, letrasUsadas: [], dicaUsada: false,
                dono: sender, aposta, msgKey: null
            };
            JOGOS.set(from, novoJogo);

            await reagir('🎮');
            await atualizarStatus({
                jogo: novoJogo, from, columbina, info, quotar: true,
                texto: `🎮 *JOGO DA FORCA*\n\n${FORCA_ARTE[0]}\n\n` +
                    `📝 \`${buildDisplay(sorteio.palavra, normalizar(sorteio.palavra), [])}\`\n` +
                    `🏷️ ${sorteio.categoria} | 📏 *${contarLetras(sorteio.palavra)}* letras\n` +
                    `❌ Erros: *0/6*\n` +
                    (aposta > 0 ? `💰 Aposta: *${formatarMoeda(aposta)}* (paga 2x se acertarem)\n\n` : '\n') +
                    `_🌟 Todo mundo do grupo pode chutar! Digite uma letra (ex: "a") ou a palavra inteira direto no chat_\n` +
                    `_Dica: ${prefix}forca dica | Desistir: ${prefix}forca desistir | Temas: ${prefix}forca temas_`
            });
            return;
        }

        // ── PALPITE (LETRA) — também funciona via comando .forca <letra> ──
        if (!jogo) {
            return reply(`⚠️ Nenhum jogo ativo!\n\nUse *${prefix}forca* pra começar, ou *${prefix}forca temas* pra ver os temas.`);
        }

        await processarLetra({ from, letra: entrada, columbina, info, reagir });
    }
};
