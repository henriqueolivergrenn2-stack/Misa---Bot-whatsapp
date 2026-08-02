import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CAMINHO_DB = path.join(__dirname, '../../database/rpg.json');
export const PASTA_PERFIS = path.join(__dirname, '../../arquivos/imagem/perfis');

export function carregarDB() {
    try {
        if (fs.existsSync(CAMINHO_DB)) {
            return JSON.parse(fs.readFileSync(CAMINHO_DB));
        }
    } catch (e) {}
    return {};
}

export function salvarDB(db) {
    fs.writeFileSync(CAMINHO_DB, JSON.stringify(db, null, 2));
}

export function getUsuario(sender) {
    const db = carregarDB();
    return db[sender] || null;
}

export function estaRegistrado(sender) {
    return !!getUsuario(sender);
}

export function criarUsuario(sender, dados) {
    const db = carregarDB();
    db[sender] = {
        nome: dados.nome,
        idade: dados.idade,
        genero: dados.genero,
        foto: dados.foto || null,
        carteira: 150,
        banco: 0,
        dataCadastro: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        ultimoTrabalho: 0,
        ultimoRoubo: 0,
        trabalhos: 0,
        roubosSucesso: 0,
        roubosFalha: 0
    };
    salvarDB(db);
    return db[sender];
}

export function atualizarUsuario(sender, patch) {
    const db = carregarDB();
    if (!db[sender]) return null;
    db[sender] = { ...db[sender], ...patch };
    salvarDB(db);
    return db[sender];
}

// Pega o usuário; se ele ainda não existir, cria uma conta automática básica
// (usada pelos comandos de RPG pra não obrigar ninguém a rodar .rg antes de jogar)
export function getOuCriarUsuario(sender, pushname) {
    let usuario = getUsuario(sender);
    if (!usuario) {
        usuario = criarUsuario(sender, {
            nome: pushname || 'Jogador',
            idade: null,
            genero: 'Não informado',
            foto: null
        });
    }
    return usuario;
}

export function formatarMoeda(valor) {
    return 'R$ ' + Number(valor || 0).toLocaleString('pt-BR');
}

export function formatarTempo(msRestante) {
    const totalSeg = Math.max(0, Math.ceil(msRestante / 1000));
    const min = Math.floor(totalSeg / 60);
    const seg = totalSeg % 60;
    return min > 0 ? `${min}min ${seg}s` : `${seg}s`;
}

export function randomEntre(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const TRABALHOS = [
    { texto: 'Você entregou um pedido de iFood até no 5º andar sem elevador', min: 40, max: 180 },
    { texto: 'Você programou um bot a noite toda e recebeu pelo freela', min: 80, max: 260 },
    { texto: 'Você fez umas unhas decoradas', min: 50, max: 150 },
    { texto: 'Você vendeu picolé na praia num dia quente', min: 30, max: 120 },
    { texto: 'Você jogou uma partida de Minecraft patrocinada', min: 60, max: 220 },
    { texto: 'Você cantou num culto e recebeu um cachê', min: 70, max: 200 },
    { texto: 'Você editou um vídeo pro TikTok de um cliente', min: 50, max: 180 },
    { texto: 'Você trabalhou um turno inteiro no mercado', min: 40, max: 140 },
    { texto: 'Você consertou o Wi-Fi da vizinha', min: 30, max: 100 },
    { texto: 'Você vendeu uns docinhos no ponto de ônibus', min: 25, max: 90 }
];

// ── RENDA PASSIVA POR MENSAGEM ──
// Ideia: recompensar quem conversa no grupo com uma graninha simbólica,
// sem virar a rota principal de economia (isso continua sendo
// .trabalhar/.minerar, que dão muito mais por uso). Por isso:
//  - cooldown de 1min por pessoa (spammar mensagem não aumenta o ganho)
//  - valor bem baixo (R$1 a R$5) por mensagem válida
//  - teto diário (R$250) — depois disso, conversar continua de graça
export const COOLDOWN_RENDA_MENSAGEM = 60 * 1000; // 1 minuto
export const RENDA_MENSAGEM_MIN = 1;
export const RENDA_MENSAGEM_MAX = 5;
export const LIMITE_RENDA_MENSAGEM_DIA = 250;

/**
 * Dá uma graninha aleatória pra quem manda mensagem, respeitando cooldown
 * e teto diário. Cria a conta automaticamente se a pessoa ainda não tiver
 * uma (assim o sistema já funciona sem precisar rodar .registrar antes).
 * Retorna o valor ganho (number) ou null se não ganhou nada dessa vez.
 */
export function darRendaPorMensagem(sender, pushname, texto) {
    if (!texto || texto.trim().length < 2) return null; // ignora msg vazia/1 char (evita spam de "a", "k" etc)

    const usuario = getOuCriarUsuario(sender, pushname);
    const agora = Date.now();

    if (agora - (usuario.ultimaRendaMsg || 0) < COOLDOWN_RENDA_MENSAGEM) return null;

    const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const acumuladoHoje = usuario.rendaMsgData === hoje ? (usuario.rendaMsgHoje || 0) : 0;

    if (acumuladoHoje >= LIMITE_RENDA_MENSAGEM_DIA) return null;

    let ganho = randomEntre(RENDA_MENSAGEM_MIN, RENDA_MENSAGEM_MAX);
    if (acumuladoHoje + ganho > LIMITE_RENDA_MENSAGEM_DIA) {
        ganho = LIMITE_RENDA_MENSAGEM_DIA - acumuladoHoje;
    }
    if (ganho <= 0) return null;

    atualizarUsuario(sender, {
        carteira: usuario.carteira + ganho,
        ultimaRendaMsg: agora,
        rendaMsgData: hoje,
        rendaMsgHoje: acumuladoHoje + ganho
    });

    return ganho;
}

export function calcularRankGlobal() {
    const db = carregarDB();
    return Object.entries(db)
        .map(([jid, u]) => ({ jid, nome: u.nome, total: (u.carteira || 0) + (u.banco || 0) }))
        .sort((a, b) => b.total - a.total);
}

/**
 * Tenta achar um usuário cadastrado a partir de vários "candidatos" de identificação
 * (JID cru, JID convertido, etc). Se nenhum bater direto, tenta comparar só os
 * números de telefone (ignorando LID) como último recurso.
 */
export function getUsuarioPorMencao(candidatos) {
    const db = carregarDB();

    for (const cand of candidatos) {
        if (cand && db[cand]) return { jid: cand, usuario: db[cand] };
    }

    for (const cand of candidatos) {
        if (!cand) continue;
        const digitos = cand.split('@')[0].replace(/[^0-9]/g, '');
        if (!digitos || digitos.length < 8) continue;

        for (const [jid, usuario] of Object.entries(db)) {
            const digitosDb = jid.split('@')[0].replace(/[^0-9]/g, '');
            if (digitosDb && digitosDb === digitos) return { jid, usuario };
        }
    }

    return null;
}
