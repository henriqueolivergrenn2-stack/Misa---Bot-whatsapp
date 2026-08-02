import { calcularRankAtivo } from '../../arquivos/js/atividadeCore.js';

const MEDALHAS = ['🥇', '🥈', '🥉'];

export default {
    name: 'rankativo',
    description: 'Mostra quem mais participou do grupo hoje (mensagens digitadas, figurinhas e comandos)',
    category: 'rpg',
    aliases: ['rankatividade', 'maisativos'],
    async execute({ from, info, columbina, reply }) {
        if (!from?.endsWith('@g.us')) {
            return reply('❌ Esse comando só funciona dentro de grupos!');
        }

        const { data, lista } = calcularRankAtivo(from);

        if (!lista.length) {
            return reply('📭 Ainda não tem nenhuma atividade registrada hoje neste grupo.');
        }

        const top10 = lista.slice(0, 10);
        let texto = `📊 *RANK ATIVO — ${data}*\n\n`;
        top10.forEach((u, i) => {
            const posicao = MEDALHAS[i] || `${i + 1}º`;
            texto += `${posicao} @${u.jid.split('@')[0]} — *${u.total}* pts\n`;
            texto += `   💬 ${u.mensagens} mensagens | 🌀 ${u.figurinhas} figurinhas | 😀 ${u.emojis} emojis\n`;
        });
        texto += `\n🏆 O mais ativo do dia ganha *R$ 1.000* na carteira do RPG automaticamente assim que o dia virar!`;

        return columbina.sendMessage(from, {
            text: texto,
            mentions: top10.map(u => u.jid)
        }, { quoted: info });
    }
};
