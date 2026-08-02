// Resolve um ID (jid real, @lid ou número puro) pro JID de telefone
// verdadeiro, usando os metadados AO VIVO do grupo (groupMembers).
// IMPORTANTE: nunca "chuta" a conversão trocando @lid por @s.whatsapp.net
// às cegas — só aceita se achar o phoneNumber real vindo do WhatsApp,
// senão retorna null (evita salvar premium pra um número que não existe).
function resolverJidReal(bruto, members) {
    if (!bruto) return null;
    if (bruto.endsWith('@s.whatsapp.net')) return bruto;
    if (!Array.isArray(members) || !members.length) return null;

    const alvoNum = bruto.split('@')[0];
    const membro = members.find(m =>
        m.id === bruto ||
        m.lid === bruto ||
        m.id?.split('@')[0] === alvoNum ||
        m.lid?.split('@')[0] === alvoNum
    );

    return membro?.phoneNumber || null;
}

export default {
    name: 'darvip',
    description: 'Dá Premium para um usuário (marque a pessoa, responda a mensagem dela, ou informe o número)',
    category: 'dono',
    aliases: ['addvip', 'addpremium', 'darpremium'],
    async execute({ info, q, from, columbina, reply, reagir, commandManager, inputToJid, getname, prefix, groupMembers }) {
        const ctx = info.message?.extendedTextMessage?.contextInfo;

        // participantAlt já vem certo (jid real) quando o WhatsApp manda LID
        const alvoParticipant = ctx?.participantAlt || ctx?.participant || null;
        const alvoMencionado = ctx?.mentionedJid?.[0] || null;
        const alvoBruto = alvoParticipant || alvoMencionado;

        const numeroDigitado = q?.trim() ? inputToJid(q.trim()) : null;

        let alvo = numeroDigitado || resolverJidReal(alvoBruto, groupMembers);

        if (!alvo) {
            await reagir('❌');
            return reply(
                `❌ Não consegui achar o número real dessa pessoa (só o ID interno dela).\n\n` +
                `Tenta assim:\n` +
                `📌 Marcar ela dentro do grupo: *${prefix}darvip @usuario*\n` +
                `📌 Responder a mensagem dela com: *${prefix}darvip*\n` +
                `📌 Ou informar o número direto: *${prefix}darvip 5511999999999*`
            );
        }

        if (commandManager.isPremium(alvo)) {
            await reagir('🎐');
            return reply('🧧 Esse usuário já é *Premium*!');
        }

        const sucesso = commandManager.addPremium(alvo);
        if (!sucesso) {
            await reagir('❌');
            return reply('❌ Não consegui salvar — o número não ficou num formato válido. Confere e tenta de novo.');
        }

        const nome = (getname && getname(alvo, 'jid')) || null;
        const nomeExibido = nome && nome !== 'usuário' ? nome : alvo.split('@')[0];

        await reagir('🎐');
        await columbina.sendMessage(from, {
            text: `🧧✨ *${nomeExibido}* agora é *Premium*!\n\n👤 @${alvo.split('@')[0]}\n💾 Salvo em: arquivos/json/premium.json`,
            mentions: [alvo]
        }, { quoted: info });
    }
};
