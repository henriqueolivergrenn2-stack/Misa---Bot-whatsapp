import { extrairImagemDaMensagem } from '../../arquivos/js/imageInput.js';

const EFEITOS = {
    idol: { slug: 'admiring_the_idol', desc: 'Multidão admirando sua foto 🤩' },
    famoso: { slug: 'admiring_the_idol', desc: 'Multidão admirando sua foto 🤩' },
    cartaz: { slug: 'street_poster', desc: 'Cartaz de rua com sua foto 📌' },
    outdoor: { slug: 'big_screen', desc: 'Telão gigante com sua foto 📺' },
    wanted: { slug: 'wanted', desc: 'Cartaz de procurado 🔫' },
    procurado: { slug: 'wanted', desc: 'Cartaz de procurado 🔫' },
    boxe: { slug: 'boxing', desc: 'Luta de boxe com seu rosto 🥊' },
    luta: { slug: 'boxing', desc: 'Luta de boxe com seu rosto 🥊' },
    jornal: { slug: 'newspaper_front_page', desc: 'Capa de jornal com você 📰' },
    revista: { slug: 'magazine_cover', desc: 'Capa de revista 📖' },
    quadro: { slug: 'frame_in_a_picture', desc: 'Foto dentro de um quadro 🖼️' },
    museo: { slug: 'art_gallery', desc: 'Galeria de arte com sua foto 🎨' },
    graffiti: { slug: 'graffiti', desc: 'Sua foto em grafite na parede 🎨' },
    tshirt: { slug: 't_shirt', desc: 'Sua foto em uma camiseta 👕' },
    camiseta: { slug: 't_shirt', desc: 'Sua foto em uma camiseta 👕' }
};

const HEADERS_BASE = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,*/*;q=0.9',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
};

function extrairResultado(html) {
    const patterns = [
        /https?:\/\/funny-photo\.s3\.amazonaws\.com\/results\/[^"'\s<>]+\.(?:jpg|jpeg|png)/i,
        /https?:\/\/[\w.-]+\.pho\.to\/[^"'\s<>]+\/result\.(?:jpg|jpeg|png)/i,
        /https?:\/\/[\w.-]+\.pho\.to\/results\/[^"'\s<>]+\.(?:jpg|jpeg|png)/i,
        /https?:\/\/[^"'\s<>]+\/(?:result|output|processed)[^"'\s<>]*\.(?:jpg|jpeg|png)/i
    ];
    for (const re of patterns) {
        const m = html.match(re);
        if (m) return m[0].split('?')[0];
    }
    const imgMatch = html.match(/<a[^>]+href="([^"]+)"[^>]*>\s*(?:Download|Baixar)/i);
    if (imgMatch) return imgMatch[1];
    return null;
}

async function aplicarEfeito(imgBuffer, slug) {
    const url = `https://funny.pho.to/${slug}/`;

    const form = new FormData();
    const blob = new Blob([imgBuffer], { type: 'image/jpeg' });
    form.append('images', blob, 'photo.jpg');

    const uploadRes = await fetch(url, {
        method: 'POST',
        body: form,
        headers: { ...HEADERS_BASE, Referer: url, Origin: 'https://funny.pho.to' },
        redirect: 'follow',
        signal: AbortSignal.timeout(60000)
    });

    if (!uploadRes.ok) throw new Error(`funny.pho.to retornou HTTP ${uploadRes.status}`);

    const finalUrl = uploadRes.url;
    const html = await uploadRes.text();
    const imgUrl = extrairResultado(html);

    if (!imgUrl) throw new Error('Não foi possível extrair a imagem do resultado.');

    const imgRes = await fetch(imgUrl, { headers: { ...HEADERS_BASE, Referer: finalUrl }, signal: AbortSignal.timeout(30000) });
    if (!imgRes.ok) throw new Error(`Erro ao baixar resultado: HTTP ${imgRes.status}`);

    return Buffer.from(await imgRes.arrayBuffer());
}

export default {
    name: 'funnyphoto',
    description: 'Aplica efeitos divertidos em fotos via funny.pho.to',
    category: 'efeitos',
    aliases: ['funnyph', 'fpho', 'idol', 'famoso', 'wanted', 'procurado', 'boxe', 'luta', 'jornal', 'revista', 'quadro', 'museo', 'graffiti', 'tshirt', 'camiseta'],
    async execute({ args, command, columbina, from, info, prefix, reply, reagir, getFileBuffer }) {
        const sub = (args[0] || '').toLowerCase().trim();

        if (sub === 'lista' || sub === 'list' || sub === 'efeitos') {
            const vistos = new Set();
            const linhas = [];
            for (const [apelido, cfg] of Object.entries(EFEITOS)) {
                if (vistos.has(cfg.slug)) continue;
                vistos.add(cfg.slug);
                linhas.push(`• ${prefix}${apelido} — ${cfg.desc}`);
            }
            return reply(`🎨 EFEITOS DISPONÍVEIS — funny.pho.to\n\n${linhas.join('\n')}\n\nEnvie ou responda uma imagem com o comando!`);
        }

        let slug, nomeEfeito;
        if (EFEITOS[command]) {
            slug = EFEITOS[command].slug;
            nomeEfeito = command;
        } else {
            const arg = sub || 'idol';
            if (EFEITOS[arg]) {
                slug = EFEITOS[arg].slug;
                nomeEfeito = arg;
            } else {
                slug = arg;
                nomeEfeito = arg;
            }
        }

        const buffer = await extrairImagemDaMensagem(info, getFileBuffer);
        if (!buffer) {
            await reagir('❌');
            return reply(`❌ Envie ou responda uma foto com este comando!\n\nEx: ${prefix}${nomeEfeito} + foto`);
        }

        await reagir('🎨');

        try {
            const resultBuffer = await aplicarEfeito(buffer, slug);
            await columbina.sendMessage(from, { image: resultBuffer }, { quoted: info });
            await reagir('✅');
        } catch (err) {
            await reagir('❌');
            reply(`❌ Erro ao aplicar o efeito "${nomeEfeito}".\n\n(${err.message})\n\nO funny.pho.to pode estar instável, tenta de novo.`);
        }
    }
};
