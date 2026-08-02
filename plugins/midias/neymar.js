import axios from 'axios';

const LIMITE_POR_LINHA = 12;

function quebrarLinhas(texto, limite) {
    const palavras = texto.trim().split(' ');
    const linhas = [];
    let atual = '';

    for (const palavra of palavras) {
        if ((atual + ' ' + palavra).trim().length <= limite) {
            atual = (atual + ' ' + palavra).trim();
        } else {
            if (atual) linhas.push(atual);
            atual = palavra;
        }
    }
    if (atual) linhas.push(atual);

    return linhas.slice(0, 3);
}

export default {
    name: 'neymar',
    description: 'Gera um edit do Neymar com o texto informado',
    category: 'efeitos',
    aliases: [],
    async execute({ q, columbina, from, info, prefix, reply, reagir }) {
        const texto = (q || '').trim();

        if (!texto) {
            await reagir('❌');
            return reply(`❌ Cadê o texto?\n\nExemplo: ${prefix}neymar Seu Nome`);
        }

        await reagir('⚽');

        const linhas = quebrarLinhas(texto, LIMITE_POR_LINHA);
        const textoCod = encodeURIComponent(linhas.join('\n'));

        const url =
            `https://takeshi-bot-01.sirv.com/20260521_091312.jpg` +
            `?text=${textoCod}` +
            `&text.size=34` +
            `&text.font.family=Playfair%20Display` +
            `&text.font.style=italic` +
            `&text.color=1a1a1a` +
            `&text.background.opacity=0.92` +
            `&text.position.x=-245` +
            `&text.position.y=-920` +
            `&rotate=-3`;

        try {
            const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
            await columbina.sendMessage(from, { image: Buffer.from(data) }, { quoted: info });
            await reagir('✅');
        } catch (err) {
            await reagir('❌');
            reply(`❌ Erro ao gerar o edit.\n\n(${err.message})`);
        }
    }
};
