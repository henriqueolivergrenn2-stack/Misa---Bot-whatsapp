import { MODOS, getModoMute, setModoMute } from '../../arquivos/js/antiCore.js';

export default {
    name: 'mute',
    description: 'Silencia um usuário no grupo (apaga mensagens dele, com ou sem banimento)',
    category: 'admin',
    aliases: ['mutar', 'desmutar', 'unmute'],
    async execute({ from, args, info, prefix, reply, reagir, convertWhatsAppUser }) {
        const ctx = info.message?.extendedTextMessage?.contextInfo;
        const alvoBruto = ctx?.participant || ctx?.mentionedJid?.[0];
        const alvo = alvoBruto ? convertWhatsAppUser(alvoBruto, 'jid') : null;

        if (!alvo) {
            await reagir('❌');
            return reply(
                `❌ Marque ou responda a pessoa que quer mutar!\n\n` +
                `📌 *Como usar:*\n` +
                `${prefix}mute @pessoa 1 — silencia (apaga mensagens)\n` +
                `${prefix}mute @pessoa 2 — remove o silêncio\n` +
                `${prefix}mute @pessoa 3 — remove o silêncio com banimento\n` +
                `${prefix}mute @pessoa 4 — silencia com banimento (se mandar msg, é removido)`
            );
        }

        const opcao = (args[1] || args[0] || '').trim();
        const modoAtual = getModoMute(from, alvo);

        if (!['1', '2', '3', '4'].includes(opcao)) {
            return reply(
                `🔇 *MUTE*\n\n` +
                `1️⃣ ${prefix}mute @pessoa 1 — silencia (apaga mensagens)\n` +
                `2️⃣ ${prefix}mute @pessoa 2 — remove o silêncio\n` +
                `3️⃣ ${prefix}mute @pessoa 3 — remove o silêncio com banimento\n` +
                `4️⃣ ${prefix}mute @pessoa 4 — silencia com banimento\n\n` +
                `📌 Status atual de @${alvo.split('@')[0]}: *${modoAtual === MODOS.OFF ? 'não mutado' : modoAtual === MODOS.APAGAR ? 'mutado (apaga)' : 'mutado (apaga + bane)'}*`
            );
        }

        if (opcao === '1') {
            setModoMute(from, alvo, MODOS.APAGAR);
            await reagir('🔇');
            return reply(`🔇 @${alvo.split('@')[0]} foi *mutado* — mensagens dele(a) serão apagadas.`);
        }
        if (opcao === '2') {
            if (modoAtual !== MODOS.APAGAR) return reply(`🔇 @${alvo.split('@')[0]} já não está com esse tipo de mute.`);
            setModoMute(from, alvo, MODOS.OFF);
            await reagir('🔊');
            return reply(`🔊 @${alvo.split('@')[0]} foi *desmutado*.`);
        }
        if (opcao === '3') {
            if (modoAtual !== MODOS.BANIR) return reply(`🔇 @${alvo.split('@')[0]} já não está com esse tipo de mute.`);
            setModoMute(from, alvo, MODOS.OFF);
            await reagir('🔊');
            return reply(`🔊 Mute com banimento de @${alvo.split('@')[0]} foi *removido*.`);
        }
        if (opcao === '4') {
            setModoMute(from, alvo, MODOS.BANIR);
            await reagir('🔨');
            return reply(`🔨 @${alvo.split('@')[0]} foi *mutado com banimento* — se mandar mensagem, será removido do grupo.`);
        }
    }
};
