import { MODOS, getModo, getModoMute } from './antiCore.js';

// Desembrulha mensagens efêmeras/view-once pra pegar o conteúdo real
function desembrulhar(message) {
    if (!message) return message;
    return (
        message.ephemeralMessage?.message ||
        message.viewOnceMessageV2?.message ||
        message.viewOnceMessage?.message ||
        message
    );
}

function ehLinkNoTexto(texto) {
    if (!texto) return false;
    return /(https?:\/\/|www\.|chat\.whatsapp\.com\/|wa\.me\/)/i.test(texto);
}

function ehStatusCompartilhado(content) {
    for (const key of Object.keys(content || {})) {
        const ctx = content[key]?.contextInfo;
        if (ctx?.remoteJid === 'status@broadcast') return true;
    }
    return false;
}

// Retorna a feature "anti-x" que bateu com essa mensagem, ou null
function detectarFeature(content) {
    if (ehStatusCompartilhado(content)) return 'antistatusgrupo';
    if (content.eventMessage) return 'antievent';
    if (content.productMessage) return 'antiproduct';
    if (content.stickerMessage?.isLottie) return 'antilottie';
    if (content.stickerMessage) return 'antisticker';
    if (content.documentMessage || content.documentWithCaptionMessage) return 'antidocument';
    if (content.audioMessage) return 'antiaudio';
    if (content.videoMessage) return 'antivideo';
    if (content.imageMessage) return 'antiimage';

    const texto =
        content.conversation ||
        content.extendedTextMessage?.text ||
        content.imageMessage?.caption ||
        content.videoMessage?.caption;
    if (ehLinkNoTexto(texto)) return 'antilink';

    return null;
}

const EMOJIS = {
    antilink: '🔗', antiimage: '🖼️', antivideo: '🎬', antiaudio: '🎵',
    antidocument: '📄', antisticker: '🌀', antilottie: '✨',
    antiproduct: '🛍️', antistatusgrupo: '📵', antievent: '📅'
};

/**
 * Chamado pra toda mensagem de grupo. Retorna true se agiu (apagou/baniu),
 * pra quem chamou saber que pode parar de processar essa mensagem.
 *
 * Admin e dono do bot NUNCA são banidos, mas a mensagem deles é apagada
 * normalmente se o anti-x correspondente estiver ligado.
 */
export async function aplicarAntiX({ columbina, from, info, sender, isGroupAdmins, isDonoSender }) {
    if (!from?.endsWith('@g.us')) return false;

    const podeBanir = !isGroupAdmins && !isDonoSender;

    // ── Mute individual (independe das features anti-x) ──
    const modoMute = getModoMute(from, sender);
    if (modoMute !== MODOS.OFF) {
        await apagarMensagem(columbina, from, info);
        if (modoMute === MODOS.BANIR && podeBanir) await banirUsuario(columbina, from, sender);
        return true;
    }

    // ── Features anti-x de conteúdo ──
    const content = desembrulhar(info.message);
    if (!content) return false;

    const feature = detectarFeature(content);
    if (!feature) return false;

    const modo = getModo(from, feature);
    if (modo === MODOS.OFF) return false;

    await apagarMensagem(columbina, from, info);
    if (modo === MODOS.BANIR && podeBanir) await banirUsuario(columbina, from, sender);

    return true;
}

async function apagarMensagem(columbina, from, info) {
    try {
        await columbina.sendMessage(from, { delete: info.key });
    } catch (e) {}
}

async function banirUsuario(columbina, from, userJid) {
    try {
        await columbina.groupParticipantsUpdate(from, [userJid], 'remove');
    } catch (e) {}
}
