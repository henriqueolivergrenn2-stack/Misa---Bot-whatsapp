import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOuCriarUsuario, atualizarUsuario, formatarMoeda } from './rpgCore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAMINHO_DB = path.join(__dirname, '../../database/atividade.json');
const PREMIO_VENCEDOR = 1000;

function carregarDB() {
    try {
        if (fs.existsSync(CAMINHO_DB)) return JSON.parse(fs.readFileSync(CAMINHO_DB));
    } catch (e) {}
    return {};
}

function salvarDB(db) {
    fs.writeFileSync(CAMINHO_DB, JSON.stringify(db, null, 2));
}

function getDataHoje() {
    return new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{2B00}-\u{2BFF}]/gu;

function contarEmojis(texto) {
    if (!texto) return 0;
    const m = texto.match(EMOJI_REGEX);
    return m ? m.length : 0;
}

function usuarioVazio() {
    return { mensagens: 0, figurinhas: 0, emojis: 0 };
}

function totalUsuario(u) {
    return (u.mensagens || 0) + (u.figurinhas || 0) + (u.emojis || 0);
}

// Paga 1k pra quem mais participou no registro do dia anterior (se houver alguém)
async function pagarVencedorDoDia(columbina, groupId, registroAntigo) {
    if (!registroAntigo?.usuarios) return;

    const ranking = Object.entries(registroAntigo.usuarios)
        .map(([jid, u]) => ({ jid, total: totalUsuario(u) }))
        .filter(u => u.total > 0)
        .sort((a, b) => b.total - a.total);

    if (!ranking.length) return;

    const vencedor = ranking[0];
    const usuario = getOuCriarUsuario(vencedor.jid, null);
    atualizarUsuario(vencedor.jid, { carteira: (usuario.carteira || 0) + PREMIO_VENCEDOR });

    try {
        await columbina.sendMessage(groupId, {
            text:
                `🏆 *RANK ATIVO DO DIA (${registroAntigo.data})*\n\n` +
                `@${vencedor.jid.split('@')[0]} foi quem mais participou do grupo ontem com *${vencedor.total}* pontos de atividade!\n\n` +
                `💰 Prêmio: *+${formatarMoeda(PREMIO_VENCEDOR)}* creditado na carteira do RPG! 🎉`,
            mentions: [vencedor.jid]
        });
    } catch (e) {}
}

// Garante que o registro do grupo está no dia certo; se mudou o dia, paga o vencedor
// de ontem e reseta a contagem.
async function garantirDiaAtual(columbina, groupId) {
    const db = carregarDB();
    const hoje = getDataHoje();
    const registro = db[groupId];

    if (!registro) {
        db[groupId] = { data: hoje, usuarios: {} };
        salvarDB(db);
        return db[groupId];
    }

    if (registro.data !== hoje) {
        await pagarVencedorDoDia(columbina, groupId, registro);
        db[groupId] = { data: hoje, usuarios: {} };
        salvarDB(db);
        return db[groupId];
    }

    return registro;
}

/**
 * Registra 1 atividade do tipo informado pro usuário no grupo.
 * tipo: 'mensagem' | 'figurinha' | 'foto' | 'video'
 * Além disso, se "texto" for passado, conta os emojis nele.
 */
export async function registrarAtividade({ columbina, groupId, userJid, tipo, texto }) {
    if (!groupId?.endsWith('@g.us')) return;

    await garantirDiaAtual(columbina, groupId);

    const db = carregarDB();
    const registro = db[groupId];
    if (!registro.usuarios[userJid]) registro.usuarios[userJid] = usuarioVazio();

    const chave = { mensagem: 'mensagens', figurinha: 'figurinhas' }[tipo];
    if (chave) registro.usuarios[userJid][chave]++;

    const qtdEmojis = contarEmojis(texto);
    if (qtdEmojis > 0) registro.usuarios[userJid].emojis += qtdEmojis;

    salvarDB(db);
}

export function calcularRankAtivo(groupId) {
    const db = carregarDB();
    const registro = db[groupId];
    if (!registro?.usuarios) return { data: getDataHoje(), lista: [] };

    const lista = Object.entries(registro.usuarios)
        .map(([jid, u]) => ({ jid, ...u, total: totalUsuario(u) }))
        .filter(u => u.total > 0)
        .sort((a, b) => b.total - a.total);

    return { data: registro.data, lista };
}

// Desembrulha a mensagem e descobre o "tipo" de atividade + texto (pra contar emoji)
export function detectarTipoEtexto(message) {
    if (!message) return { tipo: null, texto: '' };

    const content =
        message.ephemeralMessage?.message ||
        message.viewOnceMessageV2?.message ||
        message.viewOnceMessage?.message ||
        message;

    if (content.stickerMessage) return { tipo: 'figurinha', texto: '' };

    // Conta apenas mensagem de texto realmente digitada (inclui comandos, já que
    // são texto começando com o prefixo). Foto/vídeo/áudio/documento não contam.
    const texto = content.conversation || content.extendedTextMessage?.text || '';
    if (texto) return { tipo: 'mensagem', texto };

    return { tipo: null, texto: '' };
}
