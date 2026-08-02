export default {
    name: 'fake-chat',
    description: 'Cria uma citação falsa mencionando um usuário',
    category: 'efeitos',
    aliases: ['fakechat', 'fk'],
    async execute({ columbina, from, info, q, prefix, reply, reagir, convertWhatsAppUser }) {

        const partes = q.split('/').map(p => p.trim());

        if (partes.length !== 3) {
            await reagir('❌');
            return reply(`❌ Uso incorreto do comando.\n\nExemplo: ${prefix}fake-chat @usuario / texto citado / mensagem que será enviada`);
        }

        const [mencao, textoCitado, mensagemResposta] = partes;

        if (textoCitado.length < 2) {
            await reagir('❌');
            return reply('❌ O texto citado deve ter pelo menos 2 caracteres.');
        }

        if (mensagemResposta.length < 2) {
            await reagir('❌');
            return reply('❌ A mensagem de resposta deve ter pelo menos 2 caracteres.');
        }

        // Prioriza a menção real do WhatsApp (@numero digitado na mensagem).
        // Se não veio marcação, tenta montar a partir dos dígitos digitados no primeiro campo.
        const ctx = info.message?.extendedTextMessage?.contextInfo;
        let target = ctx?.participant || ctx?.mentionedJid?.[0];

        if (!target) {
            const digitos = mencao.replace(/[^0-9]/g, '');
            target = digitos ? `${digitos}@s.whatsapp.net` : null;
        }

        const mentionedJid = target ? convertWhatsAppUser(target, 'jid') : null;

        if (!mentionedJid) {
            await reagir('❌');
            return reply('❌ Marque um usuário válido (@numero).');
        }

        const fakeQuoted = {
            key: {
                fromMe: false,
                participant: mentionedJid,
                remoteJid: from,
            },
            message: {
                extendedTextMessage: {
                    text: textoCitado,
                    contextInfo: {
                        mentionedJid: [mentionedJid],
                    },
                },
            },
        };

        await columbina.sendMessage(
            from,
            { text: mensagemResposta },
            { quoted: fakeQuoted }
        );

        await reagir('✅');
    },
};
