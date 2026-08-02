import axios from 'axios';

export default {
    name: 'anime',
    description: 'Gera uma logo estilizada com o texto informado',
    category: 'efeitos',
    aliases: [],
    async execute({ q, columbina, from, info, prefix, reply, reagir }) {
        const texto = (q || '').trim();

        if (!texto) {
            await reagir('❌');
            return reply(`❌ Cadê o texto?\n\nExemplo: ${prefix}anime Takeshi`);
        }
        if (texto.length > 15) {
            await reagir('❌');
            return reply('❌ O texto é muito longo! Máximo de 15 caracteres.');
        }

        await reagir('🛸');

        const textoCod = encodeURIComponent(texto);
        const url = `https://lollityp.sirv.com/venom_apis7.jpg?text.0.text=${textoCod}&text.0.position.gravity=north&text.0.position.x=1%25&text.0.position.y=58%25&text.0.size=69&text.0.color=00ffea&text.0.opacity=37&text.0.font.family=Bangers&text.0.background.opacity=77&text.0.outline.color=ffffff&text.0.outline.width=2&text.0.outline.blur=20`;

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
