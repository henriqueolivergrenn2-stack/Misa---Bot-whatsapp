import fs from 'fs';
import path from 'path';
import { PASTA_PERFIS, getUsuario, atualizarUsuario, getOuCriarUsuario} from '../../arquivos/js/rpgCore.js';

function extrairImagem(info) {
    const quotedMsg = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    return quotedMsg?.imageMessage || info.message?.imageMessage || null;
}

export default {
    name: 'fotoperfil',
    description: 'Define ou troca a foto de perfil do seu RPG',
    category: 'rpg',
    aliases: ['setfoto', 'trocarfoto'],
    async execute({ sender, info, prefix, reply, reagir, getFileBuffer, pushname}) {
        const usuario = getOuCriarUsuario(sender, pushname);

        const imagemMsg = extrairImagem(info);
        if (!imagemMsg) {
            await reagir('❌');
            return reply(`❌ Marque ou responda uma foto junto com *${prefix}fotoperfil*!`);
        }

        try {
            const buffer = await getFileBuffer(imagemMsg, 'image');
            if (!fs.existsSync(PASTA_PERFIS)) fs.mkdirSync(PASTA_PERFIS, { recursive: true });
            const numeroLimpo = sender.split('@')[0].replace(/[^0-9]/g, '');
            const caminhoFoto = path.join(PASTA_PERFIS, `${numeroLimpo}.jpg`);
            fs.writeFileSync(caminhoFoto, buffer);

            atualizarUsuario(sender, { foto: caminhoFoto });

            await reagir('✅');
            return reply('✅ Foto de perfil atualizada! Use *.perfil* pra conferir.');
        } catch (err) {
            await reagir('❌');
            return reply(`❌ Não consegui salvar a foto.\n\n(${err.message})`);
        }
    }
};
