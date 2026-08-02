export default {
    name: 'trump',
    description: 'Gera um tweet falso do Trump com o texto informado',
    category: 'efeitos',
    aliases: ['trumptweet'],
    async execute({ q, columbina, from, info, prefix, reply, reagir }) {
        const texto = (q || '').trim();

        if (!texto) {
            await reagir('❌');
            return reply(`❌ Cadê o texto?\n\nExemplo: ${prefix}trump I love Brazil!`);
        }
        if (texto.length > 280) {
            await reagir('❌');
            return reply('❌ O texto é muito longo! Máximo de 280 caracteres.');
        }

        await reagir('🦅');

        try {
            const url = `https://nekobot.xyz/api/imagegen?type=trumptweet&text=${encodeURIComponent(texto)}`;
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000) });
            const data = await res.json();

            if (!data.success || !data.message) throw new Error('A API não retornou a imagem.');

            const imgRes = await fetch(data.message, { signal: AbortSignal.timeout(30000) });
            const imageBuffer = Buffer.from(await imgRes.arrayBuffer());

            await columbina.sendMessage(from, { image: imageBuffer }, { quoted: info });
            await reagir('✅');
        } catch (err) {
            await reagir('❌');
            reply(`❌ Erro ao gerar o tweet.\n\n(${err.message})`);
        }
    }
};
