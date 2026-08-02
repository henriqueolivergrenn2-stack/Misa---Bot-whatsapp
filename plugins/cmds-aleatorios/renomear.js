import fs from 'fs';
import { writeExif2 } from '../../arquivos/js/exif2.js';
import { getFileBuffer } from '../../arquivos/js/exports.js';

export default {
    name: 'renomear',
    description: 'Renomeia o pack/autor de uma figurinha já existente',
    category: 'cmds-aleatorios',
    aliases: ['renome', 'rn', 'renamesticker'],
    async execute({ q, columbina, from, info, prefix, reply, reagir, pushname }) {

        const quotedMsg = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const stickerMsg = quotedMsg?.stickerMessage;

        if (!stickerMsg) {
            await reagir('❌');
            return reply(
                `❌ Marque (responda) uma figurinha com o comando!\n\n` +
                `📌 *Como usar:*\n` +
                `Responda uma figurinha com:\n` +
                `${prefix}renomear Nome do Pack\n` +
                `ou\n` +
                `${prefix}renomear Nome do Pack/Nome do Autor`
            );
        }

        const texto = (q || '').trim();
        if (!texto) {
            await reagir('❌');
            return reply(
                `❌ Cadê o nome novo?\n\n` +
                `📌 *Exemplos:*\n` +
                `${prefix}renomear Minha Figurinha\n` +
                `${prefix}renomear Minha Figurinha/${pushname || 'Meu Nome'}`
            );
        }

        const partes = texto.split('/').map(p => p.trim());
        const packname = partes[0].slice(0, 60);
        const author = (partes[1] || pushname || 'WhatsApp').slice(0, 60);

        await reagir('🔄');

        try {
            const buffer = await getFileBuffer(stickerMsg, 'sticker');

            const caminhoSaida = await writeExif2(
                { data: buffer, mimetype: 'image/webp' },
                { packname, author }
            );

            if (!caminhoSaida || !fs.existsSync(caminhoSaida)) {
                throw new Error('Não foi possível gerar a figurinha renomeada.');
            }

            const bufferFinal = fs.readFileSync(caminhoSaida);
            await columbina.sendMessage(from, { sticker: bufferFinal }, { quoted: info });
            fs.unlinkSync(caminhoSaida);

            await reagir('✅');
        } catch (err) {
            await reagir('❌');
            reply(`❌ Erro ao renomear a figurinha.\n\n(${err.message})`);
        }
    }
};
