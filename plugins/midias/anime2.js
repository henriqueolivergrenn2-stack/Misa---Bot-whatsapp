import axios from 'axios';

export default {
    name: 'anime2',
    description: 'Gera uma logo dark estilizada com o texto informado',
    category: 'efeitos',
    aliases: [],
    async execute({ q, columbina, from, info, prefix, reply, reagir }) {
        const texto = (q || '').trim();

        if (!texto) {
            await reagir('❌');
            return reply(`❌ Cadê o texto?\n\nExemplo: ${prefix}anime2 Takeshi`);
        }
        if (texto.length > 15) {
            await reagir('❌');
            return reply('❌ O texto é muito longo! Máximo de 15 caracteres.');
        }

        await reagir('🌑');

        const textoCod = encodeURIComponent(texto);
        const url =
            `https://takeshi-bot-01.sirv.com/Images/images.jpeg` +
            `?text.0.text=${textoCod}` +
            `&text.0.position.gravity=center` +
            `&text.0.position.x=0%25` +
            `&text.0.position.y=-36%25` +
            `&text.0.size=60` +
            `&text.0.color=b0c4de` +
            `&text.0.opacity=95` +
            `&text.0.font.family=Bangers` +
            `&text.0.outline.color=000000` +
            `&text.0.outline.width=4` +
            `&text.0.outline.blur=0` +
            `&text.0.background.color=000000` +
            `&text.0.background.opacity=30`;

        try {
            const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
            await columbina.sendMessage(from, { image: Buffer.from(data) }, { quoted: info });
            await reagir('✅');
        } catch (err) {
            await reagir('❌');
            reply(`❌ Erro ao gerar a logo.\n\n(${err.message})`);
        }
    }
};
