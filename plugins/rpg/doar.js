import { getUsuario, getUsuarioPorMencao, atualizarUsuario, formatarMoeda, getOuCriarUsuario} from '../../arquivos/js/rpgCore.js';
import { getPhoneNumberFromId } from '../../arquivos/js/exports.js';

export default {
    name: 'doar',
    description: 'Doa dinheiro da sua carteira para outra pessoa registrada no RPG',
    category: 'rpg',
    aliases: ['transferir', 'pix'],
    async execute({ sender, from, info, args, prefix, reply, reagir, columbina, convertWhatsAppUser, groupMembers, pushname}) {
        const usuario = getOuCriarUsuario(sender, pushname);

        const ctx = info.message?.extendedTextMessage?.contextInfo;
        const alvoParticipant = ctx?.participantAlt || ctx?.participant || null;
        const alvoMencionado = ctx?.mentionedJid?.[0] || null;
        const alvoBruto = alvoParticipant || alvoMencionado;

        if (!alvoBruto) {
            await reagir('❌');
            return reply(
                `❌ Marque quem vai receber a doação!\n\n` +
                `📌 *Como usar:*\n${prefix}doar @pessoa <valor>\n\n` +
                `Ex: ${prefix}doar @pessoa 100`
            );
        }

        // Reúne candidatos de identificação (mesma técnica robusta do .roubar)
        const candidatos = [alvoParticipant, alvoMencionado, ctx?.participant || null, ctx?.participantAlt || null];
        try {
            if (alvoParticipant) candidatos.unshift(getPhoneNumberFromId(alvoParticipant, groupMembers));
            if (alvoMencionado) candidatos.unshift(getPhoneNumberFromId(alvoMencionado, groupMembers));
        } catch (e) {}
        try {
            if (alvoParticipant) candidatos.push(convertWhatsAppUser(alvoParticipant, 'jid'));
            if (alvoMencionado) candidatos.push(convertWhatsAppUser(alvoMencionado, 'jid'));
        } catch (e) {}

        const resultado = getUsuarioPorMencao(candidatos);
        if (!resultado) {
            await reagir('❌');
            return reply('❌ Essa pessoa ainda não tem conta no RPG (ou não consegui identificar quem é — peça pra ela mandar qualquer comando do RPG antes, tipo *.saldo*, e tenta de novo).');
        }

        const alvo = resultado.jid;
        const recebedor = resultado.usuario;

        if (alvo === sender) {
            await reagir('❌');
            return reply('❌ Você não pode doar pra si mesmo! 😅');
        }

        // O valor pode vir em qualquer posição do args (junto com a menção ou não)
        const valorArg = args.find(a => !isNaN(parseInt(a, 10)) && parseInt(a, 10) > 0);
        const valor = parseInt(valorArg, 10);

        if (!valor || isNaN(valor) || valor < 1) {
            await reagir('❌');
            return reply(`❌ Informe um valor válido pra doar!\n\nEx: ${prefix}doar @pessoa 100`);
        }
        if (valor > usuario.carteira) {
            await reagir('❌');
            return reply(`❌ Você não tem esse valor na carteira!\n\n💵 Sua carteira: *${formatarMoeda(usuario.carteira)}*`);
        }

        atualizarUsuario(sender, { carteira: usuario.carteira - valor });
        atualizarUsuario(alvo, { carteira: (recebedor.carteira || 0) + valor });

        await reagir('💸');
        return columbina.sendMessage(from, {
            text: `💸 *DOAÇÃO REALIZADA!*\n\n@${sender.split('@')[0]} doou *${formatarMoeda(valor)}* pra @${alvo.split('@')[0]} 🎁`,
            mentions: [sender, alvo]
        }, { quoted: info });
    }
};
