export default {
    name: 'totag',
    description: 'Responde uma mensagem (texto, foto, vídeo, figurinha, áudio ou documento) e reenvia marcando todos os membros do grupo',
    category: 'admin',
    aliases: ['hidetag', 'marcartudo'],
    async execute({ columbina, from, info, prefix, reply, reagir, isGroup, isAdm, isDono, groupMembers, getFileBuffer, q }) {
        if (!isGroup) return reply('❌ Este comando só pode ser usado em grupos!');
        if (!isAdm && !isDono()) return reply('❌ Apenas administradores podem usar este comando!');

        const ctx = info.message?.extendedTextMessage?.contextInfo;
        const quotedRaw = ctx?.quotedMessage;

        if (!quotedRaw) {
            await reagir('❌');
            return reply(
                `❌ Responda a mensagem que você quer reenviar marcando todo mundo!\n\n` +
                `📌 *Como usar:*\n1️⃣ Responda um texto, foto, vídeo, figurinha, áudio ou documento\n2️⃣ Mande *${prefix}totag*`
            );
        }

        // cobre tanto mensagem "crua" quanto embrulhada em viewOnce
        const conteudo = quotedRaw.viewOnceMessageV2?.message || quotedRaw.viewOnceMessage?.message || quotedRaw;

        const membros = groupMembers.filter(m => !m.admin).map(m => m.id || m.jid || m.lid);
        if (!membros.length) return reply('❌ O grupo só possui administradores!');

        await reagir('📢');

        try {
            if (conteudo.imageMessage) {
                const buffer = await getFileBuffer(conteudo.imageMessage, 'image');
                await columbina.sendMessage(from, {
                    image: buffer,
                    caption: conteudo.imageMessage.caption || q || '',
                    mentions: membros
                }, { quoted: info });

            } else if (conteudo.videoMessage) {
                const buffer = await getFileBuffer(conteudo.videoMessage, 'video');
                await columbina.sendMessage(from, {
                    video: buffer,
                    caption: conteudo.videoMessage.caption || q || '',
                    gifPlayback: !!conteudo.videoMessage.gifPlayback,
                    mentions: membros
                }, { quoted: info });

            } else if (conteudo.stickerMessage) {
                const buffer = await getFileBuffer(conteudo.stickerMessage, 'sticker');
                await columbina.sendMessage(from, {
                    sticker: buffer,
                    mentions: membros
                }, { quoted: info });

            } else if (conteudo.audioMessage) {
                const buffer = await getFileBuffer(conteudo.audioMessage, 'audio');
                await columbina.sendMessage(from, {
                    audio: buffer,
                    mimetype: conteudo.audioMessage.mimetype || 'audio/mpeg',
                    ptt: !!conteudo.audioMessage.ptt,
                    mentions: membros
                }, { quoted: info });

            } else if (conteudo.documentMessage) {
                const buffer = await getFileBuffer(conteudo.documentMessage, 'document');
                await columbina.sendMessage(from, {
                    document: buffer,
                    fileName: conteudo.documentMessage.fileName || 'arquivo',
                    mimetype: conteudo.documentMessage.mimetype || 'application/octet-stream',
                    caption: q || '',
                    mentions: membros
                }, { quoted: info });

            } else {
                const texto = conteudo.conversation || conteudo.extendedTextMessage?.text || q || '';
                if (!texto.trim()) {
                    await reagir('❌');
                    return reply('❌ Não consegui identificar o conteúdo dessa mensagem pra reenviar.');
                }
                await columbina.sendMessage(from, {
                    text: texto,
                    mentions: membros
                }, { quoted: info });
            }

            await reagir('✅');
        } catch (err) {
            await reagir('❌');
            reply(`❌ Não consegui reenviar essa mensagem.\n\n(${err.message})`);
        }
    }
};
