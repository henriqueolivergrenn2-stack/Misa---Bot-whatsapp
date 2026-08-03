import axios from 'axios';

// Guarda o que já foi enviado por chat+tema, pra não repetir imagem/gif/vídeo
const HISTORICO_ENVIADOS = new Map();

function pegarHistorico(chave) {
    if (!HISTORICO_ENVIADOS.has(chave)) HISTORICO_ENVIADOS.set(chave, new Set());
    return HISTORICO_ENVIADOS.get(chave);
}

// Temas usados quando o usuário não digita nenhum (busca aleatória)
const TEMAS_ALEATORIOS = [
    'paisagem natureza', 'anime wallpaper', 'arte digital', 'gatos fofos',
    'minecraft build', 'gospel worship', 'design de interiores', 'receitas',
    'aesthetic wallpaper', 'flores', 'street photography', 'quotes motivacionais',
    'roupas casuais', 'unhas decoradas', 'pixel art', 'cachorros fofos',
    'anime manga art', 'cenário fantasia', 'cidade à noite', 'café aesthetic'
];

// Filtro +18 — bloqueia tanto o tema digitado quanto os resultados
const PALAVRAS_PROIBIDAS = [
    'nude', 'nudes', 'porn', 'porno', 'pornô', 'sex', 'sexo', 'nsfw',
    'hentai', 'ecchi', 'onlyfans', '18+', '+18', 'adult content', 'xxx',
    'erotic', 'erótico', 'erotica', 'fetiche', 'fetish', 'pelada', 'pelado',
    'boobs', 'nudez', 'vagina', 'penis', 'pênis', 'anal', 'orgasm', 'strip',
    'lingerie sensual', 'camgirl', 'nsfw art'
];

function contemPalavraProibida(texto) {
    const t = (texto || '').toLowerCase();
    return PALAVRAS_PROIBIDAS.some(p => t.includes(p));
}

async function buscarPinterest(query) {
    const dataParam = JSON.stringify({
        options: {
            query,
            scope: 'pins',
            no_fetch_context_on_resource: false
        },
        context: {}
    });

    const url = `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=${encodeURIComponent(`/search/pins/?q=${query}`)}&data=${encodeURIComponent(dataParam)}`;

    const { data } = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
            'Accept': 'application/json, text/javascript, */*, q=0.01',
            'X-Pinterest-PWS-Handler': 'www/search/[scope].js',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://www.pinterest.com/'
        },
        timeout: 15000
    });

    return data?.resource_response?.data?.results || [];
}

function extrairMidia(pin) {
    // vídeo (inclui a maioria dos "gifs" do Pinterest, que na verdade são vídeo)
    if (pin.is_video && pin.videos?.video_list) {
        const listas = pin.videos.video_list;
        const chaves = Object.keys(listas);
        if (chaves.length) {
            const melhor = listas[chaves[chaves.length - 1]];
            if (melhor?.url) return { tipo: 'video', url: melhor.url };
        }
    }

    // imagem estática ou gif de verdade (.gif)
    if (pin.images) {
        const candidato = pin.images.orig || pin.images['736x'] || Object.values(pin.images)[0];
        if (candidato?.url) {
            const isGif = pin.is_gif || candidato.url.toLowerCase().endsWith('.gif');
            return { tipo: isGif ? 'gif' : 'imagem', url: candidato.url };
        }
    }

    return null;
}

export default {
    name: 'pinterest',
    description: 'Busca uma imagem, gif ou vídeo aleatório no Pinterest (sem conteúdo +18)',
    category: 'downloads',
    aliases: ['pin', 'pinimg', 'pinterest-img'],
    async execute({ q, columbina, from, info, reply, reagir }) {
        const temaDigitado = (q || '').trim();

        if (temaDigitado && contemPalavraProibida(temaDigitado)) {
            await reagir('🚫');
            return reply('🚫 Não busco esse tipo de conteúdo. Tenta outro tema.');
        }

        const tema = temaDigitado || TEMAS_ALEATORIOS[Math.floor(Math.random() * TEMAS_ALEATORIOS.length)];

        await reagir('🔎');

        let resultados;
        try {
            resultados = await buscarPinterest(tema);
        } catch (err) {
            await reagir('❌');
            return reply(`❌ Não consegui buscar no Pinterest agora. Tenta de novo em instantes.\n\n(${err.message})`);
        }

        if (!resultados.length) {
            await reagir('❌');
            return reply(`❌ Não achei nada pra "${tema}". Tenta outro tema.`);
        }

        // filtra os pins removendo qualquer coisa +18 antes de escolher
        const validos = [];
        for (const pin of resultados) {
            const textoPin = `${pin.grid_title || ''} ${pin.description || ''} ${pin.rich_summary?.display_name || ''}`;
            if (contemPalavraProibida(textoPin)) continue;

            const midia = extrairMidia(pin);
            if (midia) validos.push(midia);
        }

        if (!validos.length) {
            await reagir('❌');
            return reply(`❌ Só achei resultados bloqueados pelo filtro +18 pra "${tema}". Tenta outro tema.`);
        }

        const chave = `${from}::${tema.toLowerCase()}`;
        const jaEnviados = pegarHistorico(chave);

        let disponiveis = validos.filter(v => !jaEnviados.has(v.url));

        // se já mandou tudo que tinha pra esse tema, libera de novo pra não travar o comando
        if (disponiveis.length === 0) {
            jaEnviados.clear();
            disponiveis = validos;
        }

        const escolhido = disponiveis[Math.floor(Math.random() * disponiveis.length)];
        jaEnviados.add(escolhido.url);

        try {
            if (escolhido.tipo === 'video') {
                await columbina.sendMessage(from, { video: { url: escolhido.url } }, { quoted: info });
            } else if (escolhido.tipo === 'gif') {
                await columbina.sendMessage(from, { video: { url: escolhido.url }, gifPlayback: true }, { quoted: info });
            } else {
                await columbina.sendMessage(from, { image: { url: escolhido.url } }, { quoted: info });
            }
            await reagir('✅');
        } catch (err) {
            await reagir('❌');
            return reply(`❌ Achei a mídia mas não consegui enviar. Tenta de novo.\n\n(${err.message})`);
        }
    }
};
