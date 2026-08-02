import { calcularRankGlobal, formatarMoeda } from '../../arquivos/js/rpgCore.js';

export default {
    name: 'rank',
    description: 'Mostra o ranking global de mais ricos do RPG',
    category: 'rpg',
    aliases: ['ranking', 'rankglobal'],
    async execute({ reply }) {
        const lista = calcularRankGlobal().slice(0, 10);
        if (!lista.length) {
            return reply('📭 Ninguém tem conta no RPG ainda. Seja o primeiro com *.registrar*!');
        }

        const medalhas = ['🥇', '🥈', '🥉'];
        let texto = `🏆 *RANK GLOBAL — TOP ${lista.length}*\n\n`;
        lista.forEach((u, i) => {
            const posicao = medalhas[i] || `${i + 1}º`;
            texto += `${posicao} ${u.nome} — ${formatarMoeda(u.total)}\n`;
        });

        return reply(texto);
    }
};
