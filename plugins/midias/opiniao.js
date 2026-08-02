export default {
    name: 'opiniao',
    description: 'Gera uma montagem "muda minha opinião" com o texto informado',
    category: 'efeitos',
    aliases: ['opinião', 'changemymind', 'mudeminhaopniao'],
    async execute({ q, columbina, from, info, prefix, reply, reagir }) {
        const texto = (q || '').trim();

        if (!texto) {
            await reagir('❌');
            return reply(`❌ Cadê o texto?\n\nExemplo: ${prefix}opiniao A vida é bela`);
        }
        if (texto.length > 280) {
            await reagir('❌');
            return reply('❌ O texto é muito longo! Máximo de 280 caracteres.');
        }

        await reagir('🔥');

        try {
            const url = `https://nekobot.xyz/api/imagegen?type=changemymind&text=${encodeURIComponent(texto)}`;
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000) });
            const data = await res.json();

            if (!data.success || !data.message) throw new Error('A API não retornou a imagem.');

            const imgRes = await fetch(data.message, { signal: AbortSignal.timeout(30000) });
            const imageBuffer = Buffer.from(await imgRes.arrayBuffer());

            await columbina.sendMessage(from, { image: imageBuffer }, { quoted: info });
            await reagir('✅');
        } catch (err) {
            await reagir('❌');
            reply(`❌ Erro ao gerar a montagem.\n\n(${err.message})`);
        }
    }
};
