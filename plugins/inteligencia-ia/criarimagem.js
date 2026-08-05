// Geração de imagem por IA usando a Pollinations (image.pollinations.ai),
// que é gratuita, sem chave de API e sem cadastro pra uso básico.
// Fonte: https://github.com/pollinations/pollinations

const COOLDOWN_MS = 15 * 1000; // a Pollinations limita ~1 requisição a cada 15s pra quem não tem conta
const ultimoUso = new Map(); // sender -> timestamp

export default {
    name: 'iaimagem',
    description: 'Gera uma imagem por IA a partir de uma descrição (grátis, sem chave de API)',
    category: 'inteligencia-ia',
    aliases: ['iaimagem'],
    async execute({ q, sender, columbina, from, info, prefix, reply, reagir }) {
        const prompt = (q || '').trim();

        if (!prompt) {
            await reagir('❌');
            return reply(
                `❌ Descreva o que você quer gerar!\n\n` +
                `📌 Exemplo: *${prefix}criarimagem um gato astronauta pintando um quadro, estilo aquarela*`
            );
        }
        if (prompt.length > 500) {
            await reagir('❌');
            return reply('❌ Descrição muito longa! Máximo de 500 caracteres.');
        }

        const agora = Date.now();
        const faltaEspera = COOLDOWN_MS - (agora - (ultimoUso.get(sender) || 0));
        if (faltaEspera > 0) {
            await reagir('⏳');
            return reply(`⏳ Calma! Espera mais *${Math.ceil(faltaEspera / 1000)}s* pra gerar outra imagem (a API gratuita tem limite de uso).`);
        }
        ultimoUso.set(sender, agora);

        await reagir('🎨');

        try {
            const seed = Math.floor(Math.random() * 1_000_000); // evita pegar imagem em cache de um prompt repetido
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
                `?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;

            const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                signal: AbortSignal.timeout(90000) // geração de imagem pode demorar
            });

            if (!res.ok) throw new Error(`A API respondeu com erro (status ${res.status})`);

            const contentType = res.headers.get('content-type') || '';
            if (!contentType.startsWith('image/')) throw new Error('A API não retornou uma imagem válida.');

            const buffer = Buffer.from(await res.arrayBuffer());

            await columbina.sendMessage(from, {
                image: buffer,
                caption: `*Ta na mão patrão*`
            }, { quoted: info });

            await reagir('✅');
        } catch (err) {
            ultimoUso.delete(sender); // não conta cooldown se deu erro
            await reagir('❌');
            reply(`❌ Não consegui gerar a imagem.\n\n(${err.message})\n\nTenta de novo em alguns segundos.`);
        }
    }
};
