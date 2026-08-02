import { extrairImagemDaMensagem } from '../../arquivos/js/imageInput.js';

const EFEITOS = {
    obama: 'obama',
    putin: 'putin',
    museu: 'art-admirer',
    brusselas: 'brussels-museum',
    gatinho: 'kitty-and-frame',
    bronze: 'bronze-frames',
    rosas: 'roses',
    reproducao: 'reproduction',
    'art-admirer': 'art-admirer',
    'brussels-museum': 'brussels-museum',
    'kitty-and-frame': 'kitty-and-frame',
    'bronze-frames': 'bronze-frames',
    roses: 'roses',
    reproduction: 'reproduction'
};

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
};

function extrairImagemUrl(html) {
    const patterns = [
        /https?:\/\/u\.photofunia\.com\/[^"'\s<>]+_r\.jpg/i,
        /https?:\/\/u\.photofunia\.com\/[^"'\s<>]+\.jpg/i,
        /https?:\/\/cdn\.photofunia\.com\/results\/[^"'\s<>]+\.jpg/i,
        /https?:\/\/cdn\.photofunia\.com\/results\/[^"'\s<>]+\.png/i
    ];
    for (const re of patterns) {
        const m = html.match(re);
        if (m) return m[0].split('?')[0];
    }
    return null;
}

async function aplicarEfeito(imgBuffer, slug) {
    const uploadUrl = `https://m.photofunia.com/categories/all_effects/${slug}?server=1`;

    const form = new FormData();
    const blob = new Blob([imgBuffer], { type: 'image/jpeg' });
    form.append('image', blob, 'photo.jpg');

    const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        body: form,
        headers: { ...HEADERS, Referer: `https://m.photofunia.com/categories/all_effects/${slug}`, Origin: 'https://m.photofunia.com' },
        redirect: 'follow',
        signal: AbortSignal.timeout(60000)
    });

    if (!uploadRes.ok) throw new Error(`PhotoFunia retornou HTTP ${uploadRes.status}`);

    const finalUrl = uploadRes.url;
    const html = await uploadRes.text();
    const imgUrl = extrairImagemUrl(html);

    if (!imgUrl) throw new Error('Não foi possível extrair a imagem do resultado.');

    const imgRes = await fetch(imgUrl, { headers: { ...HEADERS, Referer: finalUrl }, signal: AbortSignal.timeout(30000) });
    if (!imgRes.ok) throw new Error(`Erro ao baixar imagem: HTTP ${imgRes.status}`);

    return Buffer.from(await imgRes.arrayBuffer());
}

export default {
    name: 'photofunia',
    description: 'Aplica efeitos do PhotoFunia em uma imagem',
    category: 'efeitos',
    aliases: ['pfx', 'obama', 'putin'],
    async execute({ args, command, columbina, from, info, prefix, reply, reagir, getFileBuffer }) {
        const subCmd = (args[0] || '').toLowerCase().trim();

        if (subCmd === 'lista' || subCmd === 'list') {
            const vistos = new Set();
            const amigaveis = Object.entries(EFEITOS)
                .filter(([, slug]) => {
                    if (vistos.has(slug)) return false;
                    vistos.add(slug);
                    return true;
                })
                .map(([k]) => `• ${k}`)
                .join('\n');
            return reply(`🎨 Efeitos disponíveis:\n\n${amigaveis}\n\nUso: ${prefix}pfx <efeito> + imagem`);
        }

        let slug;
        if (command === 'obama') {
            slug = 'obama';
        } else if (command === 'putin') {
            slug = 'putin';
        } else {
            const efeitoArg = (args[0] || '').toLowerCase().trim();
            if (!efeitoArg) {
                await reagir('❌');
                return reply(`❌ Informe o efeito!\n\nUso: ${prefix}pfx <efeito>\n${prefix}pfx lista — ver efeitos`);
            }
            slug = EFEITOS[efeitoArg] || efeitoArg;
        }

        const buffer = await extrairImagemDaMensagem(info, getFileBuffer);
        if (!buffer) {
            await reagir('❌');
            return reply(`❌ Envie ou responda uma imagem!\n\nEx: ${prefix}${slug} respondendo uma foto`);
        }

        await reagir('🎨');

        try {
            const resultBuffer = await aplicarEfeito(buffer, slug);
            await columbina.sendMessage(from, { image: resultBuffer }, { quoted: info });
            await reagir('✅');
        } catch (err) {
            await reagir('❌');
            reply(`❌ Erro ao aplicar efeito "${slug}".\n\n(${err.message})`);
        }
    }
};
