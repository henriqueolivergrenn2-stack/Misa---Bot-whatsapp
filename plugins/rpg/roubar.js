import { getUsuario, getUsuarioPorMencao, atualizarUsuario, formatarMoeda, formatarTempo, randomEntre, carregarDB, getOuCriarUsuario} from '../../arquivos/js/rpgCore.js';
import { getPhoneNumberFromId } from '../../arquivos/js/exports.js';

const COOLDOWN_ROUBO = 20 * 60 * 1000; // 20 min

export default {
    name: 'roubar',
    description: 'Tenta roubar dinheiro da carteira de outro usuário registrado',
    category: 'rpg',
    aliases: ['roubo'],
    async execute({ sender, from, info, columbina, prefix, reply, reagir, convertWhatsAppUser, groupMembers, pushname}) {
        const usuario = getOuCriarUsuario(sender, pushname);

        const agora = Date.now();
        const passou = agora - (usuario.ultimoRoubo || 0);
        if (passou < COOLDOWN_ROUBO) {
            await reagir('⏳');
            return reply(`⏳ Você já tentou roubar recentemente! Volte em *${formatarTempo(COOLDOWN_ROUBO - passou)}*.`);
        }

        const ctx = info.message?.extendedTextMessage?.contextInfo;
        const alvoParticipant = ctx?.participantAlt || ctx?.participant || null;
        const alvoMencionado = ctx?.mentionedJid?.[0] || null;

        // Reúne todos os "candidatos" possíveis de identificação da vítima
        const candidatos = [
            alvoParticipant,
            alvoMencionado,
            ctx?.participant || null,
            ctx?.participantAlt || null
        ];
        try {
            if (alvoParticipant) candidatos.unshift(getPhoneNumberFromId(alvoParticipant, groupMembers));
            if (alvoMencionado) candidatos.unshift(getPhoneNumberFromId(alvoMencionado, groupMembers));
        } catch (e) {}
        try {
            if (alvoParticipant) candidatos.push(convertWhatsAppUser(alvoParticipant, 'jid'));
            if (alvoMencionado) candidatos.push(convertWhatsAppUser(alvoMencionado, 'jid'));
        } catch (e) {}

        const alvoBruto = alvoParticipant || alvoMencionado;
        if (!alvoBruto) {
            await reagir('❌');
            return reply(`❌ Marque quem você quer roubar!\n\nEx: ${prefix}roubar @pessoa`);
        }

        const resultado = getUsuarioPorMencao(candidatos);

        if (!resultado) {
            console.log(`[DEBUG ROUBAR] candidatos=${JSON.stringify(candidatos)} | chavesCadastradas=${JSON.stringify(Object.keys(carregarDB()))}`);
            await reagir('❌');
            return reply('❌ Essa pessoa ainda não tem conta no RPG (ou não consegui identificar quem é — peça pra ela mandar qualquer comando do RPG antes, tipo *.saldo*, e tenta de novo).');
        }

        const alvo = resultado.jid;
        const vitima = resultado.usuario;

        if (alvo === sender) {
            await reagir('❌');
            return reply('❌ Você não pode roubar de si mesmo, gênio.');
        }
        if ((vitima.carteira || 0) < 50) {
            await reagir('❌');
            return reply('❌ Essa pessoa está sem dinheiro suficiente na carteira pra valer o risco.');
        }

        const sucesso = Math.random() < 0.4; // 40% de chance

        if (sucesso) {
            const valorRoubado = Math.min(500, Math.floor(vitima.carteira * (randomEntre(10, 25) / 100)));
            atualizarUsuario(alvo, { carteira: vitima.carteira - valorRoubado });
            atualizarUsuario(sender, {
                carteira: usuario.carteira + valorRoubado,
                ultimoRoubo: agora,
                roubosSucesso: (usuario.roubosSucesso || 0) + 1
            });

            await reagir('🔪');
            return columbina.sendMessage(from, {
                text: `🔪 Roubo bem-sucedido! Você levou *${formatarMoeda(valorRoubado)}* de @${alvo.split('@')[0]}!`,
                mentions: [alvo]
            }, { quoted: info });
        } else {
            const multa = randomEntre(20, 100);
            const multaReal = Math.min(multa, usuario.carteira);
            atualizarUsuario(sender, {
                carteira: usuario.carteira - multaReal,
                ultimoRoubo: agora,
                roubosFalha: (usuario.roubosFalha || 0) + 1
            });
            if (multaReal > 0) {
                atualizarUsuario(alvo, { carteira: (vitima.carteira || 0) + multaReal });
            }

            await reagir('🚨');
            return columbina.sendMessage(from, {
                text: `🚨 Você foi pego tentando roubar @${alvo.split('@')[0]} e pagou uma multa de *${formatarMoeda(multaReal)}*!`,
                mentions: [alvo]
            }, { quoted: info });
        }
    }
};
